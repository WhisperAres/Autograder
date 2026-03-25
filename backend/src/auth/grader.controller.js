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
const https = require("https");

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

const JUNIT_LIB_DIR = path.join(__dirname, '../../lib');
const JUNIT_JARS = [
  {
    name: 'junit-4.13.2.jar',
    url: 'https://repo1.maven.org/maven2/junit/junit/4.13.2/junit-4.13.2.jar'
  },
  {
    name: 'hamcrest-core-1.3.jar',
    url: 'https://repo1.maven.org/maven2/org/hamcrest/hamcrest-core/1.3/hamcrest-core-1.3.jar'
  }
];

const downloadFile = (url, dest) => {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to download ${url}, status ${res.statusCode}`));
      }
      res.pipe(file);
      file.on('finish', () => file.close(resolve));
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
};

const ensureJUnitJars = async () => {
  if (!fs.existsSync(JUNIT_LIB_DIR)) {
    fs.mkdirSync(JUNIT_LIB_DIR, { recursive: true });
  }

  for (const jar of JUNIT_JARS) {
    const jarPath = path.join(JUNIT_LIB_DIR, jar.name);
    if (!fs.existsSync(jarPath)) {
      console.log(`[grader] Downloading ${jar.name} from Maven central`);
      await downloadFile(jar.url, jarPath);
      console.log(`[grader] Download complete: ${jarPath}`);
    }
  }
};

const getJavaClasspath = (tempDir) => {
  const cpItems = [tempDir];

  for (const jar of JUNIT_JARS) {
    const jarPath = path.join(JUNIT_LIB_DIR, jar.name);
    if (fs.existsSync(jarPath)) {
      cpItems.push(jarPath);
    }
  }

  if (process.env.JUNIT_CLASSPATH) {
    cpItems.push(process.env.JUNIT_CLASSPATH);
  }

  return cpItems.join(path.delimiter);
};

// Remove JUnit imports from submitted code if junit libs are not available
const sanitizeJavaSource = (source) => {
  if (typeof source !== 'string') return source;
  return source
    .split(/\r?\n/)
    .filter(line => !line.trim().startsWith('import org.junit.') && !line.trim().startsWith('import static org.junit.'))
    .join('\n');
};

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

  const keywords = ['assertTrue', 'assertFalse', 'assertEquals', 'assertNotNull', 'assertNull'];
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
        } else if (kw === 'assertNull') {
          replacement = `if (${argsStr} != null) throw new AssertionError("assertNull failed");`;
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

// Helper to generate class field declarations from uploaded Java files and test code object assignments
const generateFieldDeclarations = (javaFiles, testCode = '') => {
  const fieldMap = new Map();

  if (Array.isArray(javaFiles)) {
    for (const file of javaFiles) {
      const className = file.fileName.replace('.java', '');
      const fieldName = className.toLowerCase();
      fieldMap.set(fieldName, className);
    }
  }

  if (typeof testCode === 'string' && testCode.trim() !== '') {
    const assignmentRegex = /(?:^|[;\n\r\t ])([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*new\s+([A-Z][a-zA-Z0-9_]*)(?:\s*<[^>]*>)?\s*\(/g;
    let m;
    while ((m = assignmentRegex.exec(testCode)) !== null) {
      const varName = m[1];
      const className = m[2];
      if (!fieldMap.has(varName)) {
        fieldMap.set(varName, className);
      }
    }
  }

  return [...fieldMap.entries()]
    .map(([fieldName, className]) => `  public static ${className} ${fieldName};`)
    .join('\n');
};

// Extract import lines from submitted test code and return the body without imports
const extractImportsFromTestCode = (code) => {
  if (!code || typeof code !== 'string') return { imports: '', body: '' };
  const imports = [];
  const bodyLines = [];
  const lines = code.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('import ')) {
      imports.push(trimmed);
    } else if (trimmed.startsWith('package ')) {
      // ignore package statements in snippet
    } else {
      bodyLines.push(line);
    }
  }
  const uniqueImports = [...new Set(imports)];
  return { imports: uniqueImports.join('\n'), body: bodyLines.join('\n').trim() };
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

    const codeFiles = submission.codeFiles;
    const javaFiles = codeFiles.filter(f => f.fileName.endsWith(".java"));
    
    console.log("[grader.runTestCases] Submission:", submissionId);
    console.log("[grader.runTestCases] Total codeFiles:", codeFiles.length, "Files:", codeFiles.map(f => f.fileName));
    console.log("[grader.runTestCases] Filtered javaFiles:", javaFiles.length, "Files:", javaFiles.map(f => f.fileName));
    if (javaFiles.length === 0) {
      return res.status(404).json({ message: "No Java files found in submission" });
    }

    const results = [];
    const tempDir = path.join(__dirname, "../../temp", `submission_${submissionId}_${Date.now()}`);
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    try {
      // Write student Java files
      for (const codeFile of javaFiles) {
        fs.writeFileSync(path.join(tempDir, codeFile.fileName), codeFile.fileContent, "utf8");
      }

      // [STEP 1] Ensure junit/hamcrest libs exist and compile all student Java files together
      try {
        await ensureJUnitJars();
        const javaFileNames = javaFiles.map(f => f.fileName).join(" ");
        const classpath = getJavaClasspath(tempDir);
        console.log("[grader] javac classpath:", classpath);
        execSync(`cd "${tempDir}" && ${JAVAC_CMD} -encoding UTF-8 -cp "${classpath}" ${javaFileNames}`, { 
          timeout: 20000, 
          stdio: ['pipe', 'pipe', 'pipe'],
          maxBuffer: 5 * 1024 * 1024
        });
      } catch (compileErr) {
        const errorMsg = compileErr.stderr ? compileErr.stderr.toString() : compileErr.message;
        return res.json({ 
          message: "Compilation failed", 
          error: errorMsg,
          results: [],
          submissionId
        });
      }

      // [STEP 2] Run each test case individually
      for (const testCase of testCases) {
        let passed = false;
        let actualOutput = "";
        let errorMessage = "";

        try {
          const uniqueId = Date.now() + Math.random().toString().replace('.', '');
          const testClassName = `Test${uniqueId}`;
          const { imports, body } = extractImportsFromTestCode(testCase.testCode);
          console.log("[grader.runTestCases] Generating test for:", testCase.testName, "javaFiles:", javaFiles.map(f => f.fileName));
          const fieldDecls = generateFieldDeclarations(javaFiles, body);
          console.log("[grader.runTestCases] fieldDecls:", fieldDecls);
          const testBody = transformJUnitStyle(body);
          const testCode = `${imports ? imports + '\n\n' : ''}public class ${testClassName} {
${fieldDecls}
  public static void main(String[] args) {
    try {
      ${testBody}
      System.out.println("PASS");
    } catch (AssertionError e) {
      System.out.println("FAIL: " + e.getMessage());
    } catch (Exception e) {
      System.out.println("FAIL: " + e.getMessage());
    }
  }
}`;
          
          console.log("Generated test code for", testCase.testName, ":\n", testCode);
          fs.writeFileSync(path.join(tempDir, `${testClassName}.java`), testCode);

          // Compile and run the harness
          const classpath = getJavaClasspath(tempDir);
          console.log("[grader] test compile classpath:", classpath);
          const cmd = `cd "${tempDir}" && ${JAVAC_CMD} -encoding UTF-8 -cp "${classpath}" ${testClassName}.java && ${JAVA_CMD} -cp "${classpath}" ${testClassName}`;
          console.log("[grader] running command:", cmd);
          actualOutput = execSync(cmd, {
            encoding: "utf8",
            stdio: ["pipe", "pipe", "pipe"],
            timeout: 20000,
            maxBuffer: 5 * 1024 * 1024
          }).trim();

          passed = actualOutput.includes("PASS");
        } catch (execError) {
          errorMessage = execError.stderr ? execError.stderr.toString() : execError.message;
          passed = false;
        }

        results.push({
          testName: testCase.testName,
          passed,
          actualOutput,
          expectedOutput: testCase.expectedOutput,
          errorMessage: passed ? null : errorMessage,
          marks: testCase.marks
        });
      }

      // [STEP 3] Update Submission Marks
      let totalMarksEarned = 0;
      results.forEach((r) => { if (r.passed) totalMarksEarned += parseFloat(r.marks) || 0; });
      await submission.update({ marks: totalMarksEarned, status: "evaluated" });

      res.json({
        message: "Tests completed",
        results,
        submissionId,
        marksObtained: totalMarksEarned,
        passCount: results.filter(r => r.passed).length,
        totalCount: results.length
      });

    } finally {
      if (fs.existsSync(tempDir)) safeDeletedir(tempDir);
    }
  } catch (error) {
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
          execSync(`cd "${tempDir}" && ${JAVAC_CMD} -encoding UTF-8 ${javaFileNames}`, { 
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
            output = execSync(`cd "${tempDir}" && ${JAVAC_CMD} -encoding UTF-8 ${testClassName}.java && ${JAVA_CMD} ${testClassName}`, { 
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
