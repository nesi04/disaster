"""Mask R-CNN Service - Placeholder for future implementation"""


class MaskRCNNService:
    """Service for Mask R-CNN instance segmentation"""
    
    def __init__(self, model_path: str = None):
        """
        Initialize Mask R-CNN service
        
        Args:
            model_path: Path to model (not implemented yet)
        """
        pass
    
    def predict(self, image, **kwargs):
        """
        Mask R-CNN inference - Not implemented yet
        
        Returns:
            Not implemented response
        """
        return {
            "success": False,
            "model": "mask-rcnn",
            "status": "not_implemented",
            "message": "Mask R-CNN model is not available yet."
        }
