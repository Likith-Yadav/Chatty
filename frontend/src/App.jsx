import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from "./components/Navbar";

import SignUpPage from "./pages/SignUpPage";
import LoginPage from "./pages/LoginPage";
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import RoomChat from "./components/rooms/RoomChat";
import LandingPage from "./pages/LandingPage"; 
import HomePage from "./pages/HomePage";

import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";

import { Loader } from "lucide-react";
import { Toaster } from "react-hot-toast";

const App = () => {
  const { authUser, checkAuth, isCheckingAuth } = useAuthStore();
  const { theme } = useThemeStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="size-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div data-theme={theme}>
      <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route 
          path="/login" 
          element={authUser ? <Navigate to="/home" replace /> : <LoginPage />} 
        />
        <Route 
          path="/signup" 
          element={authUser ? <Navigate to="/home" replace /> : <SignUpPage />} 
        />
        <Route 
          path="/home" 
          element={authUser ? <HomePage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/rooms/:roomId" 
          element={authUser ? <RoomChat /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/settings" 
          element={authUser ? <SettingsPage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/profile" 
          element={authUser ? <ProfilePage /> : <Navigate to="/login" replace />} 
        />
        <Route 
          path="/chat" 
          element={authUser ? <Navigate to="/rooms/default" replace /> : <Navigate to="/login" replace />} 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </div>
  );
};

export default App;
