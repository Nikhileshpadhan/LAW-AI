import time
import logging
from typing import List, Dict, Any, Optional

from app.config import settings
from app.services.vector_engine import VectorEngine
from app.services.groq_service import GroqService

logger = logging.getLogger(__name__)

CHAT_SYSTEM_PROMPT = """You are a Senior Supreme Court Advocate of India of the highest eminence.
You are in a strategic case consultation chamber with instructing counsel / advocating lawyer.
Representing Stance: {representing_side}

CURRENT CASE CONTEXT:
{case_context}

CRITICAL RULES OF CONSULTATION:
1. STRICT ADHERENCE TO RETRIEVED PRECEDENTS:
   You have access to excerpts from authentic 5-year Supreme Court of India judgments retrieved specifically for this query.
   Base every legal proposition, citation, and case law reference EXCLUSIVELY on the retrieved judgment excerpts provided below.
   NEVER invent case names, bench compositions, or citations.
2. VERBATIM QUOTES:
   Whenever you cite a precedent, provide an exact verbatim quote from the provided excerpt to arm counsel for court submissions.
3. ADVERSARIAL PREPARATION:
   Provide practical, tactical advice on:
   - What to argue before the Bench.
   - What objections the opposing counsel or judge will likely raise.
   - Concrete statutory and precedent rebuttals.
4. MANDATORY EXPLICIT CITATION BADGES IN CHAT:
   Whenever you rely on or refer to any precedent, you MUST explicitly insert its formal citation tag formatted as:
   `[Citation: <Case Name> (<Year>) | Bench: <Bench> | Match: <Score>%]`
   followed immediately by the verbatim quote in markdown blockquote format:
   > "<exact quote from excerpt>"
   Ensure counsel can clearly identify each authority for oral or written submissions.
5. DIRECT, AUTHORITATIVE TONE:
   Address the lawyer directly as a senior colleague in the Supreme Court bar. Be rigorous, persuasive, and precise.

AUTHENTIC SUPREME COURT JUDGMENTS RETRIEVED FOR THIS TURN:
{retrieved_precedents_context}
"""

class LegalChatSession:
    def __init__(
        self,
        representing_side: str = "Petitioner / Appellant",
        case_context: str = ""
    ):
        self.representing_side = representing_side
        self.case_context = case_context
        self.conversation_history: List[Dict[str, str]] = []
        self.all_retrieved_precedents: Dict[str, Dict[str, Any]] = {}
        self.vector_engine = VectorEngine.get_instance()
        self.groq_service = GroqService()

    def set_case_context(self, context: str):
        self.case_context = context

    def set_representing_side(self, side: str):
        self.representing_side = side

    def clear(self):
        self.conversation_history = []
        self.case_context = ""
        self.all_retrieved_precedents = {}

    def _generate_search_query(self, user_message: str) -> List[str]:
        """
        Formulates 2-3 precise judicial queries based on user message and active case context.
        """
        prompt = (
            f"Case Context:\n{self.case_context[:1000] if self.case_context else 'General Supreme Court Law'}\n\n"
            f"Counsel's Question: {user_message}\n\n"
            "Formulate 2-3 targeted, search queries in formal Indian Supreme Court judicial terminology "
            "to search our 5-year SC judgment database. Return each query on a new line without numbering or punctuation."
        )

        try:
            resp = self.groq_service.generate_completion(
                messages=[
                    {"role": "system", "content": "You are a Supreme Court legal search query generator. Return only 2-3 raw queries separated by newlines."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.2,
                max_tokens=250
            )
            queries = [q.strip() for q in resp.strip().split("\n") if q.strip() and len(q.strip()) > 5]
            if queries:
                return queries[:3]
        except Exception as e:
            logger.warning(f"Error formulating queries with LLM: {e}")

        # Fallback query
        combined = f"{user_message} {self.case_context[:150]}"
        return [combined[:200]]

    def process_message(self, user_message: str) -> Dict[str, Any]:
        """
        Processes a user turn:
        1. Formulates search queries
        2. Retrieves relevant SC judgment chunks
        3. Generates conversational Senior Advocate advice
        """
        # Step 1: Formulate search queries
        queries = self._generate_search_query(user_message)

        # Step 2: Retrieve precedents
        retrieved = self.vector_engine.retrieve_top_precedents(
            queries=queries,
            top_k=4,
            max_total=6
        )

        # Store into session precedent pool
        for r in retrieved:
            self.all_retrieved_precedents[r["chunk_id"]] = r

        # Format precedent context
        prec_text_blocks = []
        for idx, prec in enumerate(retrieved, start=1):
            block = (
                f"[{idx}] {prec['case_name']} ({prec['year']})\n"
                f"Bench: {prec['bench'] or 'Supreme Court of India'}\n"
                f"Similarity: {prec['similarity_score'] * 100:.1f}%\n"
                f"Excerpt: {prec['document_text']}\n"
            )
            prec_text_blocks.append(block)

        precedents_context = "\n---\n".join(prec_text_blocks) if prec_text_blocks else "No matching chunks found above threshold."

        # Step 3: Construct LLM prompt
        system_content = CHAT_SYSTEM_PROMPT.format(
            representing_side=self.representing_side,
            case_context=self.case_context or "No formal case brief loaded yet. Advising based on user query.",
            retrieved_precedents_context=precedents_context
        )

        messages = [{"role": "system", "content": system_content}]

        # Add recent conversation turns with compact lengths to respect TPM limits
        for turn in self.conversation_history[-6:]:
            role = turn.get("role", "user")
            content = turn.get("content", "")
            if role == "assistant" and len(content) > 600:
                compact_content = content[:600] + "..."
            elif role == "user" and len(content) > 500:
                compact_content = content[:500] + "..."
            else:
                compact_content = content
            messages.append({"role": role, "content": compact_content})

        messages.append({"role": "user", "content": user_message})

        # Step 4: Execute LLM Call with resilient fallback
        try:
            assistant_reply = self.groq_service.generate_completion(
                messages=messages,
                temperature=0.3,
                max_tokens=1500
            )
        except Exception as e:
            logger.warning(f"Groq chat completion hit rate limit or error: {e}. Generating precedent-grounded fallback response.")
            assistant_reply = self._generate_precedent_fallback_reply(user_message, retrieved)

        # Update history
        self.conversation_history.append({"role": "user", "content": user_message})
        self.conversation_history.append({"role": "assistant", "content": assistant_reply})

        # Structured citation list
        citations = []
        for prec in retrieved:
            quote = prec["document_text"][:300].replace("\n", " ").strip()
            bench_str = prec.get("bench") or "Supreme Court of India"
            tag = f"[Citation: {prec['case_name']} ({prec['year']}) | Bench: {bench_str} | Match: {prec['similarity_score']*100:.1f}%]"
            citations.append({
                "case_name": prec["case_name"],
                "year": prec["year"],
                "bench": bench_str,
                "file_name": prec.get("file_name"),
                "verbatim_quote": quote,
                "similarity_score": prec["similarity_score"],
                "citation_tag": tag,
                "chunk_id": prec.get("chunk_id")
            })

        return {
            "reply": assistant_reply,
            "queries": queries,
            "citations": citations,
            "retrieved_precedents": retrieved
        }

    def _generate_precedent_fallback_reply(self, user_message: str, retrieved: List[Dict[str, Any]]) -> str:
        lines = [
            f"**To Counsel (Representing: {self.representing_side})**\n",
            f"Regarding your query on: *\"{user_message.strip()[:200]}\"*\n",
            "Here are the authoritative Supreme Court precedents retrieved directly from our 5-year repository for your submissions:\n"
        ]
        if not retrieved:
            lines.append("No specific high-relevance precedent chunks matched this exact query above the strict threshold.")
            return "\n".join(lines)

        for idx, prec in enumerate(retrieved[:3], 1):
            case_name = prec.get("case_name", "Supreme Court Precedent")
            year = prec.get("year", "")
            bench = prec.get("bench") or "Supreme Court of India"
            match = prec.get("similarity_score", 0.0) * 100
            quote = prec.get("document_text", "")[:350].replace("\n", " ").strip()
            tag = f"[Citation: {case_name} ({year}) | Bench: {bench} | Match: {match:.1f}%]"
            lines.append(f"### {idx}. {case_name} ({year})")
            lines.append(f"{tag}\n")
            lines.append(f"> \"{quote}\"\n")
            lines.append(f"**Tactical Application:** Instructing counsel should rely on this ruling to establish the position for the {self.representing_side}. The bench composition ({bench}) carries binding force under Article 141.")
            lines.append("")

        lines.append("\n**Anticipated Objection & Rebuttal:** Opposing counsel will seek to distinguish these authorities on facts. Rebut by submitting that the underlying constitutional ratio decidendi directly governs the present matrix.")
        return "\n".join(lines)
