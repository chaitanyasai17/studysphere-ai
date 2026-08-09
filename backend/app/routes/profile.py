import os
import datetime
from flask import Blueprint, request, jsonify, g
from werkzeug.utils import secure_filename
from app.config import Config
from app.middleware.auth import token_required
from app.utils.db import get_db

profile_bp = Blueprint("profile", __name__, url_prefix="/api/profile")

def get_claim_metrics(user, timezone_offset=0):
    last_claim_str = user.get("last_claim_date")
    streak_count = user.get("streak_count", 0)
    
    if not last_claim_str:
        return {
            "lastClaimDate": None,
            "claimStatus": "eligible",
            "nextEligibleClaimTime": None,
            "streakCount": streak_count
        }
        
    try:
        last_claim = datetime.datetime.fromisoformat(last_claim_str)
        now = datetime.datetime.utcnow()
        
        client_now = now - datetime.timedelta(minutes=timezone_offset)
        client_last_claim = last_claim - datetime.timedelta(minutes=timezone_offset)
        
        if client_now.date() == client_last_claim.date():
            status = "claimed"
            client_tomorrow = datetime.datetime.combine(client_now.date() + datetime.timedelta(days=1), datetime.time.min)
            utc_tomorrow = client_tomorrow + datetime.timedelta(minutes=timezone_offset)
            next_time = utc_tomorrow.isoformat()
        else:
            status = "eligible"
            next_time = None
    except Exception:
        status = "eligible"
        next_time = None
        
    return {
        "lastClaimDate": last_claim_str,
        "claimStatus": status,
        "nextEligibleClaimTime": next_time,
        "streakCount": streak_count
    }

@profile_bp.route("", methods=["GET"])
@token_required
def get_profile():
    db = get_db()
    users_col = db.get_collection("users")
    user = users_col.find_one({"_id": g.user_id})
    if not user:
        return jsonify({"message": "User not found."}), 404
        
    try:
        timezone_offset = int(request.args.get("timezone_offset", 0))
    except ValueError:
        timezone_offset = 0
        
    metrics = get_claim_metrics(user, timezone_offset)
    
    # Populate all profile SaaS defaults
    profile = {
        "id": str(user["_id"]),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "role": user.get("role", "student"),
        "is_verified": user.get("is_verified", False),
        "created_at": user.get("created_at", ""),
        
        # User details
        "bio": user.get("bio", ""),
        "college": user.get("college", ""),
        "semester": user.get("semester", ""),
        "department": user.get("department", ""),
        "skills": user.get("skills", []),
        "goals": user.get("goals", ""),
        "avatar": user.get("avatar", ""),
        
        # Socials
        "github_url": user.get("github_url", ""),
        "linkedin_url": user.get("linkedin_url", ""),
        "portfolio_url": user.get("portfolio_url", ""),
        
        # Preferences & Learning Style
        "study_interests": user.get("study_interests", []),
        "learning_style": user.get("learning_style", ""),
        "target_company": user.get("target_company", ""),
        "target_role": user.get("target_role", ""),
        "ai_model": user.get("ai_model", "gpt-4o-mini"),
        "theme_pref": user.get("theme_pref", "light"),
        
        # Gamification metrics
        "xp_points": user.get("xp_points", 0),
        "coins": user.get("coins", 0),
        "level": user.get("level", 1),
        "badges": user.get("badges", []),
        
        # Challenge indicators
        "daily_challenge_completed": metrics["claimStatus"] == "claimed",
        "weekly_challenge_completed": user.get("weekly_challenge_completed", False),
        "monthly_challenge_completed": user.get("monthly_challenge_completed", False),
        
        # Claim rewards fields
        "lastClaimDate": metrics["lastClaimDate"],
        "claimStatus": metrics["claimStatus"],
        "nextEligibleClaimTime": metrics["nextEligibleClaimTime"],
        "streakCount": metrics["streakCount"],
        "rewardHistory": user.get("reward_history", [])
    }
    return jsonify(profile), 200

@profile_bp.route("", methods=["PUT"])
@token_required
def update_profile():
    db = get_db()
    users_col = db.get_collection("users")
    
    data = request.json or {}
    
    # Allow updating standard metadata fields
    updatable = [
        "bio", "college", "semester", "department", "skills", "goals",
        "avatar", "github_url", "linkedin_url", "portfolio_url",
        "study_interests", "learning_style", "target_company", "target_role",
        "ai_model", "theme_pref"
    ]
    
    update_data = {}
    for f in updatable:
        if f in data:
            update_data[f] = data[f]
            
    if update_data:
        users_col.update_one({"_id": g.user_id}, {"$set": update_data})
        
    return jsonify({"message": "Profile updated successfully."}), 200

@profile_bp.route("/upload-avatar", methods=["POST"])
@token_required
def upload_avatar():
    if "avatar" not in request.files:
        return jsonify({"message": "No avatar file parts found."}), 400
        
    file = request.files["avatar"]
    if file.filename == "":
        return jsonify({"message": "No file chosen."}), 400
        
    # Check file size (limit to 2MB)
    file.seek(0, os.SEEK_END)
    size = file.tell()
    file.seek(0)
    if size > 2 * 1024 * 1024:
        return jsonify({"message": "File size exceeds the 2MB limit."}), 400
        
    allowed_exts = {"png", "jpg", "jpeg", "gif", "webp"}
    def check_ext(fname):
        return "." in fname and fname.rsplit(".", 1)[1].lower() in allowed_exts
        
    if file.content_type not in ["image/png", "image/jpeg", "image/gif", "image/webp"]:
        return jsonify({"message": "Invalid file content type. Only PNG, JPG, JPEG, GIF, and WEBP images are allowed."}), 400
        
    if file and check_ext(file.filename):
        filename = secure_filename(file.filename)
        avatar_dir = os.path.join(Config.UPLOAD_FOLDER, "avatars")
        os.makedirs(avatar_dir, exist_ok=True)
        
        ext = filename.rsplit(".", 1)[1].lower()
        unique_name = f"avatar_{g.user_id}_{int(datetime.datetime.utcnow().timestamp())}.{ext}"
        save_path = os.path.join(avatar_dir, unique_name)
        file.save(save_path)
        
        avatar_url = f"/uploads/avatars/{unique_name}"
        
        # Save to database profile details
        db = get_db()
        users_col = db.get_collection("users")
        users_col.update_one({"_id": g.user_id}, {"$set": {"avatar": avatar_url}})
        
        return jsonify({
            "message": "Avatar image uploaded successfully.",
            "avatar_url": avatar_url
        }), 200
        
    return jsonify({"message": "Unsupported file format."}), 400

@profile_bp.route("/add-xp", methods=["POST"])
@token_required
def add_xp():
    db = get_db()
    users_col = db.get_collection("users")
    
    data = request.json or {}
    action = data.get("action", "study")
    try:
        timezone_offset = int(data.get("timezone_offset", 0))
    except ValueError:
        timezone_offset = 0
    
    xp_chart = {
        "quiz": 30,
        "note_create": 15,
        "note_edit": 5,
        "pdf_upload": 25,
        "chat_message": 10,
        "challenge": 50,
        "study": 10
    }
    
    xp_to_add = xp_chart.get(action, 10)
    coins_to_add = xp_to_add // 5
    
    user = users_col.find_one({"_id": g.user_id})
    if not user:
        return jsonify({"message": "User profile not found."}), 404
        
    now = datetime.datetime.utcnow()
    streak = user.get("streak_count", 0)
    reward_history = user.get("reward_history", [])
    last_claim_str = user.get("last_claim_date")
    new_streak = streak
    
    if action == "challenge":
        if last_claim_str:
            try:
                last_claim = datetime.datetime.fromisoformat(last_claim_str)
                client_now = now - datetime.timedelta(minutes=timezone_offset)
                client_last_claim = last_claim - datetime.timedelta(minutes=timezone_offset)
                
                if client_now.date() == client_last_claim.date():
                    return jsonify({
                        "success": False,
                        "message": "Daily reward already claimed today."
                    }), 400
                    
                yesterday = client_now.date() - datetime.timedelta(days=1)
                if client_last_claim.date() == yesterday:
                    new_streak = streak + 1
                else:
                    new_streak = 1
            except Exception:
                new_streak = 1
        else:
            new_streak = 1
            
        reward_history.append({
            "claimed_at": now.isoformat(),
            "xp_awarded": xp_to_add,
            "coins_awarded": coins_to_add
        })
        
    current_xp = user.get("xp_points", 0) + xp_to_add
    current_coins = user.get("coins", 0) + coins_to_add
    
    # Calculate levels: Level = (XP // 200) + 1
    new_lvl = (current_xp // 200) + 1
    old_lvl = user.get("level", 1)
    is_levelup = new_lvl > old_lvl
    
    # Check badge achievements
    badges = user.get("badges", [])
    unlocked = []
    
    def award(badge):
        if badge not in badges:
            badges.append(badge)
            unlocked.append(badge)
            
    if current_xp >= 100:
        award("Bronze Scholar")
    if current_xp >= 500:
        award("Silver Scholar")
    if current_xp >= 1500:
        award("Gold Scholar")
    if new_lvl >= 5:
        award("Level 5 Veteran")
    if new_lvl >= 10:
        award("Intellect Sovereign")
        
    # Build database update fields
    set_fields = {
        "xp_points": current_xp,
        "coins": current_coins,
        "level": new_lvl,
        "badges": badges
    }
    if action == "challenge":
        set_fields["last_claim_date"] = now.isoformat()
        set_fields["streak_count"] = new_streak
        set_fields["reward_history"] = reward_history
        set_fields["daily_challenge_completed"] = True
        
    users_col.update_one({"_id": g.user_id}, {"$set": set_fields})
    
    # Create notification alert for challenge completion, level ups and badges
    notifications_col = db.get_collection("notifications")
    if action == "challenge":
        notifications_col.insert_one({
            "user_id": g.user_id,
            "title": "🎉 Daily Challenge Completed",
            "message": f"You earned +{xp_to_add} XP and +{coins_to_add} Coins!",
            "category": "Achievements",
            "type": "system",
            "is_read": False,
            "created_at": datetime.datetime.utcnow().isoformat()
        })
    if is_levelup:
        notifications_col.insert_one({
            "user_id": g.user_id,
            "title": "🎉 Level Up!",
            "message": f"Congratulations! You reached Level {new_lvl}!",
            "is_read": False,
            "created_at": datetime.datetime.utcnow().isoformat()
        })
    for b in unlocked:
        notifications_col.insert_one({
            "user_id": g.user_id,
            "title": "🏆 Badge Earned!",
            "message": f"You unlocked the '{b}' badge!",
            "is_read": False,
            "created_at": datetime.datetime.utcnow().isoformat()
        })
        
    return jsonify({
        "xp_added": xp_to_add,
        "coins_added": coins_to_add,
        "total_xp": current_xp,
        "total_coins": current_coins,
        "level": new_lvl,
        "level_up": is_levelup,
        "new_badges": unlocked,
        "lastClaimDate": now.isoformat() if action == "challenge" else last_claim_str,
        "claimStatus": "claimed" if action == "challenge" else get_claim_metrics({"last_claim_date": last_claim_str}, timezone_offset)["claimStatus"],
        "nextEligibleClaimTime": (datetime.datetime.combine((now - datetime.timedelta(minutes=timezone_offset)).date() + datetime.timedelta(days=1), datetime.time.min) + datetime.timedelta(minutes=timezone_offset)).isoformat() if action == "challenge" else get_claim_metrics({"last_claim_date": last_claim_str}, timezone_offset)["nextEligibleClaimTime"],
        "streakCount": new_streak
    }), 200
