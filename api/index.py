import os
import sys

# Ensure backend directory is in sys.path for Vercel Serverless runtime
root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
backend_dir = os.path.join(root_dir, "backend")

if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app import create_app

flask_app = create_app()

class VercelPathMiddleware:
    """WSGI middleware ensuring proper path resolution on Vercel Serverless runtime."""
    def __init__(self, wsgi_app):
        self.wsgi_app = wsgi_app

    def __call__(self, environ, start_response):
        path = environ.get("PATH_INFO", "")
        
        # Strip /api/index.py or /api/index if Vercel serverless includes function filename in path
        if path.startswith("/api/index.py"):
            path = path[len("/api/index.py"):]
        elif path.startswith("/api/index"):
            path = path[len("/api/index"):]
            
        # Standardize path for Flask blueprints
        if not path or path == "/":
            path = "/api/health"
        elif not path.startswith("/api"):
            path = "/api" + path
            
        environ["PATH_INFO"] = path
        return self.wsgi_app(environ, start_response)

flask_app.wsgi_app = VercelPathMiddleware(flask_app.wsgi_app)
app = flask_app

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
