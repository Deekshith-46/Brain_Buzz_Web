const PreviousQuestionPaper = require('../../models/Course/PreviousQuestionPaper');
const Category = require('../../models/Course/Category');
const SubCategory = require('../../models/Course/SubCategory');
const Language = require('../../models/Course/Language');
const cloudinary = require('../../config/cloudinary');

// Helper function to escape regex special characters
const escapeRegex = (s) => s.replace(/[.*+?^${}()|\[\]\\]/g, '\\$&');

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

exports.createPYQ = async (req, res) => {
  try {
    const {
      categoryId,
      subCategoryId,
      paperCategory,
      examId,
      subjectId,
      date,
      description,
      languageId
    } = req.body;

    // Validate required fields
    if (!categoryId) {
      return res.status(400).json({ success: false, message: 'Category ID is required' });
    }

    if (!subCategoryId) {
      return res.status(400).json({ success: false, message: 'SubCategory ID is required' });
    }

    if (!paperCategory) {
      return res.status(400).json({ success: false, message: 'Paper category is required' });
    }

    if (!date) {
      return res.status(400).json({ success: false, message: 'Date is required' });
    }

    // Validate languageId if provided
    if (languageId) {
      const language = await Language.findById(languageId);
      if (!language) {
        return res.status(404).json({
          success: false,
          message: 'Language not found'
        });
      }
    }

    // Handle thumbnail upload
    let thumbnailUrl;
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      try {
        const uploadResult = await uploadToCloudinary(
          req.files.thumbnail[0].buffer,
          'brainbuzz/pyq/thumbnails',
          'image'
        );
        thumbnailUrl = uploadResult.secure_url;
      } catch (error) {
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to upload thumbnail', 
          error: error.message 
        });
      }
    }

    // Handle paper file upload
    let fileUrl;
    if (req.files && req.files.paper && req.files.paper[0]) {
      try {
        const uploadResult = await uploadToCloudinary(
          req.files.paper[0].buffer,
          'brainbuzz/pyq/papers',
          'raw'
        );
        fileUrl = uploadResult.secure_url;
      } catch (error) {
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to upload paper file', 
          error: error.message 
        });
      }
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Paper file is required. Please ensure you are sending a file in the "paper" field.' 
      });
    }

    // Create the paper with languages array if languageId is provided
    const paperData = {
      categoryId,
      subCategoryId,
      paperCategory,
      examId: examId || null,
      subjectId: subjectId || null,
      date,
      description,
      thumbnailUrl,
      fileUrl
    };
    
    // Add languageId if provided
    if (languageId) {
      paperData.languageId = languageId;
      // Also add to languages array for backward compatibility
      paperData.languages = [languageId];
    }
    
    const paper = await PreviousQuestionPaper.create(paperData);

    res.json({
      success: true,
      message: 'Question paper added',
      data: paper
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePYQ = async (req, res) => {
  try {
    // Get all possible update fields from req.body
    const { categoryId, subCategoryId, paperCategory, examId, subjectId, date, description, languageId } = req.body;
    const updateData = {};
    
    // Only add fields that were provided in the request
    if (categoryId) updateData.categoryId = categoryId;
    if (subCategoryId) updateData.subCategoryId = subCategoryId;
    if (paperCategory) updateData.paperCategory = paperCategory;
    if (examId) updateData.examId = examId;
    if (subjectId) updateData.subjectId = subjectId;
    if (date) updateData.date = date;
    if (description) updateData.description = description;
    if (languageId) {
      updateData.languageId = languageId;
      // Also update languages array for consistency
      updateData.languages = [languageId];
    }

    // Validate languageId if provided
    if (updateData.languageId) {
      const language = await Language.findById(updateData.languageId);
      if (!language) {
        return res.status(404).json({
          success: false,
          message: 'Language not found'
        });
      }
    }

    // Handle thumbnail upload
    if (req.files && req.files.thumbnail && req.files.thumbnail[0]) {
      try {
        const uploadResult = await uploadToCloudinary(
          req.files.thumbnail[0].buffer,
          'brainbuzz/pyq/thumbnails',
          'image'
        );
        updateData.thumbnailUrl = uploadResult.secure_url;
      } catch (error) {
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to upload thumbnail', 
          error: error.message 
        });
      }
    }

    // Handle paper file upload
    if (req.files && req.files.paper && req.files.paper[0]) {
      try {
        const uploadResult = await uploadToCloudinary(
          req.files.paper[0].buffer,
          'brainbuzz/pyq/papers',
          'raw'
        );
        updateData.fileUrl = uploadResult.secure_url;
      } catch (error) {
        return res.status(500).json({ 
          success: false, 
          message: 'Failed to upload paper file', 
          error: error.message 
        });
      }
    }

    const paper = await PreviousQuestionPaper.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!paper) {
      return res.status(404).json({ success: false, message: 'Question paper not found' });
    }

    res.json({ success: true, data: paper });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deletePYQ = async (req, res) => {
  try {
    await PreviousQuestionPaper.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Question paper deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.listPYQ = async (req, res) => {
  try {
    const filters = {
      isActive: true,
      ...req.query
    };

    // Remove undefined/null values from filters
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined || filters[key] === null || filters[key] === '') {
        delete filters[key];
      }
    });

    const papers = await PreviousQuestionPaper.find(filters)
      .populate('examId subjectId categoryId subCategoryId languageId languages');

    res.json({ success: true, data: papers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get distinct categories for previous question papers (admin - shows all papers regardless of active status)
exports.getPYQCategories = async (req, res) => {
  try {
    // Find PYQs (including inactive) and get distinct categories
    const papers = await PreviousQuestionPaper.find({}).populate('categoryId', 'name slug description thumbnailUrl');

    // Extract unique categories
    const categories = [];
    const categoryIds = new Set();
    
    papers.forEach(paper => {
      if (paper.categoryId) {
        if (!categoryIds.has(paper.categoryId._id.toString())) {
          categoryIds.add(paper.categoryId._id.toString());
          categories.push({
            _id: paper.categoryId._id,
            name: paper.categoryId.name,
            slug: paper.categoryId.slug,
            description: paper.categoryId.description,
            thumbnailUrl: paper.categoryId.thumbnailUrl
          });
        }
      }
    });

    return res.status(200).json({ data: categories });
  } catch (error) {
    console.error('Error fetching PYQ categories:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get distinct subcategories for previous question papers based on category (admin - shows all papers regardless of active status)
exports.getPYQSubCategories = async (req, res) => {
  try {
    const { category } = req.query;
    
    const filter = {
      categoryId: category
    };

    const papers = await PreviousQuestionPaper.find(filter).populate('subCategoryId', 'name slug description thumbnailUrl');

    // Extract unique subcategories
    const subCategories = [];
    const subCategoryIds = new Set();
    
    papers.forEach(paper => {
      if (paper.subCategoryId) {
        if (!subCategoryIds.has(paper.subCategoryId._id.toString())) {
          subCategoryIds.add(paper.subCategoryId._id.toString());
          subCategories.push({
            _id: paper.subCategoryId._id,
            name: paper.subCategoryId.name,
            slug: paper.subCategoryId.slug,
            description: paper.subCategoryId.description,
            thumbnailUrl: paper.subCategoryId.thumbnailUrl
          });
        }
      }
    });

    return res.status(200).json({ data: subCategories });
  } catch (error) {
    console.error('Error fetching PYQ subcategories:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};
