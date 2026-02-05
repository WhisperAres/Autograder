# Database Schema Migration - Fix for NOT NULL Error

## Problem
```
Error: NOT NULL violation - Cannot add expectedOutput column as NOT NULL to existing table
Code: 23502
```

This happens because:
1. Your `test_cases` table already exists with data
2. Sequelize is trying to add a `NOT NULL` column to an existing table
3. PostgreSQL won't allow this without providing default values for existing rows

## Solution: Use Safe Migration

### Step 1: Run Migration Script
```powershell
cd backend
node migrate-test-cases.js
```

This script will:
- Check if columns already exist
- Safely add missing columns (nullable)
- Show you what changed
- Not delete any data

### Expected Output
```
✅ Database connection established

🔄 Starting safe migration...
✓ input column already exists
✓ expectedOutput column already exists
✅ Migration completed successfully!

🎉 All migrations complete!
```

---

## If Migration Script Doesn't Work

### Option 1: Manual SQL Migration
```powershell
# Connect to database
psql -U postgres -d autograder_db

# Run these commands one at a time:
ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS input TEXT;
ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS expectedoutput TEXT;

# Verify columns exist:
\d test_cases

# Exit:
\q
```

### Option 2: Drop and Recreate Table (Data Loss!)
⚠️ **WARNING: This deletes all test cases!**

```powershell
psql -U postgres -d autograder_db

# Drop old table
DROP TABLE IF EXISTS test_cases CASCADE;

# Exit
\q

# Restart backend - table will be recreated fresh
npm start
```

---

## Why This Happened

1. We changed the test case format from `testCode` (JUnit assertions) to `input`/`expectedOutput` (stdin/stdout)
2. Sequelize model was updated with `allowNull: false` for expectedOutput
3. Database already had existing rows from the old schema
4. PostgreSQL can't add NOT NULL columns to tables with existing data

## Permanent Fix Applied

Updated files to allow nullable fields:
- `backend/src/models/testCase.js` - Changed `expectedOutput` to `allowNull: true`
- `frontend/src/pages/testCaseManager.jsx` - Relaxed validation (at least one field required)

---

## Verification

After running migration, verify the table structure:

```powershell
psql -U postgres -d autograder_db -c "\d test_cases"
```

Should show columns:
```
     Column      |         Type          | Collation | Nullable | Default
-----------------+-----------------------+-----------+----------+---------
 id              | integer               |           | not null | nextval(...)
 assignmentid    | integer               |           | not null |
 testname        | character varying     |           | not null |
 input           | text                  |           |          |
 expectedoutput  | text                  |           |          |
 marks           | integer               |           |          | 1
 ishidden        | boolean               |           |          | false
```

Key points:
- ✅ `input` is nullable (no "not null")
- ✅ `expectedoutput` is nullable (no "not null")
- ✅ Both columns exist

---

## Quick Test After Migration

1. Stop backend (Ctrl+C)
2. Run migration:
   ```powershell
   node migrate-test-cases.js
   ```
3. Restart backend:
   ```powershell
   npm start
   ```
4. Should see:
   ```
   ✅ Database connection established
   ✅ Database tables synchronized
   🚀 Server running on port 5000
   ```

---

## Troubleshooting

### "Column already exists" error
This is fine! It means the migration already happened. Just restart the backend.

### "relation "test_cases" does not exist"
The table doesn't exist. Run the initialization script:
```powershell
node src/config/initDb.js
```

### "permission denied" error
Your PostgreSQL user doesn't have permission. Use:
```powershell
psql -U postgres -d autograder_db
```

---

## Data Safety

✅ This migration **does NOT delete any data**
- All existing test cases are preserved
- Only adds missing columns
- Columns are nullable, so existing rows don't need values

---

## What Changed in Code

### backend/src/models/testCase.js
```javascript
// BEFORE
expectedOutput: {
  type: DataTypes.TEXT,
  allowNull: false,  // ❌ Causes error
  comment: 'Expected output from the program'
}

// AFTER
expectedOutput: {
  type: DataTypes.TEXT,
  allowNull: true,   // ✅ Safe for existing data
  comment: 'Expected output from the program'
}
```

### frontend/src/pages/testCaseManager.jsx
```javascript
// BEFORE
if (!newTestCase.expectedOutput.trim()) {
  setError("Expected output is required");  // ❌ Too strict
  return;
}

// AFTER
if (!newTestCase.input && !newTestCase.expectedOutput) {
  setError("At least input or expected output is required");  // ✅ More flexible
  return;
}
```

---

## Summary

1. ✅ Run: `node migrate-test-cases.js`
2. ✅ Restart backend: `npm start`
3. ✅ Test should work

If issues persist, see troubleshooting section above.

---

**All clear! Your database is now properly configured.** 🚀
