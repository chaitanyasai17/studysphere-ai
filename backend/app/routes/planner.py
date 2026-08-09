import datetime
from flask import Blueprint, request, jsonify, g
from app.middleware.auth import token_required
from app.utils.db import get_db

planner_bp = Blueprint("planner", __name__, url_prefix="/api/planner")

@planner_bp.route("/tasks", methods=["GET"])
@token_required
def get_tasks():
    db = get_db()
    planner_col = db.get_collection("planner")
    tasks = planner_col.find({"user_id": g.user_id}, sort=[("start_date", 1)])
    return jsonify(tasks), 200

@planner_bp.route("/tasks", methods=["POST"])
@token_required
def create_task():
    data = request.get_json() or {}
    title = data.get("title")
    description = data.get("description", "")
    start_date = data.get("start_date")
    end_date = data.get("end_date")
    priority = data.get("priority", "medium")  # low, medium, high
    category = data.get("category", "study")  # exam, assignment, study, other
    
    if not title or not start_date:
        return jsonify({"message": "Title and start date are required."}), 400
        
    db = get_db()
    planner_col = db.get_collection("planner")
    
    task_doc = {
        "user_id": g.user_id,
        "title": title,
        "description": description,
        "start_date": start_date,
        "end_date": end_date or start_date,
        "priority": priority,
        "category": category,
        "is_completed": False,
        "created_at": datetime.datetime.utcnow().isoformat()
    }
    
    res = planner_col.insert_one(task_doc)
    task_doc["_id"] = str(res.inserted_id)
    
    # Check if task is urgent, auto-add a notification reminder
    if priority == "high":
        notif_col = db.get_collection("notifications")
        notif_col.insert_one({
            "user_id": g.user_id,
            "title": f"High Priority Task Created",
            "message": f"Reminder: '{title}' is scheduled for {start_date}.",
            "type": "reminder",
            "is_read": False,
            "created_at": datetime.datetime.utcnow().isoformat()
        })
        
    return jsonify(task_doc), 201

@planner_bp.route("/tasks/<task_id>", methods=["PUT"])
@token_required
def update_task(task_id):
    data = request.get_json() or {}
    db = get_db()
    planner_col = db.get_collection("planner")
    
    task = planner_col.find_one({"_id": task_id, "user_id": g.user_id})
    if not task:
        return jsonify({"message": "Task not found."}), 404
        
    update_fields = {}
    for field in ["title", "description", "start_date", "end_date", "priority", "category", "is_completed"]:
        if field in data:
            update_fields[field] = data[field]
            
    planner_col.update_one({"_id": task_id}, {"$set": update_fields})
    updated_task = planner_col.find_one({"_id": task_id})
    
    # If completed, add notification check or progress increment
    if data.get("is_completed", False) and not task.get("is_completed", False):
        # Update user study progress
        progress_col = db.get_collection("progress")
        today = datetime.datetime.utcnow().strftime("%Y-%m-%d")
        # Log study hours increment for completing tasks (e.g. +0.5 hours)
        progress_col.update_one(
            {"user_id": g.user_id, "date": today},
            {"$inc": {"study_hours": 0.5}},
            upsert=True
        )
        
    return jsonify(updated_task), 200

@planner_bp.route("/tasks/<task_id>", methods=["DELETE"])
@token_required
def delete_task(task_id):
    db = get_db()
    planner_col = db.get_collection("planner")
    res = planner_col.delete_one({"_id": task_id, "user_id": g.user_id})
    if not res:
        return jsonify({"message": "Task not found."}), 404
    return jsonify({"message": "Task deleted successfully."}), 200
