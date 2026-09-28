# StudySphere AI — Production Deployment Guide

## 1. System Architecture Overview

StudySphere AI is architected as a high-performance, decoupled full-stack platform:

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Framer Motion. Deployed on **Vercel**.
- **Backend**: Python Flask REST API with Blueprints, JWT Authentication, and Gemini AI integration. Deployed on **Render** (or Railway / AWS / VPS) using `gunicorn`.
- **Database**:
  - **Production (Multi-Instance)**: MongoDB Atlas (via `MONGODB_URI` connection string).
  - **Single-Instance / Local**: High-concurrency SQLite with WAL mode (`studysphere.db`).
- **Reverse Proxy & Routing**:
  - `frontend/vercel.json` provides an automatic rewrite fallback proxying `/api/*` to the deployed backend.
  - `frontend/src/services/api.ts` handles centralized production API resolution with automatic token attachment and 401 token refresh.

---

## 2. Environment Variables

### Backend (`backend/.env` or Render/Railway Dashboard)

| Variable | Description | Example / Default |
| :--- | :--- | :--- |
| `PORT` | Port the Flask server listens on | `5000` (assigned automatically by host) |
| `FLASK_ENV` | Environment mode | `production` |
| `SECRET_KEY` | Flask session & cryptographic key | `<secure-hex-string>` |
| `JWT_SECRET` | Secret key for JWT access tokens | `<secure-jwt-secret>` |
| `JWT_REFRESH_SECRET` | Secret key for JWT refresh tokens | `<secure-refresh-secret>` |
| `MONGODB_URI` | MongoDB connection string (Atlas) | `mongodb+srv://user:pass@cluster.mongodb.net/studysphere` |
| `GEMINI_API_KEY` | Google Gemini AI API key | `AIzaSy...` |
| `GEMINI_MODEL` | Gemini model variant | `gemini-flash-lite-latest` |
| `OPENAI_API_KEY` | OpenAI API key (optional fallback) | `sk-...` |
| `FRONTEND_URL` | Frontend origin for CORS policy | `https://studysphere-ai-phi.vercel.app` |
| `CORS_ORIGINS` | Comma-separated allowed origins | `https://studysphere-ai-phi.vercel.app,http://localhost:5173` |
| `ADMIN_EMAIL` | Default administrator account email | `admin@studysphere.ai` |
| `ADMIN_PASSWORD` | Default administrator password | `Admin@123` |

### Frontend (`frontend/.env.production` or Vercel Dashboard)

| Variable | Description | Example |
| :--- | :--- | :--- |
| `VITE_API_URL` | Backend API base URL | `https://studysphere-ai-zf1a.onrender.com` |

---

## 3. Backend Deployment (Render / Railway)

### On Render:
1. **New Web Service** -> Connect your GitHub repository.
2. Configure settings:
   - **Name**: `studysphere-ai-api`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn "app:create_app()" -b 0.0.0.0:$PORT -w 2 --threads 4 --timeout 120`
3. Add environment variables listed in the Backend table above.
4. **Deploy**: Render will build the wheel files and start the Gunicorn workers.

### Database Setup & Admin Seeding:
Once your backend is deployed:
1. Run the admin seed script via Render Shell or locally connected to your MongoDB instance:
   ```bash
   python backend/scripts/seed_admin.py --email admin@studysphere.ai --password "Admin@123" --role admin
   ```
2. Verify output confirms:
   ```
   [OK] Verification SUCCESS: Password for 'admin@studysphere.ai' verified against stored hash.
   ```

---

## 4. Frontend Deployment (Vercel)

1. **Import Project** on Vercel from your GitHub repository.
2. In Project Settings:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`
3. Add Environment Variable:
   - `VITE_API_URL`: `https://<your-backend-app>.onrender.com`
4. Click **Deploy**.

---

## 5. Verification & Health Check Endpoints

### 1. API Health Check
```bash
curl -s https://studysphere-ai-zf1a.onrender.com/api/health
```
**Expected Response (HTTP 200)**:
```json
{
  "status": "ok",
  "service": "studysphere-api",
  "database": "connected",
  "database_type": "mongodb",
  "environment": "production"
}
```

### 2. Admin Authentication Verification
```bash
curl -X POST https://studysphere-ai-zf1a.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@studysphere.ai","password":"Admin@123"}'
```
**Expected Response (HTTP 200)**:
```json
{
  "access_token": "eyJhbGciOi...",
  "user": {
    "email": "admin@studysphere.ai",
    "name": "StudySphere Administrator",
    "role": "admin"
  }
}
```

---

## 6. Troubleshooting Common Issues

### Cold Starts on Free Tier Hosts
Render free tier spins down idle services after 15 minutes. Initial requests may take 30–50 seconds to wake the service. The frontend handles this by keeping authentication state persistent and retrying requests gracefully.

### "Invalid email or password!"
- Run `python backend/scripts/seed_admin.py` to reset the hash for `admin@studysphere.ai`.
- Verify the backend database matches: if `MONGODB_URI` is configured, credentials must reside in MongoDB. If running without `MONGODB_URI`, ensure `backend/data/studysphere.db` is persistent.
- Password check is whitespace-resilient (both exact and trimmed passwords are authenticated).
