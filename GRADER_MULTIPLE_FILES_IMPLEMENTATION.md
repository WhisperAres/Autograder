# Grader Multiple Files Implementation

## Overview
Updated the grader functionality to allow submitting **multiple code files** instead of just a single file. This enables graders to test solutions that span multiple files (e.g., Java with multiple classes, Python with multiple modules, etc.).

## Changes Made

### Backend Changes

#### 1. **File: [backend/src/auth/grader.routes.js](backend/src/auth/grader.routes.js)**
- Changed file upload endpoint from `upload.single("file")` to `upload.array("files", 10)`
- Now accepts up to 10 files per request
- Line: `router.post("/solutions/:assignmentId", upload.array("files", 10), graderController.uploadGraderSolution);`

#### 2. **File: [backend/src/auth/grader.controller.js](backend/src/auth/grader.controller.js)**

**Function: `uploadGraderSolution`** (Lines 330-350)
- Changed from handling single file (`req.file`) to multiple files (`req.files`)
- Returns array of files with their contents
- Response includes `fileCount` for tracking uploaded files
- Supports both single and multiple file uploads gracefully

**Function: `runGraderTests`** (Lines 352-450)
- Updated to accept both formats:
  - New: `solutionFiles` array containing `{ fileName, fileContent }` objects
  - Legacy: `solutionContent` + `fileName` for backward compatibility
- Creates temporary directory for all files
- Writes all files to disk before running tests
- Intelligently finds the main executable file (.java, .py, .js)
- Runs tests against the main file with all supporting files available
- Proper cleanup of temporary directory after execution

### Frontend Changes

#### 3. **File: [frontend/src/pages/grader.jsx](frontend/src/pages/grader.jsx)**

**State Changes:**
- Added `uploadFiles` state to track multiple selected files
- Kept `uploadFile` for single file fallback compatibility

**Function: `handleFileUpload`** (Lines 78-115)
- Now handles both single and multiple files
- Appends files to FormData with `"files"` key
- Shows success message with file count
- Displays all uploaded files in code viewer
- Supports up to 10 files per upload

**Function: `handleRunTests`** (Lines 160-205)
- Reads file contents asynchronously using FileReader
- Sends `solutionFiles` array to backend
- Each file object includes `fileName` and `fileContent`
- Works with multiple files for comprehensive testing

**UI Changes:**
- File input now accepts multiple files: `multiple` attribute added
- Shows list of all selected files with count
- Updated button text to "Upload Solution(s)"
- Better UX for multi-file uploads

**File Selection Handler:**
```javascript
onChange={(e) => {
  const files = Array.from(e.target.files || []);
  setUploadFiles(files);
  setUploadFile(files[0] || null);
}}
```

## Features

### Multiple File Support
✅ Upload 1-10 files simultaneously
✅ Supports multiple programming languages
✅ All files available during test execution
✅ Clear indication of uploaded files

### Test Execution
✅ Automatically detects main executable file
✅ Supports dependencies between files
✅ Maintains proper file structure for compilation
✅ Comprehensive error reporting

### Backward Compatibility
✅ Still supports single file uploads
✅ Legacy API format still works
✅ Graceful fallback for edge cases

## Supported File Types
- `.java` - Java files
- `.py` - Python files
- `.js` - JavaScript/Node.js files
- `.cpp` - C++ files
- `.c` - C files
- `.txt` - Text files

## API Endpoints

### Upload Multiple Solutions
```
POST /grader/solutions/:assignmentId
Content-Type: multipart/form-data

FormData with multiple files under "files" key
```

**Response:**
```json
{
  "message": "Solutions uploaded successfully",
  "files": [
    { "fileName": "Main.java", "fileContent": "..." },
    { "fileName": "Helper.java", "fileContent": "..." }
  ],
  "fileCount": 2
}
```

### Run Tests (Multiple Files)
```
POST /grader/solutions/:assignmentId/run-tests
Content-Type: application/json

{
  "solutionFiles": [
    { "fileName": "Main.java", "fileContent": "..." },
    { "fileName": "Helper.java", "fileContent": "..." }
  ]
}
```

## Implementation Notes

1. **Temporary Directory Management:**
   - Creates unique temp directory per test run
   - All files written to same directory
   - Automatic cleanup after execution
   - Prevents file conflicts

2. **Main File Detection:**
   - Automatically finds executable file (.java, .py, .js)
   - Falls back to first file if no executable found
   - Supports Java compilation before execution

3. **Error Handling:**
   - Individual file processing errors caught
   - Compilation errors displayed to user
   - Execution timeout protection (5 seconds)

4. **Performance:**
   - Parallel file writing
   - Efficient cleanup with recursive removal
   - Memory-optimized file streaming

## Testing Instructions

1. **Upload Multiple Files:**
   - Navigate to Grader Dashboard
   - Select an assignment
   - Click file input and select 2+ files
   - Files should appear in list below input
   - Click "Upload Solution(s)" to submit

2. **Run Tests:**
   - After uploading, click "Run Tests"
   - System should compile/execute with all files
   - Test results should appear with pass/fail status

3. **Verify:**
   - Check that all files are used in execution
   - Confirm test results are accurate
   - Verify temp files are cleaned up

## Future Enhancements

- [ ] Drag and drop for multiple files
- [ ] File preview before upload
- [ ] File size validation per file
- [ ] Progress indicator for large uploads
- [ ] Ability to remove individual files before upload
- [ ] Archive upload support (.zip, .tar)
