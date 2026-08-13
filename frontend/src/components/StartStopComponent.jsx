import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Chart as ChartJS, LineElement, PointElement, LinearScale, Title, Tooltip, Legend } from 'chart.js';
import { Scatter } from 'react-chartjs-2';

ChartJS.register(LineElement, PointElement, LinearScale, Title, Tooltip, Legend);

const StartStopComponent = () => {
  const [dataList, setDataList] = useState([]);
  const [warningIndices, setWarningIndices] = useState([]);
  const [plotData, setPlotData] = useState([]);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef(null);
  const timeRef = useRef(0);

  const fetchData = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/capture');
      const data = response.data;
      const packets = parseFloat(data.data?.["Flow Packets/s"]);
      
      // Ensure time and packet are updated
      timeRef.current += 30;
      
      setDataList(prev => [...prev, data]);
      
      if (data.warning === true || data.status === 'warning') {
        setWarningIndices(prev => [...prev, dataList.length]);
      }

      if (!isNaN(packets)) {
        setPlotData(prev => [
          ...prev,
          { x: timeRef.current, y: packets }
        ]);
      }

      console.log(`Fetched at ${timeRef.current}s | Flow Packets/s: ${packets}`);
    } catch (err) {
      console.error(`Fetch error: ${err.message}`);
    }
  };

  const startPolling = () => {
    setIsRunning(true);
    setDataList([]);
    setPlotData([]);
    setWarningIndices([]);
    timeRef.current = 0;
    fetchData(); // Initial fetch
    intervalRef.current = setInterval(fetchData, 30000); // Every 30s
  };

  const stopPolling = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
  };

  useEffect(() => {
    return () => clearInterval(intervalRef.current); // Cleanup on unmount
  }, []);

  const chartData = {
    datasets: [
      {
        label: 'Flow Packets/s',
        data: plotData,
        backgroundColor: '#3182CE',
        showLine: true,
        pointRadius: 3,
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    scales: {
      x: {
        type: 'linear',
        title: {
          display: true,
          text: 'Time (seconds)',
        },
      },
      y: {
        title: {
          display: true,
          text: 'Flow Packets/s',
        },
      },
    },
    plugins: {
      legend: {
        display: true,
      },
      tooltip: {
        callbacks: {
          label: (ctx) => `(${ctx.parsed.x}s, ${ctx.parsed.y})`,
        },
      },
    },
  };

  return (
    <div className="p-6 rounded-2xl shadow-md w-full max-w-3xl mx-auto bg-surface space-y-6">
      <h2 className="text-xl font-semibold text-center">API Polling + Chart.js Scatter Plot</h2>

      <div className="text-center space-x-2">
        <button
          onClick={startPolling}
          disabled={isRunning}
          className="px-4 py-2 rounded-xl bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
        >
          Start
        </button>
        <button
          onClick={stopPolling}
          disabled={!isRunning}
          className="px-4 py-2 rounded-xl bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
        >
          Stop
        </button>
      </div>

      <p className="text-center">
        📦 Total: {dataList.length} | ⚠️ Warnings: {warningIndices.length}
      </p>

      <div className="w-full h-[400px]">
        <Scatter data={chartData} options={chartOptions} />
      </div>
    </div>
  );
};

export default StartStopComponent;
