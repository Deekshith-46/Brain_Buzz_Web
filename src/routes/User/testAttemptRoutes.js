const express = require('express');
const router = express.Router();
const userAuthMiddleware = require('../../middlewares/User/authMiddleware');
const checkContentAccess = require('../../middlewares/checkContentAccess');
const {
  startTest,
  submitAnswer,
  submitTest,
  getResultAnalysis
} = require('../../controllers/User/testAttemptController');

// Start Test
router.post('/:seriesId/:testId/start', userAuthMiddleware, checkContentAccess, startTest);

// Submit Answer
router.post('/:seriesId/:testId/submit-question', userAuthMiddleware, submitAnswer);

// Submit Test (Finish Test)
router.post('/:seriesId/:testId/submit', userAuthMiddleware, submitTest);

// Get Full Result Analysis
router.get('/:attemptId/result', userAuthMiddleware, getResultAnalysis);

module.exports = router;