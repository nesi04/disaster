import React from "react";
import { useNavigate } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { ModelStatus } from "../components/ModelStatus";

export const FasterRCNNPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar title="Faster R-CNN" />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <a
          href="/"
          className="text-blue-600 hover:text-blue-800 font-medium mb-6 inline-block"
        >
          ← Back to Dashboard
        </a>

        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <div className="text-6xl mb-4">📦</div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Faster R-CNN
            </h1>
            <p className="text-lg text-gray-600">Object Detection</p>
          </div>

          <div className="space-y-6">
            <ModelStatus
              status="coming_soon"
              modelName="Faster R-CNN"
              task="Advanced object detection with precise bounding boxes"
            />

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="font-bold text-blue-900 mb-3">About This Model</h2>
              <p className="text-blue-800 mb-3">
                Faster R-CNN is a deep learning object detection framework that uses
                Region Proposal Networks (RPN) to generate region proposals and then
                classifies those proposals.
              </p>
              <p className="text-blue-800 mb-3">
                It provides better accuracy than single-stage detectors like YOLO,
                making it ideal for detailed damage assessment where precision is critical.
              </p>
              <h3 className="font-bold text-blue-900 mb-2">Coming Features:</h3>
              <ul className="list-disc list-inside text-blue-800 space-y-1">
                <li>More precise bounding boxes</li>
                <li>Better handling of small objects</li>
                <li>Higher accuracy for complex scenes</li>
              </ul>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="font-bold text-yellow-900 mb-2">Status</h3>
              <p className="text-yellow-800 mb-4">
                Model training and evaluation in progress. Will be available in the next release.
              </p>
            </div>

            <button
              onClick={() => navigate("/yolo")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Try YOLOv8m Instead →
            </button>

            <button
              onClick={() => navigate("/")}
              className="w-full bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};
