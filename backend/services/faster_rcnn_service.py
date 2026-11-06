"""Faster R-CNN Service - Placeholder for future implementation"""


class FasterRCNNService:
    """Service for Faster R-CNN object detection"""
    
    def __init__(self, model_path: str = None):
        """
        Initialize Faster R-CNN service
        
        Args:
            model_path: Path to model (not implemented yet)
        """
        pass
    
    def predict(self, image, **kwargs):
        """
        Faster R-CNN inference - Not implemented yet
        
        Returns:
            Not implemented response
        """
        return {
            "success": False,
            "model": "faster-rcnn",
            "status": "not_implemented",
            "message": "Faster R-CNN model is not available yet."
        }
