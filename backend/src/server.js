import mongoose from "mongoose";
import dotenv from "dotenv";
import app from "./app.js";
import { server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT || 5001;

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`Server is accessible at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error.message);
  });
