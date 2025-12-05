const express = require('express');
const {
  createCourse,
  getCourses,
  getCourseById,
  updateCourse,
  deleteCourse,
  addClassesToCourse,
  createCourseShell,
  updateCourseShell,
  updateCourseBasic,
  updateCourseContent,
  addTutors,
  updateTutor,
  deleteTutor,
  updateClass,
  deleteClass,
  deleteStudyMaterial,
} = require('../../controllers/Admin/courseController');
const adminAuthMiddleware = require('../../middlewares/Admin/authMiddleware');
const upload = require('../../middlewares/uploadMiddleware');

const router = express.Router();

router.use(adminAuthMiddleware);

// Clean professional routes
router.post('/', createCourseShell); // create shell
router.put('/:id', updateCourseShell); // update shell
router.put(
  '/:id/basics',
  upload.fields([{ name: 'thumbnail', maxCount: 1 }]),
  updateCourseBasic
);
router.put(
  '/:id/content',
  upload.fields([{ name: 'studyMaterialFiles', maxCount: 50 }]),
  updateCourseContent
);
router.delete('/:id/study-materials/:materialId', deleteStudyMaterial);
router.post(
  '/:id/tutors',
  upload.fields([{ name: 'tutorImages', maxCount: 10 }]),
  addTutors
);
router.put(
  '/:id/tutors/:tutorId',
  upload.fields([{ name: 'tutorImage', maxCount: 1 }]),
  updateTutor
);
router.delete('/:id/tutors/:tutorId', deleteTutor);
router.post(
  '/:id/classes',
  upload.fields([
    { name: 'classThumbnails', maxCount: 50 },
    { name: 'classLecturePics', maxCount: 50 },
    { name: 'classVideos', maxCount: 50 },
  ]),
  addClassesToCourse
);
router.put(
  '/:id/classes/:classId',
  upload.fields([
    { name: 'classThumbnail', maxCount: 1 },
    { name: 'classLecturePic', maxCount: 1 },
    { name: 'classVideo', maxCount: 1 },
  ]),
  updateClass
);
router.delete('/:id/classes/:classId', deleteClass);

// Legacy all-in-one create/update if needed
router.post(
  '/all-in-one',
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'tutorImages', maxCount: 10 },
    { name: 'classThumbnails', maxCount: 50 },
    { name: 'classLecturePics', maxCount: 50 },
    { name: 'classVideos', maxCount: 50 },
    { name: 'studyMaterialFiles', maxCount: 50 },
  ]),
  createCourse
);

router.get('/', getCourses);
router.get('/:id', getCourseById);

router.put(
  '/:id/all-in-one',
  upload.fields([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'tutorImages', maxCount: 10 },
    { name: 'classThumbnails', maxCount: 50 },
    { name: 'classLecturePics', maxCount: 50 },
    { name: 'classVideos', maxCount: 50 },
    { name: 'studyMaterialFiles', maxCount: 50 },
  ]),
  updateCourse
);

router.delete('/:id', deleteCourse);

router.post(
  '/:id/classes',
  upload.fields([
    { name: 'classThumbnails', maxCount: 50 },
    { name: 'classLecturePics', maxCount: 50 },
    { name: 'classVideos', maxCount: 50 },
  ]),
  addClassesToCourse
);

module.exports = router;
