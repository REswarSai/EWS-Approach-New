import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900">Dashboard</h1>
          <Link 
            to="/" 
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-300"
          >
            Back to Home
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Detection Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl font-bold text-blue-900 mb-4">Detection</h2>
            <p className="text-gray-600 mb-6">
              Monitor and detect potential security threats in real-time
            </p>
            <button
              onClick={() => navigate('/detection')}
              className="px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors duration-300"
            >
              View Detection
            </button>
          </div>

          {/* Prevention Card */}
          <div className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-2xl font-bold text-blue-900 mb-4">Prevention</h2>
            <p className="text-gray-600 mb-6">
              Proactively prevent security threats through analysis and monitoring
            </p>
            <button
              onClick={() => navigate('/prevention')}
              className="px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors duration-300"
            >
              View Prevention
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 