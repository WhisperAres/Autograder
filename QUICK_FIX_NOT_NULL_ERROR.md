# Fix NOT NULL Error - Quick Action Guide

## The Error
```
Error 23502: NOT NULL constraint violation
Cannot add expectedOutput column to test_cases table
```

## Fix in 3 Steps

### Step 1: Stop Backend
```powershell
# In your backend terminal, press:
Ctrl+C
```

### Step 2: Run Migration
```powershell
cd backend
node migrate-test-cases.js
```

You should see:
```
✅ Database connection established

🔄 Starting safe migration...
✓ input column already exists
✓ expectedOutput column already exists
✅ Migration completed successfully!

🎉 All migrations complete!
```

### Step 3: Restart Backend
```powershell
npm start
```

You should see:
```
✅ Database connection established
✅ Database tables synchronized
🚀 Server running on port 5000
```

---

## Done!
Your database is now properly configured. No data was lost.

---

## If Step 2 Doesn't Work

Try manual SQL:
```powershell
psql -U postgres -d autograder_db

# In psql:
ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS input TEXT;
ALTER TABLE test_cases ADD COLUMN IF NOT EXISTS expectedoutput TEXT;
\q
```

Then go to Step 3 (restart backend).

---

## All Steps Failed?

Last resort - drop table (⚠️ deletes test cases):
```powershell
psql -U postgres -d autograder_db

DROP TABLE IF EXISTS test_cases CASCADE;
\q

# Restart backend
npm start
```

---

**Still stuck?** Check [DATABASE_MIGRATION_GUIDE.md](DATABASE_MIGRATION_GUIDE.md) for detailed troubleshooting.
