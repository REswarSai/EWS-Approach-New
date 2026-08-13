import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

const DetectionCSVUpload = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');

  // AG Grid column definitions
  const columnDefs = useMemo(() => [
    { field: 'URG Flag Count', filter: true, sortable: true },
    { field: 'CWE Flag Count', filter: true, sortable: true },
    { field: 'Fwd PSH Flags', filter: true, sortable: true },
    { field: 'RST Flag Count', filter: true, sortable: true },
    { field: 'Inbound', filter: true, sortable: true },
    { field: 'Min Packet Length', filter: true, sortable: true },
    { field: 'Fwd Packet Length Min', filter: true, sortable: true },
    { field: 'Flow Bytes/s', filter: true, sortable: true },
    { field: 'Bwd IAT Total', filter: true, sortable: true },
    { field: 'Down/Up Ratio', filter: true, sortable: true },
    { field: 'Fwd Packets/s', filter: true, sortable: true },
    { field: 'Flow Packets/s', filter: true, sortable: true },
    { field: 'Average Packet Size', filter: true, sortable: true },
    { field: 'min_seg_size_forward', filter: true, sortable: true },
    { field: 'Fwd Packet Length Mean', filter: true, sortable: true },
    { field: 'Avg Fwd Segment Size', filter: true, sortable: true },
    { 
      field: 'prediction', 
      filter: true, 
      sortable: true,
      cellRenderer: (params) => {
        return params.value === 1 ? 'Attack' : 'Benign';
      },
      cellStyle: (params) => {
        return params.value === 1 ? { color: 'red', fontWeight: 'bold' } : { color: 'green', fontWeight: 'bold' };
      }
    },
    { 
      field: 'prediction_probability', 
      filter: true, 
      sortable: true,
      valueFormatter: (params) => {
        return `${(params.value * 100).toFixed(2)}%`;
      },
      cellStyle: (params) => {
        const value = params.value;
        if (value > 0.8) return { color: 'red', fontWeight: 'bold' };
        if (value > 0.6) return { color: 'orange', fontWeight: 'bold' };
        return { color: 'green', fontWeight: 'bold' };
      }
    }
  ], []);

  const defaultColDef = useMemo(() => ({
    flex: 1,
    minWidth: 100,
    resizable: true,
  }), []);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
    setMessage('');
    setError('');
    setResults(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a file to upload');
      return;
    }

    setIsLoading(true);
    setMessage('Analyzing CSV file for DDoS detection...');
    setError('');
    setResults(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/api/upload_detection', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process file');
      }

      setResults(data);
      setMessage('Analysis complete. CSV processed for DDoS detection.');
    } catch (err) {
      setError(err.message || 'An error occurred while processing the file');
      setMessage('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-blue-900">CSV Analysis for DDoS Detection</h1>
          <button 
            onClick={() => navigate('/detection')}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-300"
          >
            Back
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <p className="text-gray-600 mb-6">
            Upload a CSV file containing network traffic data to analyze for potential DDoS attacks.
          </p>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <input 
                type="file" 
                accept=".csv"
                onChange={handleFileChange}
                className="block w-full text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="mt-2 text-sm text-gray-500">Only CSV files are supported</p>
            </div>

            {error && (
              <div className="p-4 rounded-lg bg-red-100 text-red-800">
                {error}
              </div>
            )}

            {message && (
              <div className={`p-4 rounded-lg ${message.includes('complete') ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                {message}
              </div>
            )}

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={isLoading || !file}
                className={`px-6 py-3 bg-blue-900 text-white rounded-lg ${isLoading || !file ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-800'} transition-colors duration-300`}
              >
                {isLoading ? 'Processing...' : 'Analyze for DDoS Attacks'}
              </button>
            </div>
          </form>

          {results && (
            <div className="mt-8 space-y-6">
              <h2 className="text-2xl font-semibold text-gray-800">Analysis Results</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Predictions Summary</h3>
                  <p className="text-gray-600">
                    Total Samples: {results.original_data.length}
                  </p>
                  <p className="text-gray-600">
                    Predicted Attacks: {results.predictions.filter(p => p === 1).length}
                  </p>
                  <p className="text-gray-600">
                    Predicted Benign: {results.predictions.filter(p => p === 0).length}
                  </p>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-gray-700 mb-2">Confidence Levels</h3>
                  <p className="text-gray-600">
                    Average Confidence: {(results.prediction_probabilities.reduce((a, b) => a + b, 0) / results.prediction_probabilities.length * 100).toFixed(2)}%
                  </p>
                  <p className="text-gray-600">
                    High Confidence Predictions: {results.prediction_probabilities.filter(p => p > 0.8).length}
                  </p>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-semibold text-gray-700 mb-2">Data Analysis</h3>
                <div className="ag-theme-alpine" style={{ height: 500, width: '100%' }}>
                  <AgGridReact
                    rowData={results.original_data}
                    columnDefs={columnDefs}
                    defaultColDef={defaultColDef}
                    pagination={true}
                    paginationPageSize={10}
                    domLayout="autoHeight"
                    enableCellTextSelection={true}
                    suppressRowClickSelection={true}
                    onGridReady={(params) => {
                      params.api.sizeColumnsToFit();
                    }}
                  />
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-semibold text-gray-700 mb-2">Download Results</h3>
                <div className="space-x-4">
                  <a 
                    href={`http://localhost:5000${results.original_with_predictions_file}`}
                    className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors duration-300"
                    download
                  >
                    Download Original Data with Predictions
                  </a>
                  <a 
                    href={`http://localhost:5000${results.processed_file}`}
                    className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors duration-300"
                    download
                  >
                    Download Processed Data
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetectionCSVUpload; 