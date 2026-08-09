# Software Requirements Specification (SRS)
## StudySphere AI – Intelligent AI-Powered Study Assistant

---

## 1. Introduction

### 1.1 Purpose
This document specifies the software requirements for **StudySphere AI**, an intelligent learning platform designed to streamline student preparation, notes compiling, flashcard review, planner scheduling, coding audits, CV generation, and progress tracking.

### 1.2 Scope
StudySphere AI is a web-based SaaS platform incorporating modular AI agents. Key sub-modules include the AI Tutor (conversational tutor), Docu-Sense (PDF context parser), Quiz Generator (automated MCQ/TF practice assessments), Spaced Repetition Flashcards, Study Planner (agenda manager), Coding practice assistant, Resume builder, and Progress Analytics trackers.

### 1.3 Definitions & Abbreviations
*   **JWT**: JSON Web Token (session verification mechanism).
*   **ATS**: Applicant Tracking System (automated resume parsers).
*   **MCQ**: Multiple Choice Questions.
*   **NoSQL**: Non-relational document database.
*   **SaaS**: Software as a Service.

---

## 2. General Description

### 2.1 Product Perspective
StudySphere AI is a standalone learning system running a React (TypeScript + Tailwind CSS v4) frontend and a Python Flask REST API backend, connecting to MongoDB Atlas.

### 2.2 Product Functions
*   **Authentication & Security**: Account registrations, email validation token loops, JWT login access/refresh intervals, password hashing.
*   **AI Tutor**: Multi-session conversational study dialog with Markdown highlights and chat export.
*   **Notes Explorer**: Auto-saving Markdown editor, pin/favorite toggles, tags catalog, and floating AI summarizing/recall builders.
*   **PDF Analyzer**: PyPDF document text extraction page by page, page bookmarks, and contextual asks.
*   **Evaluator**: Practice MCQ/TF timed test generation. Leaderboards and score history tracking.
*   **Spaced Repetition**: 3D flip-card flashcards with self-assessments (easy/med/hard learning level increments).
*   **Study Planner**: Monthly calendar schedules task priority flags. Ticking tasks completed logs +0.5 study hours.
*   **Coding practice**: Code syntax edits reviewing Big-O complexities and refactoring optimizations.
*   **Analytics Dashboard**: Studies streak heatmaps (GitHub styled) tracking study hours, notes created, and quizzes completed.
*   **Admin Panel**: KPI panels, user tables (roles update control), audit trails, and announcements broadcasts.

### 2.3 User Classes & Characteristics
*   **Scholars / Students**: Standard users seeking learning assistance, planning, quizzes, and note tracking.
*   **Administrators**: System auditors managing user profiles, inspecting security logs, and broadcasting alerts.

---

## 3. Specific Requirements

### 3.1 Functional Requirements

#### 3.1.1 User Authentication
*   **FR-1.1**: The system shall register users with names, emails, and passwords.
*   **FR-1.2**: Passwords shall be hashed using bcrypt before database insertion.
*   **FR-1.3**: The system shall generate verification tokens and reset tokens returned in logs.
*   **FR-1.4**: Authenticated requests shall verify JWT access tokens in the Authorization Header.

#### 3.1.2 AI Tutor Chat
*   **FR-2.1**: The system shall allow creating, pinning, renaming, and deleting chat sessions.
*   **FR-2.2**: The AI Tutor shall answer academic queries using markdown formatting.
*   **FR-2.3**: Users shall be able to export conversations as Markdown files.

#### 3.1.3 Notes Management
*   **FR-3.1**: Notes content shall be saved automatically using a 1.2-second typing debounce.
*   **FR-3.2**: The system shall support tagging and categorizing notes.
*   **FR-3.3**: The system shall generate AI summaries, rewrites, and active recall guides on demand.

#### 3.1.4 PDF textbook analysis
*   **FR-4.1**: The system shall extract text from uploaded PDF textbooks.
*   **FR-4.2**: Users shall be able to book pages and run context-specific Q&A chat.

#### 3.1.5 Quiz Practice
*   **FR-5.1**: The system shall generate MCQs and TF quizzes by difficulty, subject, and question count.
*   **FR-5.2**: Quizzes shall be timed, and auto-score on completion.
*   **FR-5.3**: Wrong answers shall detail explanations. Global leaderboards shall rank user scores.

#### 3.1.6 Flashcards review
*   **FR-6.1**: Flashcards shall flip in 3D to show definitions.
*   **FR-6.2**: Users shall self-assess card difficulties, updating progress statistics.

#### 3.1.7 Study Planner
*   **FR-7.1**: Planner calendar shall display tasks by date.
*   **FR-7.2**: Completing calendar tasks shall increment today's study hours by +0.5.

#### 3.1.8 Coding audits
*   **FR-8.1**: The system shall review Python, JS, C++, Java, and SQL code syntax.
*   **FR-8.2**: Feedback shall review Big-O complexities and refactored alternates.

#### 3.1.9 Resume builder
*   **FR-9.1**: The system shall output ATS objectives, cover letters, and mock questions.

#### 3.1.10 Analytics streaks
*   **FR-10.1**: The system shall graph weekly study activities.
*   **FR-10.2**: Streak heatmaps (GitHub style) shall color-code daily activity counts.

#### 3.1.11 Admin auditing
*   **FR-11.1**: Admins shall be able to demote/promote user roles.
*   **FR-11.2**: Admins shall review IP addresses and user agents inside audit trails.
*   **FR-11.3**: Admins shall broadcast global announcements pushing notifications to all users.

---

### 3.2 Non-Functional Requirements

#### 3.2.1 Security
*   Password hashes shall use Salt algorithms. All secure endpoints shall validate active tokens. System logs shall audit admin updates and user actions.

#### 3.2.2 Performance
*   AI and database requests shall process under 3 seconds. The frontend shall implement code splitting and bundle builds.

#### 3.2.3 Reliability & Database Fallbacks
*   The backend shall verify connection pings. If MongoDB Atlas is offline or credentials are missing, the system shall fallback to a persistent JSON file database to guarantee 100% uptime.

#### 3.2.4 Usability
*   The UI shall implement responsiveness for Mobile, Tablet, and Desktop grids. Theme states (dark/light) shall be persisted.
