import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useLocation, useNavigate } from 'react-router-dom';
import { axiosInstance } from '../lib/axios';

export const AuthContext = createContext(null);

export const AuthContextProvider = ({ children }) => {
  const { authUser } = useAuthStore();
  const [selectedUser, setSelectedUser] = useState(null);
  const [userChats, setUserChats] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

  // You can add more authentication-related state and methods here
  const getUserChats = async () => {
    try {
      const response = await axiosInstance.get('/users/chats');
      setUserChats(response.data);
    } catch (error) {
      console.error('Error fetching user chats:', error.response ? error.response.data : error.message);
    }
  };

  useEffect(() => {
    if (authUser) {
      getUserChats();
      
      // Redirect logic
      const publicRoutes = ['/login', '/signup'];
      if (publicRoutes.includes(location.pathname)) {
        navigate('/home');
      }
    } else {
      // Redirect to login if not authenticated and trying to access protected routes
      const protectedRoutes = ['/home', '/profile', '/settings', '/rooms'];
      if (protectedRoutes.some(route => location.pathname.startsWith(route))) {
        navigate('/login');
      }
    }
  }, [authUser, location.pathname, navigate]);

  const contextValue = {
    selectedUser,
    setSelectedUser,
    userChats,
    setUserChats
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthContextProvider');
  }
  return context;
};
