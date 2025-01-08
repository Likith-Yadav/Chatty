import { createContext, useState, useEffect, useContext } from 'react';
import { useAuthStore } from '../store/useAuthStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

export const SocketContext = createContext(null);

export const useSocketContext = () => {
  const context = useContext(SocketContext);
  const { socket, onlineUsers } = useAuthStore();
  
  return { socket, onlineUsers };
};

export const SocketContextProvider = ({ children }) => {
  const { authUser, connectSocket, disconnectSocket } = useAuthStore();

  useEffect(() => {
    if (authUser) {
      const socket = connectSocket();
      
      return () => {
        if (socket) {
          disconnectSocket();
        }
      };
    }
  }, [authUser, connectSocket, disconnectSocket]);

  return (
    <SocketContext.Provider value={null}>
      {children}
    </SocketContext.Provider>
  );
};
