import os
import sys
import time
import json
import io
import requests
import fitz  # PyMuPDF

# Guarantee UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

BASE_URL = "http://127.0.0.1:8000"

def log_section(title):
    print("\n" + "="*80)
    print(f" {title.upper()} ")
    print("="*80)

def generate_mock_legal_pdf(num_pages=3) -> bytes:
    doc = fitz.open()
    for page_idx in range(1, num_pages + 1):
        page = doc.new_page(width=595, height=842)
        y = 60
        page.insert_text((54, y), "IN THE SUPREME COURT OF INDIA", fontsize=12, fontname="helv", color=(0.1, 0.1, 0.5))
        y += 20
        page.insert_text((54, y), f"SPECIAL LEAVE PETITION (CIVIL) NO. 4410 OF 2026", fontsize=10, fontname="helv")
        y += 18
        page.insert_text((54, y), "MEMORANDUM OF WRIT PETITION UNDER ARTICLE 32 READ WITH ARTICLE 21", fontsize=9, fontname="helv")
        y += 25
        page.draw_line(fitz.Point(54, y), fitz.Point(541, y), color=(0.7, 0.7, 0.7), width=1)
        y += 20

        paragraphs = [
            f"--- PAGE {page_idx} OF {num_pages}: RECORD OF PROCEEDINGS ---",
            "1. The Petitioner is a citizen of India whose fundamental rights under Article 19(1)(a) and Article 21 have been breached by illegal state surveillance and interception under Section 5(2) of the Indian Telegraph Act, 1885.",
            "2. Statutory interception must satisfy the triple test of legality, legitimate state aim, and strict proportionality laid down in Justice K.S. Puttaswamy (Retd.) v. Union of India (2017) 10 SCC 1.",
            "3. The impugned orders fail to disclose any proximate threat to public emergency or public safety, which are jurisdictional prerequisites under Section 5(2) as held in People's Union for Civil Liberties (PUCL) v. Union of India (1997) 1 SCC 301.",
            "4. The Petitioner seeks quashing of surveillance orders and preservation of encrypted digital communications under Article 21.",
            "PRAYER: It is most respectfully prayed that this Hon'ble Court may be pleased to issue a Writ of Mandamus or any other appropriate writ directing the Respondents to cease electronic surveillance and produce authorization logs."
        ]
        for p in paragraphs:
            rect = fitz.Rect(54, y, 541, y + 45)
            page.insert_textbox(rect, p, fontsize=9, fontname="helv")
            y += 55
    pdf_bytes = doc.tobytes()
    doc.close()
    return pdf_bytes


def get_authenticated_session(base_url: str) -> requests.Session:
    """Authenticates counsel credentials using existing login/register mechanism."""
    session = requests.Session()
    creds = {
        "email": "counsel.stress@supreme-court.law",
        "password": "CounselPassword@123"
    }
    # 1. Attempt login first
    try:
        r = session.post(f"{base_url}/api/v1/auth/login", json=creds, timeout=10)
        if r.status_code == 200:
            token = r.json().get("access_token")
            session.headers.update({"Authorization": f"Bearer {token}"})
            print(f"[AUTH] Successfully logged in as {creds['email']}")
            return session
    except Exception as e:
        print(f"[AUTH] Login attempt failed: {e}")

    # 2. If login failed, attempt registration
    reg_payload = {
        "email": creds["email"],
        "full_name": "Advocate Test Stress Counsel",
        "password": creds["password"]
    }
    try:
        r = session.post(f"{base_url}/api/v1/auth/register", json=reg_payload, timeout=10)
        if r.status_code == 200:
            token = r.json().get("access_token")
            session.headers.update({"Authorization": f"Bearer {token}"})
            print(f"[AUTH] Successfully registered and authenticated as {creds['email']}")
            return session
    except Exception as e:
        print(f"[AUTH] Registration attempt failed: {e}")

    # 3. Fallback retry login if account already exists
    r = session.post(f"{base_url}/api/v1/auth/login", json=creds, timeout=10)
    if r.status_code == 200:
        token = r.json().get("access_token")
        session.headers.update({"Authorization": f"Bearer {token}"})
        print(f"[AUTH] Successfully logged in as {creds['email']}")
        return session

    raise RuntimeError(f"Failed to authenticate counsel session: {r.status_code} {r.text}")


def run_stress_tests():
    results = {
        "summary": {"total": 0, "passed": 0, "failed": 0},
        "tests": []
    }

    def record(name, category, passed, latency, details):
        results["summary"]["total"] += 1
        if passed:
            results["summary"]["passed"] += 1
        else:
            results["summary"]["failed"] += 1
        entry = {
            "name": name,
            "category": category,
            "passed": passed,
            "latency_sec": round(latency, 3),
            "details": details
        }
        results["tests"].append(entry)
        status = "PASS" if passed else "FAIL"
        msg = details.get('msg') or details.get('error') or f"Status: {details.get('status_code')}"
        # Sanitize message for printing
        safe_msg = str(msg).encode("ascii", errors="replace").decode("ascii")
        safe_name = str(name).encode("ascii", errors="replace").decode("ascii")
        print(f"[{status}] {safe_name} ({round(latency, 2)}s) - {safe_msg}")

    # ==========================================
    # 0. Health Pre-flight
    # ==========================================
    log_section("0. Pre-Flight Health Check")
    t0 = time.time()
    try:
        r = requests.get(f"{BASE_URL}/api/v1/health", timeout=10)
        lat = time.time() - t0
        data = r.json()
        passed = (r.status_code == 200 and data.get("status") == "healthy" and data.get("total_vectors", 0) > 70000)
        record("Health Check & Vector DB Count", "Health", passed, lat, {
            "status_code": r.status_code,
            "total_vectors": data.get("total_vectors"),
            "legal_bert": data.get("legal_bert_status"),
            "groq_configured": data.get("groq_configured"),
            "groq_model": data.get("groq_model"),
            "msg": f"Total vectors: {data.get('total_vectors'):,} | Legal-BERT: {data.get('legal_bert_status')} | Model: {data.get('groq_model')}"
        })
    except Exception as e:
        record("Health Check & Vector DB Count", "Health", False, time.time() - t0, {"error": str(e)})

    # ==========================================
    # 0B. Counsel Authentication
    # ==========================================
    log_section("0B. Counsel Authentication")
    session = get_authenticated_session(BASE_URL)

    # ==========================================
    # 1. Complex Legal Petition Ingestion (/api/v1/analyze-case)
    # ==========================================
    log_section("1. Complex Case Petition Ingestion")

    # 1A: Multi-paragraph text petition: IBC S. 14 vs NI Act S. 138
    t0 = time.time()
    petition_text_ibc = (
        "IN THE SUPREME COURT OF INDIA\n"
        "SPECIAL LEAVE PETITION (CRIMINAL) ARISING OUT OF HIGH COURT PROCEEDINGS\n"
        "PETITIONER: Suspended Director of M/s Apex Infrastructure Ltd.\n"
        "RESPONDENT: Nationalized Bank & Anr.\n\n"
        "FACTUAL MATRIX & GROUNDS:\n"
        "1. The Corporate Debtor was admitted into Corporate Insolvency Resolution Process (CIRP) by NCLT under Section 7 of the Insolvency and Bankruptcy Code, 2016 (IBC) on 12th January 2024, triggering the statutory moratorium under Section 14.\n"
        "2. Prior to the moratorium order, certain post-dated commercial cheques issued by the Corporate Debtor were dishonored upon presentation, leading the respondent payee to institute criminal proceedings under Section 138 of the Negotiable Instruments Act, 1881.\n"
        "3. The High Court rejected the Petitioner Director's application under Section 482 CrPC seeking quashing of the Section 138 proceedings, holding that criminal liability under the NI Act is not interdicted by the IBC moratorium.\n"
        "4. The primary legal issue is whether Section 14(1)(a) of IBC encompasses criminal complaints under Section 138 NI Act against the corporate debtor and whether natural persons (directors) can continue to be prosecuted during the moratorium period.\n"
        "5. The Petitioner places reliance on the landmark judgment of P. Mohanraj & Ors. v. Shah Brothers Ispat Pvt. Ltd. (2021) 6 SCC 258."
    )
    try:
        r = session.post(
            f"{BASE_URL}/api/v1/analyze-case",
            data={
                "case_description": petition_text_ibc,
                "representing_side": "Petitioner / Appellant"
            },
            timeout=120
        )
        lat = time.time() - t0
        if r.status_code == 200:
            data = r.json()
            args = data.get("arguments", [])
            retrieved_count = data.get("retrieved_precedents_count", 0)
            passed = (len(args) >= 1 and retrieved_count > 0 and "executive_brief" in data)
            first_title = args[0]["title"] if args else "N/A"
            record("Petition Ingestion: IBC S. 14 vs NI Act S. 138", "Ingestion", passed, lat, {
                "arguments_count": len(args),
                "retrieved_precedents": retrieved_count,
                "first_arg_title": first_title,
                "msg": f"Generated {len(args)} arguments, retrieved {retrieved_count} precedents"
            })
        else:
            record("Petition Ingestion: IBC S. 14 vs NI Act S. 138", "Ingestion", False, lat, {
                "status_code": r.status_code, "msg": r.text[:200]
            })
    except Exception as e:
        record("Petition Ingestion: IBC S. 14 vs NI Act S. 138", "Ingestion", False, time.time() - t0, {"error": str(e)})

    # 1B: Mock Multi-page PDF Upload: Art. 21 Surveillance & Telegraph Act
    time.sleep(1.5)
    t0 = time.time()
    mock_pdf_bytes = generate_mock_legal_pdf(num_pages=3)
    try:
        r = session.post(
            f"{BASE_URL}/api/v1/analyze-case",
            data={"representing_side": "Petitioner / Appellant"},
            files={"case_file": ("petition_art21_surveillance.pdf", mock_pdf_bytes, "application/pdf")},
            timeout=120
        )
        lat = time.time() - t0
        if r.status_code == 200:
            data = r.json()
            args = data.get("arguments", [])
            retrieved_count = data.get("retrieved_precedents_count", 0)
            passed = (len(args) >= 1 and retrieved_count > 0)
            first_title = args[0]["title"] if args else "N/A"
            record("PDF Ingestion: 3-Page SLP on Art. 21 Surveillance", "Ingestion", passed, lat, {
                "arguments_count": len(args),
                "retrieved_precedents": retrieved_count,
                "first_arg_title": first_title,
                "msg": f"Parsed 3-page PDF: {len(args)} arguments generated"
            })
        else:
            record("PDF Ingestion: 3-Page SLP on Art. 21 Surveillance", "Ingestion", False, lat, {
                "status_code": r.status_code, "msg": r.text[:200]
            })
    except Exception as e:
        record("PDF Ingestion: 3-Page SLP on Art. 21 Surveillance", "Ingestion", False, time.time() - t0, {"error": str(e)})

    # 1C: Hybrid Ingestion (Form text + PDF file)
    time.sleep(1.5)
    t0 = time.time()
    try:
        r = session.post(
            f"{BASE_URL}/api/v1/analyze-case",
            data={
                "case_description": "Additional factual note: Interception orders were renewed 6 times without high-level committee review.",
                "representing_side": "Petitioner / Appellant"
            },
            files={"case_file": ("petition_art21_surveillance.pdf", mock_pdf_bytes, "application/pdf")},
            timeout=120
        )
        lat = time.time() - t0
        if r.status_code == 200:
            data = r.json()
            args = data.get("arguments", [])
            passed = len(args) >= 1
            record("Hybrid Ingestion: Form Text + PDF File", "Ingestion", passed, lat, {
                "arguments_count": len(args),
                "msg": f"Combined prompt generated {len(args)} arguments"
            })
        else:
            record("Hybrid Ingestion: Form Text + PDF File", "Ingestion", False, lat, {
                "status_code": r.status_code, "msg": r.text[:200]
            })
    except Exception as e:
        record("Hybrid Ingestion: Form Text + PDF File", "Ingestion", False, time.time() - t0, {"error": str(e)})

    # ==========================================
    # 2. Multi-Turn Conversational RAG (/api/v1/chat)
    # ==========================================
    log_section("2. Multi-Turn Conversational RAG")

    chat_history = []
    case_context = (
        "Criminal SLP under Article 136: Accused charged under Sections 409, 420, 120B IPC and Sections 3 & 4 of Prevention of Money Laundering Act (PMLA). "
        "Petitioner has been in custody for 14 months without commencement of trial. Section 45 PMLA twin conditions vs Article 21 right to speedy trial."
    )

    # Turn 1: Initial query on bail & Article 21
    time.sleep(1.5)
    t0 = time.time()
    t1_payload = {
        "message": "Can the Petitioner be granted regular bail or anticipatory bail despite Section 45 PMLA twin conditions, given protracted pre-trial incarceration violating Article 21?",
        "representing_side": "Petitioner / Appellant",
        "case_context": case_context,
        "conversation_history": chat_history
    }
    try:
        r = session.post(f"{BASE_URL}/api/v1/chat", json=t1_payload, timeout=60)
        lat = time.time() - t0
        if r.status_code == 200:
            data = r.json()
            reply = data.get("reply", "")
            citations = data.get("citations", [])
            retrieved = data.get("retrieved_precedents", [])
            has_citation_badge = "[Citation:" in reply or len(citations) > 0
            passed = (len(reply) > 150 and len(retrieved) > 0 and has_citation_badge)
            record("Chat Turn 1: PMLA Bail vs Article 21 Speedy Trial", "Chat", passed, lat, {
                "reply_length": len(reply),
                "citations_count": len(citations),
                "retrieved_count": len(retrieved),
                "has_citation_badge": has_citation_badge,
                "msg": f"Reply length: {len(reply)} chars | Citations: {len(citations)} | Precedents: {len(retrieved)}"
            })
            chat_history.append({"role": "user", "content": t1_payload["message"]})
            chat_history.append({"role": "assistant", "content": reply})
        else:
            record("Chat Turn 1: PMLA Bail vs Article 21 Speedy Trial", "Chat", False, lat, {
                "status_code": r.status_code, "msg": r.text[:200]
            })
    except Exception as e:
        record("Chat Turn 1: PMLA Bail vs Article 21 Speedy Trial", "Chat", False, time.time() - t0, {"error": str(e)})

    # Turn 2: Follow-up query maintaining multi-turn context
    time.sleep(2.0)
    t0 = time.time()
    t2_payload = {
        "message": "The Enforcement Directorate (ED) will argue that economic offences constitute a distinct class and delay cannot override Section 45. What exact counter-argument and recent Supreme Court quote should I read to the Bench?",
        "representing_side": "Petitioner / Appellant",
        "case_context": case_context,
        "conversation_history": chat_history
    }
    try:
        r = session.post(f"{BASE_URL}/api/v1/chat", json=t2_payload, timeout=60)
        lat = time.time() - t0
        if r.status_code == 200:
            data = r.json()
            reply = data.get("reply", "")
            citations = data.get("citations", [])
            retrieved = data.get("retrieved_precedents", [])
            has_quote = ('"' in reply or '“' in reply or '>' in reply)
            passed = (len(reply) > 150 and len(retrieved) > 0 and has_quote)
            record("Chat Turn 2: Countering ED Objections & Verbatim Quotes", "Chat", passed, lat, {
                "reply_length": len(reply),
                "citations_count": len(citations),
                "retrieved_count": len(retrieved),
                "has_verbatim_quote": has_quote,
                "msg": f"Contextual response length: {len(reply)} chars | Precedents: {len(retrieved)}"
            })
            chat_history.append({"role": "user", "content": t2_payload["message"]})
            chat_history.append({"role": "assistant", "content": reply})
        else:
            record("Chat Turn 2: Countering ED Objections & Verbatim Quotes", "Chat", False, lat, {
                "status_code": r.status_code, "msg": r.text[:200]
            })
    except Exception as e:
        record("Chat Turn 2: Countering ED Objections & Verbatim Quotes", "Chat", False, time.time() - t0, {"error": str(e)})

    # Turn 3: Swapping stance to Respondent / Defense
    time.sleep(2.0)
    t0 = time.time()
    t3_payload = {
        "message": "If instructed by the Respondent / State, how would we establish that flight risk and tampering with money trails justify denial of bail?",
        "representing_side": "Respondent / Defense",
        "case_context": case_context,
        "conversation_history": chat_history
    }
    try:
        r = session.post(f"{BASE_URL}/api/v1/chat", json=t3_payload, timeout=60)
        lat = time.time() - t0
        if r.status_code == 200:
            data = r.json()
            reply = data.get("reply", "")
            passed = (len(reply) > 150 and data.get("representing_side") == "Respondent / Defense")
            record("Chat Turn 3: Stance Inversion to Respondent / Defense", "Chat", passed, lat, {
                "reply_length": len(reply),
                "representing_side": data.get("representing_side"),
                "msg": f"Shifted stance to {data.get('representing_side')} | Length: {len(reply)} chars"
            })
        else:
            record("Chat Turn 3: Stance Inversion to Respondent / Defense", "Chat", False, lat, {
                "status_code": r.status_code, "msg": r.text[:200]
            })
    except Exception as e:
        record("Chat Turn 3: Stance Inversion to Respondent / Defense", "Chat", False, time.time() - t0, {"error": str(e)})

    # ==========================================
    # 3. Extreme Edge Cases & Boundaries
    # ==========================================
    log_section("3. Extreme Edge Cases & Boundaries")

    # 3A: Empty string message to /api/v1/chat
    t0 = time.time()
    try:
        r = session.post(
            f"{BASE_URL}/api/v1/chat",
            json={"message": "", "representing_side": "Petitioner / Appellant"},
            timeout=10
        )
        lat = time.time() - t0
        passed = (r.status_code in (400, 422))
        record("Edge Case: Empty Prompt in Chat", "EdgeCases", passed, lat, {
            "status_code": r.status_code,
            "msg": f"HTTP {r.status_code} properly rejected: {r.json().get('detail', '')}"
        })
    except Exception as e:
        record("Edge Case: Empty Prompt in Chat", "EdgeCases", False, time.time() - t0, {"error": str(e)})

    # 3B: Whitespace-only string in chat
    t0 = time.time()
    try:
        r = session.post(
            f"{BASE_URL}/api/v1/chat",
            json={"message": "   \n\t\r   \n   ", "representing_side": "Petitioner / Appellant"},
            timeout=10
        )
        lat = time.time() - t0
        passed = (r.status_code in (400, 422))
        record("Edge Case: Whitespace-Only Message in Chat", "EdgeCases", passed, lat, {
            "status_code": r.status_code,
            "msg": f"HTTP {r.status_code} properly rejected: {r.json().get('detail', '')}"
        })
    except Exception as e:
        record("Edge Case: Whitespace-Only Message in Chat", "EdgeCases", False, time.time() - t0, {"error": str(e)})

    # 3C: Sub-minimum substantive text (< 20 chars) in /api/v1/analyze-case
    t0 = time.time()
    try:
        r = session.post(
            f"{BASE_URL}/api/v1/analyze-case",
            data={"case_description": "Grant bail."},
            timeout=10
        )
        lat = time.time() - t0
        passed = (r.status_code == 400 and "too brief" in r.text.lower())
        detail_msg = ""
        try:
            detail_msg = r.json().get('detail', '')
        except Exception:
            detail_msg = r.text[:100]
        record("Edge Case: Sub-minimum Case Text (<20 chars)", "EdgeCases", passed, lat, {
            "status_code": r.status_code,
            "msg": f"HTTP {r.status_code} caught sub-minimum text: '{detail_msg}'"
        })
    except Exception as e:
        record("Edge Case: Sub-minimum Case Text (<20 chars)", "EdgeCases", False, time.time() - t0, {"error": str(e)})

    # 3D: Unicode and Special Legal Characters
    time.sleep(2.0)
    t0 = time.time()
    unicode_legal_query = (
        "Regarding Section 438 Cr.P.C. paragraphs 12 to 18; Copyright 2026; Re: ABC Corp. vs. Union of India [W.P.(C) No. 99/2026]; "
        "Test of audi alteram partem & ultra vires; Disputed amount: Rs. 50,00,00,000/-; "
        "Does ratio decidendi bind the High Court under Article 141? Special legal symbols: §, ¶, ©, ⚖, ₹, №, quotes “text” & ‘text’, dash — and arrows →."
    )
    try:
        r = session.post(
            f"{BASE_URL}/api/v1/chat",
            json={"message": unicode_legal_query, "representing_side": "Petitioner / Appellant"},
            timeout=60
        )
        lat = time.time() - t0
        if r.status_code == 200:
            data = r.json()
            passed = len(data.get("reply", "")) > 100
            record("Edge Case: Unicode & Legal Symbols (§, ¶, ©, ⚖, ₹, №)", "EdgeCases", passed, lat, {
                "reply_length": len(data.get("reply", "")),
                "citations_count": len(data.get("citations", [])),
                "msg": f"Unicode preserved and answered properly (length {len(data.get('reply', ''))} chars)"
            })
        else:
            record("Edge Case: Unicode & Legal Symbols (§, ¶, ©, ⚖, ₹, №)", "EdgeCases", False, lat, {
                "status_code": r.status_code, "msg": r.text[:200]
            })
    except Exception as e:
        record("Edge Case: Unicode & Legal Symbols (§, ¶, ©, ⚖, ₹, №)", "EdgeCases", False, time.time() - t0, {"error": str(e)})

    # 3E: Corrupted / Malformed PDF File
    t0 = time.time()
    corrupt_bytes = b"CORRUPTED_BINARY_NOT_A_REAL_PDF_DATA\x00\xff\xfe\xaa\xbb\xcc" * 20
    try:
        r = session.post(
            f"{BASE_URL}/api/v1/analyze-case",
            data={"representing_side": "Petitioner / Appellant"},
            files={"case_file": ("corrupt_file.pdf", corrupt_bytes, "application/pdf")},
            timeout=15
        )
        lat = time.time() - t0
        passed = (r.status_code == 422 and ("failed to parse pdf" in r.text.lower() or "invalid pdf" in r.text.lower()))
        record("Edge Case: Corrupted PDF Upload Handling", "EdgeCases", passed, lat, {
            "status_code": r.status_code,
            "msg": f"HTTP {r.status_code} caught corrupted PDF: '{r.json().get('detail','')}'"
        })
    except Exception as e:
        record("Edge Case: Corrupted PDF Upload Handling", "EdgeCases", False, time.time() - t0, {"error": str(e)})

    # 3F: Extreme Token Sequence (Long text > 10,000 characters)
    time.sleep(1.5)
    t0 = time.time()
    base_paragraph = (
        "The Petitioner submits that under Article 226 and Article 32 of the Constitution of India, "
        "the exercise of power by investigating agencies must conform strictly to procedural fairness "
        "and substantive due process as enshrined under Articles 14, 19, and 21. Arbitrary arrests under "
        "special statutes such as the Prevention of Money Laundering Act, 2002 without furnishing written "
        "grounds of arrest at the time of apprehension violates the mandate of Article 22(1) and the law "
        "declared by this Hon'ble Court in Pankaj Bansal v. Union of India. Furthermore, mechanical remand orders "
        "without judicial application of mind infringe personal liberty. "
    )
    long_petition_text = "IN THE SUPREME COURT OF INDIA\n\n" + (base_paragraph * 25)  # ~11,000 chars
    try:
        r = session.post(
            f"{BASE_URL}/api/v1/analyze-case",
            data={
                "case_description": long_petition_text,
                "representing_side": "Petitioner / Appellant"
            },
            timeout=120
        )
        lat = time.time() - t0
        if r.status_code == 200:
            data = r.json()
            args = data.get("arguments", [])
            passed = len(args) >= 1
            record("Edge Case: Extreme Token Sequence (11,000+ chars)", "EdgeCases", passed, lat, {
                "input_char_length": len(long_petition_text),
                "arguments_generated": len(args),
                "retrieved_precedents": data.get("retrieved_precedents_count"),
                "msg": f"Processed {len(long_petition_text):,} characters, produced {len(args)} arguments"
            })
        else:
            record("Edge Case: Extreme Token Sequence (11,000+ chars)", "EdgeCases", False, lat, {
                "status_code": r.status_code, "msg": r.text[:200]
            })
    except Exception as e:
        record("Edge Case: Extreme Token Sequence (11,000+ chars)", "EdgeCases", False, time.time() - t0, {"error": str(e)})

    # ==========================================
    # 4. Report Generation & PDF/HTML Export
    # ==========================================
    log_section("4. Report Generation & PDF Export")

    report_payload = {
        "title": "STRATEGY REPORT: PMLA TWIN CONDITIONS VS SPEEDY TRIAL ARTICLE 21",
        "representing_side": "Petitioner / Appellant",
        "case_context": case_context,
        "conversation_history": [
            {"role": "user", "content": "How do we secure bail under PMLA when trial is delayed?"},
            {"role": "assistant", "content": "Rely on Article 21 constitutional supremacy over statutory embargos under Section 45 PMLA."}
        ]
    }

    # 4A: /api/v1/generate-report (JSON + Markdown + HTML)
    t0 = time.time()
    try:
        r = session.post(f"{BASE_URL}/api/v1/generate-report", json=report_payload, timeout=90)
        lat = time.time() - t0
        if r.status_code == 200:
            data = r.json()
            passed = (
                "report_id" in data and
                len(data.get("arguments", [])) > 0 and
                len(data.get("table_of_authorities", [])) > 0 and
                len(data.get("markdown_content", "")) > 200 and
                len(data.get("html_content", "")) > 200
            )
            record("Report Generation: JSON / Markdown / HTML", "Report", passed, lat, {
                "report_id": data.get("report_id"),
                "arguments_count": len(data.get("arguments", [])),
                "authorities_count": len(data.get("table_of_authorities", [])),
                "markdown_len": len(data.get("markdown_content", "")),
                "html_len": len(data.get("html_content", "")),
                "msg": f"Report ID: {data.get('report_id')} | Arguments: {len(data.get('arguments', []))} | Authorities: {len(data.get('table_of_authorities', []))}"
            })
        else:
            record("Report Generation: JSON / Markdown / HTML", "Report", False, lat, {
                "status_code": r.status_code, "msg": r.text[:200]
            })
    except Exception as e:
        record("Report Generation: JSON / Markdown / HTML", "Report", False, time.time() - t0, {"error": str(e)})

    # 4B: /api/v1/export-report-pdf (Downloadable PDF)
    t0 = time.time()
    try:
        r = session.post(f"{BASE_URL}/api/v1/export-report-pdf", json=report_payload, timeout=90)
        lat = time.time() - t0
        is_pdf_content_type = ("application/pdf" in r.headers.get("content-type", ""))
        pdf_bytes = r.content
        is_valid_magic_bytes = pdf_bytes.startswith(b"%PDF-")
        
        # Verify with PyMuPDF
        pdf_doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        num_pages = len(pdf_doc)
        page1_text = pdf_doc[0].get_text("text") if num_pages > 0 else ""
        pdf_doc.close()

        passed = (r.status_code == 200 and is_pdf_content_type and is_valid_magic_bytes and num_pages >= 1)
        record("Report Export: High-Resolution PDF Generation", "Report", passed, lat, {
            "status_code": r.status_code,
            "content_type": r.headers.get("content-type"),
            "pdf_byte_size": len(pdf_bytes),
            "page_count": num_pages,
            "has_magic_bytes": is_valid_magic_bytes,
            "msg": f"PDF generated: {len(pdf_bytes):,} bytes across {num_pages} pages"
        })
    except Exception as e:
        record("Report Export: High-Resolution PDF Generation", "Report", False, time.time() - t0, {"error": str(e)})

    # 4C: /api/v1/export-report-html (Printable HTML)
    t0 = time.time()
    try:
        r = session.post(f"{BASE_URL}/api/v1/export-report-html", json=report_payload, timeout=90)
        lat = time.time() - t0
        is_html = ("text/html" in r.headers.get("content-type", ""))
        has_html_tags = ("<!DOCTYPE html>" in r.text or "<html" in r.text)
        passed = (r.status_code == 200 and is_html and has_html_tags and len(r.text) > 500)
        record("Report Export: Printable HTML Endpoint", "Report", passed, lat, {
            "status_code": r.status_code,
            "content_type": r.headers.get("content-type"),
            "html_length": len(r.text),
            "msg": f"HTML delivered: {len(r.text):,} characters"
        })
    except Exception as e:
        record("Report Export: Printable HTML Endpoint", "Report", False, time.time() - t0, {"error": str(e)})

    # Print summary
    log_section("Stress Test Suite Final Metrics")
    total = results["summary"]["total"]
    passed = results["summary"]["passed"]
    failed = results["summary"]["failed"]
    pass_rate = (passed / total * 100) if total > 0 else 0
    print(f"Total Tests Run: {total}")
    print(f"Passed:         {passed}")
    print(f"Failed:         {failed}")
    print(f"Pass Rate:      {pass_rate:.1f}%")

    with open("tests/stress_test_results.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2)
    print("\nDetailed test report written to: tests/stress_test_results.json")
    return results

if __name__ == "__main__":
    run_stress_tests()
