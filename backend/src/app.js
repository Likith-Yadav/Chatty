import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";

import connectToMongoDB from "./db/connectToMongoDB.js";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import roomRoutes from "./routes/room.route.js";
import usersRoutes from "./routes/users.route.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT || 5001;

// Connect to MongoDB
connectToMongoDB();

// Middlewares
app.use(express.json({ 
  limit: "50mb",
  verify: (req, res, buf) => {
    try {
      JSON.parse(buf.toString());
    } catch (e) {
      console.error('Invalid JSON:', e);
      throw new Error('Invalid JSON');
    }
  }
}));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// More robust CORS configuration
app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      // Development origins
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174',
      'http://localhost:5001',
      'http://127.0.0.1:5001',
      // Production Cloudflare domains
      'https://chatty-frontend.pages.dev',
      'https://chatty-backend.workers.dev',
      process.env.CLOUDFLARE_DOMAIN, // Your custom domain if configured
      // Existing render domains
      'https://chatty-frontend-p6tt.onrender.com',
      'https://chatty-frontend-7qth.onrender.com'
    ].filter(Boolean); // Remove undefined entries
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`Blocked request from unauthorized origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'Cookie',
    'X-Requested-With',
    'Accept',
    'Origin',
    'X-Cloudflare-Worker',
    'CF-Connecting-IP',
    'CF-Ray'
  ],
  exposedHeaders: ['set-cookie']
}));

// Comprehensive logging middleware
app.use((req, res, next) => {
  console.log('-------------------------------------------');
  console.log(`Received ${req.method} request to ${req.path}`);
  console.log('Request Headers:', JSON.stringify(req.headers, null, 2));
  console.log('Request Cookies:', req.cookies);
  console.log('Request Body:', req.body);
  console.log('-------------------------------------------');
  next();
});

// Explicitly log all routes
console.log('Registered Routes:');
console.log('- /api/auth routes');
console.log('- /api/messages routes');
console.log('- /api/rooms routes');
console.log('- /api/users routes');

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/users", usersRoutes);

// Handle OPTIONS requests
app.options('*', cors());

// Catch-all route for debugging unhandled routes
app.use((req, res, next) => {
  console.log('UNHANDLED ROUTE:', {
    method: req.method,
    path: req.path,
    headers: req.headers,
    body: req.body
  });
  
  // Send a JSON response for unhandled routes
  res.status(404).json({ 
    error: 'Route not found', 
    path: req.path,
    method: req.method 
  });
});

// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error("Global Error Handler:", {
    message: err.message,
    name: err.name,
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body
  });

  // Differentiate between different types of errors
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  // Default to 500 internal server error
  res.status(500).json({ 
    error: "Internal server error", 
    details: err.message 
  });
});

// Ensure server is listening on the correct port
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server is accessible at http://localhost:${PORT}`);
});

import { Router } from 'itty-router';
import { corsMiddleware } from './middleware/cors';
import { authRoutes } from './routes/auth.route.js';
import { messageRoutes } from './routes/message.route.js';
import { roomRoutes } from './routes/room.route.js';
import { usersRoutes } from './routes/users.route.js';

// Create a new router
const router = Router();

// CORS middleware
router.all('*', corsMiddleware);

// Routes
router.all('/api/auth/*', authRoutes);
router.all('/api/messages/*', messageRoutes);
router.all('/api/rooms/*', roomRoutes);
router.all('/api/users/*', usersRoutes);

// 404 handler
router.all('*', () => new Response('Not Found', { status: 404 }));

export const cloudflareApp = {
  handle: request => router.handle(request)
};

export default app;
