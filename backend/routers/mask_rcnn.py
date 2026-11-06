from fastapi import APIRouter, File, UploadFile, Form
from services.mask_rcnn_service import MaskRCNNService

# Initialize router
router = APIRouter()

# Initialize service
mask_rcnn_service = MaskRCNNService()


@router.post("/mask-rcnn")
async def predict_mask_rcnn(
    file: UploadFile = File(...),
    confidence: float = Form(0.25)
):
    """
    Mask R-CNN Instance Segmentation - Not implemented yet
    
    Args:
        file: Image file (jpg, png, etc.)
        confidence: Confidence threshold (default: 0.25)
        
    Returns:
        Not implemented response
    """
    result = mask_rcnn_service.predict(None)
    return result
