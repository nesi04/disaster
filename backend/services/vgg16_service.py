from pathlib import Path

import torch
import torch.nn as nn
from torchvision.models import vgg16, VGG16_Weights
from PIL import Image


# --------------------------------------------------
# Paths
# --------------------------------------------------

BASE_DIR = Path(__file__).resolve().parents[2]

MODEL_PATH = (
    BASE_DIR
    / "disaster-vision"
    / "models"
    / "vgg16_best.pt"
)


# --------------------------------------------------
# Classes
# --------------------------------------------------

CLASS_NAMES = {
    0: "no-damage",
    1: "minor-damage",
    2: "major-damage",
    3: "destroyed",
    4: "un-classified",
}


# --------------------------------------------------
# Device
# --------------------------------------------------

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")


# --------------------------------------------------
# Model
# --------------------------------------------------

def build_model():
    model = vgg16(weights=None)

    # Replace the final classifier layer
    model.classifier[6] = nn.Linear(
        model.classifier[6].in_features,
        5
    )

    checkpoint = torch.load(
        MODEL_PATH,
        map_location=DEVICE,
        weights_only=False
    )

    model.load_state_dict(checkpoint["model_state_dict"])

    model.to(DEVICE)
    model.eval()

    return model


model = build_model()


# --------------------------------------------------
# Image preprocessing
# --------------------------------------------------

weights = VGG16_Weights.IMAGENET1K_V1

preprocess = weights.transforms()


# --------------------------------------------------
# Prediction
# --------------------------------------------------

def predict(image: Image.Image):

    image = image.convert("RGB")

    tensor = preprocess(image)
    tensor = tensor.unsqueeze(0).to(DEVICE)

    with torch.no_grad():

        outputs = model(tensor)

        probabilities = torch.softmax(outputs, dim=1)

        confidence, predicted_class = torch.max(
            probabilities,
            dim=1
        )

    predicted_class = predicted_class.item()
    confidence = confidence.item()

    probabilities = probabilities[0].cpu().tolist()

    return {
        "predicted_class": CLASS_NAMES[predicted_class],
        "confidence": confidence,
        "probabilities": {
            CLASS_NAMES[i]: probabilities[i]
            for i in range(5)
        },
    }