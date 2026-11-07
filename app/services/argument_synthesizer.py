import json
import logging
from typing import Dict, Any, List
from app.services.groq_service import GroqService
from app.schemas import (
    ExecutiveBrief,
    LegalArgument,
    SupportingPrecedent,
    CaseAnalysisResponse
)

logger = logging.getLogger(__name__)

STAGE3_SYSTEM_PROMPT = """You are a Senior Supreme Court Advocate of India of the highest distinction, renowned for preparing airtight, precedent-grounded case briefs and arguing before the Constitution and Appellate Benches of the Supreme Court of India.

You will be provided:
1. The Case Factual Matrix and Legal Issues.
2. The Representing Side ({representing_side}).
3. A set of retrieved authentic Supreme Court of India judgment excerpts from the last 5 years.

CRITICAL ANTI-HALLUCINATION RULES:
1. STRICT ADHERENCE TO RETRIEVED PRECEDENTS: You must cite ONLY the cases provided in the retrieved judgment excerpts below. NEVER invent, hallucinate, or recall cases from outside the provided excerpts.
2. VERBATIM QUOTES: Every cited precedent MUST include an exact verbatim quote from the text of the chunk provided. Do not paraphrase in the `verbatim_quote` field.
3. PRECEDENT METADATA: Use the exact Case Name, Year, Bench, and Similarity Score provided in each chunk header.
4. RATIO DECIDENDI APPLICATION: In `detailed_reasoning`, explicitly apply the legal principle (*ratio decidendi*) of the cited Supreme Court ruling to the client's specific factual circumstances, arguing forcefully in favor of the {representing_side}.
5. COUNTER-ARGUMENT & REBUTTAL: Provide the precise legal distinction or objection that opposing counsel is expected to raise against this precedent, followed by a definitive rebuttal for court presentation.

You MUST respond strictly with a valid JSON object following this exact schema:
{
  "executive_brief": {
    "summary_of_facts": "Comprehensive summary of client's factual matrix...",
    "key_legal_issues": ["Issue 1...", "Issue 2..."],
    "applicable_statutes": ["Section X Act Y...", "Article Z..."]
  },
  "arguments": [
    {
      "argument_number": 1,
      "title": "Clear, compelling judicial proposition...",
      "detailed_reasoning": "Step-by-step ratio decidendi application to client's facts...",
      "supporting_precedents": [
        {
          "case_name": "Exact Case Title from chunk",
          "year": "Exact Year",
          "bench": "Exact Bench",
          "verbatim_quote": "Verbatim quote extracted directly from the provided chunk text",
          "similarity_score": 0.85,
          "chunk_id": "chunk_id_string"
        }
      ],
      "anticipated_counter_argument": "How opposing counsel will argue this precedent is distinguishable...",
      "rebuttal": "Decisive counter-point and rebuttal for your oral submissions..."
    }
  ]
}
"""

class ArgumentSynthesizerService:
    def __init__(self, groq_service: GroqService):
        self.groq_service = groq_service

    def synthesize_arguments(
        self,
        factual_context: Dict[str, Any],
        retrieved_precedents: List[Dict[str, Any]],
        representing_side: str,
        generated_queries: List[str],
        start_time: float
    ) -> CaseAnalysisResponse:
        """
        Synthesizes persuasive, precedent-grounded legal arguments backed by retrieved SC chunks.
        """
        import time

        if not self.groq_service.is_configured():
            logger.warning("GroqService is not configured. Generating structured precedent brief from retrieved chunks.")
            return self._generate_offline_response(
                factual_context, retrieved_precedents, representing_side, generated_queries, start_time
            )

        # Build formatted precedent documents context (Top 5 highest relevance to stay safely within 8000 TPM quota)
        precedent_blocks = []
        for idx, prec in enumerate(retrieved_precedents[:5], start=1):
            excerpt = prec['document_text'][:1200].strip()
            block = (
                f"--- [DOC_{idx}] ---\n"
                f"Chunk ID: {prec['chunk_id']}\n"
                f"Case Name: {prec['case_name']}\n"
                f"Year: {prec['year']}\n"
                f"Bench: {prec['bench'] or 'Supreme Court of India'}\n"
                f"Similarity Score: {prec['similarity_score']}\n"
                f"Judgment Text Excerpt:\n{excerpt}\n"
            )
            precedent_blocks.append(block)

        precedents_context = "\n".join(precedent_blocks)

        user_prompt = (
            f"REPRESENTING SIDE: {representing_side}\n\n"
            f"FACTUAL MATRIX & EXTRACTED ISSUES:\n"
            f"Summary: {factual_context.get('factual_summary', '')}\n"
            f"Legal Issues: {json.dumps(factual_context.get('legal_issues', []))}\n"
            f"Statutes: {json.dumps(factual_context.get('applicable_statutes', []))}\n\n"
            f"AUTHENTIC 5-YEAR SUPREME COURT PRECEDENTS RETRIEVED:\n"
            f"{precedents_context}\n\n"
            f"Synthesize the authoritative Supreme Court legal brief and arguments for {representing_side} now."
        )

        system_prompt = STAGE3_SYSTEM_PROMPT.replace("{representing_side}", representing_side)

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

        try:
            raw_response = self.groq_service.generate_completion(
                messages=messages,
                temperature=0.2,
                response_format={"type": "json_object"},
                max_tokens=3000
            )
            data = self.groq_service.extract_json(raw_response)

            brief_data = data.get("executive_brief", {})
            brief = ExecutiveBrief(
                summary_of_facts=brief_data.get("summary_of_facts", factual_context.get("factual_summary", "")),
                key_legal_issues=brief_data.get("key_legal_issues", factual_context.get("legal_issues", [])),
                applicable_statutes=brief_data.get("applicable_statutes", factual_context.get("applicable_statutes", []))
            )

            # Build map of retrieved precedent document texts
            prec_doc_map = {p.get("chunk_id"): p.get("document_text") for p in retrieved_precedents if p.get("chunk_id")}
            case_doc_map = {p.get("case_name", "").lower(): p.get("document_text") for p in retrieved_precedents}

            arguments: List[LegalArgument] = []
            for arg_raw in data.get("arguments", []):
                supporting_list = []
                for prec_raw in arg_raw.get("supporting_precedents", []):
                    c_id = prec_raw.get("chunk_id")
                    c_name = prec_raw.get("case_name", "").lower()
                    doc_txt = prec_doc_map.get(c_id) or case_doc_map.get(c_name) or prec_raw.get("document_text")
                    supporting_list.append(
                        SupportingPrecedent(
                            case_name=prec_raw.get("case_name", "Supreme Court of India"),
                            year=str(prec_raw.get("year", "")),
                            bench=prec_raw.get("bench", "Supreme Court of India"),
                            verbatim_quote=prec_raw.get("verbatim_quote", ""),
                            similarity_score=float(prec_raw.get("similarity_score", 0.0)),
                            chunk_id=c_id,
                            document_text=doc_txt
                        )
                    )

                arguments.append(
                    LegalArgument(
                        argument_number=arg_raw.get("argument_number", len(arguments) + 1),
                        title=arg_raw.get("title", f"Legal Argument {len(arguments)+1}"),
                        detailed_reasoning=arg_raw.get("detailed_reasoning", ""),
                        supporting_precedents=supporting_list,
                        anticipated_counter_argument=arg_raw.get("anticipated_counter_argument", ""),
                        rebuttal=arg_raw.get("rebuttal", "")
                    )
                )

            total_time = round(time.time() - start_time, 2)
            return CaseAnalysisResponse(
                representing_side=representing_side,
                executive_brief=brief,
                arguments=arguments,
                generated_queries=generated_queries,
                retrieved_precedents_count=len(retrieved_precedents),
                processing_time_seconds=total_time
            )

        except Exception as e:
            logger.error(f"Error in LLM Stage 3 synthesis: {e}. Falling back to structured precedent brief.")
            return self._generate_offline_response(
                factual_context, retrieved_precedents, representing_side, generated_queries, start_time
            )

    @staticmethod
    def _generate_offline_response(
        factual_context: Dict[str, Any],
        retrieved_precedents: List[Dict[str, Any]],
        representing_side: str,
        generated_queries: List[str],
        start_time: float
    ) -> CaseAnalysisResponse:
        import time

        brief = ExecutiveBrief(
            summary_of_facts=factual_context.get("factual_summary", "Facts extracted from user submission."),
            key_legal_issues=factual_context.get("legal_issues", []),
            applicable_statutes=factual_context.get("applicable_statutes", [])
        )

        arguments = []
        for i, prec in enumerate(retrieved_precedents[:5], start=1):
            quote = prec["document_text"][:350].replace("\n", " ").strip()
            arguments.append(
                LegalArgument(
                    argument_number=i,
                    title=f"Application of Ratio in {prec['case_name']} to client's case",
                    detailed_reasoning=(
                        f"The Supreme Court of India in {prec['case_name']} ({prec['year']}) established clear principles "
                        f"directly governing the present controversy. When applied to the factual matrix for the {representing_side}, "
                        f"the precedent establishes that the relief claimed is substantiated under law."
                    ),
                    supporting_precedents=[
                        SupportingPrecedent(
                            case_name=prec["case_name"],
                            year=prec["year"],
                            bench=prec.get("bench") or "Supreme Court of India",
                            file_name=prec.get("file_name"),
                            verbatim_quote=quote,
                            similarity_score=prec["similarity_score"],
                            chunk_id=prec["chunk_id"],
                            document_text=prec.get("document_text")
                        )
                    ],
                    anticipated_counter_argument="Opposing counsel may argue that the factual context of this precedent differs.",
                    rebuttal="The ratio decidendi is grounded on fundamental statutory interpretation and applies squarely to the present facts."
                )
            )

        return CaseAnalysisResponse(
            representing_side=representing_side,
            executive_brief=brief,
            arguments=arguments,
            generated_queries=generated_queries,
            retrieved_precedents_count=len(retrieved_precedents),
            processing_time_seconds=round(time.time() - start_time, 2)
        )
