import re
import uuid
import time
from datetime import datetime
from typing import Dict, Any, List, Optional
try:
    import pymupdf as fitz
except ImportError:
    import fitz

from app.schemas import (
    ReportGenerationRequest,
    LegalReportResponse,
    ExecutiveBrief,
    LegalArgument,
    SupportingPrecedent,
    PrecedentCitation
)
from app.services.vector_engine import VectorEngine
from app.services.groq_service import GroqService
from app.services.query_generator import QueryGeneratorService
from app.services.argument_synthesizer import ArgumentSynthesizerService

class ReportGeneratorService:
    def __init__(self):
        self.vector_engine = VectorEngine.get_instance()
        self.groq_service = GroqService()

    def generate_report(self, request: ReportGenerationRequest) -> LegalReportResponse:
        """
        Synthesizes a formal Supreme Court Precedent Analysis & Strategy Report
        from case context, pre-existing brief/arguments, or chat history.
        """
        start_time = time.time()
        report_id = f"SCR-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        report_title = request.title or "SUPREME COURT PRECEDENT ANALYSIS & CASE STRATEGY REPORT"
        generated_at = datetime.now().strftime("%d %B %Y, %I:%M %p")

        executive_brief = request.executive_brief
        arguments = request.arguments or []

        # If executive brief or arguments are missing, generate them from case context or chat
        if not executive_brief or not arguments:
            combined_text = request.case_context or ""
            if request.conversation_history:
                history_texts = []
                for turn in request.conversation_history:
                    prefix = "Counsel: " if turn.role == "user" else "Advocate: "
                    history_texts.append(f"{prefix}{turn.content}")
                combined_text += "\n\n=== CASE CONSULTATION TRANSCRIPT ===\n" + "\n".join(history_texts)

            if not combined_text.strip():
                combined_text = "Case submitted for Supreme Court precedent analysis."

            # Run Stage 1 & Stage 2 & Stage 3
            q_gen = QueryGeneratorService(self.groq_service)
            factual_context = q_gen.generate_queries_and_facts(combined_text)
            queries = factual_context.get("search_queries", [combined_text[:200]])

            retrieved = self.vector_engine.retrieve_top_precedents(queries, top_k=5, max_total=8)

            synthesizer = ArgumentSynthesizerService(self.groq_service)
            analysis_resp = synthesizer.synthesize_arguments(
                factual_context=factual_context,
                retrieved_precedents=retrieved,
                representing_side=request.representing_side,
                generated_queries=queries,
                start_time=start_time
            )

            executive_brief = analysis_resp.executive_brief
            arguments = analysis_resp.arguments

        # Compile Table of Authorities from arguments
        table_of_authorities: List[PrecedentCitation] = []
        seen_cases = set()

        for arg in arguments:
            for prec in arg.supporting_precedents:
                case_key = (prec.case_name, prec.year)
                if case_key not in seen_cases:
                    seen_cases.add(case_key)
                    bench_str = prec.bench or "Supreme Court of India"
                    tag = f"[Citation: {prec.case_name} ({prec.year}) | Bench: {bench_str} | Match: {prec.similarity_score * 100:.1f}%]"
                    table_of_authorities.append(
                        PrecedentCitation(
                            case_name=prec.case_name,
                            year=prec.year,
                            bench=bench_str,
                            file_name=prec.file_name,
                            verbatim_quote=prec.verbatim_quote,
                            similarity_score=prec.similarity_score,
                            citation_tag=tag,
                            chunk_id=prec.chunk_id
                        )
                    )

        # Generate Markdown & HTML representations
        markdown_content = self._render_markdown(
            report_id=report_id,
            title=report_title,
            generated_at=generated_at,
            representing_side=request.representing_side,
            executive_brief=executive_brief,
            arguments=arguments,
            table_of_authorities=table_of_authorities
        )

        html_content = self._render_html(
            report_id=report_id,
            title=report_title,
            generated_at=generated_at,
            representing_side=request.representing_side,
            executive_brief=executive_brief,
            arguments=arguments,
            table_of_authorities=table_of_authorities
        )

        total_time = round(time.time() - start_time, 2)

        return LegalReportResponse(
            report_id=report_id,
            title=report_title,
            generated_at=generated_at,
            representing_side=request.representing_side,
            executive_brief=executive_brief,
            arguments=arguments,
            table_of_authorities=table_of_authorities,
            markdown_content=markdown_content,
            html_content=html_content,
            total_precedents_cited=len(table_of_authorities),
            processing_time_seconds=total_time
        )

    def generate_pdf_bytes(self, report: LegalReportResponse) -> bytes:
        """
        Generates a clean, professional, multi-page legal brief PDF using PyMuPDF.
        """
        doc = fitz.open()
        
        # Geometry & margins
        PAGE_W, PAGE_H = 595, 842  # A4 standard
        MARGIN_L, MARGIN_R = 54, 541
        MARGIN_T, MARGIN_B = 60, 782
        LINE_H = 15

        def create_page():
            p = doc.new_page(width=PAGE_W, height=PAGE_H)
            # Running header
            p.insert_text(
                (MARGIN_L, 40),
                f"SUPREME COURT PRECEDENT ANALYSIS REPORT  |  REF: {report.report_id}",
                fontsize=8,
                color=(0.4, 0.4, 0.4)
            )
            # Header line
            p.draw_line(fitz.Point(MARGIN_L, 46), fitz.Point(MARGIN_R, 46), color=(0.7, 0.7, 0.7), width=0.5)
            # Running footer
            p.draw_line(fitz.Point(MARGIN_L, MARGIN_B), fitz.Point(MARGIN_R, MARGIN_B), color=(0.7, 0.7, 0.7), width=0.5)
            p.insert_text(
                (MARGIN_L, MARGIN_B + 16),
                f"Confidential  |  Prepared for Court Submissions  |  Side: {report.representing_side}",
                fontsize=8,
                color=(0.4, 0.4, 0.4)
            )
            return p

        page = create_page()
        y = 75

        # Cover Title
        page.insert_text((MARGIN_L, y), report.title, fontsize=15, fontname="helv", color=(0.08, 0.18, 0.36))
        y += 20
        page.insert_text(
            (MARGIN_L, y), 
            f"Generated: {report.generated_at}   |   Stance: {report.representing_side}", 
            fontsize=9, 
            color=(0.3, 0.3, 0.3)
        )
        y += 25
        page.draw_line(fitz.Point(MARGIN_L, y), fitz.Point(MARGIN_R, y), color=(0.08, 0.18, 0.36), width=1.5)
        y += 20

        # Helper to wrap text
        def write_paragraph(text: str, fontsize=9.5, fontname="helv", color=(0.1, 0.1, 0.1), indent=0, spacing=4):
            nonlocal page, y
            words = text.split()
            current_line = []
            max_w = (MARGIN_R - MARGIN_L) - indent

            for word in words:
                test_line = " ".join(current_line + [word])
                text_w = fitz.get_text_length(test_line, fontname=fontname, fontsize=fontsize)
                if text_w <= max_w:
                    current_line.append(word)
                else:
                    if y > MARGIN_B - 25:
                        page = create_page()
                        y = 70
                    line_str = " ".join(current_line)
                    page.insert_text((MARGIN_L + indent, y), line_str, fontsize=fontsize, fontname=fontname, color=color)
                    y += LINE_H
                    current_line = [word]

            if current_line:
                if y > MARGIN_B - 25:
                    page = create_page()
                    y = 70
                line_str = " ".join(current_line)
                page.insert_text((MARGIN_L + indent, y), line_str, fontsize=fontsize, fontname=fontname, color=color)
                y += LINE_H + spacing

        def write_heading(title: str, level=1):
            nonlocal page, y
            if y > MARGIN_B - 45:
                page = create_page()
                y = 70
            y += 10
            if level == 1:
                page.insert_text((MARGIN_L, y), title.upper(), fontsize=11, fontname="helv", color=(0.08, 0.18, 0.36))
                y += 14
                page.draw_line(fitz.Point(MARGIN_L, y - 2), fitz.Point(MARGIN_L + 120, y - 2), color=(0.08, 0.18, 0.36), width=1.0)
                y += 6
            elif level == 2:
                page.insert_text((MARGIN_L, y), title, fontsize=10, fontname="helv", color=(0.15, 0.25, 0.45))
                y += 14

        # Part I: Executive Brief
        write_heading("I. Executive Case Brief & Factual Matrix", 1)
        write_paragraph(report.executive_brief.summary_of_facts, fontsize=9.5)

        write_heading("Formulated Legal Questions / Issues", 2)
        for idx, issue in enumerate(report.executive_brief.key_legal_issues, 1):
            write_paragraph(f"{idx}. {issue}", fontsize=9, indent=12)

        if report.executive_brief.applicable_statutes:
            write_heading("Governing Statutes & Provisions", 2)
            statute_str = " • ".join(report.executive_brief.applicable_statutes)
            write_paragraph(statute_str, fontsize=9, indent=12)

        # Part II: Court-Ready Legal Arguments
        write_heading("II. Court-Ready Legal Arguments & Ratio Application", 1)
        for arg in report.arguments:
            write_heading(f"Argument #{arg.argument_number}: {arg.title}", 2)
            write_paragraph(arg.detailed_reasoning, fontsize=9.5)

            # Precedents
            if arg.supporting_precedents:
                for prec in arg.supporting_precedents:
                    prec_header = f"[*] {prec.case_name} ({prec.year}) | Bench: {prec.bench or 'Supreme Court of India'} [Match: {prec.similarity_score * 100:.1f}%]"
                    write_paragraph(prec_header, fontsize=8.5, fontname="helv", color=(0.08, 0.25, 0.15), indent=10)
                    quote_text = f"\"{prec.verbatim_quote.strip()}\""
                    write_paragraph(quote_text, fontsize=8.5, color=(0.25, 0.25, 0.25), indent=18)

            # Counter & Rebuttal
            write_paragraph(f"Anticipated Objection: {arg.anticipated_counter_argument}", fontsize=8.5, color=(0.45, 0.1, 0.1), indent=10)
            write_paragraph(f"Strategic Rebuttal: {arg.rebuttal}", fontsize=8.5, color=(0.05, 0.35, 0.15), indent=10)
            y += 6

        # Part III: Table of Authorities
        write_heading("III. Table of Authorities (Supreme Court of India)", 1)
        for idx, auth in enumerate(report.table_of_authorities, 1):
            line = f"{idx}. {auth.case_name} ({auth.year}) - Bench: {auth.bench} (Similarity: {auth.similarity_score * 100:.1f}%)"
            write_paragraph(line, fontsize=8.5, indent=8)

        pdf_bytes = doc.tobytes()
        doc.close()
        return pdf_bytes

    def _render_markdown(
        self,
        report_id: str,
        title: str,
        generated_at: str,
        representing_side: str,
        executive_brief: ExecutiveBrief,
        arguments: List[LegalArgument],
        table_of_authorities: List[PrecedentCitation]
    ) -> str:
        md = []
        md.append(f"# {title}")
        md.append(f"**Reference ID:** `{report_id}`  |  **Date:** {generated_at}  |  **Representing:** {representing_side}\n")
        md.append("---\n")

        md.append("## Part I: Executive Case Brief & Procedural Matrix\n")
        md.append("### Summary of Operative Facts")
        md.append(f"{executive_brief.summary_of_facts}\n")

        md.append("### Formulated Legal Questions / Issues")
        for idx, issue in enumerate(executive_brief.key_legal_issues, 1):
            md.append(f"{idx}. {issue}")
        md.append("")

        if executive_brief.applicable_statutes:
            md.append("### Governing Statutory & Constitutional Framework")
            for statute in executive_brief.applicable_statutes:
                md.append(f"- **{statute}**")
            md.append("")

        md.append("---\n")
        md.append(f"## Part II: Substantive Court-Ready Arguments (For: {representing_side})\n")

        for arg in arguments:
            md.append(f"### Argument #{arg.argument_number}: {arg.title}\n")
            md.append(f"**Ratio Decidendi & Legal Reasoning:**\n{arg.detailed_reasoning}\n")

            if arg.supporting_precedents:
                md.append("**Supporting Supreme Court Precedents:**")
                for prec in arg.supporting_precedents:
                    bench_str = prec.bench or "Supreme Court of India"
                    md.append(f"- **{prec.case_name} ({prec.year})**  ")
                    md.append(f"  *Bench:* {bench_str}  |  *Relevance Match:* {prec.similarity_score * 100:.1f}%")
                    md.append(f"  > \"{prec.verbatim_quote.strip()}\"\n")

            md.append(f"**Anticipated Opposing Objection:**  \n{arg.anticipated_counter_argument}\n")
            md.append(f"**Strategic Court Rebuttal:**  \n{arg.rebuttal}\n")
            md.append("`" + "="*70 + "`\n")

        md.append("## Part III: Table of Authorities (Supreme Court of India - 5 Year Bundle)\n")
        md.append("| # | Case Name | Year | Bench | Match Score | Citation Tag |")
        md.append("|---|---|---|---|---|---|")
        for idx, auth in enumerate(table_of_authorities, 1):
            md.append(f"| {idx} | **{auth.case_name}** | {auth.year} | {auth.bench} | {auth.similarity_score*100:.1f}% | `{auth.citation_tag}` |")
        md.append("")

        md.append("---\n*End of Supreme Court Precedent Strategy Report. Prepared for Court Submissions.*")
        return "\n".join(md)

    def _render_html(
        self,
        report_id: str,
        title: str,
        generated_at: str,
        representing_side: str,
        executive_brief: ExecutiveBrief,
        arguments: List[LegalArgument],
        table_of_authorities: List[PrecedentCitation]
    ) -> str:
        html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>{title} - {report_id}</title>
<style>
  body {{
    font-family: 'Georgia', 'Times New Roman', serif;
    line-height: 1.6;
    color: #1a1a1a;
    background-color: #fafafa;
    margin: 0;
    padding: 30px;
  }}
  .report-container {{
    max-width: 900px;
    margin: 0 auto;
    background: #ffffff;
    padding: 50px 60px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.08);
    border: 1px solid #e0e0e0;
  }}
  .header-block {{
    border-bottom: 3px double #1b365d;
    padding-bottom: 20px;
    margin-bottom: 35px;
    text-align: center;
  }}
  .court-badge {{
    font-size: 13px;
    letter-spacing: 2px;
    text-transform: uppercase;
    color: #8c6d3b;
    font-weight: bold;
    margin-bottom: 8px;
  }}
  h1 {{
    font-size: 24px;
    color: #1b365d;
    margin: 0 0 12px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }}
  .meta-bar {{
    font-size: 12px;
    color: #555;
    display: flex;
    justify-content: space-between;
    margin-top: 15px;
  }}
  h2 {{
    font-size: 17px;
    color: #1b365d;
    border-bottom: 1px solid #dcdcdc;
    padding-bottom: 6px;
    margin-top: 35px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }}
  h3 {{
    font-size: 15px;
    color: #2b4c7e;
    margin-top: 25px;
  }}
  .citation-card {{
    background: #f4f7fa;
    border-left: 4px solid #1b365d;
    padding: 12px 16px;
    margin: 15px 0;
    font-size: 13.5px;
  }}
  .quote-box {{
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-left: 3px solid #8c6d3b;
    padding: 10px 14px;
    margin: 8px 0;
    font-style: italic;
    font-size: 13px;
    color: #2d3748;
  }}
  .counter-box {{
    background: #fff5f5;
    border-left: 3px solid #e53e3e;
    padding: 8px 12px;
    margin-top: 10px;
    font-size: 13px;
  }}
  .rebuttal-box {{
    background: #f0fff4;
    border-left: 3px solid #38a169;
    padding: 8px 12px;
    margin-top: 6px;
    font-size: 13px;
  }}
  table {{
    width: 100%;
    border-collapse: collapse;
    margin-top: 15px;
    font-size: 12.5px;
  }}
  th, td {{
    border: 1px solid #cbd5e0;
    padding: 8px 12px;
    text-align: left;
  }}
  th {{
    background: #1b365d;
    color: white;
  }}
  .footer {{
    margin-top: 50px;
    border-top: 1px solid #e2e8f0;
    padding-top: 15px;
    font-size: 11px;
    text-align: center;
    color: #718096;
  }}
  @media print {{
    body {{ background: white; padding: 0; }}
    .report-container {{ box-shadow: none; border: none; padding: 0; }}
    .page-break {{ page-break-before: always; }}
  }}
</style>
</head>
<body>
<div class="report-container">
  <div class="header-block">
    <div class="court-badge">Supreme Court of India Precedent Repository</div>
    <h1>{title}</h1>
    <div class="meta-bar">
      <span><strong>REF:</strong> {report_id}</span>
      <span><strong>STANCE:</strong> {representing_side}</span>
      <span><strong>DATE:</strong> {generated_at}</span>
    </div>
  </div>

  <h2>I. Executive Case Brief & Procedural Matrix</h2>
  <p>{executive_brief.summary_of_facts}</p>

  <h3>Key Formulated Legal Questions</h3>
  <ol>
    {"".join(f"<li>{q}</li>" for q in executive_brief.key_legal_issues)}
  </ol>

  <h3>Governing Statutory Framework</h3>
  <p>{" &bull; ".join(executive_brief.applicable_statutes)}</p>

  <h2>II. Substantive Legal Arguments & Ratio Application</h2>
"""
        for arg in arguments:
            html += f"""
  <div style="margin-bottom: 30px;">
    <h3>Argument #{arg.argument_number}: {arg.title}</h3>
    <p>{arg.detailed_reasoning}</p>
"""
            for prec in arg.supporting_precedents:
                bench = prec.bench or "Supreme Court of India"
                score = round(prec.similarity_score * 100, 1)
                html += f"""
    <div class="citation-card">
      <strong>{prec.case_name} ({prec.year})</strong> &mdash; <em>Bench: {bench}</em> [Relevance Match: {score}%]
      <div class="quote-box">"{prec.verbatim_quote.strip()}"</div>
    </div>
"""
            html += f"""
    <div class="counter-box"><strong>Anticipated Objection:</strong> {arg.anticipated_counter_argument}</div>
    <div class="rebuttal-box"><strong>Strategic Court Rebuttal:</strong> {arg.rebuttal}</div>
  </div>
"""

        html += f"""
  <div class="page-break"></div>
  <h2>III. Table of Authorities (Supreme Court of India)</h2>
  <table>
    <thead>
      <tr>
        <th>#</th>
        <th>Case Title</th>
        <th>Year</th>
        <th>Bench</th>
        <th>Score</th>
      </tr>
    </thead>
    <tbody>
"""
        for idx, auth in enumerate(table_of_authorities, 1):
            html += f"""
      <tr>
        <td>{idx}</td>
        <td><strong>{auth.case_name}</strong></td>
        <td>{auth.year}</td>
        <td>{auth.bench}</td>
        <td>{auth.similarity_score * 100:.1f}%</td>
      </tr>
"""
        html += f"""
    </tbody>
  </table>

  <div class="footer">
    Supreme Court Precedent Analyzer & Legal Argument Engine &bull; Strictly Grounded in 5-Year Supreme Court Judgments
  </div>
</div>
</body>
</html>
"""
        return html
