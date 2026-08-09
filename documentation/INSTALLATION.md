# Installation Guide

Follow these steps to deploy and run **StudySphere AI** on your local workstation.

---

## Prerequisites

Ensure you have the following software installed:
*   **Node.js**: `v18.0.0` or higher (tested on `v24.16.0`)
*   **Python**: `v3.9` or higher (tested on `v3.14.5`)
*   **npm**: `v9.0.0` or higher (tested on `v11.13.0`)

---

## 🐍 Backend Configuration

1.  **Navigate into the backend folder**:
    ```bash
    cd backend
    ```

2.  **Create a Python Virtual Environment**:
    *   **Windows (PowerShell)**:
        ```powershell
        python -m venv venv
        .\venv\Scripts\Activate.ps1
        ```
    *   **macOS / Linux**:
        ```bash
        python3 -m venv venv
        source venv/bin/activate
        ```

3.  **Install python packages**:
    ```bash
    pip install -r requirements.txt
    ```

4.  **Create your Environment Variables file**:
    Copy the sample configuration file:
    ```bash
    cp .env.example .env
    ```
    Open `.env` and fill in credentials:
    ```ini
    PORT=5000
    FLASK_ENV=development
    JWT_SECRET=super-secret-jwt-key-here
    JWT_REFRESH_SECRET=super-secret-refresh-key-here

    # Database: If connection fails or left blank, the app auto-switches to persistent JSON database.
    MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/studysphere

    # OpenAI API: If left empty, the app runs in AI Mock Sandbox mode with high-quality predefined outputs.
    OPENAI_API_KEY=your-openai-api-key-here
    ```

5.  **Run the Flask Server**:
    ```bash
    python run.py
    ```
    The server will startup on `http://localhost:5000`. Review terminal logs for connection statuses:
    *   `Successfully connected to MongoDB Atlas.` or `No MONGODB_URI set. Falling back to Local JSON Database.`
    *   `No OPENAI_API_KEY provided. Running AI Service in Mock Sandbox mode.` or `OpenAI client initialized.`

---

## ⚛️ Frontend Configuration

1.  **Navigate into the frontend folder**:
    ```bash
    cd ../frontend
    ```

2.  **Install npm packages**:
    ```bash
    npm install
    ```

3.  **Create Frontend `.env` (Optional)**:
    By default, the frontend is configured to target the local backend on `http://localhost:5000`. To customize the target API address, create a `.env` file in the `/frontend` directory:
    ```ini
    VITE_API_URL=http://localhost:5000
    ```

4.  **Run the Developer Server**:
    ```bash
    npm run dev
    ```
    Open your browser to `http://localhost:5173`.

5.  **Compile Production Build**:
    ```bash
    npm run build
    ```
    The optimized production assets will be built in the `frontend/dist` directory.

---

## 🛡️ Sandbox Evaluation Mode (Zero Configuration Setup)

StudySphere AI is engineered to be **immediately runnable**. If you don't have a MongoDB cluster running or an active OpenAI developer key:
*   Leave `MONGODB_URI` and `OPENAI_API_KEY` blank inside `backend/.env`.
*   Start the server: `python run.py`.
*   The backend will write all collections directly to `backend/logs/db_store.json`.
*   All AI features (AI Tutor, Notes summaries, flashcard generation, resume assistant) will run using smart context-matching mock engines returning rich outputs.
*   Email verification and password recovery tokens will be returned in the server HTTP response payload, allowing you to copy/paste them directly in the UI.
