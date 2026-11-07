import re
import time
import logging
from typing import Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends
from fastapi.responses import Response, HTMLResponse

from app.config import settings
from app.schemas import (
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
        chroma_db_status="connected" if count > 0 else "empty/unreachable",
        total_vectors=count,
        legal_bert_status="loaded" if engine.model is not None else "not_loaded",
        groq_configured=groq.is_configured(),
        groq_model=settings.GROQ_MODEL
    )

@router.post(
    "/analyze-case",
    response_model=CaseAnalysisResponse,
    summary="Lawyer-Friendly Precedent Analyzer & Legal Argument Generator"
)
async def analyze_case(
    case_description: Optional[str] = Form(
        None, 
        description="Plain-text facts, client situation, or legal questions"
    ),
    case_file: Optional[UploadFile] = File(
        None, 
        description="Case document (PDF or TXT) such as Petition, FIR, High Court Order, or Plaint"
    ),
    representing_side: str = Form(
        "Petitioner / Appellant",
        description="Strategic stance: 'Petitioner / Appellant', 'Respondent / Defense', or 'Neutral Evaluation'"
    ),
    engine: VectorEngine = Depends(get_vector_engine),
    groq: GroqService = Depends(get_groq_service)
):
    """
    Unified Lawyer-Friendly Endpoint:
    Accepts plain text, PDF/TXT upload, or both, extracts facts, retrieves matching
    Supreme Court 5-year precedents via local Legal-BERT + ChromaDB, and synthesizes
    court-ready legal arguments grounded strictly in authentic precedent text.
    """
    start_time = time.time()

    # Step 0: Ingest & Parse Input (Text / Document)
    extracted_text = await DocumentParserService.extract_text(
        case_description=case_description,
        case_file=case_file
    )

    # Check substantive text length excluding metadata banners
    substantive_text = re.sub(r'===.*?===\n?', '', extracted_text).strip()
    if len(substantive_text) < 20:
        raise HTTPException(
            status_code=400,
            detail="The provided case details are too brief. Please provide sufficient facts for legal analysis."
        )

    # Step 1: Fact Extraction & Judicial Query Formulation (Groq)
    query_generator = QueryGeneratorService(groq)
    factual_context = query_generator.generate_queries_and_facts(extracted_text)
    search_queries = factual_context.get("search_queries", [])

    if not search_queries:
        search_queries = [extracted_text[:250]]

    # Step 2: Local Legal-BERT + ChromaDB Vector Retrieval
    retrieved_precedents = engine.retrieve_top_precedents(
        queries=search_queries,
        top_k=settings.TOP_K_PER_QUERY,
        max_total=settings.MAX_TOTAL_PRECEDENTS
    )

    if not retrieved_precedents:
        # Fallback to broader query if threshold was strict
        retrieved_precedents = engine.retrieve_top_precedents(
            queries=[search_queries[0]],
            top_k=5,
            max_total=5
        )

    # Step 3: Precedent-Grounded Argument Synthesis (Groq Senior Advocate Persona)
    synthesizer = ArgumentSynthesizerService(groq)
    response = synthesizer.synthesize_arguments(
        factual_context=factual_context,
        retrieved_precedents=retrieved_precedents,
        representing_side=representing_side,
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
    query: str = Form(..., description="Legal topic, statutory provision, or legal question"),
    top_k: int = Form(5, description="Number of results to retrieve (1-25)"),
    engine: VectorEngine = Depends(get_vector_engine)
):
    """
    Direct semantic retrieval endpoint for testing and ad-hoc searches
    without LLM brief synthesis.
    """
    k = max(1, min(25, top_k))
    retrieved = engine.retrieve_top_precedents(queries=[query], top_k=k, max_total=k)
    
    items = []
    for r in retrieved:
        items.append(
            PrecedentSearchItem(
                chunk_id=r["chunk_id"],
                case_title=r["case_name"],
                year=r["year"],
                file_name=r.get("file_name"),
                bench=r.get("bench"),
                similarity_score=r["similarity_score"],
                text_snippet=r["document_text"][:350].replace("\n", " ").strip() + "...",
                full_text=r["document_text"]
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
    payload: ChatRequest,
    engine: VectorEngine = Depends(get_vector_engine),
    groq: GroqService = Depends(get_groq_service)
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
        representing_side=payload.representing_side,
        case_context=payload.case_context or ""
    )

    # Rehydrate conversation history
    if payload.conversation_history:
        session.conversation_history = [
            {"role": msg.role, "content": msg.content}
            for msg in payload.conversation_history
        ]

    result = session.process_message(payload.message)
    total_time = round(time.time() - start_time, 2)

    supporting = []
    for prec in result.get("retrieved_precedents", []):
        quote = prec["document_text"][:300].replace("\n", " ").strip()
        supporting.append(
            SupportingPrecedent(
                case_name=prec["case_name"],
                year=prec["year"],
                bench=prec.get("bench") or "Supreme Court of India",
                file_name=prec.get("file_name"),
                verbatim_quote=quote,
                similarity_score=prec["similarity_score"],
                chunk_id=prec.get("chunk_id")
            )
        )

    structured_citations = []
    for c in result.get("citations", []):
        structured_citations.append(
            PrecedentCitation(
                case_name=c["case_name"],
                year=c["year"],
                bench=c.get("bench"),
                file_name=c.get("file_name"),
                verbatim_quote=c["verbatim_quote"],
                similarity_score=c["similarity_score"],
                citation_tag=c["citation_tag"],
                chunk_id=c.get("chunk_id")
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
    payload: ReportGenerationRequest
):
    """
    Converts a case analysis or chat consultation into a court-ready
    Supreme Court Precedent Analysis & Case Strategy Report.
    Returns structured JSON, Markdown, and formatted HTML.
    """
    report_service = ReportGeneratorService()
    report = report_service.generate_report(payload)
    return report

@router.post(
    "/export-report-pdf",
    summary="Download Court-Ready Supreme Court Strategy Report as PDF"
)
async def export_report_pdf(
    payload: ReportGenerationRequest
):
    """
    Generates and returns a downloadable high-resolution PDF legal report.
    """
    report_service = ReportGeneratorService()
    report = report_service.generate_report(payload)
    pdf_bytes = report_service.generate_pdf_bytes(report)

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
    payload: ReportGenerationRequest
):
    """
    Renders and returns a print-styled HTML report.
    """
    report_service = ReportGeneratorService()
    report = report_service.generate_report(payload)
    return HTMLResponse(content=report.html_content)
