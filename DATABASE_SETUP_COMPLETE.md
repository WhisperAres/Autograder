# PostgreSQL Database Setup - Complete Summary

## 🚀 Quick Start (TL;DR)

1. **Install dependencies:**
   ```bash
   cd G:\Autograder\backend
   npm install pg sequelize dotenv
   ```

2. **Create .env file** in `backend/` folder:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=autograder_db
   DB_USER=postgres
   DB_PASSWORD=postgres
   PORT=5000
   NODE_ENV=development
   JWT_SECRET=your_secret_key
   ```

3. **Create PostgreSQL database:**
   ```bash
   psql -U postgres
   ```
   Then run:
   ```sql
   CREATE DATABASE autograder_db;
   \q
   ```

4. **Start server (auto-creates tables):**
   ```bash
   npm start
   ```

✅ Done! Files now store in PostgreSQL database.

---

## 📦 What Was Created

### Database Models (in `src/models/`)
- `user.js` - Students, TAs, Admins
- `assignment.js` - Assignment details
- `submission.js` - Student submissions
- `codeFile.js` - **Actual code file content**
- `testCase.js` - Test cases
- `testResult.js` - Test results

### Services (in `src/services/`)
- `fileService.js` - Handles file save/retrieve/delete operations

### Configuration (in `src/config/`)
- `database.js` - PostgreSQL connection
- `initDb.js` - Database initialization script

### Updated Controllers
- `auth/submissions.controller.js` - Now uses PostgreSQL

### Server
- `server.js` - Updated to initialize database on startup

---

## 🔄 How It Works Now

### When File is Uploaded:
1. User selects file → Frontend sends to backend
2. Backend creates `Submission` record in database
3. **Saves file content in `code_files` table** (as TEXT)
4. Returns file list (no content in response)

### When Viewing Code:
1. User clicks file in dashboard
2. Backend fetches from `code_files` table using fileId
3. Returns `fileName` + `fileContent`
4. Frontend displays in modal

### When Deleting File:
1. User clicks delete button (X)
2. Backend **removes from database**
3. Returns updated file list
4. Frontend updates display

---

## 📊 Database Schema

```
users
├── id (PK)
├── email
├── password
├── name
├── role (student/ta/admin)
└── createdAt

assignments
├── id (PK)
├── title
├── description
├── dueDate
├── totalMarks
└── createdAt

submissions
├── id (PK)
├── studentId (FK)
├── studentEmail
├── assignmentId (FK)
├── marks
├── totalMarks
├── status (pending/evaluated/graded)
├── viewTestResults
└── submittedAt

code_files ✨ NEW
├── id (PK)
├── submissionId (FK)
├── fileName
├── fileContent (FULL FILE STORED HERE)
├── fileSizeKB
└── uploadedAt

test_cases
├── id (PK)
├── assignmentId (FK)
├── testName
├── input
├── expectedOutput
├── isHidden
└── createdAt

test_results
├── id (PK)
├── submissionId (FK)
├── testCaseId (FK)
├── passed
├── actualOutput
├── errorMessage
└── executedAt
```

---

## 🛠️ File Service Methods

```javascript
// Save file to database
FileService.saveCodeFile(submissionId, fileName, fileContent)

// Fetch file with content
FileService.getFileWithContent(fileId)

// Get all files for submission
FileService.getSubmissionFiles(submissionId)

// Delete file
FileService.deleteCodeFile(fileId)

// Get file by ID
FileService.getCodeFileById(fileId)
```

---

## ✅ Verification

After starting server, check database:

```bash
psql -U postgres -d autograder_db
```

View tables:
```sql
\dt
```

Check code files:
```sql
SELECT id, fileName, fileSizeKB FROM code_files;
```

Check submissions:
```sql
SELECT * FROM submissions;
```

---

## 🔐 Security Notes

- `.env` file contains sensitive data - **DO NOT COMMIT TO GIT**
- Add `.env` to `.gitignore`
- Change `JWT_SECRET` for production
- Database passwords should be strong in production

---

## 📝 Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| DB_HOST | localhost | PostgreSQL host |
| DB_PORT | 5432 | PostgreSQL port |
| DB_NAME | autograder_db | Database name |
| DB_USER | postgres | Database user |
| DB_PASSWORD | postgres | Database password |
| PORT | 5000 | Server port |
| NODE_ENV | development | Environment |
| JWT_SECRET | - | JWT signing secret |

---

## 🚨 Troubleshooting

### "ECONNREFUSED 127.0.0.1:5432"
PostgreSQL not running. Start it:
- Windows: Start PostgreSQL from Services
- Mac: `brew services start postgresql`
- Linux: `sudo service postgresql start`

### "database autograder_db does not exist"
Create it:
```bash
psql -U postgres -c "CREATE DATABASE autograder_db;"
```

### "password authentication failed"
Check `.env` file password matches PostgreSQL user password

### Tables not created
Make sure server started successfully. Check console for errors.

---

## 🎯 Next Steps

- [ ] Verify files upload and store in database
- [ ] Test viewing uploaded code from database
- [ ] Test deleting files from database
- [ ] Implement test case execution
- [ ] Implement grader features with database

---

## 📚 Files Reference

| File | Purpose |
|------|---------|
| `src/config/database.js` | DB connection setup |
| `src/models/*.js` | Database models |
| `src/services/fileService.js` | File operations |
| `src/auth/submissions.controller.js` | Submission endpoints |
| `src/server.js` | Server with DB init |
| `.env` | Configuration |
| `POSTGRESQL_SETUP.md` | Detailed setup guide |
| `QUICK_SETUP.md` | Command reference |

Done! 🎉
