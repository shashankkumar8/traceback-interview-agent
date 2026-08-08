import logging
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.interview import router as interview_router
from app.config import settings
from app.services.curriculum import load_candidates, load_curriculum

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="TRACEBACK", description="The interviewer that investigates your understanding", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(interview_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "traceback"}


@app.get("/api/candidates")
async def list_candidates():
    return {"candidates": load_candidates()}


@app.get("/api/curriculum")
async def get_curriculum():
    return load_curriculum()


frontend_dist = Path(__file__).resolve().parents[2] / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")
