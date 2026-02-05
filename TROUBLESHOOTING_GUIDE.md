# Quick Troubleshooting Guide

## Problem 1: "cannot find symbol" Java Compilation Error

### Symptoms
```
error: cannot find symbol
    public Transaction[] getTransactions(Wallet w) {
                                         ^
symbol: class Wallet
```

### Quick Fix
1. Restart backend server
   ```powershell
   Ctrl+C  # Stop current backend
   npm start
   ```

2. Try test again - should work now

### If still failing:
- Check backend logs for "Compile all Java files" message
- If not present, backend didn't pick up changes
- Delete `backend/node_modules`
- Run `npm install`
- Restart server

---

## Problem 2: "invalid signature" JWT Error

### Symptoms
```
Token verification error: JsonWebTokenError: invalid signature
```

### Quick Fix
1. Open browser DevTools (F12)
2. Application → LocalStorage
3. Delete "token" entry
4. Close browser completely
5. Reopen browser and log in again

### If still failing:
1. Check `.env` file:
   ```powershell
   cat backend/.env
   ```
   
2. Verify line shows:
   ```
   JWT_SECRET=autograder_secret_key_124
   ```

3. If different, update to match

4. Stop backend and restart:
   ```powershell
   Ctrl+C
   npm start
   ```

5. Log in again with fresh token

### Last resort:
```powershell
# Standardize JWT secret across system
cd backend

# Edit .env file
# Change JWT_SECRET to: autograder_secret_key_123

# Restart backend
npm start

# Clear browser cache completely
# Open DevTools → Clear Storage → Clear Site Data
# Log in again
```

---

## Problem 3: Database Column Not Found

### Symptoms
```
SequelizeError: column "expectedoutput" does not exist
```

### Quick Fix
```powershell
psql -U postgres -d autograder_db -c "ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS input TEXT; ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS expectedoutput TEXT;"
```

### Or manual fix:
```powershell
# Connect to database
psql -U postgres -d autograder_db

# Run:
ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS input TEXT;
ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS expectedoutput TEXT;

# Verify:
\d test_cases

# Exit:
\q
```

---

## Problem 4: Test Runner Shows "No test cases found"

### Symptoms
```json
{
  "message": "No test cases found",
  "results": []
}
```

### Quick Fix
1. Go to Assignments page
2. Click "Manage Test Cases" for your assignment
3. Add at least one test case:
   - Name: "Test Sum"
   - Input: `5 10`
   - Expected Output: `15`
   - Marks: 10
4. Click "Create Test Case"
5. Try running tests again

---

## Problem 5: Can't Upload Multiple Files

### Symptoms
```
Error uploading solution or only one file uploads
```

### Quick Fix
1. Make sure all files are selected at once
2. Use Ctrl+Click to select multiple files
3. Then click Upload button

### Check backend support:
```powershell
# Check if upload.array() is configured
grep -n "upload.array" backend/src/auth/grader.routes.js

# Should show:
# router.post('/solutions/:assignmentId', upload.array('files', 10), ...
```

If not present, backend needs fix.

---

## Problem 6: Tests Run But Show Wrong Results

### Symptoms
```
Expected: 15
Got: 15

But shows as FAILED
```

### Quick Fix
- Check for extra spaces in Expected Output
- Make sure test input matches what program expects
- Verify program prints exact output (no extra prompts)

### Debug test case:
1. Go to Test Case Manager
2. Edit test case
3. In "Input" field - type exactly what program receives
4. In "Expected Output" - type exactly what program prints
5. No extra spaces, no newlines

---

## Problem 7: Backend Won't Start

### Symptoms
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

### Quick Fix
1. Start PostgreSQL:
   ```powershell
   # If installed locally
   pg_ctl -D "C:\Program Files\PostgreSQL\data" start
   
   # Or if using pgAdmin, ensure service is running
   ```

2. Verify database exists:
   ```powershell
   psql -U postgres -l | grep autograder_db
   ```

3. Restart backend:
   ```powershell
   npm start
   ```

---

## Problem 8: Frontend Can't Connect to Backend

### Symptoms
```
Error: Network Error or Failed to fetch
```

### Quick Fix
1. Verify backend is running:
   ```powershell
   # Backend terminal should show:
   # ✅ Database connection successful
   # ✅ Database tables synchronized
   # 🚀 Server running on port 5000
   ```

2. Check firewall - allow port 5000

3. Verify frontend is pointing to right URL:
   ```javascript
   // frontend/src/services/auth.js
   // Should have: axios.post("http://localhost:5000/auth/login", ...)
   ```

4. Restart both frontend and backend

---

## Problem 9: File Upload Shows in UI But Not Tested

### Symptoms
- Files visible in grader dashboard
- Run Tests button works but shows no results
- Or shows "upload files first"

### Quick Fix
1. Check solution was saved to database:
   ```powershell
   psql -U postgres -d autograder_db -c "SELECT * FROM grader_solutions LIMIT 1;"
   ```

2. If empty, files weren't saved. Try uploading again.

3. Check files were created:
   ```powershell
   psql -U postgres -d autograder_db -c "SELECT * FROM grader_solution_files;"
   ```

---

## General Debug Checklist

- [ ] Backend running? (check console for "Server running on port 5000")
- [ ] Database connected? (check console for "Database connection successful")
- [ ] JWT secret matches? (check `.env` file)
- [ ] Browser token cleared? (DevTools → Clear LocalStorage)
- [ ] All Java files present? (check file names in grader dashboard)
- [ ] Test cases exist? (go to Manage Test Cases)
- [ ] Test input/output correct? (no extra spaces or newlines)

---

## Emergency Reset

If everything is broken, do full reset:

```powershell
# 1. Stop backend
Ctrl+C

# 2. Clear browser data
# DevTools (F12) → Application → Clear Storage → Clear Site Data

# 3. Reinitialize database
cd backend
node src/config/initDb.js

# 4. Restart backend
npm start

# 5. In frontend, refresh page (Ctrl+R)

# 6. Log in with credentials
```

---

## Getting Help

1. **Check error message** - first line usually tells you the problem
2. **Look in this guide** - most common issues covered
3. **Check console logs** - both backend and browser DevTools
4. **Verify .env file** - all settings correct?
5. **Restart services** - often fixes temporary issues
6. **Clear caches** - browser cache, localStorage, node_modules

---

**Good luck! You've got this! 🚀**
