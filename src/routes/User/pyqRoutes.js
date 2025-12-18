const express = require('express');
const router = express.Router();
const pyqController = require('../../controllers/User/pyqController');

router.get('/', pyqController.listPYQ);

module.exports = router;