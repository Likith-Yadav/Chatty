import mongoose from "mongoose";
import dotenv from "dotenv";
import "./app.js";

dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error.message);
  });
