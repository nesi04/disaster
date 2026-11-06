"""
Multi-model analysis + AI assistant endpoints.

  GET  /api/models                      -> registry (available + coming soon)
  POST /api/analyze                     -> run several models on one image and compare
  GET  /api/analyze/{analysis_id}       -> fetch a stored analysis
  GET  /api/assistant/status            -> is the AI assistant configured?
  POST /api/assistant/{analysis_id}/chat -> one assistant turn (may take actions)
"""

from typing import Optional

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from pydantic import BaseModel, Field

from services import assistant_service
from services.analysis_store import create_analysis, get_analysis
from services.comparison import compare_results
from services.model_registry import MODELS, list_models, run_model

router = APIRouter(prefix="/api", tags=["Analysis & Assistant"])


@router.get("/models")
async def get_models():
    return {"models": list_models()}


@router.post("/analyze")
async def analyze(
    file: UploadFile = File(...),
    models: Optional[str] = Form(None, description="Comma-separated model ids; default = all available"),
    confidence: float = Form(0.25),
):
    contents = await file.read()
    if not contents:
        raise HTTPException(status_code=400, detail="Empty file")

    if models:
        model_ids = [m.strip() for m in models.split(",") if m.strip()]
    else:
        model_ids = [m.id for m in MODELS.values() if m.available]
    if not model_ids:
        raise HTTPException(status_code=400, detail="No models selected")

    analysis = create_analysis(file.filename or "image.jpg", contents)

    def _run_all():
        for mid in model_ids:
            analysis.results[mid] = run_model(
                mid, contents, analysis.filename, confidence=confidence
            )
        analysis.comparison = compare_results(analysis.results)

    await run_in_threadpool(_run_all)
    return analysis.public()


@router.get("/analyze/{analysis_id}")
async def fetch_analysis(analysis_id: str):
    analysis = get_analysis(analysis_id)
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found (the server may have restarted).")
    return analysis.public()


@router.get("/assistant/status")
async def assistant_status():
    return assistant_service.status()


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)


@router.post("/assistant/{analysis_id}/chat")
async def assistant_chat(analysis_id: str, body: ChatRequest):
    analysis = get_analysis(analysis_id)
    if analysis is None:
        raise HTTPException(status_code=404, detail="Analysis not found (the server may have restarted).")
    try:
        return await run_in_threadpool(assistant_service.chat, analysis, body.message)
    except assistant_service.AssistantError as e:
        raise HTTPException(status_code=e.status_code, detail=str(e))
