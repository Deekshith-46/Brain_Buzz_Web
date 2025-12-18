const PreviousQuestionPaper = require('../../models/Course/PreviousQuestionPaper');

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