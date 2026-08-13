import React from 'react';
import { useNavigate } from 'react-router-dom';

const Detection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900">Detection</h1>
          <button 
            onClick={() => navigate(-1)}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-300"
          >
            Back
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* CSV Analysis Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl font-bold text-blue-900 mb-4">CSV Analysis</h2>
            <p className="text-gray-600 mb-6">
              Upload and analyze network traffic data from CSV files to detect potential DDoS attacks
            </p>
            <button
              onClick={() => navigate('/detection-upload-csv')}
              className="px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors duration-300"
            >
              Analyze CSV
            </button>
          </div>

          {/* Live Traffic Capture Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl font-bold text-blue-900 mb-4">Live Traffic Capture</h2>
            <p className="text-gray-600 mb-6">
              Detect DDoS attacks by capturing and analyzing network traffic in real-time
            </p>
            <button
              onClick={() => navigate('/detection-live-traffic')}
              className="px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors duration-300"
            >
              Start Live Detection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Detection; 