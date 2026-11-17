import mongoose from 'mongoose';
import { ENV } from './env.js';

let mongoMemoryServer = null;

export const connectDB = async () => {
  try {
    if (ENV.USE_IN_MEMORY_DB) {
      console.log('🔄 Initializing in-memory MongoDB server...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      const uri = mongoMemoryServer.getUri();
      await mongoose.connect(uri);
      console.log(`✅ In-memory MongoDB connected: ${uri}`);
      return;
    }

    try {
      await mongoose.connect(ENV.MONGODB_URI, {
        serverSelectionTimeoutMS: 3000
      });
      console.log(`✅ MongoDB connected successfully: ${ENV.MONGODB_URI}`);
    } catch (err) {
      console.warn(`⚠️ Could not connect to local MongoDB at ${ENV.MONGODB_URI}: ${err.message}`);
      console.log('🔄 Falling back to in-memory MongoDB server for zero-setup execution...');
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      mongoMemoryServer = await MongoMemoryServer.create();
      const uri = mongoMemoryServer.getUri();
      await mongoose.connect(uri);
      console.log(`✅ Fallback In-memory MongoDB connected: ${uri}`);
    }
  } catch (error) {
    console.error('❌ Failed to connect to any MongoDB instance:', error);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongoMemoryServer) {
      await mongoMemoryServer.stop();
    }
  } catch (err) {
    console.error('Error disconnecting database:', err);
  }
};
