import { useState, useEffect } from 'react';
import axios from 'axios';

/**
 * Safe API call hook that provides fallback data when API fails
 * @param {string} url - API endpoint
 * @param {Object} fallbackData - Data to use when API fails
 * @param {number} timeout - Timeout in milliseconds
 */
const useSafeApiCall = (url, fallbackData, timeout = 5000) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [usingFallback, setUsingFallback] = useState(false);

  useEffect(() => {
    const source = axios.CancelToken.source();
    
    // Set timeout to abort if it takes too long
    const timeoutId = setTimeout(() => {
      source.cancel('Request timeout');
      console.warn(`API call to ${url} timed out, using fallback data`);
      setData(fallbackData);
      setLoading(false);
      setUsingFallback(true);
    }, timeout);
    
    const fetchData = async () => {
      try {
        // Check for emergency mode first
        const token = localStorage.getItem('jwtToken');
        const isEmergencyMode = token && (
          token.startsWith('emergency-') || 
          token === 'emergency-token-123' || 
          localStorage.getItem('emergency_login_time')
        );
        
        // If in emergency mode, use fallback directly
        if (isEmergencyMode) {
          console.log(`Using emergency fallback data for ${url}`);
          setData(fallbackData);
          setUsingFallback(true);
          setLoading(false);
          clearTimeout(timeoutId);
          return;
        }
        
        // Normal API call
        const response = await axios.get(url, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          cancelToken: source.token
        });
        
        clearTimeout(timeoutId);
        setData(response.data);
        setLoading(false);
      } catch (error) {
        clearTimeout(timeoutId);
        console.error(`Error fetching data from ${url}:`, error);
        setError(error);
        setData(fallbackData);
        setUsingFallback(true);
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      source.cancel('Component unmounted');
      clearTimeout(timeoutId);
    };
  }, [url, fallbackData, timeout]);

  return { data, loading, error, usingFallback };
};

export default useSafeApiCall;