import os
import sys
from app.config import Config

def safe_print(msg):
    try:
        print(msg, flush=True)
    except UnicodeEncodeError:
        msg_ascii = msg.replace("✓", "[OK]").replace("✗", "[MISSING]")
        print(msg_ascii, flush=True)

# Resolve env_path directly
run_dir = os.path.dirname(os.path.abspath(__file__))
env_path_abs = os.path.join(run_dir, ".env")

env_loaded = "YES" if os.path.exists(env_path_abs) else "NO"
key_loaded = "Loaded ✓" if Config.GEMINI_API_KEY else "Missing ✗"
key_status = "YES" if Config.GEMINI_API_KEY else "NO"

# Print Startup Header
safe_print("---------------------------------------")
safe_print("StudySphere AI")
safe_print("---------------------------------------")
safe_print(f"Environment Loaded : {env_loaded}")
safe_print(f".env Path : {env_path_abs}")
safe_print(f"GEMINI_API_KEY Loaded: {key_status}")
safe_print("")
safe_print("Gemini SDK : Installed")
safe_print(f"Gemini Model : {Config.GEMINI_MODEL}")
safe_print(f"Gemini API Key : {key_loaded}")
safe_print("")
safe_print("AI Service : Ready")
safe_print("---------------------------------------")

from app import create_app
app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get("PORT", Config.PORT))
    debug = os.environ.get("FLASK_ENV", "development") == "development"
    print(f"Starting StudySphere AI backend server on port {port} (Debug: {debug})...")
    app.run(host="0.0.0.0", port=port, debug=debug)
