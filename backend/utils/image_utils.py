import cv2
import numpy as np
from pathlib import Path
from typing import Tuple, Optional
from PIL import Image


def save_image(image_array: np.ndarray, filename: str, outputs_dir: Path) -> str:
    """
    Save image array to disk
    
    Args:
        image_array: OpenCV image array (BGR)
        filename: Filename to save as
        outputs_dir: Directory to save the image
        
    Returns:
        Path to saved image relative to outputs directory
    """
    outputs_dir.mkdir(exist_ok=True)
    
    # Convert BGR to RGB for proper color display
    if len(image_array.shape) == 3 and image_array.shape[2] == 3:
        image_array = cv2.cvtColor(image_array, cv2.COLOR_BGR2RGB)
    
    output_path = outputs_dir / filename
    cv2.imwrite(str(output_path), image_array)
    
    return f"/outputs/{filename}"


def load_image_from_bytes(file_bytes: bytes) -> Tuple[np.ndarray, Tuple[int, int]]:
    """
    Load image from bytes and return OpenCV array
    
    Args:
        file_bytes: Image file bytes
        
    Returns:
        Tuple of (image_array, original_size)
    """
    nparr = np.frombuffer(file_bytes, np.uint8)
    image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    
    if image is None:
        raise ValueError("Could not decode image")
    
    original_size = (image.shape[1], image.shape[0])  # (width, height)
    return image, original_size


def draw_bounding_boxes(
    image: np.ndarray,
    detections: list,
    class_names: dict
) -> np.ndarray:
    """
    Draw bounding boxes on image
    
    Args:
        image: OpenCV image array
        detections: List of detection dictionaries with class_id, confidence, bbox
        class_names: Dictionary mapping class_id to class name
        
    Returns:
        Image with drawn bounding boxes
    """
    annotated = image.copy()
    
    for detection in detections:
        bbox = detection["bbox"]
        x1, y1, x2, y2 = bbox["x1"], bbox["y1"], bbox["x2"], bbox["y2"]
        confidence = detection["confidence"]
        class_id = detection["class_id"]
        class_name = class_names.get(class_id, f"Class {class_id}")
        
        # Draw rectangle
        cv2.rectangle(annotated, (x1, y1), (x2, y2), (0, 255, 0), 2)
        
        # Draw label
        label = f"{class_name}: {confidence:.2f}"
        label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
        
        cv2.rectangle(
            annotated,
            (x1, y1 - label_size[1] - 4),
            (x1 + label_size[0], y1),
            (0, 255, 0),
            -1
        )
        cv2.putText(
            annotated,
            label,
            (x1, y1 - 2),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.5,
            (0, 0, 0),
            1
        )
    
    return annotated


def get_image_filename_from_bytes(file_bytes: bytes, original_name: str) -> str:
    """
    Get a safe filename from uploaded file
    
    Args:
        file_bytes: Image file bytes
        original_name: Original filename from upload
        
    Returns:
        Safe filename to use
    """
    # Remove any path components and special characters
    safe_name = Path(original_name).name.replace(" ", "_").replace(":", "_")
    
    if not safe_name:
        safe_name = "image.jpg"
    
    return safe_name
