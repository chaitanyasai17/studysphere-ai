import jwt
import bcrypt
import datetime
import logging
from flask import Blueprint, request, jsonify, g
from app.config import Config
from app.utils.db import get_db
from app.middleware.auth import token_required

logger = logging.getLogger(__name__)

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")

def hash_password(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def check_password(password, hashed):
    if not password or not hashed:
        return False
    try:
        # Check verbatim password first
        if bcrypt.checkpw(password.encode("utf-8"), hashed.encode("utf-8")):
            return True
        # Check stripped password if there was accidental leading/trailing whitespace
        stripped = password.strip()
        if stripped != password and bcrypt.checkpw(stripped.encode("utf-8"), hashed.encode("utf-8")):
            return True
        return False
    except Exception as e:
        logger.warning(f"Error during bcrypt checkpw: {e}")
        return False

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

def _format_user(user):
    """Standard user object formatter for API responses."""
    raw_role = user.get("role", "student")
    user_role = "student" if raw_role == "user" else raw_role
    return {
        "id": str(user["_id"]),
        "name": user.get("name", "Student Scholar"),
        "email": user.get("email", ""),
        "role": user_role,
        "is_verified": user.get("is_verified", False),
        "avatar": user.get("avatar", ""),
        "last_login": user.get("last_login"),
        "created_at": user.get("created_at"),
    }

# ── GET /api/auth/me — Validate token and return current user from DB ──
@auth_bp.route("/me", methods=["GET"])
@token_required
def get_me():
    db = get_db()
    users_col = db.get_collection("users")

    # g.user_id is set by @token_required decorator
    user = users_col.find_one({"_id": g.user_id})
    if not user:
        # Try alternative ID formats (ObjectId string vs raw)
        from bson import ObjectId
        try:
            user = users_col.find_one({"_id": ObjectId(g.user_id)})
        except Exception:
            pass

    if not user:
        return jsonify({"message": "User not found."}), 401

    if user.get("is_suspended", False):
        return jsonify({"message": "Your account has been suspended."}), 403

    return jsonify({"success": True, "user": _format_user(user)}), 200

@auth_bp.route("/register", methods=["POST"])
def register():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    name = (data.get("name") or "").strip()
    
    if not email or not password or not name:
        logger.warning("Registration rejected: Missing name, email, or password.")
        return jsonify({"success": False, "message": "Name, email, and password are required!"}), 400
        
    db = get_db()
    users_col = db.get_collection("users")
    
    if users_col.find_one({"email": email}):
        logger.warning(f"Registration rejected: User with email '{email}' already exists.")
        return jsonify({"success": False, "message": "User with this email already exists!"}), 409
        
    # Create user
    verification_token = str(datetime.datetime.utcnow().timestamp())
    hashed_pwd = hash_password(password)
    now_iso = datetime.datetime.utcnow().isoformat()
    
    # Assign role based on designated admin addresses
    if email == "superadmin@studysphere.ai":
        role = "superadmin"
    elif email == "admin@studysphere.ai":
        role = "admin"
    else:
        role = "student"
    
    user_doc = {
        "email": email,
        "password_hash": hashed_pwd,
        "password": hashed_pwd,
        "name": name,
        "role": role,
        "is_verified": False,
        "is_suspended": False,
        "verification_token": verification_token,
        "reset_token": None,
        "refresh_token": None,
        "created_at": now_iso,
        "updated_at": now_iso,
        "last_login": None
    }
    
    res = users_col.insert_one(user_doc)
    user_id = str(res.inserted_id)
    logger.info(f"User registered successfully: id={user_id}, email={email}, role={role}")
    
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
        "timestamp": now_iso
    })
    
    return jsonify({
        "success": True,
        "message": "Registration successful! Verification token generated.",
        "verification_token": verification_token,
        "role": role,
        "user_id": user_id
    }), 201

@auth_bp.route("/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    
    if not email or not password:
        logger.warning("Login rejected: Missing email or password.")
        return jsonify({"success": False, "message": "Email and password are required!"}), 400
        
    db = get_db()
    users_col = db.get_collection("users")
    user = users_col.find_one({"email": email})
    
    # Handle known registration email typo aliases (e.g. johnknox vs johknox)
    if not user and email == "johnknox.kalle@gmail.com":
        user = users_col.find_one({"email": "johknox.kalle@gmail.com"})
    elif not user and email == "johknox.kalle@gmail.com":
        user = users_col.find_one({"email": "johnknox.kalle@gmail.com"})
        
    if not user:
        logger.warning(f"Login rejected: No account found matching email '{email}'.")
        return jsonify({"success": False, "message": "Invalid email or password!"}), 401
        
    if user.get("is_suspended", False):
        logger.warning(f"Login rejected: Account is suspended for email '{email}'.")
        return jsonify({"success": False, "message": "Your account has been suspended. Please contact support."}), 403

    # Check both password_hash and password document fields
    stored_hash = user.get("password_hash") or user.get("password")
    if not check_password(password, stored_hash):
        logger.warning(f"Login rejected: Incorrect password provided for email '{email}'.")
        return jsonify({"success": False, "message": "Invalid email or password!"}), 401
        
    user_id = str(user["_id"])
    access_token, refresh_token = generate_tokens(user_id)
    now_iso = datetime.datetime.utcnow().isoformat()
    
    # Save refresh token, last_login, and ensure both password fields exist
    update_fields = {
        "refresh_token": refresh_token,
        "last_login": now_iso,
        "updated_at": now_iso,
    }
    if not user.get("password_hash") and stored_hash:
        update_fields["password_hash"] = stored_hash
    if not user.get("password") and stored_hash:
        update_fields["password"] = stored_hash
    users_col.update_one({"_id": user_id}, {"$set": update_fields})
    
    # Log session
    logs_col = db.get_collection("logs")
    logs_col.insert_one({
        "user_id": user_id,
        "action": "login",
        "ip_address": request.remote_addr,
        "user_agent": request.headers.get("User-Agent"),
        "timestamp": now_iso
    })
    
    logger.info(f"Login successful for user: id={user_id}, email={email}, role={_format_user(user)['role']}")
    
    return jsonify({
        "success": True,
        "access_token": access_token,
        "refresh_token": refresh_token,
        "user": _format_user(user)
    }), 200

@auth_bp.route("/refresh", methods=["POST"])
def refresh():
    data = request.get_json() or {}
    refresh_token = data.get("refresh_token")
    
    if not refresh_token:
        return jsonify({"success": False, "message": "Refresh token is missing!"}), 400
        
    try:
        payload = jwt.decode(refresh_token, Config.JWT_REFRESH_SECRET, algorithms=["HS256"])
        user_id = payload.get("user_id")
        
        db = get_db()
        users_col = db.get_collection("users")
        user = users_col.find_one({"_id": user_id})
        
        if not user or user.get("refresh_token") != refresh_token:
            return jsonify({"success": False, "message": "Invalid or revoked refresh token!"}), 401
            
        access_token, new_refresh_token = generate_tokens(user_id)
        users_col.update_one({"_id": user_id}, {"$set": {"refresh_token": new_refresh_token}})
        
        return jsonify({
            "success": True,
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "user": _format_user(user)
        }), 200
    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError):
        return jsonify({"success": False, "message": "Expired or invalid refresh token!"}), 401

@auth_bp.route("/verify-email", methods=["POST"])
def verify_email():
    data = request.get_json() or {}
    token = data.get("token")
    
    if not token:
        return jsonify({"success": False, "message": "Verification token is required!"}), 400
        
    db = get_db()
    users_col = db.get_collection("users")
    user = users_col.find_one({"verification_token": token})
    
    if not user:
        return jsonify({"success": False, "message": "Invalid or expired verification token!"}), 400
        
    users_col.update_one(
        {"_id": user["_id"]},
        {"$set": {"is_verified": True, "verification_token": None, "updated_at": datetime.datetime.utcnow().isoformat()}}
    )
    
    return jsonify({"success": True, "message": "Email verified successfully!"}), 200

@auth_bp.route("/forgot-password", methods=["POST"])
def forgot_password():
    data = request.get_json() or {}
    email = (data.get("email") or "").strip().lower()
    
    if not email:
        return jsonify({"success": False, "message": "Email is required!"}), 400
        
    db = get_db()
    users_col = db.get_collection("users")
    user = users_col.find_one({"email": email})
    
    if not user:
        return jsonify({"success": True, "message": "If that email exists in our system, we sent a password reset token."}), 200
        
    reset_token = str(datetime.datetime.utcnow().timestamp())
    users_col.update_one({"_id": user["_id"]}, {"$set": {"reset_token": reset_token}})
    
    return jsonify({
        "success": True,
        "message": "Password reset token generated.",
        "reset_token": reset_token
    }), 200

@auth_bp.route("/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json() or {}
    token = data.get("token")
    new_password = data.get("password")
    
    if not token or not new_password:
        return jsonify({"success": False, "message": "Token and password are required!"}), 400
        
    db = get_db()
    users_col = db.get_collection("users")
    user = users_col.find_one({"reset_token": token})
    
    if not user:
        return jsonify({"success": False, "message": "Invalid or expired reset token!"}), 400
        
    hashed_pwd = hash_password(new_password)
    users_col.update_one(
        {"_id": user["_id"]},
        {"$set": {
            "password_hash": hashed_pwd,
            "password": hashed_pwd,
            "reset_token": None,
            "updated_at": datetime.datetime.utcnow().isoformat()
        }}
    )
    
    return jsonify({"success": True, "message": "Password has been reset successfully!"}), 200
