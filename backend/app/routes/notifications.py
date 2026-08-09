import datetime
from flask import Blueprint, request, jsonify, g
from app.middleware.auth import token_required
from app.utils.db import get_db

notifications_bp = Blueprint("notifications", __name__, url_prefix="/api/notifications")

@notifications_bp.route("", methods=["GET"])
@token_required
def get_notifications():
    db = get_db()
    notif_col = db.get_collection("notifications")
    
    # Optional category filter
    category = request.args.get("category")
    query = {"user_id": g.user_id}
    if category:
        query["category"] = category
        
    notifications = list(notif_col.find(query, sort=[("is_pinned", -1), ("created_at", -1)]))
    return jsonify(notifications), 200

@notifications_bp.route("/<notif_id>/read", methods=["PUT"])
@token_required
def mark_read(notif_id):
    db = get_db()
    notif_col = db.get_collection("notifications")
    
    notif = notif_col.find_one({"_id": notif_id, "user_id": g.user_id})
    if not notif:
        return jsonify({"message": "Notification not found."}), 404
        
    notif_col.update_one({"_id": notif_id}, {"$set": {"is_read": True}})
    return jsonify({"message": "Notification marked as read."}), 200

@notifications_bp.route("/read-all", methods=["PUT"])
@token_required
def mark_all_read():
    db = get_db()
    notif_col = db.get_collection("notifications")
    
    notif_col.update_many(
        {"user_id": g.user_id, "is_read": False},
        {"$set": {"is_read": True}}
    )
    return jsonify({"message": "All notifications marked as read."}), 200

@notifications_bp.route("/<notif_id>", methods=["DELETE"])
@token_required
def delete_notification(notif_id):
    db = get_db()
    notif_col = db.get_collection("notifications")
    
    res = notif_col.delete_one({"_id": notif_id, "user_id": g.user_id})
    if res.deleted_count == 0:
        return jsonify({"message": "Notification not found."}), 404
        
    return jsonify({"message": "Notification deleted successfully."}), 200

@notifications_bp.route("/<notif_id>/pin", methods=["PUT"])
@token_required
def toggle_pin_notification(notif_id):
    db = get_db()
    notif_col = db.get_collection("notifications")
    
    notif = notif_col.find_one({"_id": notif_id, "user_id": g.user_id})
    if not notif:
        return jsonify({"message": "Notification not found."}), 404
        
    new_pinned = not notif.get("is_pinned", False)
    notif_col.update_one({"_id": notif_id}, {"$set": {"is_pinned": new_pinned}})
    return jsonify({"message": "Pin status updated.", "is_pinned": new_pinned}), 200

@notifications_bp.route("/trigger", methods=["POST"])
@token_required
def trigger_activity_recommendations():
    db = get_db()
    notif_col = db.get_collection("notifications")
    quizzes_col = db.get_collection("quiz_results")
    reviews_col = db.get_collection("resume_reviews")
    
    # 1. Check Quiz weak performance
    quizzes = list(quizzes_col.find({"user_id": g.user_id}, sort=[("created_at", -1)]))
    latest_quiz = quizzes[0] if quizzes else None
    if latest_quiz and latest_quiz.get("score", 100) < 70:
        notif_col.update_one(
            {"user_id": g.user_id, "title": "Weak Quiz Performance Alert"},
            {"$set": {
                "message": f"You scored {latest_quiz.get('score')}% in Quiz '{latest_quiz.get('subject')}'. Revise study notes now.",
                "category": "Study",
                "type": "reminder",
                "is_read": False,
                "is_pinned": True,
                "created_at": datetime.datetime.utcnow().isoformat()
            }},
            upsert=True
        )

    # 2. Check Resume ATS score
    reviews = list(reviews_col.find({"user_id": g.user_id}, sort=[("created_at", -1)]))
    latest_review = reviews[0] if reviews else None
    if latest_review and latest_review.get("ats_score", 100) < 80:
        notif_col.update_one(
            {"user_id": g.user_id, "title": "ATS Compatibility Score Review"},
            {"$set": {
                "message": f"Your Resume ATS score is {latest_review.get('ats_score')}%. Audit and update target keywords.",
                "category": "Career",
                "type": "ai",
                "is_read": False,
                "is_pinned": False,
                "created_at": datetime.datetime.utcnow().isoformat()
            }},
            upsert=True
        )

    # 3. Daily Coding Challenge Recommendation
    notif_col.update_one(
        {"user_id": g.user_id, "title": "Daily Coding Challenge Ready"},
        {"$set": {
            "message": "Two Sum problem is available inside Coding Playground. Complete it to keep your streak active.",
            "category": "Coding",
            "type": "reminder",
            "is_read": False,
            "is_pinned": False,
            "created_at": datetime.datetime.utcnow().isoformat()
        }},
        upsert=True
    )
    
    return jsonify({"message": "Intelligent notifications triggered successfully."}), 200

@notifications_bp.route("/activity", methods=["POST"])
@token_required
def log_user_activity():
    data = request.get_json() or {}
    activity_type = data.get("type", "General")
    description = data.get("description", "")
    
    db = get_db()
    logs_col = db.get_collection("activity_logs")
    log_doc = {
        "user_id": g.user_id,
        "type": activity_type,
        "description": description,
        "created_at": datetime.datetime.utcnow().isoformat()
    }
    logs_col.insert_one(log_doc)
    return jsonify({"message": "Activity logged.", "activity": log_doc}), 201

@notifications_bp.route("/activity/timeline", methods=["GET"])
@token_required
def get_activity_timeline():
    db = get_db()
    logs_col = db.get_collection("activity_logs")
    logs = list(logs_col.find({"user_id": g.user_id}, sort=[("created_at", -1)]))
    return jsonify(logs[:20]), 200

@notifications_bp.route("/continue-learning", methods=["GET"])
@token_required
def get_continue_learning_widgets():
    db = get_db()
    
    # Find latest document references
    notes_list = list(db.get_collection("notes").find({"user_id": g.user_id}, sort=[("updated_at", -1)]))
    note = notes_list[0] if notes_list else None
    
    pdfs_list = list(db.get_collection("pdfs").find({"user_id": g.user_id}, sort=[("uploaded_at", -1)]))
    pdf = pdfs_list[0] if pdfs_list else None
    
    chats_list = list(db.get_collection("chats").find({"user_id": g.user_id}, sort=[("updated_at", -1)]))
    chat = chats_list[0] if chats_list else None
    
    challenges_list = list(db.get_collection("completed_challenges").find({"user_id": g.user_id}, sort=[("completed_at", -1)]))
    challenge = challenges_list[0] if challenges_list else None
    
    interviews_list = list(db.get_collection("interviews").find({"user_id": g.user_id}, sort=[("created_at", -1)]))
    interview = interviews_list[0] if interviews_list else None
    
    quizzes_list = list(db.get_collection("quiz_results").find({"user_id": g.user_id}, sort=[("created_at", -1)]))
    quiz = quizzes_list[0] if quizzes_list else None
    
    return jsonify({
        "note": {"id": str(note["_id"]), "title": note["title"]} if note else None,
        "pdf": {"id": str(pdf["_id"]), "title": pdf.get("title") or pdf.get("filename")} if pdf else None,
        "chat": {"id": str(chat["_id"]), "title": chat["title"]} if chat else None,
        "challenge": {"id": challenge.get("challenge_id"), "title": "Algorithmic Practice"} if challenge else None,
        "interview": {"id": str(interview["_id"]), "title": interview.get("role")} if interview else None,
        "quiz": {"id": str(quiz["_id"]), "title": quiz.get("subject")} if quiz else None
    }), 200
