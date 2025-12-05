const Course = require('../../models/Course/Course');
const Language = require('../../models/Course/Language');
const { PurchaseService } = require('../../../services');

// Helper function to check if user has purchased a course
const checkCoursePurchase = async (userId, courseId) => {
  if (!userId) return false;
  try {
    return await PurchaseService.hasAccess(userId, 'online_course', courseId);
  } catch (error) {
    console.error('Error checking course purchase:', error);
    return false;
  }
};

// Helper function to calculate finalPrice from originalPrice and discountPrice
const calculateFinalPrice = (originalPrice, discountPrice) => {
  const discountAmount = typeof discountPrice === 'number' && discountPrice >= 0
    ? discountPrice
    : 0;
  return Math.max(0, originalPrice - discountAmount);
};

// Helper function to process classes based on access
const processClassesForUser = (classes, hasPurchased, isAdmin = false) => {
  // Sort classes by order field if available, otherwise keep original order
  const sortedClasses = [...classes].sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    return 0;
  });

  // Admin has full access to all classes
  if (isAdmin) {
    return sortedClasses.map(cls => ({
      ...cls.toObject ? cls.toObject() : cls,
      isLocked: false,
      hasAccess: true,
    }));
  }

  // Process classes: first 2 are free, rest require purchase
  return sortedClasses.map((cls, index) => {
    const isFreeClass = index < 2; // First 2 classes (0 and 1) are free
    const hasAccess = isFreeClass || hasPurchased;
    const isLocked = !hasAccess;

    const classObj = cls.toObject ? cls.toObject() : cls;
    
    // If locked, hide videoUrl but keep other metadata
    if (isLocked) {
      const { videoUrl, ...rest } = classObj;
      return {
        ...rest,
        isLocked: true,
        hasAccess: false,
      };
    }

    return {
      ...classObj,
      isLocked: false,
      hasAccess: true,
    };
  });
};

// Public: list courses (primarily ONLINE_COURSE) with optional filters
exports.listCourses = async (req, res) => {
  try {
    const { contentType, category, subCategory, language, lang } = req.query;
    const userId = req.user?._id;

    const filter = {
      isActive: true,
    };

    // default to ONLINE_COURSE when not provided
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

    const courses = await Course.find(filter)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    // Process classes for each course
    const processedCourses = await Promise.all(
      courses.map(async (course) => {
        const hasPurchased = await checkCoursePurchase(userId, course._id);
        const courseObj = course.toObject();
        courseObj.classes = processClassesForUser(course.classes, hasPurchased, false);
        // Calculate and add finalPrice
        if (courseObj.originalPrice !== undefined) {
          courseObj.finalPrice = calculateFinalPrice(courseObj.originalPrice, courseObj.discountPrice);
        }
        return courseObj;
      })
    );

    return res.status(200).json({ data: processedCourses });
  } catch (error) {
    console.error('Error listing courses:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Public: get single course by id
exports.getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?._id;

    const course = await Course.findOne({
      _id: id,
      isActive: true,
    })
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .populate('validities', 'label durationInDays');

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user has purchased the course
    const hasPurchased = await checkCoursePurchase(userId, course._id);

    // Process classes based on access
    const courseObj = course.toObject();
    courseObj.classes = processClassesForUser(course.classes, hasPurchased, false);
    courseObj.hasPurchased = hasPurchased;
    // Calculate and add finalPrice
    if (courseObj.originalPrice !== undefined) {
      courseObj.finalPrice = calculateFinalPrice(courseObj.originalPrice, courseObj.discountPrice);
    }

    return res.status(200).json({ data: courseObj });
  } catch (error) {
    console.error('Error fetching course:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Initiate purchase for an online course (mock payment creation)
exports.initiateCoursePurchase = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user._id;
    const { couponCode } = req.body;

    const course = await Course.findOne({ _id: courseId, isActive: true }).select('originalPrice discountPrice name');
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    // Already purchased?
    const hasAccess = await PurchaseService.hasAccess(userId, 'online_course', courseId);
    if (hasAccess) {
      return res.status(400).json({ success: false, message: 'You have already purchased this course' });
    }

    // Create mock payment id and purchase record
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const purchase = await PurchaseService.createPurchase(
      userId,
      [{ itemType: 'online_course', itemId: courseId }],
      paymentId,
      couponCode
    );

    return res.status(200).json({
      success: true,
      data: {
        paymentId: purchase.paymentId,
        amount: purchase.finalAmount,
        currency: 'INR',
        couponApplied: !!purchase.coupon,
        discountAmount: purchase.discountAmount,
      },
    });
  } catch (error) {
    console.error('Error initiating course purchase:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to initiate purchase',
      error: error.message,
    });
  }
};
