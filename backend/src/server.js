import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { connectToMongoDB } from './db/connectToMongoDB.js';
import authRoutes from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js';
import roomRoutes from './routes/room.route.js';
import { app, server } from './lib/socket.js';

dotenv.config();

const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'https://chatty-likit.netlify.app', 
    process.env.FRONTEND_URL || ''
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/rooms', roomRoutes);

// Health check route for Vercel
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Connect to MongoDB and start server
const startServer = async () => {
  try {
    await connectToMongoDB();
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Export for Vercel serverless function
export default app;

// Start server if not in serverless environment
if (process.env.NODE_ENV !== 'vercel') {
  startServer();
}
