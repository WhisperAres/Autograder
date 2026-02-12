# Dashboard Page Endpoints - Comprehensive Guide

## Overview

The backend has been reorganized to provide separate, dedicated endpoints for each dashboard page/feature. This follows REST best practices and improves API organization.

**Key Principle:** Each page in the dashboard now has its own endpoint that clearly describes its purpose. The underlying controller logic remains unchanged.

---

## ADMIN DASHBOARD - Page Endpoints

All endpoints are prefixed with: `/admin/page`

### 1. Dashboard Page
**Purpose:** View system statistics and overview

| Method | Endpoint | Function | Description |
|--------|----------|----------|-------------|
| GET | `/dashboard` | `getDashboardStats()` | Get dashboard statistics (users, assignments, submissions, etc.) |

---

### 2. Assignments Management Page
**Purpose:** Create, view, edit, delete assignments

| Method | Endpoint | Function | Description |
|--------|----------|----------|-------------|
| GET | `/assignments-list` | `getAssignments()` | Fetch all assignments |
| POST | `/assignments-list` | `createAssignment()` | Create new assignment |
| PATCH | `/assignments-list/:assignmentId` | `updateAssignment()` | Update assignment details |
| DELETE | `/assignments-list/:assignmentId` | `deleteAssignment()` | Delete assignment |
| PATCH | `/assignments-list/:assignmentId/toggle-visibility` | `toggleCanViewMarks()` | Toggle marks visibility for all students |
| GET | `/assignments-list/:assignmentId/export` | `downloadMarksCSV()` | Export marks as CSV |

**Usage Example:**
```javascript
// Get all assignments
GET /admin/page/assignments-list

// Create new assignment
POST /admin/page/assignments-list
Body: { title, description, dueDate, totalMarks }

// Update assignment
PATCH /admin/page/assignments-list/5
Body: { title, description, dueDate, totalMarks }

// Toggle visibility
PATCH /admin/page/assignments-list/5/toggle-visibility
Body: { canViewMarks: true }

// Export CSV
GET /admin/page/assignments-list/5/export
```

---

### 3. Submissions List Page
**Purpose:** View all submissions, filter by assignment

| Method | Endpoint | Function | Description |
|--------|----------|----------|-------------|
| GET | `/submissions-list` | `getAllSubmissions()` | Fetch all submissions across all assignments |
| GET | `/submissions-list/:assignmentId` | `getSubmissionsByAssignment()` | Fetch submissions for specific assignment |
| POST | `/submissions-list/:assignmentId/run-all-tests` | `runBulkTests()` | Run tests for all submissions in assignment |

**Usage Example:**
```javascript
// Get all submissions
GET /admin/page/submissions-list

// Get submissions for assignment 5
GET /admin/page/submissions-list/5

// Run tests for all submissions in assignment 5
POST /admin/page/submissions-list/5/run-all-tests
```

---

### 4. Grade Submission Page
**Purpose:** View, test, and grade individual submissions

| Method | Endpoint | Function | Description |
|--------|----------|----------|-------------|
| GET | `/grade-submission/:submissionId` | `getSubmissionCodeFiles()` | Get submission with code files |
| PATCH | `/grade-submission/:submissionId/marks` | `updateSubmissionMarks()` | Update submission marks |
| PATCH | `/grade-submission/:submissionId/visibility` | `toggleViewMarks()` | Toggle marks visibility for this submission |
| POST | `/grade-submission/:submissionId/run-tests` | `runTestCases()` | Run tests on submission |
| POST | `/grade-submission/:submissionId/run-single-test` | `runSingleTest()` | Run single test on submission |

**Usage Example:**
```javascript
// Get submission details
GET /admin/page/grade-submission/42

// Update marks
PATCH /admin/page/grade-submission/42/marks
Body: { marks: 85 }

// Toggle marks visibility
PATCH /admin/page/grade-submission/42/visibility
Body: { viewMarks: true }

// Run all tests
POST /admin/page/grade-submission/42/run-tests

// Run single test
POST /admin/page/grade-submission/42/run-single-test
Body: { testCaseId: 3 }
```

---

### 5. User Management Page
**Purpose:** Manage users (create, edit, delete), assign roles

| Method | Endpoint | Function | Description |
|--------|----------|----------|-------------|
| GET | `/users-management` | `getAllUsers()` | Fetch all users |
| GET | `/users-management/role/:role` | `getUsersByRole()` | Fetch users by role (student/grader/admin) |
| POST | `/users-management` | `createUser()` | Create new user |
| PATCH | `/users-management/:userId/role` | `updateUserRole()` | Update user role |
| DELETE | `/users-management/:userId` | `deleteUser()` | Delete user |

**Usage Example:**
```javascript
// Get all users
GET /admin/page/users-management

// Get all students
GET /admin/page/users-management/role/student

// Create new user
POST /admin/page/users-management
Body: { email, name, password, role }

// Update user role
PATCH /admin/page/users-management/10/role
Body: { role: "grader" }

// Delete user
DELETE /admin/page/users-management/10
```

---

### 6. Test Cases Management Page
**Purpose:** Create, edit, delete test cases for assignments

| Method | Endpoint | Function | Description |
|--------|----------|----------|-------------|
| GET | `/test-cases-management/:assignmentId` | `getTestCases()` | Fetch all test cases for assignment |
| POST | `/test-cases-management/:assignmentId` | `createTestCase()` | Create new test case |
| PATCH | `/test-cases-management/:testCaseId` | `updateTestCase()` | Update test case |
| DELETE | `/test-cases-management/:testCaseId` | `deleteTestCase()` | Delete test case |

**Usage Example:**
```javascript
// Get test cases for assignment 5
GET /admin/page/test-cases-management/5

// Create test case
POST /admin/page/test-cases-management/5
Body: { testName, testCode, marks, isHidden }

// Update test case
PATCH /admin/page/test-cases-management/8
Body: { testName, testCode, marks, isHidden }

// Delete test case
DELETE /admin/page/test-cases-management/8
```

---

### 7. Reports Page
**Purpose:** View reports and export data

| Method | Endpoint | Function | Description |
|--------|----------|----------|-------------|
| GET | `/reports/:assignmentId/marks-report` | `getMarksReport()` | Get marks report for assignment |
| GET | `/reports/:assignmentId/export-csv` | `downloadMarksCSV()` | Export marks as CSV file |

**Usage Example:**
```javascript
// Get marks report
GET /admin/page/reports/5/marks-report

// Export as CSV
GET /admin/page/reports/5/export-csv
```

---

## GRADER DASHBOARD - Page Endpoints

All endpoints are prefixed with: `/grader/page`

### 1. Dashboard Page
**Purpose:** View assignments available for grading

| Method | Endpoint | Function | Description |
|--------|----------|----------|-------------|
| GET | `/dashboard` | `getAssignments()` | Fetch all assignments for grading |

---

### 2. Test Solutions Page
**Purpose:** Upload code files and run tests on your solution

| Method | Endpoint | Function | Description |
|--------|----------|----------|-------------|
| POST | `/test-solutions/:assignmentId/upload` | `uploadGraderSolution()` | Upload solution files |
| GET | `/test-solutions/:assignmentId/list` | `getGraderSolutions()` | Get uploaded solutions for assignment |
| GET | `/test-solutions/:solutionId/detail` | `getGraderSolution()` | Get solution details |
| GET | `/test-solutions/:solutionId/file/:fileId` | `getGraderSolutionFile()` | Get specific file content |
| DELETE | `/test-solutions/:solutionId/delete-all` | `deleteGraderSolution()` | Delete all files from solution |
| DELETE | `/test-solutions/:solutionId/file/:fileId/delete` | `deleteGraderSolutionFile()` | Delete specific file |
| POST | `/test-solutions/:assignmentId/run-tests` | `runGraderTests()` | Run tests on uploaded solution |

**Usage Example:**
```javascript
// Upload solution
POST /grader/page/test-solutions/5/upload
FormData: { files: [file1, file2, ...] }

// Get solutions list
GET /grader/page/test-solutions/5/list

// Get solution detail
GET /grader/page/test-solutions/42/detail

// Get file content
GET /grader/page/test-solutions/42/file/15

// Delete all files
DELETE /grader/page/test-solutions/42/delete-all

// Delete specific file
DELETE /grader/page/test-solutions/42/file/15/delete

// Run tests
POST /grader/page/test-solutions/5/run-tests
Body: { solutionId: 42 }
```

---

### 3. Grade Submissions Page
**Purpose:** View and grade student submissions

| Method | Endpoint | Function | Description |
|--------|----------|----------|-------------|
| GET | `/grade-submissions/list` | `getAllSubmissions()` | Fetch all submissions |
| GET | `/grade-submissions/:assignmentId/list` | `getSubmissionsByAssignment()` | Fetch submissions for specific assignment |
| GET | `/grade-submissions/:submissionId` | `getSubmissionForGrading()` | Get submission details |
| GET | `/grade-submissions/:submissionId/code` | `getSubmissionCode()` | Get all code files for submission |
| GET | `/grade-submissions/:submissionId/code/:fileId` | `getSubmissionCode()` | Get specific code file |
| GET | `/grade-submissions/:submissionId/feedback` | `getSubmissionFeedback()` | Get existing feedback |
| POST | `/grade-submissions/:submissionId/run-tests` | `runTestCases()` | Run tests on submission |
| POST | `/grade-submissions/:submissionId/feedback` | `provideFeedback()` | Submit feedback and marks |
| PATCH | `/grade-submissions/:submissionId/status` | `updateSubmissionStatus()` | Update submission status |

**Usage Example:**
```javascript
// Get submissions for assignment 5
GET /grader/page/grade-submissions/5/list

// Get submission details
GET /grader/page/grade-submissions/42

// Get all code files
GET /grader/page/grade-submissions/42/code

// Get specific code file
GET /grader/page/grade-submissions/42/code/15

// Get feedback
GET /grader/page/grade-submissions/42/feedback

// Run tests
POST /grader/page/grade-submissions/42/run-tests

// Submit feedback
POST /grader/page/grade-submissions/42/feedback
Body: { marks, feedback, status }

// Update status
PATCH /grader/page/grade-submissions/42/status
Body: { status: "graded" }
```

---

### 4. Test Cases Management Page
**Purpose:** Create and edit test cases for assignments

| Method | Endpoint | Function | Description |
|--------|----------|----------|-------------|
| GET | `/manage-test-cases/:assignmentId/list` | `getTestCases()` | Fetch all test cases for assignment |
| POST | `/manage-test-cases/:assignmentId` | `createTestCase()` | Create new test case |
| PATCH | `/manage-test-cases/:testCaseId` | `updateTestCase()` | Update test case |
| DELETE | `/manage-test-cases/:testCaseId/delete` | `deleteTestCase()` | Delete test case |

**Usage Example:**
```javascript
// Get test cases
GET /grader/page/manage-test-cases/5/list

// Create test case
POST /grader/page/manage-test-cases/5
Body: { testName, testCode, marks, isHidden }

// Update test case
PATCH /grader/page/manage-test-cases/8
Body: { testName, testCode, marks, isHidden }

// Delete test case
DELETE /grader/page/manage-test-cases/8/delete
```

---

## STUDENT DASHBOARD - Page Endpoints

All endpoints are prefixed with: `/student/page`

### 1. Dashboard Page
**Purpose:** View all available assignments

| Method | Endpoint | Function | Description |
|--------|----------|----------|-------------|
| GET | `/dashboard` | `getAllAssignments()` | Fetch all assignments |
| GET | `/dashboard/submissions` | `getStudentSubmissions()` | Fetch all submissions for student |

---

### 2. Submit Assignment Page
**Purpose:** Upload solution for an assignment

| Method | Endpoint | Function | Description |
|--------|----------|----------|-------------|
| GET | `/submit-assignment/:assignmentId` | `getAssignmentById()` | Get assignment details |
| POST | `/submit-assignment/:assignmentId/upload` | `uploadSubmission()` | Upload solution file(s) |
| DELETE | `/submit-assignment/:submissionId/file/:fileId/delete` | `deleteSubmissionFile()` | Delete file from submission |

**Usage Example:**
```javascript
// Get assignment details
GET /student/page/submit-assignment/5

// Upload solution
POST /student/page/submit-assignment/5/upload
FormData: { file: file }

// Delete file
DELETE /student/page/submit-assignment/42/file/15/delete
```

---

### 3. View Results Page
**Purpose:** View test results and feedback

| Method | Endpoint | Function | Description |
|--------|----------|----------|-------------|
| GET | `/view-results/:submissionId` | `getSubmissionResults()` | Get test results for submission |
| GET | `/view-results/:submissionId/code/:fileId` | `getSubmissionCode()` | Get code file content |

**Usage Example:**
```javascript
// Get test results
GET /student/page/view-results/42

// Get code file
GET /student/page/view-results/42/code/15
```

---

## Summary Table

### All New Endpoints by Dashboard

| Dashboard | Page | Base Path | Count |
|-----------|------|-----------|-------|
| **Admin** | 7 pages | `/admin/page` | 28 endpoints |
| **Grader** | 4 pages | `/grader/page` | 22 endpoints |
| **Student** | 3 pages | `/student/page` | 7 endpoints |
| **Total** | 14 pages | | 57 endpoints |

---

## Migration Guide

### For Frontend Development

1. **Old endpoints** (original routes) still work - no breaking changes
2. **New endpoints** offer better organization and should be preferred for new code
3. **Migration approach:** Gradually update frontend code to use new endpoints

### Example Frontend Update

**Before (old endpoint):**
```javascript
fetch("http://localhost:5000/admin/assignments", {
  method: "GET",
  headers: { Authorization: `Bearer ${token}` }
})
```

**After (new endpoint):**
```javascript
fetch("http://localhost:5000/admin/page/assignments-list", {
  method: "GET",
  headers: { Authorization: `Bearer ${token}` }
})
```

---

## Key Benefits

✅ **Clear Organization:** Each page has dedicated endpoints
✅ **Better REST Practices:** URLs clearly describe resources and actions  
✅ **Easier Documentation:** Clear mapping between pages and endpoints
✅ **Maintainability:** Related endpoints grouped together
✅ **No Logic Changes:** All controller methods work exactly as before
✅ **Backward Compatible:** Old endpoints still functional during migration

---

## Implementation Details

### Files Created
- `/backend/src/auth/admin-pages.routes.js` - Admin page routes
- `/backend/src/auth/grader-pages.routes.js` - Grader page routes
- `/backend/src/auth/student-pages.routes.js` - Student page routes

### Files Modified
- `/backend/src/app.js` - Added new route registrations

### Architecture
```
app.js
├── /admin (existing)
├── /admin/page (NEW - page-specific)
├── /grader (existing)
├── /grader/page (NEW - page-specific)
├── /student/page (NEW - page-specific)
└── /auth, /assignments, /submissions (existing)
```

All new page routes use the same controller methods - **no logic changes**.
