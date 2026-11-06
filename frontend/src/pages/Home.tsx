
import React from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { ModelCard } from "../components/ModelCard";

const MODELS = [
  {
    id: "yolo",
    name: "YOLOv8m",
    task: "Object Detection",
    status: "available" as const,
    description:
      "Detect buildings and classify their damage directly from disaster imagery.",
    emoji: "🎯",
    route: "/yolo",
  },
  {
    id: "faster-rcnn",
    name: "Faster R-CNN",
    task: "Object Detection",
    status: "coming_soon" as const,
    description:
      "Advanced object detection for precise building localization and damage assessment.",
    emoji: "📦",
    route: "/faster-rcnn",
  },
  {
    id: "mask-rcnn",
    name: "Mask R-CNN",
    task: "Instance Segmentation",
    status: "coming_soon" as const,
    description:
      "Generate detailed building-level segmentation masks for damage assessment.",
    emoji: "🎭",
    route: "/mask-rcnn",
  },
  {
    id: "vgg16",
    name: "VGG16",
    task: "Building Classification",
    status: "available" as const,
    description:
      "Classify the damage severity of an individual building crop across five categories.",
    emoji: "🏢",
    route: "/vgg16",
  },
];

export const Home: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Disaster Damage Assessment" />

      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">

        {/* Hero Section */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">
            🛰️ Disaster Vision
          </h1>

          <p className="mb-2 text-xl text-gray-600">
            Computer Vision System for Disaster Damage Assessment
          </p>

          <p className="text-gray-500">
            Analyze satellite and aerial imagery to assess building damage
          </p>
        </div>

        {/* Compare + AI analyst CTA */}
        <div className="mb-12 rounded-2xl bg-gradient-to-r from-blue-700 to-indigo-700 p-8 text-white shadow-lg flex flex-col md:flex-row md:items-center gap-6">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">⚖️ Compare models + 🤖 AI analyst</h2>
            <p className="text-blue-100">
              Run every available model on the same image, see where they agree and disagree, and
              let the AI analyst explain the results, set a response priority and write a report.
            </p>
          </div>
          <button
            onClick={() => navigate("/compare")}
            className="rounded-lg bg-white px-6 py-3 font-bold text-blue-800 hover:bg-blue-50 transition"
          >
            Start comparison →
          </button>
        </div>

        {/* Models Grid */}
        <div className="mb-12">
          <div className="mb-6 flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Assessment Models
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Compare different computer vision approaches for disaster
                damage assessment.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
            {MODELS.map((model) => (
              <ModelCard
                key={model.id}
                model={model}
                onClick={() => navigate(model.route)}
              />
            ))}
          </div>
        </div>

        {/* Model Roles */}
        <div className="mb-8 rounded-lg bg-white p-8 shadow-md">
          <h2 className="mb-2 text-2xl font-bold text-gray-900">
            How the Models Differ
          </h2>

          <p className="mb-6 text-sm text-gray-500">
            Each model approaches the damage assessment problem differently.
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

            {/* YOLO */}
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="text-2xl">🎯</span>

                <div>
                  <h3 className="font-bold text-gray-900">
                    YOLOv8m
                  </h3>

                  <p className="text-xs font-medium text-blue-600">
                    OBJECT DETECTION
                  </p>
                </div>
              </div>

              <p className="text-sm leading-6 text-gray-600">
                Processes a full disaster image, locates buildings, and
                predicts their damage categories using bounding boxes.
              </p>
            </div>

            {/* VGG16 */}
            <div className="rounded-lg border border-purple-100 bg-purple-50 p-5">
              <div className="mb-3 flex items-center gap-3">
                <span className="text-2xl">🏢</span>

                <div>
                  <h3 className="font-bold text-gray-900">
                    VGG16
                  </h3>

                  <p className="text-xs font-medium text-purple-600">
                    BUILDING CLASSIFICATION
                  </p>
                </div>
              </div>

              <p className="text-sm leading-6 text-gray-600">
                Takes an individual building crop and classifies its damage
                severity across five disaster-damage categories.
              </p>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mb-8 rounded-lg bg-white p-8 shadow-md">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            Features
          </h2>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">

            <div className="flex gap-4">
              <div className="text-3xl">📸</div>

              <div>
                <h3 className="mb-1 font-bold text-gray-800">
                  Easy Image Upload
                </h3>

                <p className="text-sm text-gray-600">
                  Upload disaster imagery or individual building crops for
                  model analysis.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-3xl">⚡</div>

              <div>
                <h3 className="mb-1 font-bold text-gray-800">
                  Fast Analysis
                </h3>

                <p className="text-sm text-gray-600">
                  Run computer vision models and receive damage assessment
                  results directly in the application.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="text-3xl">📊</div>

              <div>
                <h3 className="mb-1 font-bold text-gray-800">
                  Detailed Results
                </h3>

                <p className="text-sm text-gray-600">
                  View detected damage, confidence scores, classifications,
                  and visual assessment results.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Quick Start */}
        <div className="rounded-lg border-l-4 border-blue-500 bg-blue-50 p-6">
          <h3 className="mb-2 font-bold text-blue-900">
            Quick Start
          </h3>

          <p className="mb-4 text-sm text-blue-700">
            Start with YOLOv8m for full-image disaster assessment, or use
            VGG16 to classify an individual building crop.
          </p>

          <div className="flex flex-wrap gap-3">

            <button
              onClick={() => navigate("/yolo")}
              className="rounded bg-blue-600 px-6 py-2 font-bold text-white transition-colors hover:bg-blue-700"
            >
              Start with YOLOv8m →
            </button>

            <button
              onClick={() => navigate("/vgg16")}
              className="rounded border border-purple-300 bg-white px-6 py-2 font-bold text-purple-700 transition-colors hover:bg-purple-50"
            >
              Try VGG16 →
            </button>

          </div>
        </div>

      </main>
    </div>
  );
};


