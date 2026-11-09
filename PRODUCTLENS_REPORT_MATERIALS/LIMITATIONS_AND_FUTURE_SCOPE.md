# SYSTEM LIMITATIONS & FUTURE SCOPE

## 1. Current System Limitations

While **LAW-AI** successfully demonstrates high retrieval precision, rapid inference latency, and strict anti-hallucination guardrails, several architectural, jurisdictional, and infrastructure boundaries exist in the current prototype:

### A. Temporal Scope of Corpus (2018–2024)
- **Current State**: The vector knowledge repository is bounded to **76,802 chunks** harvested from Supreme Court judgments delivered between **2018 and 2024**.
- **Limitation**: Seminal pre-2018 constitutional and criminal rulings (*Kesavananda Bharati v. State of Kerala (1973)*, *Maneka Gandhi v. Union of India (1978)*, *D.K. Basu v. State of West Bengal (1997)*) are not independently indexed unless they are explicitly quoted within the text of a 2018–2024 judgment. Counsel arguing foundational constitutional doctrines must cross-verify historical antecedents manually.

### B. Single-Court Jurisdictional Boundary
- **Current State**: The dataset exclusively indexes rulings delivered by the **Supreme Court of India** in New Delhi.
- **Limitation**: In everyday trial court and appellate litigation, advocates rely extensively on binding precedents from the **25 State High Courts** (e.g., Delhi High Court, Bombay High Court, Madras High Court). High Court rulings and subordinate court trial records are not currently indexed.

### C. Monolingual Text Dependency (English Only)
- **Current State**: The Legal-BERT tokenizer and the vector embeddings are pre-trained on English-language legal corpora.
- **Limitation**: While Supreme Court proceedings are conducted in English, recent initiatives by the Supreme Court e-Committee (e-SCR project) translate judgments into official Indian vernacular languages (Hindi, Tamil, Marathi, Bengali, Gujarati). The current system cannot index or query vernacular legal judgments directly without pre-translation into English.

### D. Digital Text Layer Requirement (Lack of Native OCR)
- **Current State**: Document ingestion via `PyMuPDF` (`fitz`) relies on an existing, extractable digital text stream.
- **Limitation**: Authentic Indian trial court records, handwritten First Information Reports (FIRs), police case diaries, and certified lower court orders frequently exist only as low-resolution photostats or scanned raster images. Uploading a purely image-based PDF results in empty text extraction unless pre-processed with an external OCR tool.

### E. Rate Limits on Upstream Cloud AI Services
- **Current State**: Cloud inference utilizes Groq Cloud LPU acceleration under standard developer tiers.
- **Limitation**: Groq's developer tier enforces a rate limit ceiling of **8,000 Tokens Per Minute (TPM)**. To prevent HTTP 429 throttling during intensive brief synthesis, the system restricts the prompt context to the Top-5 retrieved chunks (~2,000 tokens), precluding exhaustive full-document multi-page synthesis in a single prompt turn.

### F. Static Citation Lineage (Lack of Dynamic Over-Ruling Detection)
- **Current State**: The system scores chunks based on semantic similarity to the query.
- **Limitation**: The system does not maintain a dynamic citator graph (e.g., Shepard’s Citations / KeyCite style). If a 3-judge bench ruling from 2019 was subsequently overruled by a 5-judge Constitution Bench in 2023, the vector search may still retrieve the 2019 ruling if it has high semantic similarity, leaving the identification of its overruled status to the advocate's discretion.

---

## 2. Proposed Future Scope & Research Roadmap

The modular architecture of LAW-AI provides a foundation for extending the system into an enterprise-grade legal intelligence suite. The following strategic enhancements are planned:

```
+-------------------------------------------------------------------------------------------------+
|                                 FUTURE DEVELOPMENT ROADMAP                                      |
+─────────────────────────────────┬─────────────────────────────────┬─────────────────────────────+
| Phase 1: Near-Term Enhancements │ Phase 2: Structural Expansion   | Phase 3: Enterprise & Edge  |
+─────────────────────────────────┼─────────────────────────────────┼─────────────────────────────+
| • Tesseract OCR / Document AI   | • Historical Corpus (1950-2017) │ • Air-Gapped Local Hardware |
| • Indic-BERT Multilingual RAG   | • 25 State High Courts Data     | • Supreme Court e-Filing API|
| • Dynamic Precedent Graph       | • Automated Cause-List Sync     | • Collaborative Briefing    |
+─────────────────────────────────┴─────────────────────────────────┴─────────────────────────────+
```

### A. Optical Character Recognition (OCR) Ingestion Engine
- **Proposed Architecture**: Integrate an asynchronous OCR worker utilizing **Tesseract 5** or **Google Cloud Document AI**.
- **Capability**: When a scanned PDF or photograph of a charge-sheet, summons, or trial court order is uploaded, the parser automatically detects the absence of text layers, deskews the image, conducts bi-tonal thresholding, and extracts readable text for vectorization.

### B. Dynamic Knowledge Graph & Automated Citator (*Shepardizing Engine*)
- **Proposed Architecture**: Construct a Neo4j or NetworkX citation graph linking judgments through explicit judicial relationships:
  - `OVERRULES`
  - `AFFIRMS`
  - `DISTINGUISHES`
  - `REFERRED_TO_LARGER_BENCH`
- **Capability**: Whenever a precedent is retrieved, the engine traverses the graph to display an instant **Precedent Health Indicator**:
  - 🟢 **Good Law**: Binding authority with consistent affirmation.
  - 🟡 **Distinguished / Caution**: Subject to narrow interpretation by subsequent benches.
  - 🔴 **Overruled**: Expressly overturned by a larger bench; automatically excluded from affirmative brief generation.

### C. Temporal & Jurisdictional Corpus Expansion
- **Corpus Ingestion**: Expand the vector repository to include:
  1. Complete Supreme Court of India archives from **1950 to 2017** (adding ~450,000 historical chunks).
  2. Landmark judgments from the major commercial and constitutional High Courts (Delhi, Bombay, Calcutta, Allahabad).
- **Partitioned HNSW Indices**: Organize vector collections by jurisdiction and court level, allowing advocates to toggle between *"Supreme Court Only"* and *"High Court + Subordinate Court"* scopes.

### D. Multilingual Indic Legal Intelligence
- **Proposed Architecture**: Train and deploy specialized embeddings using **Indic-BERT** and **AI4Bharat's IndicTrans2** models.
- **Capability**: Empower rural practitioners and state litigation teams to query the corpus in Hindi, Tamil, Telugu, Marathi, or Gujarati, retrieving relevant Supreme Court rulings translated into their native language in real time.

### E. Live Supreme Court e-Filing & Cause-List Integration
- **Direct Registry Connectivity**: Interface with the official Supreme Court e-Filing 3.0 API and national e-Courts cause-lists.
- **Capability**: Advocates can input their unique Advocate-on-Record (AoR) code or Case Diary Number to automatically import case filings, track defect cure notices, and receive predictive precedent briefs tailored to the presiding bench sitting in court that morning.

### F. Air-Gapped Confidentiality Appliance for Law Chambers
- **Privacy Hardening**: In high-stakes corporate mergers, criminal defenses, and sensitive state secrets litigation, law firms cannot transmit client briefs to public cloud APIs due to strict attorney-client privilege.
- **Local Appliance Profile**: Package LAW-AI into an air-gapped on-premise rack server powered by a quantized local LLM (e.g., Llama-3-8B-Instruct or Mistral-NeMo-12B running on dual NVIDIA RTX 4090 GPUs), delivering 100% offline, zero-data-leakage legal intelligence.
