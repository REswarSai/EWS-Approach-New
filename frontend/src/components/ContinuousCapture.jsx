import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Button from '../components/Button';

const ContinuousCapture = () => {
  const [isContinuousCapturing, setIsContinuousCapturing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showGraphs, setShowGraphs] = useState(false);
  const [captureStatus, setCaptureStatus] = useState({
    isRunning: false,
    lastUpdate: null,
    dataPoints: 0,
    emergencyAlerts: 0,
    warningIndices: [],
    attackDetected: false
  });
  const statusCheckInterval = useRef(null);

  // Function to check capture status
  const checkCaptureStatus = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/continuous-capture/status');
      console.log('Status response:', response.data);
      setCaptureStatus({
        isRunning: response.data.is_running,
        lastUpdate: response.data.last_update,
        dataPoints: response.data.data_points || 0,
        emergencyAlerts: response.data.emergency_alerts || 0,
        warningIndices: response.data.warning_indices || [],
        attackDetected: response.data.attack_detected || false
      });

      // Refresh image URLs to force browser to reload images
      const timestamp = new Date().getTime();
      setImageUrls({
        benignAttack: `http://127.0.0.1:5000/api/images/live_benign_attack.png?t=${timestamp}`,
        earlyWarnings: `http://127.0.0.1:5000/api/images/live_early_warnings.png?t=${timestamp}`,
        emergencyAlerts: `http://127.0.0.1:5000/api/images/live_emergency_alerts.png?t=${timestamp}`,
        T_t: `http://127.0.0.1:5000/api/images/live_t_t.png?t=${timestamp}`,
        dT_dt: `http://127.0.0.1:5000/api/images/live_dt_dt.png?t=${timestamp}`,
        d2T_dt2: `http://127.0.0.1:5000/api/images/live_d2t_dt2.png?t=${timestamp}`,
        kurtosisPlot: `http://127.0.0.1:5000/api/images/test_set_-_kurtosis_flow_packets_s_kurtosis_plot.png?t=${timestamp}`,
        skewnessPlot: `http://127.0.0.1:5000/api/images/test_set_-_skewness_flow_packets_s_skewness_plot.png?t=${timestamp}`,
        flowPlot: `http://127.0.0.1:5000/api/images/test_set_-_flow_rate_flow_packets_s_plot.png?t=${timestamp}`
      });

      // If capture has stopped but our state says it's running, update state
      if (!response.data.is_running && isContinuousCapturing) {
        setIsContinuousCapturing(false);
        clearInterval(statusCheckInterval.current);
        statusCheckInterval.current = null;
      }
    } catch (err) {
      console.error('Error checking capture status:', err);
    }
  };

  // Start continuous status check when component mounts
  useEffect(() => {
    // Check initial status
    checkCaptureStatus();
    
    // Cleanup interval on component unmount
    return () => {
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
    };
  }, []);

  // Add state for image URLs
  const [imageUrls, setImageUrls] = useState({
    benignAttack: 'http://127.0.0.1:5000/api/images/live_benign_attack.png',
    earlyWarnings: 'http://127.0.0.1:5000/api/images/live_early_warnings.png',
    emergencyAlerts: 'http://127.0.0.1:5000/api/images/live_emergency_alerts.png',
    T_t: 'http://127.0.0.1:5000/api/images/live_t_t.png',
    dT_dt: 'http://127.0.0.1:5000/api/images/live_dt_dt.png',
    d2T_dt2: 'http://127.0.0.1:5000/api/images/live_d2t_dt2.png',
    kurtosisPlot: 'http://127.0.0.1:5000/api/images/test_set_-_kurtosis_flow_packets_s_kurtosis_plot.png',
    skewnessPlot: 'http://127.0.0.1:5000/api/images/test_set_-_skewness_flow_packets_s_skewness_plot.png',
    flowPlot: 'http://127.0.0.1:5000/api/images/test_set_-_flow_rate_flow_packets_s_plot.png'
  });

  // Update image URLs based on status response
  useEffect(() => {
    if (captureStatus.lastUpdate) {
      // Add a timestamp to ensure the browser doesn't cache the images
      const timestamp = new Date().getTime();
      setImageUrls({
        benignAttack: `http://127.0.0.1:5000/api/images/live_benign_attack.png?t=${timestamp}`,
        earlyWarnings: `http://127.0.0.1:5000/api/images/live_early_warnings.png?t=${timestamp}`,
        emergencyAlerts: `http://127.0.0.1:5000/api/images/live_emergency_alerts.png?t=${timestamp}`,
        T_t: `http://127.0.0.1:5000/api/images/live_t_t.png?t=${timestamp}`,
        dT_dt: `http://127.0.0.1:5000/api/images/live_dt_dt.png?t=${timestamp}`,
        d2T_dt2: `http://127.0.0.1:5000/api/images/live_d2t_dt2.png?t=${timestamp}`,
        kurtosisPlot: `http://127.0.0.1:5000/api/images/test_set_-_kurtosis_flow_packets_s_kurtosis_plot.png?t=${timestamp}`,
        skewnessPlot: `http://127.0.0.1:5000/api/images/test_set_-_skewness_flow_packets_s_skewness_plot.png?t=${timestamp}`,
        flowPlot: `http://127.0.0.1:5000/api/images/test_set_-_flow_rate_flow_packets_s_plot.png?t=${timestamp}`
      });
    }
  }, [captureStatus.lastUpdate]);

  // Function to start continuous capture
  const handleStartContinuousCapture = async () => {
    try {
      setError(null);
      setLoading(true);
      setIsContinuousCapturing(true);
      setShowGraphs(true);
      
      const response = await axios.post('http://127.0.0.1:5000/api/continuous-capture/start');
      console.log('Continuous capture started:', response.data);
      
      // Start polling for status updates
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
      }
      
      statusCheckInterval.current = setInterval(checkCaptureStatus, 1000); // Check every 1 second
      
      // Initial status check
      await checkCaptureStatus();
    } catch (err) {
      console.error('Error starting continuous capture:', err);
      setError('Failed to start continuous capture: ' + (err.response?.data?.message || err.message));
      setIsContinuousCapturing(false);
    } finally {
      setLoading(false);
    }
  };

  // Function to stop continuous capture
  const handleStopContinuousCapture = async () => {
    try {
      const response = await axios.post('http://127.0.0.1:5000/api/continuous-capture/stop');
      console.log('Continuous capture stopped:', response.data);
      setIsContinuousCapturing(false);
      
      // Stop the interval
      if (statusCheckInterval.current) {
        clearInterval(statusCheckInterval.current);
        statusCheckInterval.current = null;
      }
      
      // Final status check to get latest data
      await checkCaptureStatus();
    } catch (err) {
      console.error('Error stopping continuous capture:', err);
      setError('Failed to stop continuous capture: ' + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div>
      <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
        <h2 className="text-xl font-bold text-blue-900 mb-4">Continuous Network Monitoring</h2>
        
        <div className="flex flex-wrap gap-4 mb-4">
          {!isContinuousCapturing ? (
            <Button
              onClick={handleStartContinuousCapture}
              disabled={loading}
              variant="primary"
              className="flex items-center"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-background" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Starting...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Continuous Monitoring
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleStopContinuousCapture}
              variant="danger"
              className="flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              </svg>
              Stop Monitoring
            </Button>
          )}
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-lg">
            <p className="font-semibold">{error}</p>
          </div>
        )}

        {captureStatus.lastUpdate && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">Monitoring Status</h3>
            <p className="text-sm"><span className="font-medium">Status:</span> 
              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isContinuousCapturing ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                {isContinuousCapturing ? 'Active' : 'Inactive'}
              </span>
            </p>
            <p className="text-sm"><span className="font-medium">Last update:</span> <span className="ml-2">{captureStatus.lastUpdate || 'Not started'}</span></p>
            <p className="text-sm"><span className="font-medium">Emergency alerts:</span> 
              <span className={`ml-2 ${captureStatus.emergencyAlerts > 0 ? 'text-red-600 font-semibold' : ''}`}>
                {captureStatus.emergencyAlerts}
              </span>
            </p>
          </div>
        )}
      </div>

      {/* Show live images if continuous monitoring is active */}
      {(isContinuousCapturing || (captureStatus.lastUpdate && showGraphs)) && (
        <div className="mb-8">
          <h2 className="text-xl font-bold text-blue-900 mb-4">Live Traffic Analysis</h2>
          <div className="flex flex-col gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-blue-900">Traffic Flow Pattern</h3>
              <img src={imageUrls.benignAttack} alt="Traffic Flow Pattern" className="w-full h-auto" />
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-blue-900">Early Warning Signals</h3>
              <img src={imageUrls.earlyWarnings} alt="Early Warning Signals" className="w-full h-auto" />
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-blue-900">Emergency Alerts</h3>
              <img src={imageUrls.emergencyAlerts} alt="Emergency Alerts" className="w-full h-auto" />
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-blue-900">T(t) Plot</h3>
              <img src={imageUrls.T_t} alt="T(t) Plot" className="w-full h-auto" />
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-blue-900">dT/dt Plot</h3>
              <img src={imageUrls.dT_dt} alt="dT/dt Plot" className="w-full h-auto" />
            </div>
            
            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-blue-900">d²T/dt² Plot</h3>
              <img src={imageUrls.d2T_dt2} alt="d²T/dt² Plot" className="w-full h-auto" />
            </div>

            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-blue-900">Flow Rate Plot</h3>
              <img src={imageUrls.flowPlot} alt="Flow Rate Plot" className="w-full h-auto" />
            </div>

            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-blue-900">Kurtosis Plot</h3>
              <img src={imageUrls.kurtosisPlot} alt="Kurtosis Plot" className="w-full h-auto" />
            </div>

            <div className="bg-white rounded-lg shadow-lg p-4">
              <h3 className="text-lg font-semibold mb-3 text-blue-900">Skewness Plot</h3>
              <img src={imageUrls.skewnessPlot} alt="Skewness Plot" className="w-full h-auto" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContinuousCapture; 