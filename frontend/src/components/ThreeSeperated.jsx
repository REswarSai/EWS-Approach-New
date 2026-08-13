import React, { useEffect, useRef } from "react";
import Chart from "chart.js/auto";
import "chartjs-plugin-annotation";

const levelMap = { 1: "Low", 2: "Medium", 3: "High" };
const levelColors = { 1: "yellow", 2: "orange", 3: "red" };

const ThreeSeperated = ({ flow_data = [] }) => {
  const chartRefs = {
    low: useRef(null),
    medium: useRef(null),
    high: useRef(null)
  };

  useEffect(() => {
    if (!flow_data || !Array.isArray(flow_data) || flow_data.length === 0) {
      return;
    }

    // Function to create chart for each level
    const createChart = (level, canvasRef) => {
      if (!canvasRef.current) return;

      const canvas = canvasRef.current.getContext("2d");
      
      // Clear previous chart
      if (canvas.chart) {
        canvas.chart.destroy();
      }

      // Filter data for specific alert level
      const alertData = flow_data.filter(item => item.alert_level === level);

      // Apply smoothing to the flow data
      const smoothingFactor = 0.1;
      const smoothedData = [];
      flow_data.forEach((d, i) => {
        const currentValue = d["Flow Packets/s"] || 0;
        if (i === 0) {
          smoothedData.push(currentValue);
        } else {
          smoothedData.push(smoothedData[i-1] * (1-smoothingFactor) + currentValue * smoothingFactor);
        }
      });

      // Create datasets
      const datasets = [
        {
          label: "Traffic Flow (Smoothed)",
          data: flow_data.map((d, i) => ({ 
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
          data: flow_data.map((d) => ({
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
          label: `${levelMap[level]} Level Alert`,
          data: alertData.map((d) => ({
            x: d.Seconds || 0,
            y: d["Flow Packets/s"] || 0,
          })),
          backgroundColor: levelColors[level],
          borderColor: levelColors[level],
          pointRadius: 4,
          borderWidth: 1,
          showLine: false,
          type: "scatter"
        }
      ];

      // Create chart
      canvas.chart = new Chart(canvas, {
        type: "line",
        data: { datasets },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 0 },
          plugins: {
            title: {
              display: true,
              text: `Test: ${levelMap[level]} Level Early Warnings`,
              font: { size: 16, family: 'Inter, Montserrat, ui-sans-serif, system-ui' }
            },
            legend: {
              position: "right",
              align: "start",
              labels: {
                usePointStyle: true,
                padding: 15,
                boxWidth: 10
              }
            },
            tooltip: {
              enabled: true,
              mode: "nearest",
              intersect: true,
              callbacks: {
                label: function(context) {
                  let label = context.dataset.label || '';
                  if (label) label += ': ';
                  if (context.parsed.y !== null) {
                    label += context.parsed.y.toExponential(2);
                  }
                  if (context.raw && context.raw.label !== undefined) {
                    label += ` (Alert Level: ${context.raw.label})`;
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
                font: { size: 12, family: 'Inter, Montserrat, ui-sans-serif, system-ui' }
              },
              grid: {
                display: true,
                color: 'rgba(35,38,47,0.08)',
                drawTicks: true
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
                font: { size: 12, family: 'Inter, Montserrat, ui-sans-serif, system-ui' }
              },
              grid: {
                display: true,
                color: 'rgba(35,38,47,0.08)',
                drawTicks: true
              },
              ticks: {
                callback: value => value.toExponential(0)
              }
            }
          }
        }
      });
    };

    // Create charts for each level
    createChart(1, chartRefs.low);
    createChart(2, chartRefs.medium);
    createChart(3, chartRefs.high);

    // Cleanup function
    return () => {
      Object.values(chartRefs).forEach(ref => {
        if (ref.current) {
          const ctx = ref.current.getContext("2d");
          if (ctx.chart) {
            ctx.chart.destroy();
          }
        }
      });
    };
  }, [flow_data]); // Only depend on flow_data

  if (!flow_data || !Array.isArray(flow_data) || flow_data.length === 0) {
    return <div className="text-center text-gray-600">No data available for visualization</div>;
  }

  return (
    <div className="space-y-8">
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-2">Low Level Alerts</h2>
        <div className="h-96 relative bg-surface rounded-lg shadow-card p-6 mb-8 font-sans">
          <canvas ref={chartRefs.low}></canvas>
        </div>
      </div>
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-2">Medium Level Alerts</h2>
        <div className="h-96 relative bg-surface rounded-lg shadow-card p-6 mb-8 font-sans">
          <canvas ref={chartRefs.medium}></canvas>
        </div>
      </div>
      <div className="p-4">
        <h2 className="text-lg font-semibold mb-2">High Level Alerts</h2>
        <div className="h-96 relative bg-surface rounded-lg shadow-card p-6 mb-8 font-sans">
          <canvas ref={chartRefs.high}></canvas>
        </div>
      </div>
    </div>
  );
};

export default ThreeSeperated;
