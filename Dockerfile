# Multi-stage Unified Dockerfile (React Frontend + FastAPI Backend)
# Stage 1: Build the React + Vite Frontend
FROM node:22-alpine AS frontend-builder

WORKDIR /frontend
COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ .
RUN npm run build

# Stage 2: Python Backend with FFmpeg and Static Frontend Serving
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy backend requirements and install dependencies
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY backend/app/ ./app/

# Copy built frontend assets from stage 1 into frontend_dist
COPY --from=frontend-builder /frontend/dist ./frontend_dist

# Create downloads directory
RUN mkdir -p downloads

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
