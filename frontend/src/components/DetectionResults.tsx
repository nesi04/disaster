import React, { useMemo, useState } from "react";
import { Detection, PredictionSummary } from "../types/prediction";

interface DetectionResultsProps {
  originalImage: string;
  annotatedImageUrl: string;
  detections: Detection[];
  summary: PredictionSummary;
}

interface SeverityMapProps {
  imageUrl: string;
  detections: Detection[];
}

const severityStyles: Record<
  string,
  {
    background: string;
    border: string;
    text: string;
  }
> = {
  "no-damage": {
    background: "rgba(34, 197, 94, 0.25)",
    border: "#22c55e",
    text: "#15803d",
  },
  "minor-damage": {
    background: "rgba(234, 179, 8, 0.30)",
    border: "#eab308",
    text: "#a16207",
  },
  "major-damage": {
    background: "rgba(249, 115, 22, 0.32)",
    border: "#f97316",
    text: "#c2410c",
  },
  destroyed: {
    background: "rgba(239, 68, 68, 0.35)",
    border: "#ef4444",
    text: "#b91c1c",
  },
  "un-classified": {
    background: "rgba(107, 114, 128, 0.30)",
    border: "#6b7280",
    text: "#4b5563",
  },
};

const severityLabels: Record<string, string> = {
  "no-damage": "No Damage",
  "minor-damage": "Minor Damage",
  "major-damage": "Major Damage",
  destroyed: "Destroyed",
  "un-classified": "Unclassified",
};

const getSeverityStyle = (className: string) => {
  return (
    severityStyles[className.toLowerCase()] || severityStyles["un-classified"]
  );
};

const getSeverityLabel = (className: string) => {
  return (
    severityLabels[className.toLowerCase()] ||
    className.replace("-", " ")
  );
};

const DamageSeverityMap: React.FC<SeverityMapProps> = ({
  imageUrl,
  detections,
}) => {
  const [imageSize, setImageSize] = useState({
    width: 0,
    height: 0,
  });

  const validDetections = useMemo(() => {
    return detections.filter(
      (detection) =>
        detection.bbox &&
        Number.isFinite(detection.bbox.x1) &&
        Number.isFinite(detection.bbox.y1) &&
        Number.isFinite(detection.bbox.x2) &&
        Number.isFinite(detection.bbox.y2)
    );
  }, [detections]);

  return (
    <div className="space-y-4">
      {/* Map */}
      <div className="rounded-xl border border-slate-200 bg-slate-950 p-3 shadow-sm">
        <div className="relative mx-auto w-full overflow-hidden rounded-lg bg-slate-900">
          <img
            src={imageUrl}
            alt="Damage severity map"
            className="block h-auto w-full"
            onLoad={(event) => {
              const img = event.currentTarget;

              setImageSize({
                width: img.naturalWidth,
                height: img.naturalHeight,
              });
            }}
          />

          {/* Damage overlays */}
          {imageSize.width > 0 &&
            imageSize.height > 0 &&
            validDetections.map((detection, index) => {
              const { x1, y1, x2, y2 } = detection.bbox;

              const left = (x1 / imageSize.width) * 100;
              const top = (y1 / imageSize.height) * 100;
              const width = ((x2 - x1) / imageSize.width) * 100;
              const height = ((y2 - y1) / imageSize.height) * 100;

              const style = getSeverityStyle(detection.class_name);

              return (
                <div
                  key={`${detection.class_id}-${index}`}
                  className="absolute rounded-sm transition-all duration-200 hover:z-50 hover:scale-[1.02]"
                  style={{
                    left: `${left}%`,
                    top: `${top}%`,
                    width: `${width}%`,
                    height: `${height}%`,
                    backgroundColor: style.background,
                    border: `2px solid ${style.border}`,
                    boxShadow: `0 0 8px ${style.border}55`,
                  }}
                  title={`${getSeverityLabel(
                    detection.class_name
                  )} • ${(detection.confidence * 100).toFixed(1)}% confidence`}
                />
              );
            })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-slate-200 bg-white px-5 py-4">
        <span className="text-sm font-semibold text-slate-700">
          Severity Legend
        </span>

        {[
          ["no-damage", "No Damage"],
          ["minor-damage", "Minor Damage"],
          ["major-damage", "Major Damage"],
          ["destroyed", "Destroyed"],
          ["un-classified", "Unclassified"],
        ].map(([key, label]) => {
          const style = getSeverityStyle(key);

          return (
            <div
              key={key}
              className="flex items-center gap-2 text-sm text-slate-600"
            >
              <span
                className="h-3.5 w-3.5 rounded-sm border-2"
                style={{
                  backgroundColor: style.background,
                  borderColor: style.border,
                }}
              />

              <span>{label}</span>
            </div>
          );
        })}
      </div>

      {validDetections.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 text-center">
          <p className="font-medium text-slate-700">
            No detected buildings to visualize
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Try lowering the confidence threshold.
          </p>
        </div>
      )}
    </div>
  );
};

export const DetectionResults: React.FC<DetectionResultsProps> = ({
  originalImage,
  annotatedImageUrl,
  detections,
  summary,
}) => {
  const safeSummary = useMemo(() => {
    return {
      total_detections:
        summary?.total_detections ?? detections.length,
      no_damage: summary?.no_damage ?? 0,
      minor_damage: summary?.minor_damage ?? 0,
      major_damage: summary?.major_damage ?? 0,
      destroyed: summary?.destroyed ?? 0,
      un_classified: summary?.un_classified ?? 0,
    };
  }, [summary, detections]);

  const apiBaseUrl =
     "http://localhost:8000";

  const resolvedAnnotatedImageUrl = annotatedImageUrl
    ? annotatedImageUrl.startsWith("http")
      ? annotatedImageUrl
      : `${apiBaseUrl}${annotatedImageUrl}`
    : "";

  return (
    <div className="space-y-8">
      {/* ====================================================== */}
      {/* IMAGE COMPARISON */}
      {/* ====================================================== */}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Original */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Original Image
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Input disaster imagery
            </p>
          </div>

          <div className="flex min-h-[320px] items-center justify-center bg-slate-100 p-3">
            <img
              src={originalImage}
              alt="Original disaster scene"
              className="max-h-[500px] w-full rounded-lg object-contain"
            />
          </div>
        </div>

        {/* Detection */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h3 className="text-lg font-semibold text-slate-900">
              Detection Result
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Buildings classified by predicted damage
            </p>
          </div>

          <div className="flex min-h-[320px] items-center justify-center bg-slate-100 p-3">
            {resolvedAnnotatedImageUrl ? (
              <img
                src={resolvedAnnotatedImageUrl}
                alt="YOLO damage detection result"
                className="max-h-[500px] w-full rounded-lg object-contain"
              />
            ) : (
              <div className="text-sm text-slate-500">
                Annotated image unavailable
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ====================================================== */}
      {/* DAMAGE DISTRIBUTION */}
      {/* ====================================================== */}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5">
          <h3 className="text-lg font-semibold text-slate-900">
            Damage Distribution
          </h3>

          <p className="mt-1 text-sm text-slate-500">
            Classification of detected buildings
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {/* No damage */}
          <div className="rounded-lg border border-green-100 bg-green-50 p-4">
            <p className="text-sm font-medium text-green-700">
              No Damage
            </p>

            <p className="mt-2 text-2xl font-bold text-green-800">
              {safeSummary.no_damage}
            </p>
          </div>

          {/* Minor */}
          <div className="rounded-lg border border-yellow-100 bg-yellow-50 p-4">
            <p className="text-sm font-medium text-yellow-700">
              Minor
            </p>

            <p className="mt-2 text-2xl font-bold text-yellow-800">
              {safeSummary.minor_damage}
            </p>
          </div>

          {/* Major */}
          <div className="rounded-lg border border-orange-100 bg-orange-50 p-4">
            <p className="text-sm font-medium text-orange-700">
              Major
            </p>

            <p className="mt-2 text-2xl font-bold text-orange-800">
              {safeSummary.major_damage}
            </p>
          </div>

          {/* Destroyed */}
          <div className="rounded-lg border border-red-100 bg-red-50 p-4">
            <p className="text-sm font-medium text-red-700">
              Destroyed
            </p>

            <p className="mt-2 text-2xl font-bold text-red-800">
              {safeSummary.destroyed}
            </p>
          </div>

          {/* Total */}
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-600">
              Total Detected
            </p>

            <p className="mt-2 text-2xl font-bold text-slate-800">
              {safeSummary.total_detections}
            </p>
          </div>
        </div>

        {/* Distribution bar */}
        {safeSummary.total_detections > 0 && (
          <div className="mt-6">
            <div className="flex h-4 w-full overflow-hidden rounded-full bg-slate-100">
              {[
                {
                  value: safeSummary.no_damage,
                  color: "bg-green-500",
                },
                {
                  value: safeSummary.minor_damage,
                  color: "bg-yellow-400",
                },
                {
                  value: safeSummary.major_damage,
                  color: "bg-orange-500",
                },
                {
                  value: safeSummary.destroyed,
                  color: "bg-red-500",
                },
                {
                  value: safeSummary.un_classified,
                  color: "bg-gray-400",
                },
              ].map((item, index) => {
                const width =
                  (item.value / safeSummary.total_detections) * 100;

                if (width <= 0) return null;

                return (
                  <div
                    key={index}
                    className={`${item.color} transition-all`}
                    style={{ width: `${width}%` }}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ====================================================== */}
      {/* DAMAGE SEVERITY MAP */}
      {/* ====================================================== */}

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Damage Severity Map
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Spatial distribution of predicted building damage
            </p>
          </div>

          <span className="text-xs text-slate-400">
            Based on model detections
          </span>
        </div>

        <DamageSeverityMap
          imageUrl={originalImage}
          detections={detections}
        />
      </div>

      {/* ====================================================== */}
      {/* TECHNICAL DETAILS */}
      {/* ====================================================== */}

      {detections.length > 0 && (
        <details className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <summary className="cursor-pointer px-6 py-4 font-semibold text-slate-800 hover:bg-slate-50">
            Technical Details
            <span className="ml-2 text-sm font-normal text-slate-500">
              ({detections.length} detections)
            </span>
          </summary>

          <div className="border-t border-slate-200 p-6">
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full min-w-[650px] text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Class
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Confidence
                    </th>

                    <th className="px-4 py-3 text-left font-semibold text-slate-700">
                      Bounding Box
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {detections.map((detection, index) => (
                    <tr
                      key={index}
                      className="border-t border-slate-100 hover:bg-slate-50"
                    >
                      <td className="px-4 py-3">
                        {getSeverityLabel(detection.class_name)}
                      </td>

                      <td className="px-4 py-3">
                        {(detection.confidence * 100).toFixed(1)}%
                      </td>

                      <td className="px-4 py-3 text-slate-600">
                        ({detection.bbox.x1}, {detection.bbox.y1}) → (
                        {detection.bbox.x2}, {detection.bbox.y2})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </details>
      )}
    </div>
  );
};