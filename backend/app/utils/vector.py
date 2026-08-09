import os
import logging
from app.utils.db import get_db

logger = logging.getLogger(__name__)

def dot_product(v1, v2):
    """Calculates dot product of two vectors."""
    return sum(x * y for x, y in zip(v1, v2))

def magnitude(v):
    """Calculates Euclidean magnitude of a vector."""
    return sum(x * x for x in v) ** 0.5

def cosine_similarity(v1, v2):
    """Calculates cosine similarity between two vectors."""
    mag1 = magnitude(v1)
    mag2 = magnitude(v2)
    if mag1 == 0 or mag2 == 0:
        return 0.0
    return dot_product(v1, v2) / (mag1 * mag2)

class BaseVectorIndex:
    def add_documents(self, pdf_id, chunks):
        pass
    def query_similarity(self, pdf_id_list, query_emb, limit=4):
        pass

class InMemoryVectorIndex(BaseVectorIndex):
    def add_documents(self, pdf_id, chunks):
        pass

    def query_similarity(self, pdf_id_list, query_emb, limit=4):
        db = get_db()
        chunks_col = db.get_collection("pdf_chunks")
        chunks = list(chunks_col.find({"pdf_id": {"$in": pdf_id_list}}))
        
        retrieved = []
        for c in chunks:
            emb = c.get("embedding")
            if emb:
                score = cosine_similarity(query_emb, emb)
                confidence = int(score * 100)
                retrieved.append({
                    "text": c["text"],
                    "page": c.get("page_number", c.get("page", 1)),
                    "chapter": c.get("chapter_title", c.get("chapter", "General Overview")),
                    "section": c.get("section_heading", "General"),
                    "pdf_id": c["pdf_id"],
                    "confidence": confidence,
                    "score": score
                })
        retrieved.sort(key=lambda x: x["score"], reverse=True)
        return retrieved[:limit]

class PluggableVectorIndex(BaseVectorIndex):
    def __init__(self):
        self.chroma_client = None
        self.backend = "in-memory"
        
        try:
            import chromadb
            from app.config import Config
            chroma_dir = os.path.join(Config.LOG_DIR, "chromadb")
            os.makedirs(chroma_dir, exist_ok=True)
            self.chroma_client = chromadb.PersistentClient(path=chroma_dir)
            self.backend = "chromadb"
            logger.info("Pluggable Vector Index: ChromaDB backend initialized.")
        except ImportError:
            try:
                import faiss
                self.backend = "faiss"
                logger.info("Pluggable Vector Index: FAISS backend detected.")
            except ImportError:
                logger.info("Pluggable Vector Index: ChromaDB/FAISS not found. Falling back to InMemory DB Search.")
                
        self.in_memory_index = InMemoryVectorIndex()

    def add_documents(self, pdf_id, chunks):
        if self.backend == "chromadb" and self.chroma_client:
            try:
                collection = self.chroma_client.get_or_create_collection(name=f"pdf_{pdf_id}")
                ids = [c["chunk_id"] for c in chunks]
                embeddings = [c["embedding"] for c in chunks]
                metadatas = [{
                    "page_number": c["page_number"],
                    "chapter_title": c["chapter_title"],
                    "section_heading": c["section_heading"],
                    "pdf_id": pdf_id
                } for c in chunks]
                documents = [c["text"] for c in chunks]
                
                collection.add(
                    ids=ids,
                    embeddings=embeddings,
                    metadatas=metadatas,
                    documents=documents
                )
                logger.info(f"Added {len(chunks)} documents to ChromaDB collection pdf_{pdf_id}.")
            except Exception as e:
                logger.error(f"ChromaDB add_documents failed: {e}. Falling back to InMemory.")
                self.in_memory_index.add_documents(pdf_id, chunks)
        else:
            self.in_memory_index.add_documents(pdf_id, chunks)

    def query_similarity(self, pdf_id_list, query_emb, limit=4):
        if self.backend == "chromadb" and self.chroma_client:
            try:
                all_results = []
                for pdf_id in pdf_id_list:
                    collection = self.chroma_client.get_or_create_collection(name=f"pdf_{pdf_id}")
                    res = collection.query(
                        query_embeddings=[query_emb],
                        n_results=limit
                    )
                    if res and res["ids"] and len(res["ids"][0]) > 0:
                        for idx in range(len(res["ids"][0])):
                            doc_text = res["documents"][0][idx]
                            metadata = res["metadatas"][0][idx]
                            distance = res["distances"][0][idx] if "distances" in res else 0.5
                            score = 1.0 / (1.0 + distance)
                            confidence = int(score * 100)
                            
                            all_results.append({
                                "text": doc_text,
                                "page": metadata.get("page_number", 1),
                                "chapter": metadata.get("chapter_title", "General Overview"),
                                "section": metadata.get("section_heading", "General"),
                                "pdf_id": pdf_id,
                                "confidence": confidence,
                                "score": score
                            })
                all_results.sort(key=lambda x: x["score"], reverse=True)
                return all_results[:limit]
            except Exception as e:
                logger.error(f"ChromaDB query failed: {e}. Falling back to InMemory Vector index.")
                return self.in_memory_index.query_similarity(pdf_id_list, query_emb, limit)
        else:
            return self.in_memory_index.query_similarity(pdf_id_list, query_emb, limit)

# Global Instance
vector_index_instance = PluggableVectorIndex()

def get_vector_index():
    return vector_index_instance
