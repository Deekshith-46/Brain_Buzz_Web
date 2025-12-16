const CurrentAffair = require('../../models/CurrentAffairs/CurrentAffairBase');
const Category = require('../../models/Course/Category');
const SubCategory = require('../../models/Course/SubCategory');
const Language = require('../../models/Course/Language');

// Public: list all current affairs
exports.listCurrentAffairs = async (req, res) => {
  try {
    const { category, subCategory, language, date, affairType } = req.query;

    const filter = {
      contentType: 'CURRENT_AFFAIRS',
      isActive: true,
    };

    if (category) filter.categories = category;
    if (subCategory) filter.subCategories = subCategory;
    if (language) filter.languages = language;
    if (date) filter.date = date;
    if (affairType) filter.affairType = affairType;

    const docs = await CurrentAffair.find(filter)
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code')
      .sort({ createdAt: -1 });

    const grouped = {
      latest: [],
      monthly: [],
      sports: [],
      state: [],
      international: [],
      politics: [],
      local: [],
    };

    docs.forEach((affair) => {
      switch (affair.affairType) {
        case 'LatestCurrentAffair':
          grouped.latest.push(affair);
          break;
        case 'MonthlyCurrentAffair':
          grouped.monthly.push(affair);
          break;
        case 'SportsCurrentAffair':
          grouped.sports.push(affair);
          break;
        case 'StateCurrentAffair':
          grouped.state.push(affair);
          break;
        case 'InternationalCurrentAffair':
          grouped.international.push(affair);
          break;
        case 'PoliticsCurrentAffair':
          grouped.politics.push(affair);
          break;
        case 'LocalCurrentAffair':
          grouped.local.push(affair);
          break;
        default:
          break;
      }
    });

    return res.status(200).json({ data: grouped });
  } catch (error) {
    console.error('Error listing current affairs:', error);
    return res
      .status(500)
      .json({ message: 'Server error', error: error.message });
  }
};

// Public: get single current affair by id
exports.getCurrentAffairById = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await CurrentAffair.findOne({
      _id: id,
      contentType: 'CURRENT_AFFAIRS',
      isActive: true,
    })
      .populate('categories', 'name slug')
      .populate('subCategories', 'name slug')
      .populate('languages', 'name code');

    if (!doc) {
      return res.status(404).json({ message: 'Current affair not found' });
    }

    return res.status(200).json({ data: doc });
  } catch (error) {
    console.error('Error fetching current affair:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// -------- Public Filter Helper APIs --------

// Step 1: Get all categories that have current affairs (Public)
exports.getCategoriesWithCurrentAffairs = async (req, res) => {
  try {
    // Get unique category IDs from all active current affairs
    const categoryIds = await CurrentAffair.distinct('categories', { 
      contentType: 'CURRENT_AFFAIRS',
      isActive: true 
    });
    
    const categories = await Category.find({
      _id: { $in: categoryIds },
      contentType: 'CURRENT_AFFAIRS',
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

// Step 2: Get available languages for a category (Public)
exports.getLanguagesByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // Get unique language IDs for this category
    const currentAffairsInCategory = await CurrentAffair.find({
      contentType: 'CURRENT_AFFAIRS',
      categories: categoryId,
      isActive: true
    }).select('languages');

    const languageIds = new Set();
    currentAffairsInCategory.forEach(affair => {
      affair.languages.forEach(id => languageIds.add(id.toString()));
    });

    const languages = await Language.find({
      _id: { $in: Array.from(languageIds) },
      isActive: true
    }).select('name code');

    return res.status(200).json({
      success: true,
      data: languages
    });
  } catch (error) {
    console.error('Error fetching languages:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch languages',
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
      contentType: 'CURRENT_AFFAIRS',
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

// Step 3: Get subcategories for a category filtered by language (Public)
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
      contentType: 'CURRENT_AFFAIRS',
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

// Step 4: Get current affairs with filters (Public)
exports.getFilteredCurrentAffairs = async (req, res) => {
  try {
    const { categoryId, subCategoryId, lang, affairType, page = 1, limit = 20 } = req.query;

    const filter = { 
      contentType: 'CURRENT_AFFAIRS',
      isActive: true 
    };

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

// Get available affair types for filters (Public)
exports.getAvailableAffairTypes = async (req, res) => {
  try {
    const { categoryId, subCategoryId, lang } = req.query;
    
    const filter = { 
      contentType: 'CURRENT_AFFAIRS',
      isActive: true 
    };
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
