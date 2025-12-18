const PreviousQuestionPaper = require('../../models/Course/PreviousQuestionPaper');
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

// Helper function to parse PYQ payload from form data
const parsePYQPayload = (req) => {
  if (!req.body.pyq) {
    throw new Error('PYQ data is required in form-data');
  }
  
  let parsed;
  try {
    parsed = JSON.parse(req.body.pyq);
  } catch (e) {
    throw new Error('Invalid JSON in pyq field');
  }
  
  return parsed;
};

exports.createPYQ = async (req, res) => {
  try {
    let parsed;
    try {
      parsed = parsePYQPayload(req);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request data',
        error: e.message
      });
    }

    const {
      categoryId,
      subCategoryId,
      paperCategory,
      examId,
      subjectId,
      date,
      description
    } = parsed;

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

    const paper = await PreviousQuestionPaper.create({
      categoryId,
      subCategoryId,
      paperCategory,
      examId: examId || null,
      subjectId: subjectId || null,
      date,
      description,
      thumbnailUrl,
      fileUrl
    });

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
    const updateData = {};
    
    // Parse PYQ data if provided
    if (req.body.pyq) {
      let parsed;
      try {
        parsed = JSON.parse(req.body.pyq);
        Object.assign(updateData, parsed);
      } catch (e) {
        return res.status(400).json({
          success: false,
          message: 'Invalid JSON in pyq field',
          error: e.message
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
      .populate('examId subjectId categoryId subCategoryId');

    res.json({ success: true, data: papers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};