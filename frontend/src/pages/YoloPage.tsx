import React, { useState } from "react";
import { Navbar } from "../components/Navbar";
import { ImageUploader } from "../components/ImageUploader";
import { DetectionResults } from "../components/DetectionResults";
import { Loading } from "../components/Loading";
import { apiClient } from "../services/api";
import { YOLOPredictionResponse } from "../types/prediction";

export const YoloPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [result, setResult] = useState<YOLOPredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [confidence, setConfidence] = useState(0.25);

  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setError("");

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRunDetection = async () => {
    if (!selectedFile) {
      setError("Please select an image first");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await apiClient.predictYOLO(
        selectedFile,
        confidence
      );

      if (response.success) {
        setResult(response);
      } else {
        setError("Detection failed: " + (response.error || "Unknown error"));
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="YOLOv8m Disaster Damage Detection" />

      {isLoading && <Loading text="Running YOLOv8m inference..." />}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <a href="/" className="text-blue-600 hover:text-blue-800">
              ← Back to Dashboard
            </a>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            🎯 YOLOv8m Disaster Damage Detection
          </h1>
          <p className="text-gray-600">
            Upload a disaster image to detect and classify building damage
          </p>
        </div>

        {!result ? (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="space-y-6">
              {/* Image Uploader */}
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Step 1: Upload Image
                </h2>
                <ImageUploader
                  onFileSelected={handleFileSelected}
                  isLoading={isLoading}
                />
              </div>

              {/* Image Preview */}
              {previewUrl && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Step 2: Preview
                  </h2>
                  <div className="border rounded-lg p-4 bg-gray-50">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-full h-auto rounded mx-auto max-h-96"
                    />
                    <p className="text-sm text-gray-500 mt-2 text-center">
                      {selectedFile?.name} ({((selectedFile?.size ?? 0) / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>
                </div>
              )}

              {/* Settings */}
              {selectedFile && (
                <div>
                  <h2 className="text-xl font-bold text-gray-800 mb-4">
                    Step 3: Configure Settings
                  </h2>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <label className="block mb-4">
                      <span className="text-gray-700 font-medium mb-2 block">
                        Confidence Threshold: {confidence.toFixed(2)}
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={confidence}
                        onChange={(e) =>
                          setConfidence(parseFloat(e.target.value))
                        }
                        className="w-full"
                        disabled={isLoading}
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Higher values = fewer detections but higher confidence
                      </p>
                    </label>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <p className="text-red-800 font-medium">Error</p>
                  <p className="text-red-700 text-sm mt-1">{error}</p>
                </div>
              )}

              {/* Run Button */}
              <div className="flex gap-4">
                <button
                  onClick={handleRunDetection}
                  disabled={!selectedFile || isLoading}
                  className={`px-6 py-3 rounded-lg font-bold text-white transition-colors ${
                    !selectedFile || isLoading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isLoading ? "Running..." : "Run Detection"}
                </button>
                <button
                  onClick={() => {
                    setSelectedFile(null);
                    setPreviewUrl("");
                    setError("");
                  }}
                  disabled={isLoading}
                  className="px-6 py-3 rounded-lg font-bold text-gray-700 bg-gray-200 hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                Detection Results
              </h2>
              <button
                onClick={() => {
                  setResult(null);
                  setSelectedFile(null);
                  setPreviewUrl("");
                  setError("");
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
              >
                Analyze Another Image
              </button>
            </div>

            {result.success ? (
              <DetectionResults
                originalImage={previewUrl}
                annotatedImageUrl={result.annotated_image_url || ""}
                detections={result.detections || []}
                summary={result.summary || {
                  total_detections: 0,
                  no_damage: 0,
                  minor_damage: 0,
                  major_damage: 0,
                  destroyed: 0,
                  un_classified: 0,
                }}
              />
            ) : (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <p className="text-red-800 font-bold">Detection Failed</p>
                <p className="text-red-700 mt-2">
                  {result.error || "An unknown error occurred"}
                </p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};
