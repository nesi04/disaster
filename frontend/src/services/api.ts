import axios, { AxiosInstance } from "axios";
import {
  YOLOPredictionResponse,
  NotImplementedResponse as ModelNotImplementedResponse,
  HealthCheckResponse as HealthResponse,
 
} from "../types/prediction";
import {
  VGG16PredictionResponse,
} from "../types/prediction";

import {
  Analysis,
  AssistantStatus,
  ChatResponse,
  ModelInfo,
} from "../types/analysis";

export const API_URL: string =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

/** Pull the FastAPI `detail` message out of an axios error. */
function errorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    if (!error.response) return "Cannot reach the backend. Is it running on " + API_URL + "?";
  }
  return error instanceof Error ? error.message : fallback;
}

class APIClient {
  private client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  async getHealth(): Promise<HealthResponse> {
    try {
      const response = await this.client.get<HealthResponse>("/api/health");
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get health status: ${error}`);
    }
  }

  async predictYOLO(
    file: File,
    confidence: number = 0.25
  ): Promise<YOLOPredictionResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("confidence", confidence.toString());

      const response = await this.client.post<YOLOPredictionResponse>(
        "/api/predict/yolo",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`YOLO prediction failed: ${error}`);
    }
  }

  async predictFasterRCNN(
    file: File,
    confidence: number = 0.25
  ): Promise<ModelNotImplementedResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("confidence", confidence.toString());

      const response = await this.client.post<ModelNotImplementedResponse>(
        "/api/predict/faster-rcnn",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Faster R-CNN prediction failed: ${error}`);
    }
  }

  async predictMaskRCNN(
    file: File,
    confidence: number = 0.25
  ): Promise<ModelNotImplementedResponse> {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("confidence", confidence.toString());

      const response = await this.client.post<ModelNotImplementedResponse>(
        "/api/predict/mask-rcnn",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    } catch (error) {
      throw new Error(`Mask R-CNN prediction failed: ${error}`);
    }
  }

  // ---------- Multi-model comparison + AI assistant ----------

  async listModels(): Promise<ModelInfo[]> {
    try {
      const res = await this.client.get<{ models: ModelInfo[] }>("/api/models");
      return res.data.models;
    } catch (error) {
      throw new Error(errorMessage(error, "Failed to load models"));
    }
  }

  async analyze(file: File, models: string[], confidence: number): Promise<Analysis> {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("models", models.join(","));
    formData.append("confidence", confidence.toString());
    try {
      const res = await this.client.post<Analysis>("/api/analyze", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    } catch (error) {
      throw new Error(errorMessage(error, "Analysis failed"));
    }
  }

  async assistantStatus(): Promise<AssistantStatus> {
    try {
      const res = await this.client.get("/api/assistant/status");
      return res.data;
    } catch {
      return { configured: false, provider: "", model: "", vision: false, key_url: null };
    }
  }

  async chat(analysisId: string, message: string): Promise<ChatResponse> {
    try {
      const res = await this.client.post<ChatResponse>(
        `/api/assistant/${analysisId}/chat`,
        { message },
        { timeout: 180_000 }
      );
      return res.data;
    } catch (error) {
      throw new Error(errorMessage(error, "Assistant request failed"));
    }
  }

  async predictVGG16(
  file: File
): Promise<VGG16PredictionResponse> {
  const formData = new FormData();

  formData.append("file", file);

  const response = await fetch(
    `${API_URL}/api/predict/vgg16`,
    {
      method: "POST",
      body: formData,
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.error ||
        data?.message ||
        "VGG16 prediction failed."
    );
  }

  return data;
}
}


  
export const apiClient = new APIClient(API_URL);
