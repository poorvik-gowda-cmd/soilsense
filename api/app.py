"""
FastAPI Application Entry Point
================================
Starts the API server, loads ML models once at startup,
and mounts all routers.
"""

import sys
import os
from pathlib import Path

# Allow imports from root (so we can find 'src') and 'api'
ROOT_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT_DIR))
sys.path.insert(0, str(Path(__file__).parent))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from src.predict import Predictor
from routers.predict import router as predict_router, run_prediction
from routers.history import router as history_router
from routers.analytics import router as analytics_router
from src.data_preprocessing import SoilInput

app = FastAPI(
    title="SoilSense AI API",
    description="Soil Health Analysis & Crop Recommendation System",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS (allow React dev server + Vercel) ────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "https://*.vercel.app",
        "*",   # tighten in prod
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Load models once at startup ───────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    try:
        app.state.predictor = Predictor()
    except FileNotFoundError as e:
        print(f"Error: {e}")
        print("   Run:  python src/train_model.py")
        app.state.predictor = None


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(history_router)
app.include_router(analytics_router)
from routers.upload import router as upload_router
app.include_router(upload_router)

# /predict is wired manually to inject the predictor from app.state
@app.post("/predict", tags=["Prediction"])
async def predict(data: SoilInput, request: Request):
    """
    Full soil analysis pipeline.

    - Validates input
    - Computes Soil Health Index (SHI)
    - Runs crop classification + yield regression
    - Applies fertilizer rule engine
    - Persists to Supabase
    - Returns structured results
    """
    predictor = request.app.state.predictor
    if predictor is None:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=503,
            detail="ML models not loaded. Run 'python -m ml.train' first."
        )
    auth_header = request.headers.get("Authorization")
    auth_token = auth_header.split("Bearer ")[1] if auth_header and "Bearer " in auth_header else None
    return await run_prediction(data, predictor, auth_token)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
async def health(request: Request):
    return {
        "status": "ok",
        "models_loaded": request.app.state.predictor is not None,
    }


@app.get("/", tags=["System"])
async def root():
    return {
        "message": "SoilSense AI — Crop & Soil Health API",
        "docs": "/docs",
    }


# ── Dev runner ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
