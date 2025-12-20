const app = require('../app');
const { connectDB } = require('../config/db');

module.exports = async (req, res) => {
  try {
    // Ensure database is connected before processing request
    await connectDB();
  } catch (error) {
    console.error('Database connection error in Vercel handler:', error.message);
    // Continue anyway as some routes might not need DB
  }
  
  return app(req, res);
};