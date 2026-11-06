import React from 'react';

interface LoadingProps {
  text?: string;
  message?: string;
}

export const Loading: React.FC<LoadingProps> = ({ text, message = 'Processing...' }) => {
  const displayText = text || message;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 text-center">
        <div className="mb-4">
          <div className="inline-block">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
          </div>
        </div>
        <p className="text-lg font-semibold text-gray-700">{displayText}</p>
        <p className="text-sm text-gray-500 mt-2">Please wait while we process your image...</p>
      </div>
    </div>
  );
};
