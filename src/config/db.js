const mongoose = require('mongoose');

// Global connection variable to reuse connection in serverless environment
let cachedConnection = null;
let isConnected = false;

const connectDB = async () => {
  // Return existing connection if already connected
  if (cachedConnection && isConnected) {
    console.log('Using existing MongoDB connection');
    return cachedConnection;
  }

  // If connecting or connected, return the promise
  if (cachedConnection && mongoose.connection.readyState === 1) {
    console.log('MongoDB already connected');
    return cachedConnection;
  }

  try {
    console.log('Connecting to MongoDB...');
    
    const options = {
      serverSelectionTimeoutMS: 30000,  // Increase server selection timeout
      socketTimeoutMS: 45000,           // Increase socket timeout
      bufferMaxEntries: 0,              // Disable operation buffering
      bufferCommands: false,            // Disable command buffering
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,                  // Limit pool size for serverless
      minPoolSize: 0,
      maxIdleTimeMS: 30000,             // Close idle connections after 30s
      waitQueueTimeoutMS: 10000         // Wait queue timeout
    };

    cachedConnection = await mongoose.connect(process.env.MONGODB_URI, options);
    isConnected = true;
    
    console.log(`MongoDB Connected: ${mongoose.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
    });
    
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
    });
    
    return cachedConnection;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    isConnected = false;
    cachedConnection = null;
    
    // Don't exit process in serverless environment
    throw new Error(`Database connection failed: ${error.message}`);
  }
};

// Gracefully close connection
const disconnectDB = async () => {
  if (cachedConnection) {
    await mongoose.connection.close();
    isConnected = false;
    cachedConnection = null;
    console.log('MongoDB connection closed');
  }
};

module.exports = { connectDB, disconnectDB };
