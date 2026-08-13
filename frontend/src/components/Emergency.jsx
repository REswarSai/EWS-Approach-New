import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  CategoryScale
} from 'chart.js';
import { Howl } from 'howler';

ChartJS.register(LineElement, PointElement, LinearScale, Title, Tooltip, Legend, CategoryScale);

// Load your beep sound
const beepSound = new Howl({
  src: ['https://actions.google.com/sounds/v1/alarms/beep_short.ogg'],
});

const Emergency = ({ data, datasetName }) => {
  const [frameIndex, setFrameIndex] = useState(10);
  const [isAnimating, setIsAnimating] = useState(true);
  const [warnedIndices, setWarnedIndices] = useState(new Set());
  const animationRef = useRef(null);
  const chartRef = useRef();

  if (!data || data.length === 0) {
    return <div className="text-center text-gray-600">No data available for visualization</div>;
  }

  // Animation effect
  useEffect(() => {
    if (!data || data.length === 0 || !isAnimating) {
      return;
    }

    // Reset frameIndex if data changes and animation is active
    setFrameIndex(Math.min(10, data.length));

    // If there's an existing interval, clear it first
    if (animationRef.current) {
      clearInterval(animationRef.current);
    }
    
    // Slower animation with smaller step size
    const intervalDelay = 500; // Half a second between updates
    const stepSize = Math.max(1, Math.floor(data.length / 300)); // Smaller steps
    
    animationRef.current = setInterval(() => {
      setFrameIndex(prev => {
        // When we reach the end, stop animation
        if (prev >= data.length) {
          clearInterval(animationRef.current);
          setIsAnimating(false);
          return data.length;
        }
        return prev + stepSize;
      });
    }, intervalDelay);

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [data, isAnimating]);

  // Process data based on current frame
  const slicedData = data.slice(0, frameIndex);
  
  // Find high alerts (alert_level = 3)
  const highAlerts = slicedData.filter(row => row.alert_level === 3);
  
  // Get first three high alerts and remaining emergency alerts
  const top3HighAlerts = highAlerts.slice(0, 3);
  const emergencyAlerts = highAlerts.slice(3);

  // Find peak attack point
  const peakPoint = slicedData.reduce((max, row) => 
    row["Flow Packets/s"] > (max?.["Flow Packets/s"] || -Infinity) ? row : max
  , null);

  // Warning sound effect for emergency alerts
  useEffect(() => {
    if (!emergencyAlerts || emergencyAlerts.length === 0) return;

    const newWarnings = emergencyAlerts
      .filter(row => !warnedIndices.has(row.Seconds));

    if (newWarnings.length > 0) {
      beepSound.play();
      setWarnedIndices(prev => 
        new Set([...prev, ...newWarnings.map(row => row.Seconds)])
      );
    }
  }, [frameIndex, emergencyAlerts, warnedIndices]);

  // Chart data
  const chartData = {
    labels: slicedData.map(row => row.Seconds),
    datasets: [
      // Base flow line
      {
        label: "Flow Packets/s",
        data: slicedData.map(row => ({
          x: row.Seconds,
          y: row["Flow Packets/s"]
        })),
        borderColor: "rgba(31, 119, 180, 0.9)",
        backgroundColor: "transparent",
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
        tension: 0,
        order: 1
      },
      // First 3 High Alerts (EWS 3)
      {
        label: "High Alert (EWS 3)",
        data: top3HighAlerts.map(row => ({
          x: row.Seconds,
          y: row["Flow Packets/s"]
        })),
        backgroundColor: "rgba(44, 160, 44, 0.9)", // Green
        borderColor: "rgba(44, 160, 44, 1)",
        pointRadius: 8,
        pointStyle: "circle",
        showLine: false,
        type: "scatter",
        order: 2
      },
      // Emergency Alerts
      {
        label: "Emergency Alerts",
        data: emergencyAlerts.map(row => ({
          x: row.Seconds,
          y: row["Flow Packets/s"]
        })),
        backgroundColor: "rgba(214, 39, 40, 0.9)", // Red
        borderColor: "rgba(214, 39, 40, 1)",
        pointRadius: 8,
        pointStyle: "cross",
        showLine: false,
        type: "scatter",
        order: 3
      },
      // Peak Attack Point
      ...(peakPoint ? [{
        label: "Peak Attack",
        data: [{
          x: peakPoint.Seconds,
          y: peakPoint["Flow Packets/s"]
        }],
        backgroundColor: "rgba(148, 103, 189, 0.9)", // Purple
        borderColor: "rgba(148, 103, 189, 1)",
        pointRadius: 12,
        pointStyle: "star",
        showLine: false,
        type: "scatter",
        order: 4
      }] : [])
    ]
  };

  const options = {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: `${datasetName} - Attack Signal with Alerts and Peak`,
        font: { 
          size: 16,
          weight: 'bold',
          family: 'Inter, Montserrat, ui-sans-serif, system-ui'
        },
        padding: 20
      },
      legend: {
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            family: 'Inter, Montserrat, ui-sans-serif, system-ui'
          }
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
            if (context.raw && context.raw.timeToAttack !== undefined) {
              label += ` (Time to Peak: ${context.raw.timeToAttack.toFixed(2)}s)`;
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
            size: 12,
            weight: "normal",
            family: 'Inter, Montserrat, ui-sans-serif, system-ui'
          }
        },
        grid: {
          display: true,
          color: "rgba(35,38,47,0.08)",
          lineWidth: 0.5
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 10,
          font: {
            size: 11,
            family: 'Inter, Montserrat, ui-sans-serif, system-ui'
          }
        }
      },
      y: {
        title: {
          display: true,
          text: "Flow Packets/s",
          font: { 
            size: 12,
            weight: "normal",
            family: 'Inter, Montserrat, ui-sans-serif, system-ui'
          }
        },
        grid: {
          display: true,
          color: "rgba(35,38,47,0.08)",
          lineWidth: 0.5
        },
        ticks: {
          font: {
            size: 11,
            family: 'Inter, Montserrat, ui-sans-serif, system-ui'
          }
        },
        suggestedMin: 0,
        suggestedMax: Math.max(...slicedData.map(row => row["Flow Packets/s"])) * 1.1
      }
    }
  };

  // Get min and max visible time
  const minTime = Math.min(...slicedData.map(row => row.Seconds));
  const maxTime = Math.max(...slicedData.map(row => row.Seconds));

  // Calculate time to peak for high alerts
  const timeToAttackInfo = top3HighAlerts.map((alert, idx) => {
    const timeToAttack = peakPoint ? (peakPoint.Seconds - alert.Seconds) : null;
    return {
      alertNum: idx + 1,
      seconds: alert.Seconds,
      timeToAttack: timeToAttack
    };
  });

  return (
    <div className="p-4">
      <div className="h-96 relative">
        <Line data={chartData} options={options} ref={chartRef} />
      </div>
      
      <div className="mt-4 space-y-2 text-sm text-gray-600">
        <div className="flex justify-between">
          <div className="space-y-1">
            {top3HighAlerts.length > 0 && (
              <p>First 3 High Alerts: {top3HighAlerts.length}</p>
            )}
            {emergencyAlerts.length > 0 && (
              <p>Emergency Alerts: {emergencyAlerts.length}</p>
            )}
            {peakPoint && (
              <p>Peak Attack at {peakPoint.Seconds.toFixed(2)}s: {peakPoint["Flow Packets/s"].toExponential(2)}</p>
            )}
          </div>
          <div>
            <span>Time window: {minTime.toFixed(2)}s - {maxTime.toFixed(2)}s</span>
          </div>
        </div>

        {timeToAttackInfo.length > 0 && peakPoint && (
          <div className="mt-2">
            <p className="font-semibold mb-1">Time to Peak Analysis:</p>
            <div className="grid grid-cols-3 gap-4">
              {timeToAttackInfo.map(info => (
                <div key={info.alertNum} className="text-xs">
                  Alert {info.alertNum}: {info.timeToAttack.toFixed(2)}s to peak
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Emergency;
