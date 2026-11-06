import React from "react";

interface ModelStatusProps {
  status: "available" | "coming_soon";
  modelName: string;
  task: string;
}

export const ModelStatus: React.FC<ModelStatusProps> = ({
  status,
  modelName,
  task,
}) => {
  if (status === "available") {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">✓</span>
          <div>
            <p className="font-bold text-green-800">{modelName}</p>
            <p className="text-sm text-green-700">{task}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <div className="flex items-center space-x-2">
        <span className="text-2xl">🚧</span>
        <div>
          <p className="font-bold text-yellow-800">Model not available yet</p>
          <p className="text-sm text-yellow-700">
            The {modelName} model will be added after training and evaluation
            are completed.
          </p>
        </div>
      </div>
    </div>
  );
};
