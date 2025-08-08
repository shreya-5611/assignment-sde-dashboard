import axios from 'axios';

// Create axios instance with default config
const apiClient = axios.create({
  timeout: 10000, // 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error('API Response Error:', error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export const buildOpenMeteoUrl = (lat, lon, params = {}) => {
  const baseUrl = 'https://archive-api.open-meteo.com/v1/archive';
  const defaultParams = {
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    hourly: 'temperature_2m',
    timezone: 'auto'
  };
  
  const queryParams = new URLSearchParams({
    ...defaultParams,
    ...params
  });
  
  return `${baseUrl}?${queryParams.toString()}`;
};

export const fetchOpenMeteoData = async (lat, lon, options = {}) => {
  const {
    startDate,
    endDate,
    parameters = ['temperature_2m'],
    timezone = 'auto'
  } = options;
  
  const params = {
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    hourly: parameters.join(','),
    timezone
  };
  
  if (startDate) params.start_date = startDate;
  if (endDate) params.end_date = endDate;
  
  const url = buildOpenMeteoUrl(lat, lon, params);
  
  try {
    const response = await apiClient.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching OpenMeteo data:', error);
    throw new Error(`Failed to fetch weather data: ${error.message}`);
  }
};

export const batchFetchWeatherData = async (locations, options = {}) => {
  const { maxConcurrent = 5 } = options;
  
  // Split locations into batches to avoid overwhelming the API
  const batches = [];
  for (let i = 0; i < locations.length; i += maxConcurrent) {
    batches.push(locations.slice(i, i + maxConcurrent));
  }
  
  const results = [];
  
  for (const batch of batches) {
    const promises = batch.map(async (location) => {
      try {
        const data = await fetchOpenMeteoData(location.lat, location.lon, options);
        return {
          location,
          data,
          error: null
        };
      } catch (error) {
        return {
          location,
          data: null,
          error: error.message
        };
      }
    });
    
    const batchResults = await Promise.all(promises);
    results.push(...batchResults);
    
    // Add small delay between batches to be respectful to the API
    if (batches.length > 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
};

export const validateApiResponse = (response) => {
  const errors = [];
  
  if (!response) {
    errors.push('Empty response');
    return errors;
  }
  
  if (!response.hourly) {
    errors.push('Missing hourly data');
  } else {
    if (!response.hourly.time || !Array.isArray(response.hourly.time)) {
      errors.push('Invalid time data');
    }
    
    if (response.hourly.time && response.hourly.time.length === 0) {
      errors.push('Empty time data');
    }
  }
  
  return errors;
};

export const extractTimeSeriesData = (response, parameter) => {
  if (!response?.hourly?.time || !response.hourly[parameter]) {
    return [];
  }
  
  const { time, [parameter]: values } = response.hourly;
  
  return time.map((timestamp, index) => ({
    time: new Date(timestamp),
    value: values[index],
    timestamp
  }));
};

export const filterDataByTimeRange = (data, startTime, endTime) => {
  return data.filter(item => {
    const itemTime = new Date(item.time);
    return itemTime >= startTime && itemTime <= endTime;
  });
};

export const calculateAverageValue = (data, parameter) => {
  const validValues = data
    .map(item => item.value)
    .filter(value => value !== null && value !== undefined && !isNaN(value));
  
  if (validValues.length === 0) return null;
  
  const sum = validValues.reduce((acc, value) => acc + value, 0);
  return sum / validValues.length;
};

export const findValueAtTime = (data, targetTime, tolerance = 3600000) => { // 1 hour tolerance
  const target = new Date(targetTime);
  
  let closest = null;
  let minDiff = Infinity;
  
  for (const item of data) {
    const itemTime = new Date(item.time);
    const diff = Math.abs(target - itemTime);
    
    if (diff < minDiff && diff <= tolerance) {
      minDiff = diff;
      closest = item;
    }
  }
  
  return closest;
};

export const interpolateValue = (data, targetTime) => {
  const target = new Date(targetTime).getTime();
  
  // Sort data by time
  const sortedData = data
    .filter(item => item.value !== null && item.value !== undefined)
    .sort((a, b) => new Date(a.time) - new Date(b.time));
  
  if (sortedData.length === 0) return null;
  if (sortedData.length === 1) return sortedData[0].value;
  
  // Find surrounding points
  let before = null;
  let after = null;
  
  for (let i = 0; i < sortedData.length; i++) {
    const itemTime = new Date(sortedData[i].time).getTime();
    
    if (itemTime <= target) {
      before = sortedData[i];
    }
    if (itemTime >= target && !after) {
      after = sortedData[i];
      break;
    }
  }
  
  if (!before) return after?.value || null;
  if (!after) return before?.value || null;
  
  // Linear interpolation
  const beforeTime = new Date(before.time).getTime();
  const afterTime = new Date(after.time).getTime();
  
  if (beforeTime === afterTime) return before.value;
  
  const ratio = (target - beforeTime) / (afterTime - beforeTime);
  return before.value + (after.value - before.value) * ratio;
};

export const createCacheKey = (lat, lon, parameters, startDate, endDate) => {
  const params = Array.isArray(parameters) ? parameters.sort().join(',') : parameters;
  return `${lat.toFixed(4)}_${lon.toFixed(4)}_${params}_${startDate}_${endDate}`;
};

export const isDataStale = (timestamp, maxAgeMs = 3600000) => { // 1 hour default
  return Date.now() - timestamp > maxAgeMs;
};

export const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt === maxRetries) {
        break;
      }
      
      // Exponential backoff
      const delay = baseDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};

export const handleApiError = (error) => {
  if (error.code === 'ECONNABORTED') {
    return 'Request timeout - please try again';
  }
  
  if (error.response) {
    const { status, data } = error.response;
    
    switch (status) {
      case 400:
        return 'Invalid request parameters';
      case 401:
        return 'Unauthorized access';
      case 403:
        return 'Access forbidden';
      case 404:
        return 'API endpoint not found';
      case 429:
        return 'Rate limit exceeded - please wait before retrying';
      case 500:
        return 'Server error - please try again later';
      case 503:
        return 'Service temporarily unavailable';
      default:
        return data?.message || `API error (${status})`;
    }
  }
  
  if (error.request) {
    return 'Network error - please check your connection';
  }
  
  return error.message || 'Unknown error occurred';
};

export default {
  apiClient,
  buildOpenMeteoUrl,
  fetchOpenMeteoData,
  batchFetchWeatherData,
  validateApiResponse,
  extractTimeSeriesData,
  filterDataByTimeRange,
  calculateAverageValue,
  findValueAtTime,
  interpolateValue,
  createCacheKey,
  isDataStale,
  retryWithBackoff,
  handleApiError
};