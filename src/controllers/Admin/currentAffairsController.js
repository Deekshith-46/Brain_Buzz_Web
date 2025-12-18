const LatestCurrentAffair = require('../../models/CurrentAffairs/LatestCurrentAffair');
const MonthlyCurrentAffair = require('../../models/CurrentAffairs/MonthlyCurrentAffair');
const cloudinary = require('../../config/cloudinary');
const SportsCurrentAffair = require('../../models/CurrentAffairs/SportsCurrentAffair');
const StateCurrentAffair = require('../../models/CurrentAffairs/StateCurrentAffair');
const InternationalCurrentAffair = require('../../models/CurrentAffairs/InternationalCurrentAffair');
const PoliticsCurrentAffair = require('../../models/CurrentAffairs/PoliticsCurrentAffair');
const LocalCurrentAffair = require('../../models/CurrentAffairs/LocalCurrentAffair');
const Category = require('../../models/Course/Category');
const SubCategory = require('../../models/Course/SubCategory');
const Language = require('../../models/Course/Language');
const CurrentAffair = require('../../models/CurrentAffairs/CurrentAffairBase');

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

// Helper function to parse affair payload from form data
const parseAffairPayload = (req) => {
  if (!req.body.affair) {
    throw new Error('Affair data is required in form-data');
  }
  
  let parsed;
  try {
    parsed = JSON.parse(req.body.affair);
  } catch (e) {
    throw new Error('Invalid JSON in affair field');
  }
  
  return parsed;
};

// Helper function to handle thumbnail upload
const handleThumbnailUpload = async (req, folder) => {
  // Handle both upload.single() and upload.fields() cases
  let fileBuffer = null;
  
  // Case 1: upload.single('thumbnail') puts file in req.file
  if (req.file && req.file.buffer) {
    fileBuffer = req.file.buffer;
  }
  // Case 2: upload.fields([{ name: 'thumbnail', maxCount: 1 }]) puts file in req.files.thumbnail[0]
  else if (req.files && req.files.thumbnail && req.files.thumbnail[0] && req.files.thumbnail[0].buffer) {
    fileBuffer = req.files.thumbnail[0].buffer;
  }
  
  if (fileBuffer) {
    try {
      const uploadResult = await uploadToCloudinary(fileBuffer, folder, 'image');
      return uploadResult.secure_url;
    } catch (error) {
      console.error('Error uploading thumbnail:', error);
      throw new Error('Failed to upload thumbnail');
    }
  }
  return null;
};

// -------- Latest Current Affairs --------

exports.createLatestCurrentAffair = async (req, res) => {
  try {
    let parsed;
    try {
      parsed = parseAffairPayload(req);
    } catch (e) {
      return res.status(400).json({
        message: 'Invalid request data',
        error: e.message
      });
    }

    const {
      date,
      categoryIds = [],
      subCategoryIds = [],
      languageIds = [],
      heading,
      description,
      fullContent,
      isActive,
    } = parsed;

    // Validate required fields
    if (!heading) {
      return res.status(400).json({ message: 'CA heading is required' });
    }

    // Date is required for Latest Current Affairs
    if (!date) {
      return res.status(400).json({ message: 'Date is required for Latest Current Affairs' });
    }

    // Validate that only one language is selected (best practice)
    if (languageIds && languageIds.length > 1) {
      return res.status(400).json({ 
        message: 'Only one language should be selected per content entry (best practice)' 
      });
    }

    let thumbnailUrl;
    try {
      thumbnailUrl = await handleThumbnailUpload(
        req,
        'brainbuzz/current-affairs/latest/thumbnails'
      );
    } catch (error) {
      return res.status(500).json({ 
        message: 'Failed to upload thumbnail', 
        error: error.message 
      });
    }

    const doc = await LatestCurrentAffair.create({
      date,
      categories: categoryIds,
      subCategories: subCategoryIds,
      languages: languageIds,
      heading,
      thumbnailUrl,
      description,
      fullContent,
      isActive: typeof isActive !== 'undefined' ? isActive : true,
    });

    return res.status(201).json({
      message: 'Latest current affair created successfully',
      data: doc,
    });
  } catch (error) {
    console.error('Error creating latest current affair:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getLatestCurrentAffairs = async (req, res) => {
  try {
    const { category, subCategory, language, date, isActive } = req.query;

    const filter = {};
    if (category) filter.categories = category;
    if (subCategory) filter.subCategories = subCategory;
    if (language) filter.languages = language;
    if (date) filter.date = date;
    if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true';

    const docs = await LatestCurrentAffair.find(filter)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    return res.status(200).json({ data: docs });
  } catch (error) {
    console.error('Error fetching latest current affairs:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getLatestCurrentAffairById = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await LatestCurrentAffair.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    if (!doc) {
      return res.status(404).json({ message: 'Latest current affair not found' });
    }

    return res.status(200).json({ data: doc });
  } catch (error) {
    console.error('Error fetching latest current affair:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateLatestCurrentAffair = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.body.affair) {
      return res
        .status(400)
        .json({ message: 'Current affair data (affair) is required in form-data' });
    }

    const parsed = JSON.parse(req.body.affair);

    const {
      date,
      categoryIds,
      subCategoryIds,
      languageIds,
      heading,
      description,
      fullContent,
      isActive,
    } = parsed;

    const updates = {};

    if (date) updates.date = date;
    if (categoryIds) updates.categories = categoryIds;
    if (subCategoryIds) updates.subCategories = subCategoryIds;
    if (languageIds) updates.languages = languageIds;
    if (heading) updates.heading = heading;
    if (typeof description !== 'undefined') updates.description = description;
    if (typeof fullContent !== 'undefined') updates.fullContent = fullContent;
    if (typeof isActive !== 'undefined') updates.isActive = isActive;

    const thumbnailUrl = await handleThumbnailUpload(
      req,
      'brainbuzz/current-affairs/latest/thumbnails'
    );
    if (thumbnailUrl) updates.thumbnailUrl = thumbnailUrl;

    const doc = await LatestCurrentAffair.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    if (!doc) {
      return res.status(404).json({ message: 'Latest current affair not found' });
    }

    return res.status(200).json({
      message: 'Latest current affair updated successfully',
      data: doc,
    });
  } catch (error) {
    console.error('Error updating latest current affair:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteLatestCurrentAffair = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await LatestCurrentAffair.findByIdAndDelete(id);
    if (!doc) {
      return res.status(404).json({ message: 'Latest current affair not found' });
    }

    return res.status(200).json({ message: 'Latest current affair deleted successfully' });
  } catch (error) {
    console.error('Error deleting latest current affair:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// -------- Monthly Current Affairs --------

exports.createMonthlyCurrentAffair = async (req, res) => {
  try {
    let parsed;
    try {
      parsed = parseAffairPayload(req);
    } catch (e) {
      return res.status(400).json({
        message: 'Invalid request data',
        error: e.message
      });
    }

    const {
      date,
      month,
      categoryIds = [],
      subCategoryIds = [],
      languageIds = [],
      name,
      description,
      fullContent,
      isActive,
    } = parsed;

    // Validate required fields
    if (!name) {
      return res.status(400).json({ message: 'CA name is required' });
    }

    // Month is required for Monthly Current Affairs
    if (!month) {
      return res.status(400).json({ message: 'Month is required for Monthly Current Affairs' });
    }

    // Validate that only one language is selected (best practice)
    if (languageIds && languageIds.length > 1) {
      return res.status(400).json({ 
        message: 'Only one language should be selected per content entry (best practice)' 
      });
    }

    let thumbnailUrl;
    try {
      thumbnailUrl = await handleThumbnailUpload(
        req,
        'brainbuzz/current-affairs/monthly/thumbnails'
      );
    } catch (error) {
      return res.status(500).json({ 
        message: 'Failed to upload thumbnail', 
        error: error.message 
      });
    }

    // Auto-set date to 1st of the month if not provided
    let finalDate = date;
    if (!date && month) {
      // Get current year
      const currentYear = new Date().getFullYear();
      // Set to 1st of the month
      finalDate = new Date(`${currentYear}-${month}-01`);
    }

    const doc = await MonthlyCurrentAffair.create({
      date: finalDate,
      month,
      categories: categoryIds,
      subCategories: subCategoryIds,
      languages: languageIds,
      name,
      thumbnailUrl,
      description,
      fullContent,
      isActive: typeof isActive !== 'undefined' ? isActive : true,
    });

    return res.status(201).json({
      message: 'Monthly current affair created successfully',
      data: doc,
    });
  } catch (error) {
    console.error('Error creating monthly current affair:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMonthlyCurrentAffairs = async (req, res) => {
  try {
    const { category, subCategory, language, month, isActive } = req.query;

    const filter = {};
    if (category) filter.categories = category;
    if (subCategory) filter.subCategories = subCategory;
    if (language) filter.languages = language;
    if (month) filter.month = month;
    if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true';

    const docs = await MonthlyCurrentAffair.find(filter)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    return res.status(200).json({ data: docs });
  } catch (error) {
    console.error('Error fetching monthly current affairs:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMonthlyCurrentAffairById = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await MonthlyCurrentAffair.findById(id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    if (!doc) {
      return res.status(404).json({ message: 'Monthly current affair not found' });
    }

    return res.status(200).json({ data: doc });
  } catch (error) {
    console.error('Error fetching monthly current affair:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.updateMonthlyCurrentAffair = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.body.affair) {
      return res
        .status(400)
        .json({ message: 'Current affair data (affair) is required in form-data' });
    }

    const parsed = JSON.parse(req.body.affair);

    const {
      date,
      month,
      categoryIds,
      subCategoryIds,
      languageIds,
      name,
      description,
      fullContent,
      isActive,
    } = parsed;

    const updates = {};

    if (date) updates.date = date;
    if (month) updates.month = month;
    if (categoryIds) updates.categories = categoryIds;
    if (subCategoryIds) updates.subCategories = subCategoryIds;
    if (languageIds) updates.languages = languageIds;
    if (name) updates.name = name;
    if (typeof description !== 'undefined') updates.description = description;
    if (typeof fullContent !== 'undefined') updates.fullContent = fullContent;
    if (typeof isActive !== 'undefined') updates.isActive = isActive;

    const thumbnailUrl = await handleThumbnailUpload(
      req,
      'brainbuzz/current-affairs/monthly/thumbnails'
    );
    if (thumbnailUrl) updates.thumbnailUrl = thumbnailUrl;

    const doc = await MonthlyCurrentAffair.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    })
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    if (!doc) {
      return res.status(404).json({ message: 'Monthly current affair not found' });
    }

    return res.status(200).json({
      message: 'Monthly current affair updated successfully',
      data: doc,
    });
  } catch (error) {
    console.error('Error updating monthly current affair:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.deleteMonthlyCurrentAffair = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await MonthlyCurrentAffair.findByIdAndDelete(id);
    if (!doc) {
      return res.status(404).json({ message: 'Monthly current affair not found' });
    }

    return res.status(200).json({ message: 'Monthly current affair deleted successfully' });
  } catch (error) {
    console.error('Error deleting monthly current affair:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};


// Create new sports current affair
exports.createSportsCurrentAffair = async (req, res) => {
  try {
    let payload;
    try {
      payload = parseAffairPayload(req);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON in affair field',
        error: e.message,
      });
    }

    // Required (based on your existing code)
    const { 
      sport = '', 
      event = '', 
      date,
      categoryIds = [],
      subCategoryIds = [],
      languageIds = [],
      description,
      fullContent,
      isActive
    } = payload;
    
    if (!sport || !event) {
      return res.status(400).json({
        success: false,
        message: 'Both sport and event fields are required',
      });
    }

    // Date is required for Sports Current Affairs
    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required for Sports Current Affairs',
      });
    }

    // Validate that only one language is selected (best practice)
    if (languageIds && languageIds.length > 1) {
      return res.status(400).json({
        success: false,
        message: 'Only one language should be selected per content entry (best practice)',
      });
    }

    let thumbnailUrl;
    try {
      thumbnailUrl = await handleThumbnailUpload(
        req,
        'brainbuzz/current-affairs/sports/thumbnails'
      );
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload thumbnail',
        error: error.message,
      });
    }

    const newSportsAffair = await SportsCurrentAffair.create({
      date,
      categories: categoryIds,
      subCategories: subCategoryIds,
      languages: languageIds,
      sport,
      event,
      description,
      fullContent,
      thumbnailUrl,
      contentType: 'CURRENT_AFFAIRS',
      isActive: typeof isActive !== 'undefined' ? isActive : true,
    });

    // Populate the response with related data
    const populatedAffair = await SportsCurrentAffair.findById(newSportsAffair._id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    return res.status(201).json({
      success: true,
      message: 'Sports current affair created successfully',
      data: populatedAffair,
    });
  } catch (error) {
    console.error('Error creating sports current affair:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create sports current affair',
      error: error.message,
    });
  }
};

// Get all sports current affairs
exports.listSportsCurrentAffairs = async (req, res) => {
  try {
    const { sport, event, date } = req.query;
    const filter = { isActive: true };

    if (sport) filter.sport = sport;
    if (event) filter.event = event;
    if (date) filter.date = date;

    const docs = await SportsCurrentAffair.find(filter)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .sort({ date: -1 });

    return res.status(200).json({ 
      success: true,
      data: docs 
    });
  } catch (error) {
    console.error('Error listing sports current affairs:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get single sports current affair by ID
exports.getSportsCurrentAffairById = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await SportsCurrentAffair.findOne({
      _id: id,
      isActive: true
    })
    .populate('categories', 'name slug')
    .populate('subCategories', 'name slug')
    .populate('languages', 'name code');

    if (!doc) {
      return res.status(404).json({ 
        success: false,
        message: 'Sports current affair not found' 
      });
    }

    return res.status(200).json({ 
      success: true,
      data: doc 
    });
  } catch (error) {
    console.error('Error fetching sports current affair:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Update sports current affair
exports.updateSportsCurrentAffair = async (req, res) => {
  try {
    const { id } = req.params;
    let payload;

    try {
      payload = parseAffairPayload(req);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON in affair field',
        error: e.message,
      });
    }

    // Map the IDs properly
    const updates = {};
    if (payload.date) updates.date = payload.date;
    if (payload.categoryIds) updates.categories = payload.categoryIds;
    if (payload.subCategoryIds) updates.subCategories = payload.subCategoryIds;
    if (payload.languageIds) updates.languages = payload.languageIds;
    if (payload.sport) updates.sport = payload.sport;
    if (payload.event) updates.event = payload.event;
    if (payload.description !== undefined) updates.description = payload.description;
    if (payload.fullContent !== undefined) updates.fullContent = payload.fullContent;
    if (payload.isActive !== undefined) updates.isActive = payload.isActive;

    const thumbnailUrl = await handleThumbnailUpload(
      req,
      'brainbuzz/current-affairs/sports/thumbnails'
    );
    if (thumbnailUrl) updates.thumbnailUrl = thumbnailUrl;

    const updatedAffair = await SportsCurrentAffair.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    if (!updatedAffair) {
      return res.status(404).json({
        success: false,
        message: 'Sports current affair not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Sports current affair updated successfully',
      data: updatedAffair,
    });
  } catch (error) {
    console.error('Error updating sports current affair:', error);
    return res.status(500).json({
      success: false,
      message: 'Error updating sports current affair',
      error: error.message,
    });
  }
};

// Delete sports current affair (soft delete)
exports.deleteSportsCurrentAffair = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedAffair = await SportsCurrentAffair.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!deletedAffair) {
      return res.status(404).json({ 
        success: false,
        message: 'Sports current affair not found' 
      });
    }

    return res.status(200).json({ 
      success: true,
      message: 'Sports current affair deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting sports current affair:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
}


// Similar functions for StateCurrentAffair

exports.createStateCurrentAffair = async (req, res) => {
  try {
    let payload;
    try {
      payload = parseAffairPayload(req);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON in affair field',
        error: e.message,
      });
    }

    // Required fields
    if (!payload.state) {
      return res.status(400).json({
        success: false,
        message: 'State is required',
      });
    }
    if (!payload.name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      });
    }

    // Date is required for State Current Affairs
    if (!payload.date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required for State Current Affairs',
      });
    }

    // Extract fields with defaults
    const { 
      state,
      name,
      date,
      categoryIds = [],
      subCategoryIds = [],
      languageIds = [],
      description,
      fullContent,
      isActive
    } = payload;

    // Validate that only one language is selected (best practice)
    if (languageIds && languageIds.length > 1) {
      return res.status(400).json({
        success: false,
        message: 'Only one language should be selected per content entry (best practice)',
      });
    }

    let thumbnailUrl;
    try {
      thumbnailUrl = await handleThumbnailUpload(
        req,
        'brainbuzz/current-affairs/state/thumbnails'
      );
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload thumbnail',
        error: error.message,
      });
    }

    const newAffair = await StateCurrentAffair.create({
      state,
      name,
      date,
      categories: categoryIds,
      subCategories: subCategoryIds,
      languages: languageIds,
      description,
      fullContent,
      thumbnailUrl,
      affairType: 'StateCurrentAffair',
      contentType: 'CURRENT_AFFAIRS',
      isActive: typeof isActive !== 'undefined' ? isActive : true,
    });
    
    const populatedAffair = await StateCurrentAffair.findById(newAffair._id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    return res.status(201).json({
      success: true,
      message: 'State current affair created successfully',
      data: populatedAffair,
    });
  } catch (error) {
    console.error('Error creating state current affair:', error);

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'State current affair with this title already exists',
        error: error.message,
      });
    }

    if (error.name === 'ValidationError') {
      const errors = {};
      Object.keys(error.errors).forEach((key) => {
        errors[key] = error.errors[key].message;
      });
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors,
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Failed to create state current affair',
      error: error.message,
    });
  }
};


// Get all state current affairs
exports.listStateCurrentAffairs = async (req, res) => {
  try {
    const { state, event, date } = req.query;
    const filter = { isActive: true };

    if (state) filter.state = state;
    if (event) filter.event = event;
    if (date) filter.date = date;

    const docs = await StateCurrentAffair.find(filter)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .sort({ date: -1 });

    return res.status(200).json({ 
      success: true,
      data: docs 
    });
  } catch (error) {
    console.error('Error listing state current affairs:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Get single state current affair by ID
exports.getStateCurrentAffairById = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await StateCurrentAffair.findOne({
      _id: id,
      isActive: true
    })
    .populate('categories', 'name slug')
    .populate('subCategories', 'name slug')
    .populate('languages', 'name code');

    if (!doc) {
      return res.status(404).json({ 
        success: false,
        message: 'State current affair not found' 
      });
    }

    return res.status(200).json({ 
      success: true,
      data: doc 
    });
  } catch (error) {
    console.error('Error fetching state current affair:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// Update state current affair
exports.updateStateCurrentAffair = async (req, res) => {
  try {
    const { id } = req.params;
    let payload;

    try {
      payload = parseAffairPayload(req);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON in affair field',
        error: e.message,
      });
    }

    // Map the IDs properly
    const updates = {};
    if (payload.date) updates.date = payload.date;
    if (payload.categoryIds) updates.categories = payload.categoryIds;
    if (payload.subCategoryIds) updates.subCategories = payload.subCategoryIds;
    if (payload.languageIds) updates.languages = payload.languageIds;
    if (payload.state) updates.state = payload.state;
    if (payload.name) updates.name = payload.name;
    if (payload.description !== undefined) updates.description = payload.description;
    if (payload.fullContent !== undefined) updates.fullContent = payload.fullContent;
    if (payload.isActive !== undefined) updates.isActive = payload.isActive;

    const thumbnailUrl = await handleThumbnailUpload(
      req,
      'brainbuzz/current-affairs/state/thumbnails'
    );
    if (thumbnailUrl) updates.thumbnailUrl = thumbnailUrl;

    const updatedAffair = await StateCurrentAffair.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    if (!updatedAffair) {
      return res.status(404).json({
        success: false,
        message: 'State current affair not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'State current affair updated successfully',
      data: updatedAffair,
    });
  } catch (error) {
    console.error('Error updating state current affair:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to update state current affair',
      error: error.message,
    });
  }
};


// Delete state current affair (soft delete)
exports.deleteStateCurrentAffair = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedAffair = await StateCurrentAffair.findByIdAndUpdate(
      id,
      { $set: { isActive: false } },
      { new: true }
    );

    if (!deletedAffair) {
      return res.status(404).json({ 
        success: false,
        message: 'State current affair not found' 
      });
    }

    return res.status(200).json({ 
      success: true,
      message: 'State current affair deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting state current affair:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error.message 
    });
  }
};

// In src/controllers/User/currentAffairsController.js

// Add these functions before module.exports

// International Current Affairs
exports.createInternationalCurrentAffair = async (req, res) => {
  try {
    let payload;
    try {
      payload = parseAffairPayload(req);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON in affair field',
        error: e.message,
      });
    }

    // Extract fields with defaults
    const { 
      categoryIds = [],
      subCategoryIds = [],
      languageIds = [],
      description,
      fullContent,
      isActive,
      date,
      region,
      name
    } = payload;

    // Validate that only one language is selected (best practice)
    if (languageIds && languageIds.length > 1) {
      return res.status(400).json({
        success: false,
        message: 'Only one language should be selected per content entry (best practice)',
      });
    }

    // Validate required fields
    if (!region) {
      return res.status(400).json({
        success: false,
        message: 'Region is required',
      });
    }
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      });
    }

    let thumbnailUrl;
    try {
      thumbnailUrl = await handleThumbnailUpload(
        req,
        'brainbuzz/current-affairs/international/thumbnails'
      );
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload thumbnail',
        error: error.message,
      });
    }

    const doc = await InternationalCurrentAffair.create({
      categories: categoryIds,
      subCategories: subCategoryIds,
      languages: languageIds,
      description,
      fullContent,
      thumbnailUrl,
      isActive: typeof isActive !== 'undefined' ? isActive : true,
      date,
      region,
      name
    });

    // Populate the response with related data
    const populatedAffair = await InternationalCurrentAffair.findById(doc._id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    return res.status(201).json({
      success: true,
      message: 'International current affair created successfully',
      data: populatedAffair,
    });
  } catch (error) {
    console.error('Error creating international current affair:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create international current affair',
      error: error.message,
    });
  }
};

exports.listInternationalCurrentAffairs = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const query = { isActive: true };

    const affairs = await InternationalCurrentAffair.find(query)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await InternationalCurrentAffair.countDocuments(query);

    return res.json({
      success: true,
      data: affairs,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error listing international current affairs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch international current affairs',
      error: error.message
    });
  }
};

// Add other functions (getById, update, delete) following the same pattern
// Get International Current Affair by ID
exports.getInternationalCurrentAffairById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const affair = await InternationalCurrentAffair.findOne({
      _id: id,
      isActive: true
    })
    .populate('categories', 'name slug')
    .populate('subCategories', 'name slug')
    .populate('languages', 'name code');

    if (!affair) {
      return res.status(404).json({
        success: false,
        message: 'International current affair not found'
      });
    }

    return res.json({
      success: true,
      data: affair
    });
  } catch (error) {
    console.error('Error getting international current affair:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch international current affair',
      error: error.message
    });
  }
};

// Update International Current Affair
exports.updateInternationalCurrentAffair = async (req, res) => {
  try {
    const { id } = req.params;
    let payload;

    try {
      payload = parseAffairPayload(req);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON in affair field',
        error: e.message,
      });
    }

    // Map the IDs properly
    const updates = {};
    if (payload.date) updates.date = payload.date;
    if (payload.categoryIds) updates.categories = payload.categoryIds;
    if (payload.subCategoryIds) updates.subCategories = payload.subCategoryIds;
    if (payload.languageIds) updates.languages = payload.languageIds;
    if (payload.region) updates.region = payload.region;
    if (payload.name) updates.name = payload.name;
    if (payload.description !== undefined) updates.description = payload.description;
    if (payload.fullContent !== undefined) updates.fullContent = payload.fullContent;
    if (payload.isActive !== undefined) updates.isActive = payload.isActive;

    const thumbnailUrl = await handleThumbnailUpload(
      req,
      'brainbuzz/current-affairs/international/thumbnails'
    );
    if (thumbnailUrl) updates.thumbnailUrl = thumbnailUrl;

    const doc = await InternationalCurrentAffair.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'International current affair not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'International current affair updated successfully',
      data: doc,
    });
  } catch (error) {
    console.error('Error updating international current affair:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update international current affair',
      error: error.message,
    });
  }
};

// Delete International Current Affair (soft delete)
exports.deleteInternationalCurrentAffair = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedAffair = await InternationalCurrentAffair.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!deletedAffair) {
      return res.status(404).json({
        success: false,
        message: 'International current affair not found'
      });
    }

    return res.json({
      success: true,
      message: 'International current affair deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting international current affair:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete international current affair',
      error: error.message
    });
  }
};

// ==================== POLITICS CURRENT AFFAIRS ====================

// Create Politics Current Affair
// Politics Current Affairs
exports.createPoliticsCurrentAffair = async (req, res) => {
  try {
    let payload;
    try {
      payload = parseAffairPayload(req);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON in affair field',
        error: e.message,
      });
    }

    // Extract fields with defaults
    const { 
      categoryIds = [],
      subCategoryIds = [],
      languageIds = [],
      description,
      fullContent,
      isActive,
      date,
      name,
      politicalParty
    } = payload;

    // Validate that only one language is selected (best practice)
    if (languageIds && languageIds.length > 1) {
      return res.status(400).json({
        success: false,
        message: 'Only one language should be selected per content entry (best practice)',
      });
    }

    // Validate required field
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      });
    }

    let thumbnailUrl;
    try {
      thumbnailUrl = await handleThumbnailUpload(
        req,
        'brainbuzz/current-affairs/politics/thumbnails'
      );
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload thumbnail',
        error: error.message,
      });
    }

    const doc = await PoliticsCurrentAffair.create({
      categories: categoryIds,
      subCategories: subCategoryIds,
      languages: languageIds,
      description,
      fullContent,
      thumbnailUrl,
      isActive: typeof isActive !== 'undefined' ? isActive : true,
      date,
      name,
      politicalParty
    });

    // Populate the response with related data
    const populatedAffair = await PoliticsCurrentAffair.findById(doc._id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    return res.status(201).json({
      success: true,
      message: 'Politics current affair created successfully',
      data: populatedAffair,
    });
  } catch (error) {
    console.error('Error creating politics current affair:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create politics current affair',
      error: error.message,
    });
  }
};

// List Politics Current Affairs
exports.listPoliticsCurrentAffairs = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const query = { isActive: true };

    const affairs = await PoliticsCurrentAffair.find(query)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await PoliticsCurrentAffair.countDocuments(query);

    return res.json({
      success: true,
      data: affairs,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error listing politics current affairs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch politics current affairs',
      error: error.message
    });
  }
};

// Get Politics Current Affair by ID
exports.getPoliticsCurrentAffairById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const affair = await PoliticsCurrentAffair.findOne({
      _id: id,
      isActive: true
    })
    .populate('categories', 'name slug')
    .populate('subCategories', 'name slug')
    .populate('languages', 'name code');

    if (!affair) {
      return res.status(404).json({
        success: false,
        message: 'Politics current affair not found'
      });
    }

    return res.json({
      success: true,
      data: affair
    });
  } catch (error) {
    console.error('Error getting politics current affair:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch politics current affair',
      error: error.message
    });
  }
};

// Update Politics Current Affair
exports.updatePoliticsCurrentAffair = async (req, res) => {
  try {
    const { id } = req.params;
    let payload;

    try {
      payload = parseAffairPayload(req);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON in affair field',
        error: e.message,
      });
    }

    // Map the IDs properly
    const updates = {};
    if (payload.date) updates.date = payload.date;
    if (payload.categoryIds) updates.categories = payload.categoryIds;
    if (payload.subCategoryIds) updates.subCategories = payload.subCategoryIds;
    if (payload.languageIds) updates.languages = payload.languageIds;
    if (payload.name) updates.name = payload.name;
    if (payload.politicalParty) updates.politicalParty = payload.politicalParty;
    if (payload.description !== undefined) updates.description = payload.description;
    if (payload.fullContent !== undefined) updates.fullContent = payload.fullContent;
    if (payload.isActive !== undefined) updates.isActive = payload.isActive;

    const thumbnailUrl = await handleThumbnailUpload(
      req,
      'brainbuzz/current-affairs/politics/thumbnails'
    );
    if (thumbnailUrl) updates.thumbnailUrl = thumbnailUrl;

    const doc = await PoliticsCurrentAffair.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Politics current affair not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Politics current affair updated successfully',
      data: doc,
    });
  } catch (error) {
    console.error('Error updating politics current affair:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update politics current affair',
      error: error.message,
    });
  }
};

// Delete Politics Current Affair (soft delete)
exports.deletePoliticsCurrentAffair = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedAffair = await PoliticsCurrentAffair.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!deletedAffair) {
      return res.status(404).json({
        success: false,
        message: 'Politics current affair not found'
      });
    }

    return res.json({
      success: true,
      message: 'Politics current affair deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting politics current affair:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete politics current affair',
      error: error.message
    });
  }
};

// ==================== LOCAL CURRENT AFFAIRS ====================

// Create Local Current Affair
// Local Current Affairs
exports.createLocalCurrentAffair = async (req, res) => {
  try {
    let payload;
    try {
      payload = parseAffairPayload(req);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON in affair field',
        error: e.message,
      });
    }

    // Extract fields with defaults
    const { 
      categoryIds = [],
      subCategoryIds = [],
      languageIds = [],
      description,
      fullContent,
      isActive,
      date,
      name,
      location
    } = payload;

    // Validate that only one language is selected (best practice)
    if (languageIds && languageIds.length > 1) {
      return res.status(400).json({
        success: false,
        message: 'Only one language should be selected per content entry (best practice)',
      });
    }

    // Validate required fields
    if (!location) {
      return res.status(400).json({
        success: false,
        message: 'Location is required',
      });
    }
    
    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Name is required',
      });
    }

    let thumbnailUrl;
    try {
      thumbnailUrl = await handleThumbnailUpload(
        req,
        'brainbuzz/current-affairs/local/thumbnails'
      );
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to upload thumbnail',
        error: error.message,
      });
    }

    const doc = await LocalCurrentAffair.create({
      categories: categoryIds,
      subCategories: subCategoryIds,
      languages: languageIds,
      description,
      fullContent,
      thumbnailUrl,
      isActive: typeof isActive !== 'undefined' ? isActive : true,
      date,
      name,
      location
    });

    // Populate the response with related data
    const populatedAffair = await LocalCurrentAffair.findById(doc._id)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    return res.status(201).json({
      success: true,
      message: 'Local current affair created successfully',
      data: populatedAffair,
    });
  } catch (error) {
    console.error('Error creating local current affair:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create local current affair',
      error: error.message,
    });
  }
};

// List Local Current Affairs
exports.listLocalCurrentAffairs = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const query = { isActive: true };

    const affairs = await LocalCurrentAffair.find(query)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const count = await LocalCurrentAffair.countDocuments(query);

    return res.json({
      success: true,
      data: affairs,
      totalPages: Math.ceil(count / limit),
      currentPage: page
    });
  } catch (error) {
    console.error('Error listing local current affairs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch local current affairs',
      error: error.message
    });
  }
};

// Get Local Current Affair by ID
exports.getLocalCurrentAffairById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const affair = await LocalCurrentAffair.findOne({
      _id: id,
      isActive: true
    })
    .populate('categories', 'name slug')
    .populate('subCategories', 'name slug')
    .populate('languages', 'name code');

    if (!affair) {
      return res.status(404).json({
        success: false,
        message: 'Local current affair not found'
      });
    }

    return res.json({
      success: true,
      data: affair
    });
  } catch (error) {
    console.error('Error getting local current affair:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch local current affair',
      error: error.message
    });
  }
};

// Update Local Current Affair
exports.updateLocalCurrentAffair = async (req, res) => {
  try {
    const { id } = req.params;
    let payload;

    try {
      payload = parseAffairPayload(req);
    } catch (e) {
      return res.status(400).json({
        success: false,
        message: 'Invalid JSON in affair field',
        error: e.message,
      });
    }

    // Map the IDs properly
    const updates = {};
    if (payload.date) updates.date = payload.date;
    if (payload.categoryIds) updates.categories = payload.categoryIds;
    if (payload.subCategoryIds) updates.subCategories = payload.subCategoryIds;
    if (payload.languageIds) updates.languages = payload.languageIds;
    if (payload.name) updates.name = payload.name;
    if (payload.location) updates.location = payload.location;
    if (payload.description !== undefined) updates.description = payload.description;
    if (payload.fullContent !== undefined) updates.fullContent = payload.fullContent;
    if (payload.isActive !== undefined) updates.isActive = payload.isActive;

    const thumbnailUrl = await handleThumbnailUpload(
      req,
      'brainbuzz/current-affairs/local/thumbnails'
    );
    if (thumbnailUrl) updates.thumbnailUrl = thumbnailUrl;

    const doc = await LocalCurrentAffair.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: 'Local current affair not found',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Local current affair updated successfully',
      data: doc,
    });
  } catch (error) {
    console.error('Error updating local current affair:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update local current affair',
      error: error.message,
    });
  }
};

// Delete Local Current Affair (soft delete)
exports.deleteLocalCurrentAffair = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedAffair = await LocalCurrentAffair.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!deletedAffair) {
      return res.status(404).json({
        success: false,
        message: 'Local current affair not found'
      });
    }

    return res.json({
      success: true,
      message: 'Local current affair deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting local current affair:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete local current affair',
      error: error.message
    });
  }
};

// -------- Filter Helper APIs --------

// Step 1: Get all categories that have current affairs
exports.getCategoriesWithCurrentAffairs = async (req, res) => {
  try {
    // Get unique category IDs from all current affairs
    const categoryIds = await CurrentAffair.distinct('categories', { isActive: true });
    
    const categories = await Category.find({
      _id: { $in: categoryIds },
      isActive: true
    }).select('name slug thumbnailUrl');

    return res.status(200).json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories with current affairs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: error.message
    });
  }
};

// Step 2: Get subcategories and languages for a category
exports.getSubCategoriesAndLanguagesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Get unique subcategory and language IDs for this category
    const currentAffairsInCategory = await CurrentAffair.find({
      categories: categoryId,
      isActive: true
    }).select('subCategories languages');

    const subCategoryIds = new Set();
    const languageIds = new Set();

    currentAffairsInCategory.forEach(affair => {
      affair.subCategories.forEach(id => subCategoryIds.add(id.toString()));
      affair.languages.forEach(id => languageIds.add(id.toString()));
    });

    const [subCategories, languages] = await Promise.all([
      SubCategory.find({
        _id: { $in: Array.from(subCategoryIds) },
        isActive: true
      }).select('name slug thumbnailUrl category'),
      Language.find({
        _id: { $in: Array.from(languageIds) },
        isActive: true
      }).select('name code')
    ]);

    return res.status(200).json({
      success: true,
      data: {
        subCategories,
        languages
      }
    });
  } catch (error) {
    console.error('Error fetching subcategories and languages:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch subcategories and languages',
      error: error.message
    });
  }
};

// Step 2b: Get subcategories for a category (defaults to English)
exports.getSubCategoriesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Get English language ID (default)
    const englishLanguage = await Language.findOne({ code: 'en' }).select('_id');
    
    if (!englishLanguage) {
      return res.status(404).json({
        success: false,
        message: 'English language not found. Please create a language with code "en"'
      });
    }

    // Find current affairs matching category and English language
    const currentAffairsInCategoryAndLanguage = await CurrentAffair.find({
      categories: categoryId,
      languages: englishLanguage._id,
      isActive: true
    }).select('subCategories');

    const subCategoryIds = new Set();
    currentAffairsInCategoryAndLanguage.forEach(affair => {
      affair.subCategories.forEach(id => subCategoryIds.add(id.toString()));
    });

    const subCategories = await SubCategory.find({
      _id: { $in: Array.from(subCategoryIds) },
      isActive: true
    }).select('name slug thumbnailUrl category');

    return res.status(200).json({
      success: true,
      data: subCategories,
      defaultLanguage: 'en'
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch subcategories',
      error: error.message
    });
  }
};

// Step 2c: Get subcategories for a category filtered by language
exports.getSubCategoriesByLanguage = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { lang } = req.query; // Using 'lang' query param with language code

    if (!lang) {
      return res.status(400).json({
        success: false,
        message: 'Language code is required (e.g., lang=en, lang=te, lang=hi)'
      });
    }

    // Find language by code
    const language = await Language.findOne({ code: lang }).select('_id');
    
    if (!language) {
      return res.status(404).json({
        success: false,
        message: `Language with code "${lang}" not found`
      });
    }

    // Find current affairs matching category and language
    const currentAffairsInCategoryAndLanguage = await CurrentAffair.find({
      categories: categoryId,
      languages: language._id,
      isActive: true
    }).select('subCategories');

    const subCategoryIds = new Set();
    currentAffairsInCategoryAndLanguage.forEach(affair => {
      affair.subCategories.forEach(id => subCategoryIds.add(id.toString()));
    });

    const subCategories = await SubCategory.find({
      _id: { $in: Array.from(subCategoryIds) },
      isActive: true
    }).select('name slug thumbnailUrl category');

    return res.status(200).json({
      success: true,
      data: subCategories,
      language: lang
    });
  } catch (error) {
    console.error('Error fetching subcategories by language:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch subcategories',
      error: error.message
    });
  }
};

// Step 3: Get current affairs with advanced filters
exports.getFilteredCurrentAffairs = async (req, res) => {
  try {
    const { categoryId, subCategoryId, lang, affairType, page = 1, limit = 20 } = req.query;

    const filter = { isActive: true };

    if (categoryId) filter.categories = categoryId;
    if (subCategoryId) filter.subCategories = subCategoryId;
    if (affairType) filter.affairType = affairType;
    
    // If language code is provided, convert to language ID
    if (lang) {
      const language = await Language.findOne({ code: lang }).select('_id');
      if (!language) {
        return res.status(404).json({
          success: false,
          message: `Language with code "${lang}" not found`
        });
      }
      filter.languages = language._id;
    }

    const skip = (page - 1) * limit;

    const [affairs, total] = await Promise.all([
      CurrentAffair.find(filter)
        .populate('categories', 'name slug')
        .populate('subCategories', 'name slug')
        .populate('languages', 'name code')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      CurrentAffair.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      data: affairs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching filtered current affairs:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch current affairs',
      error: error.message
    });
  }
};

// Get available affair types for filters
exports.getAvailableAffairTypes = async (req, res) => {
  try {
    const { categoryId, subCategoryId, lang } = req.query;
    
    const filter = { isActive: true };
    if (categoryId) filter.categories = categoryId;
    if (subCategoryId) filter.subCategories = subCategoryId;
    
    // If language code is provided, convert to language ID
    if (lang) {
      const language = await Language.findOne({ code: lang }).select('_id');
      if (!language) {
        return res.status(404).json({
          success: false,
          message: `Language with code "${lang}" not found`
        });
      }
      filter.languages = language._id;
    }

    const affairTypes = await CurrentAffair.distinct('affairType', filter);

    const typeMapping = {
      'LatestCurrentAffair': { name: 'Latest', value: 'LatestCurrentAffair' },
      'MonthlyCurrentAffair': { name: 'Monthly', value: 'MonthlyCurrentAffair' },
      'SportsCurrentAffair': { name: 'Sports', value: 'SportsCurrentAffair' },
      'StateCurrentAffair': { name: 'State', value: 'StateCurrentAffair' },
      'InternationalCurrentAffair': { name: 'International', value: 'InternationalCurrentAffair' },
      'PoliticsCurrentAffair': { name: 'Politics', value: 'PoliticsCurrentAffair' },
      'LocalCurrentAffair': { name: 'Local', value: 'LocalCurrentAffair' }
    };

    const availableTypes = affairTypes
      .filter(type => typeMapping[type])
      .map(type => typeMapping[type]);

    return res.status(200).json({
      success: true,
      data: availableTypes
    });
  } catch (error) {
    console.error('Error fetching affair types:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch affair types',
      error: error.message
    });
  }
};