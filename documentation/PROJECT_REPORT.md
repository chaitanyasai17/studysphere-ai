# Final Project Report & Presentation Guide

---

## 1. Executive Project Report

### 1.1 Executive Summary
**StudySphere AI** is a modern intelligent AI Study Assistant built to consolidate student productivity tools. By integrating multiple learning modules (AI Tutor, Markdown notes, PDF parsers, timed quizzes, flashcards, planners, code review, and heatmaps) under a single Vercel/Render architecture, the platform removes study fragmentation and drives knowledge retention through active recall and spaced repetition.

### 1.2 Placement & Interview Alignment
This project is engineered to serve as a portfolio centerpiece for placement interviews:
*   **Decoupled Architecture**: Demonstrates full separation of concerns between a React TypeScript frontend and a Flask Python backend.
*   **Security Implementation**: Implements password salting (bcrypt) and JWT double-token cycles (Access & Refresh tokens).
*   **Performance Optimizations**: Showcases debounced auto-saving note features, code splitting, lazy layouts, and optimized database collection lookups.
*   **Fault Tolerance (MongoDB Fallback)**: Demonstrates system resilience by gracefully falling back to a local JSON-based file storage structure if Atlas encounters connectivity errors.

---

## 2. PowerPoint Presentation Slide Outline

Use this 15-slide template to draft your PowerPoint deck for evaluation:

1.  **Slide 1: Title & Team**
    *   *Title*: StudySphere AI – Intelligent AI-Powered Study Assistant.
    *   *Sub-header*: Learn Smarter. Study Faster. Achieve More.
2.  **Slide 2: Problem Statement**
    *   Academic tools are highly fragmented (Notion for notes, Quizlet for cards, ChatGPT for chat, calendar for plans).
    *   Causes student attention drift and limits structured tracking.
3.  **Slide 3: Proposed Solution**
    *   A unified Slack/Notion-like platform merging AI dialogue, PDF parsing, timed testing, and calendar tracking.
4.  **Slide 4: System Architecture**
    *   High-level review: React client -> Axios -> Flask API server -> MongoDB Atlas.
5.  **Slide 5: User & Session Security**
    *   Salting password hashes, route guards, role-based controls (students vs admins), and JWT refresh token intervals.
6.  **Slide 6: AI Tutor Module**
    *   Multi-session conversational tutor, suggested query shortcuts, markdown highlighter, and Markdown chat exports.
7.  **Slide 7: Notes & Auto-Save Editor**
    *   Markdown editing split-screen preview, category folders, and 1.2s debounced auto-saves.
8.  **Slide 8: Docu-Sense PDF Analyst**
    *   Uploading textbook PDFs, extracting pages text, and running contextual chatbot Q&A.
9.  **Slide 9: Quiz & Flashcards Module**
    *   Timed MCQ / TF practice generator, correct option explanations, global rankings, and 3D flip card reviews.
10. **Slide 10: Code Review & Resume Helper**
    *   Big-O complexity calculations, refactored boilerplates, ATS objectives, and cover letters.
11. **Slide 11: Heatmap Analytics Dashboard**
    *   GitHub-styled streak tracking grid, weekly study hours charts, and advisor recommendations.
12. **Slide 12: Admin Dashboard**
    *   Users role promote/demotes, scrolling audit trails, and global announcements broadcasts.
13. **Slide 13: Testing & Quality Metrics**
    *   Type safety checks (TypeScript), lint configurations, API validation codes, and sandbox fallback test setups.
14. **Slide 14: Future Scope**
    *   Group study rooms, offline sync indices, and integration with institutional LMS systems.
15. **Slide 15: Conclusion & References**
    *   Summary of deliverables and acknowledgments.

---

## 3. Testing Documentation

We performed rigorous manual and automated validation tests across core features:

| Test ID | Module | Target Action | Input | Expected Output | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-1.1** | Auth | Register User | Email/Password inputs | Created (201) + Verification token returned | Passed |
| **TC-1.2** | Auth | Verify JWT login | Invalid header token | Forbidden (401) request block | Passed |
| **TC-2.1** | Notes | Auto-Save logic | Typing in Markdown block | PUT request fired after 1.2 seconds of idle | Passed |
| **TC-3.1** | PDF | Parse Textbook | Multi-page PDF file | PyPDF extracts text, summary, and concepts | Passed |
| **TC-4.1** | Quiz | Score Submit | Correct: 4, Total: 5 | Acc calculated (80%), logs today's study hours | Passed |
| **TC-5.1** | Admin | Demote Admin | Self user ID update | Blocked (400): Prevents demoting own account | Passed |
| **TC-6.1** | DB | Database Offline | Disable MONGODB_URI | Auto-fallbacks to persistent local JSON store | Passed |

---

## 4. Deployment Guide

### 4.1 Backend (Render Deployment)
1.  Sign in to **Render** (`render.com`) and choose **New Web Service**.
2.  Connect your GitHub repository.
3.  Configure parameters:
    *   *Environment*: `Python`
    *   *Build Command*: `pip install -r requirements.txt`
    *   *Start Command*: `gunicorn run:app`
4.  Configure Environment Variables in Render settings:
    *   `FLASK_ENV` = `production`
    *   `JWT_SECRET` = `production-jwt-key`
    *   `MONGODB_URI` = `mongodb+srv://...` (Atlas string)
    *   `OPENAI_API_KEY` = `sk-proj-...`

### 4.2 Frontend (Vercel Deployment)
1.  Sign in to **Vercel** (`vercel.com`) and click **Add New Project**.
2.  Select your repository and target the `frontend` directory.
3.  Configure Build settings:
    *   *Framework Preset*: `Vite`
    *   *Build Command*: `npm run build`
    *   *Output Directory*: `dist`
4.  Configure Environment Variables:
    *   `VITE_API_URL` = `https://your-flask-render-url.onrender.com`

---

## 5. Future Scope
*   **LMS Integrations**: Support Canvas/Moodle LTI integrations to pull course textbook files and schedules.
*   **Peer Collaboration**: Group virtual study sessions where users can share notes in real-time.
*   **Local LLM Integration**: Support running local offline LLMs (via Ollama) to allow completely free AI tutor operations without internet connectivity.

---

## 6. References
1.  *Flask API Documentation*: https://flask.palletsprojects.com/
2.  *React Query Hooks*: https://tanstack.com/query/latest
3.  *Tailwind CSS v4 Configuration*: https://tailwindcss.com/docs/v4-beta
4.  *OpenAI SDK Reference*: https://github.com/openai/openai-python
5.  *PyPDF Engine Documentation*: https://pypdf.readthedocs.io/en/stable/
