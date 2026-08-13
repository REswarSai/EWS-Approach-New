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
import { Howl } from 'howler';

ChartJS.register(
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
  Legend
);

// Load beep sound for alerts
const beepSound = new Howl({
  src: ['https://actions.google.com/sounds/v1/alarms/beep_short.ogg'],
});

// EWS colors matching the reference plot style
const ewsColors = {
  ews1: 'rgba(44, 160, 44, 0.9)',     // green for EWS1
  ews2: 'rgba(255, 127, 14, 0.9)',    // orange for EWS2
  ews3: 'rgba(148, 103, 189, 0.9)'    // purple for EWS3
};

// Helper function to generate dummy data if needed
const generateFallbackData = (size = 100) => {
  const result = [];
  for (let i = 0; i < size; i++) {
    result.push({
      Seconds: i,
      'Flow Packets/s_skewness': Math.sin(i / 10) + Math.random() * 0.5,
      Label: 0, // 0 for BENIGN
      alert_level: 0
    });
  }
  return result;
};

const SkewnessPlot = ({ 
  skewnessDf = [], 
  df = [], // Add df prop with default empty array
  datasetName = "Dataset", 
  attack_start_time = null, 
  attack_stop_time = null, 
  peakTime: propPeakTime = null 
}) => {
  const [frameIndex, setFrameIndex] = useState(10);
  const [isAnimating, setIsAnimating] = useState(true);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const animationRef = useRef(null);
  const chartRef = useRef();

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

  console.log("skewnessDf", skewnessDf)
  const validSkewnessDf = Array.isArray(skewnessDf) && skewnessDf.length > 0 
    ? skewnessDf 
    : generateFallbackData(100);

  // Ensure we have valid df data
  const validDf = Array.isArray(df) && df.length > 0 
    ? df 
    : generateFallbackData(100);

  // Animation effect
  useEffect(() => {
    if (!validSkewnessDf || validSkewnessDf.length === 0 || !isAnimating) return;
    setFrameIndex(Math.min(10, validSkewnessDf.length));
    if (animationRef.current) clearInterval(animationRef.current);
    const intervalDelay = 500;
    const stepSize = Math.max(1, Math.floor(validSkewnessDf.length / 300));
    animationRef.current = setInterval(() => {
      setFrameIndex(prev => {
        if (prev >= validSkewnessDf.length) {
          clearInterval(animationRef.current);
          setIsAnimating(false);
          return validSkewnessDf.length;
        }
        return prev + stepSize;
      });
    }, intervalDelay);
    return () => { if (animationRef.current) clearInterval(animationRef.current); };
  }, [validSkewnessDf, isAnimating]);

  // Slice data based on current frame
  const slicedSkewnessDf = validSkewnessDf.slice(0, frameIndex);
  const slicedDf = validDf.slice(0, frameIndex);
  
  // Find majority label (benign)
  const labelCounts = {};
  slicedDf.forEach(row => {
    labelCounts[row.Label] = (labelCounts[row.Label] || 0) + 1;
  });
  const benignLabel = 1; // Benign is label 1
  const attackLabel = 0; // Attack is label 0

  // Find attack indices (where label is attack)
  const attackIndices = slicedDf
    .map((row, idx) => row.Label === attackLabel ? idx : null)
    .filter(idx => idx !== null);

  // Calculate attack start/stop times
  let attackStart = attack_start_time;
  let attackStop = attack_stop_time;
  if (!attackStart && attackIndices.length > 0) attackStart = slicedDf[attackIndices[0]].Seconds;
  if (!attackStop && attackIndices.length > 0) attackStop = slicedDf[attackIndices[attackIndices.length - 1]].Seconds;

  // Find peak
  let peakTime = propPeakTime;
  if (!peakTime) {
    // First try to find peak in attack data
    const attackData = slicedDf.filter(row => row.Label === attackLabel);
    if (attackData.length > 0) {
      let maxVal = -Infinity;
      attackData.forEach(row => {
        const skewnessValue = slicedSkewnessDf.find(k => k.Seconds === row.Seconds)?.['Flow Packets/s_skewness'] || 0;
        if (skewnessValue > maxVal) {
          maxVal = skewnessValue;
          peakTime = row.Seconds;
        }
      });
    } else {
      // If no attack data, find peak in all data
      let maxVal = -Infinity;
      slicedDf.forEach(row => {
        const skewnessValue = slicedSkewnessDf.find(k => k.Seconds === row.Seconds)?.['Flow Packets/s_skewness'] || 0;
        if (skewnessValue > maxVal) {
          maxVal = skewnessValue;
          peakTime = row.Seconds;
        }
      });
    }
  }

  // Process EWS data based on backend logic
  const processEwsData = () => {
    // Find points where alert_level is 3 (matching backend logic)
    const highAlertPoints = slicedDf
      .filter(row => row.alert_level === 3)
      .map(row => {
        const skewnessValue = slicedSkewnessDf.find(k => k.Seconds === row.Seconds)?.[
          'Flow Packets/s_skewness'
        ] || 0;

        return {
          x: row.Seconds,
          y: skewnessValue,
          timestamp: row.Seconds,
          level: row.Label === benignLabel ? 0 : 3 // 0 for benign, 3 for attack
        };
      });

    // Take first 3 points for EWS
    const first3Ews = highAlertPoints.slice(0, 3);

    // Organize points by EWS level
    const ewsData = {
      ews1: first3Ews.slice(0, 1),
      ews2: first3Ews.slice(1, 2),
      ews3: first3Ews.slice(2, 3)
    };

    return ewsData;
  };

  const ewsData = processEwsData();

  // Calculate max Y value for scaling
  const maxY = Math.max(
    ...slicedSkewnessDf.map(d => d['Flow Packets/s_skewness'] || 0)
  ) * 1.1;

  // Prepare datasets
  const datasets = [
    // Main skewness line with segment coloring
    {
      label: "Skewness of Flow Packets/s",
      data: slicedSkewnessDf.map(row => ({
        x: row.Seconds,
        y: row["Flow Packets/s_skewness"],
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
          const label = slicedSkewnessDf[i]?.Label;
          return label === attackLabel ? 'rgba(214, 39, 40, 0.9)' : 'rgba(44, 160, 44, 0.9)'; // red for attack, green for benign
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
  const textOffsets = [0.50, 0.87, 0.82];

  Object.entries(ewsData).forEach(([key, points], idx) => {
    if (points.length > 0) {
      const point = points[0];
      const color = ewsColors[idx % ewsColors.length];
      const offset = textOffsets[idx % textOffsets.length];

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

      // Add cross marker at the skewness value
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
    const peakVal = slicedSkewnessDf.find(row => row.Seconds === peakTime)?.['Flow Packets/s_skewness'];
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
        text: `${datasetName} - Skewness of Flow Packets/s with Attack & EWS`,
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
          text: "Skewness",
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

  // Get min and max visible time
  const minTime = Math.min(...slicedDf.map(d => d.Seconds || 0));
  const maxTime = Math.max(...slicedDf.map(d => d.Seconds || 0));

  // Calculate time before attack peak for each alert (like KurtosisPlot)
  const alertStats = [
    {
      alert: "Benign",
      second: ewsData.ews1[0]?.timestamp || 0,
      timeBeforePeak: typeof peakTime === 'number' ? peakTime - (ewsData.ews1[0]?.timestamp || 0) : 0
    },
    {
      alert: "EWS 1",
      second: ewsData.ews1[0]?.timestamp || 0,
      timeBeforePeak: typeof peakTime === 'number' ? peakTime - (ewsData.ews1[0]?.timestamp || 0) : 0
    },
    {
      alert: "EWS 2",
      second: ewsData.ews2[0]?.timestamp || 0,
      timeBeforePeak: typeof peakTime === 'number' ? peakTime - (ewsData.ews2[0]?.timestamp || 0) : 0
    },
    {
      alert: "EWS 3",
      second: ewsData.ews3[0]?.timestamp || 0,
      timeBeforePeak: typeof peakTime === 'number' ? peakTime - (ewsData.ews3[0]?.timestamp || 0) : 0
    }
  ];

  return (
    <div style={{ 
      width: '100%', 
      height: '400px',
      position: 'relative',
      maxHeight: '400px',
      overflow: 'hidden'
    }}>
      <div style={{ position: 'absolute', top: '10px', right: '10px' }}>
        <button
          onClick={() => setShowStatsModal(true)}
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        >
          View Statistics
        </button>
      </div>
      <Line data={{ datasets }} options={options} ref={chartRef} />
      {showStatsModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-surface p-6 rounded-lg shadow-xl max-w-2xl w-full">
            <h2 className="text-xl font-bold mb-4 text-text">Alert Statistics</h2>
            {typeof peakTime !== 'undefined' && Array.isArray(alertStats) && alertStats.length > 0 ? (
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-border text-text">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">Alert</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">Second</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">Time Before Attack Peak (s)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text uppercase tracking-wider">Peak Attack Time (s)</th>
                  </tr>
                </thead>
                <tbody className="bg-surface divide-y divide-border text-text">
                  {alertStats.map((row, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text">{row.alert}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text">{row.second}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text">{typeof row.timeBeforePeak === 'number' ? row.timeBeforePeak.toFixed(2) : ''}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-text">{typeof peakTime === 'number' ? peakTime.toFixed(2) : ''}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-text">No statistics available.</div>
            )}
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowStatsModal(false)}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="mt-4 text-sm text-gray-600">
        <div className="flex justify-between">
          <div>
            <span className="font-medium">EWS Alerts: </span>
            {ewsData.ews1.map((row, idx) => (
              <span key={idx} className={idx === 0 ? "text-green-600 mr-2" : idx === 1 ? "text-orange-600 mr-2" : "text-purple-600 mr-2"}>
                Level {idx + 1} ({row.x}s)
              </span>
            ))}
          </div>
          <div>
            <span>Time window: {minTime.toFixed(1)}s - {maxTime.toFixed(1)}s</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SkewnessPlot; 