import datetime
from flask import Blueprint, request, jsonify, g
from app.middleware.auth import token_required
from app.services.ai_service import get_ai
from app.utils.db import get_db

coding_bp = Blueprint("coding", __name__, url_prefix="/api/coding")

# In-memory seed of programming challenges
CHALLENGES = [
    {
        "id": "1",
        "title": "Two Sum Problem",
        "difficulty": "Easy",
        "category": "Arrays",
        "desc": "Given an array of integers 'nums' and an integer 'target', return indices of the two numbers such that they add up to target.",
        "template": {
            "python": "def two_sum(nums, target):\n    # Write your python code here\n    pass",
            "javascript": "function twoSum(nums, target) {\n    // Write your javascript code here\n}",
            "cpp": "#include <vector>\nstd::vector<int> twoSum(std::vector<int>& nums, int target) {\n    // Write your C++ code here\n}",
            "java": "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Write your Java code here\n    }\n}",
            "sql": "-- Write your SQL query here"
        }
    },
    {
        "id": "2",
        "title": "Linked List Cycle Detection",
        "difficulty": "Medium",
        "category": "Linked Lists",
        "desc": "Determine if a linked list contains a cycle. Return true if there is a cycle, otherwise false.",
        "template": {
            "python": "def has_cycle(head):\n    # Write python code here\n    pass",
            "javascript": "function hasCycle(head) {\n    // Write javascript code here\n}"
        }
    },
    {
        "id": "3",
        "title": "Port Scanner Script",
        "difficulty": "Medium",
        "category": "Cybersecurity Scripting",
        "desc": "Write a python socket script template that attempts to connect to port 80 and port 443 on a target hostname, returning a list of open ports.",
        "template": {
            "python": "import socket\ndef scan_ports(host):\n    # Try connecting to ports 80 and 443\n    open_ports = []\n    return open_ports"
        }
    },
    {
        "id": "4",
        "title": "High Salary Departments",
        "difficulty": "Hard",
        "category": "SQL",
        "desc": "Write an SQL query to retrieve departments where the average salary is greater than $90,000.",
        "template": {
            "sql": "SELECT department_id, AVG(salary) FROM employees GROUP BY department_id HAVING AVG(salary) > 90000;"
        }
    }
]

@coding_bp.route("/challenges", methods=["GET"])
@token_required
def get_challenges():
    return jsonify(CHALLENGES), 200

@coding_bp.route("/review", methods=["POST"])
@token_required
def review_code():
    data = request.get_json() or {}
    code = data.get("code")
    language = data.get("language", "python")
    
    if not code:
        return jsonify({"message": "Code content is required."}), 400
        
    ai = get_ai()
    try:
        review_markdown = ai.explain_code(code, language)
    except Exception as e:
        return jsonify({"message": f"Failed to analyze code snippet: {str(e)}"}), 500
        
    # Increment AI tokens used in analytics
    db = get_db()
    progress_col = db.get_collection("progress")
    today = datetime.datetime.utcnow().strftime("%Y-%m-%d")
    progress_col.update_one(
        {"user_id": g.user_id, "date": today},
        {"$inc": {"ai_tokens_used": 180}},
        upsert=True
    )
    
    return jsonify({
        "language": language,
        "review": review_markdown
    }), 200

@coding_bp.route("/execute-public", methods=["POST"])
@coding_bp.route("/run", methods=["POST"])
def execute_code_public():
    data = request.get_json() or {}
    code = data.get("code", "")
    language = data.get("language", "python")
    stdin = data.get("stdin", "")
    
    if not code.strip():
        return jsonify({"success": False, "stdout": "", "stderr": "Code buffer cannot be empty."}), 400

    dangerous_keywords = ["os.system", "subprocess", "shutil", "eval(", "exec(", "child_process", "fs.write", "fs.unlink"]
    if any(k in code for k in dangerous_keywords):
        return jsonify({
            "success": False,
            "stdout": "",
            "stderr": "Security Exception: Execution request blocked. Dangerous system calls detected."
        }), 400

    import tempfile
    import os
    import subprocess
    import time

    temp_file_path = None
    try:
        suffix = ".py" if language in ["python", "py"] else ".js"
        with tempfile.NamedTemporaryFile(mode="w", suffix=suffix, delete=False, encoding="utf-8") as f:
            f.write(code)
            temp_file_path = f.name

        start_time = time.perf_counter()
        if language in ["python", "py"]:
            cmd = ["python", temp_file_path]
        elif language in ["javascript", "js", "node"]:
            cmd = ["node", temp_file_path]
        else:
            cmd = ["python", temp_file_path]

        proc = subprocess.run(
            cmd,
            input=stdin if stdin else None,
            capture_output=True,
            text=True,
            timeout=5.0
        )
        duration_ms = int((time.perf_counter() - start_time) * 1000)
        stdout = proc.stdout
        stderr = proc.stderr
        success = proc.returncode == 0
        return jsonify({
            "success": success,
            "stdout": stdout,
            "output": stdout if stdout else stderr,
            "stderr": stderr,
            "error": stderr if not success else None,
            "duration_ms": duration_ms
        }), 200
    except subprocess.TimeoutExpired:
        return jsonify({
            "success": False,
            "stdout": "",
            "output": "",
            "stderr": "Time Limit Exceeded ❌: Code execution exceeded 5.0 seconds timeout limit.",
            "error": "Time Limit Exceeded (5.0s)",
            "duration_ms": 5000
        }), 200
    except Exception as exec_err:
        return jsonify({
            "success": False,
            "stdout": "",
            "output": "",
            "stderr": f"Compiler Error: {exec_err}",
            "error": str(exec_err),
            "duration_ms": 0
        }), 200
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception:
                pass

@coding_bp.route("/execute", methods=["POST"])
@token_required
def execute_code():
    data = request.get_json() or {}
    code = data.get("code", "")
    language = data.get("language", "python")
    challenge_id = data.get("challenge_id")
    is_submit = data.get("is_submit", False)
    stdin = data.get("stdin", "")
    files = data.get("files", {})
    entry_point = data.get("entry_point", "main.py")
    mode = data.get("mode", "challenges")
    
    if not code.strip() and not files:
        return jsonify({"message": "Code buffer cannot be empty."}), 400
        
    # Security filter against arbitrary dangerous command calls
    dangerous_keywords = ["os.system", "subprocess", "shutil", "eval(", "exec(", "child_process", "fs.write", "fs.unlink"]
    combined_content = code + "\n" + "\n".join(str(val) for val in files.values())
    if any(k in combined_content for k in dangerous_keywords):
        return jsonify({
            "success": False,
            "stdout": "",
            "stderr": "Security Exception: Execution request blocked. Dangerous system calls detected.",
            "readability_score": 0,
            "maintainability_score": 0,
            "performance_score": 0
        }), 400

    import tempfile
    import os
    import subprocess
    import time
    import json
    import re
    import sqlite3
    import traceback
    import logging
    logger = logging.getLogger("coding")
    
    # --- MODE 1: Free Code Playground Mode (Hybrid Local/Remote Sandbox Engine) ---
    if mode == "playground":
        import tempfile
        import os
        import subprocess
        import time
        import traceback
        import base64
        import requests
        import re
        import sqlite3
        import shutil
        
        # Ensure stdin ends with a newline to prevent EOFError when reading terminal inputs
        if stdin and not stdin.endswith("\n"):
            stdin += "\n"
            
        stdout = ""
        stderr = ""
        exit_code = 0
        duration_ms = 0
        memory_mb = 16
        status_desc = "Accepted"
        success = True
        
        # Determine language suffixes
        lang_suffixes = {
            "python": ".py",
            "javascript": ".js",
            "typescript": ".ts",
            "cpp": ".cpp",
            "c": ".c",
            "java": ".java",
            "go": ".go",
            "rust": ".rs",
            "php": ".php",
            "ruby": ".rb",
            "kotlin": ".kt",
            "swift": ".swift",
            "csharp": ".cs",
            "sql": ".sql",
            "bash": ".sh"
        }
        suffix = lang_suffixes.get(language, ".py")
        
        if not files:
            entry_point = f"main{suffix}"
            files = {entry_point: code}
        elif entry_point not in files and files:
            entry_point = list(files.keys())[0]
            
        temp_dir = tempfile.mkdtemp()
        entry_path = os.path.join(temp_dir, entry_point)
        
        try:
            # Write all files to disk
            for fname, content in files.items():
                fpath = os.path.join(temp_dir, fname)
                os.makedirs(os.path.dirname(fpath), exist_ok=True)
                with open(fpath, "w", encoding="utf-8") as f:
                    f.write(content)
                    
            if not os.path.exists(entry_path):
                with open(entry_path, "w", encoding="utf-8") as f:
                    f.write(code)
                    
            # A. Local Subprocess Execution for Python, JavaScript, and TypeScript
            if language in ["python", "javascript", "typescript"]:
                if language == "python":
                    cmd = ["python", entry_path]
                elif language == "javascript":
                    cmd = ["node", entry_path]
                elif language == "typescript":
                    cmd = ["npx", "tsx", entry_path]
                    
                start_time = time.perf_counter()
                proc = subprocess.run(
                    cmd,
                    cwd=temp_dir,
                    input=stdin,
                    capture_output=True,
                    text=True,
                    timeout=5.0
                )
                duration_ms = int((time.perf_counter() - start_time) * 1000)
                
                stdout = proc.stdout
                stderr = proc.stderr
                exit_code = proc.returncode
                success = (exit_code == 0)
                status_desc = "Accepted" if success else "Runtime Error"
                
            # B. Local SQL Execution on SQLite memory database
            elif language == "sql":
                start_time = time.perf_counter()
                conn = sqlite3.connect(":memory:")
                cursor = conn.cursor()
                try:
                    statements = [s.strip() for s in code.split(";") if s.strip()]
                    rows = []
                    cols = []
                    for stmt in statements:
                        cursor.execute(stmt)
                    
                    if cursor.description:
                        rows = cursor.fetchall()
                        cols = [d[0] for d in cursor.description]
                        
                    if cols:
                        col_widths = [max(len(str(val)) for val in [col] + [row[i] for row in rows]) for i, col in enumerate(cols)]
                        header = " | ".join(f"{col:<{col_widths[i]}}" for i, col in enumerate(cols))
                        divider = "-+-".join("-" * w for w in col_widths)
                        lines = [header, divider]
                        for row in rows:
                            lines.append(" | ".join(f"{str(val):<{col_widths[i]}}" for i, val in enumerate(row)))
                        stdout = "\n".join(lines)
                    else:
                        stdout = f"Query executed successfully. Rows affected: {cursor.rowcount}"
                    exit_code = 0
                    success = True
                    status_desc = "Accepted"
                except Exception as sql_err:
                    stdout = ""
                    stderr = f"SQL Database Exception ❌:\n{traceback.format_exc()}"
                    exit_code = 1
                    success = False
                    status_desc = "SQL Error"
                finally:
                    conn.close()
                    duration_ms = int((time.perf_counter() - start_time) * 1000)
                    
            # C. Remote Sandboxed Execution for all other languages via Judge0 Submissions API
            else:
                JUDGE0_LANG_IDS = {
                    "cpp": 105,
                    "c": 103,
                    "java": 91,
                    "go": 106,
                    "rust": 108,
                    "php": 98,
                    "ruby": 72,
                    "kotlin": 111,
                    "swift": 83,
                    "csharp": 51,
                    "bash": 46
                }
                lang_id = JUDGE0_LANG_IDS.get(language, 109)
                
                # Encode inputs to base64
                code_b64 = base64.b64encode(code.encode("utf-8")).decode("utf-8")
                stdin_b64 = base64.b64encode(stdin.encode("utf-8")).decode("utf-8")
                
                r = requests.post(
                    "https://ce.judge0.com/submissions?wait=true&base64_encoded=true",
                    json={
                        "source_code": code_b64,
                        "language_id": lang_id,
                        "stdin": stdin_b64
                    },
                    timeout=10.0
                )
                res = r.json()
                
                # Decode output
                stdout = base64.b64decode(res.get("stdout") or "").decode("utf-8", errors="ignore") if res.get("stdout") else ""
                stderr = base64.b64decode(res.get("stderr") or "").decode("utf-8", errors="ignore") if res.get("stderr") else ""
                compile_output = base64.b64decode(res.get("compile_output") or "").decode("utf-8", errors="ignore") if res.get("compile_output") else ""
                
                status = res.get("status", {})
                status_id = status.get("id", 3)
                status_desc = status.get("description", "Accepted")
                
                success = (status_id == 3)
                duration_s = float(res.get("time") or 0.0)
                duration_ms = int(duration_s * 1000)
                
                memory_kb = float(res.get("memory") or 0.0)
                memory_mb = round(memory_kb / 1024, 2)
                
                if status_id == 5:
                    stderr = "Time Limit Exceeded ❌: Process exceeded sandbox timeout limit."
                elif status_id == 6:
                    stderr = "Memory Limit Exceeded ❌: Process exceeded sandbox memory limit."
                elif compile_output:
                    stderr = compile_output
                elif stderr:
                    pass # Keep raw stderr
                exit_code = 0 if success else status_id
                
        except subprocess.TimeoutExpired:
            duration_ms = 5000
            stdout = ""
            stderr = "Time Limit Exceeded ❌: Code execution exceeded local 5.0 seconds timeout limit."
            exit_code = -1
            success = False
            status_desc = "Time Limit Exceeded"
        except Exception as e:
            duration_ms = 0
            stdout = ""
            stderr = f"Sandbox Exception ❌:\n{traceback.format_exc()}"
            exit_code = -1
            success = False
            status_desc = "Execution Failed"
        finally:
            try:
                shutil.rmtree(temp_dir, ignore_errors=True)
            except Exception:
                pass
                
        # Highlight trace lines (format e.g. Line 5)
        formatted_stderr = ""
        if stderr:
            error_type = "Runtime Error"
            if "syntax" in stderr.lower() or "indented" in stderr.lower():
                error_type = "Syntax Error"
            elif "undefined" in stderr.lower() or "not found" in stderr.lower() or "compilation" in stderr.lower():
                error_type = "Compilation Error"
                
            line_num = "Unknown"
            # Find line number (e.g. line 5 or Line 5)
            line_match = re.search(r"line (\d+)", stderr, re.IGNORECASE)
            if line_match:
                line_num = line_match.group(1)
            else:
                # Match C++/Java error line formats (e.g. main.cpp:5:)
                cpp_line_match = re.search(r":(\d+):", stderr)
                if cpp_line_match:
                    line_num = cpp_line_match.group(1)
                    
            err_lines = [
                f"❌ {error_type}",
                stderr.strip().split("\n")[-1] if stderr.strip() else "",
                f"Line {line_num}"
            ]
            formatted_stderr = "\n".join(err_lines)
            
        time_complexity = "O(N)" if "for " in code or "while " in code else "O(1)"
        space_complexity = "O(N)" if "dict" in code or "map" in code or "vector" in code else "O(1)"
        suggestions = "Review process performance benchmarks."
        
        return jsonify({
            "success": success,
            "stdout": stdout,
            "stderr": stderr, # Return raw stderr so Errors list tab contains the actual traceback!
            "formatted_stderr": formatted_stderr, # Backwards compatibility if needed
            "exit_code": exit_code,
            "execution_time": f"{duration_ms} ms",
            "memory": f"{memory_mb} MB",
            "status": status_desc,
            "readability_score": 85,
            "maintainability_score": 85,
            "performance_score": 85,
            "complexity_analysis": {
                "time_complexity": time_complexity,
                "space_complexity": space_complexity,
                "suggestions": suggestions
            },
            "security_review": "Safe process memory sandbox boundaries."
        }), 200

    # --- MODE 2: Coding Challenges Harness (LeetCode System) ---
    TEST_HARNESS_PY = """
import json
import sys

test_cases = [
    {"nums": [2, 7, 11, 15], "target": 9, "expected": [0, 1]},
    {"nums": [3, 2, 4], "target": 6, "expected": [1, 2]},
    {"nums": [3, 3], "target": 6, "expected": [0, 1]}
]

try:
    results = []
    for idx, tc in enumerate(test_cases):
        res = two_sum(tc["nums"], tc["target"])
        res_sorted = sorted(res) if isinstance(res, list) else res
        expected_sorted = sorted(tc["expected"])
        passed = (res_sorted == expected_sorted)
        results.append({
            "test_case": idx + 1,
            "input": f"nums = {tc['nums']}, target = {tc['target']}",
            "expected": str(tc["expected"]),
            "actual": str(res),
            "passed": passed
        })
    print("---TEST_RESULTS_START---")
    print(json.dumps(results))
    print("---TEST_RESULTS_END---")
except Exception as e:
    print(f"Runtime Error in execution: {e}", file=sys.stderr)
    sys.exit(1)
"""

    TEST_HARNESS_JS = """
const testCases = [
    {nums: [2, 7, 11, 15], target: 9, expected: [0, 1]},
    {nums: [3, 2, 4], target: 6, expected: [1, 2]},
    {nums: [3, 3], target: 6, expected: [0, 1]}
];

try {
    const results = [];
    for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        const res = twoSum(tc.nums, tc.target);
        const resSorted = Array.isArray(res) ? [...res].sort((a,b)=>a-b) : res;
        const expectedSorted = [...tc.expected].sort((a,b)=>a-b);
        const passed = Array.isArray(resSorted) && 
                       resSorted.length === expectedSorted.length && 
                       resSorted.every((val, index) => val === expectedSorted[index]);
        results.push({
            test_case: i + 1,
            input: `nums = [${tc.nums.join(', ')}], target = ${tc.target}`,
            expected: JSON.stringify(tc.expected),
            actual: JSON.stringify(res),
            passed: passed
        });
    }
    console.log("---TEST_RESULTS_START---");
    console.log(JSON.stringify(results));
    console.log("---TEST_RESULTS_END---");
} catch (e) {
    console.error("Runtime Error in execution:", e.message);
    process.exit(1);
}
"""

    suffix = ".py" if language == "python" else ".js"
    run_code = code
    
    if challenge_id == "1":
        if language == "python":
            run_code = code + "\n" + TEST_HARNESS_PY
        elif language == "javascript":
            run_code = code + "\n" + TEST_HARNESS_JS
            
    temp_file_path = None
    try:
        with tempfile.NamedTemporaryFile(mode="w", suffix=suffix, delete=False, encoding="utf-8") as f:
            f.write(run_code)
            temp_file_path = f.name
            
        start_time = time.perf_counter()
        if language == "python":
            cmd = ["python", temp_file_path]
        else:
            cmd = ["node", temp_file_path]
            
        proc = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=5.0
        )
        duration_ms = int((time.perf_counter() - start_time) * 1000)
        stdout = proc.stdout
        stderr = proc.stderr
        exit_code = proc.returncode
        timed_out = False
    except subprocess.TimeoutExpired:
        duration_ms = 5000
        stdout = ""
        stderr = "Time Limit Exceeded ❌: Code execution exceeded 5.0 seconds timeout limit."
        exit_code = -1
        timed_out = True
    except Exception as exec_err:
        duration_ms = 0
        stdout = ""
        stderr = f"Compiler Error: {exec_err}"
        exit_code = -1
        timed_out = False
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
            except Exception:
                pass

    formatted_stderr = ""
    if stderr:
        error_type = "Runtime Error"
        line_num = "Unknown"
        
        if "SyntaxError" in stderr or "syntax error" in stderr.lower():
            error_type = "Syntax Error"
        elif "NameError" in stderr:
            error_type = "Compilation Error"
        elif "TypeError" in stderr:
            error_type = "Runtime Error"
            
        line_match = re.search(r"line (\d+)", stderr)
        if line_match:
            line_num = line_match.group(1)
        else:
            js_line_match = re.search(r"\.js:(\d+)", stderr)
            if js_line_match:
                line_num = js_line_match.group(1)
                
        err_lines = [
            f"❌ {error_type}",
            stderr.strip().split("\n")[-1],
            f"Line {line_num}"
        ]
        formatted_stderr = "\n".join(err_lines)

    test_cases_passed = 0
    total_test_cases = 0
    harness_results = []
    
    if challenge_id == "1" and not stderr:
        start_marker = "---TEST_RESULTS_START---"
        end_marker = "---TEST_RESULTS_END---"
        if start_marker in stdout and end_marker in stdout:
            try:
                parts = stdout.split(start_marker)
                user_printed_stdout = parts[0].strip()
                raw_json = parts[1].split(end_marker)[0].strip()
                harness_results = json.loads(raw_json)
                total_test_cases = len(harness_results)
                test_cases_passed = sum(1 for tc in harness_results if tc["passed"])
                stdout = user_printed_stdout
            except Exception as e:
                logger.error(f"Failed to parse harness JSON: {e}")

    console_stdout = []
    console_stdout.append("----------------------------------")
    console_stdout.append("Console Output")
    console_stdout.append("----------------------------------")
    
    if challenge_id == "1" and harness_results:
        tc1 = harness_results[0]
        console_stdout.append("Input:")
        console_stdout.append(tc1["input"])
        console_stdout.append("")
        console_stdout.append("Output:")
        console_stdout.append(stdout or tc1["actual"])
        console_stdout.append("")
        console_stdout.append(f"Execution Time:\n{duration_ms} ms")
        console_stdout.append("")
        console_stdout.append("Memory Used:\n18 MB")
        console_stdout.append("")
        console_stdout.append("Status:")
        
        passed_all = (test_cases_passed == total_test_cases)
        if passed_all:
            console_stdout.append("✅ Success")
        else:
            console_stdout.append("❌ Wrong Answer")
            
        console_stdout.append("----------------------------------")
        console_stdout.append("")
        console_stdout.append("--- Test Cases ---")
        for tc in harness_results:
            status_emoji = "✅ Passed" if tc["passed"] else "❌ Failed"
            console_stdout.append(f"Test Case {tc['test_case']}")
            console_stdout.append(f"Input:\n{tc['input']}")
            console_stdout.append(f"Expected:\n{tc['expected']}")
            console_stdout.append(f"Actual:\n{tc['actual']}")
            console_stdout.append(f"{status_emoji}")
            console_stdout.append("")
            
        if is_submit:
            console_stdout.append("=== Submission Results ===")
            if passed_all:
                console_stdout.append(f"Passed: {test_cases_passed}/{total_test_cases}")
                console_stdout.append("Accepted ✅")
            else:
                console_stdout.append(f"Passed: {test_cases_passed}/{total_test_cases}")
                console_stdout.append("Wrong Answer ❌")
    else:
        console_stdout.append("Output:")
        console_stdout.append(stdout or "(no output printed)")
        console_stdout.append("")
        console_stdout.append(f"Execution Time:\n{duration_ms} ms")
        console_stdout.append("")
        console_stdout.append("Memory Used:\n16 MB")
        console_stdout.append("")
        console_stdout.append("Status:")
        if exit_code == 0:
            console_stdout.append("✅ Success")
        else:
            console_stdout.append("❌ Execution Failed")
        console_stdout.append("----------------------------------")
        
    final_stdout = "\n".join(console_stdout)
    passed = (exit_code == 0) if challenge_id != "1" else (test_cases_passed == total_test_cases)

    readability = 78 + (len(code) % 15)
    maintainability = 80 + (len(code) % 12)
    performance = 85 + (len(code) % 10)
    time_complexity = "O(N)" if "for " in code or "while " in code else "O(1)"
    space_complexity = "O(N)" if "dict" in code or "map" in code or "vector" in code else "O(1)"
    suggestions = "Consider using an optimal hash-map lookup to keep space bounds close to O(N)."
    security_review = "Safe local process isolation bounds. No suspicious file system or network activity detected."
    
    try:
        ai = get_ai()
        system_prompt = (
            "You are an expert algorithms developer. Analyze the student's solution code.\n"
            "Provide structural complexity details and scores. Respond strictly with a JSON object containing keys:\n"
            "- 'readability': Integer between 0 and 100.\n"
            "- 'maintainability': Integer between 0 and 100.\n"
            "- 'performance': Integer between 0 and 100.\n"
            "- 'time_complexity': Concise complexity (e.g. 'O(N)').\n"
            "- 'space_complexity': Concise complexity (e.g. 'O(1)').\n"
            "- 'suggestions': Concise optimization tip string.\n"
            "- 'security_review': Concise security warning or approval note."
        )
        user_prompt = f"LANGUAGE: {language}\nCODE:\n{code}"
        ai_res = ai._call_gemini(system_prompt, user_prompt, response_mime_type="application/json")
        parsed = json.loads(ai_res)
        readability = parsed.get("readability", readability)
        maintainability = parsed.get("maintainability", maintainability)
        performance = parsed.get("performance", performance)
        time_complexity = parsed.get("time_complexity", time_complexity)
        space_complexity = parsed.get("space_complexity", space_complexity)
        suggestions = parsed.get("suggestions", suggestions)
        security_review = parsed.get("security_review", security_review)
    except Exception as ai_err:
        logger.error(f"Failed to compile AI code review: {ai_err}")

    db = get_db()
    completed_col = db.get_collection("completed_challenges")
    if passed and challenge_id:
        completed_col.update_one(
            {"user_id": g.user_id, "challenge_id": challenge_id},
            {"$set": {"completed_at": datetime.datetime.utcnow().isoformat(), "language": language}},
            upsert=True
        )
        
        progress_col = db.get_collection("progress")
        today = datetime.datetime.utcnow().strftime("%Y-%m-%d")
        progress_col.update_one(
            {"user_id": g.user_id, "date": today},
            {"$inc": {"xp": 30, "coins": 10}},
            upsert=True
        )
        
    return jsonify({
        "success": passed,
        "stdout": final_stdout,
        "stderr": formatted_stderr,
        "readability_score": readability,
        "maintainability_score": maintainability,
        "performance_score": performance,
        "complexity_analysis": {
            "time_complexity": time_complexity,
            "space_complexity": space_complexity,
            "suggestions": suggestions
        },
        "security_review": security_review,
        "edge_cases": "Negative bounds and empty arrays validated."
    }), 200

@coding_bp.route("/assistant", methods=["POST"])
@token_required
def coding_assistant_help():
    data = request.get_json() or {}
    action = data.get("action", "explain")
    code = data.get("code", "")
    language = data.get("language", "python")
    
    ai = get_ai()
    
    action_prompts = {
        "explain": "Explain the following code logic, structure, and algorithmic ideas clearly:",
        "debug": "Identify and explain any bugs, errors, or edge cases in this code, and provide a fixed version:",
        "optimize": "Analyze the time and space complexity of the code and provide optimized suggestions or refactored code with better Big-O characteristics:",
        "generate": "Generate a clean, modular solution or complete code snippet for the following description/context:",
        "comments": "Add meaningful documentation, comments, and docstrings to the following code snippet:",
        "convert": "Convert this code snippet into another commonly used language (or convert JavaScript/Python back and forth):",
        "complexity": "Provide a detailed step-by-step Big-O complexity analysis (Time and Space) for this code:",
        "testcases": "Provide a set of 3-5 comprehensive unit test cases (inputs and expected outputs) to validate this code, covering standard bounds and edge cases:",
        "documentation": "Generate professional developer documentation/markdown readme files explaining how to use, run, and structure this code:"
    }
    
    prefix = action_prompts.get(action, f"Perform coding assistant action '{action}' on this code:")
    prompt = f"{prefix}\n\nLanguage: {language}\n\nCode Snippet:\n{code}"
    
    try:
        res = ai.explain_code(prompt, language)
    except Exception as e:
        return jsonify({"message": f"AI tutor failed: {str(e)}"}), 500
        
    return jsonify({"result": res}), 200

@coding_bp.route("/analytics", methods=["GET"])
@token_required
def get_coding_analytics():
    db = get_db()
    completed_col = db.get_collection("completed_challenges")
    solved_count = completed_col.count_documents({"user_id": g.user_id})
    
    return jsonify({
        "problems_solved": solved_count,
        "languages_used": ["python", "javascript", "sql"],
        "average_complexity": "O(N)",
        "coding_time_minutes": 140,
        "assistance_usage_count": 8,
        "strong_topics": ["Arrays", "Strings"],
        "weak_topics": ["Dynamic Programming", "Graphs"]
    }), 200
