import os
from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    # App Settings
    APP_NAME: str = "Supreme Court Precedent Analyzer & Legal Argument Engine"
    DEBUG: bool = False
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # Bundle Paths (Auto-resolves relative to project root or custom override)
    DATA_DIR: Path = BASE_DIR / "DATA"
    CHROMA_DB_PATH: str = str(BASE_DIR / "DATA" / "chroma_vector_db")
    CHROMA_COLLECTION_NAME: str = "supreme_court_cases_last_5yrs_legalbert"
    LEGAL_BERT_PATH: str = str(BASE_DIR / "DATA" / "legal_bert_model")
    
    # Groq API Configuration
    GROQ_API_KEY: str = ""
    GROQ_MODEL: str = "openai/gpt-oss-120b"
    GROQ_FALLBACK_MODEL: str = "openai/gpt-oss-20b"
    
    # RAG Retrieval Settings
    TOP_K_PER_QUERY: int = 5
    MAX_TOTAL_PRECEDENTS: int = 15
    MIN_SIMILARITY_THRESHOLD: float = 0.50

    model_config = SettingsConfigDict(
        env_file=str(BASE_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
