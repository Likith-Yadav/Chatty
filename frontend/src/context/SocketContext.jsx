import { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';

export const SocketContext = createContext(null);

export const useSocketContext = () => {
  return useContext(SocketContext);
};

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { authUser } = useAuthStore();

  useEffect(() => {
    if (authUser) {
      const newSocket = io(SOCKET_URL, {
        query: {
          userId: authUser._id
        },
        withCredentials: true
      });

      setSocket(newSocket);

      // Handle connection events
      newSocket.on('connect', () => {
        console.log('Socket connected to:', SOCKET_URL);
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', {
          url: SOCKET_URL,
          error: error
        });
      });

      newSocket.on('getOnlineUsers', (users) => {
        setOnlineUsers(users);
      });

      return () => {
        console.log('Cleaning up socket connection');
        newSocket.close();
      };
    } else {
      if (socket) {
        socket.close();
        setSocket(null);
      }
    }
  }, [authUser]);

  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};
