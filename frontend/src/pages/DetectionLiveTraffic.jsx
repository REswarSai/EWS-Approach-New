import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const DetectionLiveTraffic = () => {
  const navigate = useNavigate();
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureTime, setCaptureTime] = useState(0);
  const [logs, setLogs] = useState([]);

  const handleStartCapture = () => {
    setIsCapturing(true);
    setLogs([{ time: new Date().toLocaleTimeString(), message: 'Started traffic capture for DDoS detection' }]);
    
    // Set up interval to update capture time
    const interval = setInterval(() => {
      setCaptureTime(prev => {
        const newTime = prev + 1;
        
        // Add random log messages for demo purposes
        if (newTime % 5 === 0) {
          const messages = [
            'Analyzing packet patterns...',
            'Checking for traffic anomalies...',
            'Processing network flows...',
            'Scanning for volumetric attack patterns...',
            'Monitoring traffic distribution...'
          ];
          const randomMessage = messages[Math.floor(Math.random() * messages.length)];
          setLogs(prevLogs => [
            { time: new Date().toLocaleTimeString(), message: randomMessage },
            ...prevLogs.slice(0, 9) // Keep last 10 logs
          ]);
        }
        
        return newTime;
      });
    }, 1000);
    
    // Store interval ID for cleanup
    window.captureInterval = interval;
  };

  const handleStopCapture = () => {
    setIsCapturing(false);
    clearInterval(window.captureInterval);
    setLogs(prevLogs => [
      { time: new Date().toLocaleTimeString(), message: 'Stopped traffic capture' },
      ...prevLogs.slice(0, 9)
    ]);
  };

  // Format seconds into MM:SS format
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900">Live Traffic Detection</h1>
          <button 
            onClick={() => navigate('/detection')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-300"
          >
            Back
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-blue-900">DDoS Attack Detection</h2>
              <p className="text-gray-600 mt-2">
                Capture and analyze live network traffic to detect potential DDoS attacks in real-time
              </p>
            </div>
            <div className="text-2xl font-mono bg-black text-green-400 py-2 px-4 rounded-lg">
              {formatTime(captureTime)}
            </div>
          </div>
          
          <div className="flex space-x-4 mb-8">
            {!isCapturing ? (
              <button
                onClick={handleStartCapture}
                className="px-6 py-3 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors duration-300"
              >
                Start Detection
              </button>
            ) : (
              <button
                onClick={handleStopCapture}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-300"
              >
                Stop Detection
              </button>
            )}
          </div>
          
          {/* Log display */}
          <div className="border border-gray-200 rounded-lg p-4 bg-black text-green-400 font-mono h-96 overflow-y-auto">
            <h3 className="text-xl mb-2 text-white">Detection Log</h3>
            {logs.length === 0 ? (
              <p className="text-gray-500">No logs yet. Start detection to begin monitoring.</p>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="flex">
                    <span className="text-blue-400 mr-2">[{log.time}]</span>
                    <span>{log.message}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetectionLiveTraffic; 