export interface BoundingBox {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export interface Detection {
  class_id: number;
  class_name: string;
  confidence: number;
  bbox: BoundingBox;
}

export interface PredictionSummary {
  total_detections: number;
  no_damage: number;
  minor_damage: number;
  major_damage: number;
  destroyed: number;
  un_classified: number;
}
export type VGG16Class =
  | "no-damage"
  | "minor-damage"
  | "major-damage"
  | "destroyed"
  | "un-classified";

export interface VGG16Probabilities {
  "no-damage": number;
  "minor-damage": number;
  "major-damage": number;
  destroyed: number;
  "un-classified": number;
}

export interface VGG16PredictionResponse {
  success: boolean;
  model: string;
  predicted_class: VGG16Class;
  confidence: number;
  probabilities: VGG16Probabilities;
  error?: string;
}

export interface YOLOPredictionResponse {
  success: boolean;
  model: string;
  image?: string;
  detections?: Detection[];
  summary?: PredictionSummary;
  annotated_image_url?: string;
  error?: string;
}

export interface NotImplementedResponse {
  success: boolean;
  model: string;
  status: string;
  message: string;
}

export interface PredictionResponse extends YOLOPredictionResponse, NotImplementedResponse {}

export interface ModelStatus {
  name: string;
  task: string;
  status: "available" | "coming_soon";
  route: string;
}

export interface HealthCheckResponse {
  status: string;
  service: string;
  version: string;
}
