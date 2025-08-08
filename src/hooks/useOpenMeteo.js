import { useCallback } from 'react';
import axios from 'axios';
import { format, subDays, addDays } from 'date-fns';
import useDashboardStore from '../store/dashboardStore';

export const useOpenMeteo = () => {
  const { 
    cacheWeatherData, 
    getCachedWeatherData,
    getTimeWindow,
    getDataSourceById
  } = useDashboardStore();

  const buildApiUrl = useCallback((lat, lon, dataSourceId) => {
    const dataSource = getDataSourceById(dataSourceId);
    if (!dataSource) {
      throw new Error(`Data source ${dataSourceId} not found`);
    }

    // Get date range (15 days before and after current date)
    const today = new Date();
    const startDate = format(subDays(today, 15), 'yyyy-MM-dd');
    const endDate = format(addDays(today, 15), 'yyyy-MM-dd');

    // Map data source fields to API parameters
    const fieldMapping = {
      'temperature_2m': 'temperature_2m',
      'relativehumidity_2m': 'relativehumidity_2m',
      'precipitation': 'precipitation',
      'windspeed_10m': 'windspeed_10m',
      'pressure_msl': 'pressure_msl'
    };

    const apiField = fieldMapping[dataSource.field] || dataSource.field;
    
    const baseUrl = 'https://archive-api.open-meteo.com/v1/archive';
    const params = new URLSearchParams({
      latitude: lat.toFixed(4),
      longitude: lon.toFixed(4),
      start_date: startDate,
      end_date: endDate,
      hourly: apiField
    });

    return `${baseUrl}?${params.toString()}`;
  }, [getDataSourceById]);

  const fetchWeatherData = useCallback(async (lat, lon, dataSourceId) => {
    try {
      const cacheKey = `${lat.toFixed(4)}_${lon.toFixed(4)}_${dataSourceId}`;
      
      // Check cache first
      const cachedData = getCachedWeatherData(cacheKey);
      if (cachedData) {
        return calculateCurrentValue(cachedData, dataSourceId);
      }

      const url = buildApiUrl(lat, lon, dataSourceId);
      const response = await axios.get(url);
      
      if (!response.data || !response.data.hourly) {
        throw new Error('Invalid API response format');
      }

      // Cache the raw data
      cacheWeatherData(cacheKey, response.data);

      return calculateCurrentValue(response.data, dataSourceId);
    } catch (error) {
      console.error('Error fetching weather data:', error);
      
      // Return mock data if API fails
      return generateMockData(dataSourceId);
    }
  }, [buildApiUrl, cacheWeatherData, getCachedWeatherData]);

  const calculateCurrentValue = useCallback((apiData, dataSourceId) => {
    const dataSource = getDataSourceById(dataSourceId);
    const timeWindow = getTimeWindow();
    
    if (!dataSource || !apiData.hourly || !apiData.hourly.time) {
      return generateMockData(dataSourceId);
    }

    const { time: timestamps, [dataSource.field]: values } = apiData.hourly;
    
    if (!timestamps || !values || timestamps.length === 0 || values.length === 0) {
      return generateMockData(dataSourceId);
    }

    try {
      // Find the values for the current time window
      const relevantValues = [];
      
      for (let i = 0; i < timestamps.length; i++) {
        const timestamp = new Date(timestamps[i]);
        
        if (timestamp >= timeWindow.start && timestamp <= timeWindow.end) {
          const value = values[i];
          if (value !== null && value !== undefined && !isNaN(value)) {
            relevantValues.push(value);
          }
        }
      }

      if (relevantValues.length === 0) {
        return generateMockData(dataSourceId);
      }

      // Calculate average for the time range
      const average = relevantValues.reduce((sum, val) => sum + val, 0) / relevantValues.length;
      
      return Math.round(average * 10) / 10; // Round to 1 decimal place
    } catch (error) {
      console.error('Error calculating value:', error);
      return generateMockData(dataSourceId);
    }
  }, [getDataSourceById, getTimeWindow]);

  const generateMockData = useCallback((dataSourceId) => {
    // Generate realistic mock data based on data source type
    const mockDataRanges = {
      temperature: { min: -10, max: 35 },
      humidity: { min: 30, max: 90 },
      precipitation: { min: 0, max: 20 }
    };

    const range = mockDataRanges[dataSourceId] || { min: 0, max: 100 };
    const value = Math.random() * (range.max - range.min) + range.min;
    
    return Math.round(value * 10) / 10;
  }, []);

  const fetchMultiplePolygons = useCallback(async (polygons) => {
    const promises = polygons.map(async (polygon) => {
      try {
        // Calculate polygon centroid for API call
        const coordinates = polygon.coordinates;
        const avgLat = coordinates.reduce((sum, coord) => sum + coord[0], 0) / coordinates.length;
        const avgLon = coordinates.reduce((sum, coord) => sum + coord[1], 0) / coordinates.length;
        
        const value = await fetchWeatherData(avgLat, avgLon, polygon.dataSource);
        
        return {
          polygonId: polygon.id,
          value,
          error: null
        };
      } catch (error) {
        console.error(`Error fetching data for polygon ${polygon.id}:`, error);
        return {
          polygonId: polygon.id,
          value: generateMockData(polygon.dataSource),
          error: error.message
        };
      }
    });

    return Promise.all(promises);
  }, [fetchWeatherData, generateMockData]);

  const getAvailableFields = useCallback(() => {
    return [
      {
        id: 'temperature_2m',
        name: 'Temperature (2m)',
        unit: '°C',
        description: 'Air temperature at 2 meters above ground'
      },
      {
        id: 'relativehumidity_2m',
        name: 'Relative Humidity (2m)',
        unit: '%',
        description: 'Relative humidity at 2 meters above ground'
      },
      {
        id: 'precipitation',
        name: 'Precipitation',
        unit: 'mm',
        description: 'Total precipitation (rain, showers, snow)'
      },
      {
        id: 'windspeed_10m',
        name: 'Wind Speed (10m)',
        unit: 'km/h',
        description: 'Wind speed at 10 meters above ground'
      },
      {
        id: 'pressure_msl',
        name: 'Sea Level Pressure',
        unit: 'hPa',
        description: 'Atmospheric pressure reduced to mean sea level'
      }
    ];
  }, []);

  return {
    fetchWeatherData,
    fetchMultiplePolygons,
    getAvailableFields,
    generateMockData
  };
};

export default useOpenMeteo;