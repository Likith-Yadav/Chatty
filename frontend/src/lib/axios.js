import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" ? "http://localhost:5001/api" : "/api",
  withCredentials: true,
  timeout: 10000, // 10 seconds timeout
});

// Add a request interceptor for logging
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('Axios Request:', {
      method: config.method,
      url: config.url,
      data: config.data
    });
    return config;
  },
  (error) => {
    console.error('Axios Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for logging
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('Axios Response:', {
      status: response.status,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('Axios Response Error:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    return Promise.reject(error);
  }
);
