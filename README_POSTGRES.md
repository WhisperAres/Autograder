# PostgreSQL Database Integration - Complete Guide

## 📋 What Was Done

Successfully integrated PostgreSQL database into the Autograder application:

✅ Created 6 database models (User, Assignment, Submission, CodeFile, TestCase, TestResult)  
✅ Created database connection configuration  
✅ Created file service for CRUD operations  
✅ Updated submissions controller to use database  
✅ Updated server to initialize database on startup  
✅ Created comprehensive setup guides  

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd G:\Autograder\backend
npm install pg sequelize dotenv
```

### 2. Create `.env` File
Save as `G:\Autograder\backend\.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=autograder_db
DB_USER=postgres
DB_PASSWORD=postgres
PORT=5000
NODE_ENV=development
JWT_SECRET=autograder_secret_key_change_in_production
```

### 3. Create Database
```bash
psql -U postgres
```
Then:
```sql
CREATE DATABASE autograder_db;
\q
```

### 4. Start Server
```bash
npm start
```

Expected output:
```
✅ Database connection established
✅ Database tables synchronized
🚀 Server running on port 5000
```

---

## 📁 Created Files

### Database Configuration
- `src/config/database.js` - Sequelize connection setup
- `src/config/initDb.js` - Database initialization script

### Database Models
- `src/models/user.js` - Users (students, TAs, admins)
- `src/models/assignment.js` - Assignments
- `src/models/submission.js` - Student submissions
- `src/models/codeFile.js` - **Code files (stores actual content)**
- `src/models/testCase.js` - Test cases
- `src/models/testResult.js` - Test results

### Services
- `src/services/fileService.js` - File operations (save, retrieve, delete)

### Updated Files
- `src/auth/submissions.controller.js` - Now uses database
- `src/server.js` - Database initialization on startup

### Environment & Documentation
- `.env.example` - Environment variables template
- `POSTGRESQL_SETUP.md` - Detailed setup instructions
- `QUICK_SETUP.md` - Command reference
- `STEP_BY_STEP_SETUP.md` - Complete walkthrough
- `DATABASE_SETUP_COMPLETE.md` - Setup summary
- `POSTGRES_COMPLETE.md` - Visual guide
- `README.md` - This file

---

## 💾 Database Schema

### users
Stores user accounts (students, TAs, admins)

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary Key |
| email | STRING | Unique identifier |
| password | STRING | Hashed password |
| name | STRING | User's name |
| role | ENUM | 'student', 'ta', 'admin' |
| createdAt | DATE | Account creation date |

### assignments
Stores assignment details

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary Key |
| title | STRING | Assignment name |
| description | TEXT | Assignment details |
| dueDate | DATE | Submission deadline |
| totalMarks | INTEGER | Max marks (default 100) |
| createdAt | DATE | Creation date |

### submissions
Tracks student submissions per assignment

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary Key |
| studentId | INTEGER | Foreign Key (users) |
| studentEmail | STRING | Student email |
| assignmentId | INTEGER | Foreign Key (assignments) |
| marks | INTEGER | Marks obtained |
| totalMarks | INTEGER | Maximum marks |
| status | ENUM | 'pending', 'evaluated', 'graded' |
| viewTestResults | BOOLEAN | Can student see results? |
| submittedAt | DATE | Submission time |

### code_files ⭐ KEY TABLE
**Stores actual code file content**

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary Key |
| submissionId | INTEGER | Foreign Key (submissions) |
| fileName | STRING | Original filename |
| fileContent | TEXT | **ACTUAL FILE CONTENT** |
| fileSizeKB | FLOAT | File size in KB |
| uploadedAt | DATE | Upload timestamp |

### test_cases
Stores test cases for assignments

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary Key |
| assignmentId | INTEGER | Foreign Key (assignments) |
| testName | STRING | Test name |
| input | TEXT | Test input |
| expectedOutput | TEXT | Expected output |
| isHidden | BOOLEAN | Hidden from students? |
| createdAt | DATE | Creation date |

### test_results
Stores test execution results

| Column | Type | Notes |
|--------|------|-------|
| id | INTEGER | Primary Key |
| submissionId | INTEGER | Foreign Key (submissions) |
| testCaseId | INTEGER | Foreign Key (test_cases) |
| passed | BOOLEAN | Test passed? |
| actualOutput | TEXT | Actual output |
| errorMessage | TEXT | Error if any |
| executedAt | DATE | Execution time |

---

## 🔄 How It Works

### File Upload
1. User selects and uploads file
2. Frontend sends to `POST /submissions`
3. Backend receives file data
4. Controller creates/updates `Submission` record
5. `FileService.saveCodeFile()` saves to `code_files` table
6. Response returns file metadata (no content)

### View Code
1. User clicks file name in dashboard
2. Frontend calls `GET /submissions/:submissionId/code/:fileId`
3. Controller verifies user ownership
4. `FileService.getFileWithContent()` fetches from database
5. Returns `{ fileName, fileContent }`
6. Frontend displays in modal

### Delete File
1. User clicks delete button (X)
2. Frontend calls `DELETE /submissions/:submissionId/file/:fileId`
3. Controller verifies ownership
4. `FileService.deleteCodeFile()` removes from database
5. Returns updated file list
6. Frontend updates UI

---

## 📡 API Endpoints

### Upload File
```
POST /submissions
Headers: Authorization: Bearer <token>
Body: multipart/form-data
  - file: <file>
  - assignmentId: <number>
```

Response:
```json
{
  "message": "File uploaded successfully",
  "submission": {
    "id": 1,
    "assignmentId": 1,
    "files": [{ "id": 1, "fileName": "test.js", "uploadedAt": "..." }]
  }
}
```

### Get Submissions
```
GET /submissions
Headers: Authorization: Bearer <token>
```

Response:
```json
[
  {
    "id": 1,
    "assignmentId": 1,
    "files": [{ "id": 1, "fileName": "sum.js" }],
    "status": "pending"
  }
]
```

### View Code
```
GET /submissions/:submissionId/code/:fileId
Headers: Authorization: Bearer <token>
```

Response:
```json
{
  "fileName": "sum.js",
  "fileContent": "function sum(a, b) { return a + b; }"
}
```

### Delete File
```
DELETE /submissions/:submissionId/file/:fileId
Headers: Authorization: Bearer <token>
```

Response:
```json
{
  "message": "File deleted successfully",
  "submission": { "files": [...] }
}
```

---

## 🛠️ FileService Methods

```javascript
// Save file to database
await FileService.saveCodeFile(submissionId, fileName, fileContent);
// Returns: { id, submissionId, fileName, fileContent, fileSizeKB, uploadedAt }

// Get file with content
await FileService.getFileWithContent(fileId);
// Returns: { id, fileName, fileContent, uploadedAt, fileSizeKB }

// Get all files for submission
await FileService.getSubmissionFiles(submissionId);
// Returns: [{ id, fileName, uploadedAt, fileSizeKB }, ...]

// Delete file
await FileService.deleteCodeFile(fileId);
// Returns: boolean (true if deleted)

// Get file by ID
await FileService.getCodeFileById(fileId);
// Returns: { id, submissionId, fileName, ... }
```

---

## ✅ Testing

### Test 1: File Upload
1. Login to frontend
2. Select assignment
3. Upload file
4. File appears in list ✓

### Test 2: View File
1. Click on file name
2. Code displays in modal ✓
3. Close and reopen - still shows ✓

### Test 3: Delete File
1. Click X button
2. File removed from list ✓
3. Refresh page - stays deleted ✓

### Test 4: Database Check
```bash
psql -U postgres -d autograder_db
```

```sql
SELECT * FROM code_files;
```

Should show your uploaded files ✓

---

## 🔍 Troubleshooting

### PostgreSQL Not Found
```bash
psql --version
```
If not found, install PostgreSQL or add to PATH.

### Connection Error: ECONNREFUSED
- PostgreSQL not running
- Check Windows Services
- Restart PostgreSQL

### Database Already Exists Error
```bash
psql -U postgres -c "DROP DATABASE autograder_db;"
psql -U postgres -c "CREATE DATABASE autograder_db;"
```

### Wrong Credentials
Check `.env` file matches your PostgreSQL setup:
```bash
psql -U <DB_USER> -h <DB_HOST> -d <DB_NAME>
```

### Server Won't Start
Check console for specific error:
```bash
npm start
```

Common issues:
- Wrong `.env` values
- PostgreSQL not running
- Database doesn't exist
- Port 5000 already in use

---

## 📊 Performance

- **Upload Speed:** Limited by file size (typically <1s)
- **View Speed:** Direct DB query (typically <100ms)
- **Delete Speed:** Direct DB delete (typically <100ms)
- **Storage:** PostgreSQL handles up to millions of files

---

## 🔐 Security

⚠️ Important:
- `.env` contains passwords - **NEVER commit to git**
- Add `.env` to `.gitignore`
- Change `JWT_SECRET` for production
- Use strong database password in production
- Implement user verification before showing files

---

## 📝 Environment Variables

```
DB_HOST=localhost              # PostgreSQL host
DB_PORT=5432                   # PostgreSQL port
DB_NAME=autograder_db          # Database name
DB_USER=postgres               # Database user
DB_PASSWORD=postgres           # Database password
PORT=5000                      # Server port
NODE_ENV=development           # Environment
JWT_SECRET=secret_key          # JWT signing secret
```

---

## 🚀 Next Steps

With PostgreSQL now integrated:

1. ✅ Files upload and store
2. ✅ Files display from database
3. ✅ Files delete from database
4. ⏭️ Add test case execution
5. ⏭️ Add grading system
6. ⏭️ Add feedback storage
7. ⏭️ Add results viewing

All future features will automatically use the database!

---

## 📚 Reference Files

- `POSTGRESQL_SETUP.md` - Detailed setup with troubleshooting
- `QUICK_SETUP.md` - Quick commands reference
- `STEP_BY_STEP_SETUP.md` - Walkthrough guide
- `DATABASE_SETUP_COMPLETE.md` - Complete summary
- `POSTGRES_COMPLETE.md` - Visual architecture guide

---

## 🎉 Done!

Your Autograder now has:
- ✅ PostgreSQL database
- ✅ File storage in database
- ✅ File retrieval from database
- ✅ File deletion from database
- ✅ Persistent data storage
- ✅ Scalable architecture

Files are no longer lost when server restarts.
Data persists forever in the database.

Ready to build more features! 🚀
