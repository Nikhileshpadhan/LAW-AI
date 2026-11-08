import sys
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse

from app.config import settings
from app.database import init_db
from app.services.vector_engine import VectorEngine
from app.api.routes import router as api_router
from app.api.auth_routes import router as auth_router
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [%(levelname)s] - %(name)s - %(message)s"
)
logger = logging.getLogger("sc_precedent_rag")

# On Windows, harden asyncio against WinError 64 (ERROR_NETNAME_DELETED)
# which occurs when a client disconnects during IOCP AcceptEx or read.
if sys.platform == "win32":
    try:
        import asyncio.proactor_events as _pe
        import asyncio.windows_events as _we
        from asyncio import trsock as _trsock, exceptions as _exceptions

        _orig_accept = _we.IocpProactor.accept

        def _patched_accept(self, listener):
            self._register_with_iocp(listener)
            conn = self._get_accept_socket(listener.family)
            ov = _we._overlapped.Overlapped(_we.NULL)
            ov.AcceptEx(listener.fileno(), conn.fileno())

            def finish_accept(trans, key, ov):
                ov.getresult()
                buf = _we.struct.pack('@P', listener.fileno())
                conn.setsockopt(_we.socket.SOL_SOCKET, _we._overlapped.SO_UPDATE_ACCEPT_CONTEXT, buf)
                conn.settimeout(listener.gettimeout())
                return conn, conn.getpeername()

            async def accept_coro(future, conn):
                try:
                    await future
                except (_exceptions.CancelledError, OSError):
                    try:
                        conn.close()
                    except Exception:
                        pass
                    if not future.cancelled():
                        return
                    raise

            future = self._register(ov, listener, finish_accept)
            coro = accept_coro(future, conn)
            _we.tasks.ensure_future(coro, loop=self._loop)
            return future

        _we.IocpProactor.accept = _patched_accept

        _orig_start_serving = _pe.BaseProactorEventLoop._start_serving

        def _patched_start_serving(self, protocol_factory, sock,
                                  sslcontext=None, server=None, backlog=100,
                                  ssl_handshake_timeout=None,
                                  ssl_shutdown_timeout=None):
            def loop(f=None):
                try:
                    if f is not None:
                        try:
                            conn, addr = f.result()
                        except OSError as exc:
                            if getattr(exc, 'winerror', None) in (64, 121, 995, 10054):
                                if not self.is_closed() and sock.fileno() != -1:
                                    f2 = self._proactor.accept(sock)
                                    self._accept_futures[sock.fileno()] = f2
                                    f2.add_done_callback(loop)
                                return
                            raise
                        protocol = protocol_factory()
                        if sslcontext is not None:
                            self._make_ssl_transport(
                                conn, protocol, sslcontext, server_side=True,
                                extra={'peername': addr}, server=server,
                                ssl_handshake_timeout=ssl_handshake_timeout,
                                ssl_shutdown_timeout=ssl_shutdown_timeout)
                        else:
                            self._make_socket_transport(
                                conn, protocol,
                                extra={'peername': addr}, server=server)
                    if self.is_closed():
                        return
                    f = self._proactor.accept(sock)
                except OSError as exc:
                    if sock.fileno() != -1:
                        self.call_exception_handler({
                            'message': 'Accept failed on a socket',
                            'exception': exc,
                            'socket': _trsock.TransportSocket(sock),
                        })
                        sock.close()
                except _exceptions.CancelledError:
                    sock.close()
                else:
                    self._accept_futures[sock.fileno()] = f
                    f.add_done_callback(loop)

            self.call_soon(loop)

        _pe.BaseProactorEventLoop._start_serving = _patched_start_serving
    except Exception as _patch_err:
        pass

def _setup_windows_event_loop_handler():
    """Silences harmless WinError 64/121/995/10054 on Windows Proactor socket drops."""
    if sys.platform != "win32":
        return
    try:
        loop = asyncio.get_running_loop()
        orig_handler = loop.get_exception_handler()

        def custom_handler(loop, context):
            exception = context.get("exception")
            if isinstance(exception, OSError) and getattr(exception, "winerror", None) in (64, 121, 995, 10054):
                return
            if orig_handler:
                orig_handler(loop, context)
            else:
                loop.default_exception_handler(context)

        loop.set_exception_handler(custom_handler)
    except Exception:
        pass

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    FastAPI Lifespan Manager:
    Pre-loads the local Legal-BERT model and ChromaDB collection once at server startup.
    This guarantees millisecond-level vector queries without cold-start overhead.
    """
    _setup_windows_event_loop_handler()
    logger.info("Initializing Database schema (PostgreSQL / SQLite)...")
    await init_db()

    logger.info("Initializing Supreme Court Precedent Vector Engine (Legal-BERT + ChromaDB)...")
    engine = VectorEngine.get_instance()
    try:
        engine.initialize()
        count = engine.get_collection_count()
        logger.info(f"Vector Engine successfully initialized with {count:,} Supreme Court vectors.")
    except Exception as e:
        logger.error(f"Failed to initialize Vector Engine during startup: {e}")
        raise e

    yield

    logger.info("Shutting down Supreme Court Precedent Engine...")

app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description=(
        "Supreme Court Precedent Analyzer & Legal Argument RAG Engine.\n\n"
        "Powered by a local 5-year Supreme Court repository (76,800+ vectors embedded via Legal-BERT) "
        "and Groq LLMs (openai/gpt-oss-120b / openai/gpt-oss-20b) for strict precedent-grounded argument synthesis."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Enable CORS for frontend integrations (supports localhost, local IPs, and all Vercel domains)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.parsed_allowed_origins,
    allow_origin_regex=r"^(https?://(localhost|127\.0\.0\.1|\[::1\])(:\d+)?|https://.*\.vercel\.app)$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Route alias middleware: seamlessly rewrite direct requests like /auth/register -> /api/v1/auth/register
# This ensures total compatibility whether the client sends with or without /api/v1 prefix
@app.middleware("http")
async def rewrite_api_v1_prefix(request: Request, call_next):
    path = request.url.path
    if (
        not path.startswith("/api/v1")
        and not path.startswith("/docs")
        and not path.startswith("/redoc")
        and not path.startswith("/openapi.json")
        and path not in ("/", "")
    ):
        request.scope["path"] = f"/api/v1{path}"
    return await call_next(request)

# Include API & Auth Routers
app.include_router(api_router)
app.include_router(auth_router)

@app.get("/", include_in_schema=False)
async def root():
    """Redirect root path to interactive Swagger documentation."""
    return RedirectResponse(url="/docs")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
