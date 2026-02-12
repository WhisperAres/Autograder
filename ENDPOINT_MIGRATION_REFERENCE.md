# Endpoint Migration Reference - Old vs New

## Quick Reference for Frontend Updates

This document shows side-by-side comparison of old endpoints vs new page-specific endpoints.

---

## ADMIN DASHBOARD

### Dashboard Statistics
```
OLD: GET /admin/stats
NEW: GET /admin/page/dashboard
```

### Assignments List
```
OLD: GET /admin/assignments
NEW: GET /admin/page/assignments-list

OLD: POST /admin/assignments
NEW: POST /admin/page/assignments-list

OLD: PATCH /admin/assignments/:assignmentId
NEW: PATCH /admin/page/assignments-list/:assignmentId

OLD: DELETE /admin/assignments/:assignmentId
NEW: DELETE /admin/page/assignments-list/:assignmentId

OLD: PATCH /admin/assignments/:assignmentId/view-marks
NEW: PATCH /admin/page/assignments-list/:assignmentId/toggle-visibility

OLD: GET /admin/assignments/:assignmentId/export-csv
NEW: GET /admin/page/assignments-list/:assignmentId/export
```

### Submissions List
```
OLD: GET /admin/submissions
NEW: GET /admin/page/submissions-list

OLD: GET /admin/submissions/assignment/:assignmentId
NEW: GET /admin/page/submissions-list/:assignmentId

OLD: POST /admin/assignments/:assignmentId/run-all-tests
NEW: POST /admin/page/submissions-list/:assignmentId/run-all-tests
```

### Grade Submission
```
OLD: GET /admin/submissions/:submissionId/code-files
NEW: GET /admin/page/grade-submission/:submissionId

OLD: PATCH /admin/submissions/:submissionId/marks
NEW: PATCH /admin/page/grade-submission/:submissionId/marks

OLD: PATCH /admin/submissions/:submissionId/view-marks
NEW: PATCH /admin/page/grade-submission/:submissionId/visibility

OLD: POST /admin/submissions/:submissionId/run-tests
NEW: POST /admin/page/grade-submission/:submissionId/run-tests

OLD: POST /admin/submissions/:submissionId/run-single-test
NEW: POST /admin/page/grade-submission/:submissionId/run-single-test
```

### User Management
```
OLD: GET /admin/users
NEW: GET /admin/page/users-management

OLD: GET /admin/users/role/:role
NEW: GET /admin/page/users-management/role/:role

OLD: POST /admin/users
NEW: POST /admin/page/users-management

OLD: PATCH /admin/users/:userId/role
NEW: PATCH /admin/page/users-management/:userId/role

OLD: DELETE /admin/users/:userId
NEW: DELETE /admin/page/users-management/:userId
```

### Test Cases Management
```
OLD: GET /admin/assignments/:assignmentId/test-cases
NEW: GET /admin/page/test-cases-management/:assignmentId

OLD: POST /admin/assignments/:assignmentId/test-cases
NEW: POST /admin/page/test-cases-management/:assignmentId

OLD: PATCH /admin/test-cases/:testCaseId
NEW: PATCH /admin/page/test-cases-management/:testCaseId

OLD: DELETE /admin/test-cases/:testCaseId
NEW: DELETE /admin/page/test-cases-management/:testCaseId
```

### Reports
```
OLD: GET /admin/assignments/:assignmentId/marks-report
NEW: GET /admin/page/reports/:assignmentId/marks-report

OLD: GET /admin/assignments/:assignmentId/export-csv
NEW: GET /admin/page/reports/:assignmentId/export-csv
```

---

## GRADER DASHBOARD

### Dashboard
```
OLD: GET /grader/assignments
NEW: GET /grader/page/dashboard
```

### Test Solutions
```
OLD: POST /grader/solutions/:assignmentId
NEW: POST /grader/page/test-solutions/:assignmentId/upload

OLD: GET /grader/solutions/:assignmentId
NEW: GET /grader/page/test-solutions/:assignmentId/list

OLD: GET /grader/solutions/:solutionId/detail
NEW: GET /grader/page/test-solutions/:solutionId/detail

OLD: GET /grader/solutions/:solutionId/file/:fileId
NEW: GET /grader/page/test-solutions/:solutionId/file/:fileId

OLD: DELETE /grader/solutions/:solutionId
NEW: DELETE /grader/page/test-solutions/:solutionId/delete-all

OLD: DELETE /grader/solutions/:solutionId/file/:fileId
NEW: DELETE /grader/page/test-solutions/:solutionId/file/:fileId/delete

OLD: POST /grader/solutions/:assignmentId/run-tests
NEW: POST /grader/page/test-solutions/:assignmentId/run-tests
```

### Grade Submissions
```
OLD: GET /grader/submissions
NEW: GET /grader/page/grade-submissions/list

OLD: GET /grader/submissions/assignment/:assignmentId
NEW: GET /grader/page/grade-submissions/:assignmentId/list

OLD: GET /grader/submissions/:submissionId
NEW: GET /grader/page/grade-submissions/:submissionId

OLD: GET /grader/submissions/:submissionId/code
NEW: GET /grader/page/grade-submissions/:submissionId/code

OLD: GET /grader/submissions/:submissionId/code/:fileId
NEW: GET /grader/page/grade-submissions/:submissionId/code/:fileId

OLD: GET /grader/submissions/:submissionId/feedback
NEW: GET /grader/page/grade-submissions/:submissionId/feedback

OLD: POST /grader/submissions/:submissionId/run-tests
NEW: POST /grader/page/grade-submissions/:submissionId/run-tests

OLD: POST /grader/submissions/:submissionId/feedback
NEW: POST /grader/page/grade-submissions/:submissionId/feedback

OLD: PATCH /grader/submissions/:submissionId/status
NEW: PATCH /grader/page/grade-submissions/:submissionId/status
```

### Test Cases Management
```
OLD: GET /grader/assignments/:assignmentId/test-cases
NEW: GET /grader/page/manage-test-cases/:assignmentId/list

OLD: POST /grader/assignments/:assignmentId/test-cases
NEW: POST /grader/page/manage-test-cases/:assignmentId

OLD: PATCH /grader/test-cases/:testCaseId
NEW: PATCH /grader/page/manage-test-cases/:testCaseId

OLD: DELETE /grader/test-cases/:testCaseId
NEW: DELETE /grader/page/manage-test-cases/:testCaseId/delete
```

---

## STUDENT DASHBOARD

### Dashboard
```
OLD: GET /assignments (from assignments.routes)
NEW: GET /student/page/dashboard

OLD: GET /submissions (from submissions.routes)
NEW: GET /student/page/dashboard/submissions
```

### Submit Assignment
```
OLD: GET /assignments/:id
NEW: GET /student/page/submit-assignment/:assignmentId

OLD: POST /submissions
NEW: POST /student/page/submit-assignment/:assignmentId/upload

OLD: DELETE /submissions/:submissionId/file/:fileId
NEW: DELETE /student/page/submit-assignment/:submissionId/file/:fileId/delete
```

### View Results
```
OLD: GET /submissions/:submissionId/results
NEW: GET /student/page/view-results/:submissionId

OLD: GET /submissions/:submissionId/code/:fileId
NEW: GET /student/page/view-results/:submissionId/code/:fileId
```

---

## Pattern Summary

### Old Patterns
- Routes mixed different concerns
- URLs didn't clearly indicate which page/feature was being accessed
- `/admin/assignments`, `/admin/submissions`, `/admin/users` all listed
- Many routes spread across different files

### New Patterns
```
/admin/page/{feature-name}/{optional-action}
/grader/page/{feature-name}/{optional-action}
/student/page/{feature-name}/{optional-action}
```

### Naming Conventions

**List/View Pages:**
- `/admin/page/assignments-list`
- `/admin/page/submissions-list`
- `/admin/page/users-management`
- `/grader/page/grade-submissions/:assignmentId/list`

**Detail/Action Pages:**
- `/admin/page/grade-submission/:submissionId`
- `/grader/page/test-solutions/:assignmentId/upload`
- `/student/page/submit-assignment/:assignmentId`

**Reports/Export:**
- `/admin/page/reports/:assignmentId/marks-report`
- `/admin/page/reports/:assignmentId/export-csv`

---

## Implementation Status

✅ **Created Files:**
- `backend/src/auth/admin-pages.routes.js` - 28 endpoints
- `backend/src/auth/grader-pages.routes.js` - 22 endpoints
- `backend/src/auth/student-pages.routes.js` - 7 endpoints

✅ **Updated Files:**
- `backend/src/app.js` - Route registration

✅ **Status:** Ready for frontend migration

---

## Migration Checklist

For each dashboard (Admin, Grader, Student):

### Admin Dashboard Pages to Update
- [ ] admin.jsx - Dashboard page
- [ ] admin.jsx - Assignments management section
- [ ] admin.jsx - Submissions list section
- [ ] admin.jsx - Grade submission page
- [ ] admin.jsx - User management page
- [ ] testCaseManager.jsx - Test cases management
- [ ] admin.jsx - Reports section

### Grader Dashboard Pages to Update
- [ ] grader.jsx - Dashboard/assignments list
- [ ] grader.jsx - Test solutions upload/run section
- [ ] grader.jsx - Grade submissions section
- [ ] testCaseManager.jsx - Test cases management (when called from grader)

### Student Dashboard Pages to Update
- [ ] dashboard.jsx - Dashboard/assignments list
- [ ] dashboard.jsx - Submit assignment page
- [ ] dashboard.jsx - View results section
