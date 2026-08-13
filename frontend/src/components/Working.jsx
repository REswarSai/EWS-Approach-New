import React, { useState } from 'react';
import { AgGridReact } from '@ag-grid-community/react';
import { ClientSideRowModelModule } from '@ag-grid-community/client-side-row-model';
import '@ag-grid-community/styles/ag-grid.css';
import '@ag-grid-community/styles/ag-theme-alpine.css';

const Working = ({ cleanedData, selectedColumns, uploadedCsv, grouped_df, transformed_df, test_kurtosis, test_skewness, kurtosis_thresholds, skewness_thresholds, df }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [gridApi, setGridApi] = useState(null);
  const [gridColumnApi, setGridColumnApi] = useState(null);
  const [transformationView, setTransformationView] = useState('T_t');

  // Helper function to format rolling statistics data
  const formatRollingStats = (stats) => {
    if (!stats || Object.keys(stats).length === 0) return [];
    
    const features = Object.keys(stats);
    const length = stats[features[0]].length;
    const formattedData = [];

    for (let i = 0; i < length; i++) {
      const row = { index: i + 1 };
      features.forEach(feature => {
        row[feature] = stats[feature][i];
      });
      formattedData.push(row);
    }
    return formattedData;
  };

  // Helper function to format thresholds data
  const formatThresholds = (thresholds, type) => {
    if (!thresholds) return [];
    return Object.entries(thresholds).map(([feature, value]) => ({
      Feature: feature,
      [`${type} Threshold`]: value
    }));
  };

  // Helper function to format alert levels data
  const formatAlertLevels = (data) => {
    if (!data || !Array.isArray(data)) return [];
    return data.map((row, index) => ({
      index: index + 1,
      'Flow Packets/s Alert': row['alert_level_Flow Packets/s'] || 0,
      'T(t) Alert': row['alert_level_T(t)'] || 0,
      'dT/dt Alert': row['alert_level_dT/dt'] || 0,
      'd²T/dt² Alert': row['alert_level_d²T/dt²'] || 0,
      'Combined Alert Level': row['alert_level'] || 0
    }));
  };

  const stepData = {
    1: uploadedCsv || [],
    2: selectedColumns || [],
    3: cleanedData || [],
    4: grouped_df || [],
    5: transformed_df || [],
    6: test_kurtosis ? formatRollingStats(test_kurtosis) : [],
    7: test_skewness ? formatRollingStats(test_skewness) : [],
    8: formatThresholds(kurtosis_thresholds, 'Kurtosis'),
    9: formatThresholds(skewness_thresholds, 'Skewness'),
    10: df ? formatAlertLevels(df) : []
  };

  const stepTitles = {
    1: 'Original CSV Uploaded',
    2: 'CSV with Selected Columns',
    3: 'Cleaned CSV',
    4: 'Grouped by Timestamps',
    5: 'Transformations',
    6: 'Rolling Kurtosis',
    7: 'Rolling Skewness',
    8: 'Kurtosis Thresholds',
    9: 'Skewness Thresholds',
    10: 'Alert Levels'
  };

  const onGridReady = (params) => {
    setGridApi(params.api);
    setGridColumnApi(params.columnApi);
  };

  const getColumnDefs = () => {
    const data = stepData[currentStep];
    if (!data || data.length === 0) return [];

    if (currentStep === 5) {
      switch (transformationView) {
        case 'T_t':
          return ['Timestamp', 'Seconds', 'T(t)'].map(key => ({
            field: key,
            headerName: key,
            sortable: true,
            filter: true,
            resizable: true,
            valueFormatter: (params) => {
              if (typeof params.value === 'number') {
                return params.value.toFixed(4);
              }
              return params.value;
            }
          }));
        case 'dT_dt':
          return ['Timestamp', 'Seconds', 'T(t)', 'dT/dt'].map(key => ({
            field: key,
            headerName: key,
            sortable: true,
            filter: true,
            resizable: true,
            valueFormatter: (params) => {
              if (typeof params.value === 'number') {
                return params.value.toFixed(4);
              }
              return params.value;
            }
          }));
        case 'd2T_dt2':
          return ['Timestamp', 'Seconds', 'T(t)', 'dT/dt', 'd²T/dt²'].map(key => ({
            field: key,
            headerName: key,
            sortable: true,
            filter: true,
            resizable: true,
            valueFormatter: (params) => {
              if (typeof params.value === 'number') {
                return params.value.toFixed(4);
              }
              return params.value;
            }
          }));
        default:
          return [];
      }
    }

    // For steps 6 and 7 (Rolling statistics)
    if (currentStep === 6 || currentStep === 7) {
      return Object.keys(data[0]).map(key => ({
        field: key,
        headerName: key === 'index' ? 'Index' : key,
        sortable: true,
        filter: true,
        resizable: true,
        valueFormatter: (params) => {
          if (typeof params.value === 'number' && key !== 'index') {
            return params.value.toFixed(4);
          }
          return params.value;
        }
      }));
    }

    // For steps 8 and 9 (Thresholds)
    if (currentStep === 8 || currentStep === 9) {
      return ['Feature', `${currentStep === 8 ? 'Kurtosis' : 'Skewness'} Threshold`].map(key => ({
        field: key,
        headerName: key,
        sortable: true,
        filter: true,
        resizable: true,
        valueFormatter: (params) => {
          if (typeof params.value === 'number') {
            return params.value.toFixed(4);
          }
          return params.value;
        }
      }));
    }

    // For step 10 (Alert Levels)
    if (currentStep === 10) {
      return Object.keys(data[0]).map(key => ({
        field: key,
        headerName: key === 'index' ? 'Index' : key,
        sortable: true,
        filter: true,
        resizable: true
      }));
    }

    return Object.keys(data[0]).map(key => ({
      field: key,
      headerName: key,
      sortable: true,
      filter: true,
      resizable: true,
      valueFormatter: (params) => {
        if (typeof params.value === 'number') {
          return params.value.toFixed(4);
        }
        return params.value;
      }
    }));
  };

  const getRowData = () => {
    if (currentStep === 5) {
      const data = stepData[5];
      switch (transformationView) {
        case 'T_t':
          return data.map(row => ({
            'Timestamp': row['Timestamp'],
            'Seconds': row['Seconds'],
            'T(t)': row['T(t)']
          }));
        case 'dT_dt':
          return data.map(row => ({
            'Timestamp': row['Timestamp'],
            'Seconds': row['Seconds'],
            'T(t)': row['T(t)'],
            'dT/dt': row['dT/dt']
          }));
        case 'd2T_dt2':
          return data;
        default:
          return [];
      }
    }
    return stepData[currentStep];
  };

  const handleNext = () => {
    if (currentStep < 10) {
      setCurrentStep(prev => prev + 1);
      setTransformationView('T_t');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setTransformationView('T_t');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-blue-900">{stepTitles[currentStep]}</h2>
        <div className="flex gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={`px-4 py-2 rounded-lg ${
              currentStep === 1
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-900 text-white hover:bg-blue-800'
            }`}
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={currentStep === 10}
            className={`px-4 py-2 rounded-lg ${
              currentStep === 10
                ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                : 'bg-blue-900 text-white hover:bg-blue-800'
            }`}
          >
            Next
          </button>
        </div>
      </div>

      {currentStep === 5 && (
        <div className="mb-6 flex gap-4">
          <button
            onClick={() => setTransformationView('T_t')}
            className={`px-4 py-2 rounded-lg ${
              transformationView === 'T_t'
                ? 'bg-blue-900 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            T(t)
          </button>
          <button
            onClick={() => setTransformationView('dT_dt')}
            className={`px-4 py-2 rounded-lg ${
              transformationView === 'dT_dt'
                ? 'bg-blue-900 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            dT/dt
          </button>
          <button
            onClick={() => setTransformationView('d2T_dt2')}
            className={`px-4 py-2 rounded-lg ${
              transformationView === 'd2T_dt2'
                ? 'bg-blue-900 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            d²T/dt²
          </button>
        </div>
      )}

      <div className="ag-theme-alpine-dark font-sans rounded-lg overflow-hidden" style={{ height: 500, width: '100%' }}>
        <AgGridReact
          rowData={getRowData()}
          columnDefs={getColumnDefs()}
          onGridReady={onGridReady}
          modules={[ClientSideRowModelModule]}
          pagination={true}
          paginationPageSize={10}
          defaultColDef={{
            sortable: true,
            filter: true,
            resizable: true
          }}
        />
      </div>
    </div>
  );
};

export default Working; 