# StudySphere AI – Intelligent AI-Powered Study Assistant

> **Learn Smarter. Study Faster. Achieve More.**

StudySphere AI is a premium, production-ready AI-Powered Study Assistant built from scratch as a commercial-grade SaaS application. Designed for college scholars and developers, it incorporates a comprehensive suite of learning tools and AI agents to streamline academic preparation, recall, and tracking.

## 🚀 Key Features

*   **Landing Page**: Elegant glassmorphic presentation detailing animations, pricing tiers, FAQs, and testimonials.
*   **Student Dashboard**: Visual metrics cards detailing study streak, hours logged, and upcoming agendas with weekly Recharts analytics.
*   **AI Tutor**: Multi-session conversational ChatGPT-like interface supporting copy-response, code-highlight blocks, regenerates, search, pins, and `.md` exports.
*   **Notes Module**: Categories explorer featuring auto-save debouncing, tag managers, and split markdown editor/preview panels with floating AI summaries, rewrites, and active recall.
*   **Docu-Sense PDF Learning**: PDF text extraction parser (PyPDF-driven) with chapter outlines, bookmark managers, and a contextual Ask PDF chat overlay.
*   **Quiz Generator**: Configuration wizard generating MCQs and True/False tests by subject and difficulty. Auto-scores results with detailed explanations and tracks global leaderboard positions.
*   **Flashcards Module**: Spaced repetition helper utilizing 3D card deck flips, bookmark marks, and self-assessment scores.
*   **Study Planner Calendar**: Monthly agenda grid with priority flags and category schedulers. Completing tasks logs +0.5 study hours.
*   **Coding Practice Review**: Monaco-like editor backing Python, JavaScript, C++, Java, and SQL reviews. Computes algorithmic Big-O complexities and outputs refactored solutions.
*   **Resume Assistant**: Form builder compiling ATS career objectives, highlighted skills lists, cover letters, and mock interview preparations.
*   **Progress Analytics**: Streak heatmaps (GitHub style) showing activity counts alongside productivity scoring advisors.
*   **Admin Panel**: KPI panels, user tables (roles promo/demote updates), scrolling audit logs, and global announcements notifications broadcaster.

---

## 🛠️ Technology Stack

### Frontend
*   **Framework**: React.js 18 + TypeScript + Vite
*   **Styling**: Tailwind CSS v4 (CSS-first variables)
*   **Routing**: React Router DOM v6
*   **Animations**: CSS Transforms + Framer Motion
*   **Icons**: Lucide Icons
*   **Charts**: Recharts
*   **Client**: Axios

### Backend
*   **Framework**: Python + Flask API
*   **Database Client**: PyMongo (MongoDB Atlas client)
*   **Security**: bcrypt (password hashing) + PyJWT (access & refresh tokens) + CORS middleware
*   **Parser**: PyPDF (PDF text extraction)
*   **AI Engine**: OpenAI API client

### Database
*   **Primary Database**: MongoDB Atlas (MongoDB document collections)
*   **Sandbox Fallback**: Local persistent JSON File database (`logs/db_store.json`)

---

## 📂 Repository Structure

```
StudySphere AI – Intelligent Learning Platform/
│
├── frontend/                     # React + TypeScript + Vite + Tailwind CSS
│   ├── public/                   # Static public assets
│   ├── src/
│   │   ├── assets/               # Local images, SVG illustrations
│   │   ├── components/           # Reusable UI components (Command Palette, Toast Container)
│   │   ├── layouts/              # Navigation layouts (Landing, Auth, Dashboard)
│   │   ├── pages/                # Screen modules (Dashboard, Tutor, Notes, PDF, Quiz, Flashcards, etc.)
│   │   ├── services/             # Axios API client wrapper
│   │   ├── contexts/             # State managers (Auth, Theme, Notifications)
│   │   └── index.css             # Main styling & Tailwind CSS v4 variables
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                      # Python Flask API
│   ├── app/
│   │   ├── routes/               # Modular controller Blueprints (auth, notes, ai, pdf, quiz, planner, etc.)
│   │   ├── middleware/           # Security authentication & CORS middleware
│   │   ├── services/             # AI agent OpenAI services wrapper
│   │   ├── utils/                # Database configurations & password utils
│   │   └── __init__.py           # Flask App Factory initialization
│   ├── logs/                     # System logs and mock JSON DB store
│   └── run.py                    # Server launch script
│
└── documentation/                # Final Year Engineering Project Docs
    ├── INSTALLATION.md           # Installation Guide
    ├── API_REFERENCE.md          # REST API specifications
    ├── SRS.md                    # Software Requirements Specification
    ├── ARCHITECTURE_DESIGN.md    # HLD, LLD, DB Schemas, ER/UML Diagrams (Mermaid)
    └── PROJECT_REPORT.md         # Final Project Report & PowerPoint Slide Outline
```

---

## 📚 Technical Documentation

For the complete submittal materials, review the documentation folder:

1.  **[Installation Guide](file:///c:/Users/chait/OneDrive/Desktop/StudySphere%20AI%2520%25E2%2580%2593%2520Intelligent%2520Learning%2520Platform/documentation/INSTALLATION.md)**: Setup nodes, python venvs, Atlas credentials, and run steps.
2.  **[API Reference](file:///c:/Users/chait/OneDrive/Desktop/StudySphere%20AI%2520%25E2%2580%2593%2520Intelligent%2520Learning%2520Platform/documentation/API_REFERENCE.md)**: Details HTTP parameters for login, note CRUD, pdf asks, and leaderboard analytics.
3.  **[Software Requirements Specification (SRS)](file:///c:/Users/chait/OneDrive/Desktop/StudySphere%20AI%2520%25E2%2580%2593%2520Intelligent%2520Learning%2520Platform/documentation/SRS.md)**: Formulates IEEE-standard requirements outlines.
4.  **[Architectural & Low-Level Design](file:///c:/Users/chait/OneDrive/Desktop/StudySphere%20AI%2520%25E2%2580%2593%2520Intelligent%2520Learning%2520Platform/documentation/ARCHITECTURE_DESIGN.md)**: UML class designs, ER layouts, and sequence streams using Mermaid.
5.  **[Project Report & PowerPoint Slides](file:///c:/Users/chait/OneDrive/Desktop/StudySphere%20AI%2520%25E2%2580%2593%2520Intelligent%2520Learning%2520Platform/documentation/PROJECT_REPORT.md)**: Final placement portfolio review, ppt layouts, future scopes, and testing logs.
