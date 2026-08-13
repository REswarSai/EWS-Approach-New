import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AnimatedChart from './AnimatedChart';

const LiveCapture = () => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureDuration, setCaptureDuration] = useState(10);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  
  const baseUrl = 'http://127.0.0.1:5000';

  const startCapture = async () => {
    try {
      setIsCapturing(true);
      setError(null);
      
      const response = await axios.get(`${baseUrl}/api/capture?seconds=${captureDuration}`);
      
      if (response.data && response.data.flows) {
        setData(response.data.flows);
      } else {
        setError('No data received from capture');
      }
    } catch (error) {
      console.error('Error during capture:', error);
      setError('Failed to capture data');
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center space-x-4">
        <input
          type="number"
          min="1"
          max="60"
          value={captureDuration}
          onChange={(e) => setCaptureDuration(Math.min(60, Math.max(1, parseInt(e.target.value) || 1)))}
          className="w-20 px-3 py-2 border rounded"
          disabled={isCapturing}
        />
        <button
          onClick={startCapture}
          disabled={isCapturing}
          className={`px-4 py-2 rounded ${
            isCapturing
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          {isCapturing ? 'Capturing...' : 'Start Capture'}
        </button>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {isCapturing ? (
        <div className="h-96 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mb-4"></div>
            <p>Capturing network traffic...</p>
          </div>
        </div>
      ) : data.length > 0 ? (
        <AnimatedChart 
          data={data}
          title="Live Capture"
          showEmergencyAlerts={true}
          showAttackPoints={true}
        />
      ) : (
        <div className="h-96 flex items-center justify-center text-gray-500">
          <p>No data captured yet. Click "Start Capture" to begin.</p>
        </div>
      )}
    </div>
  );
};

export default LiveCapture; 