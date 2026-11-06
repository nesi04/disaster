import React from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";

const MODELS = [
  {
    name: "YOLOv8m",
    task: "Object Detection",
    status: "✓ Available",
    statusColor: "bg-green-100 text-green-800",
    emoji: "🎯",
  },
  {
    name: "Faster R-CNN",
    task: "Object Detection",
    status: "Coming Soon",
    statusColor: "bg-yellow-100 text-yellow-800",
    emoji: "📦",
  },
  {
    name: "Mask R-CNN",
    task: "Instance Segmentation",
    status: "Coming Soon",
    statusColor: "bg-yellow-100 text-yellow-800",
    emoji: "🎭",
  },
  {
    name: "VGG16",
    task: "Classification",
    status: "Coming Soon",
    statusColor: "bg-yellow-100 text-yellow-800",
    emoji: "🏢",
  },
];

export const ModelsPage: React.FC = () => {
  const navigate = useNavigate();

  const handleRowClick = (name: string) => {
    switch (name) {
      case "YOLOv8m":
        navigate("/yolo");
        break;
      case "Faster R-CNN":
        navigate("/faster-rcnn");
        break;
      case "Mask R-CNN":
        navigate("/mask-rcnn");
        break;
      case "VGG16":
        navigate("/vgg16");
        break;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Models" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <a
            href="/"
            className="text-blue-600 hover:text-blue-800 font-medium mb-4 inline-block"
          >
            ← Back to Dashboard
          </a>
          <h1 className="text-3xl font-bold text-gray-900">
            Disaster Vision Models
          </h1>
          <p className="text-gray-600 mt-2">
            Available computer vision models for disaster damage assessment
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-200">
                  <th className="px-6 py-4 text-left font-bold text-gray-800">
                    Model
                  </th>
                  <th className="px-6 py-4 text-left font-bold text-gray-800">
                    Task
                  </th>
                  <th className="px-6 py-4 text-left font-bold text-gray-800">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left font-bold text-gray-800">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {MODELS.map((model, index) => (
                  <tr
                    key={index}
                    className={`border-b cursor-pointer transition hover:bg-gray-50 ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    }`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{model.emoji}</div>
                        <span className="font-bold text-gray-900">
                          {model.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-700">
                      {model.task}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-semibold ${model.statusColor}`}
                      >
                        {model.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleRowClick(model.name)}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-8 bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6">
          <h2 className="font-bold text-blue-900 mb-2">About These Models</h2>
          <p className="text-blue-800 mb-3">
            Currently, only YOLOv8m is fully implemented and ready for use. The other models
            are in development and will be added as they complete training and evaluation phases.
          </p>
          <p className="text-blue-800">
            Click on any model to learn more about its capabilities and status.
          </p>
        </div>
      </main>
    </div>
  );
};
