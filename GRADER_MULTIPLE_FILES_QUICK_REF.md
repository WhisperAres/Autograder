# Grader Multiple Files - Quick Reference

## What Changed?

Graders can now upload **multiple code files** instead of just one file when submitting solutions for testing.

## How to Use

### From Grader Dashboard

1. **Select Assignment** → Click any assignment card → "Grade Submissions"
2. **Upload Files Section:**
   - Click the file input box labeled "📁 Click to upload"
   - Select **2 or more files** (Ctrl+Click or Cmd+Click to select multiple)
   - All selected files appear in a list below the input
3. **Upload** → Click "Upload Solution(s)" button
4. **View & Test** → Files appear in code viewer, then click "▶ Run Tests"

## Key Features

✅ **Up to 10 files per upload**
✅ **Automatic main file detection** (finds .java, .py, or .js to execute)
✅ **All files available during testing** (dependencies and imports work)
✅ **Show all files in list** with count
✅ **Works with Java, Python, JavaScript, C/C++**

## Example Scenarios

### Java Project with Multiple Classes
```
Select:
  - Main.java
  - Helper.java
  - Utils.java
→ System detects Main.java, compiles all, runs tests
```

### Python with Modules
```
Select:
  - solution.py
  - helper.py
  - config.py
→ System executes solution.py with all modules available
```

### Mixed Language Support
```
Select any .java, .py, .js, .cpp, .c, or .txt files
→ System intelligently handles execution
```

## Files Modified

| File | Changes |
|------|---------|
| `backend/src/auth/grader.routes.js` | Changed to `upload.array("files", 10)` |
| `backend/src/auth/grader.controller.js` | Updated `uploadGraderSolution` & `runGraderTests` for multiple files |
| `frontend/src/pages/grader.jsx` | Added multiple file selection UI and handling |

## API Changes

### Upload Endpoint
```
POST /grader/solutions/:assignmentId

Now accepts "files" field with multiple files (up to 10)
Response includes: { files: [], fileCount: number }
```

### Test Endpoint
```
POST /grader/solutions/:assignmentId/run-tests

New format: { solutionFiles: [{fileName, fileContent}, ...] }
Legacy format still supported for backward compatibility
```

## Backward Compatibility

✅ Single file uploads still work
✅ Old API format still accepted
✅ No breaking changes

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Files not appearing after selection | Refresh the page and try again |
| "No files provided" error | Ensure files are selected before clicking upload |
| Test execution fails | Check file dependencies and syntax |
| Compilation errors | Review error message in test results |

## Limitations

- Maximum 10 files per upload
- File size limit: 5MB per file (backend limit)
- Only one main executable file (first .java/.py/.js found)
- Test timeout: 5 seconds per test case

## Next Steps

- Test with your multi-file assignments
- Verify test cases work with file dependencies
- Provide feedback for enhancements
