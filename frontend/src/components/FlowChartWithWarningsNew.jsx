import React, { useEffect, useState, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS } from 'chart.js/auto';
import { Howl } from 'howler';

// Load your beep sound
const beepSound = new Howl({
  src: ['https://actions.google.com/sounds/v1/alarms/beep_short.ogg'],
});

const FlowChartWithWarningsNew = ({ data, warningIndices }) => {
  console.log('FlowChartWithWarningsNew received data:', data);
  console.log('FlowChartWithWarningsNew received warnings:', warningIndices);

  const [chartData, setChartData] = useState([]);
  const [warningData, setWarningData] = useState([]);
  const [warnedIndices, setWarnedIndices] = useState(new Set());
  const chartRef = useRef();
  const lastDataLength = useRef(0);

  // Initialize chart data when component mounts
  useEffect(() => {
    if (data?.length) {
      console.log('Initializing chart data:', data);
      setChartData(data);
      setWarningData(warningIndices || []);
      lastDataLength.current = data.length;
    }
  }, []);

  // Update chart data when new data arrives
  useEffect(() => {
    if (data?.length && data.length > lastDataLength.current) {
      console.log('Updating chart data:', data);
      const newData = data.slice(lastDataLength.current);
      setChartData(prevData => [...prevData, ...newData]);
      
      // Update warning indices with proper offset
      if (warningIndices?.length) {
        const newWarnings = warningIndices.map(idx => idx + lastDataLength.current);
        setWarningData(prevWarnings => [...prevWarnings, ...newWarnings]);
      }
      
      lastDataLength.current = data.length;
    }
  }, [data, warningIndices]);

  // Warning sound effect
  useEffect(() => {
    if (!warningData || !warningData.length) return;

    const newWarnings = warningData.filter(i => !warnedIndices.has(i));
    if (newWarnings.length > 0) {
      beepSound.play();
      setWarnedIndices(prev => new Set([...prev, ...newWarnings]));
    }
  }, [warningData, warnedIndices]);

  if (!chartData || chartData.length === 0) {
    return <div className="text-center text-gray-600">No data available for visualization</div>;
  }

  // Get the flow packets data
  const getFlowPackets = (d) => {
    if (d && d['Flow Packets/s'] !== undefined) return d['Flow Packets/s'];
    if (!d) return null;
    const numericField = Object.entries(d).find(([key, value]) => 
      typeof value === 'number' && !isNaN(value) && key !== 'Seconds'
    );
    return numericField ? numericField[1] : null;
  };

  // Create chart data
  const chartConfig = {
    labels: chartData.map(d => d.Seconds),
    datasets: [
      {
        label: 'Flow Packets/s',
        data: chartData.map(getFlowPackets),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        borderWidth: 2,
        pointRadius: 0,
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Warnings',
        data: chartData.map((d, i) => {
          return warningData?.includes(i) ? getFlowPackets(d) : null;
        }),
        borderColor: 'red',
        backgroundColor: 'red',
        pointRadius: 5,
        pointHoverRadius: 7,
        type: 'scatter',
        showLine: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    scales: {
      x: {
        type: 'linear',
        title: { 
          display: true, 
          text: 'Time (seconds)',
        },
        min: 0,
        max: Math.max(...chartData.map(d => d.Seconds)) || 0,
      },
      y: {
        title: { 
          display: true, 
          text: 'Flow Rate',
        },
        min: 0,
        max: Math.max(...chartData.map(d => getFlowPackets(d))) || 100,
      },
    },
    plugins: {
      legend: { 
        display: true,
        position: 'top',
      },
      tooltip: {
        enabled: true,
        mode: 'index',
        intersect: false,
      }
    },
  };

  return (
    <div className="w-full h-full">
      <Line data={chartConfig} options={options} ref={chartRef} />
    </div>
  );
};

export default FlowChartWithWarningsNew; 