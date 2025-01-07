import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001';

export const axiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`, // Add /api prefix
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('Axios Request:', {
      method: config.method,
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`
    });
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('Axios Response:', {
      status: response.status,
      data: response.data,
      config: {
        url: response.config.url,
        method: response.config.method
      }
    });
    return response;
  },
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Axios Error Response:', {
        data: error.response.data,
        status: error.response.status,
        headers: error.response.headers,
        config: error.response.config
      });
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Axios No Response Error:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Axios Request Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
