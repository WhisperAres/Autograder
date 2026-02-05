# Fix Test Case Failures - Quick Guide

## Step 1: Verify System Works

```powershell
cd backend
node verify-test-execution.js
```

Should output:
```
✓ Created test file
✓ Compiled successfully
✓ Executed successfully
✓ Output: PASS

✅ TEST EXECUTION WORKING!
```

If it fails, Java is not set up correctly. Install from [java.com](https://java.com)

---

## Step 2: Restart Backend

```powershell
# Stop backend
Ctrl+C

# Run migration
node migrate-test-cases.js

# Restart
npm start
```

Should show:
```
✅ Database connection established
✅ Database tables synchronized
🚀 Server running on port 5000
```

---

## Step 3: Clear Old Test Cases

Delete all old test cases from database:

```powershell
psql -U postgres -d autograder_db

DELETE FROM test_cases;
\q
```

---

## Step 4: Create New Test Case

Go to Admin → Select Assignment → Manage Test Cases

**Example:**

| Field | Value |
|-------|-------|
| Test Case Name | Verify Sum |
| Test Code | `int x = 5 + 5;`<br>`assert x == 10 : "Sum should be 10";`<br>`System.out.println("PASS");` |
| Marks | 10 |

**Copy exactly (include all 3 lines):**
```
int x = 5 + 5;
assert x == 10 : "Sum should be 10";
System.out.println("PASS");
```

---

## Step 5: Upload Solution & Run Tests

1. Go to Grader Dashboard
2. Select Assignment
3. Upload solution files (Student.java, etc.)
4. Click "Run Tests"
5. Should show: ✅ **PASS**

---

## What Your Test Code Should Look Like

### ✅ Correct Format

```java
// No method signature!
// No class definition!
// Just raw code with assertions

int result = add(5, 3);
assert result == 8 : "Sum should be 8";
System.out.println("PASS");
```

### ❌ Wrong Format

```java
// DON'T do this:
void testAdd() {
    int result = add(5, 3);
    assertEquals(result, 8);
}
```

---

## Common Errors & Solutions

### "FAIL: Cannot find symbol"
**Problem:** Class not imported or not available  
**Solution:** Upload all needed .java files

### "FAIL: assertion ... failed"
**Problem:** Assertion evaluated to false  
**Solution:** Check your expected values

### "FAIL: null pointer exception"
**Problem:** Trying to use null object  
**Solution:** Create object before using it

### "FAIL: NoClassDefFoundError"
**Problem:** Class file not found  
**Solution:** Make sure all .java files are uploaded and compiled

---

## Testing Checklist

- [ ] Ran `verify-test-execution.js` - got ✅
- [ ] Restarted backend after migration
- [ ] Cleared old test cases from database
- [ ] Test code has NO method signature
- [ ] Test code uses `assert` keyword
- [ ] Test code ends with `System.out.println("PASS");`
- [ ] Created new test case in admin
- [ ] Uploaded solution files as grader
- [ ] Clicked "Run Tests"

---

## If Still Failing

Enable debug logging:

```powershell
# In backend, check logs for actual error
# Look for compilation errors or execution errors
```

Then check: [TEST_CASE_DEBUGGING_GUIDE.md](TEST_CASE_DEBUGGING_GUIDE.md)

---

**That's it! Your tests should now work.** 🚀
