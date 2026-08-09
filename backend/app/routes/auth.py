import jwt
import bcrypt
import datetime
from flask import Blueprint, request, jsonify
from app.config import Config
from app.utils.db import get_db

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

def hash_password(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def check_password(password, hashed):
    return bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8"))

def generate_tokens(user_id):
    now = datetime.datetime.now(datetime.timezone.utc)
    access_payload = {
        "user_id": user_id,
        "exp": now + datetime.timedelta(seconds=Config.JWT_ACCESS_TOKEN_EXPIRES)
    }
    refresh_payload = {
        "user_id": user_id,
        "exp": now + datetime.timedelta(seconds=Config.JWT_REFRESH_TOKEN_EXPIRES)
    }
    access_token = jwt.encode(access_payload, Config.JWT_SECRET, algorithm="HS256")
    refresh_token = jwt.encode(refresh_payload, Config.JWT_REFRESH_SECRET, algorithm="HS256")
    return access_token, refresh_token

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    name = data.get("name")
    
    if not email or not password or not name:
        return jsonify({"message": "Name, email, and password are required!"}), 400
        
    db = get_db()
    users_col = db.get_collection("users")
    
    if users_col.find_one({"email": email}):
        return jsonify({"message": "User with this email already exists!"}), 400
        
    # Create user
    verification_token = str(datetime.datetime.utcnow().timestamp())
    hashed_pwd = hash_password(password)
    
    # Assign role - only admin@studysphere.ai gets admin role, all others get 'user'
    role = "admin" if email == "admin@studysphere.ai" else "user"
    
    user_doc = {
        "email": email,
        "password_hash": hashed_pwd,
        "name": name,
        "role": role,
        "is_verified": False,
        "verification_token": verification_token,
        "reset_token": None,
        "refresh_token": None,
        "created_at": datetime.datetime.utcnow()
    }
    
    res = users_col.insert_one(user_doc)
    user_id = str(res.inserted_id)
    
    # Initialize basic progress tracking for new student
    progress_col = db.get_collection("progress")
    today = datetime.datetime.utcnow().strftime("%Y-%m-%d")
    progress_col.insert_one({
        "user_id": user_id,
        "date": today,
        "study_hours": 0.0,
        "quizzes_taken": 0,
        "quiz_accuracy": 0.0,
        "ai_tokens_used": 0,
        "notes_created": 0
    })
    
    # Setup default settings
    settings_col = db.get_collection("settings")
    settings_col.insert_one({
        "user_id": user_id,
        "theme": "dark",
        "email_reminders": True,
        "ai_model": Config.OPENAI_MODEL
    })
    
    # Log system event
    logs_col = db.get_collection("logs")
    logs_col.insert_one({
        "user_id": user_id,
        "action": "register",
        "ip_address": request.remote_addr,
        "user_agent": request.headers.get("User-Agent"),
        "timestamp": datetime.datetime.utcnow()
    })
    
    return jsonify({
        "message": "Registration successful! Verification token generated.",
        "verification_token": verification_token,
        "role": role,
        "user_id": user_id
    }), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        return jsonify({"message": "Email and password are required!"}), 400
        
    db = get_db()
    users_col = db.get_collection("users")
    user = users_col.find_one({"email": email})
    
    if not user or not check_password(password, user["password_hash"]):
        return jsonify({"message": "Invalid email or password!"}), 401
        
    user_id = str(user["_id"])
    access_token, refresh_token = generate_tokens(user_id)
    
    # Save refresh token in database
    users_col.update_one({"_id": user_id}, {"$set": {"refresh_token": refresh_token}})
    
    # Log session
    logs_col = db.get_collection("logs")
    logs_col.insert_one({
        "user_id": user_id,
        "action": "login",
        "ip_address": request.remote_addr,
        "user_agent": request.headers.get("User-Agent"),
        "timestamp": datetime.datetime.utcnow()
    })
    
    return jsonify({
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": {
            "id": user_id,
            "name": user["name"],
            "email": user["email"],
            "role": user.get("role", "user"),
            "is_verified": user.get("is_verified", False),
            "avatar": user.get("avatar", "")
        }
    }), 200

@auth_bp.route("/refresh", methods=["POST"])
def refresh():
    data = request.get_json() or {}
    refresh_token = data.get("refresh_token")
    
    if not refresh_token:
        return jsonify({"message": "Refresh token is missing!"}), 400
        
    try:
        payload = jwt.decode(refresh_token, Config.JWT_REFRESH_SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id")
        
        db = get_db()
        users_col = db.get_collection("users")
        user = users_col.find_one({"_id": user_id})
        
        if not user or user.get("refresh_token") != refresh_token:
            return jsonify({"message": "Invalid or revoked refresh token!"}), 401
            
        access_token, new_refresh_token = generate_tokens(user_id)
        users_col.update_one({"_id": user_id}, {"$set": {"refresh_token": new_refresh_token}})
        
        return jsonify({
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "user": {
                "id": user_id,
                "name": user.get("name", "Student Scholar"),
                "email": user.get("email"),
                "role": user.get("role", "user"),
                "is_verified": user.get("is_verified", False),
                "avatar": user.get("avatar", "")
            }
        }), 200
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return jsonify({"message": "Expired or invalid refresh token!"}), 401

@auth_bp.route("/verify-email", methods=["POST"])
def verify_email():
    data = request.get_json() or {}
    token = data.get("token")
    
    if not token:
        return jsonify({"message": "Verification token is required!"}), 400
        
    db = get_db()
    users_col = db.get_collection("users")
    user = users_col.find_one({"verification_token": token})
    
    if not user:
        return jsonify({"message": "Invalid or expired verification token!"}), 400
        
    users_col.update_one(
        {"_id": user["_id"]},
        {"$set": {"is_verified": True, "verification_token": None}}
    )
    
    return jsonify({"message": "Email verified successfully!"}), 200

@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json() or {}
    email = data.get("email")
    
    if not email:
        return jsonify({"message": "Email is required!"}), 400
        
    db = get_db()
    users_col = db.get_collection("users")
    user = users_col.find_one({"email": email})
    
    if not user:
        return jsonify({"message": "If that email exists in our system, we sent a password reset token."}), 200
        
    reset_token = str(datetime.datetime.utcnow().timestamp())
    users_col.update_one({"_id": user["_id"]}, {"$set": {"reset_token": reset_token}})
    
    return jsonify({
        "message": "Password reset token generated.",
        "reset_token": reset_token
    }), 200

@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json() or {}
    token = data.get("token")
    new_password = data.get("password")
    
    if not token or not new_password:
        return jsonify({"message": "Token and password are required!"}), 400
        
    db = get_db()
    users_col = db.get_collection("users")
    user = users_col.find_one({"reset_token": token})
    
    if not user:
        return jsonify({"message": "Invalid or expired reset token!"}), 400
        
    hashed_pwd = hash_password(new_password)
    users_col.update_one(
        {"_id": user["_id"]},
        {"$set": {"password_hash": hashed_pwd, "reset_token": None}}
    )
    
    return jsonify({"message": "Password has been reset successfully!"}), 200
