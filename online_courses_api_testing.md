# Online Courses API Testing Guide

This guide provides step-by-step instructions for testing all Online Courses-related APIs, including required request bodies, endpoints, and expected responses.

## Important Note on Request Format

Online Courses APIs have different request formats depending on the operation:
1. Basic CRUD operations (create/update courses) require form-data with text fields and file uploads
2. Nested operations (adding classes, tutors, study materials) typically use JSON payloads
3. File uploads (thumbnails, class media, study materials) require multipart form-data

## Base URL
```
https://brain-buzz-web.vercel.app/
```

## Authentication
Most admin endpoints require authentication. Ensure you have a valid admin JWT token before making requests.

User endpoints for course access require a valid user JWT token. Additionally, the purchase check middleware protects user course endpoints to ensure users have proper access to content.

---

## ADMIN APIs

### 1. COURSES - Basic CRUD Operations

#### 1.1 Create Course Shell (Recommended Approach)
**Endpoint:** `POST /api/admin/courses`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: multipart/form-data`

**Form Fields:**
- `name`: "Complete UPSC Prelims Course"
- `courseType`: "PRELIMS"
- `startDate`: "2025-01-15T00:00:00Z"
- `originalPrice`: 4999
- `discountPrice`: 999
- `pricingNote`: "Limited time offer"
- `shortDescription`: "Comprehensive course covering all UPSC Prelims topics"
- `detailedDescription`: "Detailed course description with syllabus..."
- `isActive`: true
- `accessType`: "PAID"
- `categoryIds[]`: (array of category IDs)
- `subCategoryIds[]`: (array of sub-category IDs)
- `languageIds[]`: (array of language IDs)
- `validityIds[]`: (array of validity option IDs)
- `thumbnail`: (select your image file)

**Note:** This creates a course shell without classes, tutors, or study materials. You can add these separately using dedicated endpoints.

**Expected Response:**
```json
{
  "success": true,
  "message": "Course shell created successfully",
  "data": {
    "_id": "course_id",
    "contentType": "ONLINE_COURSE",
    "accessType": "PAID",
    "name": "Complete UPSC Prelims Course",
    "courseType": "PRELIMS",
    "startDate": "2025-01-15T00:00:00Z",
    "categories": [],
    "subCategories": [],
    "languages": [],
    "validities": [],
    "thumbnailUrl": "https://res.cloudinary.com/.../thumbnail.jpg",
    "originalPrice": 4999,
    "discountPrice": 999,
    "pricingNote": "Limited time offer",
    "shortDescription": "Comprehensive course covering all UPSC Prelims topics",
    "detailedDescription": "Detailed course description with syllabus...",
    "tutors": [],
    "classes": [],
    "studyMaterials": [],
    "isActive": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "finalPrice": 4000
  }
}
```

#### 1.2 Create Complete Course in One API Call (Alternative Approach)
**Endpoint:** `POST /api/admin/courses/full`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: multipart/form-data`

**Form Fields:**
- Individual form fields for basic course information:
  - `name`: "Complete UPSC Prelims Course"
  - `courseType`: "PRELIMS"
  - `startDate`: "2025-01-15T00:00:00Z"
  - `originalPrice`: 4999
  - `discountPrice`: 999
  - `pricingNote`: "Limited time offer"
  - `shortDescription`: "Comprehensive course covering all UPSC Prelims topics"
  - `detailedDescription`: "Detailed course description with syllabus..."
  - `isActive`: true
  - `accessType`: "PAID"
- JSON arrays for complex data structures:
  - `categoryIds`: `[{"categoryId1"}, {"categoryId2"}]`
  - `subCategoryIds`: `[{"subCategoryId1"}, {"subCategoryId2"}]`
  - `languageIds`: `[{"languageId1"}]`
  - `validityIds`: `[{"validityId1"}]`
  - `classes`: `[{"title": "Introduction to Indian Polity", "topic": "Polity Basics", "order": 1}, {"title": "Indian Constitution", "topic": "Polity", "order": 2}]`
  - `tutors`: `[{"name": "Dr. Ramesh Sharma", "qualification": "PhD Political Science", "subject": "Polity"}, {"name": "Prof. Sunita Patel", "qualification": "M.A. History", "subject": "History"}]`
  - `studyMaterials`: `[{"title": "Polity Notes", "description": "Comprehensive notes on Indian Polity"}, {"title": "History Notes", "description": "Detailed history notes"}]`
- File uploads:
  - `thumbnail`: (select your image file)
  - `tutorImages[]`: (select tutor images, matched by index with tutors array)
  - `classThumbnails[]`: (select class thumbnails, matched by index with classes array)
  - `classLecturePics[]`: (select lecture pictures, matched by index with classes array)
  - `classVideos[]`: (select class videos, matched by index with classes array)
  - `studyMaterialFiles[]`: (select study material files)

**Note:** This approach creates a complete course with all components in one API call. However, it's recommended to use the shell approach for better control and easier debugging.

**Expected Response:**
```json
{
  "success": true,
  "message": "Complete course created successfully",
  "data": {
    "_id": "course_id",
    "contentType": "ONLINE_COURSE",
    "accessType": "PAID",
    "name": "Complete UPSC Prelims Course",
    "courseType": "PRELIMS",
    "startDate": "2025-01-15T00:00:00Z",
    "categories": [],
    "subCategories": [],
    "languages": [],
    "validities": [],
    "thumbnailUrl": "https://res.cloudinary.com/.../thumbnail.jpg",
    "originalPrice": 4999,
    "discountPrice": 999,
    "pricingNote": "Limited time offer",
    "shortDescription": "Comprehensive course covering all UPSC Prelims topics",
    "detailedDescription": "Detailed course description with syllabus...",
    "tutors": [
      {
        "_id": "tutor_id_1",
        "photoUrl": "https://res.cloudinary.com/.../tutor1.jpg",
        "name": "Dr. Ramesh Sharma",
        "qualification": "PhD Political Science",
        "subject": "Polity"
      },
      {
        "_id": "tutor_id_2",
        "photoUrl": "https://res.cloudinary.com/.../tutor2.jpg",
        "name": "Prof. Sunita Patel",
        "qualification": "M.A. History",
        "subject": "History"
      }
    ],
    "classes": [
      {
        "_id": "class_id_1",
        "title": "Introduction to Indian Polity",
        "topic": "Polity Basics",
        "order": 1,
        "thumbnailUrl": "https://res.cloudinary.com/.../class1_thumb.jpg",
        "lecturePhotoUrl": "https://res.cloudinary.com/.../class1_lecture.jpg",
        "videoUrl": "https://res.cloudinary.com/.../class1_video.mp4",
        "isFree": true
      },
      {
        "_id": "class_id_2",
        "title": "Indian Constitution",
        "topic": "Polity",
        "order": 2,
        "thumbnailUrl": "https://res.cloudinary.com/.../class2_thumb.jpg",
        "lecturePhotoUrl": "https://res.cloudinary.com/.../class2_lecture.jpg",
        "videoUrl": "https://res.cloudinary.com/.../class2_video.mp4",
        "isFree": true
      }
    ],
    "studyMaterials": [
      {
        "_id": "material_id_1",
        "title": "Polity Notes",
        "description": "Comprehensive notes on Indian Polity",
        "fileUrl": "https://res.cloudinary.com/.../polity_notes.pdf"
      },
      {
        "_id": "material_id_2",
        "title": "History Notes",
        "description": "Detailed history notes",
        "fileUrl": "https://res.cloudinary.com/.../history_notes.pdf"
      }
    ],
    "isActive": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "finalPrice": 4000
  }
}
```

#### 1.3 List All Courses
**Endpoint:** `GET /api/admin/courses`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

**Query Parameters (optional):**
- `contentType`: Filter by content type (default: ONLINE_COURSE)
- `category`: Filter by category ID
- `subCategory`: Filter by sub-category ID
- `language`: Filter by language ID
- `isActive`: Filter by active status (true/false)
- `minPrice`: Minimum price filter
- `maxPrice`: Maximum price filter

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "course_id",
      "contentType": "ONLINE_COURSE",
      "accessType": "PAID",
      "name": "Complete UPSC Prelims Course",
      "courseType": "PRELIMS",
      "startDate": "2025-01-15T00:00:00Z",
      "categories": [],
      "subCategories": [],
      "languages": [],
      "validities": [],
      "thumbnailUrl": "https://res.cloudinary.com/.../thumbnail.jpg",
      "originalPrice": 4999,
      "discountPrice": 999,
      "pricingNote": "Limited time offer",
      "shortDescription": "Comprehensive course covering all UPSC Prelims topics",
      "detailedDescription": "Detailed course description with syllabus...",
      "tutors": [],
      "classes": [],
      "studyMaterials": [],
      "isActive": true,
      "createdAt": "timestamp",
      "updatedAt": "timestamp",
      "finalPrice": 4000
    }
  ],
  "meta": {
    "total": 1,
    "totalInDatabase": 1,
    "matchingFilter": 1
  }
}
```

#### 1.4 Get Single Course
**Endpoint:** `GET /api/admin/courses/:id`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

**Expected Response:**
```json
{
  "data": {
    "_id": "course_id",
    "contentType": "ONLINE_COURSE",
    "accessType": "PAID",
    "name": "Complete UPSC Prelims Course",
    "courseType": "PRELIMS",
    "startDate": "2025-01-15T00:00:00Z",
    "categories": [],
    "subCategories": [],
    "languages": [],
    "validities": [],
    "thumbnailUrl": "https://res.cloudinary.com/.../thumbnail.jpg",
    "originalPrice": 4999,
    "discountPrice": 999,
    "pricingNote": "Limited time offer",
    "shortDescription": "Comprehensive course covering all UPSC Prelims topics",
    "detailedDescription": "Detailed course description with syllabus...",
    "tutors": [],
    "classes": [],
    "studyMaterials": [],
    "isActive": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "finalPrice": 4000
  }
}
```

#### 1.5 Update Course Shell
**Endpoint:** `PUT /api/admin/courses/:id`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: application/json`

**Request Body (any combination of fields):**
```json
{
  "name": "Updated UPSC Prelims Course",
  "courseType": "PRELIMS_ADVANCED",
  "startDate": "2025-02-01T00:00:00Z",
  "originalPrice": 5999,
  "discountPrice": 1299,
  "pricingNote": "Early bird offer",
  "shortDescription": "Advanced course covering all UPSC Prelims topics",
  "detailedDescription": "Updated detailed course description with syllabus...",
  "isActive": true,
  "accessType": "PAID",
  "categoryIds": ["categoryId1", "categoryId2"],
  "subCategoryIds": ["subCategoryId1"],
  "languageIds": ["languageId1"],
  "validityIds": ["validityId1"]
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Course updated successfully",
  "data": {
    "_id": "course_id",
    "contentType": "ONLINE_COURSE",
    "accessType": "PAID",
    "name": "Updated UPSC Prelims Course",
    "courseType": "PRELIMS_ADVANCED",
    "startDate": "2025-02-01T00:00:00Z",
    "categories": [],
    "subCategories": [],
    "languages": [],
    "validities": [],
    "thumbnailUrl": "https://res.cloudinary.com/.../thumbnail.jpg",
    "originalPrice": 5999,
    "discountPrice": 1299,
    "pricingNote": "Early bird offer",
    "shortDescription": "Advanced course covering all UPSC Prelims topics",
    "detailedDescription": "Updated detailed course description with syllabus...",
    "tutors": [],
    "classes": [],
    "studyMaterials": [],
    "isActive": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "finalPrice": 4700
  }
}
```

#### 1.6 Update Course Basic Information
**Endpoint:** `PUT /api/admin/courses/:id/basics`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: multipart/form-data`

**Form Fields (any combination):**
- `name`: "Updated UPSC Prelims Course"
- `courseType`: "PRELIMS_ADVANCED"
- `startDate`: "2025-02-01T00:00:00Z"
- `originalPrice`: 5999
- `discountPrice`: 1299
- `pricingNote`: "Early bird offer"
- `shortDescription`: "Advanced course covering all UPSC Prelims topics"
- `detailedDescription`: "Updated detailed course description with syllabus..."
- `isActive`: true
- `accessType`: "PAID"
- `thumbnail`: (select your new image file)

**Expected Response:**
```json
{
  "success": true,
  "message": "Course basic information updated successfully",
  "data": {
    "_id": "course_id",
    "contentType": "ONLINE_COURSE",
    "accessType": "PAID",
    "name": "Updated UPSC Prelims Course",
    "courseType": "PRELIMS_ADVANCED",
    "startDate": "2025-02-01T00:00:00Z",
    "categories": [],
    "subCategories": [],
    "languages": [],
    "validities": [],
    "thumbnailUrl": "https://res.cloudinary.com/.../new_thumbnail.jpg",
    "originalPrice": 5999,
    "discountPrice": 1299,
    "pricingNote": "Early bird offer",
    "shortDescription": "Advanced course covering all UPSC Prelims topics",
    "detailedDescription": "Updated detailed course description with syllabus...",
    "tutors": [],
    "classes": [],
    "studyMaterials": [],
    "isActive": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "finalPrice": 4700
  }
}
```

#### 1.7 Update Course Descriptions
**Endpoint:** `PUT /api/admin/courses/:id/descriptions`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "shortDescription": "Updated short description",
  "detailedDescription": "Updated detailed description with complete syllabus..."
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Course descriptions updated successfully",
  "data": {
    "_id": "course_id",
    "contentType": "ONLINE_COURSE",
    "accessType": "PAID",
    "name": "Updated UPSC Prelims Course",
    "courseType": "PRELIMS_ADVANCED",
    "startDate": "2025-02-01T00:00:00Z",
    "categories": [],
    "subCategories": [],
    "languages": [],
    "validities": [],
    "thumbnailUrl": "https://res.cloudinary.com/.../new_thumbnail.jpg",
    "originalPrice": 5999,
    "discountPrice": 1299,
    "pricingNote": "Early bird offer",
    "shortDescription": "Updated short description",
    "detailedDescription": "Updated detailed description with complete syllabus...",
    "tutors": [],
    "classes": [],
    "studyMaterials": [],
    "isActive": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "finalPrice": 4700
  }
}
```

#### 1.8 Publish Course
**Endpoint:** `PATCH /api/admin/courses/:id/publish`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "isActive": true
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Course published successfully",
  "data": {
    "_id": "course_id",
    "contentType": "ONLINE_COURSE",
    "accessType": "PAID",
    "name": "Updated UPSC Prelims Course",
    "courseType": "PRELIMS_ADVANCED",
    "startDate": "2025-02-01T00:00:00Z",
    "categories": [],
    "subCategories": [],
    "languages": [],
    "validities": [],
    "thumbnailUrl": "https://res.cloudinary.com/.../new_thumbnail.jpg",
    "originalPrice": 5999,
    "discountPrice": 1299,
    "pricingNote": "Early bird offer",
    "shortDescription": "Updated short description",
    "detailedDescription": "Updated detailed description with complete syllabus...",
    "tutors": [],
    "classes": [],
    "studyMaterials": [],
    "isActive": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "finalPrice": 4700
  }
}
```

#### 1.9 Delete Course
**Endpoint:** `DELETE /api/admin/courses/:id`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

**Expected Response:**
```json
{
  "message": "Course deleted successfully"
}
```

### 2. TUTORS - Within a Course

#### 2.1 Add Tutors to Course
**Endpoint:** `POST /api/admin/courses/:id/tutors`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: multipart/form-data`

**Form Fields:**
- JSON array for tutors:
  - `tutors`: `[{"name": "Dr. Ramesh Sharma", "qualification": "PhD Political Science", "subject": "Polity"}, {"name": "Prof. Sunita Patel", "qualification": "M.A. History", "subject": "History"}]`
- File uploads:
  - `tutorImages[]`: (select tutor images, matched by index with tutors array)

**Expected Response:**
```json
{
  "success": true,
  "message": "Tutors added to course successfully",
  "data": {
    "_id": "course_id",
    "contentType": "ONLINE_COURSE",
    "accessType": "PAID",
    "name": "Updated UPSC Prelims Course",
    "tutors": [
      {
        "_id": "tutor_id_1",
        "photoUrl": "https://res.cloudinary.com/.../tutor1.jpg",
        "name": "Dr. Ramesh Sharma",
        "qualification": "PhD Political Science",
        "subject": "Polity"
      },
      {
        "_id": "tutor_id_2",
        "photoUrl": "https://res.cloudinary.com/.../tutor2.jpg",
        "name": "Prof. Sunita Patel",
        "qualification": "M.A. History",
        "subject": "History"
      }
    ],
    "...": "..."
  }
}
```

#### 2.2 Update Tutor in Course
**Endpoint:** `PUT /api/admin/courses/:id/tutors/:tutorId`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: multipart/form-data`

**Form Fields:**
- Individual form fields:
  - `name`: "Dr. Updated Sharma"
  - `qualification`: "PhD Political Science, M.A. Public Administration"
  - `subject`: "Polity & Governance"
- File uploads:
  - `tutorImage`: (select new tutor image)

**Expected Response:**
```json
{
  "success": true,
  "message": "Tutor updated successfully",
  "data": {
    "_id": "course_id",
    "contentType": "ONLINE_COURSE",
    "accessType": "PAID",
    "name": "Updated UPSC Prelims Course",
    "tutors": [
      {
        "_id": "tutor_id_1",
        "photoUrl": "https://res.cloudinary.com/.../updated_tutor1.jpg",
        "name": "Dr. Updated Sharma",
        "qualification": "PhD Political Science, M.A. Public Administration",
        "subject": "Polity & Governance"
      },
      {
        "_id": "tutor_id_2",
        "photoUrl": "https://res.cloudinary.com/.../tutor2.jpg",
        "name": "Prof. Sunita Patel",
        "qualification": "M.A. History",
        "subject": "History"
      }
    ],
    "...": "..."
  }
}
```

#### 2.3 Delete Tutor from Course
**Endpoint:** `DELETE /api/admin/courses/:id/tutors/:tutorId`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

**Expected Response:**
```json
{
  "success": true,
  "message": "Tutor removed from course successfully",
  "data": {
    "_id": "course_id",
    "contentType": "ONLINE_COURSE",
    "accessType": "PAID",
    "name": "Updated UPSC Prelims Course",
    "tutors": [
      {
        "_id": "tutor_id_2",
        "photoUrl": "https://res.cloudinary.com/.../tutor2.jpg",
        "name": "Prof. Sunita Patel",
        "qualification": "M.A. History",
        "subject": "History"
      }
    ],
    "...": "..."
  }
}
```

### 3. CLASSES - Within a Course

#### 3.1 Add Classes to Course
**Note:** Only the first 2 classes in a course are automatically marked as free. The system automatically sets `isFree` to `true` for the first two classes based on their position, and `false` for subsequent classes. The `isFree` field is calculated dynamically and not stored in the database.

**Important Design Decision:** The `isFree` field is intentionally NOT stored in the database. Instead, FREE/PAID access is derived at runtime based on the class's position. This approach ensures:
- No database pollution with redundant fields
- Future-proof flexibility (can easily change "first 2 free" to "first 3 free")
- Clean separation between admin and user views
- Seamless integration with payment systems

**Endpoint:** `POST /api/admin/courses/:id/classes`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: multipart/form-data`

**Form Fields:**
- JSON array for classes:
  - `classes`: `[{"title": "Introduction to Indian Polity", "topic": "Polity Basics", "order": 1}, {"title": "Indian Constitution", "topic": "Polity", "order": 2}, {"title": "Parliament and State Legislatures", "topic": "Polity", "order": 3}]`
- File uploads:
  - `classThumbnails[]`: (select class thumbnails, matched by index with classes array)
  - `classLecturePics[]`: (select lecture pictures, matched by index with classes array)
  - `classVideos[]`: (select class videos, matched by index with classes array)

**Expected Response:**
```json
{
  "success": true,
  "message": "Classes added to course successfully",
  "data": {
    "_id": "course_id",
    "contentType": "ONLINE_COURSE",
    "accessType": "PAID",
    "name": "Updated UPSC Prelims Course",
    "classes": [
      {
        "_id": "class_id_1",
        "title": "Introduction to Indian Polity",
        "topic": "Polity Basics",
        "order": 1,
        "thumbnailUrl": "https://res.cloudinary.com/.../class1_thumb.jpg",
        "lecturePhotoUrl": "https://res.cloudinary.com/.../class1_lecture.jpg",
        "videoUrl": "https://res.cloudinary.com/.../class1_video.mp4",
        "isFree": true
      },
      {
        "_id": "class_id_2",
        "title": "Indian Constitution",
        "topic": "Polity",
        "order": 2,
        "thumbnailUrl": "https://res.cloudinary.com/.../class2_thumb.jpg",
        "lecturePhotoUrl": "https://res.cloudinary.com/.../class2_lecture.jpg",
        "videoUrl": "https://res.cloudinary.com/.../class2_video.mp4",
        "isFree": true
      },
      {
        "_id": "class_id_3",
        "title": "Parliament and State Legislatures",
        "topic": "Polity",
        "order": 3,
        "thumbnailUrl": "https://res.cloudinary.com/.../class3_thumb.jpg",
        "lecturePhotoUrl": "https://res.cloudinary.com/.../class3_lecture.jpg",
        "videoUrl": "https://res.cloudinary.com/.../class3_video.mp4",
        "isFree": false
      }
    ],
    "...": "..."
  }
}
```

#### 3.2 Update Class in Course
**Endpoint:** `PUT /api/admin/courses/:id/classes/:classId`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: application/json`

**Request Body (any combination of fields):**
```json
{
  "title": "Updated Introduction to Indian Polity",
  "topic": "Polity Fundamentals",
  "order": 1
}
```

**Note:** The `isFree` flag is automatically determined by the system based on the class's position in the course. The first two classes are automatically marked as free, and subsequent classes are marked as paid. The `isFree` field is calculated dynamically and not stored in the database. Any value provided for `isFree` in the request body will be ignored.

**Access Control Logic:**
- **Admin View:** Admins can access ALL classes without restriction
- **User View (Non-Purchased):** First 2 classes → Free access, Remaining classes → "Buy to unlock"
- **User View (Purchased):** All classes → Unlocked

**Expected Response:**
```json
{
  "success": true,
  "message": "Class updated successfully",
  "data": {
    "_id": "course_id",
    "contentType": "ONLINE_COURSE",
    "accessType": "PAID",
    "name": "Updated UPSC Prelims Course",
    "classes": [
      {
        "_id": "class_id_1",
        "title": "Updated Introduction to Indian Polity",
        "topic": "Polity Fundamentals",
        "order": 1,
        "thumbnailUrl": "https://res.cloudinary.com/.../class1_thumb.jpg",
        "lecturePhotoUrl": "https://res.cloudinary.com/.../class1_lecture.jpg",
        "videoUrl": "https://res.cloudinary.com/.../class1_video.mp4",
        "isFree": true
      },
      "...": "..."
    ],
    "...": "..."
  }
}
```

#### 3.3 Update Class Media
**Endpoint:** `PUT /api/admin/courses/:id/classes/:classId/media`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: multipart/form-data`

**Form Fields:**
- Individual file uploads:
  - `thumbnail`: (select new thumbnail image)
  - `lecturePhoto`: (select new lecture photo)
  - `video`: (select new video file)

**Expected Response:**
```json
{
  "success": true,
  "message": "Class media updated successfully",
  "data": {
    "_id": "course_id",
    "contentType": "ONLINE_COURSE",
    "accessType": "PAID",
    "name": "Updated UPSC Prelims Course",
    "classes": [
      {
        "_id": "class_id_1",
        "title": "Updated Introduction to Indian Polity",
        "topic": "Polity Fundamentals",
        "order": 1,
        "thumbnailUrl": "https://res.cloudinary.com/.../updated_class1_thumb.jpg",
        "lecturePhotoUrl": "https://res.cloudinary.com/.../updated_class1_lecture.jpg",
        "videoUrl": "https://res.cloudinary.com/.../updated_class1_video.mp4",
        "isFree": true
      },
      "...": "..."
    ],
    "...": "..."
  }
}
```

#### 3.4 Delete Class from Course
**Endpoint:** `DELETE /api/admin/courses/:id/classes/:classId`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

**Expected Response:**
```json
{
  "success": true,
  "message": "Class removed from course successfully",
  "data": {
    "_id": "course_id",
    "contentType": "ONLINE_COURSE",
    "accessType": "PAID",
    "name": "Updated UPSC Prelims Course",
    "classes": [
      {
        "_id": "class_id_2",
        "title": "Indian Constitution",
        "topic": "Polity",
        "order": 2,
        "thumbnailUrl": "https://res.cloudinary.com/.../class2_thumb.jpg",
        "lecturePhotoUrl": "https://res.cloudinary.com/.../class2_lecture.jpg",
        "videoUrl": "https://res.cloudinary.com/.../class2_video.mp4",
        "isFree": true
      },
      {
        "_id": "class_id_3",
        "title": "Parliament and State Legislatures",
        "topic": "Polity",
        "order": 3,
        "thumbnailUrl": "https://res.cloudinary.com/.../class3_thumb.jpg",
        "lecturePhotoUrl": "https://res.cloudinary.com/.../class3_lecture.jpg",
        "videoUrl": "https://res.cloudinary.com/.../class3_video.mp4",
        "isFree": false
      }
    ],
    "...": "..."
  }
}
```

### 4. STUDY MATERIALS - Within a Course

#### 4.1 Update Course Content (Add Study Materials)
**Endpoint:** `PUT /api/admin/courses/:id/content`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`
- `Content-Type: multipart/form-data`

**Form Fields:**
- JSON array for study materials:
  - `studyMaterials`: `[{"title": "Polity Notes", "description": "Comprehensive notes on Indian Polity"}, {"title": "History Notes", "description": "Detailed history notes"}]`
- File uploads:
  - `studyMaterialFiles[]`: (select study material files, matched by index with studyMaterials array)

**Expected Response:**
```json
{
  "success": true,
  "message": "Course content updated successfully",
  "data": {
    "_id": "course_id",
    "contentType": "ONLINE_COURSE",
    "accessType": "PAID",
    "name": "Updated UPSC Prelims Course",
    "studyMaterials": [
      {
        "_id": "material_id_1",
        "title": "Polity Notes",
        "description": "Comprehensive notes on Indian Polity",
        "fileUrl": "https://res.cloudinary.com/.../polity_notes.pdf"
      },
      {
        "_id": "material_id_2",
        "title": "History Notes",
        "description": "Detailed history notes",
        "fileUrl": "https://res.cloudinary.com/.../history_notes.pdf"
      }
    ],
    "...": "..."
  }
}
```

#### 4.2 Delete Study Material from Course
**Endpoint:** `DELETE /api/admin/courses/:id/study-materials/:materialId`  
**Headers:** 
- `Authorization: Bearer <admin_jwt_token>`

**Expected Response:**
```json
{
  "success": true,
  "message": "Study material removed from course successfully",
  "data": {
    "_id": "course_id",
    "contentType": "ONLINE_COURSE",
    "accessType": "PAID",
    "name": "Updated UPSC Prelims Course",
    "studyMaterials": [
      {
        "_id": "material_id_2",
        "title": "History Notes",
        "description": "Detailed history notes",
        "fileUrl": "https://res.cloudinary.com/.../history_notes.pdf"
      }
    ],
    "...": "..."
  }
}
```

---

## USER APIs (PUBLIC)

### 1. List Public Courses
**Endpoint:** `GET /api/user/courses`  

**Query Parameters (optional):**
- `contentType`: Filter by content type (default: ONLINE_COURSE)
- `category`: Filter by category ID
- `subCategory`: Filter by sub-category ID
- `language`: Filter by language ID
- `lang`: Filter by language code or name
- `isActive`: Filter by active status (true/false, default: true)
- `minPrice`: Minimum price filter
- `maxPrice`: Maximum price filter

**Expected Response:**
```json
{
  "data": [
    {
      "_id": "course_id",
      "contentType": "ONLINE_COURSE",
      "accessType": "PAID",
      "name": "Updated UPSC Prelims Course",
      "courseType": "PRELIMS_ADVANCED",
      "startDate": "2025-02-01T00:00:00Z",
      "categories": [],
      "subCategories": [],
      "languages": [],
      "validities": [],
      "thumbnailUrl": "https://res.cloudinary.com/.../new_thumbnail.jpg",
      "originalPrice": 5999,
      "discountPrice": 1299,
      "pricingNote": "Early bird offer",
      "shortDescription": "Updated short description",
      "detailedDescription": "Updated detailed description with complete syllabus...",
      "tutors": [
        {
          "_id": "tutor_id_2",
          "photoUrl": "https://res.cloudinary.com/.../tutor2.jpg",
          "name": "Prof. Sunita Patel",
          "qualification": "M.A. History",
          "subject": "History"
        }
      ],
      "classes": [
        {
          "_id": "class_id_2",
          "title": "Indian Constitution",
          "topic": "Polity",
          "order": 2,
          "thumbnailUrl": "https://res.cloudinary.com/.../class2_thumb.jpg",
          "lecturePhotoUrl": "https://res.cloudinary.com/.../class2_lecture.jpg",
          "isFree": true,
          "isLocked": false,
          "hasAccess": true
        },
        {
          "_id": "class_id_3",
          "title": "Parliament and State Legislatures",
          "topic": "Polity",
          "order": 3,
          "thumbnailUrl": "https://res.cloudinary.com/.../class3_thumb.jpg",
          "lecturePhotoUrl": "https://res.cloudinary.com/.../class3_lecture.jpg",
          "isFree": false,
          "isLocked": true,
          "hasAccess": false
        }
      ],
      "studyMaterials": [
        {
          "_id": "material_id_2",
          "title": "History Notes",
          "description": "Detailed history notes",
          "fileUrl": "https://res.cloudinary.com/.../history_notes.pdf"
        }
      ],
      "isActive": true,
      "createdAt": "timestamp",
      "updatedAt": "timestamp",
      "finalPrice": 4700,
      "hasPurchased": false
    }
  ]
}
```

### 2. Get Single Public Course
**Endpoint:** `GET /api/user/courses/:id`  

**Expected Response:**
```json
{
  "data": {
    "_id": "course_id",
    "contentType": "ONLINE_COURSE",
    "accessType": "PAID",
    "name": "Updated UPSC Prelims Course",
    "courseType": "PRELIMS_ADVANCED",
    "startDate": "2025-02-01T00:00:00Z",
    "categories": [],
    "subCategories": [],
    "languages": [],
    "validities": [],
    "thumbnailUrl": "https://res.cloudinary.com/.../new_thumbnail.jpg",
    "originalPrice": 5999,
    "discountPrice": 1299,
    "pricingNote": "Early bird offer",
    "shortDescription": "Updated short description",
    "detailedDescription": "Updated detailed description with complete syllabus...",
    "tutors": [
      {
        "_id": "tutor_id_2",
        "photoUrl": "https://res.cloudinary.com/.../tutor2.jpg",
        "name": "Prof. Sunita Patel",
        "qualification": "M.A. History",
        "subject": "History"
      }
    ],
    "classes": [
      {
        "_id": "class_id_2",
        "title": "Indian Constitution",
        "topic": "Polity",
        "order": 2,
        "thumbnailUrl": "https://res.cloudinary.com/.../class2_thumb.jpg",
        "lecturePhotoUrl": "https://res.cloudinary.com/.../class2_lecture.jpg",
        "isFree": true,
        "isLocked": false,
        "hasAccess": true
      },
      {
        "_id": "class_id_3",
        "title": "Parliament and State Legislatures",
        "topic": "Polity",
        "order": 3,
        "thumbnailUrl": "https://res.cloudinary.com/.../class3_thumb.jpg",
        "lecturePhotoUrl": "https://res.cloudinary.com/.../class3_lecture.jpg",
        "isFree": false,
        "isLocked": true,
        "hasAccess": false
      }
    ],
    "studyMaterials": [
      {
        "_id": "material_id_2",
        "title": "History Notes",
        "description": "Detailed history notes",
        "fileUrl": "https://res.cloudinary.com/.../history_notes.pdf"
      }
    ],
    "isActive": true,
    "createdAt": "timestamp",
    "updatedAt": "timestamp",
    "finalPrice": 4700,
    "hasPurchased": false
  }
}
```

### 3. Get Specific Course Class/Video
**Endpoint:** `GET /api/user/courses/:courseId/classes/:classId`  
**Headers:** 
- `Authorization: Bearer <user_jwt_token>`

**Expected Response (for free class):**
```json
{
  "success": true,
  "data": {
    "_id": "class_id_2",
    "title": "Indian Constitution",
    "topic": "Polity",
    "order": 2,
    "thumbnailUrl": "https://res.cloudinary.com/.../class2_thumb.jpg",
    "lecturePhotoUrl": "https://res.cloudinary.com/.../class2_lecture.jpg",
    "videoUrl": "https://res.cloudinary.com/.../class2_video.mp4",
    "isFree": true
  }
}
```

**Expected Response (for paid class without purchase):**
```json
{
  "success": false,
  "message": "Please purchase this course to access this content"
}
```

### 4. Initiate Course Purchase
**Endpoint:** `POST /api/user/courses/:courseId/purchase`  
**Headers:** 
- `Authorization: Bearer <user_jwt_token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "couponCode": "SAVE10"  // Optional
}
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "paymentId": "pay_1234567890_abcdefghi",
    "amount": 4700,
    "currency": "INR",
    "couponApplied": false,
    "discountAmount": 0
  }
}
```

---

## FREE vs PAID Class Access Logic

### Core Design Principle

The Brain Buzz platform implements a sophisticated access control system for online courses that differentiates between FREE and PAID content. This system is designed with the following principles:

1. **Dynamic Access Determination**: FREE/PAID status is calculated at runtime, not stored in the database
2. **Position-Based Access**: The first 2 classes in any course are automatically FREE
3. **Flexible Rules**: Business rules can be easily modified without database changes
4. **Clear Separation**: Different access rules for Admins vs Users

### Implementation Details

#### How FREE/Paid Access Works

1. **No Persistent Storage**: The `isFree` field is NEVER stored in the database
2. **Runtime Calculation**: Access type is determined dynamically based on class position
3. **Automatic Assignment**: First 2 classes = FREE, Remaining classes = PAID
4. **Admin Override**: Admins bypass all access restrictions

#### User Access Scenarios

**Scenario 1: Non-Purchased User**
- Can access first 2 classes in any course (FREE)
- Cannot access classes 3+ without purchasing the course
- Sees "Buy to unlock" messaging for paid classes

**Scenario 2: Purchased User**
- Can access ALL classes in the purchased course
- No restrictions based on class position
- Full access to all course features

**Scenario 3: Admin User**
- Can access ALL classes in ALL courses
- No purchase requirements
- No position-based restrictions
- Full administrative capabilities

### Benefits of This Approach

#### 1. Database Efficiency
- No redundant `isFree` fields cluttering the database
- Cleaner data model with fewer maintenance concerns
- Reduced storage overhead

#### 2. Business Flexibility
- Can easily change "first 2 free" to "first 3 free" with one code change
- No database migrations required for rule changes
- A/B testing different free tier strategies

#### 3. Security & Consistency
- Eliminates possibility of inconsistent `isFree` flags
- Centralized logic reduces bugs
- Admins always have full access regardless of flags

#### 4. Payment Integration
- Seamless integration with Razorpay and other payment systems
- Clear distinction between free and paid content for billing
- Automatic access granting upon successful purchase

### Technical Implementation

#### Backend Logic

The FREE/PAID determination happens in the controller layer:

```javascript
// For user-facing endpoints
const classesWithAccessInfo = course.classes.map((cls, index) => ({
  ...cls.toObject(),
  isFree: index < 2,
  isLocked: !(index < 2 || userHasPurchased),
  hasAccess: index < 2 || userHasPurchased
}));
```

#### Access Control Middleware

Purchase check middleware enforces access rules:

```javascript
// Simplified logic
if (userHasPurchased(courseId)) {
  allowAccess();
} else if (classIndex < 2) {
  allowAccess();
} else {
  blockAccess();
}
```

### Testing Guidelines

#### Admin Testing
1. Verify admins can access ALL classes regardless of position
2. Confirm no purchase requirements for admin users
3. Test CRUD operations on classes 1-N without restrictions

#### User Testing (Non-Purchased)
1. Verify free access to classes 1-2 in any course
2. Confirm blocked access to classes 3+ without purchase
3. Check proper error messaging for restricted classes
4. Validate "Buy to unlock" UI elements

#### User Testing (Purchased)
1. Verify full access to ALL classes after purchase
2. Confirm no position-based restrictions post-purchase
3. Test all class features work correctly
4. Validate access persists across sessions

#### Edge Cases
1. Course with only 1 class (should be FREE)
2. Course with only 2 classes (both should be FREE)
3. Adding/removing classes affecting position-based access
4. Changing class order and impact on FREE/PAID status
5. Bulk operations maintaining correct access logic

---

## Validation Rules

### Course Creation/Update
* ✅ name is required
* ✅ originalPrice is required and cannot be negative
* ✅ categoryIds, subCategoryIds, languageIds, validityIds must be valid ObjectId arrays
* ✅ startDate must be a valid ISO date string if provided
* ✅ isActive defaults to true when not provided
* ✅ accessType must be "FREE" or "PAID"

### Tutor Creation/Update
* ✅ name is required
* ✅ subject is required
* ✅ qualification is optional

### Class Creation/Update
* ✅ title is required
* ✅ topic is optional
* ✅ order is optional but should be consistent
* ✅ isFree flag is automatically set based on class position (first 2 classes are free)
* ✅ Cannot add more classes than specified limit (if any)

### Study Material Creation/Update
* ✅ title is required
* ✅ description is optional
* ✅ fileUrl is generated automatically after upload

### User Access
* ✅ Users must purchase course before accessing paid classes (except first 2 free classes)
* ✅ Access control logic: First 2 classes → Free, Classes 3+ → Require purchase
* ✅ Admins can access all classes without purchase requirements
* ✅ Dynamic access determination at runtime (not stored in DB)

---

## Testing Steps Summary

1. **Setup Phase:**
   - Create categories, sub-categories, languages, and validity options if needed
   - Create a course shell with basic information
   - Verify course is stored correctly

2. **Adding Content:**
   - Add tutors to the course
   - Add classes to the course
   - Verify the first 2 classes are marked as free automatically
   - Add study materials to the course

3. **Updating Content:**
   - Update course basic information
   - Update course descriptions
   - Update tutor information
   - Update class information
   - Update study materials

4. **Deleting Content:**
   - Delete study materials from course
   - Delete classes from course
   - Delete tutors from course
   - Delete entire course

5. **Publishing:**
   - Publish course to make it available to users
   - Verify course appears in public listings

6. **User Access Testing:**
   - Test public endpoints for listing and retrieving courses
   - Verify proper data is exposed to users
   - Confirm authentication is required for user course endpoints
   - **FREE/Paid Access Testing:**
     * Verify first 2 classes in any course are accessible without purchase
     * Confirm classes 3+ require purchase for access
     * Test admin override (admins can access all classes)
     * Validate dynamic access determination (no `isFree` field in database)
     * Check proper error messaging for restricted classes
     * Verify "Buy to unlock" UI elements display correctly
     * Test access persistence for purchased users

7. **Purchase Flow Testing:**
   - Test course purchase initiation
   - Verify payment information is generated correctly
   - Test access to paid content after purchase
   - Validate purchase history

8. **Filtering Testing:**
   - Test category-based filtering:
     * Request: `GET /api/admin/courses?category=<category_id>`
     * Expected: Only courses belonging to the specified category are returned
   - Test sub-category filtering:
     * Request: `GET /api/admin/courses?subCategory=<sub_category_id>`
     * Expected: Only courses belonging to the specified sub-category are returned
   - Test language filtering:
     * Request: `GET /api/admin/courses?language=<language_id>`
     * Expected: Only courses in the specified language are returned
   - Test active status filtering:
     * Request: `GET /api/admin/courses?isActive=true`
     * Expected: Only active courses are returned
     * Request: `GET /api/admin/courses?isActive=false`
     * Expected: Only inactive courses are returned
   - Test price range filtering:
     * Request: `GET /api/admin/courses?minPrice=1000&maxPrice=5000`
     * Expected: Only courses with originalPrice between 1000 and 5000 are returned
     * Request: `GET /api/admin/courses?minPrice=3000`
     * Expected: Only courses with originalPrice >= 3000 are returned
   - Test combined filtering:
     * Request: `GET /api/admin/courses?category=<category_id>&isActive=true&minPrice=1000`
     * Expected: Only active courses belonging to the specified category with originalPrice >= 1000 are returned
   - Test user-side filtering:
     * Request: `GET /api/user/courses?category=<category_id>`
     * Expected: Only active courses belonging to the specified category are returned to users

Ensure all endpoints return appropriate error messages for invalid requests.