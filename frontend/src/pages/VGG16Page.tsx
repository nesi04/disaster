import React, { useState } from "react";
import { apiClient } from "../services/api";
import {
  VGG16PredictionResponse,
  VGG16Class,
} from "../types/prediction";
import { ImageUploader } from "../components/ImageUploader";
import { Navbar } from "../components/Navbar";

const CLASSES: VGG16Class[] = [
  "no-damage",
  "minor-damage",
  "major-damage",
  "destroyed",
  "un-classified",
];

const CLASS_LABELS: Record<VGG16Class, string> = {
  "no-damage": "No Damage",
  "minor-damage": "Minor Damage",
  "major-damage": "Major Damage",
  destroyed: "Destroyed",
  "un-classified": "Unclassified",
};

const CLASS_DESCRIPTIONS: Record<VGG16Class, string> = {
  "no-damage": "Building appears structurally intact.",
  "minor-damage": "Limited or localized damage detected.",
  "major-damage": "Significant structural damage detected.",
  destroyed: "Building appears severely damaged or destroyed.",
  "un-classified": "Damage condition could not be reliably classified.",
};

function formatPercent(value: number) {
  return `${(value * 100).toFixed(1)}%`;
}

export  function VGG16Page() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [result, setResult] = useState<VGG16PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setResult(null);
    setError(null);

    const reader = new FileReader();

    reader.onload = (event) => {
      setPreviewUrl(event.target?.result as string);
    };

    reader.readAsDataURL(file);
  };

  const handleClassify = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await apiClient.predictVGG16(selectedFile);
      setResult(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to classify the building image."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
  };

  const probabilities = result?.probabilities ?? {
    "no-damage": 0,
    "minor-damage": 0,
    "major-damage": 0,
    destroyed: 0,
    "un-classified": 0,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
    <Navbar title="VG16" />

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <span className="rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-300">
              IMAGE CLASSIFICATION
            </span>

            <span className="rounded-full border border-slate-700 bg-slate-900 px-3 py-1 text-xs text-slate-400">
              VGG16
            </span>
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Building Damage Classification
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400 sm:text-base">
            Analyze an individual building crop and classify its damage
            severity across five disaster-damage categories.
          </p>
        </section>

        {/* Architecture explanation */}
        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="grid gap-4 md:grid-cols-5">
            {[
              ["01", "Building Crop"],
              ["02", "224 × 224"],
              ["03", "VGG16"],
              ["04", "5 Classes"],
              ["05", "Damage Severity"],
            ].map(([number, label], index) => (
              <React.Fragment key={label}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-purple-500/10 text-xs font-bold text-purple-300">
                    {number}
                  </div>

                  <span className="text-sm font-medium text-slate-200">
                    {label}
                  </span>
                </div>

                {index < 4 && (
                  <div className="hidden items-center justify-center md:flex">
                    <span className="text-slate-700">→</span>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </section>

        {/* Main workspace */}
        <section className="grid gap-6 lg:grid-cols-2">
          {/* Input */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-5">
              <h2 className="text-lg font-semibold">Building Image</h2>
              <p className="mt-1 text-sm text-slate-500">
                Upload a cropped building image for classification.
              </p>
            </div>

            {!previewUrl ? (
              <ImageUploader isLoading={isLoading} onFileSelected={handleFileSelected} />
            ) : (
              <div>
                <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-black">
                  <img
                    src={previewUrl}
                    alt="Building crop"
                    className="max-h-[480px] w-full object-contain"
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    onClick={handleClassify}
                    disabled={isLoading}
                    className="rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold transition hover:bg-purple-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? "Classifying..." : "Classify Building"}
                  </button>

                  <button
                    onClick={handleClear}
                    disabled={isLoading}
                    className="rounded-lg border border-slate-700 px-5 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-slate-800"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}

            {isLoading && (
              <div className="mt-5">
                Loading
              </div>
            )}

            {error && (
              <div className="mt-5 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-300">
                {error}
              </div>
            )}
          </div>

          {/* Result */}
          <VGG16PredictionCard
            result={result}
            probabilities={probabilities}
          />
        </section>

        {/* Probability analysis */}
        {result && (
          <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold">
                Damage Probability Analysis
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Confidence distribution across all five damage categories.
              </p>
            </div>

            <div className="space-y-5">
              {CLASSES.map((className) => {
                const probability = probabilities[className];

                return (
                  <div key={className}>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-300">
                        {CLASS_LABELS[className]}
                      </span>

                      <span className="text-sm font-semibold text-white">
                        {formatPercent(probability)}
                      </span>
                    </div>

                    <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                      <div
                        className={`h-full rounded-full transition-all ${
                          className === result.predicted_class
                            ? "bg-purple-500"
                            : "bg-slate-600"
                        }`}
                        style={{
                          width: `${Math.max(probability * 100, 0)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Model information */}
        <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <InfoCard title="Architecture" value="VGG16" />
          <InfoCard title="Input Size" value="224 × 224 RGB" />
          <InfoCard title="Classes" value="5 Damage Classes" />
          <InfoCard title="Task" value="Image Classification" />
        </section>

        {/* Pipeline */}
        <section className="mt-6 rounded-2xl border border-slate-800 bg-slate-900 p-6">
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Disaster Damage Assessment Pipeline
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              VGG16 focuses on classifying the damage condition of an
              individual building.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            <PipelineStep number="1" title="Building Crop" />
            <PipelineStep number="2" title="Resize" />
            <PipelineStep number="3" title="VGG16" />
            <PipelineStep number="4" title="Classification" />
            <PipelineStep number="5" title="Severity" />
          </div>
        </section>
      </main>
    </div>
  );
}

/* ----------------------------- */
/* Prediction Card                */
/* ----------------------------- */

interface PredictionCardProps {
  result: VGG16PredictionResponse | null;
  probabilities: Record<VGG16Class, number>;
}

function VGG16PredictionCard({
  result,
  probabilities,
}: PredictionCardProps) {
  if (!result) {
    return (
      <div className="flex min-h-[420px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/50 p-8 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-purple-500/10">
          <span className="text-2xl">⌁</span>
        </div>

        <h2 className="text-lg font-semibold text-slate-200">
          Classification Result
        </h2>

        <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
          Upload a building crop and run VGG16 classification to see the
          predicted damage category and confidence.
        </p>
      </div>
    );
  }

  const predicted = result.predicted_class;
  const confidence = result.confidence;

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <div className="mb-5">
        <h2 className="text-lg font-semibold">Classification Result</h2>
        <p className="mt-1 text-sm text-slate-500">
          VGG16 building-level prediction
        </p>
      </div>

      <div className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          Predicted Damage
        </p>

        <h3 className="mt-2 text-3xl font-bold text-purple-300">
          {CLASS_LABELS[predicted]}
        </h3>

        <p className="mt-2 text-sm leading-6 text-slate-400">
          {CLASS_DESCRIPTIONS[predicted]}
        </p>

        <div className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm text-slate-400">Confidence</span>

            <span className="text-lg font-bold text-white">
              {formatPercent(confidence)}
            </span>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-purple-500"
              style={{
                width: `${confidence * 100}%`,
              }}
            />
          </div>
        </div>
      </div>

      <div className="mt-5">
        <h3 className="mb-3 text-sm font-semibold text-slate-300">
          Class Probabilities
        </h3>

        <div className="space-y-3">
          {CLASSES.map((className) => (
            <div
              key={className}
              className="flex items-center justify-between rounded-lg bg-slate-950/60 px-4 py-3"
            >
              <span className="text-sm text-slate-400">
                {CLASS_LABELS[className]}
              </span>

              <span
                className={`text-sm font-semibold ${
                  className === predicted
                    ? "text-purple-300"
                    : "text-slate-300"
                }`}
              >
                {formatPercent(probabilities[className])}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ----------------------------- */
/* Info Card                     */
/* ----------------------------- */

function InfoCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <p className="text-xs uppercase tracking-wider text-slate-500">
        {title}
      </p>

      <p className="mt-2 font-semibold text-slate-200">{value}</p>
    </div>
  );
}

/* ----------------------------- */
/* Pipeline Step                 */
/* ----------------------------- */

function PipelineStep({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <div className="flex items-center gap-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10 text-xs font-bold text-purple-300">
          {number}
        </span>

        <span className="text-sm font-medium text-slate-300">{title}</span>
      </div>
    </div>
  );
} 