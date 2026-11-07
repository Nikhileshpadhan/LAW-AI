import re
import logging
from typing import List, Dict, Any, Optional
from pathlib import Path
import chromadb
from sentence_transformers import SentenceTransformer

from app.config import settings

logger = logging.getLogger(__name__)

class VectorEngine:
    _instance: Optional["VectorEngine"] = None

    def __init__(self):
        self.client: Optional[chromadb.PersistentClient] = None
        self.collection: Optional[chromadb.Collection] = None
        self.model: Optional[SentenceTransformer] = None
        self._is_initialized = False

    @classmethod
    def get_instance(cls) -> "VectorEngine":
        if cls._instance is None:
            cls._instance = VectorEngine()
        return cls._instance

    def initialize(self):
        """Initializes ChromaDB client and preloads Legal-BERT model into memory."""
        if self._is_initialized:
            return

        logger.info(f"Loading Legal-BERT model from: {settings.LEGAL_BERT_PATH}")
        model_path = Path(settings.LEGAL_BERT_PATH)
        if not model_path.exists():
            raise FileNotFoundError(f"Legal-BERT model directory not found at {model_path}")
        
        self.model = SentenceTransformer(str(model_path))
        logger.info("Legal-BERT model loaded successfully.")

        logger.info(f"Initializing ChromaDB from: {settings.CHROMA_DB_PATH}")
        db_path = Path(settings.CHROMA_DB_PATH)
        if not db_path.exists():
            raise FileNotFoundError(f"ChromaDB directory not found at {db_path}")

        self.client = chromadb.PersistentClient(path=str(db_path))
        self.collection = self.client.get_collection(name=settings.CHROMA_COLLECTION_NAME)
        count = self.collection.count()
        logger.info(f"ChromaDB collection '{settings.CHROMA_COLLECTION_NAME}' loaded with {count:,} vectors.")
        
        self._is_initialized = True

    def get_collection_count(self) -> int:
        if self.collection:
            return self.collection.count()
        return 0

    def encode(self, texts: List[str]) -> List[List[float]]:
        if not self.model:
            raise RuntimeError("VectorEngine model has not been initialized.")
        embeddings = self.model.encode(texts, convert_to_numpy=True)
        return embeddings.tolist()

    @staticmethod
    def _clean_case_title(raw_title: Optional[str]) -> str:
        if not raw_title:
            return "Supreme Court of India Judgment"
        # Remove trailing chunk number e.g. " on 9 September 2024 1" -> " on 9 September 2024"
        cleaned = re.sub(r'\s+\d+$', '', raw_title.strip())
        return cleaned

    @staticmethod
    def _extract_bench(document_text: str) -> Optional[str]:
        """Extracts Bench information if present in the chunk header text."""
        match = re.search(r'Bench:\s*([^\n\r]+)', document_text, re.IGNORECASE)
        if match:
            bench_str = match.group(1).strip()
            # Clean up if followed by other headers
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
        Embeds multiple targeted queries and retrieves unique top-ranking chunks
        from ChromaDB. Deduplicates chunks across queries and ranks by similarity.
        """
        if not self.collection or not self.model:
            raise RuntimeError("VectorEngine is not initialized.")

        query_embeddings = self.encode(queries)
        
        # Query ChromaDB for all embeddings in batch
        results = self.collection.query(
            query_embeddings=query_embeddings,
            n_results=top_k,
            include=["documents", "metadatas", "distances"]
        )

        seen_chunks: Dict[str, Dict[str, Any]] = {}

        # results keys: 'ids' -> list of lists (one per query)
        for q_idx, query_ids in enumerate(results.get("ids", [])):
            docs = results["documents"][q_idx]
            metas = results["metadatas"][q_idx]
            dists = results["distances"][q_idx]

            for chunk_id, doc_text, meta, dist in zip(query_ids, docs, metas, dists):
                # Cosine distance to similarity score
                similarity = round(max(0.0, 1.0 - float(dist)), 4)
                
                raw_title = meta.get("case_title", "")
                case_title = self._clean_case_title(raw_title)
                year = str(meta.get("year", ""))
                file_name = meta.get("file_name", "")
                bench = self._extract_bench(doc_text)

                if chunk_id in seen_chunks:
                    # Update with higher similarity score if seen
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

        # Sort all deduplicated chunks descending by similarity score
        sorted_chunks = sorted(
            seen_chunks.values(),
            key=lambda x: x["similarity_score"],
            reverse=True
        )

        return sorted_chunks[:max_total]
