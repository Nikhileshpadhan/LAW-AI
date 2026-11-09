# LAW-AI: Module-Wise Technical Specification & Analysis
## B.Tech Minor Project Technical Documentation — Chapter 4: Module Documentation
**Department of Computer Science & Engineering | GIET University Guidelines Compliant**

---

### Mapping of Generic Template Categories to Implemented LAW-AI Subsystems

To maintain compliance with the project evaluation rubric while reflecting the authentic codebase, the table below maps each generic category to its implemented legal domain module in LAW-AI:

| Academic Template Category | Implemented LAW-AI Subsystem | Primary Source Files |
| :--- | :--- | :--- |
| **Product Search** | Supreme Court Precedent Semantic Search | `app/services/vector_engine.py`, `app/api/routes.py` |
| **Product Discovery** | Landmark Precedents Showcase & Corpus Browser | `frontend/src/components/LandingPrecedentsShowcase.jsx` |
| **Image / Document Upload** | Petition & FIR Multi-Page PDF/TXT Ingestion | `app/services/document_parser.py`, `frontend/src/components/ChamberChat.jsx` |
| **Product Identification** | Case Ratio Decidendi & Legal Issue Extraction | `app/services/query_generator.py`, `app/services/argument_synthesizer.py` |
| **Source Verification** | Strict Anti-Hallucination & Verbatim Excerpt Validation | `app/services/argument_synthesizer.py` |
| **Product Intelligence** | Case Precedent Intelligence & Statutory Analysis | `app/services/chat_session.py`, `app/services/argument_synthesizer.py` |
| **Evidence Explorer** | Precedent Chunk Inspector & Verified Excerpt Modal | `frontend/src/components/ChunkModal.jsx` |
| **Trend Intelligence** | 5-Year Supreme Court Bench Jurisprudence Trends (2018–2024) | `DATA/chunked_database/`, `frontend/src/components/LandingExhibition.jsx` |
| **Product Comparison** | Comparative Stance Argument Formulation (Petitioner vs Respondent) | `app/services/argument_synthesizer.py`, `frontend/src/components/ChamberHeader.jsx` |
| **AI Analyst** | Senior Supreme Court Advocate Consultation Engine | `app/services/groq_service.py`, `app/services/chat_session.py` |
| **Authentication & Access** | Counsel Security, JWT Tokens & Session Persistence | `app/api/auth_routes.py`, `frontend/src/components/AuthModal.jsx` |
| **Document Automation** | Court-Ready Strategy Report Synthesis & PDF Export | `app/services/report_generator.py`, `frontend/src/components/ReportModal.jsx` |

---

### Module 1: Supreme Court Precedent Semantic Search (Product Search)
* **Module Name:** Precedent Semantic Search & Embedding Engine
* **Source Files:** [`app/services/vector_engine.py`](file:///d:/PrescendenceRAG/app/services/vector_engine.py), [`app/api/routes.py`](file:///d:/PrescendenceRAG/app/api/routes.py#L90)
* **Purpose:** Allows advocates to query 76,802 Supreme Court judgment chunks using dense natural language queries rather than rigid boolean keywords.
* **Working Procedure:**
  1. The user inputs a judicial query (e.g., *"anticipatory bail economic offences parity Article 21"*).
  2. The query text is tokenized into WordPiece token IDs.
  3. The Legal-BERT encoder generates a normalized 768-dimensional dense vector.
  4. Cosine distance queries are executed against ChromaDB / Qdrant Cloud.
  5. Chunks exceeding the relevance threshold (`min_similarity_threshold = 0.50`) are returned ranked by similarity score.
* **Input:** `PrecedentSearchRequest` (text query: string, top_k: integer between 1 and 20).
* **Processing:** Fast tokenization via `BertTokenizerFast`, INT8 matrix multiplication via ONNX Runtime CPU session, and approximate nearest neighbor (ANN) retrieval.
* **Output:** JSON list of precedent records containing `chunk_id`, `case_title`, `year`, `bench`, `text`, and `similarity_score`.
* **Important Functions:** `VectorEngine.search_precedents()`, `VectorEngine._encode_onnx()`, `VectorEngine._initialize_qdrant()`.

---

### Module 2: Landmark Precedents Showcase & Corpus Discovery (Product Discovery)
* **Module Name:** Landmark Case Discovery & Scenario Launcher
* **Source Files:** [`frontend/src/components/LandingPrecedentsShowcase.jsx`](file:///d:/PrescendenceRAG/frontend/src/components/LandingPrecedentsShowcase.jsx)
* **Purpose:** Provides advocates with immediate entry points to landmark constitutional benchmarks, allowing them to test live courtroom scenarios with a single click.
* **Working Procedure:**
  1. Renders interactive cards for landmark Supreme Court rulings (*K.S. Puttaswamy*, *Navtej Singh Johar*, *Shreya Singhal*, *Anuradha Bhasin*, *Arnesh Kumar*).
  2. Each card displays the citation, bench composition, decision year, and core constitutional doctrine.
  3. Clicking "Test live in chamber" pre-populates the consultation workspace and executes the scenario.
* **Input:** User click event on exhibit card.
* **Processing:** Triggers callback `onSelectScenario(promptText)`, sets view to `chamber`, and initiates RAG retrieval.
* **Output:** Instant transition into active case consultation.

---

### Module 3: Petition & FIR Document Ingestion (Image / Document Upload)
* **Module Name:** Legal Document Parser & Sanitizer
* **Source Files:** [`app/services/document_parser.py`](file:///d:/PrescendenceRAG/app/services/document_parser.py), [`frontend/src/components/ChamberChat.jsx`](file:///d:/PrescendenceRAG/frontend/src/components/ChamberChat.jsx#L260)
* **Purpose:** Extracts, sanitizes, and prepares unstructured legal petitions, FIRs, trial court orders, and plaints uploaded by lawyers.
* **Working Procedure:**
  1. Client selects a PDF or TXT file through the Chamber upload button or drag-and-drop zone.
  2. The server reads file bytes and enforces a strict 10 MB ceiling (`MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024`).
  3. If PDF, verifies the `%PDF-` magic-byte header to reject disguised malicious binaries.
  4. Parses page text across up to 35 pages using `PyMuPDF` (`fitz`), stripping control characters and excess whitespace.
  5. Combines file text with any plain-text description provided by the lawyer.
* **Input:** `case_file` (`UploadFile` binary stream) and/or `case_description` (string).
* **Processing:** `DocumentParserService.extract_text()`, magic byte verification, PyMuPDF page-by-page text extraction.
* **Output:** Normalized clean legal text string prepared for Stage 1 query extraction.

---

### Module 4: Case Ratio Decidendi & Issue Formulation (Product Identification)
* **Module Name:** Stage 1 Query Generator & Issue Formulator
* **Source Files:** [`app/services/query_generator.py`](file:///d:/PrescendenceRAG/app/services/query_generator.py)
* **Purpose:** Distills complex legal filings into legally operative facts, identifies applicable statutes, and formulates 4–5 targeted search queries.
* **Working Procedure:**
  1. Ingests normalized case text up to 12,000 characters.
  2. Prompts the Groq LLM with judicial clerk persona (`STAGE1_SYSTEM_PROMPT`).
  3. Extracts:
     - Factual Summary (concise summary of legally operative facts).
     - Legal Issues (formal constitutional and statutory questions).
     - Applicable Statutes (e.g., Section 438 CrPC, Article 21, Section 138 NI Act).
     - 4 to 5 concept-dense search queries phrased in formal Supreme Court terminology.
  4. If Groq is offline or unavailable, automatically executes rule-based fallback heuristic regex parsing.
* **Input:** Raw case narrative or petition text string.
* **Processing:** Structured JSON prompting via Groq LPU inference (`openai/gpt-oss-120b`).
* **Output:** Dictionary containing `factual_summary`, `legal_issues`, `applicable_statutes`, and `search_queries`.

---

### Module 5: Strict Anti-Hallucination & Verbatim Excerpt Validation (Source Verification)
* **Module Name:** Anti-Hallucinatory Grounding Engine
* **Source Files:** [`app/services/argument_synthesizer.py`](file:///d:/PrescendenceRAG/app/services/argument_synthesizer.py#L21-L55)
* **Purpose:** Guarantees that every cited precedent in legal arguments is authentic and anchored in verified Supreme Court judgments, eliminating AI hallucination.
* **Working Procedure:**
  1. Precedent context passed to the LLM is strictly restricted to the Top-K retrieved chunks from the 76,802 database.
  2. System prompt explicitly forbids citing outside cases or ungrounded authorities.
  3. The model is forced to output an exact `verbatim_quote` extracted directly from the chunk text.
  4. The synthesizer links the chunk's exact `case_name`, `year`, `bench`, and `similarity_score` to the argument.
* **Input:** Retrieved chunks list from vector engine + case facts.
* **Processing:** Constrained schema generation requiring verbatim substring alignment.
* **Output:** Structured `LegalArgument` objects with verified citation metadata.

---

### Module 6: Case Precedent Intelligence & Statutory Analysis (Product Intelligence)
* **Module Name:** Multi-Turn Legal Reasoning & Statutory Analysis
* **Source Files:** [`app/services/chat_session.py`](file:///d:/PrescendenceRAG/app/services/chat_session.py)
* **Purpose:** Conducts conversational case strategy sessions, analyzing statutes (BNS, BNSS, IPC, CrPC, PMLA, NI Act) in conjunction with case facts.
* **Working Procedure:**
  1. Validates whether counsel's prompt contains legal domain terminology using `LEGAL_DOMAIN_KEYWORDS` (over 100 judicial keywords).
  2. Generates semantic queries for conversational turns and fetches relevant chunks.
  3. Formulates strategic answers incorporating principles of presumption of innocence, statutory thresholds, and mandatory checklists.
* **Input:** User conversational message, current case context, representing stance.
* **Processing:** RAG retrieval + Groq reasoning session with chat history memory.
* **Output:** Formatted assistant response with embedded legal principles, citations, and strategic advice.

---

### Module 7: Precedent Chunk Inspector (Evidence Explorer)
* **Module Name:** Full Precedent Excerpt & Chunk Modal Inspector
* **Source Files:** [`frontend/src/components/ChunkModal.jsx`](file:///d:/PrescendenceRAG/frontend/src/components/ChunkModal.jsx)
* **Purpose:** Enables advocates to inspect the exact underlying text of a retrieved precedent to verify its authenticity before presenting it in court.
* **Working Procedure:**
  1. In the Chamber chat or strategy brief, counsel clicks any precedent tag or citation chip.
  2. The application opens `ChunkModal`, displaying the complete judgment excerpt.
  3. Details displayed: Case Title, Year of Judgment, Coram / Bench Composition, Exact Vector Cosine Similarity Score, and Chunk ID.
* **Input:** Precedent metadata object.
* **Processing:** Modal dialog rendering with glassmorphic backdrop.
* **Output:** Full text inspection modal with copy-to-clipboard functionality.

---

### Module 8: 5-Year Supreme Court Jurisprudence Trends (Trend Intelligence)
* **Module Name:** Supreme Court Corpus Intelligence & Architectural Pillars
* **Source Files:** [`frontend/src/components/LandingExhibition.jsx`](file:///d:/PrescendenceRAG/frontend/src/components/LandingExhibition.jsx), [`DATA/`](file:///d:/PrescendenceRAG/DATA/)
* **Purpose:** Explains the structural data corpus covering five years of apex court rulings (2018–2024), highlighting shift in judicial reasoning across key statutory domains.
* **Working Procedure:**
  - Displays the four technological pillars:
    1. *Corpus Ingestion:* 76,802 chunks pre-tokenized across 5 years of Supreme Court rulings.
    2. *Dense Embeddings:* 768-dimensional Legal-BERT representations.
    3. *Neural Retrieval:* Cosine similarity ranking ensuring sub-100ms discovery.
    4. *Argument Synthesis:* Stance-conditioned reasoning formulation.

---

### Module 9: Adversarial Stance Formulation (Product Comparison)
* **Module Name:** Stance-Conditioned Argument Comparison
* **Source Files:** [`app/services/argument_synthesizer.py`](file:///d:/PrescendenceRAG/app/services/argument_synthesizer.py#L18), [`frontend/src/components/ChamberHeader.jsx`](file:///d:/PrescendenceRAG/frontend/src/components/ChamberHeader.jsx)
* **Purpose:** Compares legal strategies by formulating opposing arguments depending on whether counsel represents the Petitioner, Respondent, or seeks a Neutral Evaluation.
* **Working Procedure:**
  1. Counsel selects stance from the top header dropdown:
     - **Petitioner / Appellant:** Maximizes arguments on liberty, proportionality, procedural irregularities, and statutory bail exemptions.
     - **Respondent / Defense / Prosecution:** Emphasizes statutory compliance, prima facie evidence, public interest, and precedent distinguishability.
     - **Neutral Evaluation:** Objective assessment detailing strengths and vulnerabilities of both sides.
  2. For every formulated argument, the module predicts opposing counsel's expected objection (`anticipated_counter_argument`) and generates a definitive court rebuttal (`rebuttal`).
* **Input:** Stance string selection + case facts + retrieved chunks.
* **Processing:** Conditional prompt injection dynamically altering LLM optimization objective.
* **Output:** Tailored arguments complete with counter-objections and oral rebuttals.

---

### Module 10: Senior Supreme Court Advocate Consultation (AI Analyst)
* **Module Name:** Groq-Accelerated Legal AI Analyst
* **Source Files:** [`app/services/groq_service.py`](file:///d:/PrescendenceRAG/app/services/groq_service.py)
* **Purpose:** Provides high-throughput, low-latency judicial analysis using Groq LPUs.
* **Working Procedure:**
  1. Manages API client initialization with `GROQ_API_KEY`.
  2. Implements intelligent model fallback: `openai/gpt-oss-120b` → `openai/gpt-oss-20b` → `llama-3.3-70b-versatile`.
  3. Includes robust markdown code-fence JSON extraction regex (`r"```(?:json)?\s*([\s\S]*?)\s*```"`).
  4. If API keys are missing, gracefully falls back to structured offline heuristics.
* **Input:** System prompt, user messages, temperature (0.2 for deterministic precision).
* **Processing:** High-speed inference (sub-2 second completion).
* **Output:** Structured JSON responses or conversational text streams.

---

### Module 11: Counsel Security & Authentication (Authentication)
* **Module Name:** Counsel Identity & Session Management
* **Source Files:** [`app/api/auth_routes.py`](file:///d:/PrescendenceRAG/app/api/auth_routes.py), [`frontend/src/components/AuthModal.jsx`](file:///d:/PrescendenceRAG/frontend/src/components/AuthModal.jsx)
* **Purpose:** Manages secure advocate registration, credential verification, and cryptographic token rotation.
* **Working Procedure:**
  1. Advocates register with full name, email, and password (minimum 8 characters).
  2. Password hashed using Argon2id (`pwdlib`).
  3. Validates email syntax enforcing standard TLDs.
  4. Issues short-lived access JWT (15 mins) and long-lived SHA-256 hashed refresh token (7 days).
  5. Implements Google OAuth 2.0 redirect flow for one-click advocate login.
* **Input:** `UserRegisterRequest`, `UserLoginRequest`, or Google OAuth code.
* **Processing:** Argon2 verification, JWT issuance, PostgreSQL record creation.
* **Output:** `TokenResponse` with `access_token` and `UserResponse`.

---

### Module 12: Court Report Generator & PDF Export (Document Automation)
* **Module Name:** Formal Strategy Report & PDF Generator
* **Source Files:** [`app/services/report_generator.py`](file:///d:/PrescendenceRAG/app/services/report_generator.py), [`frontend/src/components/ReportModal.jsx`](file:///d:/PrescendenceRAG/frontend/src/components/ReportModal.jsx)
* **Purpose:** Compiles full consultations into judicial documents and exports printable court PDFs.
* **Working Procedure:**
  1. Aggregates consultation transcripts, executive briefs, arguments, and table of authorities.
  2. Formats content into high-contrast clean typography with section dividers.
  3. Streams binary PDF bytes directly to the client browser with filename `Supreme_Court_Strategy_Brief.pdf`.
* **Input:** Case context, conversation history, executive brief.
* **Processing:** Document rendering, HTML/Markdown generation, binary streaming.
* **Output:** Modal preview and downloadable court-ready PDF document.
