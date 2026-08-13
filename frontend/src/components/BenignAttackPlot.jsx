import React, { useState, useEffect } from 'react';
import axios from 'axios';

const BenignAttackPlot = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [imageUrl, setImageUrl] = useState(null);
  
  // Use the backend API endpoint to get the image
  const baseUrl = 'http://127.0.0.1:5000';
  const imagePath = '/api/images/test_benign_attack.png';
  
  useEffect(() => {
    loadImage();
  }, []);
  
  const loadImage = async () => {
    try {
      setIsLoading(true);
      // First try to validate the image exists
      await axios.head(`${baseUrl}${imagePath}`);
      setImageUrl(`${baseUrl}${imagePath}`);
      setImageError(false);
    } catch (error) {
      console.error('Error checking image:', error);
      
      // Try alternative image locations
      const foundAlternative = await tryAlternativeImages();
      
      // If no alternatives found, generate the image
      if (!foundAlternative) {
        await generateImage();
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const tryAlternativeImages = async () => {
    const alternatives = [
      '/api/images/test_benign_attack.png',
      '/api/images/benign_attack.png',
      '/api/images/test_viz/benign_attack.png',
      '/api/images/cleaned_output/test_benign_attack.png'
    ];
    
    for (const path of alternatives) {
      try {
        await axios.head(`${baseUrl}${path}`);
        setImageUrl(`${baseUrl}${path}`);
        setImageError(false);
        return true; // Exit if we found a working image
      } catch (error) {
        console.warn(`Alternative image not found: ${path}`);
      }
    }
    return false; // No alternatives found
  };
  
  const generateImage = async () => {
    try {
      console.log('Generating benign-attack image...');
      const response = await axios.get(`${baseUrl}/api/generate-benign-attack-image`);
      
      if (response.data && response.data.image_path) {
        // Set a short delay to ensure the image is fully written to disk
        setTimeout(() => {
          setImageUrl(`${baseUrl}${response.data.image_path}?t=${new Date().getTime()}`);
          setImageError(false);
        }, 1000);
      } else {
        setImageError(true);
      }
    } catch (error) {
      console.error('Error generating image:', error);
      setImageError(true);
    }
  };

  // Refresh image with a timestamp to avoid cache issues
  const refreshImage = () => {
    loadImage();
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        {/* <h2 className="text-2xl font-bold text-blue-900">Benign vs Attack Traffic</h2> */}
        <button 
          onClick={refreshImage}
          disabled={isLoading}
          className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors duration-300"
        >
          Refresh
        </button>
      </div>
      
      <div className="w-full min-h-[400px] flex items-center justify-center">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mb-4"></div>
            <p>Loading image...</p>
          </div>
        ) : imageError ? (
          <div className="text-center text-red-500 p-8 border-2 border-dashed border-red-300 rounded">
            <p className="mb-4">Failed to load image from backend</p>
            <button 
              onClick={refreshImage}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Try Again
            </button>
          </div>
        ) : (
          <img 
            src={imageUrl} 
            alt="Benign vs Attack Traffic" 
            className="w-full h-auto"
            onError={(e) => {
              console.error('Failed to load image from backend');
              setImageError(true);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default BenignAttackPlot; 