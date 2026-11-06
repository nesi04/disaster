from __future__ import annotations

import argparse
from pathlib import Path

from ultralytics import YOLO


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run YOLOv8 inference on disaster images.")
    parser.add_argument(
        "--model",
        type=Path,
        default=Path("models/best.pt"),
        help="Path to the trained YOLO model (.pt file).",
    )
    parser.add_argument(
        "--images-dir",
        type=Path,
        default=Path("test_images"),
        help="Directory containing input images to test.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("outputs"),
        help="Directory where annotated results will be saved.",
    )
    parser.add_argument(
        "--conf",
        type=float,
        default=0.25,
        help="Minimum confidence threshold for detections. Default: 0.25",
    )
    parser.add_argument(
        "--imgsz",
        type=int,
        default=640,
        help="Input image size used for inference. Default: 640",
    )
    return parser.parse_args()


def find_image_files(images_dir: Path) -> list[Path]:
    allowed_exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tif", ".tiff"}
    return sorted(
        p for p in images_dir.iterdir() if p.is_file() and p.suffix.lower() in allowed_exts
    )


def print_detection_details(result, model: YOLO) -> None:
    if len(result.boxes) == 0:
        print("No objects detected above the confidence threshold.")
        return

    for box in result.boxes:
        class_id = int(box.cls.item())
        class_name = model.names.get(class_id, str(class_id))
        confidence = float(box.conf.item())
        x1, y1, x2, y2 = box.xyxy[0].tolist()

        print(
            "Detected object: "
            f"class_id={class_id}, "
            f"class_name={class_name}, "
            f"confidence={confidence:.4f}, "
            f"bbox=[{x1:.2f}, {y1:.2f}, {x2:.2f}, {y2:.2f}]"
        )


def main() -> None:
    args = parse_args()

    model_path = args.model
    images_dir = args.images_dir
    output_dir = args.output_dir

    if not model_path.exists():
        raise FileNotFoundError(
            f"Model file not found: {model_path}. "
            "Place your trained YOLO model in the models/ folder as models/best.pt."
        )

    if not images_dir.exists():
        raise FileNotFoundError(
            f"Image folder not found: {images_dir}. "
            "Create the folder and add one or more test images."
        )

    image_files = find_image_files(images_dir)
    if not image_files:
        raise FileNotFoundError(
            f"No images were found in {images_dir}. "
            "Add a JPG/PNG image to the test_images folder and run again."
        )

    output_dir.mkdir(parents=True, exist_ok=True)

    model = YOLO(str(model_path))

    for image_path in image_files:
        print(f"\nProcessing: {image_path.name}")
        results = model.predict(
            source=str(image_path),
            conf=args.conf,
            imgsz=args.imgsz,
            max_det=1843,
            verbose=False,
        )

        result = results[0]
        save_path = output_dir / f"{image_path.stem}_result.jpg"
        result.save(filename=str(save_path))
        print(f"Saved annotated image: {save_path}")

        print_detection_details(result, model)
        print(f"Total detections: {len(result.boxes)}")


if __name__ == "__main__":
    main()
