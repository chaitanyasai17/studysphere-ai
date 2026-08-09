# API Reference Documentation

All endpoints expect JSON payloads in requests, output JSON in responses, and target `http://localhost:5000` as the baseline URL.

---

## 🔐 Authentication Module (`/api/auth`)

### 1. Register Account
*   **Endpoint**: `POST /api/auth/register`
*   **Payload**:
    ```json
    {
      "name": "Alex Johnson",
      "email": "alex@university.edu",
      "password": "securepassword123"
    }
    |
```
*   **Response (201 Created)**:
    ```json
    {
      "message": "Registration successful! Verification token generated.",
      "verification_token": "1719847190.2847",
      "role": "student",
      "user_id": "60c72b2f9b1d8a23d8c1c46b"
    }
    ```

### 2. Login Account
*   **Endpoint**: `POST /api/auth/login`
*   **Payload**:
    ```json
    {
      "email": "alex@university.edu",
      "password": "securepassword123"
    }
    ```
*   **Response (200 OK)**:
    ```json
    {
      "access_token": "eyJhbGciOi...",
      "refresh_token": "eyJhbGciOi...",
      "user": {
        "id": "60c72b2f9b1d8a23d8c1c46b",
        "name": "Alex Johnson",
        "email": "alex@university.edu",
        "role": "student",
        "is_verified": false
      }
    }
    ```

### 3. Refresh Access Token
*   **Endpoint**: `POST /api/auth/refresh`
*   **Payload**:
    ```json
    {
      "refresh_token": "eyJhbGciOi..."
    }
    ```

### 4. Verify Email Token
*   **Endpoint**: `POST /api/auth/verify-email`
*   **Payload**:
    ```json
    {
      "token": "1719847190.2847"
    }
    ```

---

## 📝 Notes Module (`/api/notes`)
*Requires `Authorization: Bearer <access_token>` header.*

*   **GET `/api/notes`**: Retrieve all notes for user, sorted by pins and dates.
*   **GET `/api/notes/<note_id>`**: Retrieve note details by ID.
*   **POST `/api/notes`**: Create a new blank note. Returns Note object.
*   **PUT `/api/notes/<note_id>`**: Update note title, content, tags, category, or flags (`is_pinned`, `is_favorite`).
*   **DELETE `/api/notes/<note_id>`**: Remove note.
*   **POST `/api/notes/<note_id>/ai`**: Triggers AI refactoring.
    *   **Payload**: `{ "action": "summary" | "rewrite" | "bullets" | "revision" }`
    *   **Response (200 OK)**: `{ "result": "AI generated string output..." }`

---

## 💬 AI Tutor Module (`/api/ai`)
*Requires `Authorization: Bearer <access_token>` header.*

*   **GET `/api/ai/chats`**: List chat conversation sessions.
*   **POST `/api/ai/chats`**: Create a new session. Payload: `{ "title": "New Chat Session" }`.
*   **GET `/api/ai/chats/<chat_id>`**: Fetch chat details & message lists.
*   **PUT `/api/ai/chats/<chat_id>`**: Toggle session parameters (`title`, `is_pinned`).
*   **DELETE `/api/ai/chats/<chat_id>`**: Remove session history.
*   **POST `/api/ai/chats/<chat_id>/message`**: Send a message to AI Tutor.
    *   **Payload**: `{ "message": "Why does recursion cause stack overflow?" }`
    *   **Response (200 OK)**:
        ```json
        {
          "user_message": { "role": "user", "content": "..." },
          "assistant_message": { "role": "assistant", "content": "Markdown answer..." },
          "chat_title": "Why does recursion cause..."
        }
        ```

---

## 📚 PDF Module (`/api/pdf`)
*Requires `Authorization: Bearer <access_token>` header.*

*   **POST `/api/pdf/upload`**: Upload multipart PDF. Text parsed via PyPDF. Extracts summary/concepts.
*   **GET `/api/pdf`**: List files metadata.
*   **GET `/api/pdf/<pdf_id>`**: Fetch PDF details including extracted text pages and bookmarks.
*   **DELETE `/api/pdf/<pdf_id>`**: Remove file metadata and clean up disk.
*   **POST `/api/pdf/<pdf_id>/ask`**: Context-based PDF Q&A. Payload: `{ "question": "Explain chapter 3 formula" }`.
*   **POST `/api/pdf/<pdf_id>/bookmark`**: Toggle bookmarks on page. Payload: `{ "page": 4 }`.

---

## ❓ Quiz Module (`/api/quiz`)
*Requires `Authorization: Bearer <access_token>` header.*

*   **POST `/api/quiz/generate`**: Generate practice quiz using AI.
    *   **Payload**: `{ "subject": "Maths", "difficulty": "medium", "count": 5, "type": "mcq" | "tf" }`
    *   **Response (200 OK)**: Quiz object containing questions list.
*   **POST `/api/quiz/submit/<quiz_id>`**: Save quiz score. Payload: `{ "score": 4, "time_taken": 120 }`.
*   **GET `/api/quiz/history`**: List completed quiz grades.
*   **GET `/api/quiz/leaderboard`**: Get top 10 scholar rankings.

---

## 🗂️ Flashcards Module (`/api/flashcards`)
*Requires `Authorization: Bearer <access_token>` header.*

*   **GET `/api/flashcards/decks`**: List flashcard sets.
*   **POST `/api/flashcards/generate`**: Generate card sets. Payload: `{ "category": "OS", "text_input": "Virtual memory, page tables" }`.
*   **DELETE `/api/flashcards/decks/<deck_id>`**: Remove card set.
*   **POST `/api/flashcards/decks/<deck_id>/cards/<card_idx>/bookmark`**: Toggle bookmark on card.
*   **POST `/api/flashcards/decks/<deck_id>/cards/<card_idx>/status`**: Set repetition status. Payload: `{ "status": "learning" | "mastered" }`.

---

## 📅 Planner Module (`/api/planner`)
*Requires `Authorization: Bearer <access_token>` header.*

*   **GET `/api/planner/tasks`**: Retrieve scheduled calendar tasks.
*   **POST `/api/planner/tasks`**: Create task. Payload: `{ "title": "Math exam", "start_date": "YYYY-MM-DD", "priority": "high", "category": "exam" }`.
*   **PUT `/api/planner/tasks/<task_id>`**: Update task completion (`is_completed`) or tags.
*   **DELETE `/api/planner/tasks/<task_id>`**: Remove task.

---

## 💻 Coding Practice Module (`/api/coding`)
*Requires `Authorization: Bearer <access_token>` header.*

*   **POST `/api/coding/review`**: Evaluate algorithm snippet.
    *   **Payload**: `{ "code": "def fn()...", "language": "python" }`
    *   **Response (200 OK)**: `{ "language": "python", "review": "Markdown review feedback" }`

---

## 📄 Resume Module (`/api/resume`)
*Requires `Authorization: Bearer <access_token>` header.*

*   **POST `/api/resume/generate`**: Generate CV objectives/cover letters.
    *   **Payload**: `{ "role": "Engineer", "skills": "Python, React", "projects": "SaaS Platform" }`
    *   **Response (200 OK)**: `{ "role": "Engineer", "advice": "Markdown resume tips..." }`

---

## 📊 Analytics Module (`/api/analytics`)
*Requires `Authorization: Bearer <access_token>` header.*

*   **GET `/api/analytics/summary`**: Fetch study hours, streak days, accuracy percentage, and advisor insights.
*   **GET `/api/analytics/charts`**: Fetch 7-day daily details.
*   **GET `/api/analytics/streak`**: Fetch 30-day GitHub activity heatmap values.
*   **POST `/api/analytics/study-time`**: Logs active minutes studied. Payload: `{ "minutes": 15 }`.

---

## 🛡️ Admin Module (`/api/admin`)
*Requires `Authorization: Bearer <access_token>` header. Restricts to Admin role.*

*   **GET `/api/admin/dashboard`**: Fetch global user counts, uploads counts, and logs sizes.
*   **GET `/api/admin/users`**: List all user accounts (excludes passwords).
*   **PUT `/api/admin/users/<user_id>/role`**: Update user role. Payload: `{ "role": "student" | "admin" }`.
*   **GET `/api/admin/logs`**: Fetch scrolling security audit logs.
*   **POST `/api/admin/announcement`**: Broadcast notifications to all users. Payload: `{ "title": "System Update", "message": "Maintenance tonight" }`.

---

## 🔔 Notifications Module (`/api/notifications`)
*Requires `Authorization: Bearer <access_token>` header.*

*   **GET `/api/notifications`**: List user notifications and alerts.
*   **PUT `/api/notifications/<notif_id>/read`**: Mark specific alert as read.
*   **PUT `/api/notifications/read-all`**: Clear all unread notifications.
*   **DELETE `/api/notifications/<notif_id>`**: Remove notification.

---

## 🔍 Search Module (`/api/search`)
*Requires `Authorization: Bearer <access_token>` header.*

*   **GET `/api/search?q=<query>`**: Global Case-insensitive command palette search. Returns matches categorized by notes, pdfs, chats, and tasks.
