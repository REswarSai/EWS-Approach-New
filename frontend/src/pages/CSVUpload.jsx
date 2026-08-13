import { useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Link } from 'react-router-dom';
import { FiUpload, FiFile, FiActivity, FiGrid, FiHome } from 'react-icons/fi';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function CSVUpload() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [data, setData] = useState(null);
  const [processed, setProcessed] = useState(false);
  const [rowData, setRowData] = useState([]);
  const [columnDefs] = useState([
    { field: 'timestamp', headerName: 'Timestamp', sortable: true, filter: true },
    { field: 'source_ip', headerName: 'Source IP', sortable: true, filter: true },
    { field: 'destination_ip', headerName: 'Destination IP', sortable: true, filter: true },
    { field: 'protocol', headerName: 'Protocol', sortable: true, filter: true },
    { field: 'packet_size', headerName: 'Packet Size', sortable: true, filter: 'agNumberColumnFilter' }
  ]);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleProcess = () => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        const rows = text.split('\n').map(row => row.split(','));
        const headers = rows[0];
        const data = rows.slice(1).map(row => {
          const obj = {};
          headers.forEach((header, i) => {
            obj[header] = row[i];
          });
          return obj;
        });
        setRowData(data.filter(item => item.timestamp)); // Filter out empty rows
        setProcessed(true);
      };
      reader.readAsText(file);
    }
  };

  const chartData = {
    labels: rowData.map(row => row.timestamp),
    datasets: [
      {
        label: 'Packet Size (bytes)',
        data: rowData.map(row => parseInt(row.packet_size || 0)),
        borderColor: '#00B8D9',
        backgroundColor: 'rgba(0,184,217,0.1)',
        borderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        tension: 0.1
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: '#A5ADBA',
          font: {
            family: "'Inter', sans-serif"
          }
        }
      },
      tooltip: {
        backgroundColor: '#1E293B',
        titleColor: '#00B8D9',
        bodyColor: '#A5ADBA',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 12,
        usePointStyle: true
      }
    },
    scales: {
      x: {
        ticks: {
          color: '#A5ADBA',
          maxRotation: 45,
          minRotation: 45
        },
        grid: {
          color: 'rgba(165, 173, 186, 0.1)'
        }
      },
      y: {
        ticks: {
          color: '#A5ADBA'
        },
        grid: {
          color: 'rgba(165, 173, 186, 0.1)'
        }
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-sky-900 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 mb-3">
              Network Traffic Analyzer
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              Upload your network traffic CSV data to visualize patterns and detect potential DDoS attacks.
            </p>
          </div>
          <Link 
            to="/" 
            className="flex items-center gap-2 px-5 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-300 hover:text-white transition-all duration-200 font-medium"
          >
            <FiHome className="text-lg" />
            Back to Home
          </Link>
        </div>

        {/* Upload Section */}
        <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-xl overflow-hidden mb-12">
          <div className="p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-end">
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Select CSV File
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-600 rounded-lg cursor-pointer bg-gray-800/50 hover:bg-gray-800 transition-colors duration-200">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 px-4">
                      <FiUpload className="w-8 h-8 mb-2 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-400">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        CSV files only (Max 10MB)
                      </p>
                    </div>
                    <input 
                      type="file" 
                      accept=".csv" 
                      onChange={handleFileChange} 
                      className="hidden" 
                    />
                  </label>
                </div>
                {fileName && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-300">
                    <FiFile className="text-cyan-400" />
                    <span className="truncate max-w-xs">{fileName}</span>
                  </div>
                )}
              </div>
              
              <button
                onClick={handleProcess}
                disabled={!file}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  file 
                    ? 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                <FiActivity className="text-lg" />
                Analyze Data
              </button>
            </div>
          </div>
        </div>

        {processed && (
          <div className="space-y-8">
            {/* Visualization Section */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-xl overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-cyan-400 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <FiActivity className="text-cyan-400" />
                    Traffic Patterns
                  </h2>
                </div>
                <div className="h-96 bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                  <Line data={chartData} options={chartOptions} />
                </div>
              </div>
            </div>

            {/* Data Table Section */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-xl overflow-hidden">
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-1 h-8 bg-cyan-400 rounded-full"></div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                    <FiGrid className="text-cyan-400" />
                    Raw Data
                  </h2>
                </div>
                <div className="ag-theme-alpine-dark font-sans rounded-lg overflow-hidden" style={{ height: 500, width: '100%' }}>
                  <AgGridReact
                    rowData={rowData}
                    columnDefs={columnDefs}
                    pagination={true}
                    paginationPageSize={10}
                    animateRows={true}
                    defaultColDef={{
                      flex: 1,
                      minWidth: 150,
                      resizable: true,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Insights Section */}
            {rowData.length > 0 && (
              <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl shadow-xl overflow-hidden">
                <div className="p-6 sm:p-8">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-1 h-8 bg-cyan-400 rounded-full"></div>
                    <h2 className="text-2xl font-bold text-white">
                      Quick Insights
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-400 mb-1">Total Packets</h3>
                      <p className="text-2xl font-bold text-white">{rowData.length}</p>
                    </div>
                    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-400 mb-1">Average Packet Size</h3>
                      <p className="text-2xl font-bold text-white">
                        {Math.round(rowData.reduce((acc, row) => acc + parseInt(row.packet_size || 0), 0) / rowData.length)} bytes
                      </p>
                    </div>
                    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-400 mb-1">Time Range</h3>
                      <p className="text-2xl font-bold text-white">
                        {rowData[0].timestamp} to {rowData[rowData.length - 1].timestamp}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add some global styles for the AG Grid */}
      <style jsx global>{`
        .ag-theme-alpine-dark {
          --ag-font-family: 'Inter', sans-serif;
          --ag-border-color: rgb(55 65 81);
          --ag-background-color: rgb(17 24 39 / 0.5);
          --ag-foreground-color: rgb(229 231 235);
          --ag-header-background-color: rgb(31 41 55);
          --ag-row-hover-color: rgb(55 65 81 / 0.5);
          --ag-selected-row-background-color: rgb(8 145 178 / 0.3);
          --ag-odd-row-background-color: rgb(31 41 55 / 0.3);
        }
        .ag-theme-alpine-dark .ag-header-cell {
          font-weight: 600;
          color: rgb(165 180 252);
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
      `}</style>
    </div>
  );
}

export default CSVUpload;