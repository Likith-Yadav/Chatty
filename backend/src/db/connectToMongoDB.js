import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectToMongoDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/chat_app';
    
    console.log('Attempting to connect to MongoDB at:', mongoURI);

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Successfully connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
    process.exit(1); // Exit the process if connection fails
  }
};

export default connectToMongoDB;
