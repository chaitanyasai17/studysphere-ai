import os
import logging
from flask import Flask, jsonify
from flask_cors import CORS
from app.config import Config

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(levelname)s in %(module)s: %(message)s"
)

from flask.json.provider import DefaultJSONProvider
from bson import ObjectId
from datetime import datetime

class CustomJSONProvider(DefaultJSONProvider):
    def default(self, obj):
        if isinstance(obj, ObjectId):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

def create_app():
    app = Flask(__name__)
    app.json = CustomJSONProvider(app)
    app.config.from_object(Config)
    
    # Configure CORS - Allow React frontend local client and production addresses
    CORS(app, resources={r"/*": {"origins": "*"}})
    
    # Create upload/logs directories if they do not exist
    try:
        os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    except Exception as e:
        app.logger.warning(f"Could not create upload directory: {e}")
        
    try:
        os.makedirs(app.config["LOG_DIR"], exist_ok=True)
    except Exception as e:
        app.logger.warning(f"Could not create logs directory: {e}")
    
    # Register blueprints
    from app.routes.auth import auth_bp
    from app.routes.notes import notes_bp
    from app.routes.ai import ai_bp
    from app.routes.pdf import pdf_bp
    from app.routes.quiz import quiz_bp
    from app.routes.flashcards import flashcards_bp
    from app.routes.planner import planner_bp
    from app.routes.coding import coding_bp
    from app.routes.resume import resume_bp
    from app.routes.analytics import analytics_bp
    from app.routes.admin import admin_bp
    from app.routes.notifications import notifications_bp
    from app.routes.search import search_bp
    from app.routes.profile import profile_bp
    from app.routes.cybersecurity import cybersecurity_bp
    
    app.register_blueprint(auth_bp)
    app.register_blueprint(notes_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(pdf_bp)
    app.register_blueprint(quiz_bp)
    app.register_blueprint(flashcards_bp)
    app.register_blueprint(planner_bp)
    app.register_blueprint(coding_bp)
    app.register_blueprint(resume_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(notifications_bp)
    app.register_blueprint(search_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(cybersecurity_bp)
    
    # Register DatabaseConnectionError handler
    from app.utils.db import DatabaseConnectionError
    @app.errorhandler(DatabaseConnectionError)
    def handle_db_connection_error(e):
        return jsonify({
            "message": str(e)
        }), 503
        
    # Serve upload assets
    from flask import send_from_directory
    @app.route("/uploads/<path:filename>", methods=["GET"])
    def serve_uploaded_file(filename):
        return send_from_directory(app.config["UPLOAD_FOLDER"], filename)
        
    # Root Status API
    @app.route("/", methods=["GET"])
    def index():
        from app.utils.db import get_db
        db = get_db()
        return jsonify({
            "name": "StudySphere AI API Server",
            "version": "1.0.0",
            "status": "online",
            "environment": app.config["ENV"],
            "database": "mock_json" if db.is_mock else "mongodb_atlas",
            "ai_mode": "mock_sandbox" if not Config.OPENAI_API_KEY else "openai_active"
        }), 200
        
    # Secure DB Diagnostics API
    @app.route("/api/db-check", methods=["GET"])
    def db_check():
        import re
        uri = app.config.get("MONGODB_URI", "")
        if not uri:
            return jsonify({"status": "error", "message": "MONGODB_URI is empty"}), 200
            
        match = re.match(r"(mongodb(?:\+srv)?://)([^:]+):([^@]+)@(.+)", uri)
        if not match:
            return jsonify({
                "status": "invalid_format",
                "uri_preview": uri[:15] + "..." if len(uri) > 15 else uri,
                "length": len(uri)
            }), 200
            
        scheme, username, password, rest = match.groups()
        return jsonify({
            "status": "parsed",
            "scheme": scheme,
            "username": username,
            "password_len": len(password),
            "password_first_last": password[0] + "..." + password[-1] if len(password) > 2 else password,
            "host_preview": rest[:30] + "..." if len(rest) > 30 else rest
        }), 200
        
    # Performance Profiling Hook
    import time
    from flask import g, request
    import logging
    
    perf_logger = logging.getLogger("performance")
    
    @app.before_request
    def start_timer():
        g.start_time = time.time()
        g.db_query_time = 0.0
        g.gemini_time = 0.0
        g.pdf_parse_time = 0.0
        
    @app.after_request
    def log_performance(response):
        if hasattr(g, 'start_time'):
            total_time = time.time() - g.start_time
            endpoint = request.endpoint or request.path
            perf_logger.info(
                f"PERF AUDIT - Endpoint: {endpoint} | "
                f"Total: {total_time:.4f}s | "
                f"DB Query: {g.db_query_time:.4f}s | "
                f"Gemini: {g.gemini_time:.4f}s | "
                f"PDF Parse: {g.pdf_parse_time:.4f}s"
            )
        return response

    # Global exception handler to return json payload
    @app.errorhandler(Exception)
    def handle_exception(e):
        from werkzeug.exceptions import HTTPException
        if isinstance(e, HTTPException):
            return jsonify({
                "message": e.description,
                "error": e.name
            }), e.code
            
        app.logger.error(f"Unhandled Exception: {e}")
        err_msg = str(e)
        # Determine status code based on error type
        status_code = 400 if ("Gemini API key" in err_msg or "GEMINI_API_KEY" in err_msg) else 500
        return jsonify({
            "success": False,
            "message": err_msg
        }), status_code
        
    @app.errorhandler(404)
    def page_not_found(e):
        return jsonify({"message": "Requested endpoint not found."}), 404
        
    # Seed default admin account
    try:
        import datetime
        import bcrypt
        from bson import ObjectId
        from app.utils.db import get_db
        db = get_db()
        users_col = db.get_collection("users")
        
        admin_email = "admin@studysphere.ai"
        existing_admin = users_col.find_one({"email": admin_email})
        if existing_admin:
            # Enforce admin role for the seeded administrator account
            if existing_admin.get("role") != "admin":
                users_col.update_one({"email": admin_email}, {"$set": {"role": "admin"}})
                app.logger.info("Updated existing admin account role to 'admin'.")
            
        if not existing_admin:
            hashed_pw = bcrypt.hashpw("Admin@123".encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            admin_user = {
                "_id": str(ObjectId()),
                "email": admin_email,
                "password_hash": hashed_pw,
                "name": "StudySphere Administrator",
                "role": "admin",
                "is_verified": True,
                "is_suspended": False,
                "created_at": datetime.datetime.utcnow().isoformat()
            }
            users_col.insert_one(admin_user)
            app.logger.info("Seeded default administrator account successfully.")
            
        # Demote all other users to 'user' role to prevent legacy admin promotions
        users_col.update_many(
            {"email": {"$ne": admin_email}},
            {"$set": {"role": "user"}}
        )
        app.logger.info("Enforced 'user' role for all non-admin accounts in database.")
    except Exception as seed_err:
        app.logger.warning(f"Could not seed default admin account: {seed_err}")
        
    return app
