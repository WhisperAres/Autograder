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

const JAVAC_CMD = process.env.JAVAC_CMD || "javac";
const JAVA_CMD = process.env.JAVA_CMD || "java";

// Safe file cleanup with timeout
const safeDeletedir = (dirpath) => {
  try {
    if (fs.existsSync(dirpath)) {
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

/**
 * Enhanced Transformer: Handles all JUnit-style assertions with robustness
 * 1. assertEquals(expected, actual, delta)
 * 2. assertEquals(expected, actual)
 * 3. assertTrue(condition)
 * 4. assertFalse(condition)
 * 5. assertNotNull(value)
 */
const transformJUnitStyle = (testCode) => {
  if (!testCode) return "";

  // Helper to split arguments while respecting nested parentheses and quotes
  const splitArgs = (argsStr) => {
    const parts = [];
    let current = '';
    let depth = 0;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    
    for (let i = 0; i < argsStr.length; i++) {
      const char = argsStr[i];
      const prevChar = i > 0 ? argsStr[i - 1] : '';
      
      if (char === "'" && prevChar !== '\\' && !inDoubleQuote) {
        inSingleQuote = !inSingleQuote;
      } else if (char === '"' && prevChar !== '\\' && !inSingleQuote) {
        inDoubleQuote = !inDoubleQuote;
      }
      
      if (!inSingleQuote && !inDoubleQuote) {
        if (char === '(' || char === '{' || char === '[') depth++;
        else if (char === ')' || char === '}' || char === ']') depth--;
        else if (char === ',' && depth === 0) {
          parts.push(current.trim());
          current = '';
          continue;
        }
      }
      current += char;
    }
    if (current.trim()) parts.push(current.trim());
    return parts;
  };

  let result = testCode;

  // 1. assertEquals with 3 arguments (includes delta)
  result = result.replace(/assertEquals\s*\(([^)]+,[^)]+,[^)]+)\)\s*;/g, (match, argsStr) => {
    const parts = splitArgs(argsStr);
    if (parts.length === 3) {
      const [expected, actual, delta] = parts;
      return `if (Math.abs((${expected}) - (${actual})) > (${delta})) throw new AssertionError("assertEquals with delta failed: expected " + (${expected}) + " (±" + (${delta}) + ") but got " + (${actual}));`;
    }
    return match;
  });

  // 2. assertEquals with 2 arguments
  result = result.replace(/assertEquals\s*\(([^)]+,[^)]+)\)\s*;/g, (match, argsStr) => {
    const parts = splitArgs(argsStr);
    if (parts.length === 2) {
      const [expected, actual] = parts;
      return `if (!String.valueOf(${expected}).equals(String.valueOf(${actual}))) throw new AssertionError("assertEquals failed: expected " + String.valueOf(${expected}) + " but got " + String.valueOf(${actual}));`;
    }
    return match;
  });

  // 3. assertTrue
  result = result.replace(/assertTrue\s*\(([^)]+)\)\s*;/g, (match, condition) => {
    return `if (!(${condition})) throw new AssertionError("assertTrue failed: condition '" + (${condition}) + "' was not true");`;
  });

  // 4. assertFalse
  result = result.replace(/assertFalse\s*\(([^)]+)\)\s*;/g, (match, condition) => {
    return `if ((${condition})) throw new AssertionError("assertFalse failed: condition '" + (${condition}) + "' was not false");`;
  });

  // 5. assertNotNull
  result = result.replace(/assertNotNull\s*\(([^)]+)\)\s*;/g, (match, value) => {
    return `if ((${value}) == null) throw new AssertionError("assertNotNull failed: " + (${value}) + " was null");`;
  });

  return result;
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
exports.runTestCases = async (req, res) => {
  let tempDir = null;
  try {
    const { submissionId } = req.params;

    const submission = await Submission.findByPk(submissionId, {
      include: [{ model: CodeFile, as: "codeFiles" }]
    });

    if (!submission) return res.status(404).json({ message: "Submission not found" });

    const testCases = await TestCase.findAll({
      where: { assignmentId: submission.assignmentId }
    });

    if (testCases.length === 0) {
      return res.json({ message: "No test cases defined", results: [] });
    }

    const javaFiles = submission.codeFiles.filter(f => f.fileName.endsWith(".java"));
    if (javaFiles.length === 0) {
      return res.status(404).json({ message: "No Java files found" });
    }

    // Sanitize ID for Java Class Name
    const sanitizedId = submissionId.toString().replace(/[^a-zA-Z0-9]/g, "");
    tempDir = path.join(__dirname, "../../temp", `sub_${sanitizedId}_${Date.now()}`);
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    // 1. Write student files
    for (const codeFile of javaFiles) {
      fs.writeFileSync(path.join(tempDir, codeFile.fileName), codeFile.fileContent, "utf8");
    }

    // 2. Compile all student files together
    const javaFileNames = javaFiles.map(f => `"${f.fileName}"`).join(" ");
    try {
      execSync(`${JAVAC_CMD} ${javaFileNames}`, { cwd: tempDir, stdio: 'pipe' });
    } catch (compileErr) {
      const errOutput = compileErr.stderr ? compileErr.stderr.toString() : compileErr.message;
      return res.json({ 
        message: "Compilation failed", 
        error: errOutput,
        results: [], 
        submissionId 
      });
    }

    // 3. Build the Master Runner with Scoped Blocks {}
    const masterClassName = `MasterRunner${sanitizedId}`;
    let masterCode = `public class ${masterClassName} {\n`;
    masterCode += `  public static void main(String[] args) {\n`;
    
    testCases.forEach((tc, index) => {
      masterCode += `    System.out.println("@@BEGIN_${index}@@");\n`;
      masterCode += `    try {\n`;
      masterCode += `      { // Start Scope for Test ${index}\n`;
      masterCode += `        ${transformJUnitStyle(tc.testCode)}\n`;
      masterCode += `      } // End Scope\n`;
      masterCode += `      System.out.println("@@PASS@@");\n`;
      masterCode += `    } catch (Throwable e) {\n`;
      // Use getMessage() or toString() to capture the error details
      masterCode += `      System.out.println("@@FAIL@@" + e.toString());\n`;
      masterCode += `    }\n`;
    });
    masterCode += `  }\n}`;

    fs.writeFileSync(path.join(tempDir, `${masterClassName}.java`), masterCode);
    
    // Compile Master Runner
    execSync(`${JAVAC_CMD} ${masterClassName}.java`, { cwd: tempDir });

    // 4. Execute the single process
    let rawOutput = "";
    try {
      rawOutput = execSync(`${JAVA_CMD} ${masterClassName}`, { 
        cwd: tempDir, 
        encoding: "utf8", 
        timeout: 15000 // Prevents infinite loops from freezing server
      });
    } catch (execErr) {
      // If the whole process crashes (e.g. out of memory)
      rawOutput = execErr.stdout ? execErr.stdout.toString() : "";
    }

    // 5. Parse output
    const results = testCases.map((tc, index) => {
      const marker = `@@BEGIN_${index}@@`;
      const section = rawOutput.split(marker)[1]?.split(/@@BEGIN_\d+@@/)[0] || "";
      const passed = section.includes("@@PASS@@");
      const errorPart = section.split("@@FAIL@@")[1] || null;

      return {
        testName: tc.testName,
        passed,
        actualOutput: section.trim().replace("@@PASS@@", "").replace("@@FAIL@@" + (errorPart || ""), ""),
        expectedOutput: tc.expectedOutput,
        errorMessage: passed ? null : errorPart?.trim(),
        marks: tc.marks
      };
    });

    // 6. Finalize Marks and DB status
    let totalMarksEarned = results.reduce((acc, r) => r.passed ? acc + (parseFloat(r.marks) || 0) : acc, 0);
    await submission.update({ marks: totalMarksEarned, status: "evaluated" });

    res.json({
      message: "Tests completed",
      results,
      submissionId,
      marksObtained: totalMarksEarned,
      passCount: results.filter(r => r.passed).length,
      totalCount: results.length
    });

  } catch (error) {
    console.error("Grader Error:", error);
    res.status(500).json({ message: "Internal Error: " + error.message });
  } finally {
    if (tempDir && fs.existsSync(tempDir)) {
      try { safeDeletedir(tempDir); } catch (e) { console.error("Cleanup failed:", e); }
    }
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

    // 1. Prepare file list based on input type
    let files = [];
    if (solutionId) {
      const solution = await GraderSolution.findByPk(parseInt(solutionId), {
        include: [{ model: GraderSolutionFile, as: 'files' }]
      });
      if (!solution) return res.status(404).json({ message: "Solution not found" });
      files = solution.files.map(f => ({ fileName: f.fileName, fileContent: f.fileContent }));
    } else if (solutionFiles && Array.isArray(solutionFiles)) {
      files = solutionFiles;
    } else if (solutionContent && fileName) {
      files = [{ fileName, fileContent: solutionContent }];
    }

    if (!files || files.length === 0) {
      return res.status(400).json({ message: "No solution files provided" });
    }

    // 2. Fetch Test Cases
    const testCases = await TestCase.findAll({ where: { assignmentId } });
    if (testCases.length === 0) {
      return res.json({ message: "No test cases found", results: [] });
    }

    const tempDir = path.join(__dirname, '../../temp', `grader_test_${Date.now()}`);
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const results = [];
    let passCount = 0;

    try {
      // 3. Write all files to temp directory
      for (const file of files) {
        fs.writeFileSync(path.join(tempDir, file.fileName), file.fileContent);
      }

      // 4. Identify Main Language
      const mainFile = files.find(f => 
        f.fileName.endsWith('.java') || f.fileName.endsWith('.py') || f.fileName.endsWith('.js')
      ) || files[0];
      const fileExt = path.extname(mainFile.fileName);

      // =========================================
      // OPTIMIZATION: Compile Java ONCE here
      // =========================================
      if (fileExt === '.java') {
        const javaFiles = files.filter(f => f.fileName.endsWith('.java'));
        const javaFileNames = javaFiles.map(f => f.fileName).join(' ');
        
        try {
          // Compile all solution files
          execSync(`cd "${tempDir}" && ${JAVAC_CMD} ${javaFileNames}`, { 
            timeout: 20000,
            stdio: ['pipe', 'pipe', 'pipe'],
            maxBuffer: 1 * 1024 * 1024
          });
        } catch (compileErr) {
          // If compilation fails, stop immediately and return error
          return res.json({ 
            message: "Solution Compilation Failed", 
            error: compileErr.stderr?.toString() || compileErr.message,
            results: []
          });
        }
      }

      // 5. Run Test Cases
      for (const testCase of testCases) {
        let testPassed = false;
        let errorMessage = "";
        let output = "";

        try {
          if (fileExt === '.java') {
            const uniqueId = Date.now() + Math.random().toString().replace('.', '');
            const testClassName = `Test${uniqueId}`;
            
            // Generate Test Harness
            const testCode = `public class ${testClassName} {
              public static void main(String[] args) {
                try {
                  ${transformJUnitStyle(testCase.testCode)}
                  System.out.println("PASS");
                } catch (AssertionError e) {
                  System.out.println("FAIL: " + e.getMessage());
                } catch (Exception e) {
                  System.out.println("FAIL: " + e.getMessage());
                  e.printStackTrace();
                }
              }
            }`;
            
            fs.writeFileSync(path.join(tempDir, `${testClassName}.java`), testCode);

            // Compile and Run only the harness (linking to pre-compiled solution)
            output = execSync(`cd "${tempDir}" && ${JAVAC_CMD} ${testClassName}.java && ${JAVA_CMD} ${testClassName}`, { 
              timeout: 20000,
              encoding: 'utf-8',
              stdio: ['pipe', 'pipe', 'pipe'],
              maxBuffer: 1 * 1024 * 1024
            }).trim();
            
            testPassed = output.includes("PASS");

          } else if (fileExt === '.py') {
             const uniqueId = Date.now();
             const testFileName = `test${uniqueId}.py`;
             const testCode = `try:\n    ${testCase.testCode.replace(/\n/g, '\\n')}\n    print("PASS")\nexcept AssertionError as e:\n    print("FAIL: " + str(e))\nexcept Exception as e:\n    print("FAIL: " + str(e))\n`;
             fs.writeFileSync(path.join(tempDir, testFileName), testCode);
             
             output = execSync(`cd "${tempDir}" && python ${testFileName}`, { 
               timeout: 20000, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 5 * 1024 * 1024
             }).trim();
             testPassed = output.includes("PASS");

          } else if (fileExt === '.js') {
             const uniqueId = Date.now();
             const testFileName = `test${uniqueId}.js`;
             const testCode = `try {\n    ${testCase.testCode.replace(/\n/g, '\\n')}\n    console.log("PASS");\n} catch (e) {\n    console.log("FAIL: " + e.message);\n}\n`;
             fs.writeFileSync(path.join(tempDir, testFileName), testCode);
             
             output = execSync(`cd "${tempDir}" && node ${testFileName}`, { 
               timeout: 20000, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'], maxBuffer: 5 * 1024 * 1024
             }).trim();
             testPassed = output.includes("PASS");
          }
        } catch (execError) {
          testPassed = false;
          errorMessage = execError.stderr?.toString() || execError.message || "Execution error";
        }

        if (testPassed) passCount++;

        results.push({
          testName: testCase.testName,
          passed: testPassed,
          errorMessage: testPassed ? null : errorMessage,
          marks: testCase.marks
        });
      }

      res.json({
        message: "Tests completed",
        results,
        passCount,
        totalCount: testCases.length
      });

    } finally {
      if (fs.existsSync(tempDir)) safeDeletedir(tempDir);
    }
  } catch (error) {
    console.error("Error running grader tests:", error);
    res.status(500).json({ message: "Error running tests: " + error.message });
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