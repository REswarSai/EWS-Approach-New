import React, { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import "chartjs-plugin-annotation";

const HighLevelGraph = ({ data = [], flowData = [], level = 3, title = "", frameIndex: externalFrameIndex, isAnimating: externalIsAnimating }) => {
  const chartRef = useRef(null);
  const [alertData, setAlertData] = useState(data);
  const [trafficData, setTrafficData] = useState(flowData);
  const [frameIndex, setFrameIndex] = useState(10);
  const [isAnimating, setIsAnimating] = useState(true);
  const animationRef = useRef(null);

  // Update data when props change
  useEffect(() => {
    setAlertData(data);
    setTrafficData(flowData);
    setFrameIndex(10); // Reset animation when data changes
  }, [data, flowData]);

  // Use external frame index and animation state if provided
  useEffect(() => {
    if (externalFrameIndex !== undefined) {
      setFrameIndex(externalFrameIndex);
    }
    
    if (externalIsAnimating !== undefined) {
      setIsAnimating(externalIsAnimating);
    }
  }, [externalFrameIndex, externalIsAnimating]);

  // Animation effect - only if we're not controlled externally
  useEffect(() => {
    if (externalFrameIndex !== undefined || externalIsAnimating !== undefined) {
      // Skip internal animation if we're controlled externally
      return;
    }

    if (!trafficData || trafficData.length === 0) {
      console.log('No data available for animation');
      return;
    }

    // Reset frameIndex if data changes and animation is active
    if (isAnimating) {
      setFrameIndex(Math.min(10, trafficData.length));

      // If there's an existing interval, clear it first
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
      
      // Slower animation with smaller step size
      const intervalDelay = 500; // Half a second between updates
      const stepSize = Math.max(1, Math.floor(trafficData.length / 300)); // Smaller steps
      
      animationRef.current = setInterval(() => {
        setFrameIndex(prev => {
          // When we reach the end, stop animation
          if (prev >= trafficData.length) {
            clearInterval(animationRef.current);
            setIsAnimating(false);
            return trafficData.length;
          }
          return prev + stepSize;
        });
      }, intervalDelay);
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [trafficData, isAnimating, externalFrameIndex, externalIsAnimating]);

  useEffect(() => {
    if (!chartRef.current || !trafficData || trafficData.length === 0) return;

    const canvas = chartRef.current.getContext("2d");

    // Destroy previous chart if it exists
    if (canvas.chart) {
      canvas.chart.destroy();
    }

    // Get the visible window of data
    const windowSize = 100; // Show 100 points at a time
    const startIdx = Math.max(0, frameIndex - windowSize);
    const endIdx = frameIndex;
    
    // Get the visible data
    const visibleTrafficData = trafficData.slice(0, endIdx + 1);
    const visibleAlertData = alertData.filter(d => {
      const seconds = d.Seconds || 0;
      return seconds <= trafficData[endIdx]?.Seconds;
    });

    // Apply smoothing to the flow data
    const smoothingFactor = 0.1;
    const smoothedData = [];
    visibleTrafficData.forEach((d, i) => {
      const currentValue = d["Flow Packets/s"] || 0;
      if (i === 0) {
        smoothedData.push(currentValue);
      } else {
        smoothedData.push(smoothedData[i-1] * (1-smoothingFactor) + currentValue * smoothingFactor);
      }
    });

    // Filter alerts for the specific level
    const levelAlerts = visibleAlertData.filter(item => item.alert_level === level);

    // Create datasets
    const datasets = [
      {
        label: "Traffic Flow (Smoothed)",
        data: visibleTrafficData.map((d, i) => ({ 
          x: d.Seconds || 0, 
          y: smoothedData[i]
        })),
        borderColor: "rgb(128, 128, 128)",
        backgroundColor: "transparent",
        tension: 0.3,
        borderWidth: 1,
        pointRadius: 0,
        fill: false
      },
      {
        label: "Classes",
        data: visibleTrafficData.map((d) => ({
          x: d.Seconds || 0,
          y: d["Flow Packets/s"] || 0,
          label: d.alert_level || 0,
        })),
        backgroundColor: 'rgba(0, 191, 255, 0.7)',
        borderColor: 'rgba(0, 191, 255, 0.9)',
        pointRadius: 1.5,
        borderWidth: 1,
        showLine: false,
        type: "scatter"
      },
      {
        label: `${level === 1 ? 'Low' : level === 2 ? 'Medium' : 'High'} Level Alert`,
        data: levelAlerts.map((d) => ({
          x: d.Seconds || 0,
          y: d["Flow Packets/s"] || 0,
        })),
        backgroundColor: level === 1 ? 'yellow' : level === 2 ? 'orange' : 'red',
        borderColor: level === 1 ? 'yellow' : level === 2 ? 'orange' : 'red',
        pointRadius: 4,
        borderWidth: 1,
        showLine: false,
        type: "scatter"
      }
    ];

    // Find min and max values for better scaling
    const allYValues = visibleTrafficData.map(d => d["Flow Packets/s"] || 0);
    const maxY = Math.max(...allYValues) * 1.1; // Add 10% padding
    const minY = Math.min(...allYValues) * 0.9; // Subtract 10% padding

    // Create chart
    canvas.chart = new Chart(canvas, {
      type: "line",
      data: { datasets },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          title: {
            display: true,
            text: title || `Flow Packets/s vs Seconds with Early Warnings (Test)`,
            font: { size: 16, family: 'Inter, Montserrat, ui-sans-serif, system-ui' }
          },
          legend: {
            display: true,
            position: "top",
            labels: {
              usePointStyle: true,
              padding: 15,
              color: 'rgba(35,38,47,0.9)'
            }
          },
          tooltip: {
            enabled: true,
            mode: "nearest",
            intersect: true,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += context.parsed.y.toExponential(2);
                }
                if (context.raw && context.raw.label !== undefined) {
                  label += ` (Class: ${context.raw.label})`;
                }
                return label;
              }
            }
          }
        },
        scales: {
          x: {
            type: "linear",
            position: "bottom",
            title: {
              display: true,
              text: "Seconds",
              font: {
                size: 14,
                weight: "normal",
                family: 'Inter, Montserrat, ui-sans-serif, system-ui'
              }
            },
            grid: {
              display: true,
              color: 'rgba(35,38,47,0.08)'
            },
            ticks: {
              autoSkip: true,
              maxTicksLimit: 10
            }
          },
          y: {
            type: "linear",
            position: "left",
            title: {
              display: true,
              text: "Flow Packets/s",
              font: {
                size: 14,
                weight: "normal",
                family: 'Inter, Montserrat, ui-sans-serif, system-ui'
              }
            },
            grid: {
              display: true,
              color: 'rgba(35,38,47,0.08)'
            },
            suggestedMin: 0,
            suggestedMax: maxY
          }
        }
      }
    });

    // Cleanup function
    return () => {
      if (canvas.chart) {
        canvas.chart.destroy();
      }
    };
  }, [alertData, trafficData, level, title, frameIndex]);

  if (!trafficData || trafficData.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-gray-600">
          <div className="mb-2">No data available</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="h-96 relative">
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
};

export default HighLevelGraph; 