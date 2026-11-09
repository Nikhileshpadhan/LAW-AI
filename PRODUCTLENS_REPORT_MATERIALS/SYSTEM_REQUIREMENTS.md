# SYSTEM REQUIREMENTS & DEPLOYMENT GUIDE

## 1. Hardware Requirements

The **LAW-AI** platform has been engineered to run efficiently across both resource-constrained student laptops and scalable production cloud environments. Thanks to the custom **Legal-BERT INT8 ONNX Quantization** and optimized asynchronous Python event loops, the application can operate smoothly on low-memory instances without sacrificing retrieval precision or inference speed.

### Hardware Specification Matrix

| Component | Minimum Specification (Local Student Evaluation) | Recommended Specification (Production / Multi-User Server) | Cloud Tier Profile (Render / Vercel Free Tier) |
|---|---|---|---|
| **Processor (CPU)** | Intel Core i3 / AMD Ryzen 3 (Dual-core, 2.0 GHz) | Intel Core i5 / AMD Ryzen 5 (Quad-core or higher, 2.8+ GHz) | 0.5 vCPU (Shared Cloud Core) |
| **Random Access Memory (RAM)** | **4.0 GB RAM** (Sufficient with ONNX runtime & SQLite) | **8.0 GB – 16.0 GB RAM** (Allows simultaneous local ChromaDB in-memory caching) | **512 MB RAM** (Strict ceiling maintained via Qdrant Cloud + ONNX) |
| **Persistent Storage (Disk)** | **2.0 GB free SSD space** (Source code, node_modules, SQLite DB, ONNX weights) | **10.0 GB free NVMe SSD** (Includes full local 76,802 ChromaDB vector index) | 1.0 GB ephemeral cloud disk |
| **Display Resolution** | 1280 x 720 (HD) | 1920 x 1080 (Full HD, 100% DPI) | Headless Server / Web UI |
| **Network Interface** | Active broadband or Wi-Fi (5 Mbps minimum for cloud AI API communication) | High-speed dedicated link (25+ Mbps) | 1 Gbps cloud virtual NIC |

---

## 2. Software Requirements

### A. Operating System Compatibility
- **Microsoft Windows**: Windows 10 (64-bit) or Windows 11 (Build 22000+) *(Development & native evaluation platform)*.
- **Linux**: Ubuntu 20.04 LTS / 22.04 LTS, Debian 12, Fedora 38+.
- **macOS**: macOS 12 (Monterey), 13 (Ventura), or 14 (Sonoma) on Apple Silicon (M1/M2/M3) or Intel x86_64.

### B. Core Runtime Environments
1. **Python Environment**:
   - Version: **Python 3.12.x (64-bit)** *(Required)*
   - Package Installer: `pip` version 24.0 or higher
   - Virtual Environment: Built-in `venv` module or `virtualenv`
2. **JavaScript / Node.js Environment**:
   - Version: **Node.js 20.x or 22.x LTS**
   - Package Manager: `npm` version 10.0 or higher

### C. Database & Caching Engines
- **Local Embedded Mode**: SQLite 3.40+ (handled transparently by Python's `aiosqlite` and ChromaDB).
- **Production Serverless Mode**: PostgreSQL 16+ via Neon Serverless (`ep-fragrant-night...neon.tech`) connected over SSL (`asyncpg`).

### D. Supported Web Browsers
The responsive web application is verified across all modern ECMAScript 2023 compliant browsers:
- **Google Chrome**: Version 115 or higher *(Recommended)*
- **Microsoft Edge**: Version 115 or higher (Chromium engine)
- **Mozilla Firefox**: Version 115 or higher
- **Apple Safari**: Version 16.0 or higher
- **Mobile Browsers**: Chrome Mobile (Android 11+), Safari Mobile (iOS 16+)

---

## 3. Network Ports & Firewall Configuration

| Service / Component | Default Port | Protocol | Purpose / Direction |
|---|---|---|---|
| **FastAPI Backend Service** | `8000` | HTTP / REST | Local backend listener (`http://localhost:8000`) |
| **Vite Frontend Dev Server** | `5173` | HTTP / WebSocket | Frontend UI listener with Hot-Module Reload (`http://localhost:5173`) |
| **Interactive API Documentation**| `8000/docs` | HTTP | Swagger UI OpenAPI specification |
| **Groq Cloud API** | `443` | HTTPS (Outbound) | LPU LLM inference calls to `api.groq.com` |
| **Qdrant Cloud API** | `6333 / 443` | HTTPS (Outbound) | Vector similarity search to `sa-east-1-0.aws.cloud.qdrant.io` |
| **Neon PostgreSQL** | `5432` | TCP / SSL (Outbound) | Cloud relational database persistence |
| **Brevo Email API** | `443` | HTTPS (Outbound) | Transactional email delivery to `api.brevo.com` |

---

## 4. Step-by-Step Installation & Local Setup Guide

Follow the sequence below to set up and execute the full LAW-AI platform from a clean terminal.

### Step 1: Clone or Open the Project Repository
```bash
# Navigate to the workspace root directory
cd D:\PrescendenceRAG
```

### Step 2: Configure Environment Variables
Create a `.env` file in the root directory (`D:\PrescendenceRAG\.env`) with the following baseline configuration:
```ini
# Application Core
APP_NAME="Supreme Court Precedent Analyzer & Legal Argument Engine"
DEBUG=True
HOST="0.0.0.0"
PORT=8000

# CORS Allowed Origins
ALLOWED_ORIGINS="http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000"
FRONTEND_URL="http://localhost:5173"

# Vector Engine Selection
# Use "local" if DATA/chroma_vector_db exists, or "qdrant" for cloud vectors
VECTOR_BACKEND="local"
CHROMA_DB_PATH="D:/PrescendenceRAG/DATA/chroma_vector_db"
CHROMA_COLLECTION_NAME="supreme_court_cases_last_5yrs_legalbert"
LEGAL_BERT_PATH="D:/PrescendenceRAG/DATA/legal_bert_model"

# Optional Cloud Vector Backend
QDRANT_URL=""
QDRANT_API_KEY=""

# AI Generation via Groq Cloud
GROQ_API_KEY="your_groq_api_key_here"
GROQ_MODEL="openai/gpt-oss-120b"
GROQ_FALLBACK_MODEL="openai/gpt-oss-20b"

# Security & Authentication
DATABASE_URL="sqlite+aiosqlite:///./law_ai_local.db"
JWT_SECRET_KEY="law_ai_super_secret_development_key_change_in_prod"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7
COOKIE_SECURE=False

# Optional Transactional Email Delivery (Brevo)
BREVO_API_KEY=""
BREVO_SENDER_EMAIL="noreply@law-ai.com"
```

### Step 3: Set Up Backend Virtual Environment
```bash
# 1. Create a dedicated Python 3.12 virtual environment
python -m venv .venv

# 2. Activate the virtual environment
# On Windows PowerShell:
.\.venv\Scripts\Activate.ps1
# On Linux / macOS:
source .venv/bin/activate

# 3. Upgrade pip to the latest version
python -m pip install --upgrade pip

# 4. Install backend dependencies
pip install -r requirements.txt
```

### Step 4: Set Up Frontend Dependencies
```bash
# Navigate to the frontend directory
cd frontend

# Install all npm packages specified in package.json
npm install

# Return to root directory
cd ..
```

---

## 5. System Execution & Verification Procedures

### Starting the Backend Application
Open a dedicated terminal window (with the virtual environment activated):
```bash
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
**Expected Backend Console Output:**
```
INFO:     Started server process [PID]
INFO:     Waiting for application startup.
INFO:     Initializing database tables...
INFO:     Loading local Legal-BERT model from: D:\PrescendenceRAG\DATA\legal_bert_model
INFO:     ChromaDB collection 'supreme_court_cases_last_5yrs_legalbert' loaded with 76,802 vectors.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### Starting the Frontend Application
Open a second dedicated terminal window:
```bash
cd frontend
npm run dev -- --host 0.0.0.0 --port 5173
```
**Expected Frontend Console Output:**
```
  VITE v6.4.1  ready in 420 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: http://0.0.0.0:5173/
  ➜  press h + enter to show help
```

### Verification Checklist
1. **Interactive OpenAPI Documentation**: Open a web browser to `http://localhost:8000/docs`. The Swagger UI should render 12 endpoints.
2. **Health Check Endpoint**: Execute `curl http://localhost:8000/api/v1/health`. It must return `{"status":"healthy","total_vectors":76802,"legal_bert_status":"loaded"}`.
3. **Frontend Application**: Open `http://localhost:5173/` in Google Chrome or Microsoft Edge. The judicial courtroom hero screen and advocacy chamber workspace must render without console errors.
