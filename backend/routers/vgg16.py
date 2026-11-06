from fastapi import APIRouter, File, UploadFile, HTTPException
from PIL import Image
from io import BytesIO

from services.vgg16_service import predict

router = APIRouter(prefix="/api/predict", tags=["VGG16"])


@router.post("/vgg16")
async def predict_vgg16(file: UploadFile = File(...)):
    try:
        contents = await file.read()

        image = Image.open(BytesIO(contents)).convert("RGB")

        result = predict(image)

        return {
            "success": True,
            "model": "VGG16",
            "image_size": {
                "width": image.width,
                "height": image.height
            },
            **result
        }

    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=str(e)
        )