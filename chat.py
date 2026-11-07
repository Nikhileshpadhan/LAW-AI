import os
import sys
import time
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

# Ensure stdout handles UTF-8 on Windows without crashing on non-ASCII legal quotes
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from app.config import settings
from app.services.vector_engine import VectorEngine
from app.services.groq_service import GroqService
from app.services.chat_session import LegalChatSession
from app.services.document_parser import fitz

def print_banner():
    banner = """
================================================================================
 SUPREME COURT PRECEDENT ANALYZER & LEGAL ARGUMENT ENGINE
 [Interactive Senior Advocate Case Consultation Chamber]
================================================================================
 Repository: 5-Year Supreme Court Judgments (76,802 vectors via Legal-BERT)
 Inference:  Groq openai/gpt-oss-120b
 Commands:
   /load <file>     Load a case document (PDF or TXT)
   /side <side>     Switch stance: Petitioner | Respondent | Neutral
   /case            View currently loaded case context
   /search <query>  Direct semantic search in 76,802 SC judgments
   /precedents      List authentic precedents retrieved in this session
   /report          Convert consultation into formal strategy report (PDF + HTML)
   /clear           Reset conversation and case context
   /help            Show this help menu
   /exit or /quit   Leave consultation chamber
================================================================================
"""
    print(banner)

def load_document(file_path: str) -> str:
    path = Path(file_path.strip().strip('"').strip("'"))
    if not path.exists():
        raise FileNotFoundError(f"File not found: {path}")

    if path.suffix.lower() == ".pdf":
        doc = fitz.open(str(path))
        pages = []
        for p in doc[:35]:
            pages.append(p.get_text())
        doc.close()
        text = "\n".join(pages).strip()
        print(f"[*] Loaded PDF: '{path.name}' ({len(pages)} pages read, {len(text):,} chars).")
        return text
    else:
        text = path.read_text(encoding="utf-8", errors="replace").strip()
        print(f"[*] Loaded Text file: '{path.name}' ({len(text):,} chars).")
        return text

def main():
    print_banner()

    print("[*] Initializing Vector Engine & Loading Legal-BERT into memory...")
    t0 = time.time()
    engine = VectorEngine.get_instance()
    engine.initialize()
    total_vectors = engine.get_collection_count()
    print(f"[*] Engine ready in {time.time()-t0:.2f}s | Collection Vectors: {total_vectors:,}")

    groq = GroqService()
    if not groq.is_configured():
        print("\n[!] WARNING: GROQ_API_KEY is not set in .env! Online LLM responses will fail.")
        print("    Please set GROQ_API_KEY in your .env file.\n")
    else:
        print(f"[*] Groq LLM Connected | Active Model: {settings.GROQ_MODEL}")

    session = LegalChatSession(representing_side="Petitioner / Appellant")

    print(f"\n[Active Stance]: {session.representing_side}")
    print("[Tip]: Type your case facts or ask any legal question to begin. Or use /load to load a petition/FIR.\n")

    while True:
        try:
            user_input = input("\n[Advocate] > ").strip()
        except (KeyboardInterrupt, EOFError):
            print("\nExiting consultation. Best of luck in court, Counsel.")
            break

        if not user_input:
            continue

        # Handle Commands
        cmd_lower = user_input.lower()
        if cmd_lower in ["/exit", "/quit", "exit", "quit"]:
            print("\nExiting consultation chamber. Session closed.")
            break

        elif cmd_lower in ["/help", "help"]:
            print_banner()
            continue

        elif cmd_lower in ["/clear", "clear"]:
            session.clear()
            print("[*] Consultation session and case context cleared.")
            continue

        elif cmd_lower == "/case":
            if session.case_context:
                print("\n--- CURRENT ACTIVE CASE CONTEXT ---")
                print(session.case_context[:1500] + ("..." if len(session.case_context) > 1500 else ""))
            else:
                print("[*] No case context loaded yet. Describe your case or use /load <file>.")
            continue

        elif cmd_lower.startswith("/side"):
            parts = user_input.split(maxsplit=1)
            if len(parts) > 1:
                arg = parts[1].strip().lower()
                if "resp" in arg or "def" in arg:
                    session.set_representing_side("Respondent / Defense")
                elif "neut" in arg:
                    session.set_representing_side("Neutral Evaluation")
                else:
                    session.set_representing_side("Petitioner / Appellant")
                print(f"[*] Switched representing stance to: '{session.representing_side}'")
            else:
                print(f"[*] Current stance: {session.representing_side}")
                print("    Usage: /side Petitioner | /side Respondent | /side Neutral")
            continue

        elif cmd_lower.startswith("/load"):
            parts = user_input.split(maxsplit=1)
            if len(parts) > 1:
                try:
                    text = load_document(parts[1])
                    session.set_case_context(text)
                    print("[*] Case document loaded into context. You can now ask questions or strategize.")
                except Exception as e:
                    print(f"[!] Error loading document: {e}")
            else:
                print("Usage: /load <path_to_pdf_or_txt_file>")
            continue

        elif cmd_lower.startswith("/search"):
            parts = user_input.split(maxsplit=1)
            if len(parts) > 1:
                query = parts[1].strip()
                print(f"[*] Searching 76,802 SC judgments for: '{query}'...")
                results = engine.retrieve_top_precedents([query], top_k=5, max_total=5)
                for idx, r in enumerate(results, 1):
                    print(f"\n[{idx}] {r['case_name']} ({r['year']})")
                    print(f"    Bench: {r['bench']}")
                    print(f"    Similarity: {r['similarity_score']*100:.1f}%")
                    print(f"    Quote/Excerpt: {r['document_text'][:300].replace(chr(10), ' ')}...")
            else:
                print("Usage: /search <legal question or topic>")
            continue

        elif cmd_lower == "/precedents":
            if not session.all_retrieved_precedents:
                print("[*] No precedents retrieved in this session yet.")
            else:
                print(f"\n--- PRECEDENTS RETRIEVED IN THIS SESSION ({len(session.all_retrieved_precedents)} total) ---")
                for idx, p in enumerate(session.all_retrieved_precedents.values(), 1):
                    print(f"[{idx}] {p['case_name']} ({p['year']}) - Bench: {p['bench']} [Score: {p['similarity_score']*100:.1f}%]")
            continue

        elif cmd_lower in ["/report", "report"]:
            print("\n[*] Converting case consultation into a formal Supreme Court Precedent Strategy Report...")
            from app.services.report_generator import ReportGeneratorService
            from app.schemas import ReportGenerationRequest, ChatMessage

            report_svc = ReportGeneratorService()
            history = [ChatMessage(role=m["role"], content=m["content"]) for m in session.conversation_history]
            req = ReportGenerationRequest(
                representing_side=session.representing_side,
                case_context=session.case_context,
                conversation_history=history
            )
            report = report_svc.generate_report(req)
            pdf_bytes = report_svc.generate_pdf_bytes(report)

            out_dir = Path("reports")
            out_dir.mkdir(exist_ok=True)
            pdf_path = out_dir / f"{report.report_id}.pdf"
            html_path = out_dir / f"{report.report_id}.html"

            pdf_path.write_bytes(pdf_bytes)
            html_path.write_text(report.html_content, encoding="utf-8")

            print("\n" + "=" * 80)
            print(f" FORMAL STRATEGY REPORT GENERATED: {report.report_id}")
            print("=" * 80)
            print(f"[*] Title:            {report.title}")
            print(f"[*] Stance:           {report.representing_side}")
            print(f"[*] Precedents Cited: {report.total_precedents_cited}")
            print(f"[*] Saved PDF Report: {pdf_path.resolve()}")
            print(f"[*] Saved HTML Brief: {html_path.resolve()}")
            print("=" * 80)
            continue

        # Regular Chat Turn
        print("\n[*] Consulting 76,802 SC judgments & synthesizing Senior Advocate response...")
        t_start = time.time()
        try:
            result = session.process_message(user_input)
            latency = time.time() - t_start

            print("\n" + "=" * 80)
            print(f" SENIOR ADVOCATE ADVICE [Stance: {session.representing_side} | Latency: {latency:.2f}s]")
            print("=" * 80)
            print(result["reply"].strip())
            print("=" * 80)

            if result["retrieved_precedents"]:
                print(f"\n[Grounding Supreme Court Precedents Retrieved for this Turn]:")
                for idx, prec in enumerate(result["retrieved_precedents"], 1):
                    print(f"  {idx}. {prec['case_name']} ({prec['year']}) - Score: {prec['similarity_score']*100:.1f}%")

        except Exception as e:
            print(f"\n[!] Error during consultation: {e}")

if __name__ == "__main__":
    main()
