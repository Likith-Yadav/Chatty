import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from "./components/Navbar";

import Login from "./pages/LoginPage";
import Signup from "./pages/SignUpPage";
import Home from "./pages/HomePage";
import NotFound from "./pages/notfound/NotFound";
import RoomChat from "./components/rooms/RoomChat";
import LandingPage from "./pages/LandingPage"; 
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";

import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        await checkAuth();
      } catch (error) {
        console.error('Authentication check failed:', error);
      }
    };

    checkAuthentication();
  }, []);

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Router>
      <div data-theme={theme} className="p-4 h-screen flex flex-col">
        <Navbar />
        <Routes>
          <Route 
            path="/" 
            element={authUser ? <Navigate to="/home" /> : <LandingPage />} 
          />
          <Route 
            path="/login" 
            element={authUser ? <Navigate to="/home" /> : <Login />} 
          />
          <Route 
            path="/signup" 
            element={authUser ? <Navigate to="/home" /> : <Signup />} 
          />
          <Route 
            path="/home" 
            element={authUser ? <Home /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/rooms/:roomId" 
            element={authUser ? <RoomChat /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/settings" 
            element={authUser ? <SettingsPage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/profile" 
            element={authUser ? <ProfilePage /> : <Navigate to="/login" />} 
          />
          <Route 
            path="/chat" 
            element={authUser ? <Navigate to="/rooms/default" replace /> : <Navigate to="/login" replace />} 
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </div>
    </Router>
  );
};

export default App;
