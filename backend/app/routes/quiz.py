import datetime
from flask import Blueprint, request, jsonify, g
from app.middleware.auth import token_required
from app.utils.db import get_db
from app.services.ai_service import get_ai

quiz_bp = Blueprint("quiz", __name__, url_prefix="/api/quiz")

@quiz_bp.route("/generate", methods=["POST"])
@token_required
def generate_quiz_endpoint():
    data = request.get_json() or {}
    subject = data.get("subject", "General Knowledge")
    difficulty = data.get("difficulty", "medium")
    count = int(data.get("count", 5))
    quiz_type = data.get("type", "mcq")  # mcq, tf, blanks, coding
    
    ai = get_ai()
    try:
        quiz_data = ai.generate_quiz(subject, difficulty, count, quiz_type)
    except Exception as e:
        return jsonify({"message": f"Failed to generate quiz: {str(e)}"}), 500
        
    db = get_db()
    quizzes_col = db.get_collection("quizzes")
    
    quiz_doc = {
        "user_id": g.user_id,
        "subject": subject,
        "difficulty": difficulty,
        "type": quiz_type,
        "questions": quiz_data.get("questions", []),
        "score": None,
        "total_questions": len(quiz_data.get("questions", [])),
        "time_taken": None,
        "created_at": datetime.datetime.utcnow().isoformat()
    }
    
    res = quizzes_col.insert_one(quiz_doc)
    quiz_doc["_id"] = str(res.inserted_id)
    
    return jsonify(quiz_doc), 200

@quiz_bp.route("/submit/<quiz_id>", methods=["POST"])
@token_required
def submit_quiz(quiz_id):
    data = request.get_json() or {}
    score = int(data.get("score", 0))
    time_taken = int(data.get("time_taken", 0))  # in seconds
    
    db = get_db()
    quizzes_col = db.get_collection("quizzes")
    
    quiz = quizzes_col.find_one({"_id": quiz_id, "user_id": g.user_id})
    if not quiz:
        return jsonify({"message": "Quiz record not found."}), 404
        
    quizzes_col.update_one(
        {"_id": quiz_id},
        {"$set": {"score": score, "time_taken": time_taken}}
    )
    
    # Compute accuracy
    accuracy = (score / quiz.get("total_questions", 1)) * 100
    
    # Update user progress stats
    progress_col = db.get_collection("progress")
    today = datetime.datetime.utcnow().strftime("%Y-%m-%d")
    
    # Get existing progress for today
    prog = progress_col.find_one({"user_id": g.user_id, "date": today})
    if prog:
        prev_taken = prog.get("quizzes_taken", 0)
        prev_acc = prog.get("quiz_accuracy", 0.0)
        
        # Calculate new moving average accuracy
        new_acc = ((prev_acc * prev_taken) + accuracy) / (prev_taken + 1)
        
        progress_col.update_one(
            {"user_id": g.user_id, "date": today},
            {"$inc": {"quizzes_taken": 1}, "$set": {"quiz_accuracy": new_acc}}
        )
    else:
        progress_col.insert_one({
            "user_id": g.user_id,
            "date": today,
            "study_hours": 0.0,
            "quizzes_taken": 1,
            "quiz_accuracy": accuracy,
            "ai_tokens_used": 0,
            "notes_created": 0
        })
        
    return jsonify({
        "message": "Quiz answers submitted successfully.",
        "score": score,
        "total_questions": quiz.get("total_questions"),
        "accuracy": accuracy
    }), 200

@quiz_bp.route("/history", methods=["GET"])
@token_required
def get_quiz_history():
    db = get_db()
    quizzes_col = db.get_collection("quizzes")
    # Fetch only completed quizzes (where score is not null)
    quizzes = quizzes_col.find(
        {"user_id": g.user_id, "score": {"$ne": None}},
        sort=[("created_at", -1)]
    )
    return jsonify(quizzes), 200

@quiz_bp.route("/leaderboard", methods=["GET"])
@token_required
def get_leaderboard():
    db = get_db()
    quizzes_col = db.get_collection("quizzes")
    users_col = db.get_collection("users")
    
    # Aggregate highest accuracy for subjects, group by user
    pipeline = [
        {"$match": {"score": {"$ne": None}}},
        {"$group": {
            "_id": "$user_id",
            "total_score": {"$sum": "$score"},
            "quizzes_taken": {"$sum": 1}
        }},
        {"$sort": {"total_score": -1}},
        {"$limit": 10}
    ]
    
    # MongoDB Atlas aggregate fallback for local JSON Mock DB
    if db.is_mock:
        all_quizzes = quizzes_col.find({"score": {"$ne": None}})
        user_scores = {}
        for q in all_quizzes:
            uid = q["user_id"]
            user_scores.setdefault(uid, {"total_score": 0, "quizzes_taken": 0})
            user_scores[uid]["total_score"] += q["score"]
            user_scores[uid]["quizzes_taken"] += 1
            
        leaderboard = []
        for uid, stats in user_scores.items():
            user = users_col.find_one({"_id": uid})
            leaderboard.append({
                "user_id": uid,
                "name": user.get("name", "Student") if user else "Student",
                "total_score": stats["total_score"],
                "quizzes_taken": stats["quizzes_taken"]
            })
        leaderboard.sort(key=lambda x: x["total_score"], reverse=True)
        leaderboard = leaderboard[:10]
    else:
        results = quizzes_col.aggregate(pipeline)
        leaderboard = []
        for r in results:
            user = users_col.find_one({"_id": r["_id"]})
            leaderboard.append({
                "user_id": str(r["_id"]),
                "name": user.get("name", "Student") if user else "Student",
                "total_score": r["total_score"],
                "quizzes_taken": r["quizzes_taken"]
            })
            
    return jsonify(leaderboard), 200
