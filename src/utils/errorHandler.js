/**
 * Handle database connection errors specifically
 * @param {Error} error - The error object
 * @returns {Object} - Error response object with appropriate status code and message
 */
exports.handleDatabaseError = (error) => {
  console.error('Database error:', error);
  
  // Handle database connection timeout errors
  if (error.message && (error.message.includes('buffering timed out') || 
                        error.message.includes('Server selection timed out'))) {
    return {
      statusCode: 503,
      message: 'Database connection unavailable',
      error: 'Unable to connect to database. Please try again later.'
    };
  }
  
  // Handle other database errors
  if (error.name === 'MongoNetworkError' || 
      error.name === 'MongooseServerSelectionError' ||
      error.message.includes('ECONNREFUSED') ||
      error.message.includes('ENOTFOUND')) {
    return {
      statusCode: 503,
      message: 'Database connection error',
      error: 'Database is currently unreachable. Please try again later.'
    };
  }
  
  // Handle validation errors
  if (error.name === 'ValidationError') {
    return {
      statusCode: 400,
      message: 'Validation error',
      error: Object.values(error.errors).map(err => err.message)
    };
  }
  
  // Handle duplicate key errors
  if (error.code === 11000) {
    return {
      statusCode: 400,
      message: 'Duplicate entry error',
      error: 'An entry with this identifier already exists'
    };
  }
  
  // Default error
  return {
    statusCode: 500,
    message: 'Server error',
    error: error.message || 'An unexpected error occurred'
  };
};