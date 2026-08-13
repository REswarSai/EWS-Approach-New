import React, { useEffect, useRef, useState } from 'react';
import { Line, Scatter } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';
import { Howl } from 'howler';
import {
  Chart as ChartJS_ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS_ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend
);

// Load your beep sound
const beepSound = new Howl({
  src: ['https://actions.google.com/sounds/v1/alarms/beep_short.ogg'],
});

const FlowChartWithWarnings = ({ data, warningIndices, frameIndex: externalFrameIndex, isAnimating: externalIsAnimating }) => {
  const [frameIndex, setFrameIndex] = useState(10);
  const [warnedIndices, setWarnedIndices] = useState(new Set());
  const chartRef = useRef();
  const animationRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [showFullData, setShowFullData] = useState(false);

  // Log data on mount to help debug
  useEffect(() => {
    if (data?.length) {
      console.log('Chart Data Received:', {
        dataLength: data.length,
        samplePoint: data[0],
        firstSecond: data[0]?.Seconds,
        lastSecond: data[data.length-1]?.Seconds,
        warningIndices
      });
    }
  }, [data, warningIndices]);

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

    if (!data || data.length === 0) {
      console.log('No data available for animation');
      return;
    }

    // Reset frameIndex if data changes and animation is active
    if (isAnimating) {
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
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [data, isAnimating, externalFrameIndex, externalIsAnimating]);

  // Warning sound effect
  useEffect(() => {
    if (!warningIndices || !warningIndices.length) return;

    const currentWarnings = warningIndices.filter((i) => i < frameIndex);
    const newWarnings = currentWarnings.filter((i) => !warnedIndices.has(i));

    if (newWarnings.length > 0) {
      beepSound.play();
      setWarnedIndices((prev) => new Set([...prev, ...newWarnings]));
    }
  }, [frameIndex, warningIndices, warnedIndices]);

  if (!data || data.length === 0) {
    return <div className="text-center text-gray-600">No data available for visualization</div>;
  }

  const slicedData = showFullData ? data : data.slice(0, frameIndex);

  // Normalize seconds to start from 1 if needed
  const hasTimeValues = data.every(d => d.Seconds !== undefined);
  let normalizedData = slicedData;
  
  if (hasTimeValues) {
    // Sort by seconds if available
    normalizedData = [...slicedData].sort((a, b) => a.Seconds - b.Seconds);
  }

  // Get the flow packets data
  const getFlowPackets = (d) => {
    if (d && d['Flow Packets/s'] !== undefined) return d['Flow Packets/s'];
    
    if (!d) return null;
    
    // Find first numeric field as fallback
    const numericField = Object.entries(d).find(([key, value]) => 
      typeof value === 'number' && !isNaN(value) && key !== 'Seconds'
    );
    
    return numericField ? numericField[1] : null;
  };

  // Extract label/class data if available
  const getLabel = (d) => {
    return d && d.Label !== undefined ? d.Label : 0;
  };

  // Create chart data - mimicking the matplotlib style from the image
  const chartData = {
    labels: normalizedData.map(d => d.Seconds),
    datasets: [
      {
        label: 'Traffic Flow',
        data: normalizedData.map((d, i) => ({
          x: d.Seconds,
          y: getFlowPackets(d)
        })),
        borderColor: 'gray',
        backgroundColor: 'transparent',
        borderWidth: 1,
        pointRadius: 0,
        fill: false,
        showLine: true,
        tension: 0
      },
      {
        label: 'Classes',
        data: normalizedData.map((d, i) => ({
          x: d.Seconds, 
          y: getFlowPackets(d),
          label: getLabel(d)
        })),
        backgroundColor: (context) => {
          if (!context.raw || context.raw.label === undefined) return 'rgba(0, 0, 255, 0.7)';
          
          // Generate colors using a simple hashing function similar to matplotlib's tab10
          const colors = [
            'rgba(31, 119, 180, 0.7)',   // blue
            'rgba(255, 127, 14, 0.7)',   // orange
            'rgba(44, 160, 44, 0.7)',    // green
            'rgba(214, 39, 40, 0.7)',    // red
            'rgba(148, 103, 189, 0.7)',  // purple
            'rgba(140, 86, 75, 0.7)',    // brown
            'rgba(227, 119, 194, 0.7)',  // pink
            'rgba(127, 127, 127, 0.7)',  // gray
            'rgba(188, 189, 34, 0.7)',   // olive
            'rgba(23, 190, 207, 0.7)'    // teal
          ];
          
          const colorIndex = Math.abs(context.raw.label) % colors.length;
          return colors[colorIndex];
        },
        pointRadius: 2,
        borderWidth: 0,
        pointStyle: 'circle',
        showLine: false,
        type: 'scatter'
      },
      {
        label: 'Early Warning (1 per 10)', 
        data: normalizedData.map((d, i) => {
          const originalIndex = slicedData.indexOf(d);
          // Only show 1 in 10 warning points to match the matplotlib plot
          if (warningIndices?.includes(originalIndex) && warningIndices.indexOf(originalIndex) % 10 === 0) {
            return { x: d.Seconds, y: getFlowPackets(d) };
          }
          return null;
        }).filter(Boolean),
        backgroundColor: 'red',
        borderColor: 'red',
        pointRadius: 5,
        pointStyle: 'circle',
        showLine: false,
        type: 'scatter',
        borderWidth: 0
      },
    ],
  };

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
            weight: 'normal',
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
        type: 'linear',
        position: 'left',
        title: { 
          display: true, 
          text: 'Flow Packets/s',
          font: {
            size: 14,
            weight: 'normal',
            family: 'Inter, Montserrat, ui-sans-serif, system-ui'
          }
        },
        grid: {
          display: true,
          color: 'rgba(35,38,47,0.08)'
        },
        suggestedMin: 0,
        suggestedMax: (Math.max(...normalizedData.map(d => getFlowPackets(d) || 0)) * 1.1)
      },
    },
    plugins: {
      legend: { 
        display: true,
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            family: 'Inter, Montserrat, ui-sans-serif, system-ui'
          }
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
              label += context.parsed.y.toExponential(2);
            }
            if (context.raw && context.raw.label !== undefined) {
              label += ` (Class: ${context.raw.label})`;
            }
            return label;
          }
        }
      },
      title: {
        display: true,
        text: 'Flow Packets/s vs Seconds with Early Warnings (Test)',
        font: {
          size: 16,
          family: 'Inter, Montserrat, ui-sans-serif, system-ui'
        }
      }
    },
  };

  // Get min and max visible time
  const minTime = Math.min(...normalizedData.map(d => d.Seconds || 0));
  const maxTime = Math.max(...normalizedData.map(d => d.Seconds || 0));

  return (
    <div className="p-4">
      <div className="h-96 relative">
        <Line data={chartData} options={options} ref={chartRef} />
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <div className="flex justify-between">
          <div>
            {warningIndices && warningIndices.length > 0 && (
              <p>Detected {warningIndices.length} anomalies</p>
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

export default FlowChartWithWarnings; 