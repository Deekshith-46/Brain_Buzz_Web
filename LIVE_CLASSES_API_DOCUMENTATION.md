# Live Classes API Documentation

This document provides detailed information about the Live Classes feature implementation, including all API endpoints, request/response formats, and usage examples.

## Table of Contents
1. [Overview](#overview)
2. [Data Model](#data-model)
3. [Admin API Endpoints](#admin-api-endpoints)
4. [User API Endpoints](#user-api-endpoints)
5. [Filtering System](#filtering-system)
6. [API Usage Examples](#api-usage-examples)

## Overview

The Live Classes feature allows administrators to create and manage live classes that users can join at scheduled times. The system includes a three-level filtering system (Category → Language → SubCategory) to help users find relevant content.

## Data Model

### LiveClass Model

```javascript
{
  name: String,           // Required
  description: String,
  thumbnail: String,      // URL to thumbnail image stored in Cloudinary
  videoLink: String,      // Required
  dateTime: Date,         // Required
  categoryId: ObjectId,   // Required, references Category
  subCategoryId: ObjectId, // Required, references SubCategory
  languageId: ObjectId,   // Required, references Language
  isActive: Boolean,      // Default: true
  createdAt: Date,
  updatedAt: Date
}
```

## Admin API Endpoints

All admin endpoints require authentication with a valid admin JWT token.

### Create Live Class
**Endpoint**: `POST /api/admin/live-classes`
**Headers**: 
- Authorization: Bearer `<admin_token>`
- Content-Type: multipart/form-data

**Form Data**:
- `name`: "UPSC Polity Live Class" *(Required)*
- `description`: "Understanding Fundamental Rights"
- `thumbnail`: File upload *(Optional)*
- `videoLink`: "https://youtube.com/live/abcd" *(Required)*
- `dateTime`: "2025-12-25T18:30:00.000Z" *(Required)*
- `categoryId`: "category_object_id" *(Required)*
- `subCategoryId`: "subcategory_object_id" *(Required)*
- `languageId`: "language_object_id" *(Required)*
- `isActive`: true *(Optional, defaults to true)*

**Response**:
```json
{
  "success": true,
  "message": "Live class created successfully",
  "data": {
    "_id": "live_class_id",
    "name": "UPSC Polity Live Class",
    "description": "Understanding Fundamental Rights",
    "thumbnail": "https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/live_classes/thumbnails/abc123.jpg",
    "videoLink": "https://youtube.com/live/abcd",
    "dateTime": "2025-12-25T18:30:00.000Z",
    "categoryId": "category_object_id",
    "subCategoryId": "subcategory_object_id",
    "languageId": "language_object_id",
    "isActive": true,
    "createdAt": "2025-12-12T10:00:00.000Z",
    "updatedAt": "2025-12-12T10:00:00.000Z"
  }
}
```

### Get All Live Classes
**Endpoint**: `GET /api/admin/live-classes?[filters]`
**Headers**: 
- Authorization: Bearer `<admin_token>`

**Query Parameters**:
- `categoryId`: Filter by category
- `subCategoryId`: Filter by subcategory
- `languageId`: Filter by language
- `isActive`: Filter by active status (true/false)

**Response**:
```json
{
  "success": true,
  "message": "Live classes fetched successfully",
  "data": [
    {
      "_id": "live_class_id",
      "name": "UPSC Polity Live Class",
      "description": "Understanding Fundamental Rights",
      "thumbnail": "https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/live_classes/thumbnails/abc123.jpg",
      "videoLink": "https://youtube.com/live/abcd",
      "dateTime": "2025-12-25T18:30:00.000Z",
      "categoryId": {
        "_id": "category_id",
        "name": "UPSC",
        "slug": "upsc"
      },
      "subCategoryId": {
        "_id": "subcategory_id",
        "name": "Polity",
        "slug": "polity"
      },
      "languageId": {
        "_id": "language_id",
        "name": "English",
        "code": "en"
      },
      "isActive": true,
      "createdAt": "2025-12-12T10:00:00.000Z",
      "updatedAt": "2025-12-12T10:00:00.000Z"
    }
  ]
}
```

### Get Live Class by ID
**Endpoint**: `GET /api/admin/live-classes/:id`
**Headers**: 
- Authorization: Bearer `<admin_token>`

**Response**:
```json
{
  "success": true,
  "message": "Live class fetched successfully",
  "data": {
    "_id": "live_class_id",
    "name": "UPSC Polity Live Class",
    "description": "Understanding Fundamental Rights",
    "thumbnail": "https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/live_classes/thumbnails/abc123.jpg",
    "videoLink": "https://youtube.com/live/abcd",
    "dateTime": "2025-12-25T18:30:00.000Z",
    "categoryId": {
      "_id": "category_id",
      "name": "UPSC",
      "slug": "upsc"
    },
    "subCategoryId": {
      "_id": "subcategory_id",
      "name": "Polity",
      "slug": "polity"
    },
    "languageId": {
      "_id": "language_id",
      "name": "English",
      "code": "en"
    },
    "isActive": true,
    "createdAt": "2025-12-12T10:00:00.000Z",
    "updatedAt": "2025-12-12T10:00:00.000Z"
  }
}
```

### Update Live Class
**Endpoint**: `PUT /api/admin/live-classes/:id`
**Headers**: 
- Authorization: Bearer `<admin_token>`
- Content-Type: multipart/form-data

**Form Data** (partial updates supported):
- `name`: "Updated UPSC Polity Live Class"
- `dateTime`: "2025-12-26T18:30:00.000Z"
- `thumbnail`: File upload *(Optional - if provided, replaces existing thumbnail)*

**Response**:
```json
{
  "success": true,
  "message": "Live class updated successfully",
  "data": {
    "_id": "live_class_id",
    "name": "Updated UPSC Polity Live Class",
    "description": "Understanding Fundamental Rights",
    "thumbnail": "https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/live_classes/thumbnails/new_thumbnail.jpg",
    "videoLink": "https://youtube.com/live/abcd",
    "dateTime": "2025-12-26T18:30:00.000Z",
    "categoryId": {
      "_id": "category_id",
      "name": "UPSC",
      "slug": "upsc"
    },
    "subCategoryId": {
      "_id": "subcategory_id",
      "name": "Polity",
      "slug": "polity"
    },
    "languageId": {
      "_id": "language_id",
      "name": "English",
      "code": "en"
    },
    "isActive": true,
    "createdAt": "2025-12-12T10:00:00.000Z",
    "updatedAt": "2025-12-12T11:00:00.000Z"
  }
}
```

### Delete Live Class
**Endpoint**: `DELETE /api/admin/live-classes/:id`
**Headers**: 
- Authorization: Bearer `<admin_token>`

**Response**:
```json
{
  "success": true,
  "message": "Live class deleted successfully"
}
```

### Toggle Live Class Status
**Endpoint**: `PATCH /api/admin/live-classes/:id/status`
**Headers**: 
- Authorization: Bearer `<admin_token>`
- Content-Type: application/json

**Request Body**:
```json
{
  "isActive": false
}
```

**Response**:
```json
{
  "success": true,
  "message": "Live class deactivated successfully",
  "data": {
    "_id": "live_class_id",
    "name": "UPSC Polity Live Class",
    "description": "Understanding Fundamental Rights",
    "thumbnail": "https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/live_classes/thumbnails/abc123.jpg",
    "videoLink": "https://youtube.com/live/abcd",
    "dateTime": "2025-12-25T18:30:00.000Z",
    "categoryId": "category_object_id",
    "subCategoryId": "subcategory_object_id",
    "languageId": "language_object_id",
    "isActive": false,
    "createdAt": "2025-12-12T10:00:00.000Z",
    "updatedAt": "2025-12-12T11:00:00.000Z"
  }
}
```

## User API Endpoints

These endpoints are publicly accessible and provide the filtering system for users.

### Get Categories for Live Classes
**Endpoint**: `GET /api/v1/live-classes/categories`

**Response**:
```json
{
  "success": true,
  "message": "Categories fetched successfully",
  "data": [
    {
      "_id": "category_id",
      "name": "UPSC",
      "slug": "upsc"
    },
    {
      "_id": "category_id_2",
      "name": "TSPSC",
      "slug": "tspsc"
    }
  ]
}
```

### Get Languages for Selected Category
**Endpoint**: `GET /api/v1/live-classes/languages?categoryId=:categoryId`

**Query Parameters**:
- `categoryId`: Required category ID

**Response**:
```json
{
  "success": true,
  "message": "Languages fetched successfully",
  "data": [
    {
      "_id": "language_id",
      "name": "English",
      "code": "en"
    },
    {
      "_id": "language_id_2",
      "name": "Hindi",
      "code": "hi"
    }
  ]
}
```

### Get SubCategories for Selected Category and Language
**Endpoint**: `GET /api/v1/live-classes/subcategories?categoryId=:categoryId&languageId=:languageId`

**Query Parameters**:
- `categoryId`: Required category ID
- `languageId`: Required language ID

**Response**:
```json
{
  "success": true,
  "message": "SubCategories fetched successfully",
  "data": [
    {
      "_id": "subcategory_id",
      "name": "Polity",
      "slug": "polity"
    },
    {
      "_id": "subcategory_id_2",
      "name": "Geography",
      "slug": "geography"
    }
  ]
}
```

### Get Live Classes with Filtering
**Endpoint**: `GET /api/v1/live-classes?[filters]`

**Query Parameters**:
- `categoryId`: Filter by category
- `languageId`: Filter by language
- `subCategoryId`: Filter by subcategory

**Response**:
```json
{
  "success": true,
  "message": "Live classes fetched successfully",
  "data": [
    {
      "_id": "live_class_id",
      "name": "UPSC Polity Live Class",
      "description": "Understanding Fundamental Rights",
      "thumbnail": "https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/live_classes/thumbnails/abc123.jpg",
      "videoLink": "https://youtube.com/live/abcd",
      "dateTime": "2025-12-25T18:30:00.000Z",
      "categoryId": {
        "_id": "category_id",
        "name": "UPSC",
        "slug": "upsc"
      },
      "subCategoryId": {
        "_id": "subcategory_id",
        "name": "Polity",
        "slug": "polity"
      },
      "languageId": {
        "_id": "language_id",
        "name": "English",
        "code": "en"
      },
      "isActive": true,
      "status": "upcoming", // Computed field: upcoming, live, completed
      "createdAt": "2025-12-12T10:00:00.000Z",
      "updatedAt": "2025-12-12T10:00:00.000Z"
    }
  ]
}
```

### Get Live Class by ID
**Endpoint**: `GET /api/v1/live-classes/:id`

**Response**:
```json
{
  "success": true,
  "message": "Live class fetched successfully",
  "data": {
    "_id": "live_class_id",
    "name": "UPSC Polity Live Class",
    "description": "Understanding Fundamental Rights",
    "thumbnail": "https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/live_classes/thumbnails/abc123.jpg",
    "videoLink": "https://youtube.com/live/abcd",
    "dateTime": "2025-12-25T18:30:00.000Z",
    "categoryId": {
      "_id": "category_id",
      "name": "UPSC",
      "slug": "upsc"
    },
    "subCategoryId": {
      "_id": "subcategory_id",
      "name": "Polity",
      "slug": "polity"
    },
    "languageId": {
      "_id": "language_id",
      "name": "English",
      "code": "en"
    },
    "isActive": true,
    "status": "upcoming", // Computed field: upcoming, live, completed
    "createdAt": "2025-12-12T10:00:00.000Z",
    "updatedAt": "2025-12-12T10:00:00.000Z"
  }
}
```

### Search Live Classes
**Endpoint**: `GET /api/v1/live-classes/search?query=:searchTerm`

**Query Parameters**:
- `query`: Required search term

**Response**:
```json
{
  "success": true,
  "message": "Live classes searched successfully",
  "data": [
    {
      "_id": "live_class_id",
      "name": "UPSC Polity Live Class",
      "description": "Understanding Fundamental Rights",
      "thumbnail": "https://res.cloudinary.com/your-cloud-name/image/upload/v1234567890/live_classes/thumbnails/abc123.jpg",
      "videoLink": "https://youtube.com/live/abcd",
      "dateTime": "2025-12-25T18:30:00.000Z",
      "categoryId": {
        "_id": "category_id",
        "name": "UPSC",
        "slug": "upsc"
      },
      "subCategoryId": {
        "_id": "subcategory_id",
        "name": "Polity",
        "slug": "polity"
      },
      "languageId": {
        "_id": "language_id",
        "name": "English",
        "code": "en"
      },
      "isActive": true,
      "status": "upcoming", // Computed field: upcoming, live, completed
      "createdAt": "2025-12-12T10:00:00.000Z",
      "updatedAt": "2025-12-12T10:00:00.000Z"
    }
  ]
}
```

## Filtering System

The Live Classes feature implements a three-level filtering system:

1. **Category Selection**: Users first select a category (UPSC, TSPSC, etc.)
2. **Language Selection**: Based on the selected category, users choose a language
3. **SubCategory Selection**: Finally, users select a subcategory based on category and language
4. **Live Classes Display**: The filtered list of live classes is displayed

This system ensures users can easily find relevant content based on their preferences.

## API Usage Examples

### Complete User Flow Example

1. **Get Categories**:
   ```bash
   curl -X GET http://localhost:3000/api/v1/live-classes/categories
   ```

2. **Get Languages for UPSC Category**:
   ```bash
   curl -X GET "http://localhost:3000/api/v1/live-classes/languages?categoryId=upsc_category_id"
   ```

3. **Get SubCategories for UPSC + English**:
   ```bash
   curl -X GET "http://localhost:3000/api/v1/live-classes/subcategories?categoryId=upsc_category_id&languageId=english_language_id"
   ```

4. **Get Live Classes for UPSC + English + Polity**:
   ```bash
   curl -X GET "http://localhost:3000/api/v1/live-classes?categoryId=upsc_category_id&languageId=english_language_id&subCategoryId=polity_subcategory_id"
   ```

### Admin Management Example

1. **Create a Live Class with Thumbnail Upload**:
   ```bash
   curl -X POST http://localhost:3000/api/admin/live-classes \
     -H "Authorization: Bearer admin_jwt_token" \
     -F "name=UPSC Polity Live Class" \
     -F "description=Understanding Fundamental Rights" \
     -F "thumbnail=@/path/to/thumbnail.jpg" \
     -F "videoLink=https://youtube.com/live/abcd" \
     -F "dateTime=2025-12-25T18:30:00.000Z" \
     -F "categoryId=upsc_category_id" \
     -F "subCategoryId=polity_subcategory_id" \
     -F "languageId=english_language_id"
   ```

2. **Update a Live Class with New Thumbnail**:
   ```bash
   curl -X PUT http://localhost:3000/api/admin/live-classes/live_class_id \
     -H "Authorization: Bearer admin_jwt_token" \
     -F "name=Updated UPSC Polity Live Class" \
     -F "thumbnail=@/path/to/new_thumbnail.jpg"
   ```

This comprehensive API documentation should help developers integrate and use the Live Classes feature effectively.