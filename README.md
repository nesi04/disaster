# 🛰️ Disaster Vision - Disaster Damage Assessment System

A modern AI-powered system for assessing disaster damage using computer vision. The project features a FastAPI backend with multiple deep learning models and a React TypeScript frontend for intuitive damage analysis.

**Status**: YOLOv8m and VGG16 are operational and can be compared side by side with an AI analyst (`/compare`). Faster R-CNN and Mask R-CNN are in development.

---

## 🎯 Features

- **Real-time Damage Detection**: YOLOv8m object detection for rapid building damage assessment
- **Multi-Model Architecture**: Extensible framework supporting 4 different vision models
- **Clean Web Interface**: Modern React TypeScript frontend with Tailwind CSS styling
- **API Documentation**: Interactive Swagger UI for testing endpoints
- **Annotated Results**: Automatic image annotation with detection overlays
- **Responsive Design**: Mobile-friendly interface suitable for field deployment
- **Modular Design**: Easy to add new models and features without redesigning existing code

---

## 🏗️ Architecture

### Backend Stack
- **FastAPI** - Modern Python web framework
- **YOLOv8** - State-of-the-art object detection
- **OpenCV** - Image processing
- **Python 3.10+**

### Frontend Stack
- **React 18** - UI framework
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Lightning-fast build tool
- **React Router** - Client-side routing
- **Axios** - HTTP client

### Models

| Model | Task | Status | Location |
|-------|------|--------|----------|
| **YOLOv8m** | Object Detection | ✓ Available | `models/best.pt` |
| **Faster R-CNN** | Object Detection | 🚧 Coming Soon | - |
| **Mask R-CNN** | Instance Segmentation | 🚧 Coming Soon | - |
| **VGG16** | Building Classification | 🚧 Coming Soon | - |

---

## 📁 Project Structure

```
disaster-vision/
├── backend/                    # FastAPI backend
│   ├── main.py                 # Application entry point
│   ├── requirements.txt        # Python dependencies
│   ├── routers/                # API endpoints (4 models)
│   ├── services/               # Model inference logic
│   └── utils/                  # Image processing utilities
│
├── frontend/                   # React TypeScript frontend
│   ├── src/
│   │   ├── components/         # Reusable React components
│   │   ├── pages/              # Page components (6 pages)
│   │   ├── services/           # API client
│   │   ├── types/              # TypeScript interfaces
│   │   ├── App.tsx             # Main app with routing
│   │   ├── main.tsx            # React entry point
│   │   └── index.css           # Global styles
│   ├── package.json            # Node dependencies
│   ├── vite.config.ts          # Vite config
│   └── tailwind.config.ts      # Tailwind config
│
├── models/
│   └── best.pt                 # YOLOv8m model (pre-trained)
├── config/
│   └── data.yaml               # Dataset config
├── test_images/                # Sample images
├── outputs/                    # Generated annotated images
├── README.md                   # This file
└── SETUP_INSTRUCTIONS.md       # Detailed setup guide
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 16+
- Model file `models/best.pt` must exist

### 1. Install Backend Dependencies

```bash
cd backend
pip install -r requirements.txt
cd ..
```

### 2. Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

### 3. Start Backend

```bash
cd backend
uvicorn main:app --reload
```

The API will be available at: **http://localhost:8000**
- Interactive docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### 4. Start Frontend

```bash
cd frontend
npm run dev
```

The frontend will be available at: **http://localhost:5173**

---

## ⚖️ Model Comparison + 🤖 AI Analyst

Open **http://localhost:5173/compare**. Upload one image, pick models, and you get:

- Per-model cards (annotated image, class breakdown, severity score 0–100)
- A comparison panel: agreement level, consensus severity, key differences, per-class chart, pairwise table
- An **AI analyst** (any free LLM: Gemini, Groq, OpenRouter or local Ollama) that reads all results and can take actions:
  re-run a model at another confidence threshold, set a response priority (logged to
  `outputs/incident_log.jsonl`), and save markdown reports (`outputs/reports/`)

**Setup (free):** copy `backend/.env.example` to `backend/.env`, set `AI_PROVIDER` (default `gemini`) and
`AI_API_KEY` (free key from https://aistudio.google.com/apikey), run `pip install -r backend/requirements.txt`, and restart the backend.
For a fully offline setup use `AI_PROVIDER=ollama` (no key). If the model can't read images or call tools, the analyst
falls back automatically. Without a key, comparison still works and the chat shows a setup hint.

**Endpoints:** `GET /api/models` · `POST /api/analyze` (file, models=`yolo,vgg16`, confidence) ·
`GET /api/analyze/{id}` · `GET /api/assistant/status` · `POST /api/assistant/{id}/chat` (`{"message": "..."}`)

**Adding Faster R-CNN / Mask R-CNN:** in `backend/services/model_registry.py`, write a
`run_<model>()` that returns `normalize_detections(...)`, then set `available=True` and
`runner=run_<model>` on its `MODELS` entry. The compare page, chart and AI analyst pick it up automatically.

Analyses are kept in memory (lost on backend restart).

---

## 📖 API Endpoints

### Health Check
```bash
GET /api/health
```

### YOLOv8m (Working ✓)
```bash
POST /api/predict/yolo
Content-Type: multipart/form-data

Parameters:
  - file: <image_file>
  - confidence: 0.25 (optional)
```

Example using cURL:
```bash
curl -X POST "http://localhost:8000/api/predict/yolo" \
  -F "file=@test_image.jpg" \
  -F "confidence=0.25"
```

**Response:**
```json
{
  "success": true,
  "model": "yolov8m",
  "image": "test_image.jpg",
  "detections": [
    {
      "class_id": 2,
      "class_name": "major-damage",
      "confidence": 0.87,
      "bbox": {"x1": 120, "y1": 80, "x2": 300, "y2": 250}
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
  "annotated_image_url": "/outputs/test_image_annotated.jpg"
}
```

### Faster R-CNN (Not Implemented)
```bash
POST /api/predict/faster-rcnn
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

### Mask R-CNN (Not Implemented)
```bash
POST /api/predict/mask-rcnn
```

### VGG16 (Not Implemented)
```bash
POST /api/predict/vgg16
```

---

## 🌐 Frontend Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/` | Home | Dashboard with model cards |
| `/yolo` | YoloPage | YOLO detector interface |
| `/faster-rcnn` | FasterRCNNPage | Coming soon placeholder |
| `/mask-rcnn` | MaskRCNNPage | Coming soon placeholder |
| `/vgg16` | VGG16Page | Coming soon placeholder |
| `/models` | ModelsPage | Model comparison table |

---

## 💻 Frontend Components

- **Navbar**: Navigation header with branding
- **ModelCard**: Displays model status and information
- **ImageUploader**: Drag-and-drop file upload with preview
- **DetectionResults**: Displays annotated images and statistics
- **ModelStatus**: Shows model availability status
- **Loading**: Animated loading spinner during inference

---

## 🔧 Adding New Models

To add Faster R-CNN when training is complete:

### 1. Update Service
Edit `backend/services/faster_rcnn_service.py`:
```python
class FasterRCNNService:
    def __init__(self, model_path: str):
        self.model = load_model(model_path)  # Your loading code
    
    def predict(self, image, confidence: float = 0.25):
        # Run inference
        results = self.model.predict(image, conf=confidence)
        return {
            "success": True,
            "model": "faster-rcnn",
            "detections": [...],
            "summary": {...}
        }
```

### 2. Update Router
Edit `backend/routers/faster_rcnn.py` to use real service

### 3. Update Frontend
Update `frontend/src/pages/FasterRCNNPage.tsx`:
- Change status from "coming_soon" to "available"
- Add image upload and inference logic
- Display results using DetectionResults component

---

## 📊 Class Mapping (YOLOv8m)

```
0 = no-damage
1 = minor-damage
2 = major-damage
3 = destroyed
4 = un-classified
```

---

## 🔐 CORS Configuration

The backend allows requests from:
- http://localhost:3000
- http://localhost:5173
- http://127.0.0.1:3000
- http://127.0.0.1:5173

Modify `backend/main.py` to add production domains.

---

## 📦 Dependencies

### Backend
- fastapi==0.104.1
- uvicorn==0.24.0
- ultralytics==8.0.232
- opencv-python==4.8.1.78
- torch==2.1.0
- numpy==1.24.3
- pillow==10.1.0

### Frontend
- react@18.2.0
- react-dom@18.2.0
- react-router-dom@6.20.0
- axios@1.6.2
- tailwindcss@3.3.6
- typescript@5.2.2
- vite@5.0.8

---

## 🛠️ Development

### Backend Development
- Model files are loaded lazily on first request
- Changes to `main.py` auto-reload with `--reload` flag
- Annotated images saved to `outputs/` directory
- Static files served at `/outputs/` path

### Frontend Development
- Hot Module Replacement (HMR) with Vite
- TypeScript for type safety
- Tailwind CSS for styling
- Environment variables in `.env` or `.env.example`

### Testing YOLO Endpoint
Use FastAPI interactive docs: http://localhost:8000/docs

---

## 📚 Key Files

| File | Purpose |
|------|---------|
| `backend/main.py` | FastAPI app setup and routing |
| `backend/services/yolo_service.py` | YOLO inference logic |
| `backend/utils/image_utils.py` | Image processing helpers |
| `frontend/src/services/api.ts` | API client for frontend |
| `frontend/src/App.tsx` | Main React app with routing |
| `frontend/src/pages/YoloPage.tsx` | YOLO interface |
| `SETUP_INSTRUCTIONS.md` | Detailed setup and deployment guide |

---

## 🚀 Deployment

### Backend
```bash
cd backend
# Production: without --reload
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm run build
# Serve dist/ folder with Nginx, Apache, or CDN
```

---

## 📝 Notes

- ✓ YOLOv8m is fully functional and tested
- 🚧 Other models are placeholders - will integrate as they complete training
- 📸 Annotated images are automatically saved to `outputs/`
- 🔒 No database or authentication implemented yet (for future)
- 📱 UI is responsive and mobile-friendly
- ⚡ Uses async/await for non-blocking operations

---

## 🤝 Contributing

To add a new model:
1. Create model service in `backend/services/`
2. Create router in `backend/routers/`
3. Update `backend/main.py` to include router
4. Create/update page in `frontend/src/pages/`
5. Update model list in `frontend/src/pages/Home.tsx`

---

## 📞 Support

For setup help, see `SETUP_INSTRUCTIONS.md`

### Common Issues
- **Port already in use**: Change port in startup command
- **Model not found**: Verify `models/best.pt` exists
- **CORS errors**: Check frontend `.env` file has correct API_URL
- **Module not found**: Run `pip install -r requirements.txt` in backend

---

## 📄 License

This project is for educational and demonstration purposes.

---

**Created for Disaster Damage Assessment** | Built with ❤️
