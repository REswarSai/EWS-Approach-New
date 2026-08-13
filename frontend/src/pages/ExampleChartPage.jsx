import React, { useState, useEffect } from "react";
import axios from "axios";
import FlowChartWithWarnings from "../components/FlowChartWithWarnings";
import { useNavigate } from "react-router-dom";
import AnimatedBenignAttackPlot from "../components/AnimatedBenignAttackPlot";
import TestPeakRegionPlot from "../components/TestPeakRegionPlot";
import Test_T_t from "../components/Test_T_t";
import Test_dT_dt from "../components/Test_dT_dt";
import Test_d2T_dt2 from "../components/Test_d2T_dt2";
import { AgGridReact } from "@ag-grid-community/react";
import { ClientSideRowModelModule } from "@ag-grid-community/client-side-row-model";
import "@ag-grid-community/styles/ag-grid.css";
import "@ag-grid-community/styles/ag-theme-alpine.css";
import Emergency from "../components/Emergency";
import ThreeSeperated from "../components/ThreeSeperated";
import Working from "../components/Working";
import KurtosisPlot from "../components/KurtosisPlot";
import SkewnessPlot from "../components/SkewnessPlot";
import HighLevelGraph from '../components/HighLevelGraph';
import FlowPackets from '../components/FlowPackets';
import { FiUpload, FiFile, FiActivity } from 'react-icons/fi';

const generateDummyKurtosisData = (size = 100) => {
  const result = [];
  for (let i = 0; i < size; i++) {
    // Create a sample data point
    result.push({
      Seconds: i,
      'Flow Packets/s_kurtosis': 3 + Math.sin(i / 10) * 2 + Math.random() * 0.5
    });
  }
  return result;
};

const generateDummySkewnessData = (size = 100) => {
  const result = [];
  for (let i = 0; i < size; i++) {
    result.push({
      Seconds: i,
      'Flow Packets/s_skewness': Math.sin(i / 10) + Math.random() * 0.5
    });
  }
  return result;
};

const ExampleChartPage = () => {
  const navigate = useNavigate();
  const [flowData, setFlowData] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [firstAttackIndex, setFirstAttackIndex] = useState([]);
  const [df, setDf] = useState([]);
  const [error, setError] = useState(null);
  const [file, setFile] = useState(null);
  const [chunkSize, setChunkSize] = useState(100);
  const [isProcessing, setIsProcessing] = useState(false);
  const [dataProcessed, setDataProcessed] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [showSourceIpModal, setShowSourceIpModal] = useState(false);
  const [sourceIpData, setSourceIpData] = useState([]);
  const [showWorking, setShowWorking] = useState(false);
  const [gridApi, setGridApi] = useState(null);
  const [gridColumnApi, setGridColumnApi] = useState(null);
  const [cleanedData, setCleanedData] = useState([]);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [uploadedCsv, setUploadedCsv] = useState([]);
  const [groupedDf, setGroupedDf] = useState([]);
  const [transformedDf, setTransformedDf] = useState([]);
  const [testKurtosis, setTestKurtosis] = useState([]);
  const [testSkewness, setTestSkewness] = useState([]);
  const [kurtosisThresholds, setKurtosisThresholds] = useState([]);
  const [skewnessThresholds, setSkewnessThresholds] = useState([]);
  const [kurtosisData, setKurtosisData] = useState([]);
  const [processedKurtosisData, setProcessedKurtosisData] = useState([]);
  const [df_level_0, setDfLevel0] = useState([]);
  const [df_level_1, setDfLevel1] = useState([]);
  const [df_level_2, setDfLevel2] = useState([]);
  const [df_level_3, setDfLevel3] = useState([]);
  const [responseData, setResponseData] = useState(null);
  const [processedSkewnessData, setProcessedSkewnessData] = useState([]);

  // Force initial demo data to ensure something loads
  useEffect(() => {
    // Only do this if processedKurtosisData is empty
    if (processedKurtosisData.length === 0) {
      console.log("Loading initial dummy kurtosis data");
      const dummyData = generateDummyKurtosisData(200);
      setProcessedKurtosisData(dummyData);
    }
  }, [processedKurtosisData.length]);

  // Update level data when responseData changes
  useEffect(() => {
    if (responseData) {
      setTestKurtosis(responseData.test_kurtosis_df || []);
      setTestSkewness(responseData.test_skewness_df || []);
      setDfLevel0(responseData.df_level_0 || []);
      setDfLevel1(responseData.df_level_1 || []);
      setDfLevel2(responseData.df_level_2 || []);
      setDfLevel3(responseData.df_level_3 || []);
    }
  }, [responseData]);

  // Force data generation on mount
  useEffect(() => {
    console.log("Component mounted - ensuring data is available");
    if (flowData.length > 0 && processedKurtosisData.length === 0) {
      console.log("Generating kurtosis data from flow data on mount");
      const generatedData = calculateKurtosis(flowData);
      console.log("Generated kurtosis data:", generatedData.slice(0, 3));
      setProcessedKurtosisData(generatedData);
    } else if (processedKurtosisData.length === 0) {
      // Load dummy data if nothing else is available
      console.log("Loading dummy kurtosis data on mount");
      const dummyData = generateDummyKurtosisData(200);
      setProcessedKurtosisData(dummyData);
    }
  }, []);

  // Effect to process and format kurtosis data whenever it changes
  useEffect(() => {
    console.log("useEffect for kurtosis data processing triggered");
    console.log("Current kurtosisData:", {
      type: typeof kurtosisData,
      isArray: Array.isArray(kurtosisData),
      length: Array.isArray(kurtosisData) ? kurtosisData.length : 0,
      sample: Array.isArray(kurtosisData) && kurtosisData.length > 0 ? kurtosisData.slice(0, 2) : null
    });
    console.log("Current flowData:", {
      type: typeof flowData,
      isArray: Array.isArray(flowData),
      length: Array.isArray(flowData) ? flowData.length : 0,
      sample: Array.isArray(flowData) && flowData.length > 0 ? flowData.slice(0, 2) : null
    });
    
    if (kurtosisData && Array.isArray(kurtosisData) && kurtosisData.length > 0) {
      console.log("Processing kurtosis data...");
      
      // If kurtosisData is already an array of objects with Seconds and a kurtosis value, use it
      if (typeof kurtosisData[0] === 'object' && kurtosisData[0] !== null) {
        const formattedData = kurtosisData.map(item => {
          // Ensure each item has the required properties
          const formattedItem = { ...item };
          
          // Make sure Seconds is present
          if (formattedItem.Seconds === undefined) {
            if (formattedItem.seconds !== undefined) {
              formattedItem.Seconds = formattedItem.seconds;
            } else if (formattedItem.time !== undefined) {
              formattedItem.Seconds = formattedItem.time;
            } else if (formattedItem.timestamp !== undefined) {
              formattedItem.Seconds = formattedItem.timestamp;
            }
          }
          
          // Make sure kurtosis value is present
          if (!('Flow Packets/s_kurtosis' in formattedItem)) {
            // Look for any key containing 'kurtosis'
            const kurtosisKey = Object.keys(formattedItem).find(key => 
              key.toLowerCase().includes('kurtosis') || key.toLowerCase().includes('kurt')
            );
            
            if (kurtosisKey) {
              formattedItem['Flow Packets/s_kurtosis'] = formattedItem[kurtosisKey];
            } else {
              // Find any numeric value that could be kurtosis
              for (const [key, value] of Object.entries(formattedItem)) {
                if (typeof value === 'number' && key !== 'Seconds' && key !== 'seconds' && key !== 'index') {
                  formattedItem['Flow Packets/s_kurtosis'] = value;
                  break;
                }
              }
            }
          }
          
          return formattedItem;
        });
        
        console.log("Formatted kurtosis data:", formattedData.slice(0, 3));
        setProcessedKurtosisData(formattedData);
      } 
      // If kurtosisData is an array of numeric values, convert to objects
      else if (typeof kurtosisData[0] === 'number') {
        console.log("Converting numeric kurtosis array to objects");
        const formattedData = kurtosisData.map((value, index) => ({
          Seconds: index,
          'Flow Packets/s_kurtosis': value
        }));
        setProcessedKurtosisData(formattedData);
      }
      // Handle object with numeric keys
      else if (typeof kurtosisData === 'object' && !Array.isArray(kurtosisData)) {
        console.log("Converting object kurtosis data to array");
        const formattedData = Object.entries(kurtosisData)
          .filter(([key, value]) => !isNaN(Number(key)))
          .map(([key, value]) => {
            if (typeof value === 'object') {
              // Already object format, ensure it has the right properties
              const item = { ...value };
              if (item.Seconds === undefined) {
                item.Seconds = Number(key);
              }
              if (!('Flow Packets/s_kurtosis' in item)) {
                // Look for any numeric property
                for (const [k, v] of Object.entries(item)) {
                  if (typeof v === 'number' && k !== 'Seconds' && k !== 'seconds') {
                    item['Flow Packets/s_kurtosis'] = v;
                    break;
                  }
                }
              }
              return item;
            } else {
              // Simple numeric value
              return {
                Seconds: Number(key),
                'Flow Packets/s_kurtosis': value
              };
            }
          });
        setProcessedKurtosisData(formattedData);
      }
    } else if (flowData && Array.isArray(flowData) && flowData.length > 0) {
      // No kurtosis data, generate it from flow data
      console.log("No valid kurtosis data found. Generating kurtosis data from flow data");
      const kurtData = calculateKurtosis(flowData);
      console.log("Generated kurtosis data:", {
        length: kurtData.length,
        sample: kurtData.slice(0, 3)
      });
      setProcessedKurtosisData(kurtData);
    } else {
      // No data available
      console.log("No flow data or kurtosis data available");
      setProcessedKurtosisData([]);
    }
  }, [kurtosisData, flowData]);

  // Only do this if processedSkewnessData is empty
  useEffect(() => {
    if (processedSkewnessData.length === 0) {
      console.log("Loading initial dummy skewness data");
      const dummyData = generateDummySkewnessData(200);
      setProcessedSkewnessData(dummyData);
    }
  }, [processedSkewnessData.length]);

  useEffect(() => {
    console.log("useEffect for skewness data processing triggered");
    console.log("Current skewnessData:", {
      type: typeof testSkewness,
      isArray: Array.isArray(testSkewness),
      length: Array.isArray(testSkewness) ? testSkewness.length : 0,
      sample: Array.isArray(testSkewness) && testSkewness.length > 0 ? testSkewness.slice(0, 2) : null
    });
    
    if (testSkewness && Array.isArray(testSkewness) && testSkewness.length > 0) {
      console.log("Processing skewness data...");
      
      // Convert testSkewness to the format needed by SkewnessPlot
      const formattedData = testSkewness.map((value, index) => {
        // Find corresponding timestamp
        let seconds = index;
        if (flowData[index] && flowData[index].Seconds !== undefined) {
          seconds = flowData[index].Seconds;
        }
        
        return {
          Seconds: seconds,
          'Flow Packets/s_skewness': value
        };
      });
      
      console.log("Created skewness data from testSkewness:", formattedData.slice(0, 3));
      setProcessedSkewnessData(formattedData);
    } else if (flowData && Array.isArray(flowData) && flowData.length > 0) {
      // If no skewness data, generate dummy data
      console.log("No valid skewness data found. Using dummy data");
      const dummyData = generateDummySkewnessData(200);
      setProcessedSkewnessData(dummyData);
    }
  }, [testSkewness, flowData]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleChunkSizeChange = (e) => {
    setChunkSize(parseInt(e.target.value));
  };

  // Helper function to calculate kurtosis data
  const calculateKurtosis = (data) => {
    if (!Array.isArray(data) || data.length < 100) {
      console.warn("Insufficient data for kurtosis calculation, data length:", data ? data.length : 0);
      return [];
    }
    
    console.log("Starting kurtosis calculation with window size 100");
    const windowSize = 100;
    const kurtosisData = [];
    
    // Find the key for flow packets
    let flowKey = 'Flow Packets/s';
    if (data[0] && !(flowKey in data[0])) {
      // Look for any key containing flow or packets
      flowKey = Object.keys(data[0]).find(key => 
        key.toLowerCase().includes('flow') || key.toLowerCase().includes('packet')
      );
      
      // If still not found, use any numeric key
      if (!flowKey) {
        flowKey = Object.keys(data[0]).find(key => 
          typeof data[0][key] === 'number' && key !== 'Seconds' && key !== 'seconds'
        );
      }
      
      // If still not found, use the first key
      if (!flowKey) {
        flowKey = Object.keys(data[0])[0];
      }
    }
    
    console.log("Using flow key for kurtosis calculation:", flowKey);
    console.log("Sample data point:", data[0]);
    
    // Add placeholder values for first window
    for (let i = 0; i < windowSize; i++) {
      kurtosisData.push({
        Seconds: data[i].Seconds !== undefined ? data[i].Seconds : i,
        'Flow Packets/s_kurtosis': 3.0 // Normal distribution kurtosis
      });
    }
    
    // Track calculation progress
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = windowSize; i < data.length; i++) {
      const window = data.slice(i - windowSize, i);
      const values = window.map(point => {
        const val = point[flowKey];
        return typeof val === 'number' ? val : 0;
      });
      
      try {
        // Calculate mean
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        
        // Calculate variance
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        
        // Calculate std dev
        const stdDev = Math.sqrt(variance);
        
        // Calculate kurtosis
        let kurtosis = 3; // Default for normal distribution
        if (stdDev > 0) {
          kurtosis = values.reduce((sum, val) => {
            const z = (val - mean) / stdDev;
            return sum + Math.pow(z, 4);
          }, 0) / values.length;
        }
        
        kurtosisData.push({
          Seconds: data[i].Seconds !== undefined ? data[i].Seconds : i,
          'Flow Packets/s_kurtosis': kurtosis
        });
        
        successCount++;
      } catch (error) {
        // Fallback for calculation errors
        console.warn("Error calculating kurtosis at index", i, error);
        kurtosisData.push({
          Seconds: data[i].Seconds !== undefined ? data[i].Seconds : i,
          'Flow Packets/s_kurtosis': 3 + Math.random() * 2
        });
        
        errorCount++;
      }
    }
    
    console.log(`Kurtosis calculation complete: ${successCount} successful, ${errorCount} errors`);
    console.log("Sample calculated kurtosis:", kurtosisData.slice(0, 3));
    
    return kurtosisData;
  };

  // Always generate kurtosis data regardless of source
  const handleProcess = async () => {
    if (!file) {
      setError("Please select a file first");
      return;
    }

    setIsProcessing(true);
    setLoading(true);
    setError(null);
    setDataProcessed(false);
    setKurtosisData([]);
    setProcessedKurtosisData([]);
    
    console.log("Starting file processing...");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("chunk_size", chunkSize);

    try {
      console.log("Sending file to backend...");
      const response = await axios.post(
        "http://127.0.0.1:5000/api/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      // Handle Infinity and NaN values in the response
      let parsedData;
      if (typeof response.data === 'string') {
        const sanitizedData = response.data
          .replace(/Infinity/g, '1e308')
          .replace(/NaN/g, '0');
        try {
          parsedData = JSON.parse(sanitizedData);
        } catch (parseError) {
          console.error("Error parsing response data:", parseError);
          throw new Error("Failed to parse server response");
        }
      } else {
        parsedData = response.data;
      }

      // Store the response data
      setResponseData(parsedData);
      
      // Update other state variables
      setFlowData(parsedData.data || []);
      setWarnings(parsedData.warning_indices || []);
      setDf(parsedData.data || []);
      setDfLevel0(parsedData.df_level_0 || []);
      setDfLevel1(parsedData.df_level_1 || []);
      setDfLevel2(parsedData.df_level_2 || []);
      setDfLevel3(parsedData.df_level_3 || []);
      setFirstAttackIndex(parsedData.first_attack_test || 0);
      setDataProcessed(true);
      
      // STEP 1: Always attempt to generate kurtosis data directly, regardless of source
      console.log("ALWAYS generating kurtosis data from flow data");
      let generatedKurtosisData = [];
      
      if (parsedData.data && parsedData.data.length >= 100) {
        generatedKurtosisData = calculateKurtosis(parsedData.data);
        console.log("Generated kurtosis data:", generatedKurtosisData.slice(0, 3));
        
        // Directly set processed data first
        setProcessedKurtosisData(generatedKurtosisData);
      } else {
        console.warn("Cannot generate kurtosis data: insufficient flow data");
      }
      
      // Set the state variables with parsed data
      setCleanedData(parsedData.cleaned_df || []);
      setSelectedColumns(parsedData.selected_columns || []);
      setUploadedCsv(parsedData.uploaded_csv || []);
      setGroupedDf(parsedData.grouped_df || []);
      setTransformedDf(parsedData.transformed_df || []);
      setTestKurtosis(parsedData.test_kurtosis || []);
      setTestSkewness(parsedData.test_skewness || []);
      setKurtosisThresholds(parsedData.kurtosis_thresholds || []);
      setSkewnessThresholds(parsedData.skewness_thresholds || []);
      setDfLevel0(parsedData.df_level_0 || []);
      setDfLevel1(parsedData.df_level_1 || []);
      setDfLevel2(parsedData.df_level_2 || []);
      setDfLevel3(parsedData.df_level_3 || []);
      // STEP 2: Now check if backend provided kurtosis data and use it if available
      let backendKurtosisData = null;
      
      if (parsedData.kurtosis_df && Array.isArray(parsedData.kurtosis_df)) {
        console.log("Using kurtosis_df from backend response", parsedData.kurtosis_df.slice(0, 3));
        backendKurtosisData = parsedData.kurtosis_df;
      } else if (parsedData.kurtosis_data && Array.isArray(parsedData.kurtosis_data)) {
        console.log("Using kurtosis_data from backend response", parsedData.kurtosis_data.slice(0, 3));
        backendKurtosisData = parsedData.kurtosis_data;
      } else if (parsedData.test_kurtosis && Array.isArray(parsedData.test_kurtosis)) {
        console.log("Using test_kurtosis from backend response", parsedData.test_kurtosis.slice(0, 3));
        
        // Convert test_kurtosis to the format needed by KurtosisPlot
        backendKurtosisData = parsedData.test_kurtosis.map((value, index) => {
          // Find corresponding timestamp
          let seconds = index;
          if (parsedData.data[index] && parsedData.data[index].Seconds !== undefined) {
            seconds = parsedData.data[index].Seconds;
          }
          
          return {
            Seconds: seconds,
            'Flow Packets/s_kurtosis': value
          };
        });
        
        console.log("Created kurtosis data from test_kurtosis:", backendKurtosisData.slice(0, 3));
      }
      
      // Set the original kurtosis data from backend if available
      if (backendKurtosisData) {
        setKurtosisData(backendKurtosisData);
        
        // Also update processed data with backend data if available (overriding generated data)
        // This ensures KurtosisPlot gets data in the right format with the right property names
        setProcessedKurtosisData(backendKurtosisData);
      } else {
        // If no backend data, use our generated data
        setKurtosisData(generatedKurtosisData);
      }

      // Process source IP data from response
      if (parsedData.alert_counts) {
        const sourceIps = parsedData.alert_counts.map((row) => ({
          source_ip: row['Source IP'],
          benign: row['BENIGN'] || 0,
          low: row['LOW'] || 0,
          medium: row['MEDIUM'] || 0,
          high: row['HIGH'] || 0
        }));
        setSourceIpData(sourceIps);
      }

      console.log("Data processing completed");
      
    } catch (err) {
      console.error("Error processing file:", err);
      setError("Failed to process file. Please try again.");
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  // Reusable loading spinner component
  const LoadingSpinner = () => (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent"></div>
    </div>
  );

  // Standardized chart wrapper component
  const ChartWrapper = ({ children, title, id }) => (
    <div
      style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "8px",
        boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        marginBottom: "20px",
        width: "100%",
        height: "600px",
        display: "flex",
        flexDirection: "column"
      }}
    >
      <h3 style={{ marginBottom: "15px", flexShrink: 0 }}>{title}</h3>
      <div style={{ 
        width: "100%", 
        height: "calc(100% - 40px)",
        flexGrow: 1,
        position: "relative",
        overflow: "hidden"
      }}>
        {children}
      </div>
    </div>
  );

  const onGridReady = (params) => {
    setGridApi(params.api);
    setGridColumnApi(params.columnApi);
  };

  const columnDefs = [
    // {
    //   field: "alert_level",
    //   headerName: "Alert Level",
    //   sortable: true,
    //   filter: true,
    //   width: 120,
    // },
    {
      field: "source_ip",
      headerName: "Source IP",
      sortable: true,
      filter: true,
      width: 150,
    },
    {
      field: "benign",
      headerName: "BENIGN",
      sortable: true,
      filter: true,
      width: 120,
    },
    {
      field: "low",
      headerName: "LOW",
      sortable: true,
      filter: true,
      width: 120,
    },
    {
      field: "medium",
      headerName: "MEDIUM",
      sortable: true,
      filter: true,
      width: 120,
    },
    {
      field: "high",
      headerName: "HIGH",
      sortable: true,
      filter: true,
      width: 120,
    },
  ];

  const defaultColDef = {
    flex: 1,
    minWidth: 100,
    resizable: true,
    cellStyle: { textAlign: "center" },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background font-sans">
        <div className="text-center text-text">
          <div className="mb-2">Loading data...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center text-red-600">
          Error: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 mb-3">
              Network Traffic Analyzer
            </h1>
            <p className="text-gray-400 text-lg max-w-2xl">
              Upload your network traffic CSV data to visualize patterns and detect potential DDoS attacks.
            </p>
          </div>
          <div className="flex space-x-4">
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 px-5 py-3 bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg text-gray-300 hover:text-white transition-all duration-200 font-medium"
            >
              Back
            </button>
            {dataProcessed && (
              <>
                <button
                  onClick={() => setShowSourceIpModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-300"
                >
                  View Source IPs
                </button>
                <button
                  onClick={() => setShowWorking(!showWorking)}
                  className="px-4 py-2 bg-blue-900 text-white rounded-lg hover:bg-blue-800 transition-colors duration-300"
                >
                  {showWorking ? 'Hide Working' : 'Show Working'}
                </button>
              </>
            )}
          </div>
        </div>
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
                {file && (
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-300">
                    <FiFile className="text-cyan-400" />
                    <span className="truncate max-w-xs">{file.name}</span>
                  </div>
                )}
              </div>
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Chunk Size
                </label>
                <input
                  type="number"
                  value={chunkSize}
                  onChange={handleChunkSizeChange}
                  min="1"
                  max="1000"
                  className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-gray-900 text-gray-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>
              <button
                onClick={handleProcess}
                disabled={!file || isProcessing}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  isProcessing || !file
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-cyan-600 hover:bg-cyan-500 text-white shadow-lg shadow-cyan-600/20'
                }`}
              >
                <FiActivity className="text-lg" />
                {isProcessing ? "Processing..." : "Process Data"}
              </button>
            </div>
          </div>
        </div>
        {showWorking && (
          <Working 
            cleanedData={cleanedData}
            selectedColumns={selectedColumns}
            uploadedCsv={uploadedCsv}
            grouped_df={groupedDf}
            transformed_df={transformedDf}
            test_kurtosis={testKurtosis}
            test_skewness={testSkewness}
            kurtosis_thresholds={kurtosisThresholds}
            skewness_thresholds={skewnessThresholds}
            df={df}
          />
        )}

        {dataProcessed && flowData.length > 0 && !loading && (
          <>
            <div className="flex flex-col gap-8"
            // className="grid grid-cols-1 lg:grid-cols-2 gap-8"
            >
              {/* FlowChartWithWarnings - Self-animated */}
              <ChartWrapper
                title="Flow Chart with Warnings"
                id="flow-chart"
              >
                {loading ? (
                  <LoadingSpinner />
                ) : (
                  <FlowChartWithWarnings
                    data={flowData}
                    warningIndices={warnings}
                  />
                )}
              </ChartWrapper>
              
              {/* Emergency Alert Plot */}
              <ChartWrapper
                title="Emergency Alert Plot"
                id="emergency-alert"
              >
                {loading ? (
                  <LoadingSpinner />
                ) : (
                  <Emergency
                    data={flowData}
                    datasetName="Emergency Alert Plot"
                  />
                )}
              </ChartWrapper>
              
              {/* AnimatedBenignAttackPlot - Self-animated */}
              <ChartWrapper
                title="Benign vs Attack Plot"
                id="benign-attack"
              >
                {loading ? (
                  <LoadingSpinner />
                ) : (
                  <AnimatedBenignAttackPlot
                    csvData={flowData}
                  />
                )}
              </ChartWrapper>

              {/* TestPeakRegionPlot */}
              <ChartWrapper title="Peak Region Analysis" id="peak-region">
                {loading ? (
                  <LoadingSpinner />
                ) : (
                  <TestPeakRegionPlot
                    df={df}
                    firstAttackIndex={firstAttackIndex}
                  />
                )}
              </ChartWrapper>

              {/* Test_T_t */}
              <ChartWrapper title="T(t) Plot" id="t-t-plot">
                {loading ? (
                  <LoadingSpinner />
                ) : (
                  <Test_T_t
                    df={df}
                    name="Processed Data"
                  />
                )}
              </ChartWrapper>

              {/* Test_dT_dt */}
              <ChartWrapper title="dT/dt Plot" id="dt-dt-plot">
                {loading ? (
                  <LoadingSpinner />
                ) : (
                  <Test_dT_dt
                    df={df}
                    name="Processed Data"
                  />
                )}
              </ChartWrapper>

              {/* Test_d2T_dt2 */}
              <ChartWrapper title="d²T/dt² Plot" id="d2t-dt2-plot">
                {loading ? (
                  <LoadingSpinner />
                ) : (
                  <Test_d2T_dt2
                    df={df}
                    name="Processed Data"
                  />
                )}
              </ChartWrapper>
              
              {/* Flow Packets Plot */}
              <ChartWrapper title="Flow Packets/s" id="flow-packets">
                {loading ? (
                  <LoadingSpinner />
                ) : (
                  <div>
                    <FlowPackets
                      df={flowData.length > 0 ? flowData : []}
                      datasetName={"Uploaded Data"}
                    />
                  </div>
                )}
              </ChartWrapper>
              
              {/* Kurtosis Plot */}
              <ChartWrapper title="Kurtosis Plot with EWS" id="kurtosis-plot">
                {loading ? (
                  <LoadingSpinner />
                ) : (
                  <div>
                    {/* Debug info - can be removed in production */}
                    <div className="text-xs text-red-600 mb-2 hidden">
                      ProcessedKurtosisData: {JSON.stringify({
                        length: processedKurtosisData.length,
                        isArray: Array.isArray(processedKurtosisData),
                        sampleItem: processedKurtosisData.length > 0 ? 
                          JSON.stringify(processedKurtosisData[0]).substring(0, 100) + '...' : 'none'
                      })}
                    </div>
                    
                    {/* Always render KurtosisPlot and ensure it gets data */}
                    <KurtosisPlot
                      df={flowData.length > 0 ? flowData : []}
                      kurtosisDf={testKurtosis}
                      datasetName={"Uploaded Data"}
                    />
                    
                    <div className="mt-2 text-xs text-gray-500">
                      {processedKurtosisData.length > 0 && (
                        <p>Using {processedKurtosisData.length} kurtosis data points</p>
                      )}
                    </div>
                  </div>
                )}
              </ChartWrapper>
              
              {/* Skewness Plot */}
              <ChartWrapper title="Skewness Plot with EWS" id="skewness-plot">
                {loading ? (
                  <LoadingSpinner />
                ) : (
                  <div>
                    {/* Debug info - can be removed in production */}
                    <div className="text-xs text-red-600 mb-2 hidden">
                      ProcessedSkewnessData: {JSON.stringify({
                        length: processedSkewnessData.length,
                        isArray: Array.isArray(processedSkewnessData),
                        sampleItem: processedSkewnessData.length > 0 ? 
                          JSON.stringify(processedSkewnessData[0]).substring(0, 100) + '...' : 'none'
                      })}
                    </div>
                    
                    {/* Always render SkewnessPlot and ensure it gets data */}
                    <SkewnessPlot
                      df={flowData.length > 0 ? flowData : []}
                      skewnessDf={testSkewness}
                      datasetName={"Uploaded Data"}
                    />
                    
                    <div className="mt-2 text-xs text-gray-500">
                      {processedSkewnessData.length > 0 && (
                        <p>Using {processedSkewnessData.length} skewness data points</p>
                      )}
                    </div>
                  </div>
                )}
              </ChartWrapper>
              
              {/* Low Level Alerts */}
              <ChartWrapper title="Low Level Early Warnings" id="low-level-alerts">
                {loading ? (
                  <LoadingSpinner />
                ) : (
                  <HighLevelGraph 
                    data={df_level_1} 
                    flowData={flowData}
                    level={1}
                  />
                )}
              </ChartWrapper>
            
              {/* Medium Level Alerts */}
              <ChartWrapper title="Medium Level Early Warnings" id="medium-level-alerts">
                {loading ? (
                  <LoadingSpinner />
                ) : (
                  <HighLevelGraph 
                    data={df_level_2} 
                    flowData={flowData}
                    level={2}
                  />
                )}
              </ChartWrapper>
     
              {/* High Level Alerts */}
              <ChartWrapper title="High Level Early Warnings" id="high-level-alerts">
                {loading ? (
                  <LoadingSpinner />
                ) : (
                  <HighLevelGraph 
                    data={df_level_3} 
                    flowData={flowData}
                    level={3}
                  />
                )}
              </ChartWrapper>
 
            </div>
          
          </>
        )}

        {/* Logs Modal */}
        {showLogsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-surface rounded-lg p-6 w-4/5 h-4/5 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-text">
                  Network Logs
                </h2>
                <button
                  onClick={() => setShowLogsModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="ag-theme-alpine-dark font-sans rounded-lg overflow-hidden flex-1">
                <AgGridReact
                  rowData={df}
                  columnDefs={columnDefs}
                  defaultColDef={defaultColDef}
                  onGridReady={onGridReady}
                  modules={[ClientSideRowModelModule]}
                  pagination={true}
                  paginationPageSize={20}
                />
              </div>
            </div>
          </div>
        )}

        {/* Source IP Modal */}
        {showSourceIpModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-surface rounded-lg p-6 w-4/5 h-4/5 flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-text">
                  Source IP Statistics
                </h2>
                <button
                  onClick={() => setShowSourceIpModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="ag-theme-alpine-dark font-sans rounded-lg overflow-hidden flex-1">
                <AgGridReact
                  rowData={sourceIpData}
                  columnDefs={columnDefs}
                  defaultColDef={defaultColDef}
                  onGridReady={onGridReady}
                  modules={[ClientSideRowModelModule]}
                  pagination={true}
                  paginationPageSize={20}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ExampleChartPage;
