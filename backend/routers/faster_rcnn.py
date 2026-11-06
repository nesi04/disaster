from fastapi import APIRouter, File, UploadFile, Form
from services.faster_rcnn_service import FasterRCNNService

# Initialize router
router = APIRouter()

# Initialize service
faster_rcnn_service = FasterRCNNService()


@router.post("/faster-rcnn")
async def predict_faster_rcnn(
    file: UploadFile = File(...),
    confidence: float = Form(0.25)
):
    """
    Faster R-CNN Object Detection - Not implemented yet
    
    Args:
        file: Image file (jpg, png, etc.)
        confidence: Confidence threshold (default: 0.25)
        
    Returns:
        Not implemented response
    """
    result = faster_rcnn_service.predict(None)
    return result
