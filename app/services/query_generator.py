import logging
from typing import Dict, Any, List
from app.services.groq_service import GroqService

logger = logging.getLogger(__name__)

STAGE1_SYSTEM_PROMPT = """You are a Principal Supreme Court Judicial Research Clerk and Expert Advocate in Indian Law.
Your role is to analyze a lawyer's case facts or petition document and prepare:
1. Core factual summary (concise, focusing on legally operative facts).
2. Key legal questions/issues formulated for the Supreme Court of India.
3. Relevant statutory provisions (e.g. IPC/BNS, CrPC/BNSS, CPC, Indian Evidence Act/BSA, Constitution of India, PMLA, NI Act, etc.).
4. Exactly 4 to 5 targeted semantic search queries phrased in formal Supreme Court judicial terminology.

IMPORTANT FOR SEARCH QUERIES:
The queries will be embedded using a Legal-BERT model to search a database of Indian Supreme Court judgments from the last 5 years.
Phrasing must be precise, judicial, and concept-dense (e.g., "anticipatory bail parameters economic offences Section 438 CrPC parity liberty", "quashing of FIR Section 482 CrPC civil dispute given criminal cloak", "Section 138 Negotiable Instruments Act rebuttal of presumption Section 139 standard of proof preponderance of probabilities").

You MUST return your analysis strictly as a JSON object with this exact structure:
{
  "factual_summary": "Concise summary of operative facts...",
  "legal_issues": ["Issue 1...", "Issue 2..."],
  "applicable_statutes": ["Section X Statute Y...", "Article Z..."],
  "search_queries": [
    "Supreme court judicial terminology query 1...",
    "Supreme court judicial terminology query 2...",
    "Supreme court judicial terminology query 3...",
    "Supreme court judicial terminology query 4...",
    "Supreme court judicial terminology query 5..."
  ]
}
"""

class QueryGeneratorService:
    def __init__(self, groq_service: GroqService):
        self.groq_service = groq_service

    def generate_queries_and_facts(self, raw_case_text: str) -> Dict[str, Any]:
        """
        Extracts facts and generates 4-5 targeted judicial search queries.
        """
        if not self.groq_service.is_configured():
            logger.warning("GroqService is not configured with an API key. Using rule-based fallback formulation.")
            return self._fallback_formulation(raw_case_text)

        messages = [
            {"role": "system", "content": STAGE1_SYSTEM_PROMPT},
            {
                "role": "user",
                "content": f"Please analyze the following case document/facts and generate the legal brief and 4-5 judicial search queries:\n\n{raw_case_text[:12000]}"
            }
        ]

        try:
            raw_response = self.groq_service.generate_completion(
                messages=messages,
                temperature=0.2,
                response_format={"type": "json_object"}
            )
            data = self.groq_service.extract_json(raw_response)
            
            # Ensure queries list is present and non-empty
            queries = data.get("search_queries", [])
            if not isinstance(queries, list) or len(queries) == 0:
                queries = [raw_case_text[:200]]
            
            return {
                "factual_summary": data.get("factual_summary", "Factual summary extracted from case submission."),
                "legal_issues": data.get("legal_issues", ["Determination of rights and liabilities under applicable law"]),
                "applicable_statutes": data.get("applicable_statutes", []),
                "search_queries": queries[:5]
            }
        except Exception as e:
            logger.error(f"Error in LLM Stage 1 extraction: {e}. Falling back to rule-based queries.")
            return self._fallback_formulation(raw_case_text)

    @staticmethod
    def _fallback_formulation(raw_text: str) -> Dict[str, Any]:
        """
        Fallback when Groq is unavailable, extracting key terms for vector search.
        """
        snippet = raw_text[:500].replace("\n", " ").strip()
        queries = [
            f"Supreme court interpretation of {snippet[:150]}",
            "principles of fair trial natural justice Article 14 21",
            "statutory requirements essential ingredients prima facie case",
            "jurisdiction of court exercise of inherent powers"
        ]
        return {
            "factual_summary": snippet,
            "legal_issues": ["Substantive liability and procedural compliance under governing statutes."],
            "applicable_statutes": ["Constitution of India", "Code of Criminal Procedure / Civil Procedure Code"],
            "search_queries": queries
        }
