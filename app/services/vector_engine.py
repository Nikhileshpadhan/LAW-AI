import re
import math
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path
import httpx

from app.config import settings

logger = logging.getLogger(__name__)

class VectorEngine:
    _instance: Optional["VectorEngine"] = None

    def __init__(self):
        self.backend: str = settings.VECTOR_BACKEND
        # Local backend attributes (lazy-loaded)
        self.client: Optional[Any] = None
        self.collection: Optional[Any] = None
        self.model: Optional[Any] = None
        # Qdrant backend attributes
        self.qdrant_client: Optional[Any] = None
        self._is_initialized = False

    @classmethod
    def get_instance(cls) -> "VectorEngine":
        if cls._instance is None:
            cls._instance = VectorEngine()
        return cls._instance

    def initialize(self):
        """Initializes either local ChromaDB or Cloud Qdrant backend."""
        if self._is_initialized:
            return

        # Auto-detect if local DATA is missing but Qdrant URL is configured
        db_path = Path(settings.CHROMA_DB_PATH)
        if self.backend == "local" and not db_path.exists() and settings.QDRANT_URL:
            logger.info("Local ChromaDB path not found, falling back to Qdrant Cloud backend.")
            self.backend = "qdrant"

        if self.backend == "local":
            self._initialize_local()
        else:
            self._initialize_qdrant()

        self._is_initialized = True

    def _initialize_local(self):
        """Lazy load local SentenceTransformer and ChromaDB to keep 512MB RAM cloud footprint tiny."""
        try:
            import chromadb
            from sentence_transformers import SentenceTransformer
        except ImportError as e:
            raise ImportError(
                f"Local vector backend requires 'chromadb' and 'sentence-transformers': {e}. "
                "Install them via 'pip install -r requirements-local.txt' or set VECTOR_BACKEND='qdrant'."
            )

        logger.info(f"Loading local Legal-BERT model from: {settings.LEGAL_BERT_PATH}")
        model_path = Path(settings.LEGAL_BERT_PATH)
        if not model_path.exists():
            raise FileNotFoundError(f"Legal-BERT model directory not found at {model_path}")
        
        self.model = SentenceTransformer(str(model_path))
        logger.info("Local Legal-BERT model loaded successfully.")

        logger.info(f"Initializing local ChromaDB from: {settings.CHROMA_DB_PATH}")
        db_path = Path(settings.CHROMA_DB_PATH)
        if not db_path.exists():
            raise FileNotFoundError(f"ChromaDB directory not found at {db_path}")

        self.client = chromadb.PersistentClient(path=str(db_path))
        self.collection = self.client.get_collection(name=settings.CHROMA_COLLECTION_NAME)
        count = self.collection.count()
        logger.info(f"ChromaDB collection '{settings.CHROMA_COLLECTION_NAME}' loaded with {count:,} vectors.")

    def _initialize_qdrant(self):
        """Initializes Qdrant Cloud client for lightweight 512MB RAM cloud instances."""
        try:
            from qdrant_client import QdrantClient
        except ImportError as e:
            raise ImportError(f"Qdrant backend requires 'qdrant-client': {e}. Install via 'pip install qdrant-client'.")

        if not settings.QDRANT_URL:
            raise ValueError("QDRANT_URL is required when VECTOR_BACKEND='qdrant'.")

        logger.info(f"Connecting to Qdrant Cloud at: {settings.QDRANT_URL}")
        self.qdrant_client = QdrantClient(
            url=settings.QDRANT_URL,
            api_key=settings.QDRANT_API_KEY or None,
            timeout=15.0
        )
        try:
            coll_info = self.qdrant_client.get_collection(settings.CHROMA_COLLECTION_NAME)
            points_count = coll_info.points_count or 0
            logger.info(f"Qdrant collection '{settings.CHROMA_COLLECTION_NAME}' verified with {points_count:,} points.")
        except Exception as e:
            logger.warning(f"Could not fetch collection info from Qdrant: {e}")

    def get_collection_count(self) -> int:
        if self.backend == "local":
            return self.collection.count() if self.collection else 0
        elif self.backend == "qdrant" and self.qdrant_client:
            try:
                coll = self.qdrant_client.get_collection(settings.CHROMA_COLLECTION_NAME)
                return coll.points_count or 0
            except Exception:
                return 0
        return 0

    def encode(self, texts: List[str]) -> List[List[float]]:
        """Encodes texts to 768-D vectors using either local SentenceTransformer or HF Inference API."""
        if self.backend == "local":
            if not self.model:
                raise RuntimeError("Local VectorEngine model has not been initialized.")
            embeddings = self.model.encode(texts, convert_to_numpy=True)
            return embeddings.tolist()
        else:
            return self._encode_hf_api(texts)

    def _encode_hf_api(self, texts: List[str]) -> List[List[float]]:
        """Calls Hugging Face Inference API to encode texts into 768-D normalized vectors."""
        headers = {}
        if settings.HF_API_TOKEN:
            headers["Authorization"] = f"Bearer {settings.HF_API_TOKEN}"

        embeddings: List[List[float]] = []
        with httpx.Client(timeout=30.0) as client:
            for text in texts:
                res = client.post(
                    settings.HF_EMBEDDING_URL,
                    headers=headers,
                    json={"inputs": text}
                )
                if res.status_code != 200:
                    raise RuntimeError(f"Hugging Face Inference API error ({res.status_code}): {res.text}")
                data = res.json()
                
                # Check shape: 1D [768], 2D [tokens, 768], or list of list
                if isinstance(data, list) and data and isinstance(data[0], list):
                    # Token embeddings -> Mean pool across tokens
                    token_vectors = data
                    dim = len(token_vectors[0])
                    mean_vec = [0.0] * dim
                    for tok in token_vectors:
                        for d_idx, val in enumerate(tok):
                            mean_vec[d_idx] += val
                    count = max(1, len(token_vectors))
                    mean_vec = [v / count for v in mean_vec]
                    # L2 Normalize
                    norm = math.sqrt(sum(v * v for v in mean_vec)) or 1.0
                    norm_vec = [v / norm for v in mean_vec]
                    embeddings.append(norm_vec)
                elif isinstance(data, list) and data and isinstance(data[0], (int, float)):
                    # Direct sentence embedding
                    vec = [float(v) for v in data]
                    norm = math.sqrt(sum(v * v for v in vec)) or 1.0
                    embeddings.append([v / norm for v in vec])
                else:
                    raise ValueError(f"Unexpected HF embedding format: {type(data)}")

        return embeddings

    @staticmethod
    def _clean_case_title(raw_title: Optional[str]) -> str:
        if not raw_title:
            return "Supreme Court of India Judgment"
        cleaned = re.sub(r'\s+\d+$', '', raw_title.strip())
        return cleaned

    @staticmethod
    def _extract_bench(document_text: str) -> Optional[str]:
        match = re.search(r'Bench:\s*([^\n\r]+)', document_text, re.IGNORECASE)
        if match:
            bench_str = match.group(1).strip()
            bench_str = re.split(r'(Author:|IN THE|DATE:)', bench_str)[0].strip()
            if bench_str:
                return bench_str
        return "Supreme Court of India"

    def retrieve_top_precedents(
        self,
        queries: List[str],
        top_k: int = 5,
        max_total: int = 15
    ) -> List[Dict[str, Any]]:
        """
        Retrieves top precedents using active backend (Local Chroma or Cloud Qdrant).
        Applies settings.MIN_SIMILARITY_THRESHOLD with fallback to top 3.
        """
        if self.backend == "local":
            return self._retrieve_local(queries, top_k, max_total)
        else:
            return self._retrieve_qdrant(queries, top_k, max_total)

    def _retrieve_local(self, queries: List[str], top_k: int, max_total: int) -> List[Dict[str, Any]]:
        if not self.collection or not self.model:
            raise RuntimeError("Local VectorEngine is not initialized.")

        query_embeddings = self.encode(queries)
        results = self.collection.query(
            query_embeddings=query_embeddings,
            n_results=top_k,
            include=["documents", "metadatas", "distances"]
        )

        seen_chunks: Dict[str, Dict[str, Any]] = {}

        for q_idx, query_ids in enumerate(results.get("ids", [])):
            docs = results["documents"][q_idx]
            metas = results["metadatas"][q_idx]
            dists = results["distances"][q_idx]

            for chunk_id, doc_text, meta, dist in zip(query_ids, docs, metas, dists):
                similarity = round(max(0.0, 1.0 - float(dist)), 4)
                raw_title = meta.get("case_title", "")
                case_title = self._clean_case_title(raw_title)
                year = str(meta.get("year", ""))
                file_name = meta.get("file_name", "")
                bench = self._extract_bench(doc_text)

                if chunk_id in seen_chunks:
                    if similarity > seen_chunks[chunk_id]["similarity_score"]:
                        seen_chunks[chunk_id]["similarity_score"] = similarity
                        seen_chunks[chunk_id]["matched_query"] = queries[q_idx]
                else:
                    seen_chunks[chunk_id] = {
                        "chunk_id": chunk_id,
                        "case_name": case_title,
                        "year": year,
                        "file_name": file_name,
                        "bench": bench,
                        "document_text": doc_text,
                        "similarity_score": similarity,
                        "matched_query": queries[q_idx]
                    }

        sorted_chunks = sorted(
            seen_chunks.values(),
            key=lambda x: x["similarity_score"],
            reverse=True
        )

        # Apply MIN_SIMILARITY_THRESHOLD with fallback to top 3
        threshold = settings.MIN_SIMILARITY_THRESHOLD
        filtered = [c for c in sorted_chunks if c["similarity_score"] >= threshold]
        if not filtered and sorted_chunks:
            filtered = sorted_chunks[:3]

        return filtered[:max_total]

    def _retrieve_qdrant(self, queries: List[str], top_k: int, max_total: int) -> List[Dict[str, Any]]:
        if not self.qdrant_client:
            raise RuntimeError("Qdrant VectorEngine is not initialized.")

        query_embeddings = self.encode(queries)
        seen_chunks: Dict[str, Dict[str, Any]] = {}

        for q_idx, embedding in enumerate(query_embeddings):
            search_results = self.qdrant_client.query_points(
                collection_name=settings.CHROMA_COLLECTION_NAME,
                query=embedding,
                limit=top_k,
                with_payload=True
            ).points

            for hit in search_results:
                payload = hit.payload or {}
                chunk_id = str(payload.get("chunk_id") or hit.id)
                similarity = round(float(hit.score), 4)
                raw_title = payload.get("case_title", "")
                case_title = self._clean_case_title(raw_title)
                year = str(payload.get("year", ""))
                file_name = payload.get("file_name", "")
                doc_text = payload.get("document_text", "")
                bench = self._extract_bench(doc_text)

                if chunk_id in seen_chunks:
                    if similarity > seen_chunks[chunk_id]["similarity_score"]:
                        seen_chunks[chunk_id]["similarity_score"] = similarity
                        seen_chunks[chunk_id]["matched_query"] = queries[q_idx]
                else:
                    seen_chunks[chunk_id] = {
                        "chunk_id": chunk_id,
                        "case_name": case_title,
                        "year": year,
                        "file_name": file_name,
                        "bench": bench,
                        "document_text": doc_text,
                        "similarity_score": similarity,
                        "matched_query": queries[q_idx]
                    }

        sorted_chunks = sorted(
            seen_chunks.values(),
            key=lambda x: x["similarity_score"],
            reverse=True
        )

        # Apply MIN_SIMILARITY_THRESHOLD with fallback to top 3
        threshold = settings.MIN_SIMILARITY_THRESHOLD
        filtered = [c for c in sorted_chunks if c["similarity_score"] >= threshold]
        if not filtered and sorted_chunks:
            filtered = sorted_chunks[:3]

        return filtered[:max_total]
