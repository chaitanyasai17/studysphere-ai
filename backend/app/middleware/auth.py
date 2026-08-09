import jwt
import logging
from functools import wraps
from flask import request, jsonify, g
from app.config import Config
from app.utils.db import get_db

logger = logging.getLogger(__name__)

def token_required(f):
    """Decorator to protect API endpoints with JWT Access Tokens."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Check authorization header
        if "Authorization" in request.headers:
            auth_header = request.headers["Authorization"].split(" ")
            if len(auth_header) == 2 and auth_header[0] == "Bearer":
                token = auth_header[1]

        if not token:
            logger.warning("Auth Middleware: Access token is missing!")
            return jsonify({"message": "Access token is missing!"}), 401

        try:
            # Decode token
            data = jwt.decode(token, Config.JWT_SECRET, algorithms=["HS256"])
            g.user_id = data.get("user_id")
            logger.info(f"Auth Middleware: Decoded token for user_id={g.user_id}")
            
            # Fetch user from database to verify active status and role
            db = get_db()
            users_col = db.get_collection("users")
            user = users_col.find_one({"_id": g.user_id})
            
            if not user:
                logger.warning(f"Auth Middleware: User {g.user_id} not found in database!")
                return jsonify({"message": "User not found or disabled."}), 401
                
            g.user_role = user.get("role", "user")
            g.user_email = user.get("email")
            g.user_name = user.get("name")
        except jwt.ExpiredSignatureError:
            logger.warning("Auth Middleware: Access token has expired!")
            return jsonify({"message": "Access token has expired!"}), 401
        except jwt.InvalidTokenError as e:
            logger.warning(f"Auth Middleware: Invalid token: {e}")
            return jsonify({"message": "Invalid token!"}), 401

        return f(*args, **kwargs)

    return decorated

def admin_required(f):
    """Decorator to restrict access to administrator role only."""
    @wraps(f)
    def decorated(*args, **kwargs):
        # First verify token is valid and user is logged in
        res = token_required(lambda: "OK")()
        if res != "OK":
            return res

        # Check if role is admin, superadmin, moderator, or support
        admin_roles = ["superadmin", "admin", "moderator", "support"]
        if getattr(g, "user_role", None) not in admin_roles:
            return jsonify({"message": "Forbidden: Administrator permissions required."}), 403

        return f(*args, **kwargs)

    return decorated
