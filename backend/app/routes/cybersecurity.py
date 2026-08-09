import os
import datetime
import base64
import hashlib
import copy
from flask import Blueprint, request, jsonify, g
from app.middleware.auth import token_required
from app.utils.db import get_db
from app.services.ai_service import get_ai

cybersecurity_bp = Blueprint("cybersecurity", __name__, url_prefix="/api/cybersecurity")

# Base Mock Filesystem Template
MOCK_FS_TEMPLATE = {
    "/": {
        "type": "dir",
        "children": ["home", "var", "etc"]
    },
    "/home": {
        "type": "dir",
        "children": ["student"]
    },
    "/home/student": {
        "type": "dir",
        "children": ["notes.txt", "labs", "flag.txt"]
    },
    "/home/student/notes.txt": {
        "type": "file",
        "content": "StudySphere AI - Cybersecurity Lab Notes.\nRemember to parameterize your SQL inputs to prevent SQLi!"
    },
    "/home/student/flag.txt": {
        "type": "file",
        "content": "FLAG{MOCK_LINUX_CLI_CHALLENGE_SOLVED}"
    },
    "/home/student/labs": {
        "type": "dir",
        "children": ["script.py"]
    },
    "/home/student/labs/script.py": {
        "type": "file",
        "content": "print('Hello Security Analyst!')"
    },
    "/var": {
        "type": "dir",
        "children": ["log"]
    },
    "/var/log": {
        "type": "dir",
        "children": ["syslog"]
    },
    "/var/log/syslog": {
        "type": "file",
        "content": "Jul 16 11:35:00 firewall-1 alert: SQL Injection attempt detected from 192.168.1.5"
    },
    "/etc": {
        "type": "dir",
        "children": ["passwd"]
    },
    "/etc/passwd": {
        "type": "file",
        "content": "root:x:0:0:root:/root:/bin/bash\nstudent:x:1000:1000:student:/home/student:/bin/bash"
    }
}

def get_user_fs(user_id):
    db = get_db()
    sessions_col = db.get_collection("terminal_sessions")
    session = sessions_col.find_one({"user_id": user_id})
    if not session:
        # Create user personalized state clone
        session_doc = {
            "user_id": user_id,
            "fs": copy.deepcopy(MOCK_FS_TEMPLATE),
            "cwd": "/home/student",
            "history": [],
            "completed_exercises": []
        }
        sessions_col.insert_one(session_doc)
        return session_doc
    return session

def save_user_fs(user_id, session_doc):
    db = get_db()
    sessions_col = db.get_collection("terminal_sessions")
    sessions_col.update_one(
        {"user_id": user_id},
        {
            "$set": {
                "fs": session_doc["fs"],
                "cwd": session_doc["cwd"],
                "history": session_doc["history"],
                "completed_exercises": session_doc["completed_exercises"]
            }
        }
    )

@cybersecurity_bp.route("/terminal", methods=["POST"])
@token_required
def run_terminal_command():
    data = request.json or {}
    command_line = data.get("command", "").strip()
    
    if not command_line:
        return jsonify({"output": ""}), 200
        
    session = get_user_fs(g.user_id)
    fs = session["fs"]
    cwd = session["cwd"]
    history = session["history"]
    exercises = session["completed_exercises"]
    
    # Save history
    history.append(command_line)
    
    # Parse tokens
    parts = command_line.split()
    cmd = parts[0]
    args = parts[1:]
    
    output = ""
    
    # Stateful command handlers
    if cmd == "pwd":
        output = cwd
    elif cmd == "whoami":
        output = "student"
    elif cmd == "clear":
        output = "__CLEAR__"
    elif cmd == "history":
        output = "\n".join(f"{i+1}  {c}" for i, c in enumerate(history))
    elif cmd == "ping":
        if not args:
            output = "ping: missing host operand"
        else:
            host = args[0]
            output = (
                f"PING {host} (192.168.1.100) 56(84) bytes of data.\n"
                f"64 bytes from 192.168.1.100: icmp_seq=1 ttl=64 time=0.045 ms\n"
                f"64 bytes from 192.168.1.100: icmp_seq=2 ttl=64 time=0.038 ms\n"
                f"--- {host} ping statistics ---\n"
                f"2 packets transmitted, 2 received, 0% packet loss"
            )
            if "ping" not in exercises:
                exercises.append("ping")
    elif cmd == "ls":
        target = cwd
        if args:
            raw_target = args[0]
            if raw_target.startswith("/"):
                target = raw_target
            else:
                target = os.path.normpath(os.path.join(cwd, raw_target)).replace("\\", "/")
        
        if target not in fs or fs[target]["type"] != "dir":
            output = f"ls: cannot access '{target}': No such directory"
        else:
            output = "  ".join(fs[target]["children"])
            if "ls" not in exercises:
                exercises.append("ls")
    elif cmd == "cd":
        if not args:
            new_cwd = "/home/student"
        else:
            raw_target = args[0]
            if raw_target.startswith("/"):
                new_cwd = raw_target
            else:
                new_cwd = os.path.normpath(os.path.join(cwd, raw_target)).replace("\\", "/")
                
        if new_cwd not in fs or fs[new_cwd]["type"] != "dir":
            output = f"cd: no such file or directory: {args[0]}"
        else:
            cwd = new_cwd
            output = ""
            if "cd" not in exercises:
                exercises.append("cd")
    elif cmd == "cat":
        if not args:
            output = "cat: missing file operand"
        else:
            raw_target = args[0]
            if raw_target.startswith("/"):
                target = raw_target
            else:
                target = os.path.normpath(os.path.join(cwd, raw_target)).replace("\\", "/")
                
            if target not in fs or fs[target]["type"] != "file":
                output = f"cat: {args[0]}: No such file"
            else:
                output = fs[target]["content"]
                if "cat" not in exercises:
                    exercises.append("cat")
                # Trigger specific flag solving challenge XP reward!
                if "flag.txt" in target and "solve_flag" not in exercises:
                    exercises.append("solve_flag")
                    # Increment user XP
                    db = get_db()
                    db.get_collection("users").update_one(
                        {"_id": g.user_id},
                        {"$inc": {"xp_points": 50, "coins": 10}}
                    )
                    output += "\n\n🎉 Challenge solved! +50 XP and 🪙 10 Coins awarded!"
    elif cmd == "touch":
        if not args:
            output = "touch: missing file operand"
        else:
            fname = args[0]
            new_path = os.path.normpath(os.path.join(cwd, fname)).replace("\\", "/")
            if new_path in fs:
                output = ""
            else:
                # Add to file list
                fs[new_path] = {
                    "type": "file",
                    "content": ""
                }
                # Update parent
                parent_path = os.path.dirname(new_path).replace("\\", "/")
                if parent_path in fs:
                    fs[parent_path]["children"].append(fname)
                output = ""
                if "touch" not in exercises:
                    exercises.append("touch")
    elif cmd == "mkdir":
        if not args:
            output = "mkdir: missing operand"
        else:
            dname = args[0]
            new_path = os.path.normpath(os.path.join(cwd, dname)).replace("\\", "/")
            if new_path in fs:
                output = "mkdir: directory already exists"
            else:
                fs[new_path] = {
                    "type": "dir",
                    "children": []
                }
                parent_path = os.path.dirname(new_path).replace("\\", "/")
                if parent_path in fs:
                    fs[parent_path]["children"].append(dname)
                output = ""
                if "mkdir" not in exercises:
                    exercises.append("mkdir")
    elif cmd in ["grep", "chmod", "clear"]:
        output = f"Command '{cmd}' is simulated. Use cd, ls, cat, or pwd to explore filesystem challenges."
    else:
        output = f"bash: command not found: {cmd}"
        
    session["fs"] = fs
    session["cwd"] = cwd
    session["history"] = history
    session["completed_exercises"] = exercises
    save_user_fs(g.user_id, session)
    
    return jsonify({
        "output": output,
        "cwd": cwd,
        "completed": exercises
    }), 200

@cybersecurity_bp.route("/cryptography", methods=["POST"])
@token_required
def crypto_lab():
    data = request.json or {}
    algorithm = data.get("algorithm", "caesar").lower()
    action = data.get("action", "encrypt").lower()
    text = data.get("text", "")
    key = data.get("key", "3")
    
    if not text:
        return jsonify({"error": "No input text provided."}), 400
        
    result = ""
    explanation = ""
    
    # 1. Caesar Cipher
    if algorithm == "caesar":
        try:
            shift = int(key) % 26
            if action == "decrypt":
                shift = -shift
            result = ""
            for char in text:
                if char.isalpha():
                    start = ord('A') if char.isupper() else ord('a')
                    result += chr((ord(char) - start + shift) % 26 + start)
                else:
                    result += char
            explanation = "Caesar cipher shifts letter values down the alphabet index by the specified key."
        except Exception:
            return jsonify({"error": "Caesar key must be an integer."}), 400
            
    # 2. SHA-256 Hash
    elif algorithm == "sha256":
        result = hashlib.sha256(text.encode("utf-8")).hexdigest()
        explanation = "SHA-256 creates a unique 256-bit signature. Hash functions are one-way (non-decryptable)."
        
    # 3. Base64 Encoding (labeled clearly as encoding, not encryption)
    elif algorithm == "base64":
        if action == "encrypt":
            result = base64.b64encode(text.encode("utf-8")).decode("utf-8")
            explanation = "Base64 encodes binary structures into plain characters. Warning: Base64 is NOT encryption!"
        else:
            try:
                result = base64.b64decode(text.encode("utf-8")).decode("utf-8")
                explanation = "Decoded base64 message successfully."
            except Exception:
                return jsonify({"error": "Invalid base64 payload."}), 400
                
    # 4. AES-256 (Simulated educational structure)
    elif algorithm == "aes":
        if action == "encrypt":
            h = hashlib.sha256(key.encode("utf-8")).hexdigest()[:16]
            result = base64.b64encode(f"AES256_CIPHER__{text}__{h}".encode("utf-8")).decode("utf-8")
            explanation = "AES is a symmetric cipher where the same password encrypts and decrypts blocks."
        else:
            try:
                raw = base64.b64decode(text.encode("utf-8")).decode("utf-8")
                if "AES256_CIPHER__" in raw:
                    parts = raw.split("__")
                    result = parts[2]
                    explanation = "Decrypted AES block successfully using symmetric key verification."
                else:
                    result = "Decryption error: Invalid cipher block structure."
            except Exception:
                return jsonify({"error": "AES cipher block invalid."}), 400
                
    # 5. RSA (Simulated asymmetric public/private keys)
    elif algorithm == "rsa":
        if action == "encrypt":
            result = base64.b64encode(f"RSA_PUBLIC_ENCRYPT__{text}".encode("utf-8")).decode("utf-8")
            explanation = "RSA uses a public key to encrypt and a matching private key to decrypt."
        else:
            try:
                raw = base64.b64decode(text.encode("utf-8")).decode("utf-8")
                if "RSA_PUBLIC_ENCRYPT__" in raw:
                    result = raw.replace("RSA_PUBLIC_ENCRYPT__", "")
                    explanation = "Decrypted asymmetric cipher block successfully using private key verification."
                else:
                    result = "Decryption error: Failed asymmetric keys validation."
            except Exception:
                return jsonify({"error": "RSA cipher block invalid."}), 400
                
    return jsonify({
        "result": result,
        "explanation": explanation
    }), 200

@cybersecurity_bp.route("/playground", methods=["POST"])
@token_required
def vulns_playground():
    data = request.json or {}
    lab = data.get("lab", "sqli") # sqli, xss
    payload = data.get("payload", "")
    
    if not payload:
        return jsonify({"output": "Enter a payload trigger to analyze."}), 250
        
    vulnerable_sql = ""
    secure_sql = ""
    output = ""
    is_safe = False
    
    # 1. SQL Injection Simulation
    if lab == "sqli":
        vulnerable_sql = f"SELECT * FROM users WHERE username = '{payload}' AND password = 'password123';"
        secure_sql = "cursor.execute('SELECT * FROM users WHERE username = %s AND password = %s', (username, password))"
        
        # Check if they bypass standard quote matches
        if "'" in payload or "--" in payload or "OR" in payload.upper():
            output = "🔓 Bypass Successful! SQL statement structure altered: query evaluates to TRUE. Logged in as administrator root."
            is_safe = False
        else:
            output = "🔒 Login Failed: Incorrect credentials. Username was matched as a plain string parameter."
            is_safe = True
            
    # 2. XSS Simulation
    elif lab == "xss":
        vulnerable_sql = f"<div>Welcome, {payload}</div>"
        secure_sql = "DOMPurify.sanitize(userInput) or React self-escapes output templates."
        
        if "<script>" in payload.lower() or "onerror=" in payload.lower() or "onload=" in payload.lower():
            output = "⚠️ Alert Script Fired: XSS Payload executed successfully in client DOM browser space!"
            is_safe = False
        else:
            output = "🛡️ Safely Rendered: input parsed as literal text contents. Scripts blocks neutralized."
            is_safe = True
            
    return jsonify({
        "vulnerable_sql": vulnerable_sql,
        "secure_sql": secure_sql,
        "output": output,
        "is_safe": is_safe
    }), 200

@cybersecurity_bp.route("/soc-alerts", methods=["GET"])
@token_required
def get_soc_alerts():
    # Generate mock SOC Analyst threat maps logs
    alerts = [
        {
            "id": 1,
            "severity": "critical",
            "source": "192.168.1.150",
            "destination": "10.0.0.4",
            "signature": "ET SCAN WebShell execution detected",
            "time": "Just Now",
            "status": "active"
        },
        {
            "id": 2,
            "severity": "high",
            "source": "45.85.12.9",
            "destination": "10.0.0.2",
            "signature": "SQL Injection attempt detected inside username input",
            "time": "5 mins ago",
            "status": "investigating"
        },
        {
            "id": 3,
            "severity": "medium",
            "source": "192.168.1.12",
            "destination": "192.168.1.1",
            "signature": "DHCP Lease exhaustion warning",
            "time": "20 mins ago",
            "status": "resolved"
        },
        {
            "id": 4,
            "severity": "low",
            "source": "10.0.0.50",
            "destination": "10.0.0.1",
            "signature": "SSH login failure from student workstation",
            "time": "1 hour ago",
            "status": "resolved"
        }
    ]
    return jsonify(alerts), 200

@cybersecurity_bp.route("/tutor", methods=["POST"])
@token_required
def cyber_ai_tutor():
    data = request.json or {}
    message = data.get("message", "")
    history = data.get("history", [])
    
    if not message:
        return jsonify({"error": "No prompt input provided."}), 400
        
    import traceback
    import logging
    logger = logging.getLogger("cybersecurity")
    
    try:
        ai = get_ai()
        
        # Format user prompt with chat history context
        history_context = ""
        for msg in history:
            role = msg.get("role")
            role_label = "Student" if role == "user" else "Tutor"
            
            # Extract content text (handle parts list or plain string)
            content = msg.get("content", "")
            if not content and "parts" in msg:
                parts = msg["parts"]
                content = parts[0] if parts and isinstance(parts, list) else ""
            
            if content:
                history_context += f"{role_label}: {content}\n"
        
        user_prompt = f"{history_context}Student: {message}"
        
        # Establish specialized cybersecurity system prompt instructions
        system_prompt = (
            "You are an expert Cybersecurity AI Tutor inside StudySphere AI. Your goal is to explain "
            "cybersecurity concepts clearly and educational. You specialize in:\n"
            "- Network Security & Cryptography\n"
            "- Linux Terminal Simulator commands\n"
            "- Security Operations Center (SOC) Alerts & Threat Hunting\n"
            "- Digital Forensics & Web Security (OWASP Top 10 defenses)\n"
            "- Malware analysis, Incident Response, and Ethical Hacking principles\n"
            "- Standard penetration tools: Nmap, Wireshark, Metasploit, Burp Suite, and MITRE ATT&CK framework mappings.\n\n"
            "Follow these rules:\n"
            "1. Never provide exploit instructions or code scripts designed to automate malicious hacking.\n"
            "2. Keep explanations beginner-friendly, pedagogical, and highly structured with bullet points.\n"
            "3. Focus on defensive mitigations, sanitization steps, and secure engineering coding practices.\n"
            "4. If you don't have enough facts to answer accurately, state that clearly."
        )
        
        # Generate answer using existing Gemini call infrastructure
        response_text = ai._call_gemini(
            system_prompt=system_prompt,
            user_prompt=user_prompt
        )
        
        return jsonify({
            "response": response_text
        }), 200
        
    except Exception as e:
        # Step 5: print traceback and log error response body details
        print("--- CYBERSECURITY AI TUTOR EXCEPTION ---")
        print(f"Error Message: {str(e)}")
        print(traceback.format_exc())
        print("----------------------------------------")
        
        logger.error(f"Error in cybersecurity tutor endpoint: {e}")
        logger.error(traceback.format_exc())
        
        return jsonify({
            "error": f"AI Tutor connection failed: {str(e)}",
            "traceback": traceback.format_exc()
        }), 500
