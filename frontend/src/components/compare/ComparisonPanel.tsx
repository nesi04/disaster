import React from "react";
import { Comparison, DAMAGE_LABELS, ModelResult } from "../../types/analysis";
import { DistributionChart } from "./DistributionChart";
import { SeverityBadge } from "./SeverityBadge";

interface Props {
  comparison: Comparison;
  results: ModelResult[];
}

const AGREEMENT_STYLE: Record<Comparison["agreement"], { text: string; cls: string }> = {
  high: { text: "High agreement", cls: "bg-green-50 text-green-800 border-green-200" },
  medium: { text: "Partial agreement", cls: "bg-amber-50 text-amber-800 border-amber-200" },
  low: { text: "Models disagree", cls: "bg-red-50 text-red-800 border-red-200" },
  "single-model": { text: "Single model", cls: "bg-gray-50 text-gray-700 border-gray-200" },
  none: { text: "No results", cls: "bg-gray-50 text-gray-700 border-gray-200" },
};

export const ComparisonPanel: React.FC<Props> = ({ comparison, results }) => {
  const ag = AGREEMENT_STYLE[comparison.agreement];
  const byId = Object.fromEntries(results.map((r) => [r.model_id, r]));

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-gray-900">Model comparison</h2>
        <span className={`rounded-full border px-3 py-1 text-sm font-medium ${ag.cls}`}>{ag.text}</span>
      </div>

      {/* Headline numbers */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-xs text-gray-500 mb-1">Consensus severity</p>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">
            {comparison.consensus_severity ?? "—"}
            <span className="text-sm font-normal text-gray-500">/100</span>
          </p>
          <div className="mt-2">
            <SeverityBadge level={comparison.consensus_level} />
          </div>
        </div>
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-xs text-gray-500 mb-1">Consensus class</p>
          <p className="text-2xl font-bold text-gray-900">
            {comparison.consensus_label ? DAMAGE_LABELS[comparison.consensus_label] : "—"}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {comparison.label_agreement ? "All models agree" : "Averaged across models"}
          </p>
        </div>
        <div className="rounded-lg bg-gray-50 p-4">
          <p className="text-xs text-gray-500 mb-1">Severity spread</p>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">
            {comparison.severity_spread ?? "—"}
            <span className="text-sm font-normal text-gray-500"> pts</span>
          </p>
          <p className="text-xs text-gray-500 mt-2">Gap between most and least severe model</p>
        </div>
      </div>

      {/* Findings */}
      {comparison.findings.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Key differences</h3>
          <ul className="space-y-1.5">
            {comparison.findings.map((f, i) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <span className="text-gray-400">•</span>
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Distribution chart */}
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Damage distribution by model</h3>
        <DistributionChart results={results} />
      </div>

      {/* Pairwise */}
      {comparison.pairwise.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Pairwise</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500">
                <th className="font-medium pb-1">Models</th>
                <th className="font-medium pb-1">Same class</th>
                <th className="font-medium pb-1 text-right">Severity gap</th>
                <th className="font-medium pb-1 text-right" title="Total variation distance: 0 = identical, 1 = completely different">
                  Distribution distance
                </th>
              </tr>
            </thead>
            <tbody>
              {comparison.pairwise.map((p) => (
                <tr key={p.models.join("-")} className="border-t border-gray-100">
                  <td className="py-1.5 text-gray-800">
                    {byId[p.models[0]]?.display_name} vs {byId[p.models[1]]?.display_name}
                  </td>
                  <td className="py-1.5">{p.same_label ? "✓ Yes" : "✕ No"}</td>
                  <td className="py-1.5 text-right tabular-nums">{p.severity_gap ?? "—"}</td>
                  <td className="py-1.5 text-right tabular-nums">{p.distribution_distance.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
