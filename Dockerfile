# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build the Python Flask backend
FROM python:3.12-slim
WORKDIR /app/backend

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python requirements
COPY backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy built frontend assets from Stage 1
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

# Copy backend codebase
COPY backend/ ./

# Expose port (Railway will override this with its dynamic port)
EXPOSE 8080

# Run Flask using Gunicorn, binding to the dynamic PORT environment variable
CMD ["sh", "-c", "gunicorn --bind 0.0.0.0:${PORT:-8080} index:app"]
