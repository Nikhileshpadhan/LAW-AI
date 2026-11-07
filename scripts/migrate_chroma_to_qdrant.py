#!/usr/bin/env python3
"""
scripts/migrate_chroma_to_qdrant.py
Batch migration script from local ChromaDB to Qdrant Cloud.
Migrates all 76,802 Supreme Court chunks with 768-D embeddings and metadata.
"""

import os
import sys
import time
import uuid
import logging
from pathlib import Path
from typing import List, Dict, Any

# Ensure project root in sys.path
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from app.config import settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [%(levelname)s] - %(message)s"
)
logger = logging.getLogger("migrate_qdrant")

def migrate():
    try:
        import chromadb
        from qdrant_client import QdrantClient
        from qdrant_client.http import models as rest
    except ImportError as e:
        logger.error(f"Missing required packages: {e}. Install via: pip install chromadb qdrant-client")
        sys.exit(1)

    qdrant_url = settings.QDRANT_URL or os.environ.get("QDRANT_URL")
    qdrant_key = settings.QDRANT_API_KEY or os.environ.get("QDRANT_API_KEY")
    collection_name = settings.CHROMA_COLLECTION_NAME

    if not qdrant_url:
        logger.error("QDRANT_URL must be set in .env or environment.")
        sys.exit(1)

    chroma_path = Path(settings.CHROMA_DB_PATH)
    if not chroma_path.exists():
        logger.error(f"ChromaDB not found at {chroma_path}")
        sys.exit(1)

    logger.info(f"Opening local ChromaDB at {chroma_path}...")
    chroma_client = chromadb.PersistentClient(path=str(chroma_path))
    collection = chroma_client.get_collection(name=collection_name)
    total_count = collection.count()
    logger.info(f"Local Chroma collection '{collection_name}' contains {total_count:,} chunks.")

    logger.info(f"Connecting to Qdrant Cloud at {qdrant_url}...")
    qdrant = QdrantClient(url=qdrant_url, api_key=qdrant_key, timeout=30.0)

    # Recreate or ensure collection
    collections = [c.name for c in qdrant.get_collections().collections]
    if collection_name not in collections:
        logger.info(f"Creating collection '{collection_name}' with 768-D Cosine vectors...")
        qdrant.create_collection(
            collection_name=collection_name,
            vectors_config=rest.VectorParams(size=768, distance=rest.Distance.COSINE)
        )
    else:
        logger.info(f"Collection '{collection_name}' already exists in Qdrant.")

    batch_size = 500
    offset = 0
    migrated = 0
    start_time = time.time()

    logger.info(f"Beginning batch migration of {total_count:,} points (batch size: {batch_size})...")

    while offset < total_count:
        try:
            # Fetch batch from ChromaDB
            data = collection.get(
                limit=batch_size,
                offset=offset,
                include=["embeddings", "documents", "metadatas"]
            )
            ids = data.get("ids", [])
            if not ids:
                break

            embeddings = data.get("embeddings", [])
            docs = data.get("documents", [])
            metas = data.get("metadatas", [])

            points: List[rest.PointStruct] = []
            for chunk_id, emb, doc_text, meta in zip(ids, embeddings, docs, metas):
                point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, chunk_id))
                meta_dict = meta or {}
                payload = {
                    "chunk_id": chunk_id,
                    "case_title": meta_dict.get("case_title", ""),
                    "year": str(meta_dict.get("year", "")),
                    "file_name": meta_dict.get("file_name", ""),
                    "document_text": doc_text or ""
                }
                points.append(
                    rest.PointStruct(
                        id=point_id,
                        vector=emb,
                        payload=payload
                    )
                )

            # Upsert into Qdrant Cloud with retry
            max_retries = 3
            for attempt in range(1, max_retries + 1):
                try:
                    qdrant.upsert(
                        collection_name=collection_name,
                        points=points,
                        wait=False
                    )
                    break
                except Exception as retry_err:
                    if attempt == max_retries:
                        raise retry_err
                    logger.warning(f"Batch upsert failed (attempt {attempt}/{max_retries}): {retry_err}. Retrying in 2s...")
                    time.sleep(2)

            migrated += len(points)
            offset += len(points)
            pct = (migrated / total_count) * 100
            elapsed = time.time() - start_time
            rate = migrated / max(1.0, elapsed)
            logger.info(f"Progress: {migrated:,}/{total_count:,} ({pct:.1f}%) | Speed: {rate:.0f} pts/sec")

        except Exception as batch_err:
            logger.exception(f"Fatal error migrating batch at offset {offset}: {batch_err}")
            sys.exit(1)

    total_time = round(time.time() - start_time, 2)
    logger.info(f"Migration completed successfully! {migrated:,} points migrated to Qdrant Cloud in {total_time}s.")

if __name__ == "__main__":
    migrate()
