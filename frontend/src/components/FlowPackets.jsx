import React, { useState, useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const FlowPackets = ({ 
  df = [], 
  datasetName = "Dataset",
  peakTime: propPeakTime = null 
}) => {
  const [frameIndex, setFrameIndex] = useState(10);
  const [isAnimating, setIsAnimating] = useState(true);
  const animationRef = useRef(null);
  const chartRef = useRef();

  // Ensure we have valid data
  const validDf = Array.isArray(df) ? df : [];
  
  // Animation effect
  useEffect(() => {
    if (!validDf || validDf.length === 0 || !isAnimating) {
      return;
    }

    // For small datasets, show all data immediately
    if (validDf.length <= 50) {
      setFrameIndex(validDf.length);
      setIsAnimating(false);
      return;
    }

    setFrameIndex(Math.min(10, validDf.length));

    if (animationRef.current) {
      clearInterval(animationRef.current);
    }
    
    const intervalDelay = 500;
    // Adjust step size based on dataset size
    const stepSize = Math.max(1, Math.floor(validDf.length / Math.min(300, validDf.length)));
    
    animationRef.current = setInterval(() => {
      setFrameIndex(prev => {
        if (prev >= validDf.length) {
          clearInterval(animationRef.current);
          setIsAnimating(false);
          return validDf.length;
        }
        return prev + stepSize;
      });
    }, intervalDelay);

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [validDf, isAnimating]);

  // Slice data based on current frame
  const slicedDf = validDf.slice(0, frameIndex);

  // Find attack indices (where label is attack)
  const attackIndices = slicedDf
    .map((row, idx) => row.Label === 0 ? idx : null)
    .filter(idx => idx !== null);

  // Calculate attack start/stop times
  const attackStart = attackIndices.length > 0 ? slicedDf[attackIndices[0]].Seconds : null;
  const attackStop = attackIndices.length > 0 ? slicedDf[attackIndices[attackIndices.length - 1]].Seconds : null;

  // Find peak
  let peakTime = propPeakTime;
  if (!peakTime) {
    // First try to find peak in attack data
    const attackData = slicedDf.filter(row => row.Label === 0);
    if (attackData.length > 0) {
      let maxVal = -Infinity;
      attackData.forEach(row => {
        const flowValue = row['Flow Packets/s'] || 0;
        if (flowValue > maxVal) {
          maxVal = flowValue;
          peakTime = row.Seconds;
        }
      });
    } else {
      // If no attack data, find peak in all data
      let maxVal = -Infinity;
      slicedDf.forEach(row => {
        const flowValue = row['Flow Packets/s'] || 0;
        if (flowValue > maxVal) {
          maxVal = flowValue;
          peakTime = row.Seconds;
        }
      });
    }
  }

  // Process EWS data
  const processEwsData = () => {
    // Find points where alert_level is 3 (matching backend logic)
    const highAlertPoints = slicedDf
      .filter(row => row.alert_level === 3)
      .map(row => ({
        x: row.Seconds,
        y: row['Flow Packets/s'],
        timestamp: row.Seconds,
        level: row.Label === 1 ? 0 : 3 // 0 for benign, 3 for attack
      }));

    // Take first 3 points for EWS, or all available points if less than 3
    const first3Ews = highAlertPoints.slice(0, Math.min(3, highAlertPoints.length));

    // Organize points by EWS level
    return {
      ews1: first3Ews.slice(0, 1),
      ews2: first3Ews.slice(1, 2),
      ews3: first3Ews.slice(2, 3)
    };
  };

  const ewsData = processEwsData();

  // Calculate max Y value for scaling, with a minimum value to prevent errors
  const maxY = Math.max(
    ...slicedDf.map(d => d['Flow Packets/s'] || 0),
    1 // Ensure at least 1 to prevent scaling issues
  ) * 1.1;

  // Helper function to create vertical line data
  const createVerticalLine = (x, maxY) => {
    const points = [];
    const numPoints = 50;
    for (let i = 0; i <= numPoints; i++) {
      points.push({
        x: x,
        y: (i / numPoints) * maxY
      });
    }
    return points;
  };

  // Prepare datasets
  const datasets = [
    // Main flow packets line with segment coloring
    {
      label: "Flow Packets/s",
      data: slicedDf.map(row => ({
        x: row.Seconds,
        y: row['Flow Packets/s'],
        label: row.Label
      })),
      borderColor: 'rgba(31, 119, 180, 0.9)', // fallback color
      backgroundColor: 'transparent',
      borderWidth: 1.5,
      fill: false,
      tension: 0,
      pointRadius: 0,
      pointHoverRadius: 3,
      order: 1,
      segment: {
        borderColor: ctx => {
          const i = ctx.p0DataIndex;
          const label = slicedDf[i]?.Label;
          return label === 0 ? 'rgba(214, 39, 40, 0.9)' : 'rgba(44, 160, 44, 0.9)'; // red for attack, green for benign
        }
      }
    }
  ];

  // Add attack start/stop vertical lines
  if (attackStart) {
    datasets.push({
      label: `Attack Start (${parseInt(attackStart)}s)`,
      data: createVerticalLine(attackStart, maxY),
      borderColor: 'rgba(214, 39, 40, 0.9)', // red
      borderWidth: 2,
      borderDash: [4, 4],
      pointRadius: 0,
      showLine: true,
      fill: false,
      order: 4
    });
  }
  if (attackStop) {
    datasets.push({
      label: `Attack Stop (${parseInt(attackStop)}s)`,
      data: createVerticalLine(attackStop, maxY),
      borderColor: 'rgba(139, 0, 0, 0.9)', // darkred
      borderWidth: 2,
      borderDash: [4, 4],
      pointRadius: 0,
      showLine: true,
      fill: false,
      order: 4
    });
  }

  // Add EWS vertical lines
  const ewsColors = ['rgba(44, 160, 44, 0.9)', 'rgba(255, 127, 14, 0.9)', 'rgba(148, 103, 189, 0.9)'];

  Object.entries(ewsData).forEach(([key, points], idx) => {
    if (points.length > 0) {
      const point = points[0];
      const color = ewsColors[idx % ewsColors.length];

      datasets.push({
        label: `EWS ${idx + 1}`,
        data: createVerticalLine(point.x, maxY),
        borderColor: color,
        borderWidth: 2,
        borderDash: [5, 5],
        pointRadius: 0,
        showLine: true,
        fill: false
      });

      // Add cross marker at the flow value
      datasets.push({
        label: `EWS ${idx + 1} Point`,
        data: [{
          x: point.x,
          y: point.y
        }],
        borderColor: color,
        backgroundColor: color,
        pointStyle: 'crossRot',
        pointRadius: 8,
        showLine: false,
        fill: false
      });
    }
  });

  // Add peak line if provided
  if (peakTime) {
    const peakVal = slicedDf.find(row => row.Seconds === peakTime)?.['Flow Packets/s'];
    if (peakVal !== undefined) {
      datasets.push({
        label: `Peak Flow at ${parseInt(peakTime)}s`,
        data: createVerticalLine(peakTime, maxY),
        borderColor: 'rgba(0, 0, 0, 0.9)', // black
        borderWidth: 1.5,
        borderDash: [4, 4],
        pointRadius: 0,
        showLine: true,
        fill: false,
        order: 5
      });
      datasets.push({
        label: 'Peak Point',
        data: [{ x: peakTime, y: peakVal }],
        borderColor: 'rgba(0, 0, 0, 0.9)', // black
        backgroundColor: 'rgba(0, 0, 0, 0.9)', // black
        pointStyle: 'star',
        pointRadius: 10,
        showLine: false,
        fill: false,
        order: 6
      });
    }
  }

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 0 },
    plugins: {
      legend: {
        position: "top",
        align: "center",
        labels: {
          boxWidth: 30,
          padding: 15,
          font: { size: 11 },
          usePointStyle: true,
          filter: (item) => !item.text.includes('Point')
        }
      },
      title: {
        display: true,
        text: `${datasetName} - Flow Packets/s with Attack & EWS`,
        font: {
          size: 14,
          weight: 'bold',
          family: "'Arial', sans-serif"
        },
        padding: { top: 10, bottom: 20 }
      },
      tooltip: {
        enabled: true,
        mode: "nearest",
        intersect: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) label += ': ';
            if (context.parsed.y !== null) label += context.parsed.y.toExponential(2);
            return label;
          }
        }
      }
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: {
          display: true,
          text: "Seconds",
          font: { size: 12 }
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
          lineWidth: 0.5
        },
        ticks: {
          maxTicksLimit: 10,
          maxRotation: 0,
          font: { size: 11 }
        }
      },
      y: {
        type: 'linear',
        position: 'left',
        title: {
          display: true,
          text: "Flow Packets/s",
          font: { size: 12 }
        },
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.1)',
          lineWidth: 0.5
        },
        ticks: {
          font: { size: 11 }
        },
        suggestedMin: 0,
        suggestedMax: maxY
      }
    }
  };

  return (
    <div style={{ 
      width: '100%', 
      height: '400px',
      position: 'relative',
      maxHeight: '400px',
      overflow: 'hidden'
    }}>
      <Line data={{ datasets }} options={options} ref={chartRef} />
    </div>
  );
};

export default FlowPackets; 