# Grader Multiple Files - Complete Database & UI Implementation

## Overview
Completely refactored the grader multiple files feature to:
- **Save all uploaded files to database** with proper relationships
- **Display files separately in tabs** - click to view individual file code
- **Add delete functionality** for individual files and entire solutions
- **Store test cases properly** in database
- **Fix test running without upload** by using database-stored solutions

## Database Changes

### New Models Created

#### 1. GraderSolution Model
**File:** `backend/src/models/graderSolution.js`
```javascript
- id (primary key, auto increment)
- assignmentId (FK to Assignment)
- graderId (FK to User)
- uploadedAt (timestamp)
```
**Purpose:** Track each solution upload session

#### 2. GraderSolutionFile Model
**File:** `backend/src/models/graderSolutionFile.js`
```javascript
- id (primary key, auto increment)
- solutionId (FK to GraderSolution)
- fileName (string)
- fileContent (text)
```
**Purpose:** Store individual files for each solution

### Database Associations
Updated in `backend/src/config/initDb.js`:
```javascript
GraderSolution.hasMany(GraderSolutionFile, { foreignKey: 'solutionId', as: 'files' })
GraderSolutionFile.belongsTo(GraderSolution, { foreignKey: 'solutionId' })
GraderSolution.belongsTo(Assignment, { foreignKey: 'assignmentId', as: 'assignment' })
GraderSolution.belongsTo(User, { foreignKey: 'graderId', as: 'grader' })
Assignment.hasMany(GraderSolution, { foreignKey: 'assignmentId', as: 'graderSolutions' })
```

## Backend Changes

### 1. Updated uploadGraderSolution Function
**File:** `backend/src/auth/grader.controller.js`

**Changes:**
- Now saves files to database using GraderSolution and GraderSolutionFile models
- Returns `solutionId` for future reference
- Returns array of saved files with their IDs
- Response includes file count

**Response:**
```json
{
  "message": "Solutions uploaded successfully",
  "solutionId": 1,
  "files": [
    { "id": 1, "fileName": "Main.java", "fileContent": "..." },
    { "id": 2, "fileName": "Helper.java", "fileContent": "..." }
  ],
  "fileCount": 2
}
```

### 2. Updated runGraderTests Function
**File:** `backend/src/auth/grader.controller.js`

**Now Supports Three Input Formats:**
1. **Database stored (NEW):** `{ solutionId: 1 }`
   - Fetches files from database
   - Works with previously saved solutions
2. **Direct array:** `{ solutionFiles: [{...}, {...}] }`
   - For immediate testing after upload
3. **Legacy format:** `{ solutionContent, fileName }`
   - Backward compatibility

**Implementation:**
```javascript
if (solutionId) {
  // Fetch from database
  const solution = await GraderSolution.findByPk(solutionId, {
    include: [{ model: GraderSolutionFile, as: 'files' }]
  });
  files = solution.files.map(f => ({...}));
} else if (solutionFiles) {
  files = solutionFiles;
} else if (solutionContent && fileName) {
  files = [{ fileName, fileContent: solutionContent }];
}
```

### 3. New Endpoints Added
**File:** `backend/src/auth/grader.routes.js`

```javascript
// Get grader's solutions for assignment
GET /grader/solutions/:assignmentId
Response: Array of solutions with file list

// Get specific solution with all files
GET /grader/solutions/:solutionId/detail
Response: Solution object with files array

// Get specific file from solution
GET /grader/solutions/:solutionId/file/:fileId
Response: File object with content

// Delete entire solution and files
DELETE /grader/solutions/:solutionId
Response: { message: "Solution deleted successfully" }

// Delete specific file from solution
DELETE /grader/solutions/:solutionId/file/:fileId
Response: { message: "File deleted successfully", remainingFiles: [...] }
```

### 4. New Controller Functions

#### getGraderSolutions
- Fetches all solutions for grader + assignment
- Returns with file list (no content to save bandwidth)

#### getGraderSolution
- Gets specific solution with all file contents
- For viewing/editing

#### getGraderSolutionFile
- Gets individual file content
- Used when switching between file tabs

#### deleteGraderSolution
- Deletes entire solution and all files
- Cascading delete of all related files

#### deleteGraderSolutionFile
- Deletes single file from solution
- Returns remaining files after deletion

## Frontend Changes

### 1. New State Variables
**File:** `frontend/src/pages/grader.jsx`

```javascript
const [codeFiles, setCodeFiles] = useState([]);       // Array of uploaded files
const [selectedFileId, setSelectedFileId] = useState(null);  // Currently viewing file
const [currentSolutionId, setCurrentSolutionId] = useState(null);  // DB solution ID
```

### 2. Updated handleFileUpload Function

**Key Changes:**
- Stores `currentSolutionId` from database
- Stores all files in `codeFiles` array
- Shows first file by default
- Sets proper IDs for file tracking

**Response Handling:**
```javascript
if (data.files) {
  setCurrentSolutionId(data.solutionId);
  setCodeFiles(data.files);
  if (data.files.length > 0) {
    setSelectedFileId(0);
    setCodeContent(data.files[0].fileContent);
    setCodeName(data.files[0].fileName);
  }
}
```

### 3. New Handler Functions

#### handleSelectFile(fileIndex)
- Switches to viewing a different file
- Updates `codeContent` with selected file's content
- Updates `codeName` with selected file's name

#### handleDeleteFile(fileId)
- Deletes individual file via API
- Updates local `codeFiles` array
- Shows next file or clears if last file
- Shows success message

#### handleDeleteAllFiles()
- Deletes entire solution from database
- Clears all state variables
- Resets UI to upload state

### 4. Updated handleRunTests Function

**Now Smart About File Source:**
```javascript
if (currentSolutionId && codeFiles.length > 0) {
  // Use saved solution from database
  payload = { solutionId: currentSolutionId };
} else if (uploadFiles.length > 0 || uploadFile) {
  // Read files directly from input
  payload = { solutionFiles: [...] };
} else {
  // Error - no files to test
}
```

**Solves the Problem:**
- Can run tests on previously uploaded solutions
- Doesn't require files to be selected again
- Works seamlessly with database storage

### 5. Updated UI - File Tabs

**Visual Layout:**
```
┌─────────────────────────────────────────┐
│ 📄 Main.java | 📄 Helper.java | ...     │
├─────────────────────────────────────────┤
│ 💻 Main.java        [🗑️ Delete] [❌ All] │
├─────────────────────────────────────────┤
│ public class Main {                      │
│   public static void main(String[] args) │
│   ...                                    │
└─────────────────────────────────────────┘
```

**Features:**
- **Tab Navigation:**
  - Each file shown as tab
  - Active tab highlighted
  - Click to switch files
  - File names displayed with icon

- **Delete Options:**
  - Individual delete button (for each file)
  - Delete All button (for entire solution)
  - Only shows when multiple files
  - Confirmation for delete all

- **File Display:**
  - Current file name shown
  - Content in scrollable code block
  - Syntax highlighting maintained

## API Workflow

### Upload and Test Flow
```
1. User selects multiple files
   ↓
2. POST /grader/solutions/:assignmentId
   - Files saved to database
   - Returns solutionId + files array
   ↓
3. UI stores solutionId and displays files
   ↓
4. User clicks "Run Tests"
   ↓
5. POST /grader/solutions/:assignmentId/run-tests
   - Payload: { solutionId: 1 }
   - Backend fetches files from DB
   - Tests run with all files available
   ↓
6. Results displayed to user
```

### File Management Flow
```
User can at any point:
- Click file tab to view code
- Delete individual file
  - DELETE /grader/solutions/:solutionId/file/:fileId
- Delete all files
  - DELETE /grader/solutions/:solutionId
- Run tests (uses DB-stored solution)
- Upload new solution (creates new entry in DB)
```

## Database Tables

### grader_solutions
```
id | assignmentId | graderId | uploadedAt
---|--------------|----------|----------
1  | 1            | 5        | 2026-02-05 10:30:00
```

### grader_solution_files
```
id | solutionId | fileName   | fileContent
---|------------|------------|-------------
1  | 1          | Main.java  | public class...
2  | 1          | Helper.java| public class...
```

## Key Features

✅ **Separate File Display**
- Files shown as tabs
- Click to view individual file code
- No concatenation of files

✅ **Database Storage**
- All files saved to database with solution ID
- Retrievable for testing later
- Full audit trail with timestamps

✅ **File Management**
- Delete individual files
- Delete entire solution
- Update file list dynamically

✅ **Test Running**
- Works with database-stored solutions
- No need to re-upload to test
- Supports all three input formats

✅ **Backward Compatibility**
- Old API format still works
- Single file uploads still work
- Legacy test running supported

## Improvements Over Previous Version

| Aspect | Before | After |
|--------|--------|-------|
| **File Display** | Concatenated in one block | Separate tabs for each file |
| **File Navigation** | No way to view specific files | Click tabs to switch files |
| **Storage** | Only in memory | Saved to database |
| **Reusability** | Had to re-upload to test | Use solutionId to run tests again |
| **File Management** | No delete option | Delete individual or all files |
| **Test Running Issue** | Showed error if files selected but not uploaded | Fixed - uses DB solution |

## Testing Instructions

1. **Upload Multiple Files:**
   - Go to Grader Dashboard
   - Select assignment
   - Select 2+ files
   - Click "Upload Solution(s)"
   - Files should appear as tabs

2. **View Files Separately:**
   - Click different file tabs
   - Code content should change
   - File name should update

3. **Delete File:**
   - Click 🗑️ Delete button on a file
   - File should be removed from tabs
   - Remaining files shown
   - Solution updated in DB

4. **Run Tests:**
   - After upload, click "Run Tests"
   - Should use solutionId from DB
   - Tests should run successfully

5. **Run Tests Again:**
   - Can run tests multiple times without re-uploading
   - Uses saved solution from DB
   - Test results display properly

## Next Steps

- ✅ Database models created
- ✅ File storage implemented
- ✅ File deletion implemented
- ✅ UI tabs implemented
- ✅ Test running from database implemented
- [ ] Add file upload history view
- [ ] Add solution comparison feature
- [ ] Add version control for solutions

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Files not showing as tabs | Check if upload was successful |
| Delete button not working | Ensure user is file owner (graderId matches) |
| Tests show "Solution not found" | Re-upload the solution |
| Files not running in tests | Verify main file is .java, .py, or .js |

**Implementation Complete! ✅**
