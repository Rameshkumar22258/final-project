import axios from 'axios';
import { getSampleDisasters } from '../data/sampleDisasters';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add data mode to request
    const dataMode = localStorage.getItem('dataMode') || 'live';
    config.headers['X-Data-Mode'] = dataMode;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Track if backend connection error was already logged
let backendErrorLogged = false;
let lastErrorTime = 0;
const ERROR_LOG_INTERVAL = 10000; // Only log same error every 10 seconds

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Reset error flag on successful response
    backendErrorLogged = false;
    return response;
  },
  (error) => {
    const now = Date.now();
    const isNetworkError = !error.response && error.request;
    const isConnectionRefused = error.code === 'ERR_NETWORK' || error.message?.includes('ERR_CONNECTION_REFUSED');
    
    if (error.response) {
      // Server responded with error (not a network issue)
      console.error('API Error:', error.response.data);
      backendErrorLogged = false; // Reset on server response
    } else if (isNetworkError && isConnectionRefused) {
      // Backend not running - only log once per interval
      if (!backendErrorLogged || (now - lastErrorTime) > ERROR_LOG_INTERVAL) {
        console.warn('⚠️ Backend server not running. Please start the backend server on port 5000.');
        backendErrorLogged = true;
        lastErrorTime = now;
      }
      // Suppress detailed error object logging for connection refused
    } else if (error.request) {
      // Other network errors - log less frequently
      if ((now - lastErrorTime) > ERROR_LOG_INTERVAL) {
        console.error('Network Error: Unable to connect to server');
        lastErrorTime = now;
      }
    } else {
      // Other errors
      console.error('Error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Helper to check data mode and return sample data if needed
const getDataMode = () => {
  return localStorage.getItem('dataMode') || 'live';
};

// API Methods
export const disasterAPI = {
  // Predictions
  predict: (data) => api.post('/predict', data),
  getPredictionHistory: (limit = 50) => api.get(`/predictions/history?limit=${limit}`),

  // Disasters (New Live API) - with sample data support
  getLatestDisaster: async () => {
    if (getDataMode() === 'sample') {
      const sample = getSampleDisasters();
      return { data: { success: true, data: sample[0] } };
    }
    return api.get('/disasters/latest');
  },
  getActiveDisasters: async () => {
    if (getDataMode() === 'sample') {
      const sample = getSampleDisasters();
      return { data: { success: true, count: sample.length, data: sample } };
    }
    return api.get('/disasters/active');
  },
  getDisasterStats: async () => {
    if (getDataMode() === 'sample') {
      const sample = getSampleDisasters();
      const stats = {
        total_active: sample.length,
        by_type: {},
        by_severity: {},
        by_state: {},
        total_affected: 0,
        total_casualties: 0
      };
      sample.forEach(d => {
        stats.by_type[d.disaster_type] = (stats.by_type[d.disaster_type] || 0) + 1;
        stats.by_severity[d.severity] = (stats.by_severity[d.severity] || 0) + 1;
        stats.by_state[d.location.state] = (stats.by_state[d.location.state] || 0) + 1;
        stats.total_affected += d.displaced || 0;
        stats.total_casualties += d.casualties || 0;
      });
      return { data: { success: true, data: stats } };
    }
    return api.get('/disasters/stats');
  },
  getDisastersByType: (type) => {
    if (getDataMode() === 'sample') {
      const sample = getSampleDisasters().filter(d => d.disaster_type === type);
      return Promise.resolve({ data: { success: true, type, count: sample.length, data: sample } });
    }
    return api.get(`/disasters/type/${type}`);
  },
  getDisastersBySeverity: (severity) => {
    if (getDataMode() === 'sample') {
      const sample = getSampleDisasters().filter(d => d.severity === severity);
      return Promise.resolve({ data: { success: true, severity, count: sample.length, data: sample } });
    }
    return api.get(`/disasters/severity/${severity}`);
  },
  getDisastersByState: (state) => {
    if (getDataMode() === 'sample') {
      const sample = getSampleDisasters().filter(d => d.location.state.toLowerCase().includes(state.toLowerCase()));
      return Promise.resolve({ data: { success: true, state, count: sample.length, data: sample } });
    }
    return api.get(`/disasters/state/${state}`);
  },
  
  // Old disaster endpoints (for compatibility)
  getDisasters: (params = {}) => api.get('/disasters', { params }),
  getDisaster: (id) => api.get(`/disasters/${id}`),
  createDisaster: (data) => api.post('/disasters/create', data),
  updateDisaster: (id, data) => api.put(`/disasters/${id}/update`, data),
  
  // Relief Prediction
  predictRelief: (data) => api.post('/relief/predict', data),
  getReliefPrediction: (disasterId) => api.get(`/relief/predict/${disasterId}`),

  // Tweets
  getTweets: (params = {}) => api.get('/tweets', { params }),
  analyzeTweet: (content) => api.post('/tweets/analyze', { content }),

  // Analytics
  getSummary: () => api.get('/analytics/summary'),

  // Health
  health: () => api.get('/health')
};

export default api;



