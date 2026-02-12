# Quick Reference - New Endpoints by Page

## Admin Dashboard

| Page | Endpoint Base | Key Routes |
|------|---------------|-----------|
| **Dashboard** | `/admin/page/dashboard` | `GET` |
| **Assignments List** | `/admin/page/assignments-list` | GET, POST, PATCH, DELETE, `/export` |
| **Submissions List** | `/admin/page/submissions-list` | GET, GET/:assignmentId, POST/:assignmentId/run-all-tests |
| **Grade Submission** | `/admin/page/grade-submission/:submissionId` | GET, PATCH `/marks`, PATCH `/visibility`, POST `/run-tests` |
| **User Management** | `/admin/page/users-management` | GET, POST, PATCH `/role/:userId`, DELETE |
| **Test Cases Mgmt** | `/admin/page/test-cases-management/:assignmentId` | GET, POST, PATCH, DELETE |
| **Reports** | `/admin/page/reports/:assignmentId` | GET `/marks-report`, GET `/export-csv` |

---

## Grader Dashboard

| Page | Endpoint Base | Key Routes |
|------|---------------|-----------|
| **Dashboard** | `/grader/page/dashboard` | `GET` |
| **Test Solutions** | `/grader/page/test-solutions` | POST `/upload`, GET `/list`, DELETE, `/run-tests` |
| **Grade Submissions** | `/grader/page/grade-submissions` | GET, GET `/list`, POST `/feedback`, POST `/run-tests` |
| **Test Cases Mgmt** | `/grader/page/manage-test-cases/:assignmentId` | GET, POST, PATCH, DELETE |

---

## Student Dashboard

| Page | Endpoint Base | Key Routes |
|------|---------------|-----------|
| **Dashboard** | `/student/page/dashboard` | GET, GET `/submissions` |
| **Submit Assignment** | `/student/page/submit-assignment/:assignmentId` | GET, POST `/upload`, DELETE `/file/:fileId/delete` |
| **View Results** | `/student/page/view-results/:submissionId` | GET, GET `/code/:fileId` |

---

## Quick Lookup

### Find endpoint for a page:

**I want to list all assignments in Admin**
```
/admin/page/assignments-list (GET)
```

**I want to grade a student submission in Admin**
```
/admin/page/grade-submission/:submissionId (GET)
/admin/page/grade-submission/:submissionId/marks (PATCH)
/admin/page/grade-submission/:submissionId/run-tests (POST)
```

**I want to upload solution code in Grader**
```
/grader/page/test-solutions/:assignmentId/upload (POST)
```

**I want to submit assignment in Student**
```
/student/page/submit-assignment/:assignmentId/upload (POST)
```

**I want to view my test results in Student**
```
/student/page/view-results/:submissionId (GET)
```

---

## Endpoint Count Summary

```
Admin:   28 endpoints (7 pages)
Grader:  22 endpoints (4 pages)
Student:  7 endpoints (3 pages)
─────────────────────────────
Total:   57 endpoints (14 pages)
```

---

## Key URL Patterns

### Admin
- List/View: `/admin/page/{resource-name}`
- Detail/Action: `/admin/page/{resource}/:id/{action}`
- Examples:
  - `/admin/page/assignments-list/5/toggle-visibility`
  - `/admin/page/grade-submission/42/marks`
  - `/admin/page/test-cases-management/5`

### Grader
- List/View: `/grader/page/{page-name}/:assignmentId/{action}`
- Detail: `/grader/page/{page-name}/:id/{action}`
- Examples:
  - `/grader/page/test-solutions/5/upload`
  - `/grader/page/grade-submissions/42/feedback`

### Student
- List/View: `/student/page/{page-name}`
- Detail/Action: `/student/page/{page-name}/:id/{action}`
- Examples:
  - `/student/page/submit-assignment/5/upload`
  - `/student/page/view-results/42/code/15`

---

## Common Method Handlers

| Handler | Used For | Common Endpoints |
|---------|----------|-----------------|
| `getAssignments()` | Get all assignments | `/admin/page/assignments-list`, `/grader/page/dashboard` |
| `createAssignment()` | Create new | `/admin/page/assignments-list` |
| `getAllSubmissions()` | View all submissions | `/admin/page/submissions-list`, `/grader/page/grade-submissions/list` |
| `getSubmissionCodeFiles()` | View submission | `/admin/page/grade-submission/:id` |
| `runTestCases()` | Execute tests | `/admin/page/grade-submission/:id/run-tests` |
| `provideFeedback()` | Grade submission | `/grader/page/grade-submissions/:id/feedback` |
| `getTestCases()` | List test cases | `/admin/page/test-cases-management/:id` |
| `uploadSubmission()` | Student upload | `/student/page/submit-assignment/:id/upload` |
| `getSubmissionResults()` | View results | `/student/page/view-results/:id` |

---

## How to Use This Reference

**During Frontend Development:**

1. **Identify the page** you're working on
2. **Find it in the Quick Lookup section** above
3. **Copy the endpoint path** (e.g., `/admin/page/assignments-list`)
4. **Update your fetch() call** with the new endpoint
5. **Test in browser** - should work exactly as before

**Example Update:**

```javascript
// OLD CODE
POST /admin/assignments

// BECOMES
POST /admin/page/assignments-list

// Example in React:
const response = await fetch(
  `http://localhost:5000/admin/page/assignments-list`,
  { method: "POST", body: JSON.stringify(data), ... }
);
```

---

## Important Reminders

✅ **Backward Compatible:** Old endpoints still work
✅ **Same Logic:** No business logic changed
✅ **Test Everything:** Verify after updating endpoints
✅ **Gradual Migration:** Update one page at a time
✅ **Documentation:** Refer to DASHBOARD_PAGE_ENDPOINTS.md for detailed API specs

---

Generated: February 11, 2026
