# StudySphere AI — Production Deployment & Architecture Guide

## 1. System Architecture Overview

StudySphere AI is architected as a decoupled, production-grade full-stack learning platform:

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion. Deployed on **Vercel** (`https://studysphere-ai-phi.vercel.app`).
- **Backend**: Python Flask REST API with Blueprints, JWT Authentication (HS256 access & refresh tokens), Bcrypt password hashing, and Gemini AI integration. Designed for deployment on **Render** (or Railway / AWS / VPS / Docker) via `gunicorn`.
- **Database Persistence**:
  - **Multi-Instance / Production**: MongoDB Atlas cluster (configured via `MONGODB_URI`). Shared by all frontend sessions, server restarts, and instances.
  - **Single-Instance / Local**: Persistent SQLite with WAL mode (`backend/data/studysphere.db`).
- **API Resolution & Reverse Proxy**:
  - `frontend/src/services/api.ts` dynamically normalizes `VITE_API_URL` (stripping trailing slashes and redundant `/api` prefixes).
  - When `VITE_API_URL` is set to your deployed backend URL (e.g. `https://studysphere-ai-backend.onrender.com`), requests route directly with CORS credentials.
  - When `VITE_API_URL` is left blank in production, requests route to same-origin `/api/*` and are proxied by `vercel.json`.

---

## 2. Root Cause Analysis of Previous Connection Errors

1. **Dead Backend URL**: The frontend previously had `https://studysphere-ai-zf1a.onrender.com` hardcoded in `frontend/.env.production`, `vercel.json`, and `api.ts`. Because this Render service did not exist or was deleted, Render returned HTTP 404 (`Not Found`) for all API requests.
2. **Missing Deployed Backend**: The Vercel frontend was deployed, but no corresponding live backend was reachable at the configured URL.
3. **URL Normalization**: If `VITE_API_URL` ended with `/api/`, requests to `/api/auth/login` resulted in malformed `/api/api/auth/login` requests.
4. **Ephemeral Serverless Storage**: When running in serverless environments without `MONGODB_URI`, SQLite fell back to `/tmp`, wiping user accounts across cold starts.

---

## 3. Backend Deployment Guide (Render / Railway)

### Option A: 1-Click Deployment on Render via `render.yaml`
1. Go to **Render Dashboard** -> **Blueprints** -> **New Blueprint Instance**.
2. Connect your GitHub repository: `chaitanyasai17/studysphere-ai`.
3. Render reads `render.yaml` automatically and configures:
   - **Service Name**: `studysphere-ai-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn "app:create_app()" -b 0.0.0.0:$PORT -w 2 --threads 4 --timeout 120`
   - **Health Check Path**: `/api/health`
4. Set your sensitive environment variables in the Render Dashboard (see Section 4).

### Option B: Manual Web Service on Render
1. Click **New +** -> **Web Service**.
2. Connect your repository: `chaitanyasai17/studysphere-ai`.
3. Configure settings:
   - **Name**: `studysphere-ai-backend`
   - **Region**: Oregon (or closest to your users)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn "app:create_app()" -b 0.0.0.0:$PORT -w 2 --threads 4 --timeout 120`
4. Add the environment variables listed in Section 4.
5. Click **Create Web Service**.
6. Once deployed, note your service URL: `https://<your-service-name>.onrender.com`.

---

## 4. Environment Variables Configuration

### Backend Service (Render / Railway / Docker)

| Variable | Description | Recommended Value |
| :--- | :--- | :--- |
| `FLASK_ENV` | Environment mode | `production` |
| `SECRET_KEY` | Flask cryptographic session key | `<random-32-byte-hex-string>` |
| `JWT_SECRET` | Secret key for JWT access tokens | `<random-32-byte-hex-string>` |
| `JWT_REFRESH_SECRET` | Secret key for JWT refresh tokens | `<random-32-byte-hex-string>` |
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://<user>:<password>@cluster0.mongodb.net/studysphere?retryWrites=true&w=majority` |
| `FRONTEND_URL` | Primary production frontend origin | `https://studysphere-ai-phi.vercel.app` |
| `CORS_ORIGINS` | Allowed frontend origins (comma-separated) | `https://studysphere-ai-phi.vercel.app,http://localhost:5173,http://localhost:3000` |
| `GEMINI_API_KEY` | Google Gemini API key for AI features | `AIzaSy...` |
| `GEMINI_MODEL` | Gemini AI model variant | `gemini-flash-lite-latest` |
| `OPENAI_API_KEY` | OpenAI API key (optional fallback) | `sk-...` |

> [!IMPORTANT]
> **Persistent Database Requirement**: To guarantee registered users and admin records never disappear across restarts, configure a free MongoDB Atlas M0 cluster and set `MONGODB_URI`. If running without `MONGODB_URI`, ensure the backend host has a persistent disk mounted for SQLite.

### Frontend Service (Vercel Project Settings)

| Variable | Description | Example Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | Live backend base URL (without `/api` suffix) | `https://<your-backend-app>.onrender.com` |

> [!IMPORTANT]
> **Vite Build-Time Embedding**: Vite embeds environment variables into the static JavaScript bundle **at build time**. After adding or changing `VITE_API_URL` in the Vercel Dashboard, you **must trigger a redeploy** (Vercel -> Deployments -> Redeploy) for the changes to take effect in the browser.

---

## 5. Verification & Health Check Endpoints

### 1. Backend Health Check
```bash
curl -s https://<your-backend-app>.onrender.com/api/health
```
**Expected Response (HTTP 200)**:
```json
{
  "database": "connected",
  "database_type": "mongodb",
  "environment": "production",
  "service": "studysphere-api",
  "status": "ok"
}
```

### 2. User Registration Flow
```bash
curl -X POST https://<your-backend-app>.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Verification Student","email":"student_test@studysphere.ai","password":"Password@123"}'
```
**Expected Response (HTTP 201)**:
```json
{
  "message": "Registration successful! Verification token generated.",
  "role": "student",
  "success": true,
  "user_id": "<user-id>",
  "verification_token": "<token>"
}
```

### 3. User Login Flow
```bash
curl -X POST https://<your-backend-app>.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student_test@studysphere.ai","password":"Password@123"}'
```
**Expected Response (HTTP 200)**:
```json
{
  "access_token": "eyJhbGciOi...",
  "refresh_token": "eyJhbGciOi...",
  "user": {
    "email": "student_test@studysphere.ai",
    "name": "Verification Student",
    "role": "student"
  }
}
```

### 4. Administrator Authentication
```bash
curl -X POST https://<your-backend-app>.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@studysphere.ai","password":"Admin@123"}'
```

### 5. Protected Admin Users API
```bash
curl -X GET https://<your-backend-app>.onrender.com/api/admin/users \
  -H "Authorization: Bearer <access_token>"
```
**Expected Response**: Array of actual database users with roles, verification states, and creation timestamps.

---

## 6. Default Administrative Accounts

Upon initial backend startup, the system seeds the following default administrative accounts if they do not already exist in the database:

| Email | Default Password | Role |
| :--- | :--- | :--- |
| `admin@studysphere.ai` | `Admin@123` | `admin` |
| `superadmin@studysphere.ai` | `SuperAdmin@123` | `superadmin` |

Passphrases are hashed using Bcrypt with per-user cryptographic salts. Existing passwords are never overwritten on server cold starts.
