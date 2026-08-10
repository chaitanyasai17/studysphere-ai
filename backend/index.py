import os
import sys

# Ensure backend directory is in the Python search path for Vercel/multi-project deployment
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from app import create_app

app = create_app()
