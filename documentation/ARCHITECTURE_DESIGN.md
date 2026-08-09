# System Architecture & Design Document (HLD & LLD)

---

## 1. High-Level Design (HLD)

The StudySphere AI platform is built on a decoupled **Client-Server Architecture**.

```mermaid
graph TD
    subgraph Client Tier [React Frontend TypeScript]
        UI[Tailwind CSS v4 + Lucide Icons]
        Router[React Router DOM]
        Context[Auth & Theme Contexts]
        Query[Axios + React Query]
    end

    subgraph Server Tier [Python Flask API]
        Factory[Flask Factory Initialization]
        AuthMW[JWT Auth Middleware]
        Blueprint[Modular Blueprints]
        AISvc[AI OpenAIService Client]
        PDFSvc[PyPDF Text Extractor]
    end

    subgraph Database Tier [Storage]
        Atlas[(MongoDB Atlas)]
        LocalDB[(Persistent JSON logs/db_store.json)]
    end

    UI --> Router
    Router --> Context
    Context --> Query
    Query -- HTTP REST APIs --> Factory
    Factory --> AuthMW
    AuthMW --> Blueprint
    Blueprint --> AISvc
    Blueprint --> PDFSvc
    Blueprint -- MongoDB Queries --> Atlas
    Blueprint -- Sandbox Writes --> LocalDB
```

---

## 2. Low-Level Design (LLD) & UML Diagrams

### 2.1 Use Case Diagram
Describes user interactions with the system modules.

```mermaid
usecaseDiagram
    actor Student
    actor Admin

    Student --> (Register & Login)
    Student --> (Chat with AI Tutor)
    Student --> (Write Auto-saved Notes)
    Student --> (Upload PDF & Ask Questions)
    Student --> (Take Timed Quizzes)
    Student --> (Practice Flashcards)
    Student --> (Schedule Planner Calendar)
    Student --> (Practice Code Complexity Review)
    Student --> (Build ATS Resumes)
    Student --> (Review Heatmap Streaks)

    Admin --> (Demote/Promote User Roles)
    Admin --> (Inspect Audit Logs)
    Admin --> (Broadcast Announcements)
    Admin --> (Access KPI dashboard)
```

### 2.2 Class Diagram
Represents the structural models and helper utilities.

```mermaid
classDiagram
    class User {
        +string id
        +string name
        +string email
        +string password_hash
        +string role
        +boolean is_verified
        +datetime created_at
        +register()
        +login()
    }
    class Note {
        +string id
        +string user_id
        +string title
        +string content
        +string category
        +string[] tags
        +boolean is_pinned
        +boolean is_favorite
        +save()
        +summarize_ai()
    }
    class PDF {
        +string id
        +string user_id
        +string filename
        +string file_path
        +string extracted_text
        +string summary
        +string[] key_concepts
        +int[] bookmarks
        +extract_text()
        +ask_ai_question()
    }
    class Quiz {
        +string id
        +string user_id
        +string subject
        +string difficulty
        +string type
        +Question[] questions
        +int score
        +int time_taken
        +submit_score()
    }
    class PlannerTask {
        +string id
        +string user_id
        +string title
        +string description
        +string start_date
        +string priority
        +string category
        +boolean is_completed
        +toggle_complete()
    }
    class AIService {
        +client openai
        +chat_tutor(messages)
        +summarize_notes(content, mode)
        +ask_pdf(text, question)
        +generate_quiz(subj, diff)
        +explain_code(code, lang)
    }

    User "1" --> "*" Note : creates
    User "1" --> "*" PDF : uploads
    User "1" --> "*" Quiz : practice
    User "1" --> "*" PlannerTask : schedules
    Note --> AIService : invokes
    PDF --> AIService : invokes
    Quiz --> AIService : invokes
```

### 2.3 Entity Relationship Diagram (ERD)
Details NoSQL database relationships and references.

```mermaid
erDiagram
    users {
        ObjectId id PK
        string email UK
        string password_hash
        string name
        string role
        boolean is_verified
        datetime created_at
    }
    notes {
        ObjectId id PK
        ObjectId user_id FK
        string title
        string content
        string category
        string[] tags
        boolean is_pinned
        boolean is_favorite
    }
    chats {
        ObjectId id PK
        ObjectId user_id FK
        string title
        boolean is_pinned
        array messages
    }
    pdfs {
        ObjectId id PK
        ObjectId user_id FK
        string filename
        string file_path
        string extracted_text
        string summary
        string[] key_concepts
        int[] bookmarks
    }
    quizzes {
        ObjectId id PK
        ObjectId user_id FK
        string subject
        string difficulty
        string type
        array questions
        int score
        int time_taken
    }
    planner {
        ObjectId id PK
        ObjectId user_id FK
        string title
        string start_date
        string priority
        string category
        boolean is_completed
    }

    users ||--o{ notes : creates
    users ||--o{ chats : initiates
    users ||--o{ pdfs : uploads
    users ||--o{ quizzes : takes
    users ||--o{ planner : schedules
```

### 2.4 Sequence Diagram: Timed Quiz Submission & Analytics Update
Tracks data flow when a user finishes a quiz.

```mermaid
sequenceDiagram
    autonumber
    actor Student as Scholar (Client)
    participant API as Flask Server API
    participant DB as MongoDB Atlas
    participant AISvc as AI Tutor Service

    Student->>API: POST /api/quiz/generate (subject, difficulty, type)
    API->>AISvc: invoke generate_quiz()
    AISvc-->>API: returns structured questions JSON
    API->>DB: insert quiz document (score=null)
    API-->>Student: return quiz questions & ID
    
    Note over Student: Scholar takes timed quiz
    
    Student->>API: POST /api/quiz/submit/ID (score, time_taken)
    API->>DB: update quiz document (score, time_taken)
    API->>DB: fetch today's progress entries
    DB-->>API: returns today's stats
    API->>DB: update progress (increment quizzes_taken, update moving accuracy)
    API-->>Student: return 200 OK (correct options & accuracy rate)
```

### 2.5 Activity Diagram: Auto-Save Notes Loop
Tracks actions of the debounced saving loop.

```mermaid
stateDiagram-v2
    [*] --> NoteOpened : User clicks note
    NoteOpened --> EditorIdle : Initial buffers populated
    
    state TypingLoop {
        EditorIdle --> KeyPressed : User types
        KeyPressed --> WaitDebounce : Start 1.2s timer
        WaitDebounce --> KeyPressed : User types again (Reset timer)
        WaitDebounce --> TriggerSave : Timer expires (No typing)
    }

    TriggerSave --> SendRequest : PUT /api/notes/ID
    SendRequest --> DBWrite : Write data to MongoDB
    DBWrite --> SavedState : Show checkmark icon
    SavedState --> EditorIdle
```

---

## 3. Database Schema Definitions (Collections)

*   **`users`**: Root accounts mapping. Includes authentication fields and session tokens.
*   **`notes`**: Custom Markdown content, catalogs, and favorite markers.
*   **`chats`**: Nested object array detailing dialogues.
*   **`pdfs`**: Raw textbook text blocks mapping alongside bookmarked indices.
*   **`quizzes`**: Questions lists matching difficulty configurations and scoring parameters.
*   **`flashcards`**: Learning cards categorizations. Track statuses: `'new' | 'learning' | 'mastered'`.
*   **`planner`**: Calendar schedules.
*   **`progress`**: Day-to-day analytics counts (hours, notes created, quizzes completed).
*   **`notifications`**: Tray alerts matching system notices and study reminders.
*   **`logs`**: Audit trail.
