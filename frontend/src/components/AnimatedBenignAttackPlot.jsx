import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import axios from 'axios';
import { Howl } from 'howler';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Load a beep sound
const beepSound = new Howl({
  src: ['https://actions.google.com/sounds/v1/alarms/beep_short.ogg'],
});

const AnimatedBenignAttackPlot = ({ csvData, frameIndex: externalFrameIndex, isAnimating: externalIsAnimating }) => {
  const [frameIndex, setFrameIndex] = useState(10);
  const [isAnimating, setIsAnimating] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  
  const animationRef = useRef(null);
  const beepedIndicesRef = useRef(new Set());
  const chartRef = useRef(null);
  
  const baseUrl = 'http://127.0.0.1:5000';

  // Use external frame index and animation state if provided
  useEffect(() => {
    if (externalFrameIndex !== undefined) {
      setFrameIndex(externalFrameIndex);
    }
    
    if (externalIsAnimating !== undefined) {
      setIsAnimating(externalIsAnimating);
    }
  }, [externalFrameIndex, externalIsAnimating]);

  // Use CSV data if provided, otherwise load from API
  useEffect(() => {
    if (csvData && csvData.length > 0) {
      console.log("AnimatedBenignAttackPlot: Using CSV data from parent", csvData.length);
      
      // Transform CSV data to expected format if needed
      const transformedData = csvData.map(row => ({
        Seconds: row.Seconds || row.Time || row.timestamp || 0,
        'Flow Packets/s': row['Flow Packets/s'] || row.Value || row.packets || 0,
        Label: determineLabel(row),
        emergency_alert: row.emergency_alert || (row.anomaly_score > 0.8 ? 1 : 0) || 0
      }));
      
      setData(transformedData);
      setIsLoading(false);
      return;
    }
    
    // Only load data from API if we don't have CSV data
    console.log("AnimatedBenignAttackPlot: No CSV data provided, loading from API");
    const loadData = async () => {
      try {
        setIsLoading(true);
        console.log("AnimatedBenignAttackPlot: Loading data...");
        
        // First try to get data from the test API
        try {
          console.log("AnimatedBenignAttackPlot: Trying to fetch from API...");
          const response = await axios.get(`${baseUrl}/api/test-visualizations`);
          console.log("AnimatedBenignAttackPlot: API response:", response.data);
          
          if (response.data && response.data.sample_rows && response.data.sample_rows.length > 0) {
            console.log("AnimatedBenignAttackPlot: Using data from API");
            setData(response.data.sample_rows);
            setError(null);
            return;
          } else {
            console.warn("AnimatedBenignAttackPlot: API returned empty data");
          }
        } catch (apiError) {
          console.warn("AnimatedBenignAttackPlot: Couldn't load data from API", apiError);
        }
        
        // If API fails, generate synthetic data
        console.log("AnimatedBenignAttackPlot: Generating synthetic data");
        const syntheticData = generateSyntheticData();
        setData(syntheticData);
        
      } catch (error) {
        console.error('AnimatedBenignAttackPlot: Error loading data:', error);
        setError('Failed to load visualization data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [csvData]);

  // Helper function to determine label from CSV data
  const determineLabel = (row) => {
    // Check various possible fields that might indicate attack vs. benign
    if (row.Label === 1) return 'BENIGN';
    if (row.Label === 0) return 'ATTACK';
    if (row.label === 1) return 'BENIGN';
    if (row.label === 0) return 'ATTACK';
    if (row.is_attack === 1 || row.is_attack === true) return 'ATTACK';
    if (row.anomaly_score > 0.7) return 'ATTACK';
    return 'BENIGN';
  };

  // Animation effect - only use if we're not controlled externally
  useEffect(() => {
    if (externalFrameIndex !== undefined || externalIsAnimating !== undefined) {
      // Skip internal animation if we're controlled externally
      return;
    }
    
    if (!data || data.length === 0 || !isAnimating) {
      return;
    }

    console.log("AnimatedBenignAttackPlot: Starting animation with", data.length, "data points");
    
    // Reset animation state
    setFrameIndex(Math.min(10, data.length));
    
    // Clear any existing animation
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }
    
    // Start animation
    const intervalDelay = 500; // Half a second between updates
    const stepSize = Math.max(1, Math.floor(data.length / 300)); // Smaller steps for smoother animation
    
    animationRef.current = setInterval(() => {
      setFrameIndex(prev => {
        const next = prev + stepSize;
        // When we reach the end, stop animation
        if (next >= data.length) {
          clearInterval(animationRef.current);
          setIsAnimating(false);
          return data.length;
        }
        return next;
      });
    }, intervalDelay);

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [data, isAnimating, externalFrameIndex, externalIsAnimating]);

  // Sound effect for attack points
  useEffect(() => {
    if (!data || data.length === 0) return;

    const visibleData = data.slice(0, frameIndex);
    const attackPoints = visibleData.filter(d => 
      d.Label === 'ATTACK' && 
      d.Seconds !== undefined && 
      !beepedIndicesRef.current.has(d.Seconds)
    );
    
    if (attackPoints.length > 0) {
      console.log("AnimatedBenignAttackPlot: Playing sound for", attackPoints.length, "attack points");
      beepSound.play();
      
      // Remember which attacks we've beeped for
      attackPoints.forEach(point => {
        beepedIndicesRef.current.add(point.Seconds);
      });
    }
  }, [frameIndex, data]);

  // Generate synthetic data if API fails
  const generateSyntheticData = () => {
    const result = [];
    // Generate benign points
    for (let i = 0; i < 80; i++) {
      result.push({
        Seconds: i,
        'Flow Packets/s': Math.random() * 100 + 50,
        Label: 1, // BENIGN
        emergency_alert: 0
      });
    }
    
    // Add attack points
    for (let i = 80; i < 100; i++) {
      result.push({
        Seconds: i,
        'Flow Packets/s': Math.random() * 200 + 150,
        Label: 0, // ATTACK
        emergency_alert: i > 85 ? 1 : 0
      });
    }
    
    console.log("AnimatedBenignAttackPlot: Generated", result.length, "synthetic data points");
    return result;
  };

  // Toggle animation - only use if we're not controlled externally
  const toggleAnimation = () => {
    if (externalIsAnimating !== undefined) return;
    
    if (isAnimating) {
      // Stop animation
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
      setIsAnimating(false);
    } else {
      // Restart animation from current point
      setIsAnimating(true);
    }
  };

  // Reset animation - only use if we're not controlled externally
  const resetAnimation = () => {
    if (externalFrameIndex !== undefined) return;
    
    setFrameIndex(10);
    beepedIndicesRef.current = new Set();
    setIsAnimating(true);
  };

  // Show full data - only use if we're not controlled externally
  const showFullData = () => {
    if (externalFrameIndex !== undefined) return;
    
    setFrameIndex(data.length);
    setIsAnimating(false);
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="h-96 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mb-4"></div>
            <p>Loading data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="h-96 flex items-center justify-center">
          <div className="text-center text-red-500 p-8 border-2 border-dashed border-red-300 rounded">
            <p className="mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if we have valid data for chart
  if (!data || data.length === 0) {
    console.error("AnimatedBenignAttackPlot: No data available for chart");
    return (
      <div className="p-4">
        <div className="h-96 flex items-center justify-center">
          <div className="text-center text-amber-500 p-8 border-2 border-dashed border-amber-300 rounded">
            <p className="mb-4">No data available for visualization</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Ensure data has the required fields
  const validData = data.filter(d => {
    return d && 
           typeof d.Seconds !== 'undefined' && 
           typeof d['Flow Packets/s'] !== 'undefined' && 
           typeof d.Label !== 'undefined';
  });

  if (validData.length === 0) {
    console.error("AnimatedBenignAttackPlot: Data is missing required fields");
    console.log("Sample data:", data.slice(0, 3));
    return (
      <div className="p-4">
        <div className="h-96 flex items-center justify-center">
          <div className="text-center text-amber-500 p-8 border-2 border-dashed border-amber-300 rounded">
            <p className="mb-4">Data format issue - missing required fields</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Prepare data for chart
  const slicedData = validData.slice(0, frameIndex);
  console.log(`AnimatedBenignAttackPlot: Preparing chart with ${slicedData.length} points`);
  
  // Separate benign and attack data
  const benignData = slicedData.filter(d => d.Label === 'BENIGN');
  const attackData = slicedData.filter(d => d.Label !== 'BENIGN');
  const emergencyAlerts = slicedData.filter(d => d.emergency_alert === 1);

  console.log(`AnimatedBenignAttackPlot: Benign: ${benignData.length}, Attack: ${attackData.length}, Alerts: ${emergencyAlerts.length}`);

  // Format chartData similar to FlowChartWithWarnings
  const chartData = {
    labels: slicedData.map(d => d.Seconds),
    datasets: [
      {
        label: 'Traffic Flow',
        data: slicedData.map(d => ({
          x: d.Seconds,
          y: d['Flow Packets/s']
        })),
        borderColor: 'gray',
        backgroundColor: 'transparent',
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
        showLine: true,
        tension: 0,
      },
      {
        label: 'Benign Traffic',
        data: benignData.map(d => ({
          x: d.Seconds,
          y: d['Flow Packets/s']
        })),
        borderColor: 'rgba(44, 160, 44, 0.8)', // Green
        backgroundColor: 'rgba(44, 160, 44, 0.5)',
        borderWidth: 1,
        pointRadius: 3,
        pointStyle: 'circle',
        showLine: false,
        fill: false,
      },
      {
        label: 'Attack Traffic',
        data: attackData.map(d => ({
          x: d.Seconds,
          y: d['Flow Packets/s']
        })),
        borderColor: 'rgba(214, 39, 40, 0.8)', // Red
        backgroundColor: 'rgba(214, 39, 40, 0.5)',
        borderWidth: 1,
        pointRadius: 4,
        pointStyle: 'circle',
        showLine: false,
        fill: false,
      }
    ],
  };

  // Add emergency alerts if present
  if (emergencyAlerts.length > 0) {
    chartData.datasets.push({
      label: 'Emergency Alerts',
      data: emergencyAlerts.map(d => ({
        x: d.Seconds,
        y: d['Flow Packets/s']
      })),
      backgroundColor: 'rgba(255, 165, 0, 0.8)', // Orange
      borderColor: 'rgba(255, 165, 0, 1)',
      pointRadius: 6,
      pointStyle: 'star',
      showLine: false,
      borderWidth: 1
    });
  }

  // Apply styles similar to FlowChartWithWarnings
  const options = {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: { 
          display: true, 
          text: 'Seconds',
          font: {
            size: 14,
            weight: 'normal'
          }
        },
        grid: {
          display: true,
          color: '#e0e0e0'
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 10
        }
      },
      y: {
        type: 'linear',
        position: 'left',
        title: { 
          display: true, 
          text: 'Flow Packets/s',
          font: {
            size: 14,
            weight: 'normal'
          }
        },
        grid: {
          display: true,
          color: '#e0e0e0'
        },
        suggestedMin: 0,
        suggestedMax: (Math.max(...slicedData.map(d => d['Flow Packets/s'] || 0)) * 1.1)
      },
    },
    plugins: {
      legend: { 
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15
        }
      },
      tooltip: {
        enabled: true,
        mode: 'nearest',
        intersect: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toLocaleString();
            }
            return label;
          }
        }
      },
      title: {
        display: true,
        text: 'Benign vs Attack Plot',
        font: {
          size: 16
        }
      }
    },
  };

  // Get min and max visible time
  const minTime = Math.min(...slicedData.map(d => d.Seconds || 0));
  const maxTime = Math.max(...slicedData.map(d => d.Seconds || 0));

  return (
    <div className="p-4">
      <div className="h-96 relative">
        <Line data={chartData} options={options} ref={chartRef} />
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <div className="flex justify-between">
          <div>
            {attackData.length > 0 && (
              <p>Detected {attackData.length} attacks, {emergencyAlerts.length} emergency alerts</p>
            )}
          </div>
          <div>
            <span>Time window: {minTime}s - {maxTime}s</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedBenignAttackPlot; 