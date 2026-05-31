# ai-service/main.py
# SkillSwap X — AI Microservice
# Run: uvicorn main:app --host 0.0.0.0 --port 8000 --reload

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import roadmap, match, trust, moderate
import os

app = FastAPI(
    title="SkillSwap X AI Service",
    description="AI/ML microservice for roadmap generation, skill matching, trust scoring, and content moderation",
    version="1.0.0"
)

# CORS — only allow calls from the PHP backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("PHP_BACKEND_URL", "http://localhost:8080")],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────
app.include_router(roadmap.router,  prefix="/roadmap",  tags=["Roadmap"])
app.include_router(match.router,    prefix="/match",    tags=["Matching"])
app.include_router(trust.router,    prefix="/trust",    tags=["Trust"])
app.include_router(moderate.router, prefix="/moderate", tags=["Moderation"])

@app.get("/health")
def health():
    return {"status": "ok", "service": "SkillSwap X AI"}
