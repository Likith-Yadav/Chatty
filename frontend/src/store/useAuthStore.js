import { create } from "zustand";
import { axiosInstance } from "../lib/axios.js";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

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
      const res = await axiosInstance.get("/auth/check");

      set({ authUser: res.data });
      get().connectSocket();
    } catch (error) {
      console.log("Error in checkAuth:", error);
      set({ authUser: null });
    } finally {
      set({ isCheckingAuth: false });
    }
  },

  signup: async (data) => {
    set({ isSigningUp: true });
    try {
      // Remove /api prefix as it's now handled by axios configuration
      const res = await axiosInstance.post("/auth/signup", data);
      
      // Check for the new response format
      if (res.data.success) {
        const userData = res.data.user;
        
        // Store user info in localStorage for persistent cross-tab state
        localStorage.setItem('userInfo', JSON.stringify(userData));
        
        // Update auth state
        set({ authUser: userData });
        
        // Connect socket after successful signup
        get().connectSocket();
        
        toast.success("Account created successfully");
        
        return userData;
      } else {
        // Fallback for unexpected response format
        toast.error("Signup failed: Unexpected response");
        throw new Error("Signup failed");
      }
    } catch (error) {
      // More detailed error handling
      if (error.response) {
        const errorData = error.response.data;
        
        // Use the new error response format
        if (!errorData.success) {
          const errorMessage = errorData.error || 'Signup failed';
          
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
      if (res.status === 200) {
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
        
        toast.success("Logged in successfully");
        
        return res.data;
      } else {
        // Unexpected successful response
        console.warn('Unexpected login response:', res);
        toast.error('Unexpected login response');
        throw new Error('Unexpected login response');
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
        const errorMessage = error.response.data.details || 
                             error.response.data.message || 
                             'Login failed';
        
        switch (error.response.status) {
          case 400:
            toast.error(errorMessage);
            break;
          case 401:
            toast.error('Unauthorized. Please check your credentials.');
            break;
          case 500:
            // Suppress generic internal server error
            console.warn('Server error details:', error.response.data);
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
    if (!authUser || get().socket?.connected) return;

    const socket = io(BASE_URL, {
      query: {
        userId: authUser._id,
      },
    });
    socket.connect();

    set({ socket: socket });

    socket.on("getOnlineUsers", (userIds) => {
      set({ onlineUsers: userIds });
    });
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
