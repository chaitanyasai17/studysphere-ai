import datetime
from flask import Blueprint, request, jsonify, g
from app.middleware.auth import token_required
from app.utils.db import get_db

search_bp = Blueprint("search", __name__, url_prefix="/api/search")

@search_bp.route("", methods=["GET"])
@token_required
def search_all():
    query = request.args.get("q", "").strip()
    db = get_db()
    
    # Save search query in history if query exists
    if query:
        search_history_col = db.get_collection("search_history")
        search_history_col.insert_one({
            "user_id": g.user_id,
            "query": query,
            "created_at": datetime.datetime.utcnow().isoformat()
        })
        
    if not query:
        # Return recent searches history when query is empty
        search_history_col = db.get_collection("search_history")
        recent_docs = list(search_history_col.find({"user_id": g.user_id}, sort=[("created_at", -1)]))
        recent_queries = list(set([doc["query"] for doc in recent_docs]))[:5]
        return jsonify({
            "notes": [], "pdfs": [], "chats": [], "tasks": [],
            "flashcards": [], "quizzes": [], "challenges": [],
            "roadmaps": [], "interviews": [], "recent_searches": recent_queries
        }), 200
        
    notes_col = db.get_collection("notes")
    pdfs_col = db.get_collection("pdfs")
    chats_col = db.get_collection("chats")
    planner_col = db.get_collection("planner")
    flashcards_col = db.get_collection("flashcards")
    quizzes_col = db.get_collection("quiz_results")
    completed_col = db.get_collection("completed_challenges")
    roadmaps_col = db.get_collection("roadmaps")
    interviews_col = db.get_collection("interviews")
    
    query_lower = query.lower()
    
    # 1. Search Notes (Title or Content)
    notes = notes_col.find({"user_id": g.user_id})
    matching_notes = []
    for n in notes:
        if query_lower in n.get("title", "").lower() or query_lower in n.get("content", "").lower():
            matching_notes.append({
                "id": str(n["_id"]),
                "title": n["title"],
                "category": n.get("category", "General"),
                "type": "note"
            })
            
    # 2. Search PDFs (Filename or outline)
    pdfs = pdfs_col.find({"user_id": g.user_id})
    matching_pdfs = []
    for p in pdfs:
        if query_lower in p.get("filename", "").lower() or query_lower in p.get("title", "").lower():
            matching_pdfs.append({
                "id": str(p["_id"]),
                "filename": p.get("title") or p.get("filename"),
                "type": "pdf"
            })
            
    # 3. Search Chat sessions (Title or contents)
    chats = chats_col.find({"user_id": g.user_id})
    matching_chats = []
    for c in chats:
        title_match = query_lower in c.get("title", "").lower()
        msg_match = False
        for msg in c.get("messages", []):
            if query_lower in msg.get("content", "").lower():
                msg_match = True
                break
        if title_match or msg_match:
            matching_chats.append({
                "id": str(c["_id"]),
                "title": c["title"],
                "type": "chat"
            })
            
    # 4. Search Planner Tasks (Title or description)
    tasks = planner_col.find({"user_id": g.user_id})
    matching_tasks = []
    for t in tasks:
        if query_lower in t.get("title", "").lower() or query_lower in t.get("description", "").lower():
            matching_tasks.append({
                "id": str(t["_id"]),
                "title": t["title"],
                "category": t.get("category", "study"),
                "is_completed": t.get("is_completed", False),
                "type": "task"
            })

    # 5. Search Flashcards (Subject)
    flashcards = flashcards_col.find({"user_id": g.user_id})
    matching_flashcards = []
    for f in flashcards:
        if query_lower in f.get("subject", "").lower():
            matching_flashcards.append({
                "id": str(f["_id"]),
                "title": f.get("subject"),
                "type": "flashcards"
            })

    # 6. Search Quizzes (Title or subject)
    quizzes = quizzes_col.find({"user_id": g.user_id})
    matching_quizzes = []
    for q in quizzes:
        if query_lower in q.get("subject", "").lower():
            matching_quizzes.append({
                "id": str(q["_id"]),
                "title": f"Quiz: {q.get('subject')}",
                "score": q.get("score"),
                "type": "quiz"
            })

    # 7. Search Coding challenges
    matching_challenges = []
    # Seed mock match checking
    mock_challenges = [
        {"id": "1", "title": "Two Sum Problem", "category": "Arrays", "type": "challenge"},
        {"id": "2", "title": "Linked List Cycle Detection", "category": "Linked Lists", "type": "challenge"},
        {"id": "3", "title": "Port Scanner Script", "category": "Cybersecurity Scripting", "type": "challenge"}
    ]
    for ch in mock_challenges:
        if query_lower in ch["title"].lower() or query_lower in ch["category"].lower():
            matching_challenges.append(ch)

    # 8. Search Career Roadmaps
    roadmaps = roadmaps_col.find({"user_id": g.user_id})
    matching_roadmaps = []
    for r in roadmaps:
        if query_lower in r.get("role", "").lower():
            matching_roadmaps.append({
                "id": str(r["_id"]),
                "title": f"Roadmap: {r.get('role')}",
                "type": "roadmap"
            })

    # 9. Search Interview Reports
    interviews = interviews_col.find({"user_id": g.user_id})
    matching_interviews = []
    for i in interviews:
        if query_lower in i.get("role", "").lower():
            matching_interviews.append({
                "id": str(i["_id"]),
                "title": f"Interview Report: {i.get('role')}",
                "type": "interview"
            })
            
    return jsonify({
        "notes": matching_notes[:5],
        "pdfs": matching_pdfs[:5],
        "chats": matching_chats[:5],
        "tasks": matching_tasks[:5],
        "flashcards": matching_flashcards[:5],
        "quizzes": matching_quizzes[:5],
        "challenges": matching_challenges[:5],
        "roadmaps": matching_roadmaps[:5],
        "interviews": matching_interviews[:5]
    }), 200
