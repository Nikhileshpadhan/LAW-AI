# DATA SOURCES & ARTIFICIAL INTELLIGENCE PIPELINE

## 1. Supreme Court Judgment Dataset Overview

The core knowledge foundation of **LAW-AI** is an indexed corpus of **76,802 semantic chunks** harvested from official, reported judgments delivered by the **Supreme Court of India** spanning the five-year period from **2018 to 2024**. 

This period represents one of the most transformative eras in Indian constitutional jurisprudence, encompassing landmark rulings across:
- **Constitutional Law**: Fundamental rights (*Puttaswamy* privacy jurisprudence, Article 21 expansive interpretation, Article 32 writ powers).
- **Insolvency & Bankruptcy Code (IBC), 2016**: Interplay between Section 14 moratoriums and Section 138 Negotiable Instruments Act criminal proceedings (*P. Mohanraj*, *Manish Kumar*).
- **Criminal Procedure & Special Statutes**: PMLA Section 45 twin conditions, bail jurisprudence under Section 438/439 CrPC (*Satender Kumar Antil*, *Manish Sisodia*), and Section 482 inherent powers.
- **Arbitration & Conciliation Act, 1996**: Section 8 referral thresholds, Section 34 challenge limits, Section 9 interim measures, and stamping issues (*NN Global*).
- **Commercial & Corporate Disputes**: Companies Act oppression and mismanagement, contract enforcement, and administrative accountability.

```
+-------------------------------------------------------------------------------------------------+
|                       SUPREME COURT OF INDIA JUDGMENT CORPUS (2018-2024)                        |
+------------------------------------+-----------------------------------+------------------------+
| Metric / Attribute                 | Local ChromaDB Store              | Qdrant Cloud Cluster   |
+------------------------------------+-----------------------------------+------------------------+
| Total Indexed Chunks               | 76,802                            | 76,802                 |
| Vector Dimensionality              | 768 Dimensions (Dense Float32)    | 768 Dimensions (Dense) |
| Distance Metric                    | Cosine Distance (1 - CosSim)      | Cosine Distance        |
| Embedding Model                    | Legal-BERT (768-D dense)          | Legal-BERT (768-D)     |
| Average Words per Chunk            | ~180 - 250 words                  | ~180 - 250 words       |
| Primary Law Domains                | Criminal, Constitutional, IBC,    | Criminal, Constitutional|
|                                    | Commercial, Civil, Arbitration    | IBC, Commercial, Civil |
| Collection Identifier              | supreme_court_cases_last_5yrs_... | supreme_court_cases... |
+------------------------------------+-----------------------------------+------------------------+
```

---

## 2. Data Preprocessing & Document Chunking Pipeline

Unstructured judicial PDF rulings from the Supreme Court registry present unique structural challenges: legal citations contain internal parenthetical years, paragraph numbering styles fluctuate across benches, and statutory references often bridge multiple pages.

To ensure that semantic boundaries reflect natural judicial reasoning without severing operative legal propositions (*ratio decidendi*), an ingestion pipeline was developed:

```
[Raw Supreme Court Judgments (PDF/HTML)]
                  │
                  ▼
[PyMuPDF / Text Extraction Engine]
                  │ (Cleans headers, footers, pagination artifacts, signature blocks)
                  ▼
[Sentence & Paragraph Boundary Identification]
                  │ (Preserves paragraph tags: "Para 12", "Held:", "Per Curiam:")
                  ▼
[Sliding-Window Semantic Chunking]
                  │ Chunk size: 256–384 tokens (~180-250 words)
                  │ Overlap: 50 tokens (ensures context preservation across boundaries)
                  ▼
[Metadata Normalization & Enrichment]
                  │ Extracts: Case Name, Year, Bench, Docket No., Citation
                  ▼
[Legal-BERT Neural Vectorization]
                  │ 768-D L2-normalized dense vector generation
                  ▼
[Dual Vector Index Landing: ChromaDB / Qdrant Cloud]
```

### Chunking Characteristics
1. **Token Boundary Constraint**: Minimum chunk size of 100 tokens, maximum chunk size of 384 tokens.
2. **Contextual Overlap**: A 50-token trailing overlap is carried into successive chunks to prevent boundary clipping of multi-sentence judicial holdings.
3. **Statutory Landmark Anchoring**: Chunks containing statutory cross-references (e.g., "Section 138", "Article 21", "Section 438") are flagged to ensure metadata tags preserve statutory discoverability.

---

## 3. Precedent Chunk & Metadata Schema

Every vector point in the database contains the 768-dimensional dense embedding coupled with an explicit, rich metadata payload. This enables multi-stage filtering, citation reconstruction, and verbatim quote verification.

### Exact JSON Chunk Metadata Schema
```json
{
  "chunk_id": "sc_2021_crim_bail_0410_chk_03",
  "case_name": "Satender Kumar Antil v. Central Bureau of Investigation",
  "year": "2021",
  "bench": "Sanjay Kishan Kaul and M.M. Sundresh, JJ.",
  "citation": "AIR 2021 SC 5199 / (2021) 10 SCC 773",
  "file_name": "satender_kumar_antil_vs_cbi_2021.pdf",
  "petitioner": "Satender Kumar Antil",
  "respondent": "Central Bureau of Investigation & Anr.",
  "subject_matter": "Criminal Procedure Code, 1973 - Section 437, 439 - Guidelines on Bail",
  "similarity_score": 0.8842,
  "document_text": "The existence of the power to arrest is one thing, the justification for the exercise of it is quite another. Arrest is not a must for each and every cognizable offence. Bail is the rule and jail is the exception. The categorisation of offences into four brackets (A, B, C, D) is delineated to govern remand and bail applications..."
}
```

### Metadata Fields Definition
- `chunk_id` *(String)*: Deterministic unique key representing source document, year, subject category, and sequential chunk index.
- `case_name` *(String)*: Official cause title of the judgment recorded in Supreme Court records.
- `year` *(String)*: Calender year of pronouncement.
- `bench` *(String)*: Coram of judges presiding over the bench (e.g., Division Bench, 3-Judge Bench, Constitution Bench).
- `citation` *(String)*: Official SCC/AIR/SCR citation where available.
- `document_text` *(String)*: Verbatim text segment of the ruling indexed under this vector point.
- `similarity_score` *(Float)*: Runtime cosine similarity metric computed between query embedding and vector payload (range $0.00$ to $1.00$).

---

## 4. Dual Vector Database Architecture

To accommodate both local development without external internet dependencies and cloud deployment constrained by free-tier RAM limits (Render 512 MB RAM ceiling), LAW-AI implements a resilient **Dual Vector Backend**:

```
                              ┌────────────────────────────────────────┐
                              │          VectorEngine Singleton        │
                              └───────────────────┬────────────────────┘
                                                  │
                      ┌───────────────────────────┴───────────────────────────┐
                      ▼                                                       ▼
        [Local ChromaDB Backend]                               [Cloud Qdrant Backend]
        • Path: DATA/chroma_vector_db                          • Endpoint: Qdrant Cloud REST
        • Collection: supreme_court_...                        • Fast HNSW graph traversal
        • Local SQLite-backed index                            • Zero server RAM footprint
        • Offline capable (no network)                         • Ideal for 512MB RAM tier
```

### 1. Local ChromaDB Store
- **Location**: `DATA/chroma_vector_db/`
- **Engine**: ChromaDB `PersistentClient` with persistent Parquet and SQLite storage.
- **Index Type**: Hierarchical Navigable Small World (HNSW) graph for sub-millisecond approximate nearest neighbor (ANN) retrieval.
- **Use Case**: Fully offline development, testing, and isolated local execution without external API keys or cloud dependencies.

### 2. Qdrant Cloud Cluster
- **Cluster**: Qdrant Cloud AWS cluster (`sa-east-1-0.aws.cloud.qdrant.io:6333`).
- **Collection**: `supreme_court_cases_last_5yrs_legalbert`.
- **Payload Indexing**: Inverted indices over `year`, `bench`, and `case_name` allowing metadata-filtered ANN search.
- **Use Case**: Cloud-hosted instances on Render where local vector databases cannot be mounted due to ephemeral storage or memory ceilings.

---

## 5. Legal-BERT Neural Embedding Model

General-purpose language models (such as BERT-base or RoBERTa) fail on legal queries because legal prose features specialized syntax, archaic Norman-French/Latin terms (*habeas corpus*, *ratio decidendi*, *suo motu*, *res judicata*), and complex multi-clause sentence structures.

LAW-AI employs **Legal-BERT** (`nlpaueb/legal-bert-base-uncased`), pre-trained specifically on vast corpora of judicial opinions, legislation, and legal contracts:
- **Architecture**: 12 Transformer encoder layers, 12 attention heads, 768 hidden dimensions.
- **Vocabulary Size**: 30,522 legal and English sub-word tokens.
- **Inference Mode**:
  1. **Quantized Local ONNX Runtime**: Custom 8-bit quantized ONNX engine (`app/model_assets/legal_bert_int8.onnx.gz`, 63.9 MB). Delivers **18 ms inference latency** and consumes only **~120 MB RAM**, replacing bulky 500 MB PyTorch libraries.
  2. **Hugging Face Inference API Fallback**: Direct HTTPS calls to Hugging Face Feature Extraction endpoints when ONNX binaries are unloaded.

```
Token Input Text: "Bail under Section 438 CrPC in economic offences"
         │
         ▼
[WordPiece Tokenizer (vocab.txt)]
         │ Input IDs: [101, 7421, 2106, 2275, 438, ...] (Shape: 1 x 256)
         ▼
[Legal-BERT INT8 ONNX Engine]
         │ 12-Layer Transformer Execution (ONNX Runtime, 2 Intra-op threads)
         ▼
[Mean Pooling across Token Sequence]
         │ Output: 768-Dimensional Hidden Vector
         ▼
[L2 Unit Normalization: v / ||v||2]
         │
         ▼
Query Embedding Vector: [0.0312, -0.0154, 0.0892, ..., 0.0421]
```

---

## 6. Large Language Model Integration & Multi-Model Cascade

Legal drafting requires rigorous adherence to statutory text, zero hallucination of nonexistent court citations, and articulate synthesis of judicial precedents.

LAW-AI integrates **Groq Cloud High-Speed Inference API**, utilizing an automated **Multi-Model Fallback Cascade** to ensure 100% operational uptime against upstream provider rate limits:

```
                  [User Factual Context + Retrieved SC Chunks]
                                        │
                                        ▼
                  [Tier 1: openai/gpt-oss-120b (Primary)]
                                        │
                         ┌──────────────┴──────────────┐
                         ▼ Success                     ▼ 429 Rate Limit / Error
                   [Valid Brief]           [Tier 2: openai/gpt-oss-20b]
                                                       │
                                        ┌──────────────┴──────────────┐
                                        ▼ Success                     ▼ 429 Rate Limit / Error
                                  [Valid Brief]           [Tier 3: qwen/qwen3.8-27b]
                                                                      │
                                                       ┌──────────────┴──────────────┐
                                                       ▼ Success                     ▼ Failure
                                                 [Valid Brief]          [Offline Heuristic Engine]
```

### LLM Role Assignment & Strict Anti-Hallucination Prompting
The LLM is governed by an adversarial judicial persona prompt:
1. **Rule 1 (Strict Retrieval Bound)**: The model is prohibited from referencing any judgment not explicitly provided in the retrieved chunks.
2. **Rule 2 (Verbatim Quote Mandate)**: Every cited precedent must supply an exact, character-accurate verbatim quote from the retrieved chunk text.
3. **Rule 3 (Ratio Application)**: The model must formulate an explicit step-by-step application of the holding (*ratio decidendi*) to the client's factual controversy.
4. **Rule 4 (Adversarial Anticipation)**: The model must predict opposing counsel's argument attempting to distinguish or neutralize the cited case, paired with a definitive rebuttal.

---

## 7. Offline Resilience & Heuristic Fallback Engine

If external internet connectivity is unavailable, or if the Groq API key is omitted, LAW-AI does **not** fail or show an error screen. Instead, `app/services/argument_synthesizer.py` activates its built-in **Deterministic Offline Heuristic Engine**:

```python
# Fallback mechanism in ArgumentSynthesizerService:
if not self.groq_service.is_configured():
    logger.warning("GroqService is not configured. Generating structured precedent brief from retrieved chunks.")
    return self._generate_offline_response(...)
```

### Heuristic Synthesis Mechanics:
1. **Factual Distillation**: Extracts key statutory tags and legal propositions from the client's input submission.
2. **Direct Precedent Grounding**: Maps the Top-5 retrieved Supreme Court precedents directly into individual structured arguments.
3. **Verbatim Holding Extraction**: Pulls the first 350 characters of operative judicial text from each retrieved chunk to serve as the authentic `verbatim_quote`.
4. **Standard Judicial Scaffolding**: Formulates ratio application paragraphs, potential distinctions by opposing counsel, and statutory rebuttals based on Indian judicial conventions.

---

## 8. Configuration & Environment Variables Specification

The system is configured via environment variables loaded using Pydantic Settings (`app/config.py`). The table below outlines all operational parameters:

| Variable Name | Required | Default Value | Description |
|---|---|---|---|
| `APP_NAME` | No | `"Supreme Court Precedent Analyzer..."` | Official title displayed across API documentation and logs. |
| `DEBUG` | No | `False` | Toggles verbose diagnostic logging and hot-reload. |
| `HOST` | No | `"0.0.0.0"` | Network interface for FastAPI Uvicorn listener. |
| `PORT` | No | `8000` | Port number for backend HTTP service. |
| `ALLOWED_ORIGINS` | No | `"http://localhost:5173,..."` | Comma-separated CORS allowed domains for browser security. |
| `VECTOR_BACKEND` | No | `"local"` | Primary vector engine mode: `"local"` (ChromaDB) or `"qdrant"` (Cloud). |
| `CHROMA_DB_PATH` | No | `DATA/chroma_vector_db` | Filesystem path to local ChromaDB persistent vector repository. |
| `CHROMA_COLLECTION_NAME`| No | `"supreme_court_cases_last_5yrs_..."`| Vector collection name storing 76,802 chunks. |
| `LEGAL_BERT_PATH` | No | `DATA/legal_bert_model` | Filesystem directory containing PyTorch Legal-BERT weights. |
| `QDRANT_URL` | Cloud | `""` | HTTPS endpoint URL for Qdrant Cloud cluster. |
| `QDRANT_API_KEY` | Cloud | `""` | Authentication API key for Qdrant Cloud database. |
| `GROQ_API_KEY` | Yes (AI) | `""` | Groq Cloud API key for ultra-fast LPU LLM inference. |
| `GROQ_MODEL` | No | `"openai/gpt-oss-120b"` | Primary LLM model targeted for argument generation. |
| `GROQ_FALLBACK_MODEL` | No | `"openai/gpt-oss-20b"` | Secondary fallback LLM model upon rate limits. |
| `DATABASE_URL` | No | `"sqlite+aiosqlite:///./law_ai_local.db"`| Async database connection URI (SQLite or PostgreSQL). |
| `JWT_SECRET_KEY` | Yes | `"law_ai_production_secret_key..."` | Cryptographic secret for signing HS256 JWT access tokens. |
| `ACCESS_TOKEN_EXPIRE_MINUTES`| No | `15` | Expiry duration for short-lived JWT access tokens. |
| `REFRESH_TOKEN_EXPIRE_DAYS` | No | `7` | Retention window for cryptographically hashed refresh tokens. |
| `BREVO_API_KEY` | Optional| `""` | API key for Brevo transactional email delivery. |
| `GOOGLE_CLIENT_ID` | Optional| `""` | Client ID for Google OAuth 2.0 Single Sign-On. |
| `GOOGLE_CLIENT_SECRET` | Optional| `""` | Client Secret for Google OAuth 2.0 Single Sign-On. |
