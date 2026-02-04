# PostgreSQL Setup Guide

## Complete Setup Instructions

### Step 1: Install PostgreSQL (if not already installed)

**Windows:**
- Download from: https://www.postgresql.org/download/windows/
- Run installer and remember the password you set for `postgres` user
- Add PostgreSQL to PATH (installer usually does this)

**Mac:**
```bash
brew install postgresql
brew services start postgresql
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo service postgresql start
```

---

### Step 2: Create Database

Open PostgreSQL Command Line (psql):

```bash
psql -U postgres
```

Then run:
```sql
CREATE DATABASE autograder_db;
\c autograder_db
\q
```

---

### Step 3: Install Dependencies in Backend

Navigate to `G:\Autograder\backend` and run:

```bash
npm install pg sequelize dotenv
```

Or run all dependencies at once:
```bash
npm install
```

This will install:
- `pg` - PostgreSQL driver
- `sequelize` - ORM for database management
- `dotenv` - Environment variables management

---

### Step 4: Create .env File

Create a file named `.env` in `G:\Autograder\backend`:

```env
# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=autograder_db
DB_USER=postgres
DB_PASSWORD=postgres

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Secret
JWT_SECRET=your_jwt_secret_key_here_change_in_production
```

**Note:** Change `DB_PASSWORD` to the password you set during PostgreSQL installation.

---

### Step 5: Start the Server

```bash
cd G:\Autograder\backend
npm start
```

**Expected Output:**
```
✅ Database connection established
✅ Database tables synchronized
🚀 Server running on port 5000
```

---

## Database Schema

### Tables Created:

1. **users** - Stores students, TAs, and admins
2. **assignments** - Assignment details
3. **submissions** - Student submission records
4. **code_files** - Actual code file content (stored as TEXT)
5. **test_cases** - Test cases for each assignment
6. **test_results** - Results of test execution

---

## How It Works

### File Upload Flow:
1. User uploads file → Frontend sends to `/submissions` endpoint
2. Backend receives file and reads content
3. Creates/updates `Submission` record in `submissions` table
4. Saves code file content in `code_files` table (with `fileContent` as TEXT)
5. Returns submission with file list (without actual content)

### File View Flow:
1. User clicks on file name in dashboard
2. Frontend calls `/submissions/:submissionId/code/:fileId`
3. Backend fetches file from `code_files` table using `fileId`
4. Returns `fileName` and `fileContent`
5. Frontend displays code in modal

### File Delete Flow:
1. User clicks delete button (X)
2. Frontend calls `DELETE /submissions/:submissionId/file/:fileId`
3. Backend deletes record from `code_files` table
4. Returns updated file list
5. Frontend updates submission display

---

## Key Files Created:

- `backend/src/config/database.js` - Database connection setup
- `backend/src/models/user.js` - User model
- `backend/src/models/assignment.js` - Assignment model
- `backend/src/models/submission.js` - Submission model
- `backend/src/models/codeFile.js` - Code file model
- `backend/src/models/testCase.js` - Test case model
- `backend/src/models/testResult.js` - Test result model
- `backend/src/services/fileService.js` - File management service
- `backend/src/auth/submissions.controller.js` - Updated with DB support
- `backend/src/server.js` - Updated with DB initialization

---

## Verify Database Setup

After starting the server, connect to database to verify:

```bash
psql -U postgres -d autograder_db
```

List tables:
```sql
\dt
```

You should see:
- code_files
- assignments
- submissions
- test_cases
- test_results
- users

Check a table:
```sql
SELECT * FROM code_files;
SELECT * FROM submissions;
```

---

## Troubleshooting

### Connection Error: "ECONNREFUSED 127.0.0.1:5432"
- PostgreSQL is not running
- **Windows:** Start PostgreSQL from Services or command line
- **Mac/Linux:** Run `sudo service postgresql start` or `brew services start postgresql`

### Error: "database autograder_db does not exist"
- Create the database: `psql -U postgres -c "CREATE DATABASE autograder_db;"`

### Password Authentication Failed
- Check your `.env` file has correct `DB_PASSWORD`
- Verify PostgreSQL user password

### Port Already in Use
- Change `PORT` in `.env` file
- Or kill process using port 5000

---

## Next Steps

Now when you:
1. Upload files → They're stored in PostgreSQL
2. View code → Fetched from database
3. Delete files → Removed from database

All data persists in the database instead of memory!
