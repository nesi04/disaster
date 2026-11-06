import React from "react";
import { SEVERITY_STYLE, SeverityLevel } from "../../types/analysis";

interface Props {
  level: SeverityLevel;
  score?: number | null;
  size?: "sm" | "md";
}

/** Status color is never alone: always icon + label (+ score). */
export const SeverityBadge: React.FC<Props> = ({ level, score, size = "sm" }) => {
  const s = SEVERITY_STYLE[level];
  const pad = size === "md" ? "px-3 py-1 text-sm" : "px-2 py-0.5 text-xs";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-medium text-gray-800 bg-white ${pad}`}
      style={{ borderColor: s.color }}
    >
      <span
        aria-hidden
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white"
        style={{ backgroundColor: s.color }}
      >
        {s.icon}
      </span>
      {s.label}
      {score != null && <span className="text-gray-500">· {score}/100</span>}
    </span>
  );
};
