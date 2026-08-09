import datetime
from flask import Blueprint, request, jsonify, g
from app.middleware.auth import token_required
from app.utils.db import get_db
from app.services.ai_service import get_ai

ai_bp = Blueprint("ai", __name__, url_prefix="/api/ai")

@ai_bp.route("/chats", methods=["GET"])
@token_required
def get_chats():
    db = get_db()
    chats_col = db.get_collection("chats")
    chats = chats_col.find({"user_id": g.user_id}, sort=[("is_pinned", -1), ("updated_at", -1)])
    return jsonify(chats), 200

@ai_bp.route("/chats", methods=["POST"])
@token_required
def create_chat():
    data = request.get_json() or {}
    title = data.get("title", "New Chat Session")
    mode = data.get("mode", "general")
    
    db = get_db()
    chats_col = db.get_collection("chats")
    
    chat_doc = {
        "user_id": g.user_id,
        "title": title,
        "mode": mode,
        "is_pinned": False,
        "is_favorite": False,
        "is_archived": False,
        "messages": [],
        "created_at": datetime.datetime.utcnow().isoformat(),
        "updated_at": datetime.datetime.utcnow().isoformat()
    }
    
    res = chats_col.insert_one(chat_doc)
    chat_doc["_id"] = str(res.inserted_id)
    
    return jsonify(chat_doc), 201

@ai_bp.route("/chats/<chat_id>", methods=["GET"])
@token_required
def get_chat(chat_id):
    db = get_db()
    chats_col = db.get_collection("chats")
    chat = chats_col.find_one({"_id": chat_id, "user_id": g.user_id})
    if not chat:
        return jsonify({"message": "Chat session not found."}), 404
    return jsonify(chat), 200

@ai_bp.route("/chats/<chat_id>", methods=["PUT"])
@token_required
def update_chat(chat_id):
    data = request.get_json() or {}
    db = get_db()
    chats_col = db.get_collection("chats")
    
    chat = chats_col.find_one({"_id": chat_id, "user_id": g.user_id})
    if not chat:
        return jsonify({"message": "Chat session not found."}), 404
        
    update_fields = {}
    if "title" in data:
        update_fields["title"] = data["title"]
    if "is_pinned" in data:
        update_fields["is_pinned"] = data["is_pinned"]
    if "is_favorite" in data:
        update_fields["is_favorite"] = data["is_favorite"]
    if "is_archived" in data:
        update_fields["is_archived"] = data["is_archived"]
    if "mode" in data:
        update_fields["mode"] = data["mode"]
        
    update_fields["updated_at"] = datetime.datetime.utcnow().isoformat()
    chats_col.update_one({"_id": chat_id}, {"$set": update_fields})
    
    return jsonify(chats_col.find_one({"_id": chat_id})), 200

@ai_bp.route("/chats/<chat_id>", methods=["DELETE"])
@token_required
def delete_chat(chat_id):
    db = get_db()
    chats_col = db.get_collection("chats")
    res = chats_col.delete_one({"_id": chat_id, "user_id": g.user_id})
    if not res:
        return jsonify({"message": "Chat session not found."}), 404
    return jsonify({"message": "Chat deleted successfully."}), 200

@ai_bp.route("/chats/<chat_id>/message", methods=["POST"])
@token_required
def send_message(chat_id):
    data = request.get_json() or {}
    message_content = data.get("message")
    
    if not message_content:
        return jsonify({"message": "Message content is required."}), 400
        
    db = get_db()
    chats_col = db.get_collection("chats")
    
    chat = chats_col.find_one({"_id": chat_id, "user_id": g.user_id})
    if not chat:
        return jsonify({"message": "Chat session not found."}), 404
        
    # Append User Message
    user_msg = {
        "role": "user",
        "content": message_content,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    
    chats_col.update_one(
        {"_id": chat_id},
        {"$push": {"messages": user_msg}}
    )
    
    # RAG Context Retrieval:
    # 1. User Profile Details
    users_col = db.get_collection("users")
    user_doc = users_col.find_one({"_id": g.user_id}) or {}
    
    # 2. Recent Notes Context
    notes_col = db.get_collection("notes")
    recent_notes = list(notes_col.find({"user_id": g.user_id}, sort=[("updated_at", -1)]))[:3]
    notes_context = "\n---\n".join([f"Note Title: {n.get('title')}\nContent: {n.get('content')}" for n in recent_notes])
    
    # 3. Recent Quiz Logs
    quizzes_col = db.get_collection("quizzes")
    recent_quizzes = list(quizzes_col.find({"user_id": g.user_id}, sort=[("created_at", -1)]))[:3]
    quiz_context = "\n---\n".join([f"Quiz Subject: {q.get('subject')}\nScore: {q.get('score')}/{q.get('total')}" for q in recent_quizzes])
    
    # Get active AI interface
    ai = get_ai()
    
    # Send updated messages stack with mode and rag context details
    current_messages = chat.get("messages", []) + [user_msg]
    mode = chat.get("mode", "general")
    
    ai_response_content = ai.chat_tutor(
        current_messages,
        mode=mode,
        user_profile=user_doc,
        notes_context=notes_context,
        quiz_context=quiz_context
    )
    
    # Append Assistant Message
    assistant_msg = {
        "role": "assistant",
        "content": ai_response_content,
        "timestamp": datetime.datetime.utcnow().isoformat()
    }
    
    # Auto name chat title if it's the first message
    updates = {
        "updated_at": datetime.datetime.utcnow().isoformat()
    }
    if len(current_messages) <= 2:
        # Title named from first 4 words of user query
        words = message_content.split(" ")
        title_name = " ".join(words[:4]) + ("..." if len(words) > 4 else "")
        updates["title"] = title_name
        
    chats_col.update_one(
        {"_id": chat_id},
        {
            "$push": {"messages": assistant_msg},
            "$set": updates
        }
    )
    
    # Log analytics AI token usages
    progress_col = db.get_collection("progress")
    today = datetime.datetime.utcnow().strftime("%Y-%m-%d")
    progress_col.update_one(
        {"user_id": g.user_id, "date": today},
        {"$inc": {"ai_tokens_used": 250}},
        upsert=True
    )
    
    return jsonify({
        "user_message": user_msg,
        "assistant_message": assistant_msg,
        "chat_title": updates.get("title", chat.get("title"))
    }), 200

@ai_bp.route("/action/save-note", methods=["POST"])
@token_required
def action_save_note():
    data = request.get_json() or {}
    content = data.get("content", "")
    title = data.get("title", "AI Study Lesson")
    
    if not content:
        return jsonify({"message": "Content is required."}), 400
        
    db = get_db()
    notes_col = db.get_collection("notes")
    
    note_doc = {
        "user_id": g.user_id,
        "title": title,
        "content": content,
        "category": "AI Tutor",
        "tags": ["AI-Generated"],
        "created_at": datetime.datetime.utcnow().isoformat(),
        "updated_at": datetime.datetime.utcnow().isoformat()
    }
    notes_col.insert_one(note_doc)
    return jsonify({"message": "Saved directly to notes workspace!"}), 200

@ai_bp.route("/action/generate-quiz", methods=["POST"])
@token_required
def action_generate_quiz():
    data = request.get_json() or {}
    subject = data.get("subject", "AI Review")
    
    db = get_db()
    quiz_col = db.get_collection("quizzes")
    
    ai = get_ai()
    try:
        quiz_data = ai.generate_quiz(subject, "Medium", count=3)
        questions = quiz_data.get("questions", [])
        
        # Map fields for database entry
        formatted_questions = []
        for q in questions:
            formatted_questions.append({
                "question": q.get("question", f"Question regarding {subject}?"),
                "options": q.get("options", ["Option 1", "Option 2", "Option 3", "Option 4"]),
                "answer": q.get("correct_answer") or q.get("answer") or "Option 1",
                "explanation": q.get("explanation", "")
            })
    except Exception as e:
        return jsonify({"message": f"Failed to generate quiz: {str(e)}"}), 500
        
    quiz_doc = {
        "user_id": g.user_id,
        "title": f"Quiz: {subject}",
        "subject": subject,
        "difficulty": "Medium",
        "questions": formatted_questions,
        "created_at": datetime.datetime.utcnow().isoformat()
    }
    quiz_col.insert_one(quiz_doc)
    return jsonify({"message": "Quiz generated successfully!"}), 200

@ai_bp.route("/action/generate-flashcards", methods=["POST"])
@token_required
def action_generate_flashcards():
    data = request.get_json() or {}
    subject = data.get("subject", "AI Vocabulary")
    
    db = get_db()
    fc_col = db.get_collection("flashcards")
    
    ai = get_ai()
    try:
        cards_data = ai.generate_flashcards(subject)
        cards = cards_data.get("cards", [])
        if cards:
            card = cards[0]
            front = card.get("front", f"Explain key details of {subject}")
            back = card.get("back", "Analyzed and generated through StudySphere AI learning memory.")
        else:
            front = f"Explain key details of {subject}"
            back = "Analyzed and generated through StudySphere AI learning memory."
    except Exception as e:
        return jsonify({"message": f"Failed to generate flashcard: {str(e)}"}), 500
        
    fc_doc = {
        "user_id": g.user_id,
        "subject": subject,
        "front": front,
        "back": back,
        "is_bookmarked": False,
        "created_at": datetime.datetime.utcnow().isoformat()
    }
    fc_col.insert_one(fc_doc)
    return jsonify({"message": "Flashcard deck generated!"}), 200
