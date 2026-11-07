import logging
from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base

from app.config import settings

logger = logging.getLogger(__name__)

Base = declarative_base()

def get_database_url() -> str:
    url = settings.DATABASE_URL.strip()
    if url.startswith("postgres://"):
        url = url.replace("postgres://", "postgresql+asyncpg://", 1)
    elif url.startswith("postgresql://") and "+asyncpg" not in url and "+psycopg" not in url:
        url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
    elif url.startswith("sqlite:///"):
        url = url.replace("sqlite:///", "sqlite+aiosqlite:///", 1)

    # Sanitize URL for asyncpg: remove channel_binding (which causes Windows timeout) and normalize ssl
    if "asyncpg" in url:
        url = url.replace("&channel_binding=require", "").replace("channel_binding=require&", "").replace("?channel_binding=require", "")
        url = url.replace("sslmode=require", "ssl=require")

    return url

db_url = get_database_url()

# Create async engine with robust pool settings
engine_kwargs = {"echo": False}
if "sqlite" in db_url:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20
    if "asyncpg" in db_url:
        # Essential for Neon PgBouncer transaction pooling mode
        engine_kwargs["connect_args"] = {
            "statement_cache_size": 0,
            "prepared_statement_cache_size": 0
        }

async_engine = create_async_engine(db_url, **engine_kwargs)
AsyncSessionLocal = async_sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False
)

async def init_db():
    """Initializes database tables on application startup."""
    try:
        # Import models so Base registers them
        from app import models # noqa: F401
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info(f"Database schema initialized successfully using: {db_url.split('@')[-1] if '@' in db_url else db_url}")
    except Exception as e:
        logger.error(f"Error initializing database schema: {e}")
        raise e

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI Dependency for database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
