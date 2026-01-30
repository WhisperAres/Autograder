const { 
  addFeedback, 
  getFeedbackBySubmission, 
  addTestResult, 
  getTestResultsBySubmission,
  clearTestResults 
} = require("../models/grader");
const { getSubmissionById, updateSubmissionStatus, updateSubmissionMarks } = require("../models/submissions");

// Get all submissions
exports.getAllSubmissions = (req, res) => {
  try {
    const submissionsModel = require("../models/submissions");
    const allSubmissions = submissionsModel.getAllSubmissions();
    res.json(allSubmissions);
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ message: "Error fetching submissions" });
  }
};

// Get submissions for a specific assignment
exports.getSubmissionsByAssignment = (req, res) => {
  try {
    const { assignmentId } = req.params;
    // This would filter submissions by assignment in a real database
    res.json({ message: "Submissions for assignment " + assignmentId });
  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ message: "Error fetching submissions" });
  }
};

// Run test cases on a submission
exports.runTestCases = (req, res) => {
  try {
    const { submissionId } = req.params;
    const { testCases } = req.body;

    const submission = getSubmissionById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Simulate running tests
    const results = [];
    if (testCases && Array.isArray(testCases)) {
      testCases.forEach(test => {
        const passed = Math.random() > 0.3; // 70% pass rate for demo
        const result = addTestResult(
          submissionId,
          test.name,
          passed,
          passed ? "Test passed ✓" : `Test failed: ${test.expected}`
        );
        results.push(result);
      });
    }

    // Update submission status to evaluated
    updateSubmissionStatus(submissionId, "evaluated");

    res.json({ 
      message: "Test cases executed",
      results,
      submissionId 
    });
  } catch (error) {
    console.error("Error running tests:", error);
    res.status(500).json({ message: "Error running tests" });
  }
};

// Provide feedback on a submission
exports.provideFeedback = (req, res) => {
  try {
    const { submissionId } = req.params;
    const { feedback, marks } = req.body;
    const graderId = req.user.id;

    if (!feedback || marks === undefined) {
      return res.status(400).json({ message: "Feedback and marks required" });
    }

    const submission = getSubmissionById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Add feedback
    const feedbackRecord = addFeedback(submissionId, graderId, feedback, marks);

    // Update submission marks and status
    updateSubmissionMarks(submissionId, marks);
    updateSubmissionStatus(submissionId, "graded");

    res.json({
      message: "Feedback provided successfully",
      feedback: feedbackRecord,
    });
  } catch (error) {
    console.error("Error providing feedback:", error);
    res.status(500).json({ message: "Error providing feedback" });
  }
};

// Get feedback for a submission
exports.getSubmissionFeedback = (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = getSubmissionById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const feedbackList = getFeedbackBySubmission(submissionId);
    const testResults = getTestResultsBySubmission(submissionId);

    res.json({
      submission,
      feedback: feedbackList,
      testResults,
    });
  } catch (error) {
    console.error("Error fetching feedback:", error);
    res.status(500).json({ message: "Error fetching feedback" });
  }
};

// Get submission details for grading
exports.getSubmissionForGrading = (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = getSubmissionById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    const feedbackList = getFeedbackBySubmission(submissionId);
    const testResults = getTestResultsBySubmission(submissionId);

    res.json({
      submission,
      feedback: feedbackList,
      testResults,
    });
  } catch (error) {
    console.error("Error fetching submission:", error);
    res.status(500).json({ message: "Error fetching submission" });
  }
};

// Get submission code
exports.getSubmissionCode = (req, res) => {
  try {
    const { submissionId } = req.params;

    const submission = getSubmissionById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    if (!submission.fileContent) {
      return res.status(404).json({ message: "Code content not found" });
    }

    res.json({
      fileName: submission.fileName,
      fileContent: submission.fileContent,
      studentId: submission.studentId,
    });
  } catch (error) {
    console.error("Error fetching code:", error);
    res.status(500).json({ message: "Error fetching code" });
  }
};

// Update submission status
exports.updateSubmissionStatus = (req, res) => {
  try {
    const { submissionId } = req.params;
    const { status } = req.body;

    const submission = getSubmissionById(submissionId);
    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    updateSubmissionStatus(submissionId, status);

    res.json({
      message: "Submission status updated",
      submission: getSubmissionById(submissionId),
    });
  } catch (error) {
    console.error("Error updating submission:", error);
    res.status(500).json({ message: "Error updating submission" });
  }
};
