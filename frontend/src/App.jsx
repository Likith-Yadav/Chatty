import React, { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuthStore } from "./store/useAuthStore";
import { useThemeStore } from "./store/useThemeStore";
import { lazy, Suspense } from 'react';
import Navbar from "./components/Navbar";
import LandingPage from "./pages/LandingPage"; 
import SettingsPage from "./pages/SettingsPage";
import ProfilePage from "./pages/ProfilePage";
import RoomChat from "./components/rooms/RoomChat";
import { Loader } from "lucide-react";

// Lazy-loaded components
const Login = lazy(() => import("./pages/LoginPage"));
const Signup = lazy(() => import("./pages/SignUpPage"));
const Home = lazy(() => import("./pages/HomePage"));
const NotFound = lazy(() => import("./pages/notfound/NotFound"));

function App() {
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
    <div data-theme={theme} className="p-4 h-screen flex flex-col">
      <Navbar />
      <Suspense fallback={<div>Loading...</div>}>
        <Routes>
          <Route 
            path="/" 
            element={authUser ? <Navigate to="/home" /> : <LandingPage />} 
          />
          <Route 
            path="/login" 
            element={!authUser ? <Login /> : <Navigate to="/home" replace />} 
          />
          <Route 
            path="/signup" 
            element={!authUser ? <Signup /> : <Navigate to="/home" replace />} 
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
      </Suspense>
      <Toaster />
    </div>
  );
}

export default App;
