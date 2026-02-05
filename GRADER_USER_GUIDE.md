# Grader Multiple Files - User Guide

## What's New?

### 1. **Separate File Display** 📄
Files are no longer concatenated into one block. Each file is displayed separately in tabs.

### 2. **Database Storage** 💾
When you upload files, they're automatically saved to the database with a unique solution ID.

### 3. **File Management** 🗑️
You can now:
- Delete individual files
- Delete entire solution (all files at once)
- Files are retained in database for later access

### 4. **Better Test Running** ▶️
- Run tests on previously uploaded solutions
- No need to re-upload to test again
- Uses database-stored solution ID

---

## Step-by-Step Usage

### Upload Multiple Files

1. **Navigate to Grader Dashboard**
   - Go to home page
   - Select an assignment to grade

2. **Upload Solution Section**
   - Click on file input or drag files
   - Select 1 or more files (.java, .py, .js, etc.)
   - Files appear in list below input
   - Click "Upload Solution(s)" button

3. **Files Saved to Database**
   - Solution gets unique ID in database
   - Files stored with solution ID
   - Can access anytime, from any device

---

### View Files Separately

After upload, you'll see file tabs:

```
┌────────────────────────────────┐
│ 📄 Main.java │ 📄 Helper.java  │
├────────────────────────────────┤
│ 💻 Main.java                   │
│                                │
│ public class Main {            │
│   ...                          │
└────────────────────────────────┘
```

**To View Different File:**
- Click on the file tab (e.g., "📄 Helper.java")
- Code content updates instantly
- File name shows current file

---

### Delete Files

#### Delete Single File
```
1. Click file tab to select it
2. Click "🗑️ Delete" button
3. File removed from database
4. Remaining files shown in tabs
```

#### Delete All Files
```
1. Click "❌ Delete All" button
2. Confirm deletion (popup)
3. Entire solution removed from database
4. UI clears (ready for new upload)
```

---

### Run Tests

#### On Newly Uploaded Files
```
1. Upload multiple files
2. Files appear as tabs
3. Click "▶ Run Tests" button
4. Tests run on all files
5. Results display
```

#### On Previously Uploaded Files
```
1. No need to re-upload
2. Just click "▶ Run Tests"
3. System uses database solution ID
4. All files fetched from database
5. Tests run on fetched files
6. Results display
```

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Select Files | `Ctrl+Click` (Windows) or `Cmd+Click` (Mac) |
| Delete File | Click "🗑️ Delete" |
| Run Tests | Click "▶ Run Tests" or `Enter` |

---

## Common Scenarios

### Scenario 1: Test Java Project with 3 Classes
```
1. Select Main.java, Helper.java, Utils.java
2. Click "Upload Solution(s)"
3. Files saved, tabs appear
4. Click "▶ Run Tests"
5. All 3 files compiled and tested
6. Results show pass/fail
```

### Scenario 2: Fix One File and Re-test
```
1. View Main.java (click tab)
2. Review code
3. Delete Helper.java if wrong (🗑️ Delete)
4. Upload corrected Helper.java
5. New Helper.java added to solution
6. Click "▶ Run Tests" again
7. Tests run with updated files
```

### Scenario 3: Compare Multiple Submissions
```
1. Upload first solution
2. Note the solutionId (shown in browser console or response)
3. Run tests - note results
4. Upload second solution
5. Switch between tabs to compare
6. Run tests on second solution
7. Compare results
```

---

## Understanding File Tabs

### Active Tab (Highlighted)
- Shows current file being viewed
- Code displayed below tab
- Can be identified by:
  - Different background color
  - Blue bottom border
  - File name visible

### Inactive Tabs
- Other uploaded files
- Click to switch to that file
- Code updates when clicked

### File List Example
```
📄 Main.java      ← Currently viewing (active)
📄 Helper.java    ← Click to view
📄 Utils.java     ← Click to view
```

---

## File Storage & Database

### Where Files Are Stored
- Files saved to `grader_solutions` table (solution record)
- File contents saved to `grader_solution_files` table (individual files)
- One solution can have multiple files

### How to Retrieve Later
- Files stay in database indefinitely
- Can access via solution ID
- Can run tests multiple times
- Grader can see their own solutions

### Data Structure
```
grader_solutions
├── id: 1
├── assignmentId: 5
├── graderId: 10
└── uploadedAt: 2026-02-05 10:30:00

grader_solution_files
├── id: 1 → solutionId: 1 → Main.java
├── id: 2 → solutionId: 1 → Helper.java
└── id: 3 → solutionId: 1 → Utils.java
```

---

## Troubleshooting

### Files Not Showing as Tabs
**Problem:** Upload successful but files not appearing as tabs
**Solution:**
1. Check browser console for errors
2. Verify files uploaded successfully (success message shown)
3. Try refreshing page
4. Check network tab in DevTools

### Delete Button Not Appearing
**Problem:** Can't see "🗑️ Delete" button
**Solution:**
- Delete button only shows if multiple files
- For single file, use "❌ Delete All"
- Or upload more files first

### Tests Say "Solution Not Found"
**Problem:** Getting 404 error when running tests
**Solution:**
1. Make sure you uploaded files (should have solution ID)
2. Solution ID might have expired - re-upload
3. Check if you're logged in correctly

### Files Not Testing Properly
**Problem:** Test results show unexpected failures
**Solution:**
1. Make sure all dependent files are uploaded
2. Check file names match expected imports
3. Verify main file is .java, .py, or .js
4. Check test cases are for correct language

---

## Best Practices

✅ **DO:**
- Upload all required files in one go
- Test immediately after upload
- Delete incorrect solutions
- Keep file names consistent with imports
- Use meaningful file names

❌ **DON'T:**
- Upload files with spaces in names (use camelCase or underscores)
- Upload binary files (not supported)
- Delete files mid-testing
- Upload files larger than 5MB each
- Use special characters in file names

---

## Features & Capabilities

| Feature | Supported | Notes |
|---------|-----------|-------|
| Multiple Files | ✅ Yes | Up to 10 files per solution |
| File Tabs | ✅ Yes | Switch between files easily |
| Delete Individual Files | ✅ Yes | Remove one file from solution |
| Delete All Files | ✅ Yes | Remove entire solution |
| Database Storage | ✅ Yes | Persistent storage |
| Re-run Tests | ✅ Yes | Without re-uploading |
| File Dependencies | ✅ Yes | All files available during testing |
| Size Limit | ⚠️ | 5MB per file, 10 files max |
| Programming Languages | ✅ | Java, Python, JavaScript, C/C++ |

---

## API Information (For Developers)

### Upload Solution
```
POST /grader/solutions/:assignmentId
multipart/form-data: files

Response: { solutionId, files: [...], fileCount }
```

### Get Solutions List
```
GET /grader/solutions/:assignmentId

Response: Array of solutions
```

### Get Specific Solution
```
GET /grader/solutions/:solutionId/detail

Response: Solution with files array
```

### Get Single File
```
GET /grader/solutions/:solutionId/file/:fileId

Response: File object with content
```

### Delete Solution
```
DELETE /grader/solutions/:solutionId

Response: { message: "Deleted" }
```

### Delete File
```
DELETE /grader/solutions/:solutionId/file/:fileId

Response: { message: "Deleted", remainingFiles: [...] }
```

### Run Tests
```
POST /grader/solutions/:assignmentId/run-tests
Body: { solutionId: 1 }

Response: { results: [...], passCount, totalCount }
```

---

## Support & Feedback

If you encounter issues:
1. Check troubleshooting section above
2. Verify all files are of correct type
3. Ensure solutions are properly uploaded to DB
4. Check browser console for error messages
5. Contact system administrator if persistent

---

**Last Updated:** February 5, 2026
**Version:** 2.0 (Database Integration Complete)
