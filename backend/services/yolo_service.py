import cv2
import numpy as np
from pathlib import Path
from ultralytics import YOLO
from typing import List, Dict, Tuple, Optional
from utils.image_utils import draw_bounding_boxes, save_image


class YOLOService:
    """Service for YOLOv8 disaster damage detection"""
    
    # Class mapping for the trained model
    CLASS_NAMES = {
        0: "no-damage",
        1: "minor-damage",
        2: "major-damage",
        3: "destroyed",
        4: "un-classified"
    }
    
    CLASS_DISPLAY_NAMES = {
        0: "No Damage",
        1: "Minor Damage",
        2: "Major Damage",
        3: "Destroyed",
        4: "Unclassified"
    }
    
    def __init__(self, model_path: str):
        """
        Initialize YOLO service
        
        Args:
            model_path: Path to best.pt model
        """
        self.model = YOLO(model_path)
        self.outputs_dir = Path(__file__).parent.parent.parent / "outputs"
        self.outputs_dir.mkdir(exist_ok=True)
    
    def predict(
        self,
        image: np.ndarray,
        confidence: float = 0.25,
        imgsz: int = 640,
        max_det: int = 1843,
        original_filename: str = "image.jpg"
    ) -> Dict:
        """
        Run YOLO inference
        
        Args:
            image: OpenCV image array
            confidence: Confidence threshold
            imgsz: Input image size
            max_det: Maximum detections
            original_filename: Original uploaded filename
            
        Returns:
            Dictionary with detections and metadata
        """
        try:
            # Run inference
            results = self.model(
                image,
                conf=confidence,
                imgsz=imgsz,
                max_det=max_det
            )
            
            detections = []
            summary = {
                "total_detections": 0,
                "no_damage": 0,
                "minor_damage": 0,
                "major_damage": 0,
                "destroyed": 0,
                "un_classified": 0
            }
            
            # Process results
            if len(results) > 0:
                result = results[0]
                
                if result.boxes is not None:
                    boxes = result.boxes
                    
                    for i in range(len(boxes)):
                        box = boxes[i]
                        
                        # Extract coordinates
                        x1, y1, x2, y2 = box.xyxy[0].tolist()
                        x1, y1, x2, y2 = int(x1), int(y1), int(x2), int(y2)
                        
                        # Extract class and confidence
                        class_id = int(box.cls[0].item())
                        confidence_score = float(box.conf[0].item())
                        class_name = self.CLASS_NAMES.get(class_id, f"unknown")
                        
                        detection = {
                            "class_id": class_id,
                            "class_name": class_name,
                            "confidence": round(confidence_score, 2),
                            "bbox": {
                                "x1": x1,
                                "y1": y1,
                                "x2": x2,
                                "y2": y2
                            }
                        }
                        
                        detections.append(detection)
                        summary["total_detections"] += 1
                        
                        # Update summary count
                        if class_name == "no-damage":
                            summary["no_damage"] += 1
                        elif class_name == "minor-damage":
                            summary["minor_damage"] += 1
                        elif class_name == "major-damage":
                            summary["major_damage"] += 1
                        elif class_name == "destroyed":
                            summary["destroyed"] += 1
                        elif class_name == "un-classified":
                            summary["un_classified"] += 1
            
            # Draw annotations
            annotated_image = draw_bounding_boxes(
                image,
                detections,
                {v: self.CLASS_DISPLAY_NAMES[k] for k, v in self.CLASS_NAMES.items()}
            )
            
            # Save annotated image
            output_filename = f"yolo_{Path(original_filename).stem}_annotated.jpg"
            annotated_url = save_image(annotated_image, output_filename, self.outputs_dir)
            
            return {
                "success": True,
                "model": "yolov8m",
                "image": original_filename,
                "detections": detections,
                "summary": summary,
                "annotated_image_url": annotated_url
            }
            
        except Exception as e:
            return {
                "success": False,
                "model": "yolov8m",
                "error": str(e)
            }
