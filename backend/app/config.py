import os
from dotenv import load_dotenv

# Load environment variables from backend/.env dynamically
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
env_path = os.path.join(base_dir, ".env")
load_dotenv(dotenv_path=env_path)

def safe_print(msg):
    try:
        print(msg, flush=True)
    except UnicodeEncodeError:
        msg_ascii = msg.replace("✓", "[OK]").replace("✗", "[MISSING]")
        print(msg_ascii, flush=True)

# Print loading verification details without exposing keys
safe_print("\n=================================")
safe_print("StudySphere AI Env Verification")
safe_print("=================================")
safe_print(f"Loaded .env from:\n{env_path}\n")
safe_print(f"GEMINI_API_KEY : {'Loaded ✓' if (os.getenv('GEMINI_API_KEY') or os.getenv('GCP_API_KEY')) else 'Missing ✗'}")
safe_print(f"OPENAI_API_KEY : {'Loaded ✓' if os.getenv('OPENAI_API_KEY') else 'Missing ✗'}")
safe_print(f"OPENAI_MODEL   : {'Loaded ✓' if os.getenv('OPENAI_MODEL') else 'Missing ✗'}")
safe_print(f"GEMINI_MODEL   : {'Loaded ✓' if os.getenv('GEMINI_MODEL') else 'Missing ✗'}")
safe_print("=================================\n")

class Config:
    PORT = int(os.getenv("PORT", 5000))
    ENV = os.getenv("FLASK_ENV", "development")
    DEBUG = ENV == "development"
    
    # JWT Secrets
    JWT_SECRET = os.getenv("JWT_SECRET", "default-jwt-secret-key-12345")
    JWT_REFRESH_SECRET = os.getenv("JWT_REFRESH_SECRET", "default-jwt-refresh-key-12345")
    JWT_ACCESS_TOKEN_EXPIRES = 3600  # 1 hour
    JWT_REFRESH_TOKEN_EXPIRES = 604800  # 7 days

    # MongoDB URI
    MONGODB_URI = os.getenv("MONGODB_URI", "")
    
    # AI Integration
    OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY") or os.getenv("GCP_API_KEY", "")
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-lite-latest")
    
    # Upload folder
    if os.getenv("VERCEL") == "1":
        UPLOAD_FOLDER = "/tmp"
    else:
        UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "uploads")
    ALLOWED_EXTENSIONS = {"pdf"}
    
    # Logs folder
    if os.getenv("VERCEL") == "1":
        LOG_DIR = "/tmp"
    else:
        LOG_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "logs")
