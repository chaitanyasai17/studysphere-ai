import datetime
from flask import Blueprint, request, jsonify, g
from app.middleware.auth import token_required
from app.utils.db import get_db

analytics_bp = Blueprint("analytics", __name__, url_prefix="/api/analytics")

@analytics_bp.route("/summary", methods=["GET"])
@token_required
def get_analytics_summary():
    db = get_db()
    progress_col = db.get_collection("progress")
    quizzes_col = db.get_collection("quizzes")
    notes_col = db.get_collection("notes")
    planner_col = db.get_collection("planner")
    
    # Calculate total study hours
    all_progress = progress_col.find({"user_id": g.user_id})
    total_hours = sum(p.get("study_hours", 0.0) for p in all_progress)
    
    # Calculate streak (check consecutive days with progress entries)
    # Simple linear check for simplicity
    today_dt = datetime.datetime.utcnow()
    streak = 0
    checked_date = today_dt
    
    # Check up to past 30 days
    for _ in range(30):
        date_str = checked_date.strftime("%Y-%m-%d")
        prog_day = progress_col.find_one({"user_id": g.user_id, "date": date_str})
        
        # If they had any study hours, quizzes taken, or notes created, count as active day
        if prog_day and (prog_day.get("study_hours", 0) > 0 or 
                         prog_day.get("quizzes_taken", 0) > 0 or 
                         prog_day.get("notes_created", 0) > 0):
            streak += 1
            checked_date -= datetime.timedelta(days=1)
        else:
            # Check if they just haven't studied TODAY yet, keep checking yesterday
            if checked_date == today_dt:
                checked_date -= datetime.timedelta(days=1)
                continue
            break
            
    # Quiz stats
    completed_quizzes = quizzes_col.find({"user_id": g.user_id, "score": {"$ne": None}})
    total_quiz_count = len(completed_quizzes)
    
    avg_accuracy = 0.0
    if total_quiz_count > 0:
        total_acc = sum((q["score"] / q["total_questions"]) * 100 for q in completed_quizzes)
        avg_accuracy = total_acc / total_quiz_count
        
    # Productivity score calculation (0 - 100) based on tasks completed vs total planner items, and study hours
    total_tasks = planner_col.count_documents({"user_id": g.user_id})
    completed_tasks = planner_col.count_documents({"user_id": g.user_id, "is_completed": True})
    
    task_completion_rate = (completed_tasks / total_tasks * 100) if total_tasks > 0 else 50.0
    productivity_score = min(100, int((task_completion_rate * 0.4) + (total_hours * 5) + (streak * 5)))
    
    # Recommendations
    insights = [
        "Create an active recall session on your General Notes to improve recall by 40%.",
        "Your quiz accuracy is highest in MCQ quizzes. Practice coding quizzes to boost technical scores.",
        f"You have completed {completed_tasks} planner tasks. Clean up overdue tasks to clear your schedule."
    ]
    if streak > 3:
        insights.append(f"Awesome! You are on a {streak}-day learning streak. Keep it up!")
    else:
        insights.append("Study for 15 minutes today to start a new learning streak!")
        
    return jsonify({
        "total_study_hours": round(total_hours, 1),
        "current_streak": streak,
        "quiz_accuracy_pct": round(avg_accuracy, 1),
        "productivity_score": productivity_score,
        "total_notes": notes_col.count_documents({"user_id": g.user_id}),
        "completed_tasks": completed_tasks,
        "total_tasks": total_tasks,
        "insights": insights
    }), 200

@analytics_bp.route("/charts", methods=["GET"])
@token_required
def get_chart_data():
    db = get_db()
    progress_col = db.get_collection("progress")
    
    # Return last 7 days chart details
    chart_data = []
    today = datetime.datetime.utcnow()
    
    for i in range(6, -1, -1):
        day = today - datetime.timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        day_name = day.strftime("%a")
        
        prog = progress_col.find_one({"user_id": g.user_id, "date": day_str})
        
        chart_data.append({
            "date": day_str,
            "day": day_name,
            "hours": prog.get("study_hours", 0.0) if prog else 0.0,
            "quizzes": prog.get("quizzes_taken", 0) if prog else 0,
            "notes": prog.get("notes_created", 0) if prog else 0
        })
        
    return jsonify(chart_data), 200

@analytics_bp.route("/streak", methods=["GET"])
@token_required
def get_streak_heatmap():
    db = get_db()
    progress_col = db.get_collection("progress")
    
    # Return last 30 days of data for GitHub-style heatmap
    heatmap = []
    today = datetime.datetime.utcnow()
    
    for i in range(29, -1, -1):
        day = today - datetime.timedelta(days=i)
        day_str = day.strftime("%Y-%m-%d")
        
        prog = progress_col.find_one({"user_id": g.user_id, "date": day_str})
        
        # Calculate level of activity (0 to 4 scale)
        activity_count = 0
        if prog:
            hours = prog.get("study_hours", 0.0)
            quizzes = prog.get("quizzes_taken", 0)
            notes = prog.get("notes_created", 0)
            
            activity_count = int(hours * 2 + quizzes * 3 + notes)
            
        level = 0
        if activity_count > 0:
            if activity_count <= 2:
                level = 1
            elif activity_count <= 5:
                level = 2
            elif activity_count <= 8:
                level = 3
            else:
                level = 4
                
        heatmap.append({
            "date": day_str,
            "count": activity_count,
            "level": level
        })
        
    return jsonify(heatmap), 200

@analytics_bp.route("/study-time", methods=["POST"])
@token_required
def track_study_time():
    data = request.get_json() or {}
    minutes = float(data.get("minutes", 15.0))
    hours_to_add = minutes / 60.0
    
    db = get_db()
    progress_col = db.get_collection("progress")
    today = datetime.datetime.utcnow().strftime("%Y-%m-%d")
    
    progress_col.update_one(
        {"user_id": g.user_id, "date": today},
        {"$inc": {"study_hours": hours_to_add}},
        upsert=True
    )
    
    return jsonify({
        "message": f"Successfully logged {minutes} minutes of study time.",
        "today_hours_added": hours_to_add
    }), 200
