
const User = require("../models/user");
const Assignment = require("../models/assignment");
const Submission = require("../models/submission");
const CodeFile = require("../models/codeFile");
const TestCase = require("../models/testCase");
const TestResult = require("../models/testResult");
const GraderSolution = require("../models/graderSolution");
const GraderSolutionFile = require("../models/graderSolutionFile");
const bcrypt = require("bcryptjs");
const os = require("os");
const path = require("path");
const fs = require("fs");
const { execSync, spawn } = require("child_process");

// Safe execution with proper timeout handling
const execWithTimeout = (command, timeoutMs = 30000) => {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`Command timeout exceeded (${timeoutMs}ms): ${command}`));
    }, timeoutMs);

    try {
      const result = execSync(command, {
        encoding: "utf8",
        timeout: timeoutMs,
        stdio: ['pipe', 'pipe', 'pipe'],
        maxBuffer: 10 * 1024 * 1024 // 10MB buffer
      });
      clearTimeout(timeout);
      resolve(result.trim());
    } catch (error) {
      clearTimeout(timeout);
      reject(error);
    }
  });
};

// Detect Java executable path
const getJavaExecutable = () => {
  const isWindows = os.platform() === 'win32';
  const javaCmd = isWindows ? `"C:\\Program Files\\Java\\jdk-21.0.10\\bin\\java.exe"` : 'java';
  return javaCmd;
};

const getJavacExecutable = () => {
  const isWindows = os.platform() === 'win32';
  const javacCmd = isWindows ? `"C:\\Program Files\\Java\\jdk-21.0.10\\bin\\javac.exe"` : 'javac';
  return javacCmd;
};

const JAVA_CMD = getJavaExecutable();
const JAVAC_CMD = getJavacExecutable();

// Transform simple JUnit-style assertions into plain Java checks that throw AssertionError
const transformJUnitStyle = (code) => {
  if (!code || typeof code !== 'string') return code;

  const splitTopLevelArgs = (s) => {
    const parts = [];
    let cur = '';
    let depth = 0;
    let inSingle = false;
    let inDouble = false;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (ch === "'" && !inDouble) { inSingle = !inSingle; cur += ch; continue; }
      if (ch === '"' && !inSingle) { inDouble = !inDouble; cur += ch; continue; }
      if (!inSingle && !inDouble) {
        if (ch === '(' || ch === '{' || ch === '[') { depth++; }
        else if (ch === ')' || ch === '}' || ch === ']') { depth--; }
        else if (ch === ',' && depth === 0) { parts.push(cur.trim()); cur = ''; continue; }
      }
      cur += ch;
    }
    if (cur.trim() !== '') parts.push(cur.trim());
    return parts;
  };

  const keywords = ['assertTrue', 'assertFalse', 'assertEquals', 'assertNotNull'];
  let i = 0;
  let out = '';
  while (i < code.length) {
    let matched = false;
    for (const kw of keywords) {
      if (code.startsWith(kw, i)) {
        let j = i + kw.length;
        while (code[j] && /\s/.test(code[j])) j++;
        if (code[j] !== '(') continue;

        let depth = 0;
        let k = j;
        for (; k < code.length; k++) {
          if (code[k] === '(') depth++;
          else if (code[k] === ')') { depth--; if (depth === 0) break; }
        }
        if (k >= code.length) continue;

        const argsStr = code.substring(j + 1, k);
        let replacement = '';
        if (kw === 'assertTrue') {
          replacement = `if (!(${argsStr})) throw new AssertionError("assertTrue failed");`;
        } else if (kw === 'assertFalse') {
          replacement = `if ((${argsStr})) throw new AssertionError("assertFalse failed");`;
        } else if (kw === 'assertNotNull') {
          replacement = `if (${argsStr} == null) throw new AssertionError("assertNotNull failed");`;
        } else if (kw === 'assertEquals') {
          const parts = splitTopLevelArgs(argsStr);
          const a = parts[0] || '';
          const b = parts[1] || '';
          replacement = `if (!String.valueOf(${a}).equals(String.valueOf(${b}))) throw new AssertionError("assertEquals failed: expected " + String.valueOf(${a}) + " got " + String.valueOf(${b}));`;
        }

        out += replacement;

        i = k + 1;
        while (code[i] && /\s/.test(code[i])) i++;
        if (code[i] === ';') i++;

        matched = true;
        break;
      }
    }
    if (!matched) {
      out += code[i];
      i++;
    }
  }

  return out;
};

// Detect potential infinite loops in test code
const detectInfiniteLoop = (code) => {
  const warnings = [];
  if (/while\s*\(\s*true\s*\)/.test(code)) warnings.push("Found while(true)");
  if (/for\s*\(\s*;\s*;\s*\)/.test(code)) warnings.push("Found for(;;)");
  if (/while\s*\(\s*1\s*\)/.test(code)) warnings.push("Found while(1)");
  if (code.match(/System\.out\.println.*\{.*\}/g)) warnings.push("Complex loop output detected");
  return warnings;
};

// Safe file cleanup with timeout
const safeDeletedir = (dirpath) => {
  try {
    if (fs.existsSync(dirpath)) {
      // Force delete with short timeout for cleanup
      const files = fs.readdirSync(dirpath);
      files.forEach(file => {
        const curPath = path.join(dirpath, file);
        if (fs.lstatSync(curPath).isDirectory()) {
          safeDeletedir(curPath);
        } else {
          try { fs.unlinkSync(curPath); } catch (e) {}
        }
      });
      try { fs.rmdirSync(dirpath); } catch (e) {}
    }
  } catch (e) {
    console.warn(`Failed to cleanup ${dirpath}:`, e.message);
  }
};

// ==================== USER MANAGEMENT ====================

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] }
    });
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
};

// Create new user (student, grader, or admin)
exports.createUser = async (req, res) => {
  try {
    const { email, name, role } = req.body;

    if (!email || !name || !role) {
      return res.status(400).json({ message: "Email, name, and role required" });
    }

    if (!['student', 'grader', 'admin'].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be: student, grader, or admin" });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Generate temporary password
    const tempPassword = "TempPass123!";
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await User.create({
      email,
      name,
      role,
      password: hashedPassword
    });

    res.status(201).json({
      message: "User created successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        tempPassword: tempPassword // Send to admin to share with user
      }
    });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ message: "Error creating user" });
  }
};

// Update user role
exports.updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['student', 'grader', 'admin'].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.update({ role });

    res.json({
      message: "User role updated successfully",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Error updating user" });
  }
};

// Delete user and related data
exports.deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete submissions and their related data
    const submissions = await Submission.findAll({ where: { studentId: userId } });
    for (const submission of submissions) {
      await TestResult.destroy({ where: { submissionId: submission.id } });
      await CodeFile.destroy({ where: { submissionId: submission.id } });
      await submission.destroy();
    }

    // Delete grader solutions uploaded by this user (and their files)
    try {
      const graderSolutions = await GraderSolution.findAll({ where: { graderId: userId } });
      for (const sol of graderSolutions) {
        await GraderSolutionFile.destroy({ where: { solutionId: sol.id } });
      }
      await GraderSolution.destroy({ where: { graderId: userId } });
    } catch (e) {
      console.warn('Warning deleting grader solutions for user', userId, e.message || e);
    }

    // Finally delete the user
    await user.destroy();

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
};

// Get users by role
exports.getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;

    if (!['student', 'grader', 'admin'].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const users = await User.findAll({
      where: { role },
      attributes: { exclude: ['password'] }
    });

    res.json(users);
  } catch (error) {
    console.error("Error fetching users by role:", error);
    res.status(500).json({ message: "Error fetching users" });
  }
};

// ==================== ASSIGNMENT MANAGEMENT ====================

// Get all assignments
exports.getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.findAll({
      include: [{ model: TestCase, as: 'testCases' }],
      order: [['dueDate', 'ASC']]
    });
    res.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ message: "Error fetching assignments" });
  }
};

// Create new assignment
exports.createAssignment = async (req, res) => {
  try {
    const { title, description, dueDate, totalMarks } = req.body;

    if (!title || !dueDate) {
      return res.status(400).json({ message: "Title and due date required" });
    }

    // Validate date format
    const parsedDate = new Date(dueDate);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: "Invalid date format" });
    }

    const assignment = await Assignment.create({
      title: title.trim(),
      description: description ? description.trim() : "",
      dueDate: parsedDate,
      totalMarks: totalMarks || 100
    });

    res.status(201).json({
      message: "Assignment created successfully",
      assignment
    });
  } catch (error) {
    console.error("Error creating assignment:", error);
    res.status(500).json({
      message: "Error creating assignment",
      error: error.message || error
    });
  }
};

// Update assignment
exports.updateAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { title, description, dueDate, totalMarks } = req.body;

    const assignment = await Assignment.findByPk(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    await assignment.update({
      title: title || assignment.title,
      description: description !== undefined ? description : assignment.description,
      dueDate: dueDate ? new Date(dueDate) : assignment.dueDate,
      totalMarks: totalMarks || assignment.totalMarks
    });

    res.json({
      message: "Assignment updated successfully",
      assignment
    });
  } catch (error) {
    console.error("Error updating assignment:", error);
    res.status(500).json({ message: "Error updating assignment" });
  }
};

// Delete assignment
exports.deleteAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findByPk(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Also delete related submissions, code files, test cases, test results
    const submissions = await Submission.findAll({ where: { assignmentId } });
    for (const submission of submissions) {
      await CodeFile.destroy({ where: { submissionId: submission.id } });
      await TestResult.destroy({ where: { submissionId: submission.id } });
      await submission.destroy();
    }

    // Delete grader solution files and grader solutions referencing this assignment
    try {
      const graderSolutions = await GraderSolution.findAll({ where: { assignmentId } });
      for (const sol of graderSolutions) {
        await GraderSolutionFile.destroy({ where: { solutionId: sol.id } });
      }
      await GraderSolution.destroy({ where: { assignmentId } });
    } catch (e) {
      console.warn('Warning: error deleting grader solutions for assignment', assignmentId, e.message || e);
    }

    await TestCase.destroy({ where: { assignmentId } });
    await assignment.destroy();

    res.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    res.status(500).json({ message: "Error deleting assignment" });
  }
};

// Toggle allow students to view marks for an assignment
exports.toggleCanViewMarks = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { canViewMarks } = req.body;

    if (canViewMarks === undefined || canViewMarks === null) {
      return res.status(400).json({ message: "canViewMarks parameter required" });
    }

    const assignment = await Assignment.findByPk(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    await assignment.update({ canViewMarks: Boolean(canViewMarks) });

    res.json({
      message: `Students can ${canViewMarks ? 'now' : 'no longer'} view marks for this assignment`,
      assignment
    });
  } catch (error) {
    console.error("Error toggling view marks:", error);
    res.status(500).json({ message: "Error toggling view marks" });
  }
};

// ==================== GRADING & MARKS ====================

// Get all submissions with marks
exports.getAllSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.findAll({
      include: [
        { model: Assignment, as: 'assignment' },
        { model: User, as: 'student', attributes: ['id', 'name', 'email'] },
        { model: CodeFile, as: 'codeFiles' }
      ],
      order: [['id', 'DESC']]
    });
    res.json(submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ message: "Error fetching submissions" });
  }
};

// Get submissions for specific assignment
exports.getSubmissionsByAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const submissions = await Submission.findAll({
      where: { assignmentId },
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email'] },
        { model: CodeFile, as: 'codeFiles' }
      ],
      order: [['id', 'DESC']]
    });

    res.json(submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ message: "Error fetching submissions" });
  }
};

// Update submission marks (admin only)
exports.updateSubmissionMarks = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { marks } = req.body;

    if (marks === undefined || marks === null) {
      return res.status(400).json({ message: "Marks required" });
    }

    const submission = await Submission.findByPk(submissionId);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Convert to float and validate
    const floatMarks = parseFloat(marks);
    if (isNaN(floatMarks) || floatMarks < 0) {
      return res.status(400).json({
        message: "Marks must be a non-negative number"
      });
    }

    await submission.update({ marks: floatMarks });

    res.json({
      message: "Marks updated successfully",
      submission
    });
  } catch (error) {
    console.error("Error updating marks:", error);
    res.status(500).json({ message: "Error updating marks" });
  }
};

// Toggle allow students to view marks
exports.toggleViewMarks = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { canView } = req.body;

    if (canView === undefined || canView === null) {
      return res.status(400).json({ message: "canView parameter required" });
    }

    const submission = await Submission.findByPk(submissionId);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    await submission.update({ viewMarks: Boolean(canView) });

    res.json({
      message: "View marks permission updated successfully",
      submission: {
        id: submission.id,
        viewMarks: submission.viewMarks
      }
    });
  } catch (error) {
    console.error("Error updating view marks permission:", error);
    res.status(500).json({ message: "Error updating view marks permission" });
  }
};

// Get code files for a submission
exports.getSubmissionCodeFiles = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const codeFiles = await CodeFile.findAll({
      where: { submissionId },
      attributes: ['id', 'fileName', 'fileContent']
    });

    if (!codeFiles || codeFiles.length === 0) {
      return res.json([]);
    }

    res.json(codeFiles);
  } catch (error) {
    console.error("Error fetching code files:", error);
    res.status(500).json({ message: "Error fetching code files" });
  }
};

exports.runSingleTest = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { testCaseId } = req.body;

    const submission = await Submission.findByPk(submissionId, {
      include: [{ model: CodeFile, as: "codeFiles" }]
    });

    if (!submission) return res.status(404).json({ message: "Submission not found" });

    const testCase = await TestCase.findByPk(testCaseId);
    if (!testCase) return res.status(404).json({ message: "Test case not found" });

    const codeFiles = submission.codeFiles;
    const javaFiles = codeFiles.filter(f => f.fileName.endsWith(".java"));
    if (javaFiles.length === 0) return res.status(404).json({ message: "No Java files found" });

    const tempDir = path.join(__dirname, "../../temp", `test_${submissionId}_${Date.now()}`);
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    try {
      for (const codeFile of javaFiles) {
        fs.writeFileSync(path.join(tempDir, codeFile.fileName), codeFile.fileContent, "utf8");
      }

      try {
        const javaFileNames = javaFiles.map(f => f.fileName).join(" ");
        execSync(`cd "${tempDir}" && ${JAVAC_CMD} ${javaFileNames}`, {
          timeout: 20000,
          stdio: ['pipe', 'pipe', 'pipe'],
          maxBuffer: 1 * 1024 * 1024
        });
      } catch (compileErr) {
        return res.json({
          testName: testCase.testName,
          passed: false,
          errorMessage: `Compilation Failed: ${compileErr.stderr?.toString() || compileErr.message}`
        });
      }

      const uniqueId = Date.now() + Math.random().toString().replace('.', '');
      const testClassName = `Test${uniqueId}`;
      const testCode = `public class ${testClassName} {\n  public static void main(String[] args) {\n    try {\n      ${transformJUnitStyle(testCase.testCode)}\n      System.out.println("PASS");\n    } catch (AssertionError e) {\n      System.out.println("FAIL: " + e.getMessage());\n    } catch (Exception e) {\n      System.out.println("FAIL: " + e.getMessage());\n    }\n  }\n}`;
      fs.writeFileSync(path.join(tempDir, `${testClassName}.java`), testCode);

      try {
        const cmd = `cd "${tempDir}" && ${JAVAC_CMD} ${testClassName}.java && ${JAVA_CMD} ${testClassName}`;
        const actualOutput = execSync(cmd, { encoding: "utf8", timeout: 20000, stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 5 * 1024 * 1024 }).trim();
        const passed = actualOutput.includes("PASS");
        res.json({ testName: testCase.testName, testCaseId: testCase.id, passed, actualOutput: passed ? actualOutput : "", errorMessage: passed ? null : "Assertion failed", marks: testCase.marks || 0 });
      } catch (execError) {
        res.json({ testName: testCase.testName, passed: false, errorMessage: execError.stderr?.toString() || execError.message, marks: 0 });
      }
    } finally {
      if (fs.existsSync(tempDir)) safeDeletedir(tempDir);
    }
  } catch (error) {
    res.status(500).json({ message: "Error running test: " + error.message });
  }
};

// Run tests (same as grader)
exports.runTestCases = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { execSync } = require("child_process");
    const fs = require("fs");
    const path = require("path");

    const submission = await Submission.findByPk(submissionId, {
      include: [{ model: CodeFile, as: "codeFiles" }]
    });

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const testCases = await TestCase.findAll({
      where: { assignmentId: submission.assignmentId }
    });

    if (testCases.length === 0) {
      return res.json({ message: "No test cases defined for this assignment", results: [] });
    }

    const codeFiles = await CodeFile.findAll({
      where: { submissionId }
    });

    if (codeFiles.length === 0) {
      return res.status(404).json({ message: "No code files found in submission" });
    }

    const results = [];
    const tempDir = path.join(__dirname, "../../temp", `submission_${submissionId}`);

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    try {
      for (const codeFile of codeFiles) {
        const filePath = path.join(tempDir, codeFile.fileName);
        fs.writeFileSync(filePath, codeFile.fileContent, "utf8");
      }

      // Remove any previous test results for this submission to avoid duplicates
      await TestResult.destroy({ where: { submissionId } });

      // Compile all Java files ONCE before test loop
      const javaFiles = codeFiles.filter(f => f.fileName.endsWith(".java"));
      if (javaFiles.length > 0) {
        try {
          const javaFileNames = javaFiles.map(f => f.fileName).join(" ");
          execSync(`cd "${tempDir}" && ${JAVAC_CMD} ${javaFileNames}`, {
            timeout: 20000,
            stdio: ['pipe', 'pipe', 'pipe'],
            maxBuffer: 5 * 1024 * 1024
          });
        } catch (compileErr) {
          await submission.update({ marks: 0, status: 'compilation-error' });
          return res.json({ 
            message: "Compilation Failed", 
            results: [], 
            passCount: 0, 
            totalCount: testCases.length,
            marksObtained: 0,
            totalMarks: submission.totalMarks,
            errorMessage: compileErr.stderr?.toString() || compileErr.message 
          });
        }
      }

      for (const testCase of testCases) {
        let passed = false;
        let actualOutput = "";
        let errorMessage = "";

        try {
          const codeFileExtensions = codeFiles.map(f => path.extname(f.fileName))[0];
          let command = "";

          if (codeFileExtensions === ".java" || javaFiles.length > 0) {
            // For Java, create a test file that runs the test code as a harness
            const uniqueId = Date.now();
            const testFileName = `Test${uniqueId}.java`;
            const testClassName = `Test${uniqueId}`;
            const testCode = `public class ${testClassName} {
        public static void main(String[] args) {
          try {
            ${transformJUnitStyle(testCase.testCode)}
            System.out.println("PASS");
          } catch (AssertionError e) {
            System.out.println("FAIL: " + e.getMessage());
          } catch (Exception e) {
            System.out.println("FAIL: " + e.getMessage());
          }
        }
      }`;
            fs.writeFileSync(path.join(tempDir, testFileName), testCode);
            command = `cd "${tempDir}" && ${JAVAC_CMD} ${testFileName} && ${JAVA_CMD} ${testClassName}`;
            actualOutput = execSync(command, {
              encoding: "utf8",
              timeout: 20000,
              stdio: ['pipe', 'pipe', 'pipe'],
              maxBuffer: 5 * 1024 * 1024
            }).trim();
          } else {
            const mainFile = codeFiles.find(f =>
              f.fileName.endsWith(".js")
            ) || codeFiles[0];

            if (mainFile.fileName.endsWith(".js")) {
              command = `cd "${tempDir}" && node ${mainFile.fileName}`;
            } else if (mainFile.fileName.endsWith(".py")) {
              command = `cd "${tempDir}" && python ${mainFile.fileName}`;
            }

            if (command) {
              if (testCase.input) {
                actualOutput = execSync(command, {
                  input: testCase.input,
                  encoding: "utf8",
                  stdio: ["pipe", "pipe", "pipe"],
                  timeout: 20000,
                  maxBuffer: 5 * 1024 * 1024
                }).trim();
              } else {
                actualOutput = execSync(command, {
                  encoding: "utf8",
                  timeout: 20000,
                  maxBuffer: 5 * 1024 * 1024
                }).trim();
              }
            }
          }

          passed = actualOutput.includes("PASS") || actualOutput === testCase.expectedOutput.trim();
        } catch (execError) {
          errorMessage = execError.message || "Execution failed";
          passed = false;
        }

        const testResult = await TestResult.create({
          submissionId,
          testCaseId: testCase.id,
          passed,
          actualOutput: passed ? actualOutput : "",
          errorMessage: !passed ? errorMessage : null
        });

        results.push({
          testName: testCase.testName,
          passed,
          actualOutput: passed ? actualOutput : "",
          expectedOutput: testCase.expectedOutput,
          errorMessage
        });
      }

      // Calculate marks based on passed tests
      let totalMarksEarned = 0;
      for (let i = 0; i < results.length; i++) {
        if (results[i].passed) {
          totalMarksEarned += parseFloat(testCases[i].marks) || 0;
        }
      }

      // Update submission with calculated marks and status
      await submission.update({
        marks: totalMarksEarned,
        status: "evaluated"
      });

      res.json({
        message: "Test cases executed",
        results,
        submissionId,
        passCount: results.filter(r => r.passed).length,
        totalCount: results.length,
        marksObtained: totalMarksEarned,
        totalMarks: submission.totalMarks
      });
    } finally {
      try { safeDeletedir(tempDir); } catch (e) {}
    }
  } catch (error) {
    console.error("Error running tests:", error);
    res.status(500).json({ message: "Error running tests: " + error.message });
  }
};

// ==================== REPORTING & DOWNLOADS ====================

// Get marks report for an assignment
exports.getMarksReport = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findByPk(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const submissions = await Submission.findAll({
      where: { assignmentId },
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email'] }
      ],
      order: [['studentId', 'ASC']]
    });

    const report = submissions.map(s => ({
      studentId: s.studentId,
      studentName: s.student.name,
      studentEmail: s.student.email,
      marks: s.marks || 0,
      totalMarks: s.totalMarks,
      percentage: ((s.marks || 0) / s.totalMarks * 100).toFixed(2),
      status: s.status
    }));

    res.json({
      assignmentId,
      assignmentTitle: assignment.title,
      report
    });
  } catch (error) {
    console.error("Error generating report:", error);
    res.status(500).json({ message: "Error generating report" });
  }
};

// Download marks as CSV
exports.downloadMarksCSV = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    const assignment = await Assignment.findByPk(assignmentId);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const submissions = await Submission.findAll({
      where: { assignmentId },
      include: [
        { model: User, as: 'student', attributes: ['id', 'name', 'email'] }
      ],
      order: [['studentId', 'ASC']]
    });

    // Create CSV content
    let csv = "Student ID,Student Name,Email,Marks,Total Marks,Percentage,Status\n";

    submissions.forEach(s => {
      const percentage = ((s.marks || 0) / s.totalMarks * 100).toFixed(2);
      csv += `${s.studentId},"${s.student.name}","${s.student.email}",${s.marks || 0},${s.totalMarks},${percentage}%,${s.status}\n`;
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="marks_${assignmentId}_${new Date().getTime()}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error("Error downloading CSV:", error);
    res.status(500).json({ message: "Error downloading CSV" });
  }
};

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalStudents = await User.count({ where: { role: 'student' } });
    const totalGraders = await User.count({ where: { role: 'grader' } });
    const totalAdmins = await User.count({ where: { role: 'admin' } });
    const totalAssignments = await Assignment.count();
    const totalSubmissions = await Submission.count();
    const gradedSubmissions = await Submission.count({ where: { status: 'graded' } });

    res.json({
      totalUsers,
      totalStudents,
      totalGraders,
      totalAdmins,
      totalAssignments,
      totalSubmissions,
      gradedSubmissions,
      pendingGrading: totalSubmissions - gradedSubmissions
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Error fetching stats" });
  }
};
// ========== TEST CASE MANAGEMENT ==========

exports.getTestCases = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const testCases = await TestCase.findAll({
      where: { assignmentId },
      order: [["id", "ASC"]]
    });
    res.json(testCases);
  } catch (error) {
    console.error("Error fetching test cases:", error);
    res.status(500).json({ message: "Error fetching test cases" });
  }
};

exports.createTestCase = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { testName, testCode, marks, isHidden } = req.body;

    if (!testName) {
      return res.status(400).json({ message: "Test case name is required" });
    }
    if (!testCode) {
      return res.status(400).json({ message: "Test code is required" });
    }

    // Validate that total marks don't exceed assignment's total marks
    const assignment = await Assignment.findByPk(parseInt(assignmentId));
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    const newMarks = parseFloat(marks) || 1;
    const assignmentTotalMarks = parseFloat(assignment.totalMarks) || 0;

    // Calculate sum of existing test cases
    const existingTestCases = await TestCase.findAll({
      where: { assignmentId: parseInt(assignmentId) },
      attributes: ['marks']
    });

    const existingMarksSum = existingTestCases.reduce((sum, tc) => sum + (parseFloat(tc.marks) || 0), 0);
    const totalMarksAfterCreation = existingMarksSum + newMarks;

    if (totalMarksAfterCreation > assignmentTotalMarks) {
      return res.status(400).json({
        message: `Total marks of test cases (${totalMarksAfterCreation.toFixed(2)}) cannot exceed assignment total marks (${assignmentTotalMarks.toFixed(2)})`,
        existingMarksSum: existingMarksSum.toFixed(2),
        newMarks: newMarks.toFixed(2),
        totalMarksAfterCreation: totalMarksAfterCreation.toFixed(2),
        assignmentTotalMarks: assignmentTotalMarks.toFixed(2)
      });
    }

    const testCase = await TestCase.create({
      assignmentId: parseInt(assignmentId),
      testName,
      testCode,
      marks: newMarks,
      isHidden: isHidden === 'true' || isHidden === true,
    });

    res.status(201).json({
      message: "Test case created successfully",
      testCase,
      success: true
    });
  } catch (error) {
    console.error("Error creating test case:", error);
    res.status(500).json({
      message: "Error creating test case: " + error.message,
      error: error.message
    });
  }
};

exports.updateTestCase = async (req, res) => {
  try {
    const { testCaseId } = req.params;
    const { testName, testCode, marks, isHidden } = req.body;

    const testCase = await TestCase.findByPk(testCaseId);
    if (!testCase) {
      return res.status(404).json({ message: "Test case not found" });
    }

    // If marks are being updated, validate total marks
    if (marks !== undefined) {
      const newMarks = parseFloat(marks);
      const oldMarks = parseFloat(testCase.marks) || 0;
      const marksChange = newMarks - oldMarks;

      // Get assignment to check total marks limit
      const assignment = await Assignment.findByPk(testCase.assignmentId);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }

      const assignmentTotalMarks = parseFloat(assignment.totalMarks) || 0;

      // Calculate sum of all test cases except this one
      const otherTestCases = await TestCase.findAll({
        where: { assignmentId: testCase.assignmentId, id: { [require('sequelize').Op.ne]: testCaseId } },
        attributes: ['marks']
      });

      const otherMarksSum = otherTestCases.reduce((sum, tc) => sum + (parseFloat(tc.marks) || 0), 0);
      const totalMarksAfterUpdate = otherMarksSum + newMarks;

      if (totalMarksAfterUpdate > assignmentTotalMarks) {
        return res.status(400).json({
          message: `Total marks of test cases (${totalMarksAfterUpdate.toFixed(2)}) cannot exceed assignment total marks (${assignmentTotalMarks.toFixed(2)})`,
          otherMarksSum: otherMarksSum.toFixed(2),
          newMarks: newMarks.toFixed(2),
          totalMarksAfterUpdate: totalMarksAfterUpdate.toFixed(2),
          assignmentTotalMarks: assignmentTotalMarks.toFixed(2)
        });
      }

      testCase.marks = newMarks;
    }

    if (testName) testCase.testName = testName;
    if (testCode) testCase.testCode = testCode;
    if (isHidden !== undefined) testCase.isHidden = isHidden;

    await testCase.save();
    res.json({ message: "Test case updated", testCase });
  } catch (error) {
    console.error("Error updating test case:", error);
    res.status(500).json({ message: "Error updating test case" });
  }
};

exports.deleteTestCase = async (req, res) => {
  try {
    const { testCaseId } = req.params;
    const testCase = await TestCase.findByPk(testCaseId);

    if (!testCase) {
      return res.status(404).json({ message: "Test case not found" });
    }

    // Delete all test results associated with this test case first (foreign key constraint)
    await TestResult.destroy({
      where: { testCaseId }
    });

    // Now delete the test case
    await testCase.destroy();
    res.json({ message: "Test case deleted successfully" });
  } catch (error) {
    console.error("Error deleting test case:", error);
    res.status(500).json({ message: "Error deleting test case", error: error.message });
  }
};

// ==================== BULK OPERATIONS ====================

// Run test cases for all submissions in an assignment
exports.runBulkTests = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    // 1. Fetch all submissions and the test cases for this assignment
    const submissions = await Submission.findAll({
      where: { assignmentId },
      include: [{ model: User, as: "student", attributes: ['name'] }]
    });

    const testCases = await TestCase.findAll({
      where: { assignmentId },
      order: [['id', 'ASC']]
    });

    if (submissions.length === 0) {
      return res.json({ message: "No submissions found", results: [] });
    }

    const studentResults = [];

    // 2. Process each student submission one by one
    for (const submission of submissions) {
      const tempDir = path.join(__dirname, `../../temp/bulk_${submission.id}_${Date.now()}`);
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      try {
        await submission.update({ status: 'grading' });
        const codeFiles = await CodeFile.findAll({ where: { submissionId: submission.id } });
        const javaFiles = codeFiles.filter(f => f.fileName.endsWith(".java"));

        if (javaFiles.length === 0) {
          studentResults.push({ studentName: submission.student.name, status: 'no-java-files' });
          continue;
        }

        // Write student files to disk
        for (const file of javaFiles) {
          fs.writeFileSync(path.join(tempDir, file.fileName), file.fileContent);
        }

        // 3. Compile Student Java Files
        try {
          const javaFileNames = javaFiles.map(f => f.fileName).join(" ");
          execSync(`cd "${tempDir}" && ${JAVAC_CMD} ${javaFileNames}`, {
            timeout: 10000,
            stdio: ['pipe', 'pipe', 'pipe']
          });
        } catch (compileErr) {
          const errorMsg = compileErr.stderr?.toString() || "Compilation failed";

          // Clear previous results before adding the error
          await TestResult.destroy({ where: { submissionId: submission.id } });

          await submission.update({ marks: 0, status: 'compilation-error' });

          // Only create a TestResult if there are test cases to link to
          if (testCases.length > 0) {
            await TestResult.create({
              submissionId: submission.id,
              testCaseId: testCases[0].id, // Linked to first test case to satisfy DB constraint
              passed: false,
              errorMessage: `Compilation Failed: ${errorMsg}`
            });
          }
          studentResults.push({ studentName: submission.student.name, status: 'compilation-error' });
          continue;
        }

        // 4. Execution Logic: Run each test case
        let totalMarksEarned = 0;
        await TestResult.destroy({ where: { submissionId: submission.id } }); // Clear old results

        for (const testCase of testCases) {
          let passed = false;
          let errorMessage = "";

          try {
            const uniqueId = Date.now() + Math.random().toString().replace('.', '');
            const testClassName = `Test${uniqueId}`;
            const testCode = `public class ${testClassName} {
              public static void main(String[] args) {
                try {
                  ${transformJUnitStyle(testCase.testCode)}
                  System.out.println("PASS");
                } catch (AssertionError e) {
                  System.out.println("FAIL: " + e.getMessage());
                } catch (Exception e) {
                  System.out.println("FAIL: " + e.getMessage());
                }
              }
            }`;

            fs.writeFileSync(path.join(tempDir, `${testClassName}.java`), testCode);

            // Compile and Run the test harness
            const cmd = `cd "${tempDir}" && ${JAVAC_CMD} ${testClassName}.java && ${JAVA_CMD} ${testClassName}`;
            const output = execSync(cmd, {
              encoding: "utf8",
              timeout: 20000,
              stdio: ['pipe', 'pipe', 'pipe'],
              maxBuffer: 5 * 1024 * 1024
            }).trim();

            passed = output.includes("PASS");
            if (passed) {
              totalMarksEarned += parseFloat(testCase.marks) || 0;
            }
          } catch (execError) {
            errorMessage = execError.stderr?.toString() || execError.message;
          }

          // Save individual test case result
          await TestResult.create({
            submissionId: submission.id,
            testCaseId: testCase.id,
            passed,
            errorMessage: passed ? null : errorMessage
          });
        }

        // 5. Final Update for this student
        await submission.update({
          marks: totalMarksEarned,
          status: 'evaluated'
        });

        studentResults.push({
          studentName: submission.student.name,
          status: 'evaluated',
          marks: totalMarksEarned
        });

      } catch (err) {
        console.error(`Error processing submission ${submission.id}:`, err);
      } finally {
        if (fs.existsSync(tempDir)) safeDeletedir(tempDir);
      }
    }

    res.json({ message: "Bulk tests completed", results: studentResults, totalSubmissions: studentResults.length });
  } catch (error) {
    console.error("Bulk testing critical failure:", error);
    res.status(500).json({ message: "Bulk testing failed" });
  }
};

// Run test cases for all submissions in an assignment
exports.runTestCasesForAll = async (req, res) => {
  try {
    const { assignmentId } = req.params;

    // Fetch all submissions for the assignment
    const submissions = await Submission.findAll({ where: { assignmentId } });

    if (submissions.length === 0) {
      return res.status(404).json({ message: "No submissions found for this assignment" });
    }

    // Clear old marks for all submissions
    await Submission.update({ marks: 0, status: "pending" }, { where: { assignmentId } });

    const results = [];

    for (const submission of submissions) {
      // call the module's runTestCases with a fake req/res to capture output
      const fakeReq = { params: { submissionId: submission.id } };
      const fakeRes = {
        json: (data) => results.push(data),
        status: (code) => ({ json: (data) => results.push({ status: code, data }) })
      };
      await exports.runTestCases(fakeReq, fakeRes);
    }

    res.json({
      message: "Test cases executed for all submissions",
      results,
      totalSubmissions: submissions.length
    });
  } catch (error) {
    console.error("Error running test cases for all submissions:", error);
    res.status(500).json({ message: "Error running test cases for all submissions" });
  }
};