import axios from "axios";

const BASE_URL = 
  import.meta.env.MODE === "development" 
    ? "http://localhost:5001/api" 
    : "https://chatty-backend.vercel.app/api";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 10000, // 10 seconds timeout
});

// Add a request interceptor for logging
axiosInstance.interceptors.request.use(
  (config) => {
    console.log(`[Axios Request] ${config.method.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("[Axios Request Error]", error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for logging
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`[Axios Response] ${response.config.method.toUpperCase()} ${response.config.url}`, response.data);
    return response;
  },
  (error) => {
    console.error("[Axios Response Error]", error.response?.data || error.message);
    return Promise.reject(error);
  }
);
