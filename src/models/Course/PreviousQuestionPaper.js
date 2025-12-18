const mongoose = require('mongoose');

const previousQuestionPaperSchema = new mongoose.Schema(
  {
    contentType: {
      type: String,
      default: 'PYQ_EBOOK'
    },

    categoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true
    },

    subCategoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubCategory',
      required: true
    },

    paperCategory: {
      type: String,
      enum: ['EXAM', 'LATEST'],
      required: true
    },

    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      default: null
    },

    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      default: null
    },

    date: {
      type: Date,
      required: true
    },

    thumbnailUrl: String,

    description: String,

    fileUrl: {
      type: String,
      required: true
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model(
  'PreviousQuestionPaper',
  previousQuestionPaperSchema
);