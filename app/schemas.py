from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field

class RepresentingSide(str, Enum):
    PETITIONER = "Petitioner / Appellant"
    RESPONDENT = "Respondent / Defense"
    NEUTRAL = "Neutral Evaluation"

class SupportingPrecedent(BaseModel):
    case_name: str = Field(..., description="Official title / name of the Supreme Court precedent")
    year: str = Field(..., description="Judgment year or full decision date")
    bench: Optional[str] = Field(None, description="Bench quorum or presiding judges")
    file_name: Optional[str] = Field(None, description="Source PDF filename in 5-year repository")
    verbatim_quote: str = Field(..., description="Direct verbatim extract from the judgment chunk")
    similarity_score: float = Field(..., description="Vector semantic similarity score (0.0 to 1.0)")
    chunk_id: Optional[str] = Field(None, description="ChromaDB unique chunk identifier")

class LegalArgument(BaseModel):
    argument_number: int = Field(..., description="Sequential argument order")
    title: str = Field(..., description="High-impact judicial argument headline")
    detailed_reasoning: str = Field(
        ..., 
        description="Comprehensive ratio decidendi application connecting facts to precedent"
    )
    supporting_precedents: List[SupportingPrecedent] = Field(
        default_factory=list,
        description="Supreme Court precedents substantiating this specific argument"
    )
    anticipated_counter_argument: str = Field(
        ..., 
        description="Anticipated objection or distinguishing argument from opposing counsel"
    )
    rebuttal: str = Field(
        ..., 
        description="Strategic rebuttal to counter the opposing counsel's distinction"
    )

class ExecutiveBrief(BaseModel):
    summary_of_facts: str = Field(..., description="Concise legal summary of the factual matrix")
    key_legal_issues: List[str] = Field(
        default_factory=list, 
        description="Substantive and procedural legal questions formulated"
    )
    applicable_statutes: List[str] = Field(
        default_factory=list, 
        description="Statutory provisions and constitutional articles invoked"
    )

class CaseAnalysisResponse(BaseModel):
    representing_side: str = Field(..., description="Side for which arguments are framed")
    executive_brief: ExecutiveBrief = Field(..., description="Executive factual & legal brief")
    arguments: List[LegalArgument] = Field(
        default_factory=list, 
        description="List of precedent-backed arguments framed for court presentation"
    )
    generated_queries: List[str] = Field(
        default_factory=list, 
        description="Targeted Supreme Court semantic search queries formulated"
    )
    retrieved_precedents_count: int = Field(..., description="Total unique precedent chunks retrieved")
    processing_time_seconds: float = Field(..., description="Total analysis latency in seconds")

class PrecedentSearchItem(BaseModel):
    chunk_id: str
    case_title: str
    year: str
    file_name: Optional[str] = None
    bench: Optional[str] = None
    similarity_score: float
    text_snippet: str
    full_text: str

class DirectSearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[PrecedentSearchItem]

class ChatMessage(BaseModel):
    role: str = Field(..., description="'user' or 'assistant'")
    content: str = Field(..., description="Message text")

class ChatRequest(BaseModel):
    message: str = Field(..., description="User's query or case instruction")
    representing_side: str = Field("Petitioner / Appellant", description="Stance: Petitioner, Respondent, or Neutral")
    case_context: Optional[str] = Field(None, description="Active case facts or document text")
    conversation_history: Optional[List[ChatMessage]] = Field(default_factory=list, description="Recent conversation turns")

class PrecedentCitation(BaseModel):
    case_name: str = Field(..., description="Supreme Court precedent title")
    year: str = Field(..., description="Year or full decision date")
    bench: Optional[str] = Field(None, description="Bench quorum")
    file_name: Optional[str] = Field(None, description="Source PDF filename")
    verbatim_quote: str = Field(..., description="Exact judicial excerpt")
    similarity_score: float = Field(..., description="Vector similarity match (0.0 to 1.0)")
    citation_tag: str = Field(..., description="Formally formatted citation e.g. [Citation: ABC vs XYZ (2023) | Bench: ...] ")
    chunk_id: Optional[str] = Field(None, description="ChromaDB chunk identifier")

class ChatResponse(BaseModel):
    reply: str
    representing_side: str
    generated_queries: List[str]
    citations: List[PrecedentCitation] = Field(default_factory=list, description="Explicit citations mentioned in this response")
    retrieved_precedents: List[SupportingPrecedent]
    processing_time_seconds: float

class ReportFormat(str, Enum):
    JSON = "json"
    MARKDOWN = "markdown"
    HTML = "html"
    PDF = "pdf"

class ReportGenerationRequest(BaseModel):
    title: Optional[str] = Field(None, description="Custom title for legal report")
    representing_side: str = Field("Petitioner / Appellant", description="Petitioner / Appellant, Respondent / Defense, or Neutral Evaluation")
    case_context: Optional[str] = Field(None, description="Original case facts or document summary")
    conversation_history: Optional[List[ChatMessage]] = Field(default_factory=list, description="Chat turns to convert into formal arguments")
    executive_brief: Optional[ExecutiveBrief] = Field(None, description="Optional pre-existing executive brief")
    arguments: Optional[List[LegalArgument]] = Field(default_factory=list, description="Optional pre-existing arguments")

class LegalReportResponse(BaseModel):
    report_id: str
    title: str
    generated_at: str
    representing_side: str
    executive_brief: ExecutiveBrief
    arguments: List[LegalArgument]
    table_of_authorities: List[PrecedentCitation]
    markdown_content: str
    html_content: str
    total_precedents_cited: int
    processing_time_seconds: float

class HealthResponse(BaseModel):
    status: str
    chroma_db_status: str
    total_vectors: int
    legal_bert_status: str
    groq_configured: bool
    groq_model: str
