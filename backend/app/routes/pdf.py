import os
import datetime
import re
import json
import threading
import logging
import copy
from flask import Blueprint, request, jsonify, g
from werkzeug.utils import secure_filename
from pypdf import PdfReader
from app.config import Config
from app.middleware.auth import token_required
from app.utils.db import get_db
from app.services.ai_service import get_ai
from app.services.retrieval_service import get_retriever
from app.utils.vector import cosine_similarity, get_vector_index

logger = logging.getLogger(__name__)
pdf_bp = Blueprint("pdf", __name__, url_prefix="/api/pdf")

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in Config.ALLOWED_EXTENSIONS

def extract_chapters_outline(reader):
    outline = []
    try:
        pdf_outline = reader.outline
        if pdf_outline:
            def parse_outline_tree(items):
                res = []
                for item in items:
                    if isinstance(item, list):
                        res.extend(parse_outline_tree(item))
                    else:
                        title = item.get("/Title", "Section")
                        page_num = reader.get_destination_page_number(item) + 1
                        res.append({
                            "title": title,
                            "page": page_num
                        })
                return res
            outline = parse_outline_tree(pdf_outline)
    except Exception:
        pass
        
    if not outline:
        patterns = [
            r'^(Chapter|Unit|Module|Lesson|Section|PART)\s+[A-Za-z0-9]+',
            r'^\d+(\.\d+)*\s+[A-Z][a-zA-Z\s]+'
        ]
        for page_idx in range(min(len(reader.pages), 25)):
            page_text = reader.pages[page_idx].extract_text() or ""
            for line in page_text.split("\n"):
                line = line.strip()
                if len(line) < 60:
                    for pat in patterns:
                        if re.match(pat, line):
                            if not any(item["title"] == line for item in outline):
                                outline.append({
                                    "title": line,
                                    "page": page_idx + 1
                                })
                            break
                            
    if not outline:
        outline = [
            {"title": "1. Overview & Setup", "page": 1},
            {"title": "2. Conceptual Architecture", "page": 5},
            {"title": "3. Implementation Models", "page": 10},
            {"title": "4. Testing & Validation", "page": 18}
        ]
    return outline

# Asynchronous PDF processing pipeline worker
def run_async_pdf_processing(pdf_id, file_path, filename, user_id):
    db = get_db()
    jobs_col = db.get_collection("pdf_jobs")
    pdfs_col = db.get_collection("pdfs")
    chunks_col = db.get_collection("pdf_chunks")
    
    import traceback
    from concurrent.futures import ThreadPoolExecutor
    
    try:
        # Step 1: Extract PDF metadata and outline early
        logger.info(f"Async PDF Pipeline: Start extracting PDF {pdf_id}")
        jobs_col.update_one(
            {"pdf_id": pdf_id},
            {"$set": {"status": "extracting", "progress_pct": 10, "updated_at": datetime.datetime.utcnow().isoformat()}}
        )
        
        reader = PdfReader(file_path)
        page_count = len(reader.pages)
        outline = extract_chapters_outline(reader)
        
        # Save page_count and outline immediately so the UI has them instantly
        pdfs_col.update_one(
            {"_id": pdf_id},
            {"$set": {
                "page_count": page_count,
                "outline": outline,
                "updated_at": datetime.datetime.utcnow().isoformat()
            }}
        )
        
        jobs_col.update_one(
            {"pdf_id": pdf_id},
            {"$set": {"status": "indexing", "progress_pct": 20, "updated_at": datetime.datetime.utcnow().isoformat()}}
        )
        
        # Step 2: Progressive text extraction & parallel embedding generation
        extracted_text = ""
        ai = get_ai()
        vector_index = get_vector_index()
        
        def embed_and_save_chunks(page_num, page_chunks):
            if not page_chunks:
                return
            try:
                texts = [c["text"][:1200] for c in page_chunks]
                embs = ai.generate_embeddings(texts)
                for idx, emb in enumerate(embs):
                    if idx < len(page_chunks):
                        page_chunks[idx]["embedding"] = emb
                
                # Insert chunks progressively to DB for incremental Q&A
                chunks_col.insert_many(page_chunks)
                
                # Add chunks to vector search index
                try:
                    vector_index.add_documents(pdf_id, page_chunks)
                except Exception as index_err:
                    logger.warning(f"Failed to add docs to pluggable index: {index_err}")
            except Exception as emb_err:
                logger.error(f"Failed to embed and index page {page_num}: {emb_err}")
                # Fallback to zero embedding chunks
                for chunk in page_chunks:
                    chunk["embedding"] = [0.0] * 768
                try:
                    chunks_col.insert_many(page_chunks)
                except Exception:
                    pass
        
        chunk_id_idx = 1
        chunk_window = 4000
        overlap = 800
        
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = []
            for page_idx in range(page_count):
                p_num = page_idx + 1
                p_text = reader.pages[page_idx].extract_text() or ""
                extracted_text += f"\n--- Page {p_num} ---\n{p_text}"
                
                # Progressive updates to DB (every 5 pages) to support incremental text search
                if p_num % 5 == 0 or p_num == page_count:
                    pdfs_col.update_one(
                        {"_id": pdf_id},
                        {"$set": {"extracted_text": extracted_text}}
                    )
                    pct = 20 + int((p_num / page_count) * 30)  # progress 20% to 50%
                    jobs_col.update_one(
                        {"pdf_id": pdf_id},
                        {"$set": {"status": "indexing", "progress_pct": pct, "updated_at": datetime.datetime.utcnow().isoformat()}}
                    )
                
                # Map outline to chapters
                current_chapter = "General Overview"
                for item in outline:
                    if item.get("page", 1) <= p_num:
                        current_chapter = item.get("title", current_chapter)
                
                # Split text into chunks
                page_chunks = []
                start = 0
                while start < max(1, len(p_text)):
                    end = start + chunk_window
                    chunk_content = p_text[start:end]
                    
                    chunk_doc = {
                        "pdf_id": pdf_id,
                        "user_id": user_id,
                        "chunk_id": f"chk_{pdf_id}_{chunk_id_idx}",
                        "page_number": p_num,
                        "chapter_title": current_chapter,
                        "section_heading": "General Section",
                        "text": chunk_content.strip()
                    }
                    page_chunks.append(chunk_doc)
                    chunk_id_idx += 1
                    start += (chunk_window - overlap)
                    if len(p_text) <= chunk_window:
                        break
                
                # Process embeddings for the page's chunks concurrently
                futures.append(executor.submit(embed_and_save_chunks, p_num, page_chunks))
            
            # Wait for all progressive embedding tasks to complete
            for future in futures:
                future.result()
        
        # Step 3: Progressive Summaries (parallelized section summaries)
        jobs_col.update_one(
            {"pdf_id": pdf_id},
            {"$set": {"status": "summarizing", "progress_pct": 55, "updated_at": datetime.datetime.utcnow().isoformat()}}
        )
        
        section_summaries = []
        pages_per_section = 10  # Broader section granularity for faster processing
        sections = []
        current_section_text = ""
        
        page_texts = [p.strip() for p in extracted_text.split("--- Page ")[1:] if p.strip()]
        for idx, p_text in enumerate(page_texts):
            p_num = idx + 1
            current_section_text += f"\n--- Page {p_num} ---\n{p_text}"
            if (idx + 1) % pages_per_section == 0 or (idx + 1) == len(page_texts):
                sections.append(current_section_text)
                current_section_text = ""
                
        def get_summary_task(s_idx, sec_text):
            try:
                return ai.summarize_section(sec_text[:12000], s_idx + 1)
            except Exception as sum_err:
                logger.error(f"Error summarizing section {s_idx+1}: {sum_err}")
                return {
                    "summary": f"Summary unavailable for section {s_idx+1}.",
                    "concepts": ["Review"],
                    "definitions": [],
                    "examples": [],
                    "formulae": [],
                    "difficulty": "Medium"
                }
        
        jobs_col.update_one(
            {"pdf_id": pdf_id},
            {"$set": {"status": "summarizing", "progress_pct": 70, "updated_at": datetime.datetime.utcnow().isoformat()}}
        )
        
        with ThreadPoolExecutor(max_workers=4) as executor:
            summary_futures = [executor.submit(get_summary_task, i, sec) for i, sec in enumerate(sections)]
            section_summaries = [f.result() for f in summary_futures]
            
        # Step 4: Map-Reduce Summary Reduction
        jobs_col.update_one(
            {"pdf_id": pdf_id},
            {"$set": {"status": "generating_study_tools", "progress_pct": 85, "updated_at": datetime.datetime.utcnow().isoformat()}}
        )
        
        title = filename.rsplit(".", 1)[0].replace("_", " ")
        try:
            ai_analysis = ai.reduce_summaries(section_summaries, title, page_count)
            summary = ai_analysis.get("executive_summary", "Summary not available.")
        except Exception as red_err:
            logger.error(f"Map-Reduce reduction failed: {red_err}")
            summary = "Summary compilation failed."
            ai_analysis = {
                "title": title,
                "executive_summary": "We encountered an issue compiling the executive summary, but outlines are available.",
                "learning_objectives": ["Review contents"],
                "key_concepts": [],
                "important_definitions": [],
                "important_points": [],
                "main_ideas": [],
                "key_takeaways": [],
                "faqs": [],
                "interview_questions": [],
                "chapters": [],
                "study_tools": {
                    "flashcards": [],
                    "quiz": [],
                    "mind_map": {"topic": title, "subtopics": []}
                }
            }
            
        # Step 5: Save compiled analysis to DB
        word_count = len(extracted_text.split())
        est_reading_time = max(1, word_count // 200)
        
        pdfs_col.update_one(
            {"_id": pdf_id},
            {"$set": {
                "summary": summary,
                "est_reading_time": est_reading_time,
                "ai_analysis": ai_analysis
            }}
        )
        
        # Step 6: Complete
        jobs_col.update_one(
            {"pdf_id": pdf_id},
            {"$set": {"status": "completed", "progress_pct": 100, "updated_at": datetime.datetime.utcnow().isoformat()}}
        )
        logger.info(f"Background PDF processing for document {pdf_id} completed successfully.")
        
    except Exception as e:
        logger.error(f"Async PDF processing exception for {pdf_id}: {e}")
        logger.error(traceback.format_exc())
        jobs_col.update_one(
            {"pdf_id": pdf_id},
            {"$set": {"status": "failed", "error": str(e), "updated_at": datetime.datetime.utcnow().isoformat()}}
        )
        
    except Exception as e:
        logger.error(f"Async PDF processing exception for {pdf_id}: {e}")
        logger.error(traceback.format_exc())
        jobs_col.update_one(
            {"pdf_id": pdf_id},
            {"$set": {"status": "failed", "error": str(e), "updated_at": datetime.datetime.utcnow().isoformat()}}
        )

@pdf_bp.route("/upload", methods=["POST"])
@token_required
def upload_pdf():
    if "file" not in request.files:
        return jsonify({"message": "No file part in request."}), 400
        
    file = request.files["file"]
    if file.filename == "":
        return jsonify({"message": "No file selected."}), 400
        
    # Cap size limit at 10MB
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)
    if file_size > 10 * 1024 * 1024:
        return jsonify({"message": "File size exceeds the 10MB limit."}), 400
        
    if file.content_type != "application/pdf":
        return jsonify({"message": "Only PDF documents are allowed."}), 400
        
    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        db = get_db()
        pdfs_col = db.get_collection("pdfs")
        jobs_col = db.get_collection("pdf_jobs")
        
        duplicate = pdfs_col.find_one({"user_id": g.user_id, "filename": filename, "file_size": file_size})
        if duplicate:
            return jsonify({"message": "Duplicate file detected. This document is already uploaded."}), 409
            
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        file_path = os.path.join(Config.UPLOAD_FOLDER, f"{g.user_id}_{int(datetime.datetime.utcnow().timestamp())}_{filename}")
        file.save(file_path)
        
        # Extract page count instantly
        try:
            reader = PdfReader(file_path)
            page_count = len(reader.pages)
        except Exception:
            page_count = 1
            
        # Insert initial PDF metadata
        pdf_doc = {
            "user_id": g.user_id,
            "filename": filename,
            "title": filename.rsplit(".", 1)[0].replace("_", " "),
            "file_path": file_path,
            "file_size": file_size,
            "page_count": page_count,
            "bookmarks": [],
            "last_opened": datetime.datetime.utcnow().isoformat(),
            "reading_progress": {
                "last_page": 1,
                "pages_read": [1],
                "completion_pct": 0,
                "time_spent": 0
            },
            "created_at": datetime.datetime.utcnow().isoformat(),
            "ai_analysis": None
        }
        
        res = pdfs_col.insert_one(pdf_doc)
        pdf_id = str(res.inserted_id)
        pdf_doc["_id"] = pdf_id
        
        # Create background progress status
        jobs_col.insert_one({
            "pdf_id": pdf_id,
            "status": "extracting",
            "progress_pct": 10,
            "error": None,
            "updated_at": datetime.datetime.utcnow().isoformat()
        })
        
        # Spawn asynchronous thread pipeline
        thread = threading.Thread(target=run_async_pdf_processing, args=(pdf_id, file_path, filename, g.user_id))
        thread.start()
        
        return jsonify({
            "_id": pdf_id,
            "filename": filename,
            "title": pdf_doc["title"],
            "status": "processing",
            "file_path": file_path
        }), 202
        
    return jsonify({"message": "Only PDF uploads are supported."}), 400

@pdf_bp.route("/jobs/<pdf_id>", methods=["GET"])
@token_required
def get_job_status(pdf_id):
    db = get_db()
    jobs_col = db.get_collection("pdf_jobs")
    job = jobs_col.find_one({"pdf_id": pdf_id})
    if not job:
        return jsonify({"status": "not_found"}), 404
    return jsonify(job), 200

@pdf_bp.route("", methods=["GET"])
@token_required
def get_pdfs():
    db = get_db()
    pdfs_col = db.get_collection("pdfs")
    
    pdfs = list(pdfs_col.find({"user_id": g.user_id}, sort=[("created_at", -1)]))
    for pdf in pdfs:
        if "extracted_text" in pdf:
            pdf.pop("extracted_text")
            
    return jsonify(pdfs), 200

@pdf_bp.route("/<pdf_id>", methods=["GET"])
@token_required
def get_pdf(pdf_id):
    db = get_db()
    pdfs_col = db.get_collection("pdfs")
    pdf = pdfs_col.find_one({"_id": pdf_id, "user_id": g.user_id})
    if not pdf:
        return jsonify({"message": "PDF not found."}), 404
        
    # Spawn async thread if analysis metadata is missing and no active job is running
    if "ai_analysis" not in pdf or not pdf["ai_analysis"]:
        jobs_col = db.get_collection("pdf_jobs")
        job = jobs_col.find_one({"pdf_id": pdf_id})
        if not job or job.get("status") in ["failed", "not_found"]:
            file_path = pdf.get("file_path")
            filename = pdf.get("filename")
            if file_path and os.path.exists(file_path):
                # Update status job to start extraction
                jobs_col.update_one(
                    {"pdf_id": pdf_id},
                    {"$set": {
                        "status": "extracting",
                        "progress_pct": 10,
                        "error": None,
                        "updated_at": datetime.datetime.utcnow().isoformat()
                    }},
                    upsert=True
                )
                thread = threading.Thread(target=run_async_pdf_processing, args=(pdf_id, file_path, filename, g.user_id))
                thread.start()
        
    pdfs_col.update_one({"_id": pdf_id}, {"$set": {"last_opened": datetime.datetime.utcnow().isoformat()}})
    return jsonify(pdf), 200

@pdf_bp.route("/<pdf_id>", methods=["DELETE"])
@token_required
def delete_pdf(pdf_id):
    db = get_db()
    pdfs_col = db.get_collection("pdfs")
    
    pdf = pdfs_col.find_one({"_id": pdf_id, "user_id": g.user_id})
    if not pdf:
        return jsonify({"message": "PDF not found."}), 404
        
    file_path = pdf.get("file_path")
    if file_path and os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception:
            pass
            
    pdfs_col.delete_one({"_id": pdf_id})
    
    # Clean database chunks
    chunks_col = db.get_collection("pdf_chunks")
    chunks_col.delete_many({"pdf_id": pdf_id})
    
    # Clean jobs
    jobs_col = db.get_collection("pdf_jobs")
    jobs_col.delete_many({"pdf_id": pdf_id})
    
    return jsonify({"message": "PDF removed successfully."}), 200

@pdf_bp.route("/<pdf_id>/ask", methods=["POST"])
@token_required
def ask_pdf_question(pdf_id):
    data = request.get_json() or {}
    question = data.get("question")
    # Accept multiple PDFs selection for multi-document Q&A RAG queries
    pdf_ids = data.get("pdf_ids", [pdf_id])
    
    if not question:
        return jsonify({"message": "Question is required."}), 400
        
    db = get_db()
    pdfs_col = db.get_collection("pdfs")
    
    # Verify access to all requested documents
    pdfs = list(pdfs_col.find({"_id": {"$in": pdf_ids}, "user_id": g.user_id}))
    if not pdfs:
        return jsonify({"message": "No accessible PDF documents found."}), 404
        
    ai = get_ai()
    
    # Generate embedding for query
    query_emb = ai.generate_embeddings(question)
    
    # Search cross-document vector index
    vector_index = get_vector_index()
    retrieved_chunks = vector_index.query_similarity(pdf_ids, query_emb, limit=4)
    
    # If ChromaDB/pluggable returned nothing, search database in-memory collection
    if not retrieved_chunks:
        chunks_col = db.get_collection("pdf_chunks")
        chunks = list(chunks_col.find({"pdf_id": {"$in": pdf_ids}}))
        for c in chunks:
            emb = c.get("embedding")
            if emb:
                score = cosine_similarity(query_emb, emb)
                confidence = int(score * 100)
                retrieved_chunks.append({
                    "text": c["text"],
                    "page": c.get("page_number", c.get("page", 1)),
                    "chapter": c.get("chapter_title", c.get("chapter", "General Overview")),
                    "section": c.get("section_heading", "General"),
                    "pdf_id": c["pdf_id"],
                    "confidence": confidence,
                    "score": score
                })
        retrieved_chunks.sort(key=lambda x: x["score"], reverse=True)
        retrieved_chunks = retrieved_chunks[:4]
        
    # Map pdf_ids to their titles so that ai_service knows document sources
    pdf_titles = {str(p["_id"]): p.get("title", p.get("filename", "Document")) for p in pdfs}
    for chunk in retrieved_chunks:
        chunk["document_title"] = pdf_titles.get(str(chunk["pdf_id"]), "Reference Textbook")
        
    # Ask Gemini RAG Tutor
    answer_json_str = ai.ask_pdf(question, retrieved_chunks)
    
    try:
        answer_data = json.loads(answer_json_str)
    except Exception:
        answer_data = {
            "answer": answer_json_str,
            "page_number": None,
            "chapter_name": None,
            "source_citation": None,
            "highlighted_paragraph": None,
            "not_found": False
        }
        
    # Calculate top match confidence score
    confidence_score = retrieved_chunks[0]["confidence"] if retrieved_chunks else 0
    
    progress_col = db.get_collection("progress")
    today = datetime.datetime.utcnow().strftime("%Y-%m-%d")
    progress_col.update_one(
        {"user_id": g.user_id, "date": today},
        {"$inc": {"ai_tokens_used": 250}},
        upsert=True
    )
    
    # Return detailed structured response with confidence score
    return jsonify({
        "answer": answer_data.get("answer"),
        "confidence_score": confidence_score,
        "page_number": answer_data.get("page_number"),
        "chapter_name": answer_data.get("chapter_name"),
        "source_citation": answer_data.get("source_citation"),
        "highlighted_paragraph": answer_data.get("highlighted_paragraph"),
        "not_found": answer_data.get("not_found", False),
        "retrieved_chunks": retrieved_chunks
    }), 200

@pdf_bp.route("/<pdf_id>/progress", methods=["PUT"])
@token_required
def update_progress(pdf_id):
    data = request.get_json() or {}
    page = data.get("page", 1)
    time_spent = data.get("time_spent", 0)
    
    db = get_db()
    pdfs_col = db.get_collection("pdfs")
    pdf = pdfs_col.find_one({"_id": pdf_id, "user_id": g.user_id})
    if not pdf:
        return jsonify({"message": "PDF not found."}), 404
        
    progress = pdf.get("reading_progress", {
        "last_page": 1,
        "pages_read": [1],
        "completion_pct": 0,
        "time_spent": 0
    })
    
    progress["last_page"] = page
    if "pages_read" not in progress:
        progress["pages_read"] = [1]
        
    if page not in progress["pages_read"]:
        progress["pages_read"].append(page)
        
    page_count = pdf.get("page_count", 25)
    if page_count <= 0:
        page_count = 1
    progress["completion_pct"] = min(100, int((len(progress["pages_read"]) / page_count) * 100))
    progress["time_spent"] = progress.get("time_spent", 0) + time_spent
    
    pdfs_col.update_one(
        {"_id": pdf_id},
        {"$set": {"reading_progress": progress, "last_opened": datetime.datetime.utcnow().isoformat()}}
    )
    return jsonify(progress), 200

@pdf_bp.route("/<pdf_id>/search", methods=["GET"])
@token_required
def search_pdf(pdf_id):
    query = request.args.get("q", "").strip().lower()
    if not query:
        return jsonify([]), 200
        
    db = get_db()
    pdfs_col = db.get_collection("pdfs")
    pdf = pdfs_col.find_one({"_id": pdf_id, "user_id": g.user_id})
    if not pdf:
        return jsonify({"message": "PDF not found."}), 404
        
    extracted_text = pdf.get("extracted_text", "")
    pages = extracted_text.split("--- Page ")
    results = []
    
    for part in pages:
        if not part.strip():
            continue
        lines = part.split("\n")
        header = lines[0].split(" ---")
        try:
            page_num = int(header[0])
        except ValueError:
            page_num = 1
            
        page_content = "\n".join(lines[1:])
        if query in page_content.lower():
            sentences = re.split(r'[.!?]\s+', page_content)
            snippets = []
            for sent in sentences:
                if query in sent.lower() and len(snippets) < 2:
                    snippets.append(sent.strip())
            results.append({
                "page": page_num,
                "snippet": "... ".join(snippets)
            })
            
    return jsonify(results), 200

@pdf_bp.route("/<pdf_id>/bookmark", methods=["POST"])
@token_required
def toggle_bookmark(pdf_id):
    data = request.get_json() or {}
    page = data.get("page")
    
    if page is None:
        return jsonify({"message": "Page number is required."}), 400
        
    db = get_db()
    pdfs_col = db.get_collection("pdfs")
    pdf = pdfs_col.find_one({"_id": pdf_id, "user_id": g.user_id})
    if not pdf:
        return jsonify({"message": "PDF not found."}), 404
        
    bookmarks = pdf.get("bookmarks", [])
    if page in bookmarks:
        bookmarks.remove(page)
    else:
        bookmarks.append(page)
        bookmarks.sort()
        
    pdfs_col.update_one({"_id": pdf_id}, {"$set": {"bookmarks": bookmarks}})
    return jsonify({"bookmarks": bookmarks}), 200

@pdf_bp.route("/<pdf_id>", methods=["PUT"])
@token_required
def update_pdf_metadata(pdf_id):
    data = request.get_json() or {}
    db = get_db()
    pdfs_col = db.get_collection("pdfs")
    
    pdf = pdfs_col.find_one({"_id": pdf_id, "user_id": g.user_id})
    if not pdf:
        return jsonify({"message": "PDF not found."}), 404
        
    updatable = ["title", "is_favorite", "annotations", "highlights", "bookmarks"]
    update_fields = {}
    for field in updatable:
        if field in data:
            update_fields[field] = data[field]
            
    if update_fields:
        pdfs_col.update_one({"_id": pdf_id}, {"$set": update_fields})
        
    updated = pdfs_col.find_one({"_id": pdf_id})
    if "extracted_text" in updated:
        updated.pop("extracted_text")
    return jsonify(updated), 200

@pdf_bp.route("/<pdf_id>/duplicate", methods=["POST"])
@token_required
def duplicate_pdf(pdf_id):
    db = get_db()
    pdfs_col = db.get_collection("pdfs")
    
    pdf = pdfs_col.find_one({"_id": pdf_id, "user_id": g.user_id})
    if not pdf:
        return jsonify({"message": "PDF not found."}), 404
        
    new_pdf = copy.deepcopy(pdf)
    new_pdf.pop("_id", None)
    new_pdf["title"] = f"Copy of {pdf.get('title', 'Document')}"
    new_pdf["filename"] = f"copy_{pdf.get('filename', 'file.pdf')}"
    new_pdf["created_at"] = datetime.datetime.utcnow().isoformat()
    
    res = pdfs_col.insert_one(new_pdf)
    new_pdf["_id"] = str(res.inserted_id)
    
    chunks_col = db.get_collection("pdf_chunks")
    chunks = list(chunks_col.find({"pdf_id": pdf_id}))
    if chunks:
        for chunk in chunks:
            chunk.pop("_id", None)
            chunk["pdf_id"] = str(res.inserted_id)
            chunk["chunk_id"] = f"chk_{res.inserted_id}_{chunk['chunk_id'].split('_')[-1]}"
        chunks_col.insert_many(chunks)
        
    return jsonify(new_pdf), 201

@pdf_bp.route("/<pdf_id>/outline/ai", methods=["POST"])
@token_required
def generate_ai_outline(pdf_id):
    db = get_db()
    pdfs_col = db.get_collection("pdfs")
    
    pdf = pdfs_col.find_one({"_id": pdf_id, "user_id": g.user_id})
    if not pdf:
        return jsonify({"message": "PDF not found."}), 404
        
    extracted_text = pdf.get("extracted_text", "")
    if not extracted_text:
        return jsonify({"message": "Document text is not extracted yet."}), 400
        
    sample_text = extracted_text[:15000]
    
    ai = get_ai()
    system_prompt = "You are an AI textbook outline generator. You must return ONLY a JSON array of objects, each containing 'title' and 'page' keys. Example: [{\"title\": \"Chapter 1: Intro\", \"page\": 1}]. No markdown code fences, strictly valid JSON format only."
    user_prompt = f"Extracted textbook sample:\n{sample_text}\n\nOutline JSON:"
    
    try:
        res = ai._call_gemini(system_prompt, user_prompt, response_mime_type="application/json")
        outline = json.loads(res)
    except Exception as e:
        logger.error(f"Failed to generate AI outline: {e}")
        outline = [
            {"title": "1. Overview & Setup", "page": 1},
            {"title": "2. Main Concepts", "page": 5},
            {"title": "3. Testing & Implementation", "page": 10}
        ]
        
    pdfs_col.update_one({"_id": pdf_id}, {"$set": {"outline": outline}})
    return jsonify(outline), 200
