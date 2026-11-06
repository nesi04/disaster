# Comprehensive Setup and Running Instructions

## PROJECT STRUCTURE

```
disaster-vision/
├── backend/
│   ├── main.py                          # FastAPI application entry point
│   ├── requirements.txt                 # Python dependencies
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── yolo.py                      # YOLOv8m endpoint
│   │   ├── faster_rcnn.py               # Faster R-CNN endpoint (not implemented)
│   │   ├── mask_rcnn.py                 # Mask R-CNN endpoint (not implemented)
│   │   └── vgg16.py                     # VGG16 endpoint (not implemented)
│   ├── services/
│   │   ├── __init__.py
│   │   ├── yolo_service.py              # YOLO inference service
│   │   ├── faster_rcnn_service.py       # Faster R-CNN service (placeholder)
│   │   ├── mask_rcnn_service.py         # Mask R-CNN service (placeholder)
│   │   └── vgg16_service.py             # VGG16 service (placeholder)
│   └── utils/
│       ├── __init__.py
│       └── image_utils.py               # Image processing utilities
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx               # Navigation bar
│   │   │   ├── ModelCard.tsx            # Model display card
│   │   │   ├── ImageUploader.tsx        # File upload component
│   │   │   ├── DetectionResults.tsx     # Results display
│   │   │   ├── ModelStatus.tsx          # Model status indicator
│   │   │   └── Loading.tsx              # Loading spinner
│   │   ├── pages/
│   │   │   ├── Home.tsx                 # Dashboard/home page
│   │   │   ├── YoloPage.tsx             # YOLO model page
│   │   │   ├── FasterRCNNPage.tsx       # Faster R-CNN page
│   │   │   ├── MaskRCNNPage.tsx         # Mask R-CNN page
│   │   │   ├── VGG16Page.tsx            # VGG16 page
│   │   │   └── ModelsPage.tsx           # Models comparison page
│   │   ├── services/
│   │   │   └── api.ts                   # API client
│   │   ├── types/
│   │   │   └── prediction.ts            # TypeScript type definitions
│   │   ├── App.tsx                      # Main app component with routing
│   │   ├── main.tsx                     # React entry point
│   │   └── index.css                    # Global styles
│   ├── index.html                       # HTML template
│   ├── package.json                     # Node.js dependencies
│   ├── vite.config.ts                   # Vite configuration
│   ├── tailwind.config.ts               # Tailwind CSS configuration
│   ├── tsconfig.json                    # TypeScript configuration
│   └── .env.example                     # Environment variables template
│
├── models/
│   └── best.pt                          # YOLOv8m model (pre-trained)
├── config/
│   └── data.yaml                        # Dataset configuration
├── test_images/                         # Sample test images
├── outputs/                             # Generated annotated images
├── README.md                            # Project documentation
└── requirements.txt                     # (Root level - for reference)
```

---

## INSTALLATION

### Prerequisites
- Python 3.8+ (recommended: 3.10 or 3.11)
- Node.js 16+ and npm
- Git

### Step 1: Clone and Navigate

```bash
cd disaster-vision
```

### Step 2: Backend Setup

#### Create Virtual Environment (Optional but Recommended)

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

#### Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
cd ..
```

### Step 3: Frontend Setup

```bash
cd frontend
npm install
cd ..
```

---

## RUNNING THE APPLICATION

### Start Backend (Terminal 1)

```bash
cd backend
uvicorn main:app --reload
```

Expected output:
```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Application startup complete
```

Access FastAPI documentation: http://localhost:8000/docs

### Start Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

Expected output:
```
  VITE v5.0.8  ready in 123 ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

Access frontend: http://localhost:5173

---

## API ENDPOINTS

### Health Check
```bash
GET http://localhost:8000/api/health
```

Response:
```json
{
  "status": "healthy",
  "service": "Disaster Damage Assessment API",
  "version": "1.0.0"
}
```

### YOLOv8m Detection (WORKING)
```bash
POST http://localhost:8000/api/predict/yolo
Content-Type: multipart/form-data

Parameters:
  - file: <image_file>
  - confidence: 0.25 (optional, default: 0.25)
```

**Example using cURL:**
```bash
curl -X POST "http://localhost:8000/api/predict/yolo" \
  -H "accept: application/json" \
  -F "file=@/path/to/image.jpg" \
  -F "confidence=0.25"
```

**Response (Success):**
```json
{
  "success": true,
  "model": "yolov8m",
  "image": "image.jpg",
  "detections": [
    {
      "class_id": 2,
      "class_name": "major-damage",
      "confidence": 0.87,
      "bbox": {
        "x1": 120,
        "y1": 80,
        "x2": 300,
        "y2": 250
      }
    }
  ],
  "summary": {
    "total_detections": 15,
    "no_damage": 4,
    "minor_damage": 3,
    "major_damage": 5,
    "destroyed": 2,
    "un_classified": 1
  },
  "annotated_image_url": "/outputs/image_annotated.jpg"
}
```

### Faster R-CNN Detection (NOT IMPLEMENTED)
```bash
POST http://localhost:8000/api/predict/faster-rcnn
Content-Type: multipart/form-data
```

**Response:**
```json
{
  "success": false,
  "model": "faster-rcnn",
  "status": "not_implemented",
  "message": "Faster R-CNN model is not available yet."
}
```

### Mask R-CNN Segmentation (NOT IMPLEMENTED)
```bash
POST http://localhost:8000/api/predict/mask-rcnn
Content-Type: multipart/form-data
```

**Response:**
```json
{
  "success": false,
  "model": "mask-rcnn",
  "status": "not_implemented",
  "message": "Mask R-CNN model is not available yet."
}
```

### VGG16 Classification (NOT IMPLEMENTED)
```bash
POST http://localhost:8000/api/predict/vgg16
Content-Type: multipart/form-data
```

**Response:**
```json
{
  "success": false,
  "model": "vgg16",
  "status": "not_implemented",
  "message": "VGG16 model is not available yet."
}
```

---

## FRONTEND ROUTES

| Route | Page | Status |
|-------|------|--------|
| `/` | Home/Dashboard | ✓ Available |
| `/yolo` | YOLOv8m Detector | ✓ Available |
| `/faster-rcnn` | Faster R-CNN Info | ✓ Available (Placeholder) |
| `/mask-rcnn` | Mask R-CNN Info | ✓ Available (Placeholder) |
| `/vgg16` | VGG16 Info | ✓ Available (Placeholder) |
| `/models` | Model Comparison | ✓ Available |

---

## ADDING NEW MODELS

### How to Implement Faster R-CNN

1. **Update Service** (`backend/services/faster_rcnn_service.py`):
   ```python
   class FasterRCNNService:
       def __init__(self, model_path: str):
           self.model = load_model(model_path)  # Your loading logic
       
       def predict(self, image, confidence: float = 0.25):
           # Run inference
           results = self.model.predict(image, conf=confidence)
           
           # Format results
           return {
               "success": True,
               "model": "faster-rcnn",
               "detections": [...],
               "summary": {...}
           }
   ```

2. **Update Router** (`backend/routers/faster_rcnn.py`):
   ```python
   # Change the predict endpoint to use the real service
   service = FasterRCNNService("models/faster_rcnn_model.pth")
   result = service.predict(image_array, confidence)
   ```

3. **Update Frontend** (`frontend/src/pages/FasterRCNNPage.tsx`):
   - Change status from "coming_soon" to "available"
   - Import ImageUploader and DetectionResults components
   - Add file upload and inference logic similar to YoloPage

### Steps for All Models:

1. Place model file in `models/` directory
2. Update service class with inference logic
3. Update router to use real service instead of placeholder
4. Update frontend page to match YoloPage UI pattern
5. Update model status in Home.tsx and ModelsPage.tsx

---

## DEVELOPMENT NOTES

### Backend
- FastAPI auto-reloads when `--reload` flag is used
- Annotated images are saved to `outputs/` directory
- Static files are served at `/outputs/` URL path
- CORS is configured for localhost:3000 and localhost:5173

### Frontend
- Vite provides hot module replacement (HMM) for fast development
- TypeScript provides type safety for API responses
- Tailwind CSS for styling
- React Router for navigation
- Axios for API calls

### Class Mapping (YOLOv8m)
- 0 = no-damage
- 1 = minor-damage
- 2 = major-damage
- 3 = destroyed
- 4 = un-classified

---

## TROUBLESHOOTING

### Backend won't start
- Check if port 8000 is already in use: `lsof -i :8000` (macOS/Linux) or `netstat -ano | findstr :8000` (Windows)
- Ensure model file exists at `models/best.pt`
- Verify Python 3.8+ is installed: `python --version`

### Frontend won't start
- Delete `node_modules` and `package-lock.json`, then run `npm install` again
- Check Node.js version: `node --version` (should be 16+)
- Ensure port 5173 is available

### Model files not found
- Verify `best.pt` is in the `models/` directory
- Check file permissions

### CORS errors
- Verify backend is running on http://localhost:8000
- Check CORS origins in `backend/main.py`
- Ensure frontend is accessing correct API_URL in `frontend/src/services/api.ts`

---

## PRODUCTION DEPLOYMENT

For production deployment:

1. Update `frontend/.env` with production API URL
2. Build frontend: `cd frontend && npm run build`
3. Run backend without `--reload`: `cd backend && uvicorn main:app --host 0.0.0.0 --port 8000`
4. Serve frontend with a static server or CDN
5. Update CORS origins to production domains

---

## SUPPORT

For issues or questions:
1. Check FastAPI docs: http://localhost:8000/docs
2. Review error messages in terminal
3. Check frontend browser console for errors (F12)
