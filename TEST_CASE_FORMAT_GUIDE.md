# Test Case Format Guide

## Overview

Test cases in this system use an **Input/Output comparison format**, NOT JUnit assertions. Here's why and how it works.

---

## Why Input/Output Format?

The test runner:
1. ✅ Runs student's submitted code
2. ✅ Provides input (via stdin)
3. ✅ Captures output
4. ✅ Compares with expected output
5. ✅ Shows pass/fail

This works for **any programming language** (Java, Python, JavaScript, C/C++).

---

## Test Case Structure

Each test case has:
- **Test Name** - Description of what's being tested
- **Input** (Optional) - Data provided to the program
- **Expected Output** - What the program should print
- **Marks** - Points for passing this test

---

## Example 1: Simple Calculation

### Test Case: "Sum Two Numbers"

```
Name: Sum Two Numbers
Input: 5 10
Expected Output: 15
Marks: 10
```

### Student Code (Java):
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

**How It Works:**
1. Test provides input: `5 10`
2. Program reads: `a = 5`, `b = 10`
3. Program outputs: `15`
4. Expected: `15`
5. ✅ **PASS**

---

## Example 2: Transaction International Check

**Your Example Modified:**

```java
public class Transaction {
    private String id;
    private double amount;
    private char type;
    private boolean international;
    
    public Transaction(String id, double amount, char type, boolean international) {
        this.id = id;
        this.amount = amount;
        this.type = type;
        this.international = international;
    }
    
    public boolean isInternational() {
        return international;
    }
    
    public static void main(String[] args) {
        // Test Case 1: International transaction
        Transaction t1 = new Transaction("TXN-101", 100.0, 'C', true);
        System.out.println(t1.isInternational()); // true
        
        // Test Case 2: Non-international transaction
        Transaction t2 = new Transaction("TXN-102", 100.0, 'D', false);
        System.out.println(t2.isInternational()); // false
    }
}
```

### Test Case 1: "International Transaction"
```
Name: International Transaction
Input: (empty)
Expected Output: true
Marks: 5
```

### Test Case 2: "Non-International Transaction"
```
Name: Non-International Transaction
Input: (empty)
Expected Output: false
Marks: 5
```

---

## Example 3: Array Processing

### Test Case: "Sort Array"

```
Name: Sort Array in Ascending Order
Input: 5
3 1 4 1 5
Expected Output: 1 1 3 4 5
Marks: 10
```

### Student Code (Java):
```java
import java.util.Scanner;
import java.util.Arrays;

public class ArraySort {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int n = sc.nextInt();
        int[] arr = new int[n];
        
        for (int i = 0; i < n; i++) {
            arr[i] = sc.nextInt();
        }
        
        Arrays.sort(arr);
        
        for (int i = 0; i < n; i++) {
            System.out.print(arr[i]);
            if (i < n - 1) System.out.print(" ");
        }
        System.out.println();
    }
}
```

**How It Works:**
1. Input line 1: `5` (array size)
2. Input line 2: `3 1 4 1 5` (elements)
3. Program sorts: `[1, 1, 3, 4, 5]`
4. Output: `1 1 3 4 5`
5. Expected: `1 1 3 4 5`
6. ✅ **PASS**

---

## Example 4: String Manipulation

### Test Case: "Reverse String"

```
Name: Reverse String
Input: Hello
Expected Output: olleH
Marks: 10
```

### Student Code (Python):
```python
s = input()
print(s[::-1])
```

**How It Works:**
1. Input: `Hello`
2. Python reverses: `s[::-1]` → `olleH`
3. Output: `olleH`
4. Expected: `olleH`
5. ✅ **PASS**

---

## Example 5: Multiple Inputs

### Test Case: "Rectangle Area"

```
Name: Calculate Rectangle Area
Input: 5
10
Expected Output: Area = 50
Marks: 10
```

### Student Code (Java):
```java
import java.util.Scanner;

public class Rectangle {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int length = sc.nextInt();
        int width = sc.nextInt();
        int area = length * width;
        System.out.println("Area = " + area);
    }
}
```

**How It Works:**
1. Input line 1: `5` (length)
2. Input line 2: `10` (width)
3. Program calculates: `5 × 10 = 50`
4. Output: `Area = 50`
5. Expected: `Area = 50`
6. ✅ **PASS**

---

## Common Input/Output Patterns

### Pattern 1: No Input, Just Output
```
Name: Print Greeting
Input: (leave empty)
Expected Output: Hello World
```

### Pattern 2: Single Line Input
```
Name: Double Number
Input: 5
Expected Output: 10
```

### Pattern 3: Multiple Inputs
```
Name: Add Numbers
Input: 5
10
15
Expected Output: 30
```

### Pattern 4: Complex Output
```
Name: Format Table
Input: 3
Expected Output: Row 1
Row 2
Row 3
```

### Pattern 5: Conditional Output
```
Name: Even or Odd
Input: 7
Expected Output: Odd
```

---

## Tips for Creating Test Cases

### ✅ DO:

1. **Be Specific with Input**
   ```
   ✓ Input: 5 10
   ✓ Expected Output: 50
   ```

2. **Match Exact Output Format**
   ```
   ✓ If program prints "Hello World"
   ✓ Expected Output: Hello World
   ```

3. **Include Whitespace if Needed**
   ```
   ✓ Input: 5 10 (space between numbers)
   Expected Output: 1 2 3 (space between outputs)
   ```

4. **Test Edge Cases**
   ```
   ✓ Test: 0, negative numbers, large numbers
   ✓ Test: Empty strings, special characters
   ✓ Test: Boundary values
   ```

5. **Provide Multiple Test Cases**
   ```
   ✓ Normal case
   ✓ Edge case
   ✓ Large input case
   ✓ Error case
   ```

### ❌ DON'T:

1. **Don't Include Extra Text**
   ```
   ✗ Expected Output: The sum is 50
   ✓ Expected Output: 50 (if that's what program prints)
   ```

2. **Don't Use JUnit Format**
   ```
   ✗ assertTrue(result.equals("test"))
   ✓ Use Input/Output comparison
   ```

3. **Don't Include Prompts**
   ```
   ✗ Expected Output: Enter number: 50
   ✓ Expected Output: 50
   ```

4. **Don't Forget Newlines**
   ```
   If program uses println():
   ✓ Output has newline at end
   If program uses print():
   ✓ Output has no newline
   ```

---

## Testing Your Test Cases

### Step 1: Create Test Case
Go to Test Case Manager → Add Test Case

### Step 2: Fill in Fields
```
Name: Test for Sum
Input: 5 10
Expected Output: 15
Marks: 10
```

### Step 3: Upload Solution
Go to Grader Dashboard → Upload your solution files

### Step 4: Run Tests
Click "Run Tests"

### Step 5: Check Results
- ✅ PASS = Your test case is correct
- ❌ FAIL = Fix input/output format

---

## Debugging Failed Tests

### Issue: "Expected: 50, Got: 50"
**Cause:** Extra whitespace
**Fix:** Check for leading/trailing spaces

### Issue: "Expected: Hello, Got: hello"
**Cause:** Case mismatch
**Fix:** Verify exact output case

### Issue: "Expected: 1 2 3, Got: 1 2 3"
**Cause:** Extra newlines or spaces
**Fix:** Use online tool to check special characters

### Issue: "Program timed out"
**Cause:** Infinite loop in student code
**Fix:** Student needs to fix code, not test case

---

## Format Summary Table

| Component | Example | Notes |
|-----------|---------|-------|
| **Test Name** | "Sum Two Numbers" | Descriptive name |
| **Input** | `5 10` | Data from stdin, or empty |
| **Expected Output** | `15` | Exact output to match |
| **Marks** | `10` | Points if test passes |

---

## Creating Test Cases in UI

1. **Click "Add Test Case"**
   
2. **Fill Test Case Name**
   - Good: "Check if number is even"
   - Bad: "test1"

3. **Fill Input** (Optional)
   - Leave empty if no input needed
   - Put each input on separate line or same line

4. **Fill Expected Output** (Required)
   - Exact output program should produce
   - Match spacing and case exactly

5. **Set Marks**
   - How many points for passing

6. **Click "Create Test Case"**
   - Test case saved to database

---

## Next Steps

1. ✅ Understand Input/Output format
2. ✅ Create test cases in Test Case Manager
3. ✅ Upload student solutions
4. ✅ Run tests
5. ✅ View results

**You're all set to create proper test cases!** 🎉
