import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://chatty-backend-7qth.onrender.com';

export const axiosInstance = axios.create({
  baseURL: `${BASE_URL}/api`, 
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Expires': '0'
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
      console.error('Axios Error Response:', {
        data: error.response.data,
        status: error.response.status,
        headers: error.response.headers,
        config: error.response.config
      });
    } else if (error.request) {
      console.error('Axios No Response Error:', error.request);
    } else {
      console.error('Axios Request Setup Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
