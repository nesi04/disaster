from fastapi import APIRouter, File, UploadFile, Form, HTTPException
import cv2
import numpy as np
from pathlib import Path
from services.yolo_service import YOLOService
from utils.image_utils import load_image_from_bytes, get_image_filename_from_bytes

# Initialize router
router = APIRouter()

# Get model path
PROJECT_ROOT = Path(__file__).parent.parent.parent
MODEL_PATH = PROJECT_ROOT / "disaster-vision" / "models" / "best.pt"

# Initialize service (lazy load)
yolo_service = None


def get_yolo_service():
    """Get or initialize YOLO service"""
    global yolo_service
    if yolo_service is None:
        if not MODEL_PATH.exists():
            raise RuntimeError(f"Model not found at {MODEL_PATH}")
        yolo_service = YOLOService(str(MODEL_PATH))
    return yolo_service


@router.post("/yolo")
async def predict_yolo(
    file: UploadFile = File(...),
    confidence: float = Form(0.25)
):
    """
    YOLOv8m Disaster Damage Detection
    
    Args:
        file: Image file (jpg, png, etc.)
        confidence: Confidence threshold (default: 0.25)
        
    Returns:
        JSON with detections, summary, and annotated image URL
    """
    try:
        # Read file
        contents = await file.read()
        
        if not contents:
            raise HTTPException(status_code=400, detail="Empty file")
        
        # Load image
        image, _ = load_image_from_bytes(contents)
        
        # Get service
        service = get_yolo_service()
        
        # Get safe filename
        safe_filename = get_image_filename_from_bytes(contents, file.filename)
        
        # Run prediction
        result = service.predict(
            image,
            confidence=confidence,
            imgsz=640,
            max_det=1843,
            original_filename=safe_filename
        )
        
        return result
        
    except HTTPException as e:
        raise e
    except Exception as e:
        return {
            "success": False,
            "model": "yolov8m",
            "error": str(e)
        }
