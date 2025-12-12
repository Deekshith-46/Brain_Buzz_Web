# Test Series Cutoff Management API Examples

This document provides complete examples for all cutoff management endpoints including request and response formats.

## Base URL
```
http://localhost:3000/api/admin/test-attempts
```

## Authentication
All requests require an admin authorization token in the header:
```
Authorization: Bearer <admin_jwt_token>
Content-Type: application/json
```

## Example IDs
For these examples, we'll use:
- Series ID: `64a1b2c3d4e5f6789abcdef0`
- Test ID: `64a1b2c3d4e5f6789abcdef1`

## 1. Set Cutoff (POST)

**Endpoint**: `POST /:seriesId/:testId/cutoff`

**Request**:
```bash
curl -X POST \
  http://localhost:3000/api/admin/test-attempts/64a1b2c3d4e5f6789abcdef0/64a1b2c3d4e5f6789abcdef1/cutoff \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
    "general": 15,
    "obc": 14,
    "sc": 13,
    "st": 13
  }'
```

**Response**:
```json
{
  "success": true,
  "message": "Cutoff set successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789abcdef2",
    "testSeries": "64a1b2c3d4e5f6789abcdef0",
    "testId": "64a1b2c3d4e5f6789abcdef1",
    "cutoff": {
      "general": 15,
      "obc": 14,
      "sc": 13,
      "st": 13
    },
    "__v": 0
  }
}
```

## 2. Get Cutoff (GET)

**Endpoint**: `GET /:seriesId/:testId/cutoff`

**Request**:
```bash
curl -X GET \
  http://localhost:3000/api/admin/test-attempts/64a1b2c3d4e5f6789abcdef0/64a1b2c3d4e5f6789abcdef1/cutoff \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Response**:
```json
{
  "success": true,
  "message": "Cutoff fetched successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789abcdef2",
    "testSeries": "64a1b2c3d4e5f6789abcdef0",
    "testId": "64a1b2c3d4e5f6789abcdef1",
    "cutoff": {
      "general": 15,
      "obc": 14,
      "sc": 13,
      "st": 13
    },
    "__v": 0
  }
}
```

## 3. Update Cutoff (PUT)

**Endpoint**: `PUT /:seriesId/:testId/cutoff`

### Full Update Request:
```bash
curl -X PUT \
  http://localhost:3000/api/admin/test-attempts/64a1b2c3d4e5f6789abcdef0/64a1b2c3d4e5f6789abcdef1/cutoff \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
    "general": 16,
    "obc": 15,
    "sc": 14,
    "st": 14
  }'
```

**Full Update Response**:
```json
{
  "success": true,
  "message": "Cutoff updated successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789abcdef2",
    "testSeries": "64a1b2c3d4e5f6789abcdef0",
    "testId": "64a1b2c3d4e5f6789abcdef1",
    "cutoff": {
      "general": 16,
      "obc": 15,
      "sc": 14,
      "st": 14
    },
    "__v": 1
  }
}
```

### Partial Update Request (Only General Cutoff):
```bash
curl -X PUT \
  http://localhost:3000/api/admin/test-attempts/64a1b2c3d4e5f6789abcdef0/64a1b2c3d4e5f6789abcdef1/cutoff \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' \
  -H 'Content-Type: application/json' \
  -d '{
    "general": 17
  }'
```

**Partial Update Response** (Only general value changed, others preserved):
```json
{
  "success": true,
  "message": "Cutoff updated successfully",
  "data": {
    "_id": "64a1b2c3d4e5f6789abcdef2",
    "testSeries": "64a1b2c3d4e5f6789abcdef0",
    "testId": "64a1b2c3d4e5f6789abcdef1",
    "cutoff": {
      "general": 17,
      "obc": 15,
      "sc": 14,
      "st": 14
    },
    "__v": 2
  }
}
```

## 4. Delete Cutoff (DELETE)

**Endpoint**: `DELETE /:seriesId/:testId/cutoff`

**Request**:
```bash
curl -X DELETE \
  http://localhost:3000/api/admin/test-attempts/64a1b2c3d4e5f6789abcdef0/64a1b2c3d4e5f6789abcdef1/cutoff \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
```

**Response**:
```json
{
  "success": true,
  "message": "Cutoff deleted successfully"
}
```

## Error Responses

### 404 - Test Series Not Found
```json
{
  "success": false,
  "message": "Test series not found"
}
```

### 404 - Test Not Found in Series
```json
{
  "success": false,
  "message": "Test not found in this series"
}
```

### 404 - Cutoff Not Found (for GET/PUT/DELETE)
```json
{
  "success": false,
  "message": "Cutoff not found for this test"
}
```

### 500 - Server Error
```json
{
  "success": false,
  "message": "Server error",
  "error": "Error message details"
}
```

## Use Cases

### Setting Initial Cutoff
An admin sets the initial cutoff scores for a newly created test.

### Adjusting Cutoff Mid-Exam
During an ongoing exam period, an admin may adjust cutoff scores based on exam difficulty. They can update all cutoffs at once or adjust specific category cutoffs individually.

### Retrieving Current Cutoff
Admin dashboard displays current cutoff settings for transparency.

### Removing Cutoff
For practice tests or demos where cutoffs are not applicable.

This comprehensive cutoff management system gives admins full control over test evaluation criteria.