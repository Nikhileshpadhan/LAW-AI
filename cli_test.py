import argparse
import sys
import time
import json
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent))

# Ensure stdout handles UTF-8 on Windows
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from app.config import settings
from app.services.vector_engine import VectorEngine
from app.services.groq_service import GroqService
from app.services.query_generator import QueryGeneratorService
from app.services.argument_synthesizer import ArgumentSynthesizerService

SAMPLE_CASES = {
    "bail": (
        "The applicant is a director of a private limited company facing an FIR registered under "
        "Sections 406, 420, and 120-B of IPC for alleged default in repayment of commercial advance. "
        "The entire transaction is based on a commercial contract with an arbitration clause. "
        "The police have issued summons threatening immediate arrest. The applicant has clean antecedents "
        "and is ready to cooperate with the investigation. He seeks pre-arrest bail under Section 438 CrPC."
    ),
    "quashing": (
        "The petitioner seeks quashing of criminal proceedings under Section 482 CrPC for offences under "
        "Sections 498A and 406 IPC. The FIR was lodged 3 years after separation, naming all distant relatives "
        "including elderly parents and non-resident married sister, with vague, omnibus allegations without "
        "specific dates or instances of harassment."
    ),
    "cheque": (
        "Complaint under Section 138 of Negotiable Instruments Act. The accused contends that the cheque "
        "was handed over solely as security for an unperformed transaction and that no enforceable debt "
        "existed on the date of presentation. The statutory notice was received, and reply was dispatched "
        "disputing liability."
    )
}

def print_header(title: str):
    print("\n" + "=" * 80)
    print(f" {title.upper()}")
    print("=" * 80)

def print_section(title: str):
    print("\n" + "-" * 80)
    print(f" >> {title}")
    print("-" * 80)

def main():
    parser = argparse.ArgumentParser(
        description="Supreme Court Precedent Analyzer & Legal Argument CLI Tester"
    )
    parser.add_argument(
        "--side",
        choices=["Petitioner / Appellant", "Respondent / Defense", "Neutral Evaluation"],
        default="Petitioner / Appellant",
        help="Representing side"
    )
    parser.add_argument(
        "--sample",
        choices=["bail", "quashing", "cheque"],
        default=None,
        help="Use a pre-configured sample legal scenario"
    )
    parser.add_argument(
        "--text",
        type=str,
        default=None,
        help="Custom case description or facts in plain text"
    )
    parser.add_argument(
        "--file",
        type=str,
        default=None,
        help="Path to a PDF or TXT legal case document"
    )
    parser.add_argument(
        "--search-only",
        action="store_true",
        help="Run only vector search retrieval without LLM argument synthesis"
    )
    
    args = parser.parse_args()

    # Determine input text
    case_text = ""
    if args.file:
        fpath = Path(args.file)
        if not fpath.exists():
            print(f"Error: File not found: {fpath}")
            sys.exit(1)
        if fpath.suffix.lower() == ".pdf":
            try:
                import fitz
                doc = fitz.open(fpath)
                case_text = "\n".join([page.get_text() for page in doc[:30]])
                doc.close()
                print(f"[Loaded PDF: {fpath.name} ({len(case_text)} chars extracted)]")
            except Exception as e:
                print(f"Error reading PDF: {e}")
                sys.exit(1)
        else:
            case_text = fpath.read_text(encoding="utf-8", errors="replace")
            print(f"[Loaded Text file: {fpath.name}]")
    elif args.text:
        case_text = args.text
    elif args.sample:
        case_text = SAMPLE_CASES[args.sample]
        print(f"[Using sample scenario: '{args.sample}']")
    else:
        print("No input provided. Defaulting to sample scenario: 'bail'.")
        print("Tip: Use --help to see all options or provide --text / --file.\n")
        case_text = SAMPLE_CASES["bail"]

    start_total = time.time()
    print_header("Supreme Court Precedent Analyzer & Legal Argument Engine")
    print(f"Representing Side: {args.side}")
    print(f"Groq Model Target: {settings.GROQ_MODEL} (Fallback: {settings.GROQ_FALLBACK_MODEL})")
    print(f"ChromaDB Store:    {settings.CHROMA_DB_PATH}")
    print(f"Legal-BERT Model:  {settings.LEGAL_BERT_PATH}")

    # 1. Initialize Vector Engine
    print("\n[1/3] Initializing Vector Engine & Loading Legal-BERT into memory...")
    t0 = time.time()
    engine = VectorEngine.get_instance()
    engine.initialize()
    total_vectors = engine.get_collection_count()
    print(f"      Initialized in {time.time()-t0:.2f}s | Collection Vectors: {total_vectors:,}")

    # 2. Stage 1: Fact Extraction & Query Formulation
    groq = GroqService()
    if groq.is_configured():
        print("      Groq API Key: Detected (Online LLM Synthesis Active)")
    else:
        print("      Groq API Key: Not set in .env (Offline Vector Search + Rule Mode Active)")

    if args.search_only:
        print_section("DIRECT VECTOR SEARCH MODE")
        queries = [case_text[:200]]
        print(f"Query: {queries[0]}")
        precedents = engine.retrieve_top_precedents(queries, top_k=5)
        for i, p in enumerate(precedents, 1):
            print(f"\n[{i}] {p['case_name']} ({p['year']})")
            print(f"    Bench: {p['bench']}")
            print(f"    Similarity Score: {p['similarity_score'] * 100:.2f}%")
            print(f"    Excerpt: {p['document_text'][:300].replace('\n', ' ')}...")
        return

    print("\n[2/3] Stage 1: Formulating Targeted Supreme Court Judicial Queries...")
    query_gen = QueryGeneratorService(groq)
    factual_context = query_gen.generate_queries_and_facts(case_text)
    queries = factual_context.get("search_queries", [])
    
    print("      Formulated Judicial Queries:")
    for idx, q in enumerate(queries, 1):
        print(f"        {idx}. {q}")

    # 3. Stage 2: ChromaDB Retrieval
    print("\n[3/3] Stage 2: Retrieving Authentic Precedents via Local Legal-BERT...")
    t_ret = time.time()
    retrieved = engine.retrieve_top_precedents(queries, top_k=settings.TOP_K_PER_QUERY, max_total=settings.MAX_TOTAL_PRECEDENTS)
    print(f"      Retrieved {len(retrieved)} deduplicated chunks in {time.time()-t_ret:.2f}s")

    # 4. Stage 3: Argument Synthesis
    print("\n      Stage 3: Synthesizing Precedent-Grounded Brief & Court Arguments...")
    synthesizer = ArgumentSynthesizerService(groq)
    response = synthesizer.synthesize_arguments(
        factual_context=factual_context,
        retrieved_precedents=retrieved,
        representing_side=args.side,
        generated_queries=queries,
        start_time=start_total
    )

    # 5. Display Formatted Brief & Arguments
    print_header("Executive Case Brief")
    print(f"SUMMARY OF FACTS:\n{response.executive_brief.summary_of_facts}\n")
    print("KEY LEGAL ISSUES:")
    for issue in response.executive_brief.key_legal_issues:
        print(f"  - {issue}")
    if response.executive_brief.applicable_statutes:
        print("\nAPPLICABLE STATUTORY PROVISIONS:")
        for stat in response.executive_brief.applicable_statutes:
            print(f"  - {stat}")

    print_header(f"Court-Ready Legal Arguments (For: {args.side})")
    for arg in response.arguments:
        print(f"\nARGUMENT #{arg.argument_number}: {arg.title}")
        print("-" * 70)
        print(f"RATIO & REASONING:\n{arg.detailed_reasoning}\n")
        
        print("SUPPORTING PRECEDENTS:")
        for prec in arg.supporting_precedents:
            print(f"  [*] Case:  {prec.case_name} ({prec.year})")
            if prec.bench:
                print(f"      Bench: {prec.bench}")
            print(f"      Score: {prec.similarity_score * 100:.2f}% Match")
            print(f"      Quote: \"{prec.verbatim_quote.strip()}\"")
            print()

        print(f"ANTICIPATED COUNTER-ARGUMENT:\n  {arg.anticipated_counter_argument}\n")
        print(f"REBUTTAL STRATEGY:\n  {arg.rebuttal}")
        print("=" * 70)

    print(f"\n[Completed in {response.processing_time_seconds}s | Retrieved Precedents: {response.retrieved_precedents_count}]")

if __name__ == "__main__":
    main()
