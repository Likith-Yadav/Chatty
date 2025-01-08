import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'https://chatty-backend-7v7t.onrender.com';

const BASE_URL = import.meta.env.MODE === "development" ? "http://localhost:5001" : "/";

export const useAuthStore = create((set, get) => ({
  authUser: null,
  isSigningUp: false,
  isLoggingIn: false,
  isUpdatingProfile: false,
  isCheckingAuth: true,
  onlineUsers: [],
  socket: null,

  checkAuth: async () => {
    try {
      // Add a small delay to simulate network conditions
      await new Promise(resolve => setTimeout(resolve, 500));

      const res = await axiosInstance.get("/auth/check", {
        timeout: 5000, // 5 seconds timeout
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      if (res.data && res.data._id) {
        set({ 
          authUser: res.data,
          isCheckingAuth: false 
        });
        get().connectSocket();
        return res.data;
      } else {
        // If no user data, treat as unauthenticated
        set({ 
          authUser: null,
          isCheckingAuth: false 
        });
        return null;
      }
    } catch (error) {
      console.error("Authentication check failed:", {
        error: error.response ? error.response.data : error.message,
        status: error.response ? error.response.status : 'N/A'
      });

      // Detailed error handling
      if (error.response) {
        // Server responded with an error status
        switch (error.response.status) {
          case 401:
            toast.error('Session expired. Please log in again.');
            break;
          case 403:
            toast.error('Access denied. Please log in.');
            break;
          case 404:
            toast.error('Authentication endpoint not found.');
            break;
          case 500:
            toast.error('Server error. Please try again later.');
            break;
          default:
            toast.error('Authentication failed. Please try again.');
        }
      } else if (error.request) {
        // Request made but no response received
        toast.error('No response from server. Check your network connection.');
      } else {
        // Something happened in setting up the request
        toast.error('Error setting up authentication request.');
      }

      // Always set authUser to null and stop checking
      set({ 
        authUser: null,
        isCheckingAuth: false 
      });

      return null;
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      // Remove /api prefix as it's now handled by axios configuration
      const res = await axiosInstance.post("/auth/signup", data);
      
      // Comprehensive check for successful signup
      if (res.data && res.data.success) {
        const userData = res.data.user;
        
        // Store user info in localStorage for persistent cross-tab state
        localStorage.setItem('userInfo', JSON.stringify(userData));
        
        // Update auth state
        set({ authUser: userData });
        
        // Connect socket after successful signup
        get().connectSocket();
        
        // Show success toast with user's name
        toast.success(`Welcome, ${userData.fullName}! Account created successfully`);
        
        return userData;
      } else {
        // Handle unexpected response format
        const errorMessage = res.data?.error || res.data?.message || "Signup failed: Unexpected response";
        toast.error(errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error) {
      // More detailed error handling
      if (error.response) {
        const errorData = error.response.data;
        
        // Use the new error response format
        if (!errorData.success) {
          const errorMessage = errorData.error || errorData.message || 'Signup failed';
          
          // Provide more specific error messages
          switch (errorMessage) {
            case "All fields are required":
              toast.error("Please fill in all fields");
              break;
            case "Invalid email format":
              toast.error("Please enter a valid email address");
              break;
            case "Password must be at least 8 characters long":
              toast.error("Password must be at least 8 characters long");
              break;
            case "Email already exists":
              toast.error("An account with this email already exists");
              break;
            default:
              toast.error(errorMessage);
          }
          
          // Log detailed error for debugging
          console.error('Signup Error Details:', {
            error: errorMessage,
            details: errorData.details
          });
        }
      } else if (error.request) {
        // No response received
        toast.error("No response from server. Check your network connection.");
      } else {
        // Error setting up the request
        toast.error("Error preparing signup request");
      }
      
      throw error;
    } finally {
      set({ isSigningUp: false });
    }
  },

  login: async (credentials) => {
    // Validate input
    if (!credentials || typeof credentials !== 'object') {
      toast.error('Invalid login credentials');
      throw new Error('Invalid login credentials');
    }

    const { email, password } = credentials;
    
    // Validate email and password
    if (!email || !password) {
      toast.error('Email and password are required');
      throw new Error('Email and password are required');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Invalid email format');
      throw new Error('Invalid email format');
    }

    try {
      // Set loading state
      set({ isLoggingIn: true });

      // Attempt login with validated credentials
      const res = await axiosInstance.post("/auth/login", { 
        email: email.trim().toLowerCase(), 
        password 
      }, {
        // Add timeout and error handling
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // Successful login handling
      if (res.data && res.data.success) {
        // Store user info in localStorage for persistent cross-tab state
        localStorage.setItem('userInfo', JSON.stringify(res.data));
        
        // Broadcast login event to other tabs
        window.dispatchEvent(new Event('login'));
        
        // Update auth state
        set({ 
          authUser: res.data,
          isLoggingIn: false 
        });
        
        // Connect socket after successful login
        get().connectSocket();
        
        toast.success(`Welcome back, ${res.data.fullName}!`);
        
        return res.data;
      } else {
        // Unexpected successful response
        console.warn('Unexpected login response:', res);
        toast.error(res.data.error || 'Unexpected login response');
        throw new Error(res.data.error || 'Unexpected login response');
      }
    } catch (error) {
      // Reset loading state
      set({ isLoggingIn: false });

      // Detailed error handling
      console.error('Login error:', {
        response: error.response,
        request: error.request,
        message: error.message,
        status: error.response?.status
      });

      // More specific error messages
      if (error.response) {
        // The request was made and the server responded with a status code
        const errorData = error.response.data;
        const errorMessage = errorData.error || errorData.message || 'Login failed';
        
        switch (error.response.status) {
          case 400:
            toast.error(errorMessage);
            break;
          case 401:
            toast.error('Unauthorized. Please check your credentials.');
            break;
          case 500:
            // Suppress generic internal server error
            console.warn('Server error details:', errorData);
            toast.error('Server error. Please try again later.');
            break;
          default:
            toast.error(errorMessage);
        }
      } else if (error.request) {
        // The request was made but no response was received
        toast.error('No response from server. Check your network connection.');
      } else {
        // Something happened in setting up the request
        toast.error('Error preparing login request');
      }

      throw error;
    }
  },

  logout: async () => {
    try {
      await axiosInstance.post("/auth/logout");
      
      // Clear localStorage
      localStorage.removeItem('userInfo');
      
      // Broadcast logout event to other tabs
      window.dispatchEvent(new Event('logout'));
      
      set({ authUser: null });
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Logout failed');
    }
  },

  updateProfile: async (data) => {
    set({ isUpdatingProfile: true });
    try {
      console.log('Sending profile update request with data:', data);
      const res = await axiosInstance.put("/auth/update-profile", data);
      console.log('Profile update response:', res);
      set({ authUser: res.data });
      toast.success("Profile updated successfully");
      return res.data;
    } catch (error) {
      console.error("Detailed error in update profile:", {
        errorResponse: error.response,
        errorMessage: error.message,
        errorConfig: error.config
      });
      
      // More specific error handling
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        toast.error(error.response.data.message || "Failed to update profile");
      } else if (error.request) {
        // The request was made but no response was received
        toast.error("No response received from server");
      } else {
        // Something happened in setting up the request that triggered an Error
        toast.error("Error setting up profile update request");
      }
      
      throw error;
    } finally {
      set({ isUpdatingProfile: false });
    }
  },

  connectSocket: () => {
    const { authUser } = get();
    if (!authUser) return;

    const socket = io(SOCKET_URL, {
      query: {
        userId: authUser._id,
      },
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socket.on("connect", () => {
      console.log('Socket connected successfully');
      set({ socket });
    });

    socket.on("disconnect", () => {
      console.log('Socket disconnected');
      set({ socket: null });
    });

    socket.on("connect_error", (error) => {
      console.error('Socket connection error:', error);
      toast.error('Failed to connect to real-time services');
    });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });

    return socket;
  },

  disconnectSocket: () => {
    if (get().socket?.connected) get().socket.disconnect();
  },

  initializeAuth: () => {
    // Check localStorage on initial load
    const storedUserInfo = localStorage.getItem('userInfo');
    if (storedUserInfo) {
      set({ authUser: JSON.parse(storedUserInfo) });
    }

    // Listen for login/logout events from other tabs
    const handleStorageChange = () => {
      const currentUserInfo = localStorage.getItem('userInfo');
      if (currentUserInfo) {
        set({ authUser: JSON.parse(currentUserInfo) });
      } else {
        set({ authUser: null });
      }
    };

    window.addEventListener('login', handleStorageChange);
    window.addEventListener('logout', handleStorageChange);
    window.addEventListener('storage', handleStorageChange);

    // Cleanup listener
    return () => {
      window.removeEventListener('login', handleStorageChange);
      window.removeEventListener('logout', handleStorageChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  },
}));
