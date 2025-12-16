const CurrentAffairsCategory = require('../../models/CurrentAffairs/CurrentAffairsCategory');
const cloudinary = require('../../config/cloudinary');

const uploadToCloudinary = (fileBuffer, folder) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (error, result) => {
      if (error) {
        return reject(error);
      }
      resolve(result);
    });

    stream.end(fileBuffer);
  });
};

// Create a new Current Affairs Category
exports.createCategory = async (req, res) => {
  try {
    const { name, description, order, isActive } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Name is required' });
    }

    // Check if category with this name already exists
    const existing = await CurrentAffairsCategory.findOne({ 
      slug: name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-+|-+$/g, '')
    });
    
    if (existing) {
      return res.status(400).json({ message: 'Category with this name already exists' });
    }

    let thumbnailUrl;
    if (req.file && req.file.buffer) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        'brainbuzz/current-affairs/categories/thumbnails'
      );
      thumbnailUrl = uploadResult.secure_url;
    }

    const category = await CurrentAffairsCategory.create({
      name,
      description,
      order: order || 0,
      isActive: typeof isActive !== 'undefined' ? isActive : true,
      thumbnailUrl,
    });

    return res.status(201).json({
      message: 'Current Affairs Category created successfully',
      data: category,
    });
  } catch (error) {
    console.error('Error creating Current Affairs category:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all Current Affairs Categories
exports.getCategories = async (req, res) => {
  try {
    const { isActive } = req.query;
    
    const filter = {};
    
    if (typeof isActive !== 'undefined') {
      filter.isActive = isActive === 'true';
    }
    
    const categories = await CurrentAffairsCategory.find(filter).sort({ order: 1, createdAt: -1 });
    return res.status(200).json({ data: categories });
  } catch (error) {
    console.error('Error fetching Current Affairs categories:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get Current Affairs Category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await CurrentAffairsCategory.findById(id);
    if (!category) {
      return res.status(404).json({ message: 'Current Affairs Category not found' });
    }

    return res.status(200).json({ data: category });
  } catch (error) {
    console.error('Error fetching Current Affairs category:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update Current Affairs Category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, order, isActive } = req.body;

    const updates = {};

    if (name) {
      // Check if another category with same name exists
      const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-+|-+$/g, '');
      const existing = await CurrentAffairsCategory.findOne({ slug, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ message: 'Category with this name already exists' });
      }
      updates.name = name;
    }

    if (typeof description !== 'undefined') updates.description = description;
    if (typeof order !== 'undefined') updates.order = order;
    if (typeof isActive !== 'undefined') updates.isActive = isActive;

    if (req.file && req.file.buffer) {
      const uploadResult = await uploadToCloudinary(
        req.file.buffer,
        'brainbuzz/current-affairs/categories/thumbnails'
      );
      updates.thumbnailUrl = uploadResult.secure_url;
    }

    const category = await CurrentAffairsCategory.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!category) {
      return res.status(404).json({ message: 'Current Affairs Category not found' });
    }

    return res.status(200).json({
      message: 'Current Affairs Category updated successfully',
      data: category,
    });
  } catch (error) {
    console.error('Error updating Current Affairs category:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete Current Affairs Category (soft delete)
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await CurrentAffairsCategory.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );
    
    if (!category) {
      return res.status(404).json({ message: 'Current Affairs Category not found' });
    }

    return res.status(200).json({ message: 'Current Affairs Category deactivated successfully' });
  } catch (error) {
    console.error('Error deleting Current Affairs category:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Toggle Current Affairs Category status
exports.toggleCategoryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const category = await CurrentAffairsCategory.findByIdAndUpdate(
      id,
      { isActive },
      { new: true }
    );

    if (!category) {
      return res.status(404).json({ message: 'Current Affairs Category not found' });
    }

    return res.status(200).json({
      message: `Current Affairs Category ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: category,
    });
  } catch (error) {
    console.error('Error toggling Current Affairs category status:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};