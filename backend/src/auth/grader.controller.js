const Submission = require("../models/submission");
const Assignment = require("../models/assignment");
const CodeFile = require("../models/codeFile");
const TestCase = require("../models/testCase");
const TestResult = require("../models/testResult");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

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
    res.json(submissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ message: "Error fetching submissions" });
  }
};

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

    // Fetch code files
    const codeFiles = await CodeFile.findAll({
      where: { submissionId }
    });

    if (codeFiles.length === 0) {
      return res.status(404).json({ message: "No code files found in submission" });
    }

    const results = [];
    const tempDir = path.join(__dirname, "../../temp", `submission_${submissionId}`);

    // Create temp directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    try {
      // Write code files to temp directory
      for (const codeFile of codeFiles) {
        const filePath = path.join(tempDir, codeFile.fileName);
        fs.writeFileSync(filePath, codeFile.fileContent, "utf8");
      }

      // Run each test case
      for (const testCase of testCases) {
        let passed = false;
        let actualOutput = "";
        let errorMessage = "";

        try {
          // Get the main code file (assuming first file or .java/.js file)
          const mainFile = codeFiles.find(f => 
            f.fileName.endsWith(".java") || f.fileName.endsWith(".js")
          ) || codeFiles[0];

          // Determine how to execute based on file type
          let command = "";
          if (mainFile.fileName.endsWith(".java")) {
            // For Java
            const className = mainFile.fileName.replace(".java", "");
            command = `cd "${tempDir}" && javac ${mainFile.fileName} && java ${className}`;
          } else if (mainFile.fileName.endsWith(".js")) {
            // For JavaScript/Node
            command = `cd "${tempDir}" && node ${mainFile.fileName}`;
          } else if (mainFile.fileName.endsWith(".py")) {
            // For Python
            command = `cd "${tempDir}" && python ${mainFile.fileName}`;
          }

          if (command) {
            // Execute with input and capture output
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

            // Compare output
            passed = actualOutput === testCase.expectedOutput.trim();
          }
        } catch (execError) {
          errorMessage = execError.message || "Execution failed";
          passed = false;
        }

        // Save test result to database
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

      // Update submission status to evaluated
      await submission.update({ status: "evaluated" });

      res.json({
        message: "Test cases executed",
        results,
        submissionId,
        passCount: results.filter(r => r.passed).length,
        totalCount: results.length
      });
    } finally {
      // Clean up temp directory
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
      marks: parseInt(marks),
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
