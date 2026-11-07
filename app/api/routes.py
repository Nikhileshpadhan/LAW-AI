import re
import time
import asyncio
import logging
from typing import Optional, List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Request
from fastapi.responses import Response, HTMLResponse

from app.config import settings
from app.schemas import (
    RepresentingSide,
    CaseAnalysisResponse,
    DirectSearchResponse,
    PrecedentSearchItem,
    HealthResponse,
    ChatRequest,
    ChatResponse,
    SupportingPrecedent,
    PrecedentCitation,
    ReportGenerationRequest,
    LegalReportResponse
)
from app.services.document_parser import DocumentParserService
from app.services.vector_engine import VectorEngine
from app.services.groq_service import GroqService
from app.services.query_generator import QueryGeneratorService
from app.services.argument_synthesizer import ArgumentSynthesizerService
from app.services.chat_session import LegalChatSession
from app.services.report_generator import ReportGeneratorService
from app.api.auth_routes import get_current_verified_user, User

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1", tags=["Legal Analysis & Precedents"])

def get_vector_engine() -> VectorEngine:
    return VectorEngine.get_instance()

def get_groq_service() -> GroqService:
    return GroqService()

@router.get("/health", response_model=HealthResponse)
async def health_check(
    engine: VectorEngine = Depends(get_vector_engine),
    groq: GroqService = Depends(get_groq_service)
):
    """
    Health check returning database, embedding model, and Groq LLM status.
    """
    count = engine.get_collection_count()
    return HealthResponse(
        status="healthy" if count > 0 else "degraded",
        vector_backend=engine.backend,
        chroma_db_status="connected" if count > 0 else "empty/unreachable",
        total_vectors=count,
        legal_bert_status="loaded" if (engine.model is not None or engine.backend == "qdrant") else "not_loaded",
        groq_configured=groq.is_configured(),
        groq_model=settings.GROQ_MODEL
    )

@router.post(
    "/analyze-case",
    response_model=CaseAnalysisResponse,
    summary="Lawyer-Friendly Precedent Analyzer & Legal Argument Generator"
)
async def analyze_case(
    request: Request,
    case_description: Optional[str] = Form(
        None, 
        description="Plain-text facts, client situation, or legal questions"
    ),
    case_file: Optional[UploadFile] = File(
        None, 
        description="Case document (PDF or TXT) such as Petition, FIR, High Court Order, or Plaint"
    ),
    representing_side: RepresentingSide = Form(
        RepresentingSide.PETITIONER,
        description="Strategic stance: Petitioner, Respondent, or Neutral Evaluation"
    ),
    engine: VectorEngine = Depends(get_vector_engine),
    groq: GroqService = Depends(get_groq_service),
    current_user: User = Depends(get_current_verified_user)
):
    """
    Unified Lawyer-Friendly Endpoint:
    Accepts plain text, PDF/TXT upload, extracts facts, retrieves matching
    Supreme Court 5-year precedents, and synthesizes court-ready legal arguments.
    Offloaded to thread pool to prevent blocking the event loop.
    """
    start_time = time.time()

    # Step 0: Ingest & Parse Input (Async chunk reading & validation)
    extracted_text = await DocumentParserService.extract_text(
        case_description=case_description,
        case_file=case_file
    )

    substantive_text = re.sub(r'===.*?===\n?', '', extracted_text).strip()
    if len(substantive_text) < 20:
        raise HTTPException(
            status_code=400,
            detail="The provided case details are too brief. Please provide sufficient facts for legal analysis."
        )

    # Step 1: Fact Extraction & Judicial Query Formulation (Groq) via thread
    query_generator = QueryGeneratorService(groq)
    factual_context = await asyncio.to_thread(
        query_generator.generate_queries_and_facts,
        extracted_text
    )
    search_queries = factual_context.get("search_queries", [])
    if not search_queries:
        search_queries = [extracted_text[:250]]

    # Step 2: Vector Retrieval via thread
    retrieved_precedents = await asyncio.to_thread(
        engine.retrieve_top_precedents,
        queries=search_queries,
        top_k=settings.TOP_K_PER_QUERY,
        max_total=settings.MAX_TOTAL_PRECEDENTS
    )

    if not retrieved_precedents:
        retrieved_precedents = await asyncio.to_thread(
            engine.retrieve_top_precedents,
            queries=[search_queries[0]],
            top_k=5,
            max_total=5
        )

    # Step 3: Precedent-Grounded Argument Synthesis via thread
    synthesizer = ArgumentSynthesizerService(groq)
    response = await asyncio.to_thread(
        synthesizer.synthesize_arguments,
        factual_context=factual_context,
        retrieved_precedents=retrieved_precedents,
        representing_side=representing_side.value,
        generated_queries=search_queries,
        start_time=start_time
    )

    return response

@router.post(
    "/search-precedents",
    response_model=DirectSearchResponse,
    summary="Direct Supreme Court Precedent Semantic Search"
)
async def direct_precedent_search(
    request: Request,
    query: str = Form(..., min_length=2, max_length=1000, description="Legal topic, statutory provision, or legal question"),
    top_k: int = Form(5, description="Number of results to retrieve (1-25)"),
    engine: VectorEngine = Depends(get_vector_engine),
    current_user: User = Depends(get_current_verified_user)
):
    """
    Direct semantic retrieval endpoint for ad-hoc precedent search.
    Offloaded to thread pool.
    """
    k = max(1, min(25, top_k))
    retrieved = await asyncio.to_thread(
        engine.retrieve_top_precedents,
        queries=[query],
        top_k=k,
        max_total=k
    )
    
    items = []
    for r in retrieved:
        doc_text = r.get("document_text", "")
        items.append(
            PrecedentSearchItem(
                chunk_id=str(r["chunk_id"]),
                case_title=r["case_name"],
                year=str(r["year"]),
                file_name=r.get("file_name"),
                bench=r.get("bench"),
                similarity_score=r["similarity_score"],
                text_snippet=doc_text[:350].replace("\n", " ").strip() + "...",
                full_text=doc_text
            )
        )

    return DirectSearchResponse(
        query=query,
        total_results=len(items),
        results=items
    )

@router.post(
    "/chat",
    response_model=ChatResponse,
    summary="Interactive Senior Advocate Chat Consultation"
)
async def chat_consultation(
    request: Request,
    payload: ChatRequest,
    engine: VectorEngine = Depends(get_vector_engine),
    groq: GroqService = Depends(get_groq_service),
    current_user: User = Depends(get_current_verified_user)
):
    """
    Conversational Legal Assistant endpoint:
    Processes counsel's follow-up questions, maintains case context, performs targeted
    precedent search on 76,802 SC judgments, and synthesizes persuasive advice.
    """
    if not payload.message or not payload.message.strip():
        raise HTTPException(
            status_code=400,
            detail="Message cannot be empty or whitespace only. Please enter a legal question or instruction."
        )

    start_time = time.time()
    session = LegalChatSession(
        representing_side=payload.representing_side.value,
        case_context=payload.case_context or ""
    )

    if payload.conversation_history:
        session.conversation_history = [
            {"role": msg.role, "content": msg.content}
            for msg in payload.conversation_history
        ]

    # Process message in thread pool to prevent blocking event loop
    result = await asyncio.to_thread(session.process_message, payload.message)
    total_time = round(time.time() - start_time, 2)

    supporting = []
    for prec in result.get("retrieved_precedents", []):
        quote = prec["document_text"][:300].replace("\n", " ").strip()
        supporting.append(
            SupportingPrecedent(
                case_name=prec["case_name"],
                year=str(prec["year"]),
                bench=prec.get("bench") or "Supreme Court of India",
                file_name=prec.get("file_name"),
                verbatim_quote=quote,
                similarity_score=prec["similarity_score"],
                chunk_id=str(prec.get("chunk_id")),
                document_text=prec.get("document_text")
            )
        )

    structured_citations = []
    for c in result.get("citations", []):
        structured_citations.append(
            PrecedentCitation(
                case_name=c["case_name"],
                year=str(c["year"]),
                bench=c.get("bench"),
                file_name=c.get("file_name"),
                verbatim_quote=c["verbatim_quote"],
                similarity_score=c["similarity_score"],
                citation_tag=c["citation_tag"],
                chunk_id=str(c.get("chunk_id")),
                document_text=c.get("document_text")
            )
        )

    return ChatResponse(
        reply=result["reply"],
        representing_side=payload.representing_side,
        generated_queries=result.get("queries", []),
        citations=structured_citations,
        retrieved_precedents=supporting,
        processing_time_seconds=total_time
    )

@router.post(
    "/generate-report",
    response_model=LegalReportResponse,
    summary="Generate Professional Supreme Court Precedent Strategy Report"
)
async def generate_legal_report(
    request: Request,
    payload: ReportGenerationRequest,
    current_user: User = Depends(get_current_verified_user)
):
    """
    Converts a case analysis or chat consultation into a court-ready
    Supreme Court Precedent Analysis & Case Strategy Report.
    Offloaded to thread pool.
    """
    report_service = ReportGeneratorService()
    report = await asyncio.to_thread(report_service.generate_report, payload)
    return report

@router.post(
    "/export-report-pdf",
    summary="Download Court-Ready Supreme Court Strategy Report as PDF"
)
async def export_report_pdf(
    request: Request,
    payload: ReportGenerationRequest,
    current_user: User = Depends(get_current_verified_user)
):
    """
    Generates and returns a downloadable high-resolution PDF legal report.
    Offloaded to thread pool.
    """
    report_service = ReportGeneratorService()
    report = await asyncio.to_thread(report_service.generate_report, payload)
    pdf_bytes = await asyncio.to_thread(report_service.generate_pdf_bytes, report)

    filename = f"{report.report_id}.pdf"
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )

@router.post(
    "/export-report-html",
    summary="View Printable Court-Ready Supreme Court Strategy Report in HTML"
)
async def export_report_html(
    request: Request,
    payload: ReportGenerationRequest,
    current_user: User = Depends(get_current_verified_user)
):
    """
    Renders and returns a print-styled HTML report.
    Offloaded to thread pool.
    """
    report_service = ReportGeneratorService()
    report = await asyncio.to_thread(report_service.generate_report, payload)
    return HTMLResponse(content=report.html_content)
