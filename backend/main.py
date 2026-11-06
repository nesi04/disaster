
from pathlib import Path

# Load backend/.env (AI_PROVIDER, AI_API_KEY, ...) before anything reads the environment
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).parent / ".env")
except ImportError:
    pass

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from pathlib import Path

# Import routers
from routers import yolo, faster_rcnn, mask_rcnn
from routers.vgg16 import router as vgg16_router
from routers.analysis import router as analysis_router


# Create FastAPI app
app = FastAPI(
    title="Disaster Damage Assessment API",
    description="API for disaster damage assessment using various computer vision models",
    version="1.0.0"
)


# CORS Configuration
# Allow local development frontends to communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Create outputs directory if it doesn't exist
outputs_dir = Path(__file__).parent.parent / "outputs"
outputs_dir.mkdir(exist_ok=True)


# Mount static files for annotated images
if outputs_dir.exists():
    app.mount(
        "/outputs",
        StaticFiles(directory=str(outputs_dir)),
        name="outputs"
    )


# Include model routers
app.include_router(
    yolo.router,
    prefix="/api/predict",
    tags=["YOLO"]
)

app.include_router(
    faster_rcnn.router,
    prefix="/api/predict",
    tags=["Faster R-CNN"]
)

app.include_router(
    mask_rcnn.router,
    prefix="/api/predict",
    tags=["Mask R-CNN"]
)

# VGG16 router
# The router already contains the /api/predict prefix.
app.include_router(vgg16_router)

# Multi-model comparison + AI assistant (prefix /api is set in the router)
app.include_router(analysis_router)


@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Disaster Damage Assessment API",
        "version": "1.0.0"
    }


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Disaster Damage Assessment API",
        "docs": "/docs",
        "health": "/api/health"
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000
    )

