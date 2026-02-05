# Test Case Format - Quick Reference

## What Changed?

**OLD (JUnit Format - Doesn't Work):**
```java
void testTransactionIsInternational() {
    Transaction t1 = new Transaction("TXN-101", 100.0, 'C', true);
    assertTrue(t1.isInternational());
}
```

**NEW (Input/Output Format - Works):**
```
Name: Test International Transaction
Input: (empty - not needed)
Expected Output: true
Marks: 10
```

---

## The Format

Every test case has 4 parts:

### 1️⃣ Test Name
Description of what you're testing
```
✓ "Sum Two Numbers"
✓ "Check if International"
✓ "Sort Array"
```

### 2️⃣ Input (Optional)
Data the program receives
```
✓ Leave empty if no input needed
✓ Put values on separate lines:
  5
  10
✓ Or same line:
  5 10
```

### 3️⃣ Expected Output (Required)
Exact output the program should print
```
✓ 15
✓ true
✓ 1 1 3 4 5
```

### 4️⃣ Marks (Required)
Points for passing this test
```
✓ 5
✓ 10
```

---

## Examples by Language

### Java - No Input
```
Name: Print Sum
Input: (empty)
Expected Output: Sum is 50
Marks: 10

// Student Code:
public class Sum {
    public static void main(String[] args) {
        System.out.println("Sum is " + (30 + 20));
    }
}
```

### Java - With Input
```
Name: Add Two Numbers
Input: 5
10
Expected Output: 15
Marks: 10

// Student Code:
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

### Python - No Input
```
Name: Print Greeting
Input: (empty)
Expected Output: Hello World
Marks: 10

# Student Code:
print("Hello World")
```

### Python - With Input
```
Name: Reverse String
Input: Hello
Expected Output: olleH
Marks: 10

# Student Code:
s = input()
print(s[::-1])
```

### JavaScript - No Input
```
Name: Log Sum
Input: (empty)
Expected Output: 15
Marks: 10

// Student Code:
console.log(10 + 5);
```

### JavaScript - With Input
```
Name: Multiply Numbers
Input: 5 3
Expected Output: 15
Marks: 10

// Student Code:
const input = require('fs').readFileSync(0, 'utf-8').trim().split(' ');
const a = parseInt(input[0]);
const b = parseInt(input[1]);
console.log(a * b);
```

---

## Your Example - Fixed

### Original (Doesn't Work)
```java
void testTransactionIsInternational() {
    Transaction t1 = new Transaction("TXN-101", 100.0, 'C', true);
    Transaction t2 = new Transaction("TXN-102", 100.0, 'D', false);
    
    assertTrue(t1.isInternational());
    assertFalse(t2.isInternational());
}
```

### Fixed (Works)

**Test Case 1:**
```
Name: International Transaction Returns True
Input: (empty)
Expected Output: true
Marks: 5

// Student Code:
public class Transaction {
    private boolean international;
    
    public Transaction(String id, double amount, char type, boolean intl) {
        this.international = intl;
    }
    
    public boolean isInternational() {
        return international;
    }
    
    public static void main(String[] args) {
        Transaction t1 = new Transaction("TXN-101", 100.0, 'C', true);
        System.out.println(t1.isInternational());
    }
}
```

**Test Case 2:**
```
Name: Non-International Transaction Returns False
Input: (empty)
Expected Output: false
Marks: 5

// Same student code
```

---

## Step-by-Step: Create a Test Case

### 1. Open Test Case Manager
```
Grader Dashboard → Select Assignment → Manage Test Cases
```

### 2. Click "Add Test Case"

### 3. Fill "Test Case Name"
```
Example: "Check if Transaction is International"
```

### 4. Fill "Input" (Optional)
```
Leave empty if program needs no input
OR
Type the input values
```

### 5. Fill "Expected Output" (Required)
```
Type exactly what program should print
```

### 6. Fill "Marks" (Required)
```
Type: 10
```

### 7. Click "Create Test Case"

### 8. Done! ✓
Test case saved to database

---

## Common Mistakes & Fixes

| Mistake | Fix |
|---------|-----|
| Using JUnit format | Use Input/Output format |
| Using assertions | Print output instead |
| Extra spaces in output | Remove spaces |
| Wrong case (HELLO vs Hello) | Match exact case |
| Missing newline | Program should print newline |
| Extra prompts in output | Remove all prompts |
| Input not provided | Add to Input field |

---

## How It Works

```
┌─────────────────────────────────────────┐
│  Test Case Database                     │
│  ┌─────────────────────────────────────┐│
│  │ Name: Sum Two Numbers              ││
│  │ Input: 5 10                        ││
│  │ Expected Output: 15                ││
│  │ Marks: 10                          ││
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  Grader Uploads Solution                │
│  public class Sum {                     │
│    public static void main(String[] a) {│
│      Scanner sc = new Scanner(System... │
│      int a = sc.nextInt();             │
│      int b = sc.nextInt();             │
│      System.out.println(a + b);        │
│    }                                    │
│  }                                      │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  Test Runner                            │
│  1. Provide input: 5 10                │
│  2. Run code                           │
│  3. Capture output: 15                 │
│  4. Compare: 15 == 15?                 │
│  5. Result: ✅ PASS                     │
└─────────────────────────────────────────┘
           ↓
┌─────────────────────────────────────────┐
│  Show Results to Grader                 │
│  ✅ Sum Two Numbers: PASS (10 marks)    │
└─────────────────────────────────────────┘
```

---

## Input/Output Format Examples

### Single Value
```
Input: 5
Expected Output: 25

(Program receives 5, outputs 25)
```

### Multiple Values (Space Separated)
```
Input: 5 10
Expected Output: 15

(Program receives 5 and 10, outputs 15)
```

### Multiple Values (Line Separated)
```
Input: 5
10
Expected Output: 15

(Program receives 5 on line 1, 10 on line 2)
```

### No Input
```
Input: (leave empty)
Expected Output: Hello World

(Program gets no input, outputs greeting)
```

### Multiple Lines Output
```
Input: 3
Expected Output: 1
2
3

(Program outputs three lines)
```

---

## Checklist Before Running Tests

- [x] Test case name is descriptive
- [x] Input format matches program expectations
- [x] Expected output matches exact program output
- [x] Marks assigned
- [x] No JUnit code in test case
- [x] No assertions in test case
- [x] Student code has main() method
- [x] Student code can be compiled
- [x] Student code prints output (not returns it)

---

## Need Help?

**See full guide:** TEST_CASE_FORMAT_GUIDE.md

**Quick Examples:**
1. Sum two numbers ✓
2. Reverse string ✓
3. Check boolean ✓
4. Sort array ✓
5. Format output ✓

All examples provided in the full guide!

---

**Ready to create test cases? You've got this! 🚀**
