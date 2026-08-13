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
// import { Line } from 'react-chartjs-2';

// ChartJS.register(
//   LineElement,
//   PointElement,
//   LinearScale,
//   CategoryScale,
//   Title,
//   Tooltip,
//   Legend
// );

// const Test_T_t = ({ df }) => {
//   const benign = df.filter(row => row.Label === 'BENIGN');
//   const attack = df.filter(row => row.Label !== 'BENIGN');
//   const name = 'Test Dataset'
//   const data = {
//     datasets: [
//       {
//         label: 'Benign',
//         data: benign.map(row => ({ x: row.Seconds, y: row['Flow Packets/s'] })),
//         borderColor: 'green',
//         borderWidth: 1,
//         pointRadius: 0,
//         showLine: true,
//       },
//       {
//         label: 'Attack',
//         data: attack.map(row => ({ x: row.Seconds, y: row['Flow Packets/s'] })),
//         borderColor: 'red',
//         borderWidth: 1,
//         pointRadius: 0,
//         showLine: true,
//       },
//     ],
//   };

//   const options = {
//     responsive: true,
//     plugins: {
//       legend: {
//         position: 'top',
//       },
//       title: {
//         display: true,
//         text: `T(t) - Flow Packets/s vs Seconds (${name})`,
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
//           text: 'T(t) = Flow Packets/s',
//         },
//       },
//     },
//   };

//   return (
//     <div className="p-4 bg-white rounded-xl shadow-md">
//       <Line data={data} options={options} />
//     </div>
//   );
// };

// export default Test_T_t;
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
import { Line } from 'react-chartjs-2';

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

const Test_T_t = ({ df = [], name = 'Test Dataset' }) => {
  // Add validation for empty or invalid data
  if (!df || !Array.isArray(df) || df.length === 0) {
    return (
      <div className="p-4">
        <div className="h-96 flex items-center justify-center">
          <p className="text-gray-500 text-center">No data available</p>
        </div>
      </div>
    );
  }

  // Define options first
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
          text: 'T(t) = Flow Packets/s',
          font: {
            size: 14,
            weight: 'normal',
            family: 'Inter, Montserrat, ui-sans-serif, system-ui'
          }
        },
        grid: {
          display: true,
          color: 'rgba(35,38,47,0.08)'
        }
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
              label += context.parsed.y.toLocaleString();
            }
            return label;
          }
        }
      },
      title: {
        display: true,
        text: `T(t) vs Seconds (${name})`,
        font: {
          size: 16,
          family: 'Inter, Montserrat, ui-sans-serif, system-ui'
        }
      }
    },
  };

  // Ensure Label values are numeric (1 for benign, 0 for attack)
  const benign = df.filter(row => row.Label === 1 || row.Label === 'BENIGN');
  const attack = df.filter(row => row.Label === 0 || row.Label === 'ATTACK');

  // First add benign data, then attack data (so attack overlaps benign)
  const data = {
    datasets: [
      {
        label: 'Benign',
        data: benign.map(row => ({
          x: row.Seconds || 0,
          y: row['Flow Packets/s'] || 0
        })),
        borderColor: 'rgba(44, 160, 44, 0.8)', // Green
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        pointRadius: 0,
        showLine: true,
        fill: false,
        tension: 0,
        order: 2, // Higher order means it renders first (underneath)
      },
      {
        label: 'Attack',
        data: attack.map(row => ({
          x: row.Seconds || 0,
          y: row['Flow Packets/s'] || 0
        })),
        borderColor: 'rgba(214, 39, 40, 0.8)', // Red
        backgroundColor: 'transparent',
        borderWidth: 1.5,
        pointRadius: 0,
        showLine: true,
        fill: false,
        tension: 0,
        order: 1, // Lower order means it renders last (on top)
      }
    ],
  };

  // Get min and max visible time
  const minTime = Math.min(...df.map(d => d.Seconds || 0));
  const maxTime = Math.max(...df.map(d => d.Seconds || 0));

  return (
    <div className="p-4">
      <div className="h-96 relative">
        <Line data={data} options={options} />
      </div>
      
      <div className="mt-4 text-sm text-gray-600">
        <div className="flex justify-between">
          <div>
            {attack.length > 0 && (
              <p>Detected {attack.length} attacks</p>
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

export default Test_T_t;
