# DisasterVision Basic Inference

This is the smallest working local YOLOv8 inference project for the disaster-damage detection model.

## Project layout

```text
disaster-vision/
├── models/
│   └── best.pt
├── config/
│   └── data.yaml
├── test_images/
│   └── put_images_here.txt
├── outputs/
├── inference.py
├── requirements.txt
└── README.md
```

## What this does

- Loads the trained YOLOv8m model from `models/best.pt`
- Reads image files from `test_images/`
- Runs detection with a default confidence threshold of `0.25`
- Uses the model's built-in class names
- Saves annotated images into `outputs/`
- Prints class ID, class name, confidence, and bounding box for each detection

## Setup

1. Create a virtual environment.
2. Activate it.
3. Install dependencies with `pip install -r requirements.txt`.
4. Copy your trained `best.pt` into `models/`.
5. Copy your dataset config `data.yaml` into `config/`.
6. Put one or more test images in `test_images/`.
7. Run `python inference.py`.
8. Open the annotated images in `outputs/`.

> On Windows, use PowerShell commands like `py -m venv .venv` and `.
.venv\Scripts\Activate.ps1`.

## Expected output

If the model is working correctly, you should see output similar to:

```text
Processing: disaster.jpg
Saved annotated image: outputs/disaster_result.jpg
Detected object: class_id=1, class_name=minor-damage, confidence=0.87, bbox=[123.45, 89.67, 456.78, 301.12]
Detected object: class_id=3, class_name=destroyed, confidence=0.71, bbox=[540.10, 220.30, 760.40, 510.50]
Total detections: 2
```

The exact class names and bounding boxes will vary by image, but the file should be generated in `outputs/` and the detections should match the trained classes.
