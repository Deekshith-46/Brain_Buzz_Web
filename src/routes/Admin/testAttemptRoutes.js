const express = require('express');
const router = express.Router();
const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');
const {
  setCutoff,
  getCutoff,
  updateCutoff,
  deleteCutoff,
  getParticipants
} = require('../../controllers/Admin/testAttemptController');

// Cutoff management for Test
router.post('/:seriesId/:testId/cutoff', adminAuthMiddleware, setCutoff);
router.get('/:seriesId/:testId/cutoff', adminAuthMiddleware, getCutoff);
router.put('/:seriesId/:testId/cutoff', adminAuthMiddleware, updateCutoff);
router.delete('/:seriesId/:testId/cutoff', adminAuthMiddleware, deleteCutoff);

// View all participants score, rank, accuracy
router.get('/:seriesId/:testId/participants', adminAuthMiddleware, getParticipants);

module.exports = router;