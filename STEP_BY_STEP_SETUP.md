# Step-by-Step PostgreSQL Setup Instructions

## Complete Guide with Commands to Copy-Paste

### STEP 1: Install Dependencies

Open PowerShell in `G:\Autograder\backend` and run:

```bash
npm install pg sequelize dotenv
```

Expected output:
```
added 45 packages...
```

---

### STEP 2: Create .env File

Create a new file named `.env` in `G:\Autograder\backend` (NOT in src folder).

Add this content:
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

**Important:** If you set a different password during PostgreSQL installation, update `DB_PASSWORD` to match.

---

### STEP 3: Create PostgreSQL Database

Open PowerShell and run:

```bash
psql -U postgres
```

This will prompt for password. Enter the password you set during PostgreSQL installation.

Once in psql prompt, run:
```sql
CREATE DATABASE autograder_db;
```

You should see:
```
CREATE DATABASE
```

Then exit:
```sql
\q
```

---

### STEP 4: Verify Database Created

```bash
psql -U postgres -c "\l" | findstr autograder_db
```

You should see:
```
 autograder_db | postgres | UTF8 | en_US.UTF-8 | en_US.UTF-8 |
```

---

### STEP 5: Start the Server

In PowerShell at `G:\Autograder\backend`, run:

```bash
npm start
```

Expected output:
```
✅ Database connection established
✅ Database tables synchronized
🚀 Server running on port 5000
```

If you see errors, troubleshoot below.

---

## Testing the Setup

### Test 1: Upload a File

1. Start server: `npm start`
2. Open frontend: `http://localhost:5173`
3. Login with any account
4. Upload a file
5. Check it appears in file list

### Test 2: View File from Database

1. Click on uploaded file name
2. Code should display
3. Check it's fetched from database (not just displayed from memory)

### Test 3: Delete File from Database

1. Click delete button (X) on file
2. File disappears from list
3. Close browser, reopen
4. File should stay deleted (proving it's in database)

### Test 4: Check Database Directly

```bash
psql -U postgres -d autograder_db
```

Then run:
```sql
SELECT id, fileName, fileSizeKB FROM code_files;
```

You should see your uploaded files here!

---

## Troubleshooting

### Problem: "psql: The term 'psql' is not recognized"

**Solution:** PostgreSQL PATH not set.
1. Restart computer
2. Or manually add PostgreSQL to PATH:
   - Find PostgreSQL installation (usually `C:\Program Files\PostgreSQL\15\bin`)
   - Add to System Environment Variables

### Problem: "FATAL: password authentication failed for user 'postgres'"

**Solution:** Wrong password in `.env`
1. Check password you set during PostgreSQL installation
2. Update `DB_PASSWORD` in `.env`
3. Restart server

### Problem: "ECONNREFUSED 127.0.0.1:5432"

**Solution:** PostgreSQL not running.
1. Open Services (services.msc on Windows)
2. Find "postgresql-x64-15" (or your version)
3. Right-click → Start
4. Or run: `pg_ctl -D "C:\Program Files\PostgreSQL\15\data" start`

### Problem: "database 'autograder_db' does not exist"

**Solution:** Database not created.
1. Run: `psql -U postgres`
2. Then: `CREATE DATABASE autograder_db;`
3. Then: `\q`
4. Restart server

### Problem: Server starts but "Error: listen EADDRINUSE :::5000"

**Solution:** Port 5000 already in use.
1. Change PORT in `.env` to 5001 or 5002
2. Restart server

### Problem: "Cannot find module '@/models/submission'"

**Solution:** Model import paths wrong.
- Check files exist in `backend/src/models/`
- Should be: user.js, assignment.js, submission.js, codeFile.js, testCase.js, testResult.js

---

## Verify Everything Works

### Check 1: Database Connection
```bash
npm start
```
Look for: `✅ Database connection established`

### Check 2: Tables Created
```bash
psql -U postgres -d autograder_db -c "\dt"
```
Should show all 6 tables

### Check 3: Upload Test
1. Go to frontend
2. Upload a file
3. Should appear in list

### Check 4: Database Query
```bash
psql -U postgres -d autograder_db -c "SELECT * FROM code_files LIMIT 1;"
```
Should show your uploaded file!

---

## What's Different Now

### Before (In-Memory)
- Files stored in JavaScript objects
- Deleted when server restarts
- Limited to server memory size

### After (PostgreSQL)
- Files stored in database tables
- Persist even after server restart
- Scalable to millions of files
- Can be backed up and restored
- Multiple servers can share same database

---

## Files That Were Changed

1. ✨ Created `src/config/database.js` - Database connection
2. ✨ Created `src/models/user.js` - User model
3. ✨ Created `src/models/assignment.js` - Assignment model
4. ✨ Created `src/models/submission.js` - Submission model
5. ✨ Created `src/models/codeFile.js` - **Code file model (stores actual files)**
6. ✨ Created `src/models/testCase.js` - Test case model
7. ✨ Created `src/models/testResult.js` - Test result model
8. ✨ Created `src/services/fileService.js` - File service
9. 🔄 Updated `src/auth/submissions.controller.js` - Now uses database
10. 🔄 Updated `src/server.js` - Now initializes database
11. ✨ Created `.env.example` - Environment template
12. ✨ Created `src/config/initDb.js` - Database initialization

---

## Important Notes

- **DO NOT** put `.env` in git (contains passwords)
- Add `.env` to `.gitignore`
- Change `JWT_SECRET` for production use
- Use strong password for PostgreSQL in production
- Backup database regularly in production

---

## Next: Implement Grader Features

Once upload/view/delete works, you can add:
1. Test case execution
2. Grading system
3. Feedback storage
4. Results viewing

All will use the same database structure!

---

Need help? Check errors in:
1. Console output when starting server
2. `.env` file configuration
3. PostgreSQL is actually running

You got this! 🎉
