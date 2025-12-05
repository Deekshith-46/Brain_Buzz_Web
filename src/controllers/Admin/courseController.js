const Course = require('../../models/Course/Course');
const Language = require('../../models/Course/Language');
const cloudinary = require('../../config/cloudinary');

const uploadToCloudinary = (fileBuffer, folder, resourceType = 'image') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    stream.end(fileBuffer);
  });
};

// Create new course (ONLINE_COURSE) with thumbnail + tutor images
exports.createCourse = async (req, res) => {
  try {
    if (!req.body.course) {
      return res.status(400).json({ message: 'Course data (course) is required in form-data' });
    }

    const parsed = JSON.parse(req.body.course);

    const {
      contentType = 'ONLINE_COURSE',
      name,
      courseType,
      startDate,
      categoryIds = [],
      subCategoryIds = [],
      languageIds = [],
      validityIds = [],
      originalPrice,
      discountPrice,
      discountPercent,
      pricingNote,
      shortDescription,
      detailedDescription,
      tutors = [],
      classes = [],
      studyMaterials = [],
      isActive,
    } = parsed;

    if (!name) {
      return res.status(400).json({ message: 'Course name is required' });
    }

    if (!originalPrice && originalPrice !== 0) {
      return res.status(400).json({ message: 'Original price is required' });
    }

    // Handle thumbnail upload
    let thumbnailUrl;
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      const thumbFile = req.files.thumbnail[0];
      const uploadResult = await uploadToCloudinary(
        thumbFile.buffer,
        'brainbuzz/courses/thumbnails',
        'image'
      );
      thumbnailUrl = uploadResult.secure_url;
    }

    // Handle tutor images (match by index)
    const tutorImages = (req.files && req.files.tutorImages) || [];
    const finalTutors = tutors.map((tutor, index) => {
      const t = { ...tutor };
      if (tutorImages[index]) {
        t._fileBuffer = tutorImages[index].buffer;
      }
      return t;
    });

    // Upload tutor images to Cloudinary
    for (const tutor of finalTutors) {
      if (tutor._fileBuffer) {
        const uploadResult = await uploadToCloudinary(
          tutor._fileBuffer,
          'brainbuzz/courses/tutors',
          'image'
        );
        tutor.photoUrl = uploadResult.secure_url;
        delete tutor._fileBuffer;
      }
    }

    // Handle class media (thumbnails, lecture pics, videos) matched by index
    const classThumbnails = (req.files && req.files.classThumbnails) || [];
    const classLecturePics = (req.files && req.files.classLecturePics) || [];
    const classVideos = (req.files && req.files.classVideos) || [];

    const finalClasses = classes.map((cls, index) => {
      const c = { ...cls };
      if (classThumbnails[index]) {
        c._thumbBuffer = classThumbnails[index].buffer;
      }
      if (classLecturePics[index]) {
        c._lectureBuffer = classLecturePics[index].buffer;
      }
      if (classVideos[index]) {
        c._videoBuffer = classVideos[index].buffer;
      }
      return c;
    });

    for (const cls of finalClasses) {
      if (cls._thumbBuffer) {
        const uploadResult = await uploadToCloudinary(
          cls._thumbBuffer,
          'brainbuzz/courses/classes/thumbnails',
          'image'
        );
        cls.thumbnailUrl = uploadResult.secure_url;
        delete cls._thumbBuffer;
      }
      if (cls._lectureBuffer) {
        const uploadResult = await uploadToCloudinary(
          cls._lectureBuffer,
          'brainbuzz/courses/classes/lectures',
          'image'
        );
        cls.lecturePhotoUrl = uploadResult.secure_url;
        delete cls._lectureBuffer;
      }
      if (cls._videoBuffer) {
        const uploadResult = await uploadToCloudinary(
          cls._videoBuffer,
          'brainbuzz/courses/classes/videos',
          'video'
        );
        cls.videoUrl = uploadResult.secure_url;
        delete cls._videoBuffer;
      }
    }

    // Handle study material files matched by index
    const studyFiles = (req.files && req.files.studyMaterialFiles) || [];
    const finalStudyMaterials = studyMaterials.map((sm, index) => {
      const s = { ...sm };
      if (studyFiles[index]) {
        s._fileBuffer = studyFiles[index].buffer;
      }
      return s;
    });

    for (const sm of finalStudyMaterials) {
      if (sm._fileBuffer) {
        const uploadResult = await uploadToCloudinary(
          sm._fileBuffer,
          'brainbuzz/courses/study-materials',
          'raw'
        );
        sm.fileUrl = uploadResult.secure_url;
        delete sm._fileBuffer;
      }
    }

    const course = await Course.create({
      contentType,
      name,
      courseType,
      startDate,
      categories: categoryIds,
      subCategories: subCategoryIds,
      languages: languageIds,
      validities: validityIds,
      thumbnailUrl,
      originalPrice,
      discountPrice,
      discountPercent,
      pricingNote,
      shortDescription,
      detailedDescription,
      tutors: finalTutors,
      classes: finalClasses,
      studyMaterials: finalStudyMaterials,
      isActive,
    });

    return res.status(201).json({
      message: 'Course created successfully',
      data: course,
    });
  } catch (error) {
    console.error('Error creating course:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Step 1: create course shell (content, categories, subcategories, date)
exports.createCourseShell = async (req, res) => {
  try {
    const {
      startDate,
      categoryIds = [],
      subCategoryIds = [],
      contentType = 'ONLINE_COURSE',
    } = req.body;

    const draftName = `Draft Course ${Date.now()}`;

    const course = await Course.create({
      contentType,
      name: draftName,
      startDate,
      categories: categoryIds,
      subCategories: subCategoryIds,
      languages: [],
      validities: [],
      originalPrice: 0, // placeholder, to be updated in step 2
      discountPrice: 0,
      discountPercent: 0,
      shortDescription: '',
      detailedDescription: '',
      tutors: [],
      classes: [],
      studyMaterials: [],
      isActive: true,
    });

    return res.status(201).json({
      message: 'Course draft created. Proceed with next steps.',
      data: course,
    });
  } catch (error) {
    console.error('Error initializing course:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update shell (content, categories, subcategories, date)
exports.updateCourseShell = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      contentType,
      startDate,
      categoryIds,
      subCategoryIds,
    } = req.body;

    const updates = {};
    if (contentType) updates.contentType = contentType;
    if (startDate) updates.startDate = startDate;
    if (categoryIds) updates.categories = categoryIds;
    if (subCategoryIds) updates.subCategories = subCategoryIds;

    const course = await Course.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    return res.status(200).json({
      message: 'Course shell updated',
      data: course,
    });
  } catch (error) {
    console.error('Error updating course shell:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Step 2: update basic details (thumbnail, name, languages, validity, pricing)
exports.updateCourseBasic = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      languageIds,
      validityIds,
      originalPrice,
      discountPrice,
      courseType,
    } = req.body;

    const updates = {};

    if (name) updates.name = name;
    if (courseType) updates.courseType = courseType;
    if (languageIds) updates.languages = languageIds;
    if (validityIds) updates.validities = validityIds;
    if (typeof originalPrice !== 'undefined') updates.originalPrice = originalPrice;
    if (typeof discountPrice !== 'undefined') updates.discountPrice = discountPrice;

    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      const thumbFile = req.files.thumbnail[0];
      const uploadResult = await uploadToCloudinary(
        thumbFile.buffer,
        'brainbuzz/courses/thumbnails',
        'image'
      );
      updates.thumbnailUrl = uploadResult.secure_url;
    }

    const course = await Course.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    return res.status(200).json({
      message: 'Course basic details updated',
      data: course,
    });
  } catch (error) {
    console.error('Error updating course basic details:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Step 3: update descriptions, study materials, pricing note
exports.updateCourseContent = async (req, res) => {
  try {
    const { id } = req.params;
    const { shortDescription, detailedDescription, pricingNote, studyMaterials } = req.body;

    const updates = {};
    if (typeof shortDescription !== 'undefined') updates.shortDescription = shortDescription;
    if (typeof detailedDescription !== 'undefined') updates.detailedDescription = detailedDescription;
    if (typeof pricingNote !== 'undefined') updates.pricingNote = pricingNote;

    // handle study materials append
    let finalStudyMaterials = [];
    if (studyMaterials) {
      let parsed;
      try {
        parsed = Array.isArray(studyMaterials)
          ? studyMaterials
          : JSON.parse(studyMaterials);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid studyMaterials JSON' });
      }
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return res.status(400).json({ message: 'Study materials must be a non-empty array' });
      }
      const studyFiles = (req.files && req.files.studyMaterialFiles) || [];
      finalStudyMaterials = parsed.map((sm, index) => {
        const s = { ...sm };
        if (studyFiles[index]) s._fileBuffer = studyFiles[index].buffer;
        return s;
      });

      for (const sm of finalStudyMaterials) {
        if (sm._fileBuffer) {
          const uploadResult = await uploadToCloudinary(
            sm._fileBuffer,
            'brainbuzz/courses/study-materials',
            'raw'
          );
          sm.fileUrl = uploadResult.secure_url;
          delete sm._fileBuffer;
        }
      }
    }

    const course = await Course.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    if (finalStudyMaterials.length) {
      course.studyMaterials.push(...finalStudyMaterials);
      await course.save();
    }

    const populated = await Course.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    return res.status(200).json({
      message: 'Course content updated',
      data: populated,
    });
  } catch (error) {
    console.error('Error updating course content:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete study material
exports.deleteStudyMaterial = async (req, res) => {
  try {
    const { id, materialId } = req.params;
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    const before = course.studyMaterials.length;
    course.studyMaterials = course.studyMaterials.filter(
      (sm) => sm._id.toString() !== materialId
    );
    if (course.studyMaterials.length === before) {
      return res.status(404).json({ message: 'Study material not found' });
    }
    await course.save();
    const populatedCourse = await Course.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');
    return res.status(200).json({ message: 'Study material deleted', data: populatedCourse });
  } catch (error) {
    console.error('Error deleting study material:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Step 6: add tutors incrementally
exports.addTutors = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.body.tutors) {
      return res.status(400).json({ message: 'Tutors data is required' });
    }

    const tutors = JSON.parse(req.body.tutors);
    if (!Array.isArray(tutors) || tutors.length === 0) {
      return res.status(400).json({ message: 'Tutors must be a non-empty array' });
    }

    const tutorImages = (req.files && req.files.tutorImages) || [];
    const finalTutors = tutors.map((tutor, index) => {
      const t = { ...tutor };
      if (tutorImages[index]) {
        t._fileBuffer = tutorImages[index].buffer;
      }
      return t;
    });

    for (const tutor of finalTutors) {
      if (tutor._fileBuffer) {
        const uploadResult = await uploadToCloudinary(
          tutor._fileBuffer,
          'brainbuzz/courses/tutors',
          'image'
        );
        tutor.photoUrl = uploadResult.secure_url;
        delete tutor._fileBuffer;
      }
    }

    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    course.tutors.push(...finalTutors);
    await course.save();

    const populatedCourse = await Course.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    return res.status(200).json({
      message: 'Tutors added successfully',
      data: populatedCourse,
    });
  } catch (error) {
    console.error('Error adding tutors:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update tutor
exports.updateTutor = async (req, res) => {
  try {
    const { id, tutorId } = req.params;
    const { name, qualification, subject } = req.body;

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const tutor = course.tutors.id(tutorId);
    if (!tutor) return res.status(404).json({ message: 'Tutor not found' });

    if (name) tutor.name = name;
    if (qualification) tutor.qualification = qualification;
    if (subject) tutor.subject = subject;

    const tutorImages = (req.files && req.files.tutorImage) || [];
    if (tutorImages[0]) {
      const uploadResult = await uploadToCloudinary(
        tutorImages[0].buffer,
        'brainbuzz/courses/tutors',
        'image'
      );
      tutor.photoUrl = uploadResult.secure_url;
    }

    await course.save();
    const populatedCourse = await Course.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    return res.status(200).json({ message: 'Tutor updated', data: populatedCourse });
  } catch (error) {
    console.error('Error updating tutor:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete tutor
exports.deleteTutor = async (req, res) => {
  try {
    const { id, tutorId } = req.params;
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    course.tutors.id(tutorId)?.remove();
    await course.save();
    const populatedCourse = await Course.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');
    return res.status(200).json({ message: 'Tutor deleted', data: populatedCourse });
  } catch (error) {
    console.error('Error deleting tutor:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update class
exports.updateClass = async (req, res) => {
  try {
    const { id, classId } = req.params;
    const { title, topic, order } = req.body;

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const cls = course.classes.id(classId);
    if (!cls) return res.status(404).json({ message: 'Class not found' });

    if (title) cls.title = title;
    if (topic) cls.topic = topic;
    if (typeof order !== 'undefined') cls.order = order;

    const thumb = req.files?.classThumbnail?.[0];
    const lecture = req.files?.classLecturePic?.[0];
    const video = req.files?.classVideo?.[0];

    if (thumb) {
      const uploadResult = await uploadToCloudinary(
        thumb.buffer,
        'brainbuzz/courses/classes/thumbnails',
        'image'
      );
      cls.thumbnailUrl = uploadResult.secure_url;
    }
    if (lecture) {
      const uploadResult = await uploadToCloudinary(
        lecture.buffer,
        'brainbuzz/courses/classes/lectures',
        'image'
      );
      cls.lecturePhotoUrl = uploadResult.secure_url;
    }
    if (video) {
      const uploadResult = await uploadToCloudinary(
        video.buffer,
        'brainbuzz/courses/classes/videos',
        'video'
      );
      cls.videoUrl = uploadResult.secure_url;
    }

    await course.save();
    const populatedCourse = await Course.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    return res.status(200).json({ message: 'Class updated', data: populatedCourse });
  } catch (error) {
    console.error('Error updating class:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete class
exports.deleteClass = async (req, res) => {
  try {
    const { id, classId } = req.params;
    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ message: 'Course not found' });
    course.classes.id(classId)?.remove();
    await course.save();
    const populatedCourse = await Course.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');
    return res.status(200).json({ message: 'Class deleted', data: populatedCourse });
  } catch (error) {
    console.error('Error deleting class:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all courses (optionally filtered) - admin
exports.getCourses = async (req, res) => {
  try {
    const { contentType, category, subCategory, language, lang, isActive } = req.query;

    const filter = {};
    filter.contentType = contentType || 'ONLINE_COURSE';
    if (category) filter.categories = category;
    if (subCategory) filter.subCategories = subCategory;
    if (language) filter.languages = language;
    if (lang) {
      const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const langDoc = await Language.findOne({
        $or: [
          { code: lang.toLowerCase() },
          { name: { $regex: `^${escapeRegex(lang)}$`, $options: 'i' } },
        ],
      });
      if (!langDoc) {
        return res.status(400).json({ message: 'Invalid language code or name' });
      }
      filter.languages = langDoc._id;
    }
    if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true';

    const courses = await Course.find(filter)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    return res.status(200).json({ data: courses });
  } catch (error) {
    console.error('Error fetching courses:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get course by ID
exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    return res.status(200).json({ data: course });
  } catch (error) {
    console.error('Error fetching course:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update course (supports replacing thumbnail and tutor images)
exports.updateCourse = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.body.course) {
      return res.status(400).json({ message: 'Course data (course) is required in form-data' });
    }

    const parsed = JSON.parse(req.body.course);

    const {
      contentType,
      name,
      courseType,
      startDate,
      categoryIds,
      subCategoryIds,
      languageIds,
      validityIds,
      originalPrice,
      discountPrice,
      discountPercent,
      pricingNote,
      shortDescription,
      detailedDescription,
      tutors,
      classes,
      studyMaterials,
      isActive,
    } = parsed;

    const updates = {};

    if (contentType) updates.contentType = contentType;
    if (name) updates.name = name;
    if (courseType) updates.courseType = courseType;
    if (startDate) updates.startDate = startDate;
    if (categoryIds) updates.categories = categoryIds;
    if (subCategoryIds) updates.subCategories = subCategoryIds;
    if (languageIds) updates.languages = languageIds;
    if (validityIds) updates.validities = validityIds;
    if (typeof originalPrice !== 'undefined') updates.originalPrice = originalPrice;
    if (typeof discountPrice !== 'undefined') updates.discountPrice = discountPrice;
    if (typeof discountPercent !== 'undefined') updates.discountPercent = discountPercent;
    if (typeof pricingNote !== 'undefined') updates.pricingNote = pricingNote;
    if (typeof shortDescription !== 'undefined') updates.shortDescription = shortDescription;
    if (typeof detailedDescription !== 'undefined') updates.detailedDescription = detailedDescription;
    if (typeof isActive !== 'undefined') updates.isActive = isActive;

    // Handle thumbnail upload
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      const thumbFile = req.files.thumbnail[0];
      const uploadResult = await uploadToCloudinary(thumbFile.buffer, 'brainbuzz/courses/thumbnails');
      updates.thumbnailUrl = uploadResult.secure_url;
    }

    // Handle tutor images
    if (Array.isArray(tutors)) {
      const tutorImages = (req.files && req.files.tutorImages) || [];
      const finalTutors = tutors.map((tutor, index) => {
        const t = { ...tutor };
        if (tutorImages[index]) {
          t._fileBuffer = tutorImages[index].buffer;
        }
        return t;
      });

      for (const tutor of finalTutors) {
        if (tutor._fileBuffer) {
          const uploadResult = await uploadToCloudinary(
            tutor._fileBuffer,
            'brainbuzz/courses/tutors',
            'image'
          );
          tutor.photoUrl = uploadResult.secure_url;
          delete tutor._fileBuffer;
        }
      }

      updates.tutors = finalTutors;
    }

    // Handle classes media
    if (Array.isArray(classes)) {
      const classThumbnails = (req.files && req.files.classThumbnails) || [];
      const classLecturePics = (req.files && req.files.classLecturePics) || [];
      const classVideos = (req.files && req.files.classVideos) || [];

      const finalClasses = classes.map((cls, index) => {
        const c = { ...cls };
        if (classThumbnails[index]) {
          c._thumbBuffer = classThumbnails[index].buffer;
        }
        if (classLecturePics[index]) {
          c._lectureBuffer = classLecturePics[index].buffer;
        }
        if (classVideos[index]) {
          c._videoBuffer = classVideos[index].buffer;
        }
        return c;
      });

      for (const cls of finalClasses) {
        if (cls._thumbBuffer) {
          const uploadResult = await uploadToCloudinary(
            cls._thumbBuffer,
            'brainbuzz/courses/classes/thumbnails',
            'image'
          );
          cls.thumbnailUrl = uploadResult.secure_url;
          delete cls._thumbBuffer;
        }
        if (cls._lectureBuffer) {
          const uploadResult = await uploadToCloudinary(
            cls._lectureBuffer,
            'brainbuzz/courses/classes/lectures',
            'image'
          );
          cls.lecturePhotoUrl = uploadResult.secure_url;
          delete cls._lectureBuffer;
        }
        if (cls._videoBuffer) {
          const uploadResult = await uploadToCloudinary(
            cls._videoBuffer,
            'brainbuzz/courses/classes/videos',
            'video'
          );
          cls.videoUrl = uploadResult.secure_url;
          delete cls._videoBuffer;
        }
      }

      updates.classes = finalClasses;
    }

    // Handle study materials
    if (Array.isArray(studyMaterials)) {
      const studyFiles = (req.files && req.files.studyMaterialFiles) || [];

      const finalStudyMaterials = studyMaterials.map((sm, index) => {
        const s = { ...sm };
        if (studyFiles[index]) {
          s._fileBuffer = studyFiles[index].buffer;
        }
        return s;
      });

      for (const sm of finalStudyMaterials) {
        if (sm._fileBuffer) {
          const uploadResult = await uploadToCloudinary(
            sm._fileBuffer,
            'brainbuzz/courses/study-materials',
            'raw'
          );
          sm.fileUrl = uploadResult.secure_url;
          delete sm._fileBuffer;
        }
      }

      updates.studyMaterials = finalStudyMaterials;
    }

    const course = await Course.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    return res.status(200).json({
      message: 'Course updated successfully',
      data: course,
    });
  } catch (error) {
    console.error('Error updating course:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete course (hard delete)
exports.deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;

    const course = await Course.findByIdAndDelete(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    return res.status(200).json({ message: 'Course deleted successfully' });
  } catch (error) {
    console.error('Error deleting course:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Add classes to existing course
exports.addClassesToCourse = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.body.classes) {
      return res.status(400).json({ message: 'Classes data is required' });
    }

    const classes = JSON.parse(req.body.classes);

    if (!Array.isArray(classes) || classes.length === 0) {
      return res.status(400).json({ message: 'Classes must be a non-empty array' });
    }

    // Handle class media (thumbnails, lecture pics, videos) matched by index
    const classThumbnails = (req.files && req.files.classThumbnails) || [];
    const classLecturePics = (req.files && req.files.classLecturePics) || [];
    const classVideos = (req.files && req.files.classVideos) || [];

    const finalClasses = classes.map((cls, index) => {
      const c = { ...cls };
      if (classThumbnails[index]) {
        c._thumbBuffer = classThumbnails[index].buffer;
      }
      if (classLecturePics[index]) {
        c._lectureBuffer = classLecturePics[index].buffer;
      }
      if (classVideos[index]) {
        c._videoBuffer = classVideos[index].buffer;
      }
      return c;
    });

    for (const cls of finalClasses) {
      if (cls._thumbBuffer) {
        const uploadResult = await uploadToCloudinary(
          cls._thumbBuffer,
          'brainbuzz/courses/classes/thumbnails',
          'image'
        );
        cls.thumbnailUrl = uploadResult.secure_url;
        delete cls._thumbBuffer;
      }
      if (cls._lectureBuffer) {
        const uploadResult = await uploadToCloudinary(
          cls._lectureBuffer,
          'brainbuzz/courses/classes/lectures',
          'image'
        );
        cls.lecturePhotoUrl = uploadResult.secure_url;
        delete cls._lectureBuffer;
      }
      if (cls._videoBuffer) {
        const uploadResult = await uploadToCloudinary(
          cls._videoBuffer,
          'brainbuzz/courses/classes/videos',
          'video'
        );
        cls.videoUrl = uploadResult.secure_url;
        delete cls._videoBuffer;
      }
    }

    // Add the new classes to the existing ones
    const course = await Course.findById(id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Append new classes to existing classes
    course.classes.push(...finalClasses);

    // Save the updated course
    await course.save();

    // Populate the updated course data
    const populatedCourse = await Course.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    return res.status(200).json({
      message: 'Classes added successfully',
      data: populatedCourse,
    });
  } catch (error) {
    console.error('Error adding classes to course:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
