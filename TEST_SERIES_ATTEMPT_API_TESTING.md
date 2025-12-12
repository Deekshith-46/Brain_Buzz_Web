# Test Series Attempt API Testing Guide

This document provides detailed instructions for testing the complete Test Series attempt workflow implementation, including all new models, APIs, and business logic.

**Note**: The scoring calculation has been corrected to properly subtract negative marks from correct marks, ensuring accurate test scoring.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [New Models Overview](#new-models-overview)
3. [API Endpoints Testing](#api-endpoints-testing)
   - [User Endpoints](#user-endpoints)
   - [Admin Endpoints](#admin-endpoints)
4. [Complete Workflow Testing](#complete-workflow-testing)
5. [Expected Responses](#expected-responses)

## Prerequisites

Before testing the APIs, ensure you have:
1. A valid user account with authentication token
2. A valid admin account with authentication token
3. At least one Test Series with tests created
4. User has purchased/access to the Test Series

## New Models Overview

### TestAttempt Model
Stores user's responses and test results:
- `user`: User ID
- `testSeries`: Test Series ID
- `testId`: Test ID within the series
- `startedAt`: Test start timestamp
- `endedAt`: Test end timestamp
- `responses`: Array of user responses
- `score`: Calculated score
- `correct`: Number of correct answers
- `incorrect`: Number of incorrect answers
- `unattempted`: Number of unattempted questions
- `accuracy`: Percentage accuracy
- `speed`: Questions per minute
- `percentage`: Overall percentage
- `resultGenerated`: Boolean flag indicating if results are generated

### TestRanking Model
Stores ranking information for each test:
- `testId`: Test ID
- `testSeries`: Test Series ID
- `user`: User ID
- `score`: User's score
- `rank`: User's rank
- `accuracy`: User's accuracy percentage
- `totalParticipants`: Total number of participants

### Cutoff Model
Stores cutoff scores for different categories:
- `testSeries`: Test Series ID
- `testId`: Test ID
- `cutoff`: Object containing cutoff scores for:
  - `general`: General category cutoff
  - `sc`: Scheduled Caste cutoff
  - `st`: Scheduled Tribe cutoff
  - `obc`: Other Backward Classes cutoff

## API Endpoints Testing

### User Endpoints

#### 1. Start Test
**Endpoint**: `POST /api/v1/test-attempts/:seriesId/:testId/start`
**Headers**: 
- Authorization: Bearer `<user_token>`
**Description**: Initiates a test attempt for the user

**Test Steps**:
1. Send POST request with valid seriesId and testId
2. Verify response contains:
   - `success: true`
   - `data` with TestAttempt object
   - `startedAt` timestamp populated

**Expected Success Response**:
```json
{
  "success": true,
  "message": "Test started successfully",
  "data": {
    "_id": "attempt_id",
    "user": "user_id",
    "testSeries": "series_id",
    "testId": "test_id",
    "startedAt": "2023-05-15T10:30:00.000Z",
    "responses": [],
    "__v": 0
  }
}
```

#### 2. Submit Answer
**Endpoint**: `POST /api/v1/test-attempts/:seriesId/:testId/submit-question`
**Headers**: 
- Authorization: Bearer `<user_token>`
- Content-Type: application/json
**Body**:
```json
{
  "sectionId": "section_id",
  "questionId": "question_id",
  "selectedOption": 2,
  "timeTaken": 45
}
```
**Description**: Submits an answer for a specific question

**Test Steps**:
1. Send POST request with answer data
2. Verify response contains:
   - `success: true`
   - `data.isCorrect` boolean
   - `data.correctOption` value

**Expected Success Response**:
```json
{
  "success": true,
  "message": "Answer submitted successfully",
  "data": {
    "isCorrect": true,
    "correctOption": 2
  }
}
```

#### 3. Submit Test
**Endpoint**: `POST /api/v1/test-attempts/:seriesId/:testId/submit`
**Headers**: 
- Authorization: Bearer `<user_token>`
**Description**: Completes the test and generates results

**Test Steps**:
1. Send POST request to submit test
2. Verify response contains:
   - `success: true`
   - `data` with calculated results:
     - `score`
     - `correct`
     - `incorrect`
     - `unattempted`
     - `accuracy`
     - `speed`
     - `percentage`
     - `resultGenerated: true`

**Expected Success Response**:
```json
{
  "success": true,
  "message": "Test submitted successfully",
  "data": {
    "_id": "attempt_id",
    "user": "user_id",
    "testSeries": "series_id",
    "testId": "test_id",
    "startedAt": "2023-05-15T10:30:00.000Z",
    "endedAt": "2023-05-15T11:30:00.000Z",
    "responses": [...],
    "score": 45,
    "correct": 15,
    "incorrect": 5,
    "unattempted": 0,
    "accuracy": 75,
    "speed": 2.5,
    "percentage": 75,
    "resultGenerated": true,
    "__v": 1
  }
}
```

#### 4. Get Full Result Analysis
**Endpoint**: `GET /api/v1/test-attempts/:attemptId/result`
**Headers**: 
- Authorization: Bearer `<user_token>`
**Description**: Retrieves detailed result analysis

**Test Steps**:
1. Send GET request with attemptId
2. Verify response contains:
   - `success: true`
   - `data` with complete analysis:
     - `userSummary`
     - `cutoffAnalysis`
     - `sectionReport`
     - `performanceAnalysis`
     - `questionReport`

**Expected Success Response**:
```json
{
  "success": true,
  "message": "Result analysis fetched successfully",
  "data": {
    "userSummary": {
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "testName": "Mock Test 1",
      "testSeriesName": "UPSC Prelims 2023",
      "score": 45,
      "correct": 15,
      "incorrect": 5,
      "unattempted": 0,
      "accuracy": 75,
      "speed": 2.5,
      "percentage": 75,
      "rank": 5,
      "totalParticipants": 120,
      "percentile": 95.8
    },
    "cutoffAnalysis": {
      "status": "Passed",
      "userCategory": "GEN",
      "cutoffs": {
        "general": 35,
        "obc": 30,
        "sc": 25,
        "st": 25
      }
    },
    "sectionReport": [
      {
        "sectionName": "General Studies",
        "correct": 10,
        "incorrect": 2,
        "unattempted": 0,
        "accuracy": 83.33,
        "total": 12
      }
    ],
    "performanceAnalysis": {
      "strongestArea": "General Studies",
      "weakestArea": "Aptitude"
    },
    "questionReport": [
      {
        "questionText": "Which article of the Indian Constitution deals with the appointment of Governors?",
        "userAnswer": 1,
        "correctAnswer": 1,
        "status": "Correct",
        "explanation": "Article 155 deals with the appointment of Governors.",
        "section": "General Studies"
      }
    ]
  }
}
```

### Admin Endpoints

#### 1. Cutoff Management

##### 1.1 Set Cutoff for Test
**Endpoint**: `POST /api/admin/test-attempts/:seriesId/:testId/cutoff`
**Headers**: 
- Authorization: Bearer `<admin_token>`
- Content-Type: application/json
**Body**:
```json
{
  "general": 35,
  "obc": 30,
  "sc": 25,
  "st": 25
}
```
**Description**: Sets cutoff scores for different categories

**Test Steps**:
1. Send POST request with cutoff data
2. Verify response contains:
   - `success: true`
   - `data` with Cutoff object

**Expected Success Response**:
```json
{
  "success": true,
  "message": "Cutoff set successfully",
  "data": {
    "_id": "cutoff_id",
    "testSeries": "series_id",
    "testId": "test_id",
    "cutoff": {
      "general": 35,
      "obc": 30,
      "sc": 25,
      "st": 25
    },
    "__v": 0
  }
}
```

##### 1.2 Get Cutoff for Test
**Endpoint**: `GET /api/admin/test-attempts/:seriesId/:testId/cutoff`
**Headers**: 
- Authorization: Bearer `<admin_token>`
**Description**: Retrieves cutoff scores for a specific test

**Test Steps**:
1. Send GET request with seriesId and testId
2. Verify response contains:
   - `success: true`
   - `data` with Cutoff object

**Expected Success Response**:
```json
{
  "success": true,
  "message": "Cutoff fetched successfully",
  "data": {
    "_id": "cutoff_id",
    "testSeries": "series_id",
    "testId": "test_id",
    "cutoff": {
      "general": 35,
      "obc": 30,
      "sc": 25,
      "st": 25
    },
    "__v": 0
  }
}
```

##### 1.3 Update Cutoff for Test
**Endpoint**: `PUT /api/admin/test-attempts/:seriesId/:testId/cutoff`
**Headers**: 
- Authorization: Bearer `<admin_token>`
- Content-Type: application/json
**Body**:
```json
{
  "general": 40,
  "obc": 35,
  "sc": 30,
  "st": 30
}
```
**Description**: Updates cutoff scores for a specific test. Admins can update all cutoff values at once or specific ones individually. For example, sending `{"general": 40}` will only update the general cutoff while preserving other values.

**Test Steps**:
1. Send PUT request with updated cutoff data
2. Verify response contains:
   - `success: true`
   - `data` with updated Cutoff object

**Expected Success Response**:
```json
{
  "success": true,
  "message": "Cutoff updated successfully",
  "data": {
    "_id": "cutoff_id",
    "testSeries": "series_id",
    "testId": "test_id",
    "cutoff": {
      "general": 40,
      "obc": 35,
      "sc": 30,
      "st": 30
    },
    "__v": 1
  }
}
```

##### 1.4 Delete Cutoff for Test
**Endpoint**: `DELETE /api/admin/test-attempts/:seriesId/:testId/cutoff`
**Headers**: 
- Authorization: Bearer `<admin_token>`
**Description**: Deletes cutoff scores for a specific test

**Test Steps**:
1. Send DELETE request with seriesId and testId
2. Verify response contains:
   - `success: true`
   - Confirmation message

**Expected Success Response**:
```json
{
  "success": true,
  "message": "Cutoff deleted successfully"
}
```

#### 2. View All Participants
**Endpoint**: `GET /api/admin/test-attempts/:seriesId/:testId/participants`
**Headers**: 
- Authorization: Bearer `<admin_token>`
**Description**: Retrieves all participants' scores and rankings

**Test Steps**:
1. Send GET request with seriesId and testId
2. Verify response contains:
   - `success: true`
   - `data` array with participant information:
     - `userId`
     - `userName`
     - `userEmail`
     - `score`
     - `rank`
     - `accuracy`
     - `totalParticipants`
     - `correct`
     - `incorrect`
     - `unattempted`
     - `speed`

**Expected Success Response**:
```json
{
  "success": true,
  "message": "Participants fetched successfully",
  "data": [
    {
      "userId": "user_id_1",
      "userName": "John Doe",
      "userEmail": "john@example.com",
      "score": 45,
      "rank": 1,
      "accuracy": 75,
      "totalParticipants": 120,
      "correct": 15,
      "incorrect": 5,
      "unattempted": 0,
      "speed": 2.5
    }
  ]
}
```

## Complete Workflow Testing

### Scenario 1: User Takes a Test
1. **Start Test**:
   - User calls `POST /api/v1/test-attempts/:seriesId/:testId/start`
   - System creates TestAttempt record with `startedAt`

2. **Answer Questions**:
   - User calls `POST /api/v1/test-attempts/:seriesId/:testId/submit-question` for each question
   - System validates answers and updates TestAttempt responses

3. **Submit Test**:
   - User calls `POST /api/v1/test-attempts/:seriesId/:testId/submit`
   - System calculates:
     - Score based on positive marks for correct answers minus negative marks for incorrect answers
     - Correct/incorrect/unattempted counts
     - Accuracy percentage
     - Speed (questions per minute)
     - Updates ranking
   - System sets `resultGenerated: true`

4. **View Results**:
   - User calls `GET /api/v1/test-attempts/:attemptId/result`
   - System returns detailed analysis including:
     - User summary
     - Cutoff comparison
     - Section-wise report
     - Performance analysis
     - Question-wise report

### Scenario 2: Admin Manages Test
1. **Manage Cutoff**:
   - Admin calls `POST /api/admin/test-attempts/:seriesId/:testId/cutoff` to set cutoff scores
   - Admin calls `GET /api/admin/test-attempts/:seriesId/:testId/cutoff` to retrieve cutoff scores
   - Admin calls `PUT /api/admin/test-attempts/:seriesId/:testId/cutoff` to update cutoff scores
   - Admin calls `DELETE /api/admin/test-attempts/:seriesId/:testId/cutoff` to remove cutoff scores

2. **View Participants**:
   - Admin calls `GET /api/admin/test-attempts/:seriesId/:testId/participants`
   - System returns ranked list of all participants

## Expected Responses

### Success Responses
All successful API calls should return:
- HTTP status code 200/201
- JSON body with `success: true`
- Appropriate message
- Data payload as specified

### Error Responses
All error API calls should return:
- Appropriate HTTP status code (400, 401, 403, 404, 500)
- JSON body with `success: false`
- Descriptive error message
- Error details when applicable

### Common Error Scenarios
1. **Unauthorized Access**:
   - Status: 401
   - Message: "Unauthorized"

2. **Forbidden Access**:
   - Status: 403
   - Message: "You do not have access to this test series"

3. **Resource Not Found**:
   - Status: 404
   - Message: "Test attempt not found" or similar

4. **Invalid Data**:
   - Status: 400
   - Message: "Validation error" with details

5. **Server Error**:
   - Status: 500
   - Message: "Server error" with error details

This comprehensive testing guide should help ensure all aspects of the Test Series attempt workflow function correctly.