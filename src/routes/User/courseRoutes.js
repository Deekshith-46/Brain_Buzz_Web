const express = require('express');
const { 
  listCourses, 
  getCourseById, 
  getCourseClass, 
  initiateCoursePurchase
} = require('../../controllers/User/courseController');
const userAuthMiddleware = require('../../middlewares/User/authMiddleware');
const checkContentAccess = require('../../middlewares/checkContentAccess');

const router = express.Router();

// All course routes require authenticated user
router.use(userAuthMiddleware);

router.get('/courses', listCourses);
router.get('/courses/:id', getCourseById);
router.get('/courses/:courseId/classes/:classId', checkContentAccess, getCourseClass);
router.post('/courses/:courseId/purchase', initiateCoursePurchase);

module.exports = router;
