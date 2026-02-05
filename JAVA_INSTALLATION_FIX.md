# Fix Java Runtime Error - Step by Step

## Problem
```
Error: could not find java.dll
Error: Could not find Java SE Runtime Environment.
```

**Cause:** Java compiler (`javac`) is installed but Java runtime (`java`) is not properly configured.

---

## Solution - Option 1: Automatic Fix (Recommended)

### Step 1: Run the Fix Script

```powershell
cd backend
powershell -ExecutionPolicy Bypass -File fix-java.ps1
```

This will:
- ✅ Find your Java installation
- ✅ Set JAVA_HOME environment variable
- ✅ Update PATH

### Step 2: RESTART PowerShell

**Important:** Close PowerShell completely and open a NEW window

### Step 3: Verify Fix

```powershell
java -version
javac -version
```

Should both show version 21.x.x

### Step 4: Restart Backend

```powershell
cd backend
npm start
```

---

## Solution - Option 2: Manual Fix

If the script doesn't work, set JAVA_HOME manually:

### Find Your Java Installation

1. Open PowerShell as Administrator
2. Run:
```powershell
Get-ChildItem "C:\Program Files" -Filter "*jdk*" -Recurse -ErrorAction SilentlyContinue | Select-Object FullName | head -5
```

Look for a path like:
- `C:\Program Files\jdk-21.0.10` or
- `C:\Program Files\jdk21` or similar

### Set JAVA_HOME

```powershell
# Replace with your actual Java path
$javaPath = "C:\Program Files\jdk-21.0.10"
[Environment]::SetEnvironmentVariable('JAVA_HOME', $javaPath, 'User')
```

### Update PATH

```powershell
$javaPath = "C:\Program Files\jdk-21.0.10"
$currentPath = [Environment]::GetEnvironmentVariable('PATH', 'User')
$newPath = "$javaPath\bin;$currentPath"
[Environment]::SetEnvironmentVariable('PATH', $newPath, 'User')
```

### Restart PowerShell & Test

Close and reopen PowerShell, then run:
```powershell
java -version
```

---

## Solution - Option 3: Reinstall Java

If above doesn't work, reinstall Java:

### Step 1: Download Java

Go to: https://www.oracle.com/java/technologies/downloads/

Download Java 21 (LTS recommended)

### Step 2: Install

- Run installer as Administrator
- Follow default installation
- Choose "Install runtime" and "Install compiler"

### Step 3: Restart Computer

After installation, restart Windows completely

### Step 4: Verify

```powershell
java -version
javac -version
```

---

## Verification Checklist

- [ ] `java -version` shows version 21.x.x
- [ ] `javac -version` shows version 21.x.x
- [ ] Both commands are in system PATH
- [ ] JAVA_HOME environment variable is set
- [ ] Backend starts without Java errors

---

## If Still Not Working

### Check if Java executable exists

```powershell
Test-Path "C:\Program Files\jdk-21.0.10\bin\java.exe"
```

Should return `True`

### Check PATH

```powershell
$env:PATH -split ';' | Where-Object { $_ -match 'jdk|java|bin' }
```

Should show your Java bin directory

### Check JAVA_HOME

```powershell
echo $env:JAVA_HOME
```

Should show path to JDK directory

---

## Quick Test

After fixing Java, test if system works:

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

---

## Common Mistakes

❌ **Don't:** Set JAVA_HOME to `C:\Program Files\jdk\bin`  
✅ **Do:** Set JAVA_HOME to `C:\Program Files\jdk` (without \bin)

❌ **Don't:** Restart PowerShell and expect changes instantly  
✅ **Do:** Close all PowerShell windows and open a new one

❌ **Don't:** Set PATH to just the bin directory  
✅ **Do:** Prepend `C:\Program Files\jdk\bin` to existing PATH

---

**After fixing Java, your test cases will run correctly!** 🚀
