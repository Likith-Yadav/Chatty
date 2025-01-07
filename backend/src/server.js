import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";
import http from "http";
import { Server } from "socket.io";
import configureSocket from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT || 5001;

// MongoDB Connection
const connectToMongoDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error.message);
    throw error;
  }
};

// Create HTTP server
const server = http.createServer(app);

// Socket.io configuration
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "*",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Configure socket.io
configureSocket(io);

// Vercel serverless function handler
export default async function handler(req, res) {
  try {
    // Connect to MongoDB
    await connectToMongoDB();

    // Add root route handler
    if (req.method === 'GET' && req.url === '/') {
      return res.status(200).json({ 
        message: "Backend is running!", 
        timestamp: new Date().toISOString(),
        status: 'healthy'
      });
    }

    // Handle the request using the Express app
    return new Promise((resolve, reject) => {
      // Modify the request to work with Express
      const modifiedReq = Object.assign({}, req, {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: req.body
      });

      const modifiedRes = {
        status: function(code) {
          res.status(code);
          return this;
        },
        json: function(data) {
          res.json(data);
          resolve();
        },
        send: function(data) {
          res.send(data);
          resolve();
        },
        end: function() {
          res.end();
          resolve();
        },
        setHeader: function(key, value) {
          res.setHeader(key, value);
          return this;
        }
      };

      // Dispatch the request to the Express app
      app(modifiedReq, modifiedRes, (err) => {
        if (err) {
          console.error('Express error:', err);
          res.status(500).json({ 
            error: 'Internal Server Error', 
            message: err.message 
          });
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('Serverless function error:', error);
    res.status(500).json({ 
      error: 'Internal Server Error', 
      message: error.message 
    });
  }
}

// For local development, start the server
if (process.env.NODE_ENV !== 'production') {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}
