# New Endpoints - Developer Quick Start

## TL;DR - What Changed?

✅ **3 new route files created** with page-specific endpoints
✅ **57 new endpoints added** (28 admin + 22 grader + 7 student)
✅ **All existing code still works** - backward compatible
✅ **No logic changes** - same functionality, better organization

---

## For Each Dashboard - Updated Endpoints

### 🔴 ADMIN - Change these 7 pages of endpoints:

```javascript
// OLD → NEW Examples:

// Page 1: Dashboard
GET /admin/stats  
→ GET /admin/page/dashboard

// Page 2: Assignments List  
GET /admin/assignments
→ GET /admin/page/assignments-list

// Page 3: Grade Submission
GET /admin/submissions/:id/code-files
→ GET /admin/page/grade-submission/:id

// Page 4: Users Management
GET /admin/users
→ GET /admin/page/users-management

// Page 5: Test Cases
GET /admin/assignments/:id/test-cases
→ GET /admin/page/test-cases-management/:id

// Page 6: Submissions List
GET /admin/submissions/assignment/:id
→ GET /admin/page/submissions-list/:id

// Page 7: Reports
GET /admin/assignments/:id/export-csv  
→ GET /admin/page/reports/:id/export-csv
```

### 🟢 GRADER - Change these 4 pages of endpoints:

```javascript
// OLD → NEW Examples:

// Page 1: Dashboard
GET /grader/assignments
→ GET /grader/page/dashboard

// Page 2: Upload & Test Solutions
POST /grader/solutions/:id
→ POST /grader/page/test-solutions/:id/upload

// Page 3: Grade Submissions
GET /grader/submissions/assignment/:id
→ GET /grader/page/grade-submissions/:id/list

// Page 4: Test Cases
GET /grader/assignments/:id/test-cases
→ GET /grader/page/manage-test-cases/:id/list
```

### 🔵 STUDENT - Change these 3 pages of endpoints:

```javascript
// OLD → NEW Examples:

// Page 1: Dashboard
GET /assignments
→ GET /student/page/dashboard

// Page 2: Submit Assignment
POST /submissions
→ POST /student/page/submit-assignment/:id/upload

// Page 3: View Results
GET /submissions/:id/results
→ GET /student/page/view-results/:id
```

---

## How to Update Your Code

### Step 1: Find the endpoint in your code
```javascript
// Look for lines with fetch() that hit old endpoints
fetch("http://localhost:5000/admin/assignments", ...)
```

### Step 2: Map it to the new endpoint
```
ADMIN: /admin/assignments
→ NEW: /admin/page/assignments-list
```

### Step 3: Replace the URL
```javascript
// OLD
fetch("http://localhost:5000/admin/assignments", ...)

// NEW  
fetch("http://localhost:5000/admin/page/assignments-list", ...)
```

### Step 4: Test it works
- Run the frontend
- Verify the page still loads correctly
- Check network tab - should see requests to `/admin/page/...`

---

## Complete Mapping Reference

### ADMIN Dashboard

| OLD Endpoint | → | NEW Endpoint |
|---|---|---|
| `GET /admin/stats` | → | `GET /admin/page/dashboard` |
| `GET /admin/assignments` | → | `GET /admin/page/assignments-list` |
| `POST /admin/assignments` | → | `POST /admin/page/assignments-list` |
| `PATCH /admin/assignments/:id` | → | `PATCH /admin/page/assignments-list/:id` |
| `DELETE /admin/assignments/:id` | → | `DELETE /admin/page/assignments-list/:id` |
| `PATCH /admin/assignments/:id/view-marks` | → | `PATCH /admin/page/assignments-list/:id/toggle-visibility` |
| `GET /admin/submissions` | → | `GET /admin/page/submissions-list` |
| `GET /admin/submissions/assignment/:id` | → | `GET /admin/page/submissions-list/:id` |
| `POST /admin/assignments/:id/run-all-tests` | → | `POST /admin/page/submissions-list/:id/run-all-tests` |
| `GET /admin/submissions/:id/code-files` | → | `GET /admin/page/grade-submission/:id` |
| `PATCH /admin/submissions/:id/marks` | → | `PATCH /admin/page/grade-submission/:id/marks` |
| `PATCH /admin/submissions/:id/view-marks` | → | `PATCH /admin/page/grade-submission/:id/visibility` |
| `POST /admin/submissions/:id/run-tests` | → | `POST /admin/page/grade-submission/:id/run-tests` |
| `GET /admin/users` | → | `GET /admin/page/users-management` |
| `POST /admin/users` | → | `POST /admin/page/users-management` |
| `PATCH /admin/users/:id/role` | → | `PATCH /admin/page/users-management/:id/role` |
| `DELETE /admin/users/:id` | → | `DELETE /admin/page/users-management/:id` |
| `GET /admin/assignments/:id/test-cases` | → | `GET /admin/page/test-cases-management/:id` |
| `POST /admin/assignments/:id/test-cases` | → | `POST /admin/page/test-cases-management/:id` |
| `PATCH /admin/test-cases/:id` | → | `PATCH /admin/page/test-cases-management/:id` |
| `DELETE /admin/test-cases/:id` | → | `DELETE /admin/page/test-cases-management/:id` |
| `GET /admin/assignments/:id/marks-report` | → | `GET /admin/page/reports/:id/marks-report` |
| `GET /admin/assignments/:id/export-csv` | → | `GET /admin/page/reports/:id/export-csv` |

### GRADER Dashboard

| OLD Endpoint | → | NEW Endpoint |
|---|---|---|
| `GET /grader/assignments` | → | `GET /grader/page/dashboard` |
| `POST /grader/solutions/:id` | → | `POST /grader/page/test-solutions/:id/upload` |
| `GET /grader/solutions/:id` | → | `GET /grader/page/test-solutions/:id/list` |
| `GET /grader/solutions/:id/detail` | → | `GET /grader/page/test-solutions/:id/detail` |
| `GET /grader/solutions/:id/file/:fid` | → | `GET /grader/page/test-solutions/:id/file/:fid` |
| `DELETE /grader/solutions/:id` | → | `DELETE /grader/page/test-solutions/:id/delete-all` |
| `DELETE /grader/solutions/:id/file/:fid` | → | `DELETE /grader/page/test-solutions/:id/file/:fid/delete` |
| `POST /grader/solutions/:id/run-tests` | → | `POST /grader/page/test-solutions/:id/run-tests` |
| `GET /grader/submissions` | → | `GET /grader/page/grade-submissions/list` |
| `GET /grader/submissions/assignment/:id` | → | `GET /grader/page/grade-submissions/:id/list` |
| `GET /grader/submissions/:id` | → | `GET /grader/page/grade-submissions/:id` |
| `GET /grader/submissions/:id/code` | → | `GET /grader/page/grade-submissions/:id/code` |
| `GET /grader/submissions/:id/feedback` | → | `GET /grader/page/grade-submissions/:id/feedback` |
| `POST /grader/submissions/:id/run-tests` | → | `POST /grader/page/grade-submissions/:id/run-tests` |
| `POST /grader/submissions/:id/feedback` | → | `POST /grader/page/grade-submissions/:id/feedback` |
| `PATCH /grader/submissions/:id/status` | → | `PATCH /grader/page/grade-submissions/:id/status` |
| `GET /grader/assignments/:id/test-cases` | → | `GET /grader/page/manage-test-cases/:id/list` |
| `POST /grader/assignments/:id/test-cases` | → | `POST /grader/page/manage-test-cases/:id` |
| `PATCH /grader/test-cases/:id` | → | `PATCH /grader/page/manage-test-cases/:id` |
| `DELETE /grader/test-cases/:id` | → | `DELETE /grader/page/manage-test-cases/:id/delete` |

### STUDENT Dashboard

| OLD Endpoint | → | NEW Endpoint |
|---|---|---|
| `GET /assignments` | → | `GET /student/page/dashboard` |
| `GET /submissions` | → | `GET /student/page/dashboard/submissions` |
| `GET /assignments/:id` | → | `GET /student/page/submit-assignment/:id` |
| `POST /submissions` | → | `POST /student/page/submit-assignment/:id/upload` |
| `DELETE /submissions/:id/file/:fid` | → | `DELETE /student/page/submit-assignment/:id/file/:fid/delete` |
| `GET /submissions/:id/results` | → | `GET /student/page/view-results/:id` |
| `GET /submissions/:id/code/:fid` | → | `GET /student/page/view-results/:id/code/:fid` |

---

## Testing Checklist

After updating each page:

- [ ] Page loads without errors
- [ ] Data displays correctly
- [ ] Network tab shows requests to `/admin/page/...`, `/grader/page/...`, or `/student/page/...`
- [ ] Functionality works (create, update, delete, etc.)
- [ ] No console errors

---

## Files to Update

### Admin Dashboard (`admin.jsx`)
- Main dashboard stats section
- Assignments list section
- Submissions section
- Grade submission section
- User management section
- Test cases management (in testCaseManager.jsx)
- Reports section

### Grader Dashboard (`grader.jsx`)
- Main dashboard/assignments list
- Upload solutions section
- Grade submissions section
- Test cases management (in testCaseManager.jsx when called from grader)

### Student Dashboard (`dashboard.jsx`)
- Main assignments list
- Submit assignment section
- View results section

---

## Support & Questions

**For endpoint details:** See `DASHBOARD_PAGE_ENDPOINTS.md`
**For migration help:** See `ENDPOINT_MIGRATION_REFERENCE.md`
**For quick lookup:** See `QUICK_REFERENCE_NEW_ENDPOINTS.md`

---

**Ready to migrate?** Start with one page and test before moving to the next! 🚀
