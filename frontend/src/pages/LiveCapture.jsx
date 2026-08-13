import React, { useState, useEffect, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import axios from 'axios';
import FlowChartWithWarnings from '../components/FlowChartWithWarnings';
import AnimatedBenignAttackPlot from '../components/AnimatedBenignAttackPlot';
import TestPeakRegionPlot from '../components/TestPeakRegionPlot';
import Test_T_t from '../components/Test_T_t';
import Test_dT_dt from '../components/Test_dT_dt';
import Test_d2T_dt2 from '../components/Test_d2T_dt2';
import Emergency from '../components/Emergency';
import ContinuousCapture from '../components/ContinuousCapture';
import KurtosisPlot from '../components/KurtosisPlot';
import { Link } from 'react-router-dom';
import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-alpine.css';
import SkewnessPlot from '../components/SkewnessPlot';
import HighLevelGraph from '../components/HighLevelGraph';
import { BoltIcon, ChartBarIcon, EyeIcon } from '@heroicons/react/24/outline';

const LiveCapture = () => {
  const [seconds, setSeconds] = useState(30);
  const [isCapturing, setIsCapturing] = useState(false);
  const [rowData, setRowData] = useState([]);
  const [error, setError] = useState(null);
  const [showChart, setShowChart] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [firstAttackIndex, setFirstAttackIndex] = useState(null);
  const [df, setDf] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showGraphs, setShowGraphs] = useState(false);
  
  // Add new state variables for continuous capture
  const [isContinuousCapturing, setIsContinuousCapturing] = useState(false);
  const [captureStatus, setCaptureStatus] = useState({
    isRunning: false,
    lastUpdate: null,
    dataPoints: 0,
    emergencyAlerts: 0,
    warningIndices: [],
    attackDetected: false
  });
  const statusCheckInterval = useRef(null);

  // Add state for kurtosis data
  const [kurtosisData, setKurtosisData] = useState([]);

  // Function to check capture status
  const checkCaptureStatus = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/api/continuous-capture/status');
      console.log('Status response:', response.data);
      
      // Update capture status
      setCaptureStatus({
        isRunning: response.data.is_running,
        lastUpdate: response.data.last_update,
        dataPoints: response.data.data_points || 0,
        emergencyAlerts: response.data.emergency_alerts || 0,
        warningIndices: response.data.warning_indices || [],
        attackDetected: response.data.attack_detected || false
      });

      // If kurtosis data is provided, update it
      if (response.data.kurtosis_df) {
        setKurtosisData(response.data.kurtosis_df);
      }

      // Refresh image URLs to force browser to reload images
      const timestamp = new Date().getTime();
      setImageUrls({
        benignAttack: `http://127.0.0.1:5000/api/images/test_benign_attack.png?t=${timestamp}`,
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
    skewnessPlot:'http://127.0.0.1:5000/api/images/test_set_-_skewness_flow_packets_s_skewness_plot.png',
    flowPlot:'http://127.0.0.1:5000/api/images/test_set_-_flow_rate_flow_packets_s_plot.png',
  });

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

  // JSX for live image display
  const LiveImageDisplay = ({imageUrls}) => {
    const [loadingStates, setLoadingStates] = useState({
      benignAttack: true,
      earlyWarnings: true,
      emergencyAlerts: true,
      T_t: true,
      dT_dt: true,
      d2T_dt2: true,
      kurtosisPlot: true,
      skewnessPlot: true,
      flowPlot: true
    });

    const [imageErrors, setImageErrors] = useState({
      benignAttack: false,
      earlyWarnings: false,
      emergencyAlerts: false,
      T_t: false,
      dT_dt: false,
      d2T_dt2: false,
      kurtosisPlot: false,
      skewnessPlot: false,
      flowPlot: false
    });

    const handleImageLoad = (imageName) => {
      setLoadingStates(prev => ({
        ...prev,
        [imageName]: false
      }));
    };

    const handleImageError = (imageName) => {
      setLoadingStates(prev => ({
        ...prev,
        [imageName]: false
      }));
      setImageErrors(prev => ({
        ...prev,
        [imageName]: true
      }));
    };

    const ImageContainer = ({ title, imageName, imageUrl }) => (
      <div className="bg-surface rounded-lg shadow-card p-4">
        <h3 className="text-lg font-semibold mb-3 text-primary">{title}</h3>
        <div className="relative w-full h-[300px] flex items-center justify-center">
          {loadingStates[imageName] && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          )}
          {!loadingStates[imageName] && imageErrors[imageName] ? (
            <div className="text-red-500 text-center">
              <p>Failed to load image</p>
              <p className="text-sm text-textSecondary">Please try refreshing the page</p>
            </div>
          ) : (
            <img 
              src={imageUrl} 
              alt={title} 
              className={`w-full h-auto ${loadingStates[imageName] ? 'opacity-0' : 'opacity-100'}`}
              onLoad={() => handleImageLoad(imageName)}
              onError={() => handleImageError(imageName)}
            />
          )}
        </div>
      </div>
    );

    return (
      <div className="flex flex-col gap-6 mb-8">
        <ImageContainer 
          title="Traffic Flow Pattern" 
          imageName="benignAttack" 
          imageUrl={imageUrls.benignAttack} 
        />
        
        <ImageContainer 
          title="Early Warning Signals" 
          imageName="earlyWarnings" 
          imageUrl={imageUrls.earlyWarnings} 
        />
        
        <ImageContainer 
          title="Emergency Alerts" 
          imageName="emergencyAlerts" 
          imageUrl={imageUrls.emergencyAlerts} 
        />
        
        <ImageContainer 
          title="T(t) Plot" 
          imageName="T_t" 
          imageUrl={imageUrls.T_t} 
        />
        
        <ImageContainer 
          title="dT/dt Plot" 
          imageName="dT_dt" 
          imageUrl={imageUrls.dT_dt} 
        />
        
        <ImageContainer 
          title="d²T/dt² Plot" 
          imageName="d2T_dt2" 
          imageUrl={imageUrls.d2T_dt2} 
        />

        <ImageContainer 
          title="Flow Rate Plot" 
          imageName="flowPlot" 
          imageUrl={imageUrls.flowPlot} 
        />

        <ImageContainer 
          title="Kurtosis Plot" 
          imageName="kurtosisPlot" 
          imageUrl={imageUrls.kurtosisPlot} 
        />

        <ImageContainer 
          title="Skewness Plot" 
          imageName="skewnessPlot" 
          imageUrl={imageUrls.skewnessPlot} 
        />
      </div>
    );
  };

  const columnDefs = [
    { field: 'Timestamp', headerName: 'Timestamp', sortable: true },
    { field: 'Source IP', headerName: 'Source IP', sortable: true },
    { field: 'Source Port', headerName: 'Source Port', sortable: true },
    { field: 'Destination IP', headerName: 'Destination IP', sortable: true },
    { field: 'Destination Port', headerName: 'Destination Port', sortable: true },
    { field: 'Flow ID', headerName: 'Flow ID', sortable: true },
    { field: 'URG Flag Count', headerName: 'URG Flag Count', sortable: true },
    { field: 'CWE Flag Count', headerName: 'CWE Flag Count', sortable: true },
    { field: 'FWD PSH Flag Count', headerName: 'FWD PSH Flag Count', sortable: true },
    { field: 'RST Flag Count', headerName: 'RST Flag Count', sortable: true },
    { field: 'Packet Length', headerName: 'Packet Length', sortable: true },
    { field: 'Minimum Packet Length', headerName: 'Minimum Packet Length', sortable: true },
    { field: 'Minimum FWD Packet Length', headerName: 'Minimum FWD Packet Length', sortable: true },
    { field: 'Flow Bytes', headerName: 'Flow Bytes', sortable: true },
    { field: 'Flow Packets/s', headerName: 'Flow Packets/s', sortable: true },
    { field: 'FWD PPS', headerName: 'FWD PPS', sortable: true },
    { field: 'Down/Up Ratio', headerName: 'Down/Up Ratio', sortable: true },
    { field: 'Inbound Packet Count', headerName: 'Inbound Packet Count', sortable: true },
    { field: 'Total BWD IAT', headerName: 'Total BWD IAT', sortable: true },
    { field: 'Average Packet Size', headerName: 'Average Packet Size', sortable: true },
    { field: 'Minimum Segment Size FWD', headerName: 'Minimum Segment Size FWD', sortable: true },
    { field: 'FWD Packet Length Mean', headerName: 'FWD Packet Length Mean', sortable: true },
    { field: 'Avg FWD Segment Size', headerName: 'Avg FWD Segment Size', sortable: true }
  ];

  const handleStartCapture = async () => {
    try {
      setError(null);
      setLoading(true);
      setIsCapturing(true);
      const formData = new FormData();
      formData.append('seconds', seconds);
      console.log('Sending request with seconds:', seconds);
      
      const response = await axios.post('http://127.0.0.1:5000/api/capture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      console.log('Raw response:', response);
      
      // Handle the response data
      let responseData;
      if (typeof response.data === 'string') {
        // Clean the string before parsing
        const cleanedString = response.data
          .replace(/NaN/g, 'null')
          .replace(/Infinity/g, 'null')
          .replace(/-Infinity/g, 'null');
        
        try {
          responseData = JSON.parse(cleanedString);
        } catch (parseError) {
          console.error('Error parsing cleaned string:', parseError);
          console.error('Cleaned string:', cleanedString);
          throw parseError;
        }
      } else {
        // If it's already an object, clean the values
        responseData = JSON.parse(JSON.stringify(response.data, (key, value) => {
          if (value === Infinity || value === -Infinity || isNaN(value)) {
            return null;
          }
          return value;
        }));
      }
      
      console.log('Parsed response data:', responseData);
      
      if (responseData.message === 'Capture started') {
        const flowData = responseData.flow_data;
        
        if (!flowData || !Array.isArray(flowData)) {
          console.error('Invalid flow data format:', flowData);
          setError('Invalid data format received from server');
          return;
        }
        
        console.log('Number of flow records:', flowData.length);
        
        const formattedData = flowData.map(item => ({
          'Timestamp': item['Timestamp'] || '',
          'Source IP': item['Source IP'] || '',
          'Source Port': item['Source Port'] || '',
          'Destination IP': item['Destination IP'] || '',
          'Destination Port': item['Destination Port'] || '',
          'Flow ID': item['Flow ID'] || '',
          'URG Flag Count': item['URG Flag Count'] || '',
          'CWE Flag Count': item['CWE Flag Count'] || '',
          'FWD PSH Flag Count': item['FWD PSH Flag Count'] || '',
          'RST Flag Count': item['RST Flag Count'] || '',
          'Packet Length': item['Packet Length'] || '',
          'Minimum Packet Length': item['Minimum Packet Length'] || '',
          'Minimum FWD Packet Length': item['Minimum FWD Packet Length'] || '',
          'Flow Bytes': item['Flow Bytes'] || '',
          'Flow Packets/s': item['Flow Packets/s'] || '',
          'FWD PPS': item['FWD PPS'] || '',
          'Down/Up Ratio': item['Down/Up Ratio'] || '',
          'Inbound Packet Count': item['Inbound Packet Count'] || '',
          'Total BWD IAT': item['Total BWD IAT'] || '',
          'Average Packet Size': item['Average Packet Size'] || '',
          'Minimum Segment Size FWD': item['Minimum Segment Size FWD'] || '',
          'FWD Packet Length Mean': item['FWD Packet Length Mean'] || '',
          'Avg FWD Segment Size': item['Avg FWD Segment Size'] || ''
        }));
        
        setRowData(formattedData);
        setDf(formattedData);
        setWarnings(responseData.warning_indices || []);
        setFirstAttackIndex(responseData.first_attack_test || 0);
      }
    } catch (err) {
      console.error('Error starting capture:', err);
      console.error('Error details:', err.response?.data);
      setError('Failed to start capture. Please try again.');
    } finally {
      setIsCapturing(false);
      setLoading(false);
    }
  };

  const handleProcessData = async () => {
    if (rowData.length === 0) {
      setError('No data to process. Please capture data first.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setShowGraphs(true); // Show graphs when processing starts

    try {
      const formattedData = rowData.map(item => ({
        Seconds: parseFloat(item.Seconds) || 0,
        'Flow Packets/s': parseFloat(item['Flow Packets/s']) || 0,
        'T(t)': parseFloat(item['Flow Packets/s']) || 0,
        Label: item.Label || 1
      }));

      console.log('Sending formatted data to backend:', formattedData);

      const response = await axios.post('http://127.0.0.1:5000/api/process-captured-data', {
        data: formattedData
      });
      
      console.log('Process response:', response.data);
      
      if (response.data && Array.isArray(response.data)) {
        setChartData(response.data);
        // Check if kurtosis_df exists in the response
        if (response.data.kurtosis_df) {
          setKurtosisData(response.data.kurtosis_df);
        } else {
          // Generate kurtosis data if not already included in response
          const kurtosis = calculateKurtosis(response.data);
          setKurtosisData(kurtosis);
        }
      } else if (response.data && response.data.data) {
        setChartData(response.data.data);
        // Set kurtosis data if included in response
        if (response.data.kurtosis_df) {
          setKurtosisData(response.data.kurtosis_df);
        } else if (response.data.kurtosis_data) {
          setKurtosisData(response.data.kurtosis_data);
        } else {
          // Generate kurtosis data if not included
          const kurtosis = calculateKurtosis(response.data.data);
          setKurtosisData(kurtosis);
        }
      } else {
        throw new Error('Invalid data format received from server');
      }
    } catch (error) {
      console.error('Error processing data:', error);
      setError(error.message || 'Failed to process data');
    } finally {
      setIsProcessing(false);
    }
  };

  // Helper function to calculate kurtosis data if not provided by backend
  const calculateKurtosis = (data) => {
    // Create a simple placeholder kurtosis calculation
    // In a real implementation, this would use proper statistical methods
    const windowSize = 100;
    const kurtosisData = [];
    
    for (let i = windowSize; i < data.length; i++) {
      const window = data.slice(i - windowSize, i);
      const values = window.map(point => point['Flow Packets/s'] || 0);
      
      // Simple placeholder kurtosis value (not statistically accurate)
      // Just to demonstrate the component
      const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      // Extremely simplified kurtosis approximation
      const kurtosis = values.reduce((sum, val) => {
        const z = (val - mean) / (stdDev || 1);
        return sum + Math.pow(z, 4);
      }, 0) / values.length;
      
      kurtosisData.push({
        Seconds: data[i].Seconds,
        'Flow Packets/s_kurtosis': kurtosis / 3 // Normalize closer to Gaussian kurtosis
      });
    }
    
    return kurtosisData;
  };

  // Reusable loading spinner component
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  // Add ChartWrapper for consistent styling
  const ChartWrapper = ({ children, title, id }) => (
    <div className="bg-surface rounded-lg shadow-card p-5 mb-6 overflow-hidden h-full">
      {title && (
        <h2 id={`chart-title-${id}`} className="text-lg font-semibold mb-4 pb-2 border-b border-border text-primary">
          {title}
        </h2>
      )}
      <div className="h-[400px] w-full">{children}</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background font-sans relative overflow-hidden">
      {/* Animated accent background */}
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-gradient-to-br from-[#181A20] via-[#1e293b] to-[#23262F]" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-[700px] h-[300px] bg-accent/20 blur-3xl rounded-full animate-pulse opacity-60" aria-hidden="true" />
      </div>
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-14">
          <BoltIcon className="h-16 w-16 text-accent mb-4 drop-shadow-neon animate-bounce" aria-hidden="true" />
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight text-primary drop-shadow-neon mb-3">
            Live Traffic Capture
          </h1>
          <p className="text-lg md:text-xl text-textSecondary font-medium max-w-2xl mb-6">
            Capture and analyze live network traffic to detect DDoS attacks in real time. Start a capture, process the data, and view instant visualizations.
          </p>
        </div>
        {/* Stepper Workflow */}
        <div className="flex flex-col md:flex-row justify-center items-center gap-8 mb-14">
          <div className="flex flex-col items-center">
            <div className="bg-surface rounded-full p-4 shadow-card mb-2">
              <BoltIcon className="h-8 w-8 text-accent" />
            </div>
            <span className="text-textSecondary font-semibold">1. Capture</span>
          </div>
          <div className="h-8 w-1 md:w-8 md:h-1 bg-accent/40 rounded-full" />
          <div className="flex flex-col items-center">
            <div className="bg-surface rounded-full p-4 shadow-card mb-2">
              <ChartBarIcon className="h-8 w-8 text-accent" />
            </div>
            <span className="text-textSecondary font-semibold">2. Process</span>
          </div>
          <div className="h-8 w-1 md:w-8 md:h-1 bg-accent/40 rounded-full" />
          <div className="flex flex-col items-center">
            <div className="bg-surface rounded-full p-4 shadow-card mb-2">
              <EyeIcon className="h-8 w-8 text-accent" />
            </div>
            <span className="text-textSecondary font-semibold">3. Visualize</span>
          </div>
        </div>
        {/* Continuous Capture Controls */}
        <div className="mb-12">
          <ContinuousCapture />
        </div>
        {/* Live Images Section */}
        {(isContinuousCapturing || (captureStatus.lastUpdate && showGraphs)) && (
          <div className="mb-14">
            <h2 className="text-2xl font-bold text-primary mb-6 text-center">Live Traffic Analysis</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <LiveImageDisplay imageUrls={imageUrls} />
            </div>
          </div>
        )}
        {/* Data Table Section */}
        {rowData.length > 0 && !loading && (
          <div className="bg-surface/80 rounded-2xl shadow-card p-10 mb-14 backdrop-blur-md border border-border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-primary">Captured Traffic</h2>
              <button
                onClick={() => window.history.back()}
                className="flex items-center gap-2 px-5 py-2 bg-surface text-textSecondary border border-border rounded-lg hover:bg-border hover:text-primary transition-colors duration-200 font-semibold"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
                </svg>
                Back
              </button>
            </div>
            <div className="ag-theme-alpine dark-ag-grid font-sans rounded-lg overflow-hidden" style={{ height: 500, width: '100%' }}>
              <AgGridReact
                rowData={rowData}
                columnDefs={columnDefs}
                pagination={true}
                paginationPageSize={10}
                defaultColDef={{
                  sortable: true,
                  filter: true,
                  resizable: true
                }}
              />
            </div>
          </div>
        )}
        {/* Visualizations Section */}
        {showGraphs && chartData.length > 0 && (
          <div className="flex flex-col gap-10">
            <ChartWrapper title="Flow Chart with Warnings" id="flow-chart">
              <FlowChartWithWarnings
                data={chartData}
                warningIndices={warnings}
              />
            </ChartWrapper>
            <ChartWrapper title="Emergency Alert Plot" id="emergency-alert">
              <Emergency
                data={chartData}
                datasetName="Emergency Alert Plot"
              />
            </ChartWrapper>
            <ChartWrapper title="Benign vs Attack Plot" id="benign-attack">
              <AnimatedBenignAttackPlot
                csvData={chartData}
              />
            </ChartWrapper>
            <ChartWrapper title="Peak Region Analysis" id="peak-region">
              <TestPeakRegionPlot
                df={chartData}
                firstAttackIndex={firstAttackIndex}
              />
            </ChartWrapper>
            <ChartWrapper title="T(t) Plot" id="t-t-plot">
              <Test_T_t
                df={chartData}
                name="Processed Data"
              />
            </ChartWrapper>
            <ChartWrapper title="dT/dt Plot" id="dt-dt-plot">
              <Test_dT_dt
                df={chartData}
                name="Processed Data"
              />
            </ChartWrapper>
            <ChartWrapper title="d²T/dt² Plot" id="d2t-dt2-plot">
              <Test_d2T_dt2
                df={chartData}
                name="Processed Data"
              />
            </ChartWrapper>
            <ChartWrapper title="Kurtosis Plot with EWS" id="kurtosis-plot">
              <KurtosisPlot
                data={chartData}
                kurtosisData={kurtosisData}
                datasetName="Processed Data"
              />
            </ChartWrapper>
            <ChartWrapper title="Skewness Plot with EWS" id="skewness-plot">
              <SkewnessPlot
                data={chartData}
                datasetName="Processed Data"
              />
            </ChartWrapper>
            <ChartWrapper title="Low Level Early Warnings" id="low-level-alerts">
              <HighLevelGraph 
                data={chartData} 
                flowData={df}
                level={1}
              />
            </ChartWrapper>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveCapture; 