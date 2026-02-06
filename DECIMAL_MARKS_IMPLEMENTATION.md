# Decimal Marks Implementation

## Changes Made

### 1. Database Models Updated
All marks-related fields now use `DECIMAL(10, 2)` instead of `INTEGER`:

**Files Modified:**
- `backend/src/models/submission.js`: `marks` and `totalMarks`
- `backend/src/models/assignment.js`: `totalMarks`
- `backend/src/models/testCase.js`: `marks`

### 2. Backend Controllers Updated
Changed all integer parsing to float/decimal:

**admin.controller.js:**
- `createTestCase()`: Changed `parseInt(marks)` → `parseFloat(marks)`
- `updateTestCase()`: Changed `parseInt(marks)` → `parseFloat(marks)`
- `updateSubmissionMarks()`: 
  - Removed constraint checking against 100
  - Changed to `parseFloat(marks)` conversion
  - Only validates that marks >= 0 (no upper limit)

**grader.controller.js:**
- `provideFeedback()`: Changed `parseInt(marks)` → `parseFloat(marks)`

### 3. Frontend Updated
**admin.jsx:**
- Line 170: Changed `parseInt(marks)` → `parseFloat(marks)`
- Line 414: Changed `parseInt(e.target.value)` → `parseFloat(e.target.value)`

### 4. Database Migration Script
Created `backend/src/config/alterMarksToDecimal.js` to convert existing data:
- Alters `submissions.marks` to DECIMAL(10, 2)
- Alters `submissions.totalMarks` to DECIMAL(10, 2)
- Alters `assignments.totalMarks` to DECIMAL(10, 2)
- Alters `test_cases.marks` to DECIMAL(10, 2)

### 5. Package.json Updated
Added migration script:
```json
"migrate:marks": "node src/config/alterMarksToDecimal.js"
```

## How to Run Migration

After deploying the code changes, run:
```bash
cd backend
npm run migrate:marks
```

This will:
1. Convert all marks columns to DECIMAL(10, 2)
2. Preserve existing data (e.g., 2 stays as 2.00, 2.5 stays as 2.5)
3. Allow future marks to be stored with decimal precision

## Key Features

✅ **Decimal Support**: Marks can now be 2.5, 3.75, 4.2, etc.

✅ **No Upper Limit**: Marks are no longer restricted to assignment's totalMarks
- If assignment has 100 marks but bonus points can give 110, that's allowed
- Validation only checks that marks >= 0

✅ **Backward Compatible**: Existing integer marks (2, 3, 5) work fine
- Will be stored as 2.00, 3.00, 5.00 (decimals are equivalent)

✅ **Database Migration**: Safe conversion preserves all existing data

## Mark Display

Frontend automatically displays marks properly:
- 2.50 displays as "2.50" in score fields
- Calculations use floating-point arithmetic
- No rounding issues with decimal values

## Testing

1. Create assignment with custom totalMarks (e.g., 50 marks)
2. Create test cases with decimal marks (e.g., 2.5, 3.75)
3. Run tests and assign decimal marks (e.g., 47.5 out of 50)
4. Verify marks persist and calculate correctly
5. Check grader can assign decimal marks too
