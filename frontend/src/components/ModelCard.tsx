import React from 'react';
import { ModelStatus } from '../types/prediction';

interface ModelCardProps {
  model: ModelStatus;
  onClick: () => void;
}

export const ModelCard: React.FC<ModelCardProps> = ({ model, onClick }) => {
  const isAvailable = model.status === 'available';
  
  return (
    <div
      onClick={onClick}
      className={`p-6 rounded-lg shadow-md transition transform hover:scale-105 cursor-pointer ${
        isAvailable
          ? 'bg-white border-2 border-blue-500 hover:shadow-lg'
          : 'bg-gray-100 border-2 border-gray-300 opacity-75'
      }`}
    >
      <h3 className="text-xl font-bold text-gray-800 mb-2">{model.name}</h3>
      <p className="text-gray-600 text-sm mb-4">{model.task}</p>
      <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${
        isAvailable
          ? 'bg-green-100 text-green-800'
          : 'bg-yellow-100 text-yellow-800'
      }`}>
        {isAvailable ? '✓ Available' : '🚧 Coming Soon'}
      </div>
    </div>
  );
};
