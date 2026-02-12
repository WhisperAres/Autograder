# Test Case Marks Validation - Implementation Guide

## Feature Overview

Graders cannot upload test cases whose total marks exceed the marks assigned by the admin for an assignment.

## Implementation Details

### Backend Changes

**File:** `backend/src/auth/admin.controller.js`

#### 1. `createTestCase` Function (Lines 957-1008)
- **Validation Added:** Before creating a test case, calculates the sum of all existing test cases plus the new test case
- **Check:** `totalMarksAfterCreation > assignmentTotalMarks`
- **Response on Violation:** 
  - Status: 400 Bad Request
  - Message: "Total marks of test cases (X.XX) cannot exceed assignment total marks (Y.YY)"
  - Includes details: existingMarksSum, newMarks, totalMarksAfterCreation, assignmentTotalMarks

#### 2. `updateTestCase` Function (Lines 1019-1067)
- **Validation Added:** Before updating marks, calculates the sum of all OTHER test cases plus the new marks value
- **Check:** `totalMarksAfterUpdate > assignmentTotalMarks`
- **Response on Violation:**
  - Status: 400 Bad Request
  - Message: "Total marks of test cases (X.XX) cannot exceed assignment total marks (Y.YY)"
  - Includes details: otherMarksSum, newMarks, totalMarksAfterUpdate, assignmentTotalMarks

### Frontend Changes

**File:** `frontend/src/pages/testCaseManager.jsx`

#### 1. Marks Information Display (Lines 284-311)
- Shows assignment total marks
- Shows current test cases total marks
- Shows projected total if new test case is added
- Shows remaining marks available
- Displays warning message if marks would exceed limit

#### 2. Submit Button State (Lines 313-324)
- Button is disabled if projected total marks would exceed assignment total
- Still respects uploading state

## Testing Scenarios

### Test Case 1: Creating Test Case Within Limit
1. Admin creates assignment with 100 marks
2. Admin creates first test case with 60 marks ✅ (60 ≤ 100)
3. Admin creates second test case with 40 marks ✅ (100 ≤ 100)

### Test Case 2: Creating Test Case Exceeds Limit
1. Admin creates assignment with 100 marks
2. Admin creates first test case with 60 marks ✅
3. Admin tries to create second test case with 50 marks ❌
   - Total would be 110 > 100
   - Error: "Total marks of test cases (110.00) cannot exceed assignment total marks (100.00)"
   - Submit button is disabled
   - Warning message displayed

### Test Case 3: Updating Test Case Exceeds Limit
1. Assignment has 100 marks
2. Test Case 1: 50 marks
3. Test Case 2: 40 marks
4. Admin tries to update Test Case 1 from 50 to 60 marks ❌
   - Total would be 60 + 40 = 100 ► But new value is 60, so 60 + 40 = 100 ✅
5. Admin tries to update Test Case 1 from 50 to 70 marks ❌
   - Total would be 70 + 40 = 110 > 100
   - Error message shown

### Test Case 4: Frontend Prevents Submission
1. Assignment total: 100 marks
2. Existing test cases: 90 marks total
3. User enters 15 marks for new test case
   - Projected total: 105
   - Submit button becomes disabled
   - Warning message: "⚠️ This would exceed the assignment total by 5 marks"

## User Experience

### For Graders/Admins:

**When Creating/Editing Test Cases:**
1. See real-time calculation of marks
2. See remaining marks available
3. See warning if marks would exceed limit
4. Submit button becomes disabled when exceeding limit
5. If they try to submit, backend validation provides detailed error message

**Messages Displayed:**
- 📊 Assignment Total Marks: 100.00
- ✓ Current Test Cases Total: 60.00
- 📝 Projected Total: 100.00
- Remaining Marks: 40.00
- ⚠️ This would exceed the assignment total by 5.00 marks (only shown if will exceed)

## Error Handling

### Backend Error Response
```json
{
  "message": "Total marks of test cases (110.00) cannot exceed assignment total marks (100.00)",
  "existingMarksSum": "60.00",
  "newMarks": "50.00",
  "totalMarksAfterCreation": "110.00",
  "assignmentTotalMarks": "100.00"
}
```

### Frontend Error Display
- Caught by try-catch in handleCreateTestCase
- Displayed via setError()
- User sees error banner with validation message

## Implementation Verification

### Checklist:
- [x] Validation in createTestCase endpoint
- [x] Validation in updateTestCase endpoint
- [x] Frontend marks information display
- [x] Frontend button disable logic
- [x] Error handling on frontend
- [x] Helpful warning messages for users

## Database Queries Used

### Create Test Case Validation:
```javascript
const existingTestCases = await TestCase.findAll({
  where: { assignmentId: parseInt(assignmentId) },
  attributes: ['marks']
});
```

### Update Test Case Validation:
```javascript
const otherTestCases = await TestCase.findAll({
  where: { 
    assignmentId: testCase.assignmentId, 
    id: { [require('sequelize').Op.ne]: testCaseId } 
  },
  attributes: ['marks']
});
```

## Related Files

- Frontend: `frontend/src/pages/testCaseManager.jsx`
- Backend: `backend/src/auth/admin.controller.js`
- Routes: `backend/src/auth/admin.routes.js`
- Model: `backend/src/models/testCase.js`
- Model: `backend/src/models/assignment.js`
