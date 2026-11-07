import os
import sys
import json
from pathlib import Path

def find_bundle_dir():
    candidates = [
        Path(r"D:\PrescendenceRAG\DATA"),
        Path(r"E:\Games\PROJECTDATA\sc_judgments_5yr_complete_bundle"),
        Path(r"D:\PrescendenceRAG\sc_judgments_5yr_complete_bundle"),
    ]
    for c in candidates:
        if c.exists() and (c / "chroma_vector_db").exists():
            return c
    # Fallback to current DATA
    local_data = Path("DATA")
    if local_data.exists():
        return local_data.resolve()
    return None

def inspect_auxiliary_folders(bundle_dir: Path):
    print("\n" + "="*80)
    print("3. AUXILIARY FOLDERS INSPECTION")
    print("="*80)
    
    aux_folders = ["chunked_database", "embeddings_database", "llamaindex_storage"]
    for folder in aux_folders:
        fpath = bundle_dir / folder
        print(f"\n--- Folder: {folder} ({'EXISTS' if fpath.exists() else 'MISSING'}) ---")
        if not fpath.exists():
            continue
        
        items = list(fpath.iterdir())
        print(f"Total entries: {len(items)}")
        
        file_types = {}
        total_size = 0
        for item in items:
            if item.is_file():
                ext = item.suffix.lower() or "no_ext"
                file_types[ext] = file_types.get(ext, 0) + 1
                total_size += item.stat().st_size
            elif item.is_dir():
                file_types["[DIR]"] = file_types.get("[DIR]", 0) + 1
                
        print(f"Entry types: {file_types}")
        print(f"Total size: {total_size / (1024*1024):.2f} MB")
        
        # Sample items
        sample_items = items[:5]
        for item in sample_items:
            size_str = f"{item.stat().st_size} bytes" if item.is_file() else "DIR"
            print(f"  - {item.name} ({size_str})")
            
        # Peek into sample files if json/jsonl or txt
        for item in sample_items:
            if item.is_file() and item.suffix.lower() in [".json", ".jsonl"]:
                try:
                    with open(item, "r", encoding="utf-8") as fp:
                        if item.suffix.lower() == ".json":
                            data = json.load(fp)
                            if isinstance(data, dict):
                                print(f"    Sample JSON keys in {item.name}: {list(data.keys())[:10]}")
                            elif isinstance(data, list) and len(data) > 0:
                                print(f"    Sample JSON array length: {len(data)}, element 0 type/keys: {list(data[0].keys()) if isinstance(data[0], dict) else type(data[0])}")
                        elif item.suffix.lower() == ".jsonl":
                            line = fp.readline()
                            data = json.loads(line)
                            print(f"    Sample JSONL first line keys in {item.name}: {list(data.keys()) if isinstance(data, dict) else type(data)}")
                except Exception as e:
                    print(f"    Could not read {item.name}: {e}")
                break

def inspect_legal_bert(bundle_dir: Path):
    print("\n" + "="*80)
    print("2. LEGAL-BERT MODEL & TOKENIZER INSPECTION")
    print("="*80)
    model_dir = bundle_dir / "legal_bert_model"
    if not model_dir.exists():
        print(f"Error: {model_dir} does not exist!")
        return None
        
    files = list(model_dir.iterdir())
    print(f"Model directory contains {len(files)} files:")
    for f in sorted(files, key=lambda x: x.name):
        print(f"  - {f.name} ({f.stat().st_size / (1024*1024):.2f} MB)")
        
    config_file = model_dir / "config.json"
    model_config = {}
    if config_file.exists():
        with open(config_file, "r", encoding="utf-8") as f:
            model_config = json.load(f)
            print(f"\nModel Config Summary:")
            for k in ["_name_or_path", "architectures", "hidden_size", "max_position_embeddings", "num_attention_heads", "model_type"]:
                if k in model_config:
                    print(f"  {k}: {model_config[k]}")

    # Check sentence_bert_config or modules.json if available
    modules_file = model_dir / "modules.json"
    if modules_file.exists():
        with open(modules_file, "r", encoding="utf-8") as f:
            print(f"SentenceTransformer modules: {f.read().strip()}")
            
    # Try loading model
    print("\nLoading model and testing encoding...")
    embedding_dim = None
    pooling_method = "Unknown"
    
    # Check if it can be loaded via SentenceTransformer
    try:
        from sentence_transformers import SentenceTransformer
        print("Attempting to load with SentenceTransformer...")
        st_model = SentenceTransformer(str(model_dir))
        dummy_query = "anticipatory bail under section 438 CrPC in economic offences"
        emb = st_model.encode(dummy_query)
        embedding_dim = len(emb)
        print(f"Loaded successfully with SentenceTransformer!")
        print(f"Generated embedding shape: {emb.shape}")
        print(f"Vector dimension: {embedding_dim}")
        print(f"Sample embedding slice (first 5 values): {emb[:5]}")
        return {"loaded_via": "SentenceTransformer", "dim": embedding_dim, "model": st_model}
    except Exception as st_err:
        print(f"SentenceTransformer load failed: {st_err}")
        
    # Fallback to HuggingFace AutoModel / AutoTokenizer
    try:
        import torch
        from transformers import AutoTokenizer, AutoModel
        print("Attempting to load with transformers AutoTokenizer & AutoModel...")
        tokenizer = AutoTokenizer.from_pretrained(str(model_dir))
        model = AutoModel.from_pretrained(str(model_dir))
        model.eval()
        dummy_query = "anticipatory bail under section 438 CrPC in economic offences"
        inputs = tokenizer(dummy_query, return_tensors="pt", truncation=True, max_length=512)
        with torch.no_grad():
            outputs = model(**inputs)
            # CLS pooling
            cls_emb = outputs.last_hidden_state[:, 0, :].squeeze()
            # Mean pooling
            mask = inputs['attention_mask'].unsqueeze(-1).expand(outputs.last_hidden_state.size()).float()
            sum_emb = torch.sum(outputs.last_hidden_state * mask, 1)
            sum_mask = torch.clamp(mask.sum(1), min=1e-9)
            mean_emb = (sum_emb / sum_mask).squeeze()
            
        print(f"Loaded successfully with transformers!")
        print(f"Last hidden state shape: {outputs.last_hidden_state.shape}")
        print(f"Hidden size / embedding dim: {cls_emb.shape[0]}")
        print(f"Sample CLS embedding slice (first 5): {cls_emb[:5].tolist()}")
        print(f"Sample Mean embedding slice (first 5): {mean_emb[:5].tolist()}")
        return {"loaded_via": "transformers", "dim": cls_emb.shape[0], "tokenizer": tokenizer, "model": model}
    except Exception as tf_err:
        print(f"transformers load failed: {tf_err}")
        return None

def inspect_chromadb(bundle_dir: Path):
    print("\n" + "="*80)
    print("1. CHROMADB SCHEMA & COLLECTION INSPECTION")
    print("="*80)
    chroma_dir = bundle_dir / "chroma_vector_db"
    if not chroma_dir.exists():
        print(f"Error: {chroma_dir} does not exist!")
        return None
        
    try:
        import chromadb
        client = chromadb.PersistentClient(path=str(chroma_dir))
        collections = client.list_collections()
        print(f"Found {len(collections)} collection(s) in ChromaDB:")
        
        col_info = {}
        for col in collections:
            count = col.count()
            print(f"\nCollection Name: '{col.name}'")
            print(f"  Total Vector Count: {count}")
            print(f"  Collection Metadata: {col.metadata}")
            
            # Peek records
            peek_size = min(2, count)
            if peek_size > 0:
                peek_data = col.peek(limit=peek_size)
                ids = peek_data.get("ids", [])
                metadatas = peek_data.get("metadatas", [])
                documents = peek_data.get("documents", [])
                embeddings = peek_data.get("embeddings", None)
                
                print(f"\n  Sample Record 1:")
                if ids:
                    print(f"    ID: {ids[0]}")
                if metadatas and len(metadatas) > 0:
                    print(f"    Metadata Keys: {list(metadatas[0].keys())}")
                    print(f"    Metadata Details: {json.dumps(metadatas[0], indent=6, default=str)}")
                if documents and len(documents) > 0:
                    doc_snippet = documents[0][:300].replace('\n', ' ')
                    print(f"    Document Text (first 300 chars): {doc_snippet}...")
                    print(f"    Full Document Length: {len(documents[0])} chars")
                if embeddings is not None and len(embeddings) > 0 and embeddings[0] is not None:
                    print(f"    Embedding Dimension: {len(embeddings[0])}")
                    print(f"    Sample Embedding (first 5 vals): {embeddings[0][:5]}")
                else:
                    # Let's try getting 1 item with embeddings
                    item_with_emb = col.get(ids=[ids[0]], include=["embeddings", "metadatas", "documents"])
                    embs = item_with_emb.get("embeddings", [])
                    if embs is not None and len(embs) > 0 and embs[0] is not None:
                        print(f"    Embedding Dimension: {len(embs[0])}")
                        print(f"    Sample Embedding (first 5 vals): {embs[0][:5]}")
                    else:
                        print(f"    Embeddings not returned by peek/get directly.")
                        
                if peek_size > 1:
                    print(f"\n  Sample Record 2:")
                    print(f"    ID: {ids[1]}")
                    if metadatas and len(metadatas) > 1:
                        print(f"    Metadata Keys: {list(metadatas[1].keys())}")
                        print(f"    Metadata Details: {json.dumps(metadatas[1], indent=6, default=str)}")
                    if documents and len(documents) > 1:
                        doc_snippet = documents[1][:300].replace('\n', ' ')
                        print(f"    Document Text (first 300 chars): {doc_snippet}...")
                        print(f"    Full Document Length: {len(documents[1])} chars")
                        
            col_info[col.name] = {"count": count, "metadata": col.metadata}
        return col_info
    except Exception as e:
        print(f"Error inspecting ChromaDB: {e}")
        import traceback
        traceback.print_exc()
        return None

def main():
    bundle_dir = find_bundle_dir()
    print("="*80)
    print("SUPREME COURT PRECEDENT RAG BUNDLE DIAGNOSTIC")
    print("="*80)
    print(f"Detected Bundle Directory: {bundle_dir}")
    if not bundle_dir or not bundle_dir.exists():
        print("ERROR: Bundle directory could not be found.")
        sys.exit(1)
        
    inspect_chromadb(bundle_dir)
    inspect_legal_bert(bundle_dir)
    inspect_auxiliary_folders(bundle_dir)
    print("\n" + "="*80)
    print("DIAGNOSTIC COMPLETED")
    print("="*80)

if __name__ == "__main__":
    main()
