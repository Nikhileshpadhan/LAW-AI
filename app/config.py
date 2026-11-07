import os
from pathlib import Path
from typing import List
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "Supreme Court Precedent Analyzer & Legal Argument Engine"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Environment & CORS
    ALLOWED_ORIGINS: str = "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000"
    FRONTEND_URL: str = "http://localhost:5173"

    @property
    def parsed_allowed_origins(self) -> List[str]:
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]

    # Vector Engine Mode: "local" (ChromaDB + PyTorch Legal-BERT) or "qdrant" (Qdrant Cloud + HF Inference API)
    VECTOR_BACKEND: str = "local"
    
    # Local Bundle Paths (Default points to DATA/ directory in workspace)
    DATA_DIR: Path = BASE_DIR / "DATA"
    CHROMA_DB_PATH: str = str(BASE_DIR / "DATA" / "chroma_vector_db")
    CHROMA_COLLECTION_NAME: str = "supreme_court_cases_last_5yrs_legalbert"
    LEGAL_BERT_PATH: str = str(BASE_DIR / "DATA" / "legal_bert_model")
    
    # Cloud Vector Engine Settings (for 512 MB Render Free Deployments)
    HF_EMBEDDING_URL: str = "https://router.huggingface.co/hf-inference/models/nlpaueb/legal-bert-base-uncased/pipeline/feature-extraction"
    HF_API_TOKEN: str = ""
    QDRANT_URL: str = ""
    QDRANT_API_KEY: str = ""

    # Groq API Configuration
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    GROQ_FALLBACK_MODEL: str = "openai/gpt-oss-20b"
    
    # RAG Retrieval Settings
    TOP_K_PER_QUERY: int = 5
    MAX_TOTAL_PRECEDENTS: int = 15
    MIN_SIMILARITY_THRESHOLD: float = 0.50

    # Database & Authentication
    DATABASE_URL: str = "sqlite+aiosqlite:///./law_ai_local.db"
    JWT_SECRET_KEY: str = "law_ai_production_secret_key_change_in_env_2026"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    COOKIE_SECURE: bool = False

    # Email Service (Brevo HTTPS API)
    BREVO_API_KEY: str = ""
    BREVO_SENDER_EMAIL: str = "noreply@law-ai.com"
    BREVO_SENDER_NAME: str = "LAW AI Supreme Court Engine"

    # Google OAuth 2.0
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/google/callback"

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
