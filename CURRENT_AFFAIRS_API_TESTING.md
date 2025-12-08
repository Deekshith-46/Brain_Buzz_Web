# Current Affairs API Testing Guide

## Complete Flow with Language Filtering

Base URL: `http://localhost:5001`

---

## 📌 USER/PUBLIC APIs (No Authentication Required)

### **Step 1: Get All Categories with Current Affairs**
**Purpose:** Show all available categories that contain current affairs (like UPSC, SSC, Banking, etc.)

```http
GET {{BASE_URL}}/api/v1/current-affairs/categories
```

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64a1234567890abcdef12345",
      "name": "UPSC",
      "slug": "upsc",
      "thumbnailUrl": "https://..."
    },
    {
      "_id": "64a1234567890abcdef12346",
      "name": "SSC",
      "slug": "ssc",
      "thumbnailUrl": "https://..."
    }
  ]
}
```

---

### **Step 2: Get Available Languages for a Category**
**Purpose:** After user selects a category (e.g., UPSC), show available languages (English, Hindi, Telugu)

```http
GET {{BASE_URL}}/api/v1/current-affairs/categories/{{categoryId}}/languages
```

**Example:**
```http
GET {{BASE_URL}}/api/v1/current-affairs/categories/64a1234567890abcdef12345/languages
```

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64a9876543210abcdef12345",
      "name": "English",
      "code": "en"
    },
    {
      "_id": "64a9876543210abcdef12346",
      "name": "Hindi",
      "code": "hi"
    },
    {
      "_id": "64a9876543210abcdef12347",
      "name": "Telugu",
      "code": "te"
    }
  ]
}
```

---

### **Step 3: Get SubCategories Filtered by Language**
**Purpose:** After user selects a language (e.g., Hindi), show only subcategories available in Hindi for that category

```http
GET {{BASE_URL}}/api/v1/current-affairs/categories/{{categoryId}}/subcategories?languageId={{languageId}}
```

**Example:**
```http
GET {{BASE_URL}}/api/v1/current-affairs/categories/64a1234567890abcdef12345/subcategories?languageId=64a9876543210abcdef12346
```

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64b1234567890abcdef12345",
      "name": "IAS Exam",
      "slug": "ias-exam",
      "thumbnailUrl": "https://...",
      "category": "64a1234567890abcdef12345"
    },
    {
      "_id": "64b1234567890abcdef12346",
      "name": "IFS",
      "slug": "ifs",
      "thumbnailUrl": "https://...",
      "category": "64a1234567890abcdef12345"
    }
  ]
}
```

---

### **Step 4a: Get Available Affair Types**
**Purpose:** Get available types (Latest, Monthly, Sports, State, etc.) for current filters

```http
GET {{BASE_URL}}/api/v1/current-affairs/types?categoryId={{categoryId}}&subCategoryId={{subCategoryId}}&languageId={{languageId}}
```

**Example:**
```http
GET {{BASE_URL}}/api/v1/current-affairs/types?categoryId=64a1234567890abcdef12345&languageId=64a9876543210abcdef12346&subCategoryId=64b1234567890abcdef12345
```

**Response Example:**
```json
{
  "success": true,
  "data": [
    { "name": "Latest", "value": "LatestCurrentAffair" },
    { "name": "Monthly", "value": "MonthlyCurrentAffair" },
    { "name": "Sports", "value": "SportsCurrentAffair" },
    { "name": "State", "value": "StateCurrentAffair" }
  ]
}
```

---

### **Step 4b: Get Filtered Current Affairs**
**Purpose:** Get current affairs list with all applied filters

```http
GET {{BASE_URL}}/api/v1/current-affairs/affairs?categoryId={{categoryId}}&subCategoryId={{subCategoryId}}&languageId={{languageId}}&affairType={{affairType}}&page=1&limit=20
```

**Example:**
```http
GET {{BASE_URL}}/api/v1/current-affairs/affairs?categoryId=64a1234567890abcdef12345&subCategoryId=64b1234567890abcdef12345&languageId=64a9876543210abcdef12346&affairType=LatestCurrentAffair&page=1&limit=20
```

**Response Example:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64c1234567890abcdef12345",
      "heading": "क्रिकेट विश्व कप विजेता की सूची",
      "description": "1975 से क्रिकेट विश्व कप...",
      "thumbnailUrl": "https://...",
      "date": "2025-09-29T00:00:00.000Z",
      "affairType": "LatestCurrentAffair",
      "categories": [
        {
          "_id": "64a1234567890abcdef12345",
          "name": "UPSC",
          "slug": "upsc"
        }
      ],
      "subCategories": [
        {
          "_id": "64b1234567890abcdef12345",
          "name": "IAS Exam",
          "slug": "ias-exam"
        }
      ],
      "languages": [
        {
          "_id": "64a9876543210abcdef12346",
          "name": "Hindi",
          "code": "hi"
        }
      ],
      "isActive": true,
      "createdAt": "2025-09-29T04:12:43.285Z",
      "updatedAt": "2025-09-29T10:03:30.439Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

### **Step 5: Get Single Current Affair Details**
```http
GET {{BASE_URL}}/api/v1/current-affairs/{{affairId}}
```

---

## 🔐 ADMIN APIs (Require Authentication)

**Headers Required:**
```
Authorization: Bearer {{adminToken}}
```

### **Admin Filter Routes**

#### Get All Categories with Current Affairs
```http
GET {{BASE_URL}}/api/admin/current-affairs/filters/categories
Authorization: Bearer {{adminToken}}
```

#### Get Subcategories & Languages by Category
```http
GET {{BASE_URL}}/api/admin/current-affairs/filters/categories/{{categoryId}}/details
Authorization: Bearer {{adminToken}}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "subCategories": [...],
    "languages": [...]
  }
}
```

#### Get Subcategories by Language
```http
GET {{BASE_URL}}/api/admin/current-affairs/filters/categories/{{categoryId}}/subcategories?languageId={{languageId}}
Authorization: Bearer {{adminToken}}
```

#### Get Filtered Current Affairs (Admin)
```http
GET {{BASE_URL}}/api/admin/current-affairs/filters/affairs?categoryId={{categoryId}}&subCategoryId={{subCategoryId}}&languageId={{languageId}}&affairType={{affairType}}&page=1&limit=20
Authorization: Bearer {{adminToken}}
```

#### Get Available Affair Types (Admin)
```http
GET {{BASE_URL}}/api/admin/current-affairs/filters/types?categoryId={{categoryId}}&subCategoryId={{subCategoryId}}&languageId={{languageId}}
Authorization: Bearer {{adminToken}}
```

---

## 📝 Create Current Affairs (Admin)

### Create Latest Current Affair
```http
POST {{BASE_URL}}/api/admin/current-affairs/latest
Authorization: Bearer {{adminToken}}
Content-Type: multipart/form-data

affair: {
  "date": "2025-12-06",
  "categoryIds": ["64a1234567890abcdef12345"],
  "subCategoryIds": ["64b1234567890abcdef12345"],
  "languageIds": ["64a9876543210abcdef12346"],
  "heading": "क्रिकेट विश्व कप विजेता की सूची",
  "description": "1975 से क्रिकेट विश्व कप की विजेता टीमें",
  "fullContent": "विस्तृत जानकारी यहाँ...",
  "isActive": true
}
thumbnail: [file upload]
```

### Create Monthly Current Affair
```http
POST {{BASE_URL}}/api/admin/current-affairs/monthly
Authorization: Bearer {{adminToken}}
Content-Type: multipart/form-data

affair: {
  "date": "2025-12-01",
  "month": "December",
  "categoryIds": ["64a1234567890abcdef12345"],
  "subCategoryIds": ["64b1234567890abcdef12345"],
  "languageIds": ["64a9876543210abcdef12347"],
  "name": "December 2025 Current Affairs",
  "description": "Monthly compilation...",
  "fullContent": "Detailed content...",
  "isActive": true
}
thumbnail: [file upload]
```

### Create Sports Current Affair
```http
POST {{BASE_URL}}/api/admin/current-affairs/sports
Authorization: Bearer {{adminToken}}
Content-Type: multipart/form-data

affair: {
  "date": "2025-12-06",
  "sport": "Cricket",
  "event": "World Cup 2023",
  "categories": ["64a1234567890abcdef12345"],
  "subCategories": ["64b1234567890abcdef12345"],
  "languages": ["64a9876543210abcdef12346"],
  "description": "Cricket World Cup details...",
  "fullContent": "Detailed content...",
  "isActive": true
}
thumbnail: [file upload]
```

### Create State Current Affair
```http
POST {{BASE_URL}}/api/admin/current-affairs/state
Authorization: Bearer {{adminToken}}
Content-Type: multipart/form-data

affair: {
  "date": "2025-12-06",
  "state": "Telangana",
  "name": "Telangana State News",
  "categories": ["64a1234567890abcdef12345"],
  "subCategories": ["64b1234567890abcdef12345"],
  "languages": ["64a9876543210abcdef12347"],
  "description": "తెలంగాణ వార్తలు...",
  "fullContent": "Detailed Telugu content...",
  "isActive": true
}
thumbnail: [file upload]
```

---

## 🔄 Complete User Flow Example

### Flow Scenario: User wants Telugu content for UPSC > IAS Exam

1. **Get Categories**
   ```
   GET /api/v1/current-affairs/categories
   → User selects "UPSC" (categoryId: 64a1234567890abcdef12345)
   ```

2. **Get Languages for UPSC**
   ```
   GET /api/v1/current-affairs/categories/64a1234567890abcdef12345/languages
   → User sees: English, Hindi, Telugu
   → User selects "Telugu" (languageId: 64a9876543210abcdef12347)
   ```

3. **Get Subcategories in Telugu**
   ```
   GET /api/v1/current-affairs/categories/64a1234567890abcdef12345/subcategories?languageId=64a9876543210abcdef12347
   → Shows only subcategories with Telugu content: IAS Exam, IFS
   → User selects "IAS Exam" (subCategoryId: 64b1234567890abcdef12345)
   ```

4. **Get Available Types**
   ```
   GET /api/v1/current-affairs/types?categoryId=64a1234567890abcdef12345&subCategoryId=64b1234567890abcdef12345&languageId=64a9876543210abcdef12347
   → Shows: Latest, Monthly, State
   → User selects "Latest"
   ```

5. **Get Filtered Affairs**
   ```
   GET /api/v1/current-affairs/affairs?categoryId=64a1234567890abcdef12345&subCategoryId=64b1234567890abcdef12345&languageId=64a9876543210abcdef12347&affairType=LatestCurrentAffair&page=1&limit=20
   → Returns Telugu current affairs for UPSC > IAS Exam > Latest
   ```

---

## 🎯 Key Features

1. ✅ **Language-Specific Filtering**: Only shows subcategories with content in selected language
2. ✅ **Dynamic Type Filtering**: Shows only affair types available for current selection
3. ✅ **Pagination Support**: Efficient loading with page/limit params
4. ✅ **Multilingual Content**: Admin can create content in Telugu, Hindi, or English
5. ✅ **Category Hierarchy**: Category → Language Selection → SubCategory → Affair Type → Affairs

---

## 📊 Test Data Requirements

Before testing, ensure you have:

1. ✅ **Categories** created (UPSC, SSC, Banking, etc.)
2. ✅ **SubCategories** created under categories
3. ✅ **Languages** created (English, Hindi, Telugu)
4. ✅ **Current Affairs** created with:
   - Assigned categories
   - Assigned subcategories
   - Assigned languages
   - Different affair types

---

## 🚀 Quick Testing Checklist

- [ ] Create at least 2 categories
- [ ] Create at least 3 subcategories per category
- [ ] Create 3 languages (English, Hindi, Telugu)
- [ ] Create current affairs in different languages
- [ ] Test category listing
- [ ] Test language filtering by category
- [ ] Test subcategory filtering by language
- [ ] Test affair type filtering
- [ ] Test final filtered affairs list
- [ ] Verify Telugu/Hindi content displays correctly
