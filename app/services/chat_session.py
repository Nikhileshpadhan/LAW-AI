import time
import re
import logging
from typing import List, Dict, Any, Optional

from app.config import settings
from app.services.vector_engine import VectorEngine
from app.services.groq_service import GroqService

logger = logging.getLogger(__name__)

LEGAL_DOMAIN_KEYWORDS = {
    # Judicial & Courts
    "law", "legal", "court", "judge", "bench", "jurisdiction", "magistrate",
    "tribunal", "supreme", "apex", "high court", "sessions", "district", "coram",
    # Pleadings & Procedures
    "petition", "petitioner", "appellant", "respondent", "plaintiff", "defendant",
    "accused", "victim", "prosecution", "defense", "counsel", "advocate", "attorney",
    "suit", "writ", "plaint", "written statement", "affidavit", "evidence", "witness",
    "cross-examination", "pleading", "prayer", "stay", "injunction", "decree",
    "order", "judgment", "ratio", "obiter", "precedent", "authority", "citation",
    "appeal", "revision", "review", "special leave", "slp", "quash", "discharge",
    # Statutes & Codes
    "act", "section", "article", "schedule", "statute", "ordinance", "rule", "provision",
    "crpc", "ipc", "cpc", "bns", "bnss", "bsa", "pmla", "ibc", "ni act",
    "constitution", "fundamental right", "habeas", "mandamus", "certiorari",
    # Criminal Law
    "fir", "police", "arrest", "bail", "anticipatory", "custody", "remand", "charge",
    "chargesheet", "cognizable", "bailable", "offence", "crime", "fraud", "theft",
    "murder", "assault", "cheating", "defamation", "corruption", "conspiracy",
    "138", "420", "482", "302", "376", "498a",
    # Civil & Property
    "property", "land", "neighbour", "neighbor", "wall", "encroach", "encroachment",
    "trespass", "possession", "dispute", "title", "deed", "ownership", "tenant",
    "landlord", "rent", "eviction", "lease", "easement", "mortgage", "partition",
    "sale deed", "agreement to sell", "specific performance",
    # Commercial & Corporate
    "contract", "breach", "agreement", "arbitration", "arbitrator", "award",
    "company", "corporate", "director", "shareholder", "insolvency", "bankruptcy",
    "liquidation", "moratorium", "debt", "creditor", "debtor", "default",
    "trademark", "patent", "copyright", "infringement", "gst", "tax",
    # Family & Personal
    "divorce", "maintenance", "alimony", "custody", "guardianship", "succession",
    "inheritance", "will", "probate", "domestic violence"
}

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
6. STRICT DOMAIN RESTRICTION (LAW & CASE MATTERS ONLY):
   You are exclusively a Supreme Court legal and case analysis consultant.
   If instructing counsel or the user asks about topics unrelated to law, statutory provisions, court proceedings, case facts, or legal disputes (for example: cooking recipes, computer programming, sports, entertainment, weather, general non-legal trivia):
   Politely and firmly decline. State clearly:
   "I am an AI legal consultant specialized exclusively in Indian law, Supreme Court precedents, and case analysis. I am only able to answer law and case-related inquiries. Please present your legal proposition, statutory query, or case facts, and I will be glad to assist you."
   Do NOT attempt to answer non-legal questions or fabricate legal analogies for unrelated subjects.

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

    @staticmethod
    def _is_greeting(user_message: str) -> bool:
        clean = re.sub(r"[^\w\s]", "", user_message.strip().lower())
        if clean in {
            "hi", "hello", "hey", "heyy", "hiya", "howdy", "namaste", "namaskar",
            "pranam", "good morning", "good afternoon", "good evening", "good day",
            "sup", "yo", "welcome", "greetings"
        }:
            return True
        if re.match(
            r"^(hi|hello|hey|namaste|good (morning|afternoon|evening|day))(\s+(sir|advocate|counsel|there|maam|madam|team|everyone))?$",
            clean
        ):
            return True
        return False

    def _is_out_of_scope(self, user_message: str) -> bool:
        """
        Determines if the inquiry is unrelated to law, courts, statutes, or case facts.
        """
        has_active_dossier = bool(self.case_context and len(self.case_context.strip()) > 40)

        words = set(re.findall(r"\b[a-zA-Z0-9_]+\b", user_message.lower()))
        if words.intersection(LEGAL_DOMAIN_KEYWORDS):
            return False

        non_legal_patterns = [
            r"\b(recipe|bake|cook|cake|pizza|food|pasta|dish|curry|soup|dessert|burger)\b",
            r"\b(weather|temperature|forecast|rain today|humidity)\b",
            r"\b(cricket|football|soccer|fifa|ipl|nba|tennis|olympics|match score)\b",
            r"\b(python|javascript|typescript|c\+\+|java|html|css|react|sql code|binary tree|algorithm|leetcode)\b",
            r"\b(movie|song|lyrics|actor|actress|cinema|netflix|hollywood|bollywood)\b",
            r"\b(joke|riddle|funny story|sing a song)\b"
        ]
        text_lower = user_message.lower()
        for pat in non_legal_patterns:
            if re.search(pat, text_lower):
                if not any(k in text_lower for k in ["law", "act", "court", "suit", "crime", "illegal", "copyright", "patent", "contract", "legal"]):
                    return True

        if has_active_dossier:
            return False

        if self.groq_service.is_configured():
            prompt = (
                f"User Inquiry: \"{user_message.strip()[:300]}\"\n\n"
                "Determine if this query concerns law, judicial proceedings, statutory provisions, "
                "legal rights, police, crimes, civil disputes, property, contracts, or case facts.\n"
                "Answer with exactly one word: LEGAL or OUT_OF_SCOPE."
            )
            try:
                resp = self.groq_service.generate_completion(
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.0,
                    max_tokens=10,
                    model="openai/gpt-oss-20b"
                )
                if "OUT_OF_SCOPE" in resp.upper():
                    return True
                if "LEGAL" in resp.upper():
                    return False
            except Exception as e:
                logger.warning(f"Error during legal triage check: {e}")

        return False

    def process_message(self, user_message: str) -> Dict[str, Any]:
        """
        Processes a user turn:
        1. Checks for simple greetings or out-of-scope non-legal queries
        2. Formulates search queries
        3. Retrieves relevant SC judgment chunks
        4. Generates conversational Senior Advocate advice
        """
        # Step 0A: Simple greeting handling
        if self._is_greeting(user_message):
            reply = (
                "Good day, Counsel. I am your Senior Supreme Court Advocate consultant.\n\n"
                "I am at your service to examine your case facts, evaluate statutory provisions, "
                "or formulate precedent-backed strategies before the Supreme Court of India. "
                "Please share your case details or the legal proposition you wish to explore."
            )
            self.conversation_history.append({"role": "user", "content": user_message})
            self.conversation_history.append({"role": "assistant", "content": reply})
            return {
                "reply": reply,
                "queries": [],
                "citations": [],
                "retrieved_precedents": []
            }

        # Step 0B: Out-of-law scope handling
        if self._is_out_of_scope(user_message):
            reply = (
                "I am an AI legal consultant specialized exclusively in Indian law, "
                "Supreme Court precedents, and case analysis. I am only able to answer law and case-related inquiries.\n\n"
                "Please present your legal proposition, case facts, or statutory question, "
                "and I will be glad to assist you with strategic submissions and relevant authorities."
            )
            self.conversation_history.append({"role": "user", "content": user_message})
            self.conversation_history.append({"role": "assistant", "content": reply})
            return {
                "reply": reply,
                "queries": [],
                "citations": [],
                "retrieved_precedents": []
            }

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
            # Do not cite chunks that do not meet baseline relevance
            if prec.get("similarity_score", 0.0) < 0.35:
                continue
            quote = prec["document_text"][:300].replace("\n", " ").strip()
            bench_str = prec.get("bench") or "Supreme Court of India"
            tag = f"[Citation: {prec['case_name']} ({prec['year']}) | Bench: {bench_str}]"
            citations.append({
                "case_name": prec["case_name"],
                "year": prec["year"],
                "bench": bench_str,
                "file_name": prec.get("file_name"),
                "verbatim_quote": quote,
                "similarity_score": prec["similarity_score"],
                "citation_tag": tag,
                "chunk_id": prec.get("chunk_id"),
                "document_text": prec.get("document_text")
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
