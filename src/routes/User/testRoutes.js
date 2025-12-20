const express = require('express');
const router = express.Router();
const { testDbConnection } = require('../../controllers/User/testController');

// Test database connection
router.get('/test-db', testDbConnection);

module.exports = router;