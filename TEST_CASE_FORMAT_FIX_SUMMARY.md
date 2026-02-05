# Test Case Format Fix - Summary & Setup

## Status: ✅ Complete

All changes have been implemented to support **Input/Output comparison format** instead of JUnit assertions.

---

## What Was Wrong

Your test cases were using JUnit format:
```java
void testTransactionIsInternational() {
    Transaction t1 = new Transaction("TXN-101", 100.0, 'C', true);
    assertTrue(t1.isInternational());
}
```

But the system runs tests by:
1. Providing input via stdin
2. Capturing program output
3. Comparing output with expected output

**These don't match!** ❌

---

## What's Fixed

### 1. Database Schema Updated ✅

**File:** `backend/src/models/testCase.js`

```javascript
// OLD (Removed)
testCode: DataTypes.TEXT  // Java test code with assertions

// NEW (Added)
input: DataTypes.TEXT              // Optional: stdin data
expectedOutput: DataTypes.TEXT     // Required: expected stdout
```

### 2. Frontend Form Updated ✅

**File:** `frontend/src/pages/testCaseManager.jsx`

Changed from single "Test Code" field to two fields:
- **Input (Optional)** - What the program receives
- **Expected Output (Required)** - What the program should print

### 3. Test Case Display Updated ✅

Test cases now show:
```
Test Case: Sum Two Numbers
Input: 5 10
Expected Output: 15
Marks: 10
```

Instead of showing code blocks.

### 4. Documentation Created ✅

- `TEST_CASE_FORMAT_GUIDE.md` - Complete guide with 5+ examples
- `TEST_CASE_QUICK_REF.md` - Quick reference card

---

## How to Use

### Step 1: Go to Test Case Manager

In Grader Dashboard:
1. Select an Assignment
2. Click "Manage Test Cases"

### Step 2: Click "Add Test Case"

Fill in:

| Field | Example | Notes |
|-------|---------|-------|
| Test Case Name | "Sum Two Numbers" | Descriptive name |
| Input | `5 10` | Leave empty if no input |
| Expected Output | `15` | Exact program output |
| Marks | `10` | Points for passing |

### Step 3: Click "Create Test Case"

Test case saved! ✅

### Step 4: Upload Solution & Run Tests

1. Upload grader solution files
2. Click "Run Tests"
3. See results

---

## Examples by Language

### Java - With Input
```
Name: Add Numbers
Input: 5
10
Expected Output: 15

// Student code should:
import java.util.Scanner;
public class Add {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int a = sc.nextInt();
        int b = sc.nextInt();
        System.out.println(a + b);
    }
}
```

### Python - With Input
```
Name: Reverse String
Input: Hello
Expected Output: olleH

# Student code should:
s = input()
print(s[::-1])
```

### Java - No Input
```
Name: Print Greeting
Input: (leave empty)
Expected Output: Hello World

// Student code should:
public class Greeting {
    public static void main(String[] args) {
        System.out.println("Hello World");
    }
}
```

---

## Test Runner Flow

```
1. Read test case from database
   ├─ testName: "Sum Two Numbers"
   ├─ input: "5 10"
   └─ expectedOutput: "15"

2. Provide input to program
   └─ Pass "5 10" via stdin

3. Run program
   └─ Capture all output

4. Compare
   ├─ Program output: "15"
   ├─ Expected: "15"
   └─ Result: ✅ PASS

5. Award marks & move to next test
```

---

## Important Notes

✅ **Do's:**
- Type input values that program expects
- Show exact output the program prints
- Use multiple lines if input has multiple values
- Leave input empty if program needs no input
- Include all output (not partial)

❌ **Don'ts:**
- Don't use JUnit code
- Don't use assertions
- Don't use `void testMethod()` format
- Don't include prompts in output
- Don't add extra spaces/newlines

---

## Need More Examples?

See: `TEST_CASE_FORMAT_GUIDE.md`

Includes:
- 5 detailed examples (Sum, Transaction, Array, String, Rectangle)
- 5 pattern examples (no input, single value, multiple values, etc.)
- Common mistakes & fixes
- Debugging tips

---

## Database Persistence

All test cases are stored in PostgreSQL:
- ✅ Saved to `test_cases` table
- ✅ Associated with assignment
- ✅ Retrieved for test runs
- ✅ Updated with grades

---

## Backward Compatibility

Test runner still supports:
- Legacy format (for existing solutions)
- Multiple input files
- Direct code execution

But **test cases must use Input/Output format** ✅

---

## Next Steps

1. **Create test case** in Test Case Manager
2. **Upload solution files** as grader
3. **Run Tests** button
4. **View Results** - should show pass/fail for each test

If you see errors:
- Check Input format matches program expectations
- Check Expected Output is exact (no extra spaces)
- Check student code prints output (doesn't return it)
- See debugging guide in TEST_CASE_FORMAT_GUIDE.md

---

## Files Updated

| File | Change |
|------|--------|
| `backend/src/models/testCase.js` | Schema: testCode → input + expectedOutput |
| `frontend/src/pages/testCaseManager.jsx` | Form: 2 fields instead of 1 code field |
| Created: `TEST_CASE_FORMAT_GUIDE.md` | Complete user guide with examples |
| Created: `TEST_CASE_QUICK_REF.md` | Quick reference card |

---

## Questions?

**Q: Can I still use JUnit format?**
A: No, system expects Input/Output format. Convert your test cases.

**Q: What if program needs no input?**
A: Leave Input field empty. Only Expected Output matters.

**Q: How do I test multiple assertions?**
A: Create separate test cases, one for each assertion.

**Q: Can I have multi-line input?**
A: Yes, put each value on a new line in Input field.

**Q: What about multi-line output?**
A: Include all lines in Expected Output, press Enter for new lines.

---

## Testing Your Setup

1. Create assignment
2. Add test case:
   - Name: "Test Sum"
   - Input: `3 4`
   - Expected Output: `7`
   - Marks: 10
3. Upload Java solution:
   ```java
   import java.util.Scanner;
   public class Sum {
       public static void main(String[] args) {
           Scanner sc = new Scanner(System.in);
           int a = sc.nextInt();
           int b = sc.nextInt();
           System.out.println(a + b);
       }
   }
   ```
4. Run tests
5. Should show: ✅ **Test Sum: PASS (10 marks)**

---

**You're all set!** 🎉

Test cases now work with any programming language using standard Input/Output comparison.
