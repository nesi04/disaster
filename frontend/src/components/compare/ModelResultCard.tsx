import React from "react";
import { API_URL } from "../../services/api";
import {
  DAMAGE_CLASSES,
  DAMAGE_LABELS,
  MODEL_COLORS,
  ModelResult,
} from "../../types/analysis";
import { SeverityBadge } from "./SeverityBadge";

interface Props {
  result: ModelResult;
  originalImage: string;
}

const TASK_LABEL = {
  detection: "Object detection",
  classification: "Image classification",
  segmentation: "Instance segmentation",
};

export const ModelResultCard: React.FC<Props> = ({ result, originalImage }) => {
  const color = MODEL_COLORS[result.model_id] ?? "#6b7280";

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
      <div className="h-1" style={{ backgroundColor: color }} />
      <div className="p-5 flex-1 flex flex-col gap-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
              {result.display_name}
            </h3>
            <p className="text-xs text-gray-500">
              {TASK_LABEL[result.task] ?? result.task}
              {result.success && ` · ${result.inference_ms} ms`}
              {result.params?.confidence != null && ` · conf ≥ ${result.params.confidence}`}
            </p>
          </div>
          {result.success && (
            <SeverityBadge level={result.severity_level} score={result.severity_score} />
          )}
        </div>

        {!result.success ? (
          <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">
            {result.error || "This model failed."}
          </div>
        ) : (
          <>
            <a
              href={result.annotated_image_url ? API_URL + result.annotated_image_url : originalImage}
              target="_blank"
              rel="noreferrer"
              className="block rounded-lg overflow-hidden bg-gray-100 border"
            >
              <img
                src={result.annotated_image_url ? API_URL + result.annotated_image_url : originalImage}
                alt={`${result.display_name} output`}
                className="w-full h-56 object-contain"
              />
            </a>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">
                  {result.task === "classification" ? "Predicted class" : "Most common class"}
                </p>
                <p className="text-base font-semibold text-gray-900">
                  {result.overall_label ? DAMAGE_LABELS[result.overall_label] : "—"}
                </p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">
                  {result.task === "classification" ? "Confidence" : "Buildings found"}
                </p>
                <p className="text-base font-semibold text-gray-900">
                  {result.task === "classification"
                    ? `${Math.round((result.overall_confidence ?? 0) * 100)}%`
                    : result.total_objects ?? 0}
                </p>
              </div>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 text-left">
                  <th className="font-medium pb-1">Class</th>
                  {result.counts && <th className="font-medium pb-1 text-right">Count</th>}
                  <th className="font-medium pb-1 text-right">
                    {result.task === "classification" ? "Probability" : "Share"}
                  </th>
                </tr>
              </thead>
              <tbody>
                {DAMAGE_CLASSES.map((c) => (
                  <tr key={c} className="border-t border-gray-100">
                    <td className="py-1 text-gray-700">{DAMAGE_LABELS[c]}</td>
                    {result.counts && (
                      <td className="py-1 text-right tabular-nums text-gray-900">{result.counts[c]}</td>
                    )}
                    <td className="py-1 text-right tabular-nums text-gray-900">
                      {(result.distribution[c] * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  );
};
