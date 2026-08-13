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

const AnimatedChart = ({ 
  data, 
  frameIndex: externalFrameIndex, 
  isAnimating: externalIsAnimating,
  title,
  yAxisLabel = 'Flow Packets/s',
  showEmergencyAlerts = false,
  showAttackPoints = false
}) => {
  const [frameIndex, setFrameIndex] = useState(10);
  const [isAnimating, setIsAnimating] = useState(true);
  const animationRef = useRef(null);
  const beepedIndicesRef = useRef(new Set());
  const chartRef = useRef(null);

  // Use external frame index and animation state if provided
  useEffect(() => {
    if (externalFrameIndex !== undefined) {
      setFrameIndex(externalFrameIndex);
    }
    
    if (externalIsAnimating !== undefined) {
      setIsAnimating(externalIsAnimating);
    }
  }, [externalFrameIndex, externalIsAnimating]);

  // Animation effect - only use if we're not controlled externally
  useEffect(() => {
    if (externalFrameIndex !== undefined || externalIsAnimating !== undefined) {
      // Skip internal animation if we're controlled externally
      return;
    }
    
    if (!data || data.length === 0 || !isAnimating) {
      return;
    }

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
    if (!data || data.length === 0 || !showAttackPoints) return;

    const visibleData = data.slice(0, frameIndex);
    const attackPoints = visibleData.filter(d => 
      d.Label === 'ATTACK' && 
      d.Seconds !== undefined && 
      !beepedIndicesRef.current.has(d.Seconds)
    );
    
    if (attackPoints.length > 0) {
      beepSound.play();
      
      // Remember which attacks we've beeped for
      attackPoints.forEach(point => {
        beepedIndicesRef.current.add(point.Seconds);
      });
    }
  }, [frameIndex, data, showAttackPoints]);

  if (!data || data.length === 0) {
    return <div className="text-center text-gray-600">No data available for visualization</div>;
  }

  // Prepare data for chart
  const slicedData = data.slice(0, frameIndex);
  
  // Separate benign and attack data
  const benignData = slicedData.filter(d => d.Label === 'BENIGN');
  const attackData = slicedData.filter(d => d.Label !== 'BENIGN');
  const emergencyAlerts = showEmergencyAlerts ? slicedData.filter(d => d.emergency_alert === 1) : [];

  // Format chartData
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
  if (showEmergencyAlerts && emergencyAlerts.length > 0) {
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

  // Apply styles
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
          text: yAxisLabel,
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
        text: title,
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
              <p>Detected {attackData.length} attacks{showEmergencyAlerts ? `, ${emergencyAlerts.length} emergency alerts` : ''}</p>
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

export default AnimatedChart; 