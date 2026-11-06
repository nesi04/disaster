import { Detection } from "./prediction";

export type DamageClass =
  | "no-damage"
  | "minor-damage"
  | "major-damage"
  | "destroyed"
  | "un-classified";

export const DAMAGE_CLASSES: DamageClass[] = [
  "no-damage",
  "minor-damage",
  "major-damage",
  "destroyed",
  "un-classified",
];

export const DAMAGE_LABELS: Record<DamageClass, string> = {
  "no-damage": "No damage",
  "minor-damage": "Minor damage",
  "major-damage": "Major damage",
  destroyed: "Destroyed",
  "un-classified": "Unclassified",
};

export type ModelTask = "detection" | "classification" | "segmentation";
export type SeverityLevel = "low" | "moderate" | "high" | "critical" | "unknown";

export interface ModelInfo {
  id: string;
  display_name: string;
  task: ModelTask;
  description: string;
  available: boolean;
  params: string[];
}

export interface ModelResult {
  model_id: string;
  display_name: string;
  task: ModelTask;
  success: boolean;
  error: string | null;
  overall_label: DamageClass | null;
  overall_confidence: number | null;
  distribution: Record<DamageClass, number>;
  counts: Record<DamageClass, number> | null;
  total_objects: number | null;
  severity_score: number | null;
  severity_level: SeverityLevel;
  annotated_image_url: string | null;
  detections: Detection[] | null;
  inference_ms: number;
  params?: Record<string, number>;
}

export interface PairwiseComparison {
  models: [string, string];
  same_label: boolean;
  label_gap: number | null;
  severity_gap: number | null;
  distribution_distance: number;
}

export interface Comparison {
  models_compared: string[];
  agreement: "high" | "medium" | "low" | "single-model" | "none";
  label_agreement: boolean;
  consensus_label: DamageClass | null;
  consensus_distribution?: Record<DamageClass, number>;
  consensus_severity: number | null;
  consensus_level: SeverityLevel;
  severity_spread: number | null;
  pairwise: PairwiseComparison[];
  class_differences: { class: DamageClass; values: Record<string, number>; spread: number }[];
  findings: string[];
}

export interface Priority {
  level: "P1-critical" | "P2-high" | "P3-moderate" | "P4-low";
  reason: string;
  recommended_actions: string[];
  set_at: string;
}

export interface AssistantAction {
  type: "get_detections" | "rerun_model" | "set_priority" | "save_report";
  summary: string;
  url?: string;
  at?: string;
}

export interface ChatEntry {
  role: "user" | "assistant";
  text: string;
  actions?: AssistantAction[];
}

export interface Analysis {
  analysis_id: string;
  filename: string;
  created_at: string;
  results: Record<string, ModelResult>;
  comparison: Comparison;
  priority: Priority | null;
  reports: { title: string; url: string; created_at: string }[];
  actions: AssistantAction[];
  chat: ChatEntry[];
}

export interface ChatResponse {
  reply: string;
  actions: AssistantAction[];
  analysis: Analysis;
}

/** Fixed per-model colors (follow the entity, never its position). Validated palette. */
export const MODEL_COLORS: Record<string, string> = {
  yolo: "#2a78d6",
  vgg16: "#eb6834",
  faster_rcnn: "#1baf7a",
  mask_rcnn: "#eda100",
};

/** Reserved status colors — always shown with an icon + label. */
export const SEVERITY_STYLE: Record<SeverityLevel, { color: string; icon: string; label: string }> = {
  low: { color: "#0ca30c", icon: "✓", label: "Low" },
  moderate: { color: "#fab219", icon: "!", label: "Moderate" },
  high: { color: "#ec835a", icon: "▲", label: "High" },
  critical: { color: "#d03b3b", icon: "✕", label: "Critical" },
  unknown: { color: "#9ca3af", icon: "?", label: "Unknown" },
};

export interface AssistantStatus {
  configured: boolean;
  provider: string;
  model: string;
  vision: boolean;
  key_url: string | null;
}
