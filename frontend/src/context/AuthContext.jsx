import { createContext, useState, useContext, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';

export const AuthContext = createContext(null);

export const useAuthContext = () => {
  return useContext(AuthContext);
};

export const AuthContextProvider = ({ children }) => {
  const { authUser } = useAuthStore();
  const [selectedUser, setSelectedUser] = useState(null);
  const [userChats, setUserChats] = useState([]);

  // You can add more authentication-related state and methods here
  const getUserChats = async () => {
    try {
      const response = await fetch('/api/users/chats', {
        credentials: 'include'
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setUserChats(data);
    } catch (error) {
      console.error('Error fetching user chats:', error);
    }
  };

  useEffect(() => {
    if (authUser) {
      getUserChats();
    }
  }, [authUser]);

  return (
    <AuthContext.Provider value={{ 
      selectedUser, 
      setSelectedUser, 
      userChats, 
      setUserChats,
      authUser 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
