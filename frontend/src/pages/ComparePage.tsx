import React, { useEffect, useState } from "react";
import { Navbar } from "../components/Navbar";
import { ImageUploader } from "../components/ImageUploader";
import { Loading } from "../components/Loading";
import { ModelResultCard } from "../components/compare/ModelResultCard";
import { ComparisonPanel } from "../components/compare/ComparisonPanel";
import { AssistantPanel } from "../components/compare/AssistantPanel";
import { apiClient } from "../services/api";
import { Analysis, AssistantStatus, MODEL_COLORS, ModelInfo } from "../types/analysis";

export const ComparePage: React.FC = () => {
  const [models, setModels] = useState<ModelInfo[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [confidence, setConfidence] = useState(0.25);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [assistantStatus, setAssistantStatus] = useState<AssistantStatus | null>(null);

  useEffect(() => {
    apiClient
      .listModels()
      .then((m) => {
        setModels(m);
        setSelected(m.filter((x) => x.available).map((x) => x.id));
      })
      .catch((e) => setError(e.message));
    apiClient.assistantStatus().then(setAssistantStatus);
  }, []);

  const onFile = (f: File) => {
    setFile(f);
    setError("");
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(f);
  };

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const run = async () => {
    if (!file || selected.length === 0) return;
    setLoading(true);
    setError("");
    try {
      setAnalysis(await apiClient.analyze(file, selected, confidence));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setAnalysis(null);
    setFile(null);
    setPreview("");
    setError("");
  };

  const needsConfidence = models.some(
    (m) => selected.includes(m.id) && m.params.includes("confidence")
  );
  const results = analysis
    ? models
        .map((m) => analysis.results[m.id])
        .filter(Boolean)
        .concat(Object.values(analysis.results).filter((r) => !models.some((m) => m.id === r.model_id)))
    : [];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Compare Models" />
      {loading && <Loading text={`Running ${selected.length} model${selected.length > 1 ? "s" : ""}…`} />}

      <main className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {!analysis ? (
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-1">⚖️ Compare models</h1>
            <p className="text-gray-600 mb-6">
              Run several models on the same image, see where they agree and differ, and ask the AI
              analyst to explain, triage and report.
            </p>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
              <section>
                <h2 className="font-bold text-gray-800 mb-3">1. Upload image</h2>
                {preview ? (
                  <div className="border rounded-lg p-4 bg-gray-50 text-center">
                    <img src={preview} alt="Preview" className="max-h-80 mx-auto rounded" />
                    <p className="text-sm text-gray-500 mt-2">{file?.name}</p>
                    <button onClick={reset} className="mt-2 text-sm text-blue-700 hover:text-blue-900">
                      Choose another image
                    </button>
                  </div>
                ) : (
                  <ImageUploader onFileSelected={onFile} isLoading={loading} />
                )}
              </section>

              <section>
                <h2 className="font-bold text-gray-800 mb-3">2. Choose models</h2>
                <div className="grid sm:grid-cols-2 gap-3">
                  {models.map((m) => (
                    <label
                      key={m.id}
                      className={`flex items-start gap-3 rounded-lg border p-3 ${
                        m.available ? "cursor-pointer hover:bg-gray-50" : "opacity-60 cursor-not-allowed"
                      } ${selected.includes(m.id) ? "border-blue-400 bg-blue-50/40" : "border-gray-200"}`}
                    >
                      <input
                        type="checkbox"
                        className="mt-1"
                        checked={selected.includes(m.id)}
                        disabled={!m.available}
                        onChange={() => toggle(m.id)}
                      />
                      <div>
                        <p className="font-semibold text-gray-900 flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: MODEL_COLORS[m.id] ?? "#6b7280" }} />
                          {m.display_name}
                          {!m.available && (
                            <span className="rounded bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                              Coming soon
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">{m.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </section>

              {needsConfidence && (
                <section>
                  <h2 className="font-bold text-gray-800 mb-3">3. Detection confidence: {confidence.toFixed(2)}</h2>
                  <input
                    type="range"
                    min="0.05"
                    max="0.9"
                    step="0.05"
                    value={confidence}
                    onChange={(e) => setConfidence(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">Applies to detection models. Lower = more buildings found.</p>
                </section>
              )}

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>
              )}

              <button
                onClick={run}
                disabled={!file || selected.length === 0 || loading}
                className="w-full rounded-lg bg-blue-600 py-3 font-bold text-white hover:bg-blue-700 disabled:bg-gray-300"
              >
                Run {selected.length} model{selected.length === 1 ? "" : "s"} & compare
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Results · {analysis.filename}</h1>
                <p className="text-sm text-gray-500">
                  {results.filter((r) => r.success).length} of {results.length} models succeeded
                </p>
              </div>
              <button
                onClick={reset}
                className="rounded-lg bg-white border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Analyze another image
              </button>
            </div>

            <div className="grid lg:grid-cols-[1fr_400px] gap-6 items-start">
              <div className="space-y-6 min-w-0">
                <div className={`grid gap-4 ${results.length > 2 ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-2"}`}>
                  {results.map((r) => (
                    <ModelResultCard key={r.model_id} result={r} originalImage={preview} />
                  ))}
                </div>
                <ComparisonPanel comparison={analysis.comparison} results={results} />
              </div>

              <AssistantPanel
                analysis={analysis}
                status={assistantStatus}
                onAnalysisUpdate={setAnalysis}
              />
            </div>
          </>
        )}
      </main>
    </div>
  );
};
