const mongoose = require('mongoose');

exports.testDbConnection = async (req, res) => {
  try {
    // Simple database operation to test connection
    const dbState = mongoose.connection.readyState;
    let statusMessage = '';
    
    switch(dbState) {
      case 0:
        statusMessage = 'Disconnected';
        break;
      case 1:
        statusMessage = 'Connected';
        break;
      case 2:
        statusMessage = 'Connecting';
        break;
      case 3:
        statusMessage = 'Disconnecting';
        break;
      default:
        statusMessage = 'Unknown';
    }
    
    // Try a simple database operation
    let dbPingResult = null;
    try {
      await mongoose.connection.db.admin().ping();
      dbPingResult = 'Successful';
    } catch (pingError) {
      dbPingResult = `Failed: ${pingError.message}`;
    }
    
    return res.status(200).json({
      message: 'Database connection test',
      connectionState: statusMessage,
      connectionStateCode: dbState,
      pingResult: dbPingResult,
      host: mongoose.connection.host || 'Not connected',
      name: mongoose.connection.name || 'Not connected'
    });
  } catch (error) {
    console.error('Database test error:', error);
    return res.status(500).json({
      message: 'Database test failed',
      error: error.message
    });
  }
};