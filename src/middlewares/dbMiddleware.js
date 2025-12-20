const { connectDB } = require('../config/db');

/**
 * Middleware to ensure database connection for each request
 */
const dbMiddleware = async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error('Database connection failed in middleware:', error.message);
    
    // For API routes, we continue anyway to allow error handling in controllers
    // Some routes might not require database access
    next();
  }
};

module.exports = dbMiddleware;