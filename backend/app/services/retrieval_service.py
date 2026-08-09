import re
from abc import ABC, abstractmethod
from collections import Counter

class DocumentRetriever(ABC):
    @abstractmethod
    def retrieve_chunks(self, pdf_doc, query, limit=3):
        """Retrieves most relevant chunks from a PDF document."""
        pass

class WeightedKeywordRetriever(DocumentRetriever):
    def retrieve_chunks(self, pdf_doc, query, limit=3):
        """
        Retrieves relevant text chunks from the parsed PDF.
        Applies term overlap calculations boosted by heading, title, and chapter weights.
        """
        extracted_text = pdf_doc.get("extracted_text", "")
        if not extracted_text:
            return []
            
        # Parse query tokens
        query_words = set(re.findall(r"\w+", query.lower()))
        if not query_words:
            return []
            
        filename = pdf_doc.get("filename", "").lower()
        title_words = set(re.findall(r"\w+", filename))
        
        # Split text by page delimiters
        pages = extracted_text.split("--- Page ")
        chunks = []
        
        current_chapter = "General Overview"
        outline = pdf_doc.get("outline", [])
        
        for part in pages:
            if not part.strip():
                continue
            # Parse page number
            lines = part.split("\n")
            header_line = lines[0].split(" ---")
            try:
                page_num = int(header_line[0])
            except ValueError:
                page_num = 1
                
            page_content = "\n".join(lines[1:])
            
            # Sub-chunk page content into smaller overlapping blocks (approx 500 chars)
            chunk_size = 600
            overlap = 100
            start = 0
            
            while start < len(page_content):
                end = start + chunk_size
                chunk_text = page_content[start:end]
                start += (chunk_size - overlap)
                
                if not chunk_text.strip():
                    continue
                    
                # Track current chapter mapping based on page outlines
                for item in outline:
                    if item.get("page", 1) <= page_num:
                        current_chapter = item.get("title", current_chapter)
                
                # Tokenize chunk
                chunk_words = set(re.findall(r"\w+", chunk_text.lower()))
                
                # Calculate scores
                overlap_score = len(query_words.intersection(chunk_words))
                
                # Boost if query terms appear in the active chapter title
                chapter_words = set(re.findall(r"\w+", current_chapter.lower()))
                chapter_boost = len(query_words.intersection(chapter_words)) * 1.5
                
                # Boost if query terms appear in the document title
                title_boost = len(query_words.intersection(title_words)) * 0.8
                
                total_score = overlap_score + chapter_boost + title_boost
                
                if total_score > 0:
                    chunks.append({
                        "text": chunk_text.strip(),
                        "page": page_num,
                        "chapter": current_chapter,
                        "score": total_score
                    })
                    
        # Sort chunks by weighted score descending
        chunks.sort(key=lambda x: x["score"], reverse=True)
        
        # Normalize score into a confidence percentage (max 100%)
        retrieved = []
        for c in chunks[:limit]:
            raw_score = c["score"]
            confidence = min(100, int((raw_score / (len(query_words) + 1)) * 100))
            retrieved.append({
                "text": c["text"],
                "page": c["page"],
                "chapter": c["chapter"],
                "confidence": confidence
            })
            
        return retrieved

# Factory config mapping
retriever_instance = WeightedKeywordRetriever()

def get_retriever():
    return retriever_instance
