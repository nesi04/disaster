import React, { useRef, useState } from "react";
import {
  DAMAGE_CLASSES,
  DAMAGE_LABELS,
  DamageClass,
  MODEL_COLORS,
  ModelResult,
} from "../../types/analysis";

interface Props {
  results: ModelResult[];
}

interface Hover {
  model: string;
  cls: DamageClass;
  x: number;
  y: number;
}

const GRID = [0, 25, 50, 75, 100];

/**
 * Grouped horizontal bars: one row per damage class, one bar per model.
 * Detectors show share of detected buildings; classifiers show probability.
 */
export const DistributionChart: React.FC<Props> = ({ results }) => {
  const [hover, setHover] = useState<Hover | null>(null);
  const [showTable, setShowTable] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const track = (e: React.MouseEvent, model: string, cls: DamageClass) => {
    const root = rootRef.current?.getBoundingClientRect();
    if (!root) return;
    setHover({ model, cls, x: e.clientX - root.left, y: e.clientY - root.top });
  };
  const ok = results.filter((r) => r.success);

  if (ok.length === 0) return null;

  return (
    <div className="relative" ref={rootRef}>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        {/* Legend (always present for ≥ 2 series) */}
        <div className="flex flex-wrap gap-4 text-sm text-gray-700">
          {ok.map((r) => (
            <span key={r.model_id} className="inline-flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: MODEL_COLORS[r.model_id] }} />
              {r.display_name}
              <span className="text-xs text-gray-500">
                ({r.task === "classification" ? "probability" : "share of buildings"})
              </span>
            </span>
          ))}
        </div>
        <button
          onClick={() => setShowTable((v) => !v)}
          className="text-xs font-medium text-blue-700 hover:text-blue-900"
        >
          {showTable ? "Show chart" : "Show table"}
        </button>
      </div>

      {showTable ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500">
              <th className="font-medium pb-2">Class</th>
              {ok.map((r) => (
                <th key={r.model_id} className="font-medium pb-2 text-right">{r.display_name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAMAGE_CLASSES.map((c) => (
              <tr key={c} className="border-t border-gray-100">
                <td className="py-1.5 text-gray-700">{DAMAGE_LABELS[c]}</td>
                {ok.map((r) => (
                  <td key={r.model_id} className="py-1.5 text-right tabular-nums text-gray-900">
                    {(r.distribution[c] * 100).toFixed(1)}%
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div className="grid grid-cols-[7.5rem_1fr] gap-x-3">
          {/* Axis header */}
          <div />
          <div className="relative h-5 text-[11px] text-gray-400">
            {GRID.map((g) => (
              <span key={g} className="absolute -translate-x-1/2" style={{ left: `${g}%` }}>
                {g}%
              </span>
            ))}
          </div>

          {DAMAGE_CLASSES.map((c) => (
            <React.Fragment key={c}>
              <div className="py-2 text-sm text-gray-700 self-center">{DAMAGE_LABELS[c]}</div>
              <div className="relative py-2 border-t border-gray-100">
                {/* Recessive grid */}
                {GRID.slice(1).map((g) => (
                  <span
                    key={g}
                    className="absolute top-0 bottom-0 w-px bg-gray-100"
                    style={{ left: `${g}%` }}
                  />
                ))}
                <div className="relative flex flex-col gap-[2px]">
                  {ok.map((r) => {
                    const v = r.distribution[c] * 100;
                    return (
                      <div
                        key={r.model_id}
                        className="flex items-center h-3"
                        onMouseMove={(e) => track(e, r.model_id, c)}
                        onMouseLeave={() => setHover(null)}
                      >
                        <div
                          className="h-2.5 rounded-r"
                          style={{
                            width: `${Math.max(v, 0.4)}%`,
                            backgroundColor: MODEL_COLORS[r.model_id],
                            opacity: hover && (hover.model !== r.model_id || hover.cls !== c) ? 0.45 : 1,
                          }}
                        />
                        <span className="ml-1.5 text-[11px] tabular-nums text-gray-600">
                          {v >= 0.05 ? `${v.toFixed(v < 10 ? 1 : 0)}%` : "0%"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </React.Fragment>
          ))}
        </div>
      )}

      {hover && !showTable && (() => {
        const r = ok.find((m) => m.model_id === hover.model)!;
        const v = r.distribution[hover.cls];
        return (
          <div
            className="pointer-events-none absolute z-10 rounded-md bg-gray-900 px-3 py-2 text-xs text-white shadow-lg"
            style={{ left: hover.x + 14, top: hover.y + 14 }}
          >
            <div className="flex items-center gap-1.5 font-semibold">
              <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: MODEL_COLORS[r.model_id] }} />
              {r.display_name}
            </div>
            <div>{DAMAGE_LABELS[hover.cls]}: {(v * 100).toFixed(1)}%</div>
            {r.counts && <div>{r.counts[hover.cls]} of {r.total_objects} buildings</div>}
          </div>
        );
      })()}
    </div>
  );
};
