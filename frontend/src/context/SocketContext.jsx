import { createContext, useState, useEffect, useContext } from 'react';
import io from 'socket.io-client';
import { useAuthStore } from '../store/useAuthStore';

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
      const newSocket = io('http://localhost:5001', {
        query: {
          userId: authUser._id
        },
        withCredentials: true
      });

      setSocket(newSocket);

      // Handle connection events
      newSocket.on('connect', () => {
        console.log('Socket connected');
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
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
