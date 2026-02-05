# Test Case Execution - Debugging Guide

## If Test Cases Show "FAIL" in Admin

### Step 1: Check Test Case Format

Your test code should NOT have method signatures. It should be raw assertion code.

**❌ WRONG:**
```java
void testTransactionIsInternational() {
    Transaction t1 = new Transaction("TXN-101", 100.0, 'C', true);
    assertTrue(t1.isInternational());
}
```

**✅ CORRECT:**
```java
Transaction t1 = new Transaction("TXN-101", 100.0, 'C', true);
assert t1.isInternational() == true : "Should be international";
System.out.println("All assertions passed!");
```

### Step 2: Java Test Code Examples

#### Example 1: Basic Assertions
```java
int result = 5 + 5;
assert result == 10 : "Sum should be 10";
System.out.println("PASS");
```

#### Example 2: With Objects
```java
Transaction t1 = new Transaction("TXN-101", 100.0, 'C', true);
Transaction t2 = new Transaction("TXN-102", 100.0, 'D', false);
assert t1.isInternational() == true : "t1 should be international";
assert t2.isInternational() == false : "t2 should not be international";
System.out.println("PASS");
```

#### Example 3: Multiple Assertions
```java
Wallet w = new Wallet(1000);
assert w.getBalance() == 1000 : "Initial balance wrong";
w.debit(100);
assert w.getBalance() == 900 : "Balance after debit wrong";
System.out.println("PASS");
```

### Step 3: Verify Test Case in Database

```powershell
# Check what's stored in database
psql -U postgres -d autograder_db -c "SELECT testname, testcode FROM test_cases LIMIT 1;"
```

The `testcode` column should contain the assertion code (without method signature).

### Step 4: Manual Test Execution

Test if Java code runs locally:

```powershell
# Create a test file
$code = @'
public class ManualTest {
    public static void main(String[] args) {
        try {
            // Your test code here
            int x = 5;
            assert x == 5 : "x should be 5";
            System.out.println("PASS");
        } catch (AssertionError e) {
            System.out.println("FAIL: " + e.getMessage());
        } catch (Exception e) {
            System.out.println("FAIL: " + e.getMessage());
        }
    }
}
'@

# Save and run
$code | Out-File ManualTest.java -Encoding UTF8
javac ManualTest.java
java ManualTest

# Should print: PASS
```

### Step 5: Check Backend Logs

When you run tests, check backend console for compilation errors:

```
[nodemon] app crashed - waiting for file changes before starting...
```

or

```
✓ compile output here
```

### Common Issues & Fixes

#### Issue 1: "assert: command not found"
**Cause:** Assertions not enabled in Java  
**Fix:** Make sure you're using `assert` keyword, not `assertTrue()`

#### Issue 2: "Wallet/Transaction class not found"
**Cause:** Student classes not compiled together  
**Fix:** Make sure all .java files are uploaded

#### Issue 3: "FAIL: null pointer exception"
**Cause:** testCode trying to use null objects  
**Fix:** Create objects in testCode before using them

#### Issue 4: "FAIL: assertion ... failed"
**Cause:** Assertion condition was false  
**Fix:** Check the assertion message in error, verify expected vs actual

### Step 6: Test With Grader Upload

1. Go to Grader Dashboard
2. Select Assignment
3. Upload the student's Java files (Wallet.java, Transaction.java, etc.)
4. Upload solution files if any
5. Click "Run Tests"
6. Check if tests pass

### Python Example

```python
# Store this as testCode
class_instance = MyClass(10)
assert class_instance.get_value() == 10, "Value should be 10"
print("PASS")
```

### JavaScript Example

```javascript
// Store this as testCode
const result = add(5, 5);
assert result === 10, "Sum should be 10";
console.log("PASS");
```

## Debugging Checklist

- [ ] Test code has NO method signature (no `void testXXX()`)
- [ ] Test code uses `assert` or language equivalent
- [ ] Test code creates objects if needed (Wallet, Transaction, etc.)
- [ ] Test code ends with print/console/println of "PASS"
- [ ] Student classes are uploaded (Transaction.java, Wallet.java)
- [ ] Test Case in database has correct testCode (check psql)
- [ ] Backend is running and restarted after migration
- [ ] No syntax errors in test code (can test locally first)

## If All Else Fails

**Reset and test manually:**

```powershell
# 1. Stop backend
Ctrl+C

# 2. Run migration
node migrate-test-cases.js

# 3. Test locally
cd temp
# Create your .java files with test code
javac *.java
java TestClassName
# Should print "PASS"

# 4. Restart backend
npm start

# 5. Try in UI
```

---

**Remember:** The test code is NOT a method. It's just raw assertion code that will be wrapped in a try-catch block.
