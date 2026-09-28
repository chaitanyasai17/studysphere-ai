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
    app = Flask(__name__, static_folder=None, static_url_path=None)
    app.json = CustomJSONProvider(app)
    app.config.from_object(Config)
    
    # Configure CORS - Explicit production and local origins with credentials support
    allowed_origins = os.environ.get("ALLOWED_ORIGINS", "")
    if allowed_origins and allowed_origins != "*":
        origin_list = [o.strip() for o in allowed_origins.split(",") if o.strip()]
    else:
        origin_list = [
            "https://studysphere-ai-phi.vercel.app",
            "http://localhost:5173",
            "http://localhost:3000",
            "http://127.0.0.1:5173"
        ]
    CORS(
        app,
        resources={r"/*": {"origins": origin_list}},
        supports_credentials=True,
        allow_headers=["Content-Type", "Authorization", "X-Requested-With"],
        methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
    )
    
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
        
    # Root Status / Health API
    @app.route("/api/health", methods=["GET"])
    def health_check():
        from app.utils.db import get_db
        db = get_db()
        db_type = "mongodb" if getattr(db, "is_mongo", False) else "sqlite"
        return jsonify({
            "status": "online",
            "database": db_type,
            "environment": app.config.get("ENV", "production")
        }), 200

    # Serve index.html for SPA root and catch-all for SPA deep routing
    @app.route("/", defaults={"path": ""})
    @app.route("/<path:path>")
    def catch_all(path):
        if path.startswith("api/") or path.startswith("uploads/"):
            return jsonify({"error": "Not Found"}), 404
            
        import os
        from flask import send_from_directory
        
        current_dir = os.path.dirname(os.path.abspath(__file__))
        static_dir = os.path.abspath(os.path.join(current_dir, "..", "..", "frontend", "dist"))
        
        # If the path matches an actual static file, serve it directly
        target_path = os.path.join(static_dir, path)
        if path and os.path.exists(target_path) and os.path.isfile(target_path):
            return send_from_directory(static_dir, path)
            
        # Otherwise, fall back to index.html for SPA routing
        return send_from_directory(static_dir, "index.html")
        
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
        
    # Seed default administrator accounts (admin@studysphere.ai and superadmin@studysphere.ai)
    try:
        import datetime
        import bcrypt
        from bson import ObjectId
        from app.utils.db import get_db
        db = get_db()
        users_col = db.get_collection("users")
        
        default_admins = [
            {
                "email": "admin@studysphere.ai",
                "password": "Admin@123",
                "name": "StudySphere Administrator",
                "role": "admin"
            },
            {
                "email": "superadmin@studysphere.ai",
                "password": "SuperAdmin@123",
                "name": "StudySphere Super Administrator",
                "role": "superadmin"
            }
        ]
        
        for acc in default_admins:
            admin_email = acc["email"]
            existing = users_col.find_one({"email": admin_email})
            hashed_pw = bcrypt.hashpw(acc["password"].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
            
            if existing:
                # Update role and credentials to ensure seamless access
                users_col.update_one(
                    {"email": admin_email},
                    {"$set": {
                        "role": acc["role"],
                        "password_hash": hashed_pw,
                        "password": hashed_pw,
                        "is_verified": True,
                        "is_suspended": False
                    }}
                )
                app.logger.info(f"Verified and refreshed credentials for admin: {admin_email} (role: {acc['role']}).")
            else:
                admin_user = {
                    "_id": str(ObjectId()),
                    "email": admin_email,
                    "password_hash": hashed_pw,
                    "password": hashed_pw,
                    "name": acc["name"],
                    "role": acc["role"],
                    "is_verified": True,
                    "is_suspended": False,
                    "created_at": datetime.datetime.utcnow().isoformat()
                }
                users_col.insert_one(admin_user)
                app.logger.info(f"Seeded default admin account successfully: {admin_email} (role: {acc['role']}).")
    except Exception as seed_err:
        app.logger.warning(f"Could not seed default admin accounts: {seed_err}")
        
    return app
