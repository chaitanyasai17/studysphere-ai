"""
StudySphere AI - Idempotent Admin Bootstrap / Seeding Script
Usage:
    python backend/scripts/seed_admin.py
    python backend/scripts/seed_admin.py --email admin@studysphere.ai --password "Admin@123"
"""

import sys
import os
import argparse
import datetime
import bcrypt

# Ensure the backend directory is in the Python module search path
backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

from app.utils.db import get_db

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def seed_admin(email=None, password=None, name=None, role=None):
    email = (email or os.getenv("ADMIN_EMAIL", "admin@studysphere.ai")).strip().lower()
    password = password or os.getenv("ADMIN_PASSWORD", "Admin@123")
    name = name or os.getenv("ADMIN_NAME", "StudySphere Administrator")
    role = (role or os.getenv("ADMIN_ROLE", "admin")).strip().lower()

    print(f"[*] Initializing database connection for admin seed...")
    db = get_db()
    users_col = db.get_collection("users")

    hashed_pw = hash_password(password)

    existing = users_col.find_one({"email": email})
    now = datetime.datetime.now(datetime.timezone.utc).isoformat()

    if existing:
        user_id = str(existing.get("_id", existing.get("id")))
        print(f"[*] Existing account found for '{email}' (ID: {user_id}). Updating credentials and admin privileges...")
        users_col.update_one(
            {"email": email},
            {"$set": {
                "password_hash": hashed_pw,
                "password": hashed_pw,
                "role": role,
                "account_status": "VERIFIED",
                "is_verified": True,
                "name": name,
                "updated_at": now
            }}
        )
        print(f"[+] Admin account updated successfully.")
    else:
        print(f"[*] Creating new admin account for '{email}'...")
        user_doc = {
            "email": email,
            "password_hash": hashed_pw,
            "password": hashed_pw,
            "name": name,
            "role": role,
            "account_status": "VERIFIED",
            "is_verified": True,
            "verification_token": None,
            "reset_token": None,
            "refresh_token": None,
            "created_at": now
        }
        res = users_col.insert_one(user_doc)
        inserted_id = getattr(res, "inserted_id", None) or user_doc.get("_id")
        print(f"[+] Admin account created successfully (ID: {inserted_id}).")

    # Verify credentials
    record = users_col.find_one({"email": email})
    stored_hash = record.get("password_hash") or record.get("password")
    if bcrypt.checkpw(password.encode("utf-8"), stored_hash.encode("utf-8")):
        print(f"[OK] Verification SUCCESS: Password for '{email}' verified against stored hash.")
        print(f"    Email:    {email}")
        print(f"    Role:     {record.get('role')}")
        print(f"    Status:   {record.get('account_status')}")
    else:
        print(f"[!] Warning: Password verification failed after seeding!")
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Seed or update the StudySphere admin user.")
    parser.add_argument("--email", default=None, help="Admin email (default: admin@studysphere.ai)")
    parser.add_argument("--password", default=None, help="Admin password (default: Admin@123)")
    parser.add_argument("--name", default=None, help="Admin display name")
    parser.add_argument("--role", default=None, help="Admin role (admin or superadmin)")
    args = parser.parse_args()

    seed_admin(email=args.email, password=args.password, name=args.name, role=args.role)

if __name__ == "__main__":
    main()
