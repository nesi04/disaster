"""
Model registry: one place that knows every damage-assessment model and
returns their output in a single *normalized* shape, so the comparison
engine, the UI and the AI assistant never need model-specific code.

To plug in a new model (e.g. Faster R-CNN / Mask R-CNN when ready):
  1. Write a `run_<model>(image_bytes, filename, **params)` function that
     returns `normalize_detections(...)` or `normalize_classification(...)`.
  2. Set `available=True` and `runner=run_<model>` on its entry in MODELS.
Nothing else in the compare page or assistant has to change.
"""

from __future__ import annotations

import time
from dataclasses import dataclass, field
from io import BytesIO
from typing import Callable, Dict, List, Optional

from PIL import Image

from utils.image_utils import load_image_from_bytes, get_image_filename_from_bytes


DAMAGE_CLASSES: List[str] = [
    "no-damage",
    "minor-damage",
    "major-damage",
    "destroyed",
    "un-classified",
]

# Severity weight per class (0 = intact, 100 = destroyed).
# "un-classified" has no weight and is excluded from the severity score.
SEVERITY_WEIGHTS: Dict[str, float] = {
    "no-damage": 0.0,
    "minor-damage": 33.0,
    "major-damage": 67.0,
    "destroyed": 100.0,
}


# --------------------------------------------------
# Normalized result helpers
# --------------------------------------------------

def severity_from_distribution(distribution: Dict[str, float]) -> Optional[float]:
    """Weighted severity 0-100 over the classified share of the distribution."""
    mass = sum(distribution.get(c, 0.0) for c in SEVERITY_WEIGHTS)
    if mass <= 0:
        return None
    score = sum(distribution.get(c, 0.0) * w for c, w in SEVERITY_WEIGHTS.items()) / mass
    return round(score, 1)


def severity_label(score: Optional[float]) -> str:
    if score is None:
        return "unknown"
    if score < 15:
        return "low"
    if score < 40:
        return "moderate"
    if score < 70:
        return "high"
    return "critical"


def _base_result(model_id: str) -> Dict:
    spec = MODELS[model_id]
    return {
        "model_id": model_id,
        "display_name": spec.display_name,
        "task": spec.task,
        "success": True,
        "error": None,
    }


def normalize_detections(model_id: str, detections: List[Dict], annotated_image_url: Optional[str]) -> Dict:
    """Normalize an object-detection / instance-segmentation model output."""
    counts = {c: 0 for c in DAMAGE_CLASSES}
    for d in detections:
        name = d.get("class_name", "un-classified")
        counts[name if name in counts else "un-classified"] += 1

    total = sum(counts.values())
    distribution = {c: (counts[c] / total if total else 0.0) for c in DAMAGE_CLASSES}

    if total:
        overall_label = max(DAMAGE_CLASSES, key=lambda c: counts[c])
        overall_conf = round(sum(d["confidence"] for d in detections) / total, 3)
    else:
        overall_label, overall_conf = None, None

    score = severity_from_distribution(distribution)
    result = _base_result(model_id)
    result.update({
        "overall_label": overall_label,
        "overall_confidence": overall_conf,
        "distribution": distribution,
        "counts": counts,
        "total_objects": total,
        "severity_score": score,
        "severity_level": severity_label(score),
        "annotated_image_url": annotated_image_url,
        "detections": detections,
    })
    return result


def normalize_classification(model_id: str, predicted_class: str, confidence: float, probabilities: Dict[str, float]) -> Dict:
    """Normalize an image-classification model output."""
    distribution = {c: float(probabilities.get(c, 0.0)) for c in DAMAGE_CLASSES}
    score = severity_from_distribution(distribution)
    result = _base_result(model_id)
    result.update({
        "overall_label": predicted_class,
        "overall_confidence": round(confidence, 3),
        "distribution": distribution,
        "counts": None,
        "total_objects": None,
        "severity_score": score,
        "severity_level": severity_label(score),
        "annotated_image_url": None,
        "detections": None,
    })
    return result


def failed_result(model_id: str, error: str) -> Dict:
    result = _base_result(model_id)
    result.update({
        "success": False,
        "error": error,
        "overall_label": None,
        "overall_confidence": None,
        "distribution": {c: 0.0 for c in DAMAGE_CLASSES},
        "counts": None,
        "total_objects": None,
        "severity_score": None,
        "severity_level": "unknown",
        "annotated_image_url": None,
        "detections": None,
    })
    return result


# --------------------------------------------------
# Model runners
# --------------------------------------------------

def run_yolo(image_bytes: bytes, filename: str, confidence: float = 0.25, **_) -> Dict:
    from routers.yolo import get_yolo_service  # lazy: loads the model on first use

    image, _size = load_image_from_bytes(image_bytes)
    safe_name = get_image_filename_from_bytes(image_bytes, filename)
    raw = get_yolo_service().predict(
        image, confidence=confidence, imgsz=640, max_det=1843, original_filename=safe_name
    )
    if not raw.get("success"):
        return failed_result("yolo", raw.get("error", "YOLO inference failed"))

    url = raw.get("annotated_image_url")
    if url:
        url = f"{url}?t={int(time.time() * 1000)}"  # bust browser cache on re-runs
    result = normalize_detections("yolo", raw.get("detections", []), url)
    result["params"] = {"confidence": confidence}
    return result


def run_vgg16(image_bytes: bytes, filename: str, **_) -> Dict:
    from services.vgg16_service import predict  # lazy: loads the model on first use

    image = Image.open(BytesIO(image_bytes)).convert("RGB")
    raw = predict(image)
    result = normalize_classification(
        "vgg16", raw["predicted_class"], raw["confidence"], raw["probabilities"]
    )
    result["params"] = {}
    return result


# --------------------------------------------------
# Registry
# --------------------------------------------------

@dataclass
class ModelSpec:
    id: str
    display_name: str
    task: str  # "detection" | "classification" | "segmentation"
    description: str
    available: bool
    runner: Optional[Callable[..., Dict]] = None
    params: List[str] = field(default_factory=list)  # tunable params the runner accepts

    def public(self) -> Dict:
        return {
            "id": self.id,
            "display_name": self.display_name,
            "task": self.task,
            "description": self.description,
            "available": self.available,
            "params": self.params,
        }


MODELS: Dict[str, ModelSpec] = {
    "yolo": ModelSpec(
        id="yolo",
        display_name="YOLOv8m",
        task="detection",
        description="Detects each building and classifies its damage level.",
        available=True,
        runner=run_yolo,
        params=["confidence"],
    ),
    "vgg16": ModelSpec(
        id="vgg16",
        display_name="VGG16",
        task="classification",
        description="Classifies the whole image into a single damage level.",
        available=True,
        runner=run_vgg16,
    ),
    # Placeholders until dev2 delivers the models — set available=True + runner.
    "faster_rcnn": ModelSpec(
        id="faster_rcnn",
        display_name="Faster R-CNN",
        task="detection",
        description="Two-stage building detection with damage classification.",
        available=False,
        params=["confidence"],
    ),
    "mask_rcnn": ModelSpec(
        id="mask_rcnn",
        display_name="Mask R-CNN",
        task="segmentation",
        description="Pixel-level building footprints with damage classification.",
        available=False,
        params=["confidence"],
    ),
}


def list_models() -> List[Dict]:
    return [m.public() for m in MODELS.values()]


def run_model(model_id: str, image_bytes: bytes, filename: str, **params) -> Dict:
    spec = MODELS.get(model_id)
    if spec is None:
        return failed_result_unknown(model_id)
    if not spec.available or spec.runner is None:
        return failed_result(model_id, f"{spec.display_name} is not available yet.")

    start = time.perf_counter()
    try:
        accepted = {k: v for k, v in params.items() if k in spec.params and v is not None}
        result = spec.runner(image_bytes, filename, **accepted)
    except Exception as e:  # keep one failing model from breaking the comparison
        result = failed_result(model_id, str(e))
    result["inference_ms"] = round((time.perf_counter() - start) * 1000)
    return result


def failed_result_unknown(model_id: str) -> Dict:
    return {
        "model_id": model_id,
        "display_name": model_id,
        "task": "unknown",
        "success": False,
        "error": f"Unknown model '{model_id}'",
        "overall_label": None,
        "overall_confidence": None,
        "distribution": {c: 0.0 for c in DAMAGE_CLASSES},
        "counts": None,
        "total_objects": None,
        "severity_score": None,
        "severity_level": "unknown",
        "annotated_image_url": None,
        "detections": None,
        "inference_ms": 0,
    }
