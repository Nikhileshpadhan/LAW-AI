# Supreme Court Precedent Analyzer & Legal Argument RAG Engine

A production-grade, lawyer-friendly **LegalTech AI Backend** for Supreme Court precedent analysis and court-ready argument generation. Grounded strictly in authentic Indian Supreme Court judgments from the last 5 years (**76,802 chunks**).

---

## Key Highlights

- **Lawyer-Friendly Unified Input:** Submit plain-text case facts, upload a case document (FIR, Petition, High Court Order, Plaint in PDF/TXT), or provide both.
- **Strict Anti-Hallucination:** Arguments and citations are anchored exclusively in the retrieved 5-year Supreme Court collection (`DATA/chroma_vector_db`).
- **High-Performance Vector Engine:** Pre-loads local `Legal-BERT` (`DATA/legal_bert_model`) and ChromaDB into memory via FastAPI `lifespan` for sub-100ms vector queries.
- **Groq LLM Acceleration:** Powered by Groq's high-throughput inference engine using `openai/gpt-oss-120b` (with fallback to `openai/gpt-oss-20b` / `llama-3.3-70b-versatile`).
- **Strategic Stance Formulation:** Generates arguments tailored for `Petitioner / Appellant`, `Respondent / Defense`, or `Neutral Evaluation`, complete with anticipated opposing distinctions and rebuttal strategies.

---

## Directory Structure

```text
D:\PrescendenceRAG\
├── app/
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py              # POST /api/v1/analyze-case, /search-precedents, GET /health
│   ├── services/
│   │   ├── __init__.py
│   │   ├── document_parser.py     # PyMuPDF (fitz) text and metadata extraction
│   │   ├── vector_engine.py       # Legal-BERT encoder & ChromaDB retrieval engine
│   │   ├── groq_service.py        # Groq client with multi-model fallback & JSON extraction
│   │   ├── query_generator.py     # Stage 1: Fact extraction & judicial query formulation
│   │   └── argument_synthesizer.py# Stage 3: Precedent-grounded argument synthesizer
│   ├── config.py                  # Pydantic Settings & environment management
│   ├── main.py                    # FastAPI application with lifespan pre-loader & CORS
│   └── schemas.py                 # Pydantic v2 schemas for requests & responses
├── DATA/                          # 5-Year Supreme Court Bundle
│   ├── chroma_vector_db/          # 76,802 judgment chunk embeddings
│   ├── chunked_database/          # Jsonl & Parquet source chunks
│   ├── embeddings_database/       # Pre-computed vectors (.npy, .parquet)
│   └── legal_bert_model/          # HuggingFace Legal-BERT PyTorch weights
├── tests/
│   └── test_api.py                # Pytest test suite covering endpoints & uploads
├── cli_test.py                    # Interactive terminal tester
├── discover_bundle.py             # Diagnostic & inspection script
├── .env                           # Local environment configuration
├── .env.example                   # Environment configuration template
└── requirements.txt
```

---

## Setup & Configuration

### 1. Environment Configuration
Copy `.env.example` to `.env` and set your Groq API key:
```bash
cp .env.example .env
```
In `.env`:
```env
GROQ_API_KEY=gsk_your_actual_groq_api_key
GROQ_MODEL=openai/gpt-oss-120b
GROQ_FALLBACK_MODEL=openai/gpt-oss-20b
```

> **Note:** If `GROQ_API_KEY` is omitted, the engine automatically operates in offline vector search and structured rule mode, allowing local retrieval and brief generation without crashing.

---

## Running the Application

### 1. Start the FastAPI Server
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- Interactive Swagger UI: [http://localhost:8000/docs](http://localhost:8000/docs)
- Alternative ReDoc UI: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## API Endpoints

### 1. Unified Case Analysis: `POST /api/v1/analyze-case`
- **Content-Type:** `multipart/form-data`
- **Parameters:**
  - `case_description` (`Optional[str]`): Text describing client facts or legal issues.
  - `case_file` (`Optional[UploadFile]`): Uploaded PDF or TXT legal document.
  - `representing_side` (`str`, default `"Petitioner / Appellant"`): Dropdown choice:
    - `"Petitioner / Appellant"`
    - `"Respondent / Defense"`
    - `"Neutral Evaluation"`
- **Response:**
  - `executive_brief`: Summary of facts, formulated legal issues, and applicable statutes.
  - `arguments[]`:
    - `argument_number` & `title`
    - `detailed_reasoning`: Legal argument applying precedent's *Ratio Decidendi* to case facts.
    - `supporting_precedents`: Case Name, Year, Bench, verbatim excerpt quote, similarity score.
    - `anticipated_counter_argument`: Distinguishing argument from opposing counsel.
    - `rebuttal`: Rebuttal strategy for oral/written submissions.

### 2. Direct Precedent Semantic Search: `POST /api/v1/search-precedents`
- Fast ad-hoc semantic search query directly against the 76,802 chunks in ChromaDB.
- **Parameters:**
  - `query` (`str`): e.g. `"anticipatory bail under section 438 CrPC in economic offences"`
  - `top_k` (`int`, default `5`): Number of chunks to return.

### 3. Engine Health Check: `GET /api/v1/health`
- Verifies collection count (76,802 vectors), Legal-BERT memory status, and Groq configuration.

---

## Interactive Terminal Case Consultation (`chat.py`)

You can now have an interactive multi-turn case consultation with the Senior Advocate directly in your terminal:

```bash
python chat.py
```

### In-Chamber Slash Commands:
- `/load <path>`: Load a case petition, FIR, or High Court order directly from a PDF or TXT file.
- `/side <side>`: Switch strategic stance (`Petitioner`, `Respondent`, or `Neutral`).
- `/case`: View the currently loaded case factual matrix.
- `/search <query>`: Perform an ad-hoc search directly against the 76,802 SC judgments.
- `/precedents`: View all Supreme Court precedents retrieved during your session.
- `/clear`: Reset conversation history and start a new case consultation.
- `/exit`: Exit the consultation.

---

## Terminal CLI Testing

You can run end-to-end tests directly from the terminal using `cli_test.py`:

```bash
# 1. Run with built-in legal scenarios (bail, quashing, cheque)
python cli_test.py --sample bail
python cli_test.py --sample quashing --side "Respondent / Defense"
python cli_test.py --sample cheque --side "Petitioner / Appellant"

# 2. Test with custom text
python cli_test.py --text "Petitioner was denied promotion based on uncommunicated adverse remarks in ACR."

# 3. Test with a PDF file
python cli_test.py --file "path/to/petition.pdf" --side "Petitioner / Appellant"

# 4. Direct vector search only (sub-100ms)
python cli_test.py --text "quashing of FIR section 482 CrPC" --search-only
```

---

## Running the Automated Test Suite

```bash
python -m pytest tests/test_api.py -v
```
All tests verify endpoint health, text analysis, document uploads, and vector search.
