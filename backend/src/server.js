import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";
import { server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT || 5001;
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("FATAL ERROR: MONGO_URI is not defined.");
  process.exit(1);
}

// Enhanced logging for MongoDB connection
mongoose.set('debug', true);

// Parse connection string to extract components
const parseMongoURI = (uri) => {
  const matches = uri.match(/^mongodb\+srv:\/\/([^:]+):([^@]+)@([^/]+)\/([^?]+)?/);
  return matches ? {
    username: matches[1],
    password: matches[2],
    host: matches[3],
    database: matches[4] || 'test'
  } : null;
};

const connectionDetails = parseMongoURI(MONGO_URI);
if (connectionDetails) {
  console.log(`🔐 Attempting to connect with:`);
  console.log(`   User: ${connectionDetails.username}`);
  console.log(`   Host: ${connectionDetails.host}`);
  console.log(`   Database: ${connectionDetails.database}`);
}

mongoose.connect(MONGO_URI, {
  // Explicitly set authentication and connection options
  authSource: 'admin',
  ssl: true,
  retryWrites: true,
  w: 'majority'
})
  .then(() => {
    console.log("✅ Successfully Connected to MongoDB");
    console.log(`🔗 Connection URI: ${MONGO_URI.replace(/:[^:]*@/, ':****@')}`);
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`🌐 Server is accessible at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ Error connecting to MongoDB:", error);
    console.error("Detailed Error Message:", error.message);
    console.error("Error Stack:", error.stack);
    process.exit(1);
  });
