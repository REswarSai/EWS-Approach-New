// import React from 'react';
// import {
//   Chart as ChartJS,
//   LineElement,
//   PointElement,
//   LinearScale,
//   CategoryScale,
//   Title,
//   Tooltip,
//   Legend,
// } from 'chart.js';
// import annotationPlugin from 'chartjs-plugin-annotation';
// import { Line } from 'react-chartjs-2';

// ChartJS.register(
//   LineElement,
//   PointElement,
//   LinearScale,
//   CategoryScale,
//   Title,
//   Tooltip,
//   Legend,
//   annotationPlugin // register it here
// );

// const TestPeakRegionChart = ({ df, firstAttackIndex }) => {
//   const benignData = df.filter(row => row.Label === 'BENIGN');
//   const attackData = df.filter(row => row.Label !== 'BENIGN');

//   const attackTime = df[firstAttackIndex]?.Seconds;
//   const peakPoint = attackData.reduce((prev, current) =>
//     prev['Flow Packets/s'] > current['Flow Packets/s'] ? prev : current
//   );

//   const datasets = [
//     {
//       label: 'Benign',
//       data: benignData.map(row => ({ x: row.Seconds, y: row['Flow Packets/s'] })),
//       borderColor: 'green',
//       borderWidth: 1,
//       pointRadius: 0,
//       showLine: true,
//     },
//     {
//       label: 'Attack',
//       data: attackData.map(row => ({ x: row.Seconds, y: row['Flow Packets/s'] })),
//       borderColor: 'red',
//       borderWidth: 1,
//       pointRadius: 0,
//       showLine: true,
//     },
//     {
//       label: 'Peak Point',
//       data: [{ x: peakPoint.Seconds, y: peakPoint['Flow Packets/s'] }],
//       backgroundColor: 'black',
//       borderColor: 'black',
//       pointStyle: 'cross',
//       radius: 8,
//       showLine: false,
//     },
//   ];

//   const options = {
//     responsive: true,
//     plugins: {
//       legend: {
//         position: 'top',
//       },
//       title: {
//         display: true,
//         text: 'Test Data with Peak Region and Attack Start',
//       },
//       annotation: {
//         annotations: {
//           attackStart: {
//             type: 'line',
//             scaleID: 'x',
//             value: attackTime,
//             borderColor: 'purple',
//             borderWidth: 1,
//             borderDash: [6, 6],
//             label: {
//               content: 'Attack Start',
//               enabled: true,
//               position: 'start',
//               backgroundColor: 'purple',
//               color: 'white',
//             },
//           },
//           peakLine: {
//             type: 'line',
//             scaleID: 'x',
//             value: peakPoint.Seconds,
//             borderColor: 'orange',
//             borderWidth: 1,
//             borderDash: [6, 6],
//             label: {
//               content: 'Peak Point',
//               enabled: true,
//               position: 'start',
//               backgroundColor: 'orange',
//               color: 'black',
//             },
//           },
//         },
//       },
//     },
//     scales: {
//       x: {
//         type: 'linear',
//         title: {
//           display: true,
//           text: 'Seconds',
//         },
//       },
//       y: {
//         title: {
//           display: true,
//           text: 'Flow Packets/s',
//         },
//       },
//     },
//   };

//   return <Line data={{ datasets }} options={options} />;
// };

// export default TestPeakRegionChart;
import React from 'react';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler,
  annotationPlugin
);

const TestPeakRegionChart = ({ df = [], firstAttackIndex = -1 }) => {
  // Add validation for empty or invalid data
  if (!df || !Array.isArray(df) || df.length === 0) {
    return (
      <div className="text-center text-gray-600">No data available for visualization</div>
    );
  }

  const benignData = df.filter(row => row.Label === 1);
  const attackData = df.filter(row => row.Label === 0);

  // Handle case when there's no attack data
  if (attackData.length === 0) {
    const chartData = {
      datasets: [{
        label: 'Benign',
        data: benignData.map(row => ({ x: row.Seconds, y: row['Flow Packets/s'] })),
        borderColor: 'rgba(31, 119, 180, 0.7)',
        backgroundColor: 'rgba(31, 119, 180, 0.1)',
        borderWidth: 1,
        pointRadius: 0,
        showLine: true,
      }]
    };

    return (
      <div className="p-4">
        <div className="h-96 relative">
          <Line 
            data={chartData}
            options={{
              animation: false,
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: { 
                  display: true,
                  position: 'top',
                  labels: {
                    usePointStyle: true,
                    padding: 15
                  }
                },
                title: {
                  display: true,
                  text: 'Test Data (No Attacks Detected)',
                  font: { size: 16 }
                }
              },
              scales: {
                x: {
                  type: 'linear',
                  position: 'bottom',
                  title: { 
                    display: true, 
                    text: 'Seconds',
                    font: { size: 14, weight: 'normal' }
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
                  title: { 
                    display: true, 
                    text: 'Flow Packets/s',
                    font: { size: 14, weight: 'normal' }
                  },
                  grid: {
                    display: true,
                    color: '#e0e0e0'
                  }
                }
              }
            }}
          />
        </div>
      </div>
    );
  }

  const attackTime = firstAttackIndex >= 0 ? df[firstAttackIndex]?.Seconds : null;
  const peakPoint = attackData.reduce((prev, current) =>
    (prev['Flow Packets/s'] || 0) > (current['Flow Packets/s'] || 0) ? prev : current
  );

  const datasets = [
    {
      label: 'Traffic Flow',
      data: df.map(row => ({ x: row.Seconds, y: row['Flow Packets/s'] || 0 })),
      borderColor: 'gray',
      backgroundColor: 'transparent',
      borderWidth: 1,
      pointRadius: 0,
      showLine: true,
      tension: 0,
      order: 1
    },
    {
      label: 'Classes',
      data: df.map(row => ({
        x: row.Seconds,
        y: row['Flow Packets/s'] || 0,
        label: row.Label
      })),
      backgroundColor: (context) => {
        if (!context.raw || context.raw.label === undefined) return 'rgba(0, 0, 255, 0.7)';
        
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
      type: 'scatter',
      order: 2
    }
  ];

  // Only add peak point if we have attack data
  if (peakPoint && typeof peakPoint.Seconds !== 'undefined') {
    datasets.push({
      label: 'Peak Point',
      data: [{ x: peakPoint.Seconds, y: peakPoint['Flow Packets/s'] || 0 }],
      backgroundColor: 'black',
      borderColor: 'black',
      pointStyle: 'cross',
      radius: 8,
      showLine: false,
      order: 3
    });
  }

  const options = {
    animation: false,
    responsive: true,
    maintainAspectRatio: false,
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
        text: 'Test Data with Peak Region and Attack Start',
        font: { size: 16 }
      },
      annotation: attackTime ? {
        annotations: {
          attackStart: {
            type: 'line',
            scaleID: 'x',
            value: attackTime,
            borderColor: 'purple',
            borderWidth: 1,
            borderDash: [6, 6],
            label: {
              content: 'Attack Start',
              enabled: true,
              position: 'start',
              backgroundColor: 'purple',
              color: 'white',
            },
          },
          ...(peakPoint && typeof peakPoint.Seconds !== 'undefined' ? {
            peakLine: {
              type: 'line',
              scaleID: 'x',
              value: peakPoint.Seconds,
              borderColor: 'orange',
              borderWidth: 1,
              borderDash: [6, 6],
              label: {
                content: 'Peak Point',
                enabled: true,
                position: 'start',
                backgroundColor: 'orange',
                color: 'black',
              },
            }
          } : {})
        },
      } : {},
    },
    scales: {
      x: {
        type: 'linear',
        position: 'bottom',
        title: { 
          display: true, 
          text: 'Seconds',
          font: { size: 14, weight: 'normal' }
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
        title: { 
          display: true, 
          text: 'Flow Packets/s',
          font: { size: 14, weight: 'normal' }
        },
        grid: {
          display: true,
          color: '#e0e0e0'
        },
        suggestedMin: 0,
        suggestedMax: Math.max(...df.map(d => d['Flow Packets/s'] || 0)) * 1.1
      }
    }
  };

  // Get min and max visible time
  const minTime = Math.min(...df.map(d => d.Seconds || 0));
  const maxTime = Math.max(...df.map(d => d.Seconds || 0));

  return (
    <div className="p-4">
      <div className="h-96 relative">
        <Line data={{ datasets }} options={options} />
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <div className="flex justify-between">
          <div>
            {attackData.length > 0 && (
              <p>Detected {attackData.length} anomalies</p>
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

export default TestPeakRegionChart;
