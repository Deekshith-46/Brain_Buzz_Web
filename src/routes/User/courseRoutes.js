const express = require('express');
const { listCourses, getCourseById, initiateCoursePurchase } = require('../../controllers/User/courseController');
const userAuthMiddleware = require('../../middlewares/User/authMiddleware');

const router = express.Router();

// All course routes require authenticated user
router.use(userAuthMiddleware);

router.get('/courses', listCourses);
router.get('/courses/:id', getCourseById);
router.post('/courses/:courseId/purchase', initiateCoursePurchase);

module.exports = router;
