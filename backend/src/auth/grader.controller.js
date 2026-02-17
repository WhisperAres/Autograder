const Submission = require("../models/submission");
const Assignment = require("../models/assignment");
const CodeFile = require("../models/codeFile");
const TestCase = require("../models/testCase");
const TestResult = require("../models/testResult");
const GraderSolution = require("../models/graderSolution");
const GraderSolutionFile = require("../models/graderSolutionFile");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");
const os = require("os");

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
        // skip whitespace
        while (code[j] && /\s/.test(code[j])) j++;
        if (code[j] !== '(') continue;

        // find matching closing parenthesis
        let depth = 0;
        let k = j;
        for (; k < code.length; k++) {
          if (code[k] === '(') depth++;
          else if (code[k] === ')') { depth--; if (depth === 0) break; }
        }
        if (k >= code.length) continue; // unmatched, skip

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

        // advance i to after closing parenthesis
        i = k + 1;
        // skip optional semicolon
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

// Get all assignments (for grader to select from)
exports.getAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.findAll();
    res.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ message: "Error fetching assignments" });
  }
};

// Get all submissions
exports.getAllSubmissions = async (req, res) => {
  try {
    const submissions = await Submission.findAll({
      include: [
        { model: Assignment, as: "assignment" },
        { model: CodeFile, as: "codeFiles" }
      ],
      order: [["id", "DESC"]]
    });
    res.json(submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ message: "Error fetching submissions" });
  }
};

// Get submissions for a specific assignment
exports.getSubmissionsByAssignment = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const submissions = await Submission.findAll({
      where: { assignmentId },
      include: [
        { model: CodeFile, as: "codeFiles" }
      ],
      order: [["id", "DESC"]]
    });

    return res.json(submissions || []); 
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return res.json([]); 
  }
};

// Run test cases on a submission
// Run test cases on a submission
exports.runTestCases = async (req, res) => {
  try {
    const { submissionId } = req.params;

    // Fetch submission with code files
    const submission = await Submission.findByPk(submissionId, {
      include: [{ model: CodeFile, as: "codeFiles" }]
    });

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Fetch test cases for this assignment
    const testCases = await TestCase.findAll({
      where: { assignmentId: submission.assignmentId }
    });

    if (testCases.length === 0) {
      return res.json({ message: "No test cases defined for this assignment", results: [] });
    }

    const codeFiles = submission.codeFiles;
    if (!codeFiles || codeFiles.length === 0) {
      return res.status(404).json({ message: "No code files found in submission" });
    }

    const results = [];
    const tempDir = path.join(__dirname, "../../temp", `submission_${submissionId}`);

    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    try {
      // Write code files to temp directory
      for (const codeFile of codeFiles) {
        const filePath = path.join(tempDir, codeFile.fileName);
        fs.writeFileSync(filePath, codeFile.fileContent, "utf8");
      }

      // [FIX] Find the main file and handle Java Compilation specifically
      const mainFile = codeFiles.find(f => 
        f.fileName.endsWith(".java") || f.fileName.endsWith(".js")
      ) || codeFiles[0];

      if (mainFile.fileName.endsWith(".java")) {
        const javaFiles = codeFiles.filter(f => f.fileName.endsWith(".java")).map(f => f.fileName).join(" ");
        
        try {
          // [FIX] Compile with piped stdio to capture student errors instead of crashing
          execSync(`cd "${tempDir}" && ${JAVAC_CMD} ${javaFiles}`, { 
            timeout: 10000, 
            stdio: ['pipe', 'pipe', 'pipe'] 
          });
        } catch (compileErr) {
          // [FIX] Catch the error and return it to the UI gracefully
          const errorMsg = compileErr.stderr ? compileErr.stderr.toString() : compileErr.message;
          return res.json({ 
            message: "Compilation failed", 
            results: [],
            error: errorMsg,
            submissionId
          });
        }
      }

      // Run each test case (now that compilation is confirmed)
      for (const testCase of testCases) {
        let passed = false;
        let actualOutput = "";
        let errorMessage = "";

        try {
          let command = "";
          if (mainFile.fileName.endsWith(".java")) {
            const uniqueId = Date.now();
            const testFileName = `Test${uniqueId}.java`;
            const className = `Test${uniqueId}`;
            const transformed = transformJUnitStyle(testCase.testCode);
            const testCode = `public class ${className} {\n    public static void main(String[] args) {\n        try {\n            ${transformed}\n            System.out.println("PASS");\n        } catch (AssertionError e) {\n            System.out.println("FAIL: " + e.getMessage());\n        } catch (Exception e) {\n            System.out.println("FAIL: " + e.getMessage());\n        }\n    }\n}`;
            fs.writeFileSync(path.join(tempDir, testFileName), testCode);
            command = `cd "${tempDir}" && ${JAVAC_CMD} ${testFileName} && ${JAVA_CMD} ${className}`;
          } else if (mainFile.fileName.endsWith(".js")) {
            command = `cd "${tempDir}" && node ${mainFile.fileName}`;
          }

          if (command) {
            actualOutput = execSync(command, {
              input: testCase.input || "",
              encoding: "utf8",
              stdio: ["pipe", "pipe", "pipe"],
              timeout: 5000
            }).trim();
            passed = actualOutput.includes("PASS") || actualOutput === testCase.expectedOutput.trim();
          }
        } catch (execError) {
          errorMessage = execError.stderr ? execError.stderr.toString() : execError.message;
          passed = false;
        }

        results.push({
          testName: testCase.testName,
          passed,
          actualOutput,
          expectedOutput: testCase.expectedOutput,
          errorMessage
        });
      }

      // Update marks and status in DB
      let totalMarksEarned = 0;
      results.forEach((r, idx) => { if (r.passed) totalMarksEarned += parseFloat(testCases[idx].marks) || 0; });
      await submission.update({ marks: totalMarksEarned, status: "evaluated" });

      res.json({
        message: "Tests completed",
        results,
        submissionId,
        marksObtained: totalMarksEarned
      });

    } finally {
      // Cleanup temp directory
      try { fs.rmSync(tempDir, { recursive: true, force: true }); } catch (e) {}
    }
  } catch (error) {
    console.error("Grader Error:", error);
    res.status(500).json({ message: "Error running tests: " + error.message });
  }
};

// Provide feedback on a submission
exports.provideFeedback = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { feedback, marks } = req.body;
    const graderId = req.user.id;

    if (!feedback || marks === undefined) {
      return res.status(400).json({ message: "Feedback and marks required" });
    }

    const submission = await Submission.findByPk(submissionId);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Update submission marks and status
    await submission.update({
      marks: parseFloat(marks),
      status: "graded"
    });

    res.json({
      message: "Feedback provided successfully",
      submission
    });
  } catch (error) {
    console.error("Error providing feedback:", error);
    res.status(500).json({ message: "Error providing feedback" });
  }
};

// Get feedback for a submission
exports.getSubmissionFeedback = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await Submission.findByPk(submissionId);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const testResults = await TestResult.findAll({
      where: { submissionId },
      include: [{ model: TestCase, as: "testCase" }]
    });

    res.json({
      submission,
      testResults
    });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({ message: "Error fetching feedback" });
  }
};

// Get submission details for grading
exports.getSubmissionForGrading = async (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = await Submission.findByPk(submissionId, {
      include: [
        { model: CodeFile, as: "codeFiles" },
        { model: TestResult, as: "testResults" }
      ]
    });

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    res.json(submission);
  } catch (error) {
    console.error("Error fetching submission:", error);
    res.status(500).json({ message: "Error fetching submission" });
  }
};

// Get submission code/files
exports.getSubmissionCode = async (req, res) => {
  try {
    const { submissionId, fileId } = req.params;

    const submission = await Submission.findByPk(submissionId);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    if (fileId) {
      const codeFile = await CodeFile.findOne({
        where: { id: fileId, submissionId }
      });
      if (!codeFile) {
        return res.status(404).json({ message: "Code file not found" });
      }
      return res.json(codeFile);
    }

    // Return all files for this submission
    const codeFiles = await CodeFile.findAll({
      where: { submissionId }
    });

    res.json(codeFiles);
  } catch (error) {
    console.error("Error fetching code:", error);
    res.status(500).json({ message: "Error fetching code" });
  }
};

// Update submission status
exports.updateSubmissionStatus = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { status } = req.body;

    const submission = await Submission.findByPk(submissionId);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    await submission.update({ status });

    res.json({
      message: "Submission status updated",
      submission
    });
  } catch (error) {
    console.error("Error updating submission:", error);
    res.status(500).json({ message: "Error updating submission" });
  }
};
// Upload grader's own solution
exports.uploadGraderSolution = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const graderId = req.user.id;
    
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: "No files provided" });
    }

    // Create grader solution record
    const solution = await GraderSolution.create({
      assignmentId: parseInt(assignmentId),
      graderId
    });

    // Save all files
    const savedFiles = await Promise.all(
      req.files.map(file => 
        GraderSolutionFile.create({
          solutionId: solution.id,
          fileName: file.originalname,
          fileContent: file.buffer.toString('utf-8')
        })
      )
    );

    const files = savedFiles.map(f => ({
      id: f.id,
      fileName: f.fileName,
      fileContent: f.fileContent
    }));

    res.json({
      message: "Solutions uploaded successfully",
      solutionId: solution.id,
      files,
      fileCount: files.length
    });
  } catch (error) {
    console.error("Error uploading solution:", error);
    res.status(500).json({ message: "Error uploading solution" });
  }
};

// Run test cases for grader's solution (supports multiple files)
exports.runGraderTests = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const { solutionFiles, solutionId, solutionContent, fileName } = req.body;

    // Support three formats:
    // 1. solutionId (from database) - fetch files from DB
    // 2. solutionFiles array (from frontend upload)
    // 3. solutionContent + fileName (legacy format)
    
    let files = [];
    
    if (solutionId) {
      // Fetch from database
      const solution = await GraderSolution.findByPk(parseInt(solutionId), {
        include: [{ model: GraderSolutionFile, as: 'files' }]
      });
      
      if (!solution) {
        return res.status(404).json({ message: "Solution not found" });
      }
      
      files = solution.files.map(f => ({
        fileName: f.fileName,
        fileContent: f.fileContent
      }));
    } else if (solutionFiles && Array.isArray(solutionFiles)) {
      files = solutionFiles;
    } else if (solutionContent && fileName) {
      files = [{ fileName, fileContent: solutionContent }];
    }
    
    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No solution files provided" });
    }

    // Get test cases for this assignment
    const testCases = await TestCase.findAll({
      where: { assignmentId }
    });

    if (testCases.length === 0) {
      return res.json({
        message: "No test cases found",
        results: []
      });
    }

    const results = [];
    let passCount = 0;
    const tempDir = path.join(__dirname, '../../temp', `grader_test_${Date.now()}`);

    // Create temp directory for all files
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    try {
      // Write all files to temp directory
      for (const file of files) {
        const filePath = path.join(tempDir, file.fileName);
        fs.writeFileSync(filePath, file.fileContent);
      }

      // Find the main file (Java, Python, or JavaScript)
      const mainFile = files.find(f => 
        f.fileName.endsWith('.java') || f.fileName.endsWith('.py') || f.fileName.endsWith('.js')
      ) || files[0];

      const fileExt = path.extname(mainFile.fileName);
      const className = path.basename(mainFile.fileName, fileExt);

      for (const testCase of testCases) {
        try {
          let testPassed = false;
          let errorMessage = '';
          let output = '';

          try {
              if (fileExt === '.java') {
              // Compile all Java files together
              const javaFiles = files.filter(f => f.fileName.endsWith('.java')).map(f => f.fileName).join(' ');
              execSync(`cd "${tempDir}" && ${JAVAC_CMD} ${javaFiles}`, { timeout: 5000 });
              
              // For Java, create a test file that runs assertions
              const uniqueId = Date.now();
              const testFileName = `Test${uniqueId}.java`;
              const className = `Test${uniqueId}`;
              // transform junit-like assertions to plain Java checks
              const transformed = transformJUnitStyle(testCase.testCode);
              const testCode = `public class ${className} {\n    public static void main(String[] args) {\n        try {\n            ${transformed}\n            System.out.println("PASS");\n        } catch (AssertionError e) {\n            System.out.println("FAIL: " + e.getMessage());\n        } catch (Exception e) {\n            System.out.println("FAIL: " + e.getMessage());\n            e.printStackTrace();\n        }\n    }\n}`;
              fs.writeFileSync(path.join(tempDir, testFileName), testCode);
              
              // Compile and run test
              output = execSync(`cd "${tempDir}" && ${JAVAC_CMD} ${testFileName} && ${JAVA_CMD} ${className}`, { 
                timeout: 5000,
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'pipe']
              }).trim();
              
              testPassed = output.includes("PASS");
            } else if (fileExt === '.py') {
              // For Python, create test file
              const uniqueId = Date.now();
              const testFileName = `test${uniqueId}.py`;
                const testCode = `try:\n    ${testCase.testCode.replace(/\n/g, '\\n')}\n    print("PASS")\nexcept AssertionError as e:\n    print("FAIL: " + str(e))\nexcept Exception as e:\n    print("FAIL: " + str(e))\n`;
              fs.writeFileSync(path.join(tempDir, testFileName), testCode);
              
              output = execSync(`cd "${tempDir}" && python ${testFileName}`, { 
                timeout: 5000,
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'pipe']
              }).trim();
              
              testPassed = output.includes("PASS");
            } else if (fileExt === '.js') {
              // For JavaScript, create test file
              const uniqueId = Date.now();
              const testFileName = `test${uniqueId}.js`;
                const testCode = `try {\n    ${testCase.testCode.replace(/\n/g, '\\n')}\n    console.log("PASS");\n} catch (e) {\n    console.log("FAIL: " + e.message);\n}\n`;
              fs.writeFileSync(path.join(tempDir, testFileName), testCode);
              
              output = execSync(`cd "${tempDir}" && node ${testFileName}`, { 
                timeout: 5000,
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'pipe']
              }).trim();
              
              testPassed = output.includes("PASS");
            }
          } catch (execError) {
            testPassed = false;
            // Capture both stdout and stderr
            const stderr = execError.stderr?.toString() || '';
            const stdout = execError.stdout?.toString() || '';
            errorMessage = stderr || stdout || execError.message || 'Test execution failed';
          }

          if (testPassed) passCount++;

          results.push({
            testName: testCase.testName,
            passed: testPassed,
            errorMessage: testPassed ? null : errorMessage,
            marks: testCase.marks
          });
        } catch (err) {
          results.push({
            testName: testCase.testName,
            passed: false,
            errorMessage: err.message,
            marks: testCase.marks
          });
        }
      }
    } finally {
      // Clean up temp directory
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (e) {
        console.error('Error cleaning temp directory:', e);
      }
    }

    res.json({
      message: "Tests completed",
      results,
      passCount,
      totalCount: testCases.length
    });
  } catch (error) {
    console.error("Error running tests:", error);
    res.status(500).json({ message: "Error running tests" });
  }
};

// Get grader's uploaded solutions for an assignment
exports.getGraderSolutions = async (req, res) => {
  try {
    const { assignmentId } = req.params;
    const graderId = req.user.id;

    const solutions = await GraderSolution.findAll({
      where: { 
        assignmentId: parseInt(assignmentId),
        graderId 
      },
      include: [{
        model: GraderSolutionFile,
        as: 'files',
        attributes: ['id', 'fileName']
      }],
      order: [['uploadedAt', 'DESC']]
    });

    res.json(solutions || []);
  } catch (error) {
    console.error("Error fetching solutions:", error);
    res.status(500).json({ message: "Error fetching solutions" });
  }
};

// Get specific solution with files
exports.getGraderSolution = async (req, res) => {
  try {
    const { solutionId } = req.params;
    const graderId = req.user.id;

    const solution = await GraderSolution.findOne({
      where: { 
        id: parseInt(solutionId),
        graderId 
      },
      include: [{
        model: GraderSolutionFile,
        as: 'files'
      }]
    });

    if (!solution) {
      return res.status(404).json({ message: "Solution not found" });
    }

    res.json(solution);
  } catch (error) {
    console.error("Error fetching solution:", error);
    res.status(500).json({ message: "Error fetching solution" });
  }
};

// Get specific file from solution
exports.getGraderSolutionFile = async (req, res) => {
  try {
    const { solutionId, fileId } = req.params;
    const graderId = req.user.id;

    const solution = await GraderSolution.findOne({
      where: { 
        id: parseInt(solutionId),
        graderId 
      }
    });

    if (!solution) {
      return res.status(404).json({ message: "Solution not found" });
    }

    const file = await GraderSolutionFile.findOne({
      where: {
        id: parseInt(fileId),
        solutionId: parseInt(solutionId)
      }
    });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    res.json(file);
  } catch (error) {
    console.error("Error fetching file:", error);
    res.status(500).json({ message: "Error fetching file" });
  }
};

// Delete solution and all its files
exports.deleteGraderSolution = async (req, res) => {
  try {
    const { solutionId } = req.params;
    const graderId = req.user.id;

    const solution = await GraderSolution.findOne({
      where: { 
        id: parseInt(solutionId),
        graderId 
      }
    });

    if (!solution) {
      return res.status(404).json({ message: "Solution not found" });
    }

    // Delete all files first
    await GraderSolutionFile.destroy({
      where: { solutionId: parseInt(solutionId) }
    });

    // Delete solution
    await solution.destroy();

    res.json({ message: "Solution deleted successfully" });
  } catch (error) {
    console.error("Error deleting solution:", error);
    res.status(500).json({ message: "Error deleting solution" });
  }
};

// Delete specific file from solution
exports.deleteGraderSolutionFile = async (req, res) => {
  try {
    const { solutionId, fileId } = req.params;
    const graderId = req.user.id;

    const solution = await GraderSolution.findOne({
      where: { 
        id: parseInt(solutionId),
        graderId 
      }
    });

    if (!solution) {
      return res.status(404).json({ message: "Solution not found" });
    }

    const file = await GraderSolutionFile.findOne({
      where: {
        id: parseInt(fileId),
        solutionId: parseInt(solutionId)
      }
    });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    await file.destroy();

    // Get remaining files
    const remainingFiles = await GraderSolutionFile.findAll({
      where: { solutionId: parseInt(solutionId) }
    });

    res.json({ 
      message: "File deleted successfully",
      remainingFiles 
    });
  } catch (error) {
    console.error("Error deleting file:", error);
    res.status(500).json({ message: "Error deleting file" });
  }
};