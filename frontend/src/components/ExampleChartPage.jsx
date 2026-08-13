import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AnimatedChart from './AnimatedChart';

const ExampleChartPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);
  
  const baseUrl = 'http://127.0.0.1:5000';

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        console.log("Loading data...");
        
        // First try to get data from the test API
        try {
          console.log("Trying to fetch from API...");
          const response = await axios.get(`${baseUrl}/api/test-visualizations`);
          console.log("API response:", response.data);
          
          if (response.data && response.data.sample_rows && response.data.sample_rows.length > 0) {
            console.log("Using data from API");
            setData(response.data.sample_rows);
            setError(null);
            return;
          } else {
            console.warn("API returned empty data");
          }
        } catch (apiError) {
          console.warn("Couldn't load data from API", apiError);
        }
        
        // If API fails, generate synthetic data
        console.log("Generating synthetic data");
        const syntheticData = generateSyntheticData();
        setData(syntheticData);
        
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load visualization data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Generate synthetic data if API fails
  const generateSyntheticData = () => {
    const result = [];
    // Generate benign points
    for (let i = 0; i < 80; i++) {
      result.push({
        Seconds: i,
        'Flow Packets/s': Math.random() * 100 + 50,
        Label: 'BENIGN',
        emergency_alert: 0
      });
    }
    
    // Add attack points
    for (let i = 80; i < 100; i++) {
      result.push({
        Seconds: i,
        'Flow Packets/s': Math.random() * 200 + 150,
        Label: 'ATTACK',
        emergency_alert: i > 85 ? 1 : 0
      });
    }
    
    console.log("Generated", result.length, "synthetic data points");
    return result;
  };

  if (isLoading) {
    return (
      <div className="p-4">
        <div className="h-96 flex items-center justify-center">
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mb-4"></div>
            <p>Loading data...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="h-96 flex items-center justify-center">
          <div className="text-center text-red-500 p-8 border-2 border-dashed border-red-300 rounded">
            <p className="mb-4">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Reload
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4">
      <AnimatedChart 
        data={data}
        title="Example Chart"
        showEmergencyAlerts={true}
        showAttackPoints={true}
      />
    </div>
  );
};

export default ExampleChartPage; 