import React from 'react';

interface NavbarProps {
  title?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ title }) => {
  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <div className="text-2xl font-bold">🛰️</div>
            <div>
              <h1 className="text-xl font-bold">{title || "Disaster Vision"}</h1>
              <p className="text-xs text-blue-100">Damage Assessment System</p>
            </div>
          </div>
          <div className="flex gap-6">
            <a href="/" className="hover:text-blue-200 transition">Home</a>
            <a href="/compare" className="hover:text-blue-200 transition">Compare</a>
            <a href="/models" className="hover:text-blue-200 transition">Models</a>
          </div>
        </div>
      </div>
    </nav>
  );
};
