import { useNavigate } from 'react-router-dom';
import { CloudArrowUpIcon, BoltIcon } from '@heroicons/react/24/outline';

const Prevention = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans relative overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 pointer-events-none z-0 opacity-10">
        <div className="absolute inset-0 bg-grid-white/[0.05]"></div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
              Proactive DDoS Defense
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Choose your analysis method to detect and prevent network threats before they impact your systems.
          </p>
        </div>

        {/* Interactive Selection Cards */}
        <div className="flex flex-col md:flex-row gap-8 justify-center">
          {/* CSV Analysis */}
          <div 
            onClick={() => navigate('/flow-analysis')}
            className="group relative bg-gray-800/80 border border-gray-700 rounded-xl p-8 cursor-pointer transition-all duration-300 hover:border-cyan-400/50 hover:shadow-lg hover:shadow-cyan-400/10 flex-1 max-w-md"
          >
            <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-cyan-400/30 pointer-events-none transition-all duration-300"></div>
            <div className="flex flex-col items-center text-center h-full">
              <div className="mb-6 p-4 bg-gray-800 rounded-full border border-gray-700 group-hover:bg-cyan-900/20 group-hover:border-cyan-400/30 transition-colors duration-300">
                <CloudArrowUpIcon className="h-8 w-8 text-cyan-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Dataset Upload</h2>
              <p className="text-gray-400 mb-6">
                Upload and analyze network traffic data to identify attack patterns.
              </p>
              <div className="mt-auto px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded-lg transition-all duration-200">
                Upload CSV
              </div>
            </div>
          </div>

          {/* Live Capture */}
          <div 
            onClick={() => navigate('/live-capture')}
            className="group relative bg-gray-800/80 border border-gray-700 rounded-xl p-8 cursor-pointer transition-all duration-300 hover:border-blue-400/50 hover:shadow-lg hover:shadow-blue-400/10 flex-1 max-w-md"
          >
            <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-blue-400/30 pointer-events-none transition-all duration-300"></div>
            <div className="flex flex-col items-center text-center h-full">
              <div className="mb-6 p-4 bg-gray-800 rounded-full border border-gray-700 group-hover:bg-blue-900/20 group-hover:border-blue-400/30 transition-colors duration-300">
                <BoltIcon className="h-8 w-8 text-blue-400" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Real-time Monitoring</h2>
              <p className="text-gray-400 mb-6">
                Capture live network traffic to detect and mitigate DDoS attacks as they happen.
              </p>
              <div className="mt-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-all duration-200">
                Start Capture
              </div>
            </div>
          </div>
        </div>

        {/* Subtle footer note */}
        <div className="mt-16 text-center text-gray-500 text-sm">
          <p>Select an option above to begin your network protection journey</p>
        </div>
      </div>
    </div>
  );
};

export default Prevention;