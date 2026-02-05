const User = require("../models/user");
const Assignment = require("../models/assignment");
const Submission = require("../models/submission");
const CodeFile = require("../models/codeFile");
const TestCase = require("../models/testCase");
const TestResult = require("../models/testResult");
const bcrypt = require("bcryptjs");
const os = require("os");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

// Detect Java executable path (handle both Windows and Unix)
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

    if (!['student', 'ta', 'admin'].includes(role)) {
      return res.status(400).json({ message: "Invalid role. Must be: student, ta, or admin" });
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

    if (!['student', 'ta', 'admin'].includes(role)) {
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

// Get users by role
exports.getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;

    if (!['student', 'ta', 'admin'].includes(role)) {
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

    await TestCase.destroy({ where: { assignmentId } });
    await assignment.destroy();

    res.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    console.error("Error deleting assignment:", error);
    res.status(500).json({ message: "Error deleting assignment" });
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

    if (marks < 0 || marks > submission.totalMarks) {
      return res.status(400).json({ 
        message: `Marks must be between 0 and ${submission.totalMarks}` 
      });
    }

    await submission.update({ marks });

    res.json({
      message: "Marks updated successfully",
      submission
    });
  } catch (error) {
    console.error("Error updating marks:", error);
    res.status(500).json({ message: "Error updating marks" });
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

      for (const testCase of testCases) {
        let passed = false;
        let actualOutput = "";
        let errorMessage = "";

        try {
          const codeFileExtensions = codeFiles.map(f => path.extname(f.fileName))[0];
          let actualOutput = "";
          let command = "";

          // Compile all Java files first if there are any
          const javaFiles = codeFiles.filter(f => f.fileName.endsWith(".java"));
          if (javaFiles.length > 0) {
            const javaFileNames = javaFiles.map(f => f.fileName).join(" ");
            execSync(`cd "${tempDir}" && ${JAVAC_CMD} ${javaFileNames}`, { 
              timeout: 5000,
              stdio: ['pipe', 'pipe', 'pipe']
            });
          }

          if (codeFileExtensions === ".java" || javaFiles.length > 0) {
            // For Java, create a test file that runs the test code as a harness
            const uniqueId = Date.now();
            const testFileName = `Test${uniqueId}.java`;
            const testClassName = `Test${uniqueId}`;
            const testCode = `public class ${testClassName} {
    public static void main(String[] args) {
        try {
            ${testCase.testCode}
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
              timeout: 5000,
              stdio: ['pipe', 'pipe', 'pipe']
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
                  timeout: 5000
                }).trim();
              } else {
                actualOutput = execSync(command, {
                  encoding: "utf8",
                  timeout: 5000
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

      await submission.update({ status: "evaluated" });

      res.json({
        message: "Test cases executed",
        results,
        submissionId,
        passCount: results.filter(r => r.passed).length,
        totalCount: results.length
      });
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError);
      }
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
    const totalGraders = await User.count({ where: { role: 'ta' } });
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
    
    const testCase = await TestCase.create({
      assignmentId: parseInt(assignmentId),
      testName,
      testCode,
      marks: parseInt(marks) || 1,
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

    if (testName) testCase.testName = testName;
    if (testCode) testCase.testCode = testCode;
    if (marks !== undefined) testCase.marks = parseInt(marks);
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

    const submissions = await Submission.findAll({
      where: { assignmentId },
      include: [
        { model: CodeFile, as: "codeFiles" },
        { model: Assignment, as: "assignment" }
      ]
    });

    if (submissions.length === 0) {
      return res.json({
        message: "No submissions found",
        passCount: 0,
        failCount: 0,
        errors: []
      });
    }

    let passCount = 0;
    let failCount = 0;
    const errors = [];
    const submissionResults = [];

    for (const submission of submissions) {
      try {
        // Get test cases for this assignment
        const testCases = await TestCase.findAll({
          where: { assignmentId }
        });

        if (testCases.length === 0) continue;

        const codeFiles = submission.codeFiles;
        if (!codeFiles || codeFiles.length === 0) {
          errors.push(`Submission ${submission.id}: No code files`);
          failCount += testCases.length;
          continue;
        }

        // Create unique temp directory for this submission
        const tempDir = path.join(__dirname, `../../temp/submission_${submission.id}_${Date.now()}`);
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

        try {
          // Write all code files to temp directory
          for (const codeFile of codeFiles) {
            const filePath = path.join(tempDir, codeFile.fileName);
            fs.writeFileSync(filePath, codeFile.fileContent, "utf8");
          }

          // Check if there are Java files
          const javaFiles = codeFiles.filter(f => f.fileName.endsWith(".java"));
          
          // Compile all Java files if they exist
          if (javaFiles.length > 0) {
            try {
              const javaFileNames = javaFiles.map(f => f.fileName).join(" ");
              execSync(`cd "${tempDir}" && ${JAVAC_CMD} ${javaFileNames}`, {
                timeout: 10000,
                stdio: ['pipe', 'pipe', 'pipe']
              });
            } catch (compileErr) {
              const errorMsg = `Submission ${submission.id}: Java compilation failed - ${compileErr.message}`;
              errors.push(errorMsg);
              console.error(errorMsg);
              failCount += testCases.length;
              continue; // Skip all tests for this submission
            }
          }

          // Run each test case
          for (const testCase of testCases) {
            try {
              let passed = false;
              let actualOutput = "";
              let errorMessage = "";

              try {
                if (javaFiles.length > 0) {
                  // For Java, create a test harness file
                  const uniqueId = Date.now() + Math.random().toString().slice(2);
                  const testFileName = `Test${uniqueId}.java`;
                  const testClassName = `Test${uniqueId}`;
                  const testCode = `public class ${testClassName} {
    public static void main(String[] args) {
        try {
            ${testCase.testCode}
            System.out.println("PASS");
        } catch (AssertionError e) {
            System.out.println("FAIL: " + e.getMessage());
        } catch (Exception e) {
            System.out.println("FAIL: " + e.getMessage());
        }
    }
}`;
                  
                  fs.writeFileSync(path.join(tempDir, testFileName), testCode);
                  
                  const cmd = `cd "${tempDir}" && ${JAVAC_CMD} ${testFileName} && ${JAVA_CMD} ${testClassName}`;
                  actualOutput = execSync(cmd, {
                    encoding: "utf8",
                    timeout: 10000,
                    stdio: ['pipe', 'pipe', 'pipe']
                  }).trim();
                  
                  passed = actualOutput.includes("PASS");
                } else {
                  // For non-Java languages
                  const mainFile = codeFiles[0];
                  const fileExt = path.extname(mainFile.fileName);
                  let command = '';

                  if (fileExt === '.js') {
                    command = `cd "${tempDir}" && node ${mainFile.fileName}`;
                  } else if (fileExt === '.py') {
                    command = `cd "${tempDir}" && python ${mainFile.fileName}`;
                  }

                  if (command) {
                    if (testCase.input) {
                      actualOutput = execSync(command, {
                        input: testCase.input,
                        encoding: "utf8",
                        timeout: 10000,
                        stdio: ['pipe', 'pipe', 'pipe']
                      }).trim();
                    } else {
                      actualOutput = execSync(command, {
                        encoding: "utf8",
                        timeout: 10000,
                        stdio: ['pipe', 'pipe', 'pipe']
                      }).trim();
                    }
                    passed = actualOutput.includes("PASS") || actualOutput === testCase.expectedOutput?.trim();
                  }
                }
              } catch (execError) {
                passed = false;
                actualOutput = "";
                errorMessage = execError.message || "Execution error";
              }

              // Save test result
              await TestResult.create({
                submissionId: submission.id,
                testCaseId: testCase.id,
                passed,
                actualOutput: passed ? actualOutput : "",
                errorMessage: !passed ? errorMessage : null
              });

              if (passed) passCount++;
              else failCount++;

            } catch (testErr) {
              failCount++;
              const errorMsg = `Submission ${submission.id}, Test ${testCase.testName}: ${testErr.message}`;
              errors.push(errorMsg);
              console.error(errorMsg);
            }
          }

          // Update submission status
          await submission.update({ status: "evaluated" });

        } finally {
          // Clean up temp directory
          try {
            if (fs.existsSync(tempDir)) {
              fs.rmSync(tempDir, { recursive: true, force: true });
            }
          } catch (cleanupErr) {
            console.error(`Failed to cleanup temp dir ${tempDir}:`, cleanupErr.message);
          }
        }

      } catch (submissionErr) {
        const errorMsg = `Submission ${submission.id}: ${submissionErr.message}`;
        errors.push(errorMsg);
        console.error(errorMsg);
        failCount += (await TestCase.count({ where: { assignmentId } }));
      }
    }

    res.json({
      message: "Bulk tests completed",
      passCount,
      failCount,
      totalTests: passCount + failCount,
      successRate: `${Math.round((passCount / (passCount + failCount)) * 100)}%`,
      errors: errors.length > 0 ? errors : null
    });
  } catch (error) {
    console.error("Error running bulk tests:", error);
    res.status(500).json({
      message: "Error running bulk tests",
      error: error.message,
      errors: [error.message]
    });
  }
};
