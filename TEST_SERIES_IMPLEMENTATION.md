# Test Series Implementation Documentation

This document provides a comprehensive overview of the Test Series implementation in the Brain Buzz application, covering everything from data models to API endpoints and business logic.

## Table of Contents
1. [Overview](#overview)
2. [Data Models](#data-models)
   - [Test Series Model](#test-series-model)
   - [Test Series Purchase Model](#test-series-purchase-model)
3. [API Endpoints](#api-endpoints)
   - [Admin Routes](#admin-routes)
   - [User/Public Routes](#userpublic-routes)
4. [Business Logic](#business-logic)
   - [Creating Test Series](#creating-test-series)
   - [Managing Tests Within Series](#managing-tests-within-series)
   - [Handling Purchases](#handling-purchases)
   - [Access Control](#access-control)
5. [Implementation Details](#implementation-details)
   - [Discount System](#discount-system)
   - [Content Structure](#content-structure)
   - [Media Handling](#media-handling)

## Overview

The Test Series feature in Brain Buzz allows administrators to create structured collections of practice tests for users to purchase and take. Each Test Series can contain multiple tests, and each test can have multiple sections with questions. The system includes features for pricing, discounts, access control, and media management.

## Data Models

### Test Series Model

The Test Series model is defined in `src/models/TestSeries/TestSeries.js` and consists of several nested schemas:

#### Main Test Series Schema
```javascript
{
  contentType: { type: String, default: 'TEST_SERIES', immutable: true },
  date: Date,
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  subCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SubCategory' }],
  thumbnail: String,
  name: { type: String, required: true },
  maxTests: { type: Number, required: true },
  description: String,
  price: { type: Number, required: true, default: 0, min: 0 },
  discount: {
    type: { type: String, enum: ['percentage', 'fixed', null], default: null },
    value: { type: Number, min: 0, default: 0 },
    validUntil: { type: Date, default: null }
  },
  tests: [testSchema],
  isActive: { type: Boolean, default: true }
}
```

#### Test Schema
Each Test Series contains an array of tests with the following structure:
```javascript
{
  testName: { type: String, required: true },
  noOfQuestions: Number,
  totalMarks: Number,
  positiveMarks: Number,
  negativeMarks: Number,
  date: Date,
  startTime: Date,
  endTime: Date,
  instructionsPage1: String,
  instructionsPage2: String,
  instructionsPage3: String,
  totalExplanationVideoUrl: String,
  sections: [sectionSchema]
}
```

#### Section Schema
Each test contains sections with questions:
```javascript
{
  title: { type: String, required: true },
  order: Number,
  noOfQuestions: Number,
  questions: [questionSchema]
}
```

#### Question Schema
Each section contains questions:
```javascript
{
  questionNumber: Number,
  questionText: { type: String, required: true },
  options: [String],
  correctOptionIndex: Number,
  explanation: String,
  marks: { type: Number, default: 1 },
  negativeMarks: { type: Number, default: 0 }
}
```

### Test Series Purchase Model

Defined in `src/models/TestSeries/TestSeriesPurchase.js`, this model tracks user purchases:

```javascript
{
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  testSeries: { type: mongoose.Schema.Types.ObjectId, ref: 'TestSeries', required: true },
  amount: { type: Number, required: true },
  paymentId: { type: String, required: true, unique: true },
  purchaseDate: { type: Date, default: Date.now },
  expiryDate: { type: Date, required: true },
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
  coupon: {
    code: String,
    discountAmount: Number
  }
}
```

## API Endpoints

### Admin Routes

All admin routes are protected by authentication middleware and defined in `src/routes/Admin/testSeriesRoutes.js`:

#### Basic CRUD Operations
- `POST /` - Create a new Test Series
- `GET /` - List all Test Series with filtering options
- `GET /:id` - Get a specific Test Series
- `GET /:id/full` - Get complete Test Series with all nested data
- `PUT /:id` - Update a Test Series
- `DELETE /:id` - Delete a Test Series

#### Test Management
- `POST /:seriesId/tests` - Add a test to a series
- `GET /:seriesId/tests/:testId` - Get a specific test from a series
- `PUT /:seriesId/tests/:testId` - Update a test in a series
- `DELETE /:seriesId/tests/:testId` - Delete a test from a series

#### Test Instructions
- `PUT /:seriesId/tests/:testId/instructions` - Update test instructions

#### Media Management
- `POST /:seriesId/tests/:testId/explanation-video` - Upload test explanation video

#### Section Management
- `POST /:seriesId/tests/:testId/sections` - Add a section to a test
- `PUT /:seriesId/tests/:testId/sections/:sectionId` - Update a section in a test
- `DELETE /:seriesId/tests/:testId/sections/:sectionId` - Delete a section from a test

#### Question Management
- `POST /:seriesId/tests/:testId/sections/:sectionId/questions` - Add questions to a section
- `PUT /:seriesId/tests/:testId/sections/:sectionId/questions/:questionId` - Update a question in a section
- `DELETE /:seriesId/tests/:testId/sections/:sectionId/questions/:questionId` - Delete a question from a section

### User/Public Routes

Defined in `src/routes/User/testSeriesRoutes.js`, these routes provide public access to Test Series with access control:

- `GET /` - List all active Test Series (public access)
- `GET /:seriesId` - Get details of a specific Test Series (public access)
- `GET /public/:seriesId/tests/:testId` - Get basic test details without authentication
- `GET /:seriesId/tests/:testId` - Get complete test details (requires authentication)

## Business Logic

### Creating Test Series

The process of creating a Test Series involves:

1. **Validation**: Ensuring required fields like `name` and `maxTests` are provided
2. **Discount Processing**: Validating discount information if provided
3. **Thumbnail Upload**: Uploading and storing thumbnail image if provided
4. **Database Creation**: Saving the Test Series document to MongoDB

Key validation rules:
- `maxTests` must be greater than 0
- Price cannot be negative
- Discount values must be valid (percentages ≤ 100%, future expiration dates)

### Managing Tests Within Series

Test Series can contain multiple tests, managed through nested operations:

1. **Adding Tests**: Checks against `maxTests` limit before adding
2. **Updating Tests**: Allows modification of all test properties
3. **Deleting Tests**: Removes tests from the series
4. **Section Management**: Tests can have multiple sections for organizing questions
5. **Question Management**: Sections contain questions with options and explanations

### Handling Purchases

Purchase handling is managed through the `PurchaseService` in `services/purchaseService.js`:

1. **Initiating Purchase**: Creates a pending purchase record with payment ID
2. **Coupon Validation**: Applies and validates discount codes
3. **Payment Verification**: Verifies payment completion with payment gateway
4. **Access Granting**: Updates purchase status to "completed" upon successful payment
5. **Expiry Management**: Sets 1-year expiry date for purchases

### Access Control

Access to Test Series content is controlled through:

1. **Series-Level Access**: Users must purchase a Test Series to access its content
2. **Content Tiering**: Different levels of information shown based on purchase status:
   - Unauthenticated users: Basic series information and test lists
   - Authenticated but unpurchased users: Same as above plus section names
   - Purchased users: Complete test content including questions and explanation videos

## Implementation Details

### Discount System

The discount system supports two types of discounts:
1. **Percentage Discounts**: Applied as a percentage off the total price (≤ 100%)
2. **Fixed Amount Discounts**: Applied as a fixed amount off the total price

Discounts have:
- Expiration dates
- Validation for future dates only
- Proper calculation logic in the `finalPrice` virtual property

### Content Structure

The hierarchical structure of Test Series content:
```
Test Series
├── Tests (limited by maxTests)
    ├── Sections (unlimited per test)
        └── Questions (limited by section's noOfQuestions if set)
```

This structure allows for flexible organization of educational content while maintaining reasonable limits.

### Media Handling

Media handling includes:
1. **Thumbnail Images**: Stored for each Test Series
2. **Explanation Videos**: 
   - Overall test explanation videos
   - Individual question explanation videos (planned)
3. **Cloudinary Integration**: All media uploaded to Cloudinary for reliable storage and delivery

## Conclusion

The Test Series implementation provides a comprehensive system for creating, managing, and selling educational tests. It includes robust access control, flexible content organization, media management, and a complete purchase workflow. The modular design allows for easy extension and maintenance.