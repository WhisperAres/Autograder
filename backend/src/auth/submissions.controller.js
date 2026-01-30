const {
  getSubmissionsByStudentId,
  getSubmissionById,
  getSubmissionsByAssignmentAndStudent,
  getFileById,
  getTestResults,
  addSubmission,
  addFileToSubmission,
  addTestResults,
  updateSubmissionViewTestResults,
  deleteFileFromSubmission,
} = require("../models/submissions");

exports.uploadSubmission = (req, res) => {
  try {
    const { assignmentId } = req.body;
    const studentId = req.user.id;
    const studentEmail = req.user.email;

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    if (!assignmentId) {
      return res.status(400).json({ message: "Assignment ID required" });
    }

    let fileContent;
    try {
      fileContent = req.file.buffer.toString("utf-8");
    } catch (err) {
      // Fallback for binary files
      fileContent = req.file.buffer.toString("binary");
    }

    // Check if a submission already exists for this assignment and student
    let submission = getSubmissionsByAssignmentAndStudent(assignmentId, studentId);

    if (!submission) {
      // Create a new submission with the first file
      submission = addSubmission({
        studentId,
        studentEmail,
        assignmentId: parseInt(assignmentId),
        files: [
          {
            fileName: req.file.originalname,
            fileContent: fileContent,
            uploadedAt: new Date().toISOString(),
          },
        ],
      });
    } else {
      // Add file to existing submission
      addFileToSubmission(submission.id, {
        fileName: req.file.originalname,
        fileContent: fileContent,
        uploadedAt: new Date().toISOString(),
      });
      // Get the updated submission with the new file
      submission = getSubmissionById(submission.id);
    }

    // Return submission without the large fileContent
    const submissionToReturn = {
      id: submission.id,
      assignmentId: submission.assignmentId,
      studentId: submission.studentId,
      studentEmail: submission.studentEmail,
      files: submission.files.map((f) => ({
        id: f.id,
        fileName: f.fileName,
        uploadedAt: f.uploadedAt,
      })),
      marks: submission.marks,
      totalMarks: submission.totalMarks,
      status: submission.status,
      viewTestResults: submission.viewTestResults,
    };

    res.json({
      message: "File uploaded successfully",
      submission: submissionToReturn,
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Error uploading submission" });
  }
};

exports.getStudentSubmissions = (req, res) => {
  try {
    const studentId = req.user.id;
    const submissions = getSubmissionsByStudentId(studentId);
    
    // Return submissions without large fileContent
    const submissionsToReturn = submissions.map((submission) => ({
      id: submission.id,
      assignmentId: submission.assignmentId,
      studentId: submission.studentId,
      studentEmail: submission.studentEmail,
      files: submission.files.map((f) => ({
        id: f.id,
        fileName: f.fileName,
        uploadedAt: f.uploadedAt,
      })),
      marks: submission.marks,
      totalMarks: submission.totalMarks,
      status: submission.status,
      viewTestResults: submission.viewTestResults,
    }));

    res.json(submissionsToReturn);
  } catch (error) {
    res.status(500).json({ message: "Error fetching submissions" });
  }
};

exports.getSubmissionResults = (req, res) => {
  try {
    const { submissionId } = req.params;
    const submission = getSubmissionById(submissionId);

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Verify ownership
    if (submission.studentId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // Check if student is allowed to view test results
    if (!submission.viewTestResults) {
      return res.status(403).json({ message: "Test results not available yet" });
    }

    const testResults = getTestResults(submissionId);
    res.json({
      submission: {
        id: submission.id,
        assignmentId: submission.assignmentId,
        marks: submission.marks,
        totalMarks: submission.totalMarks,
        status: submission.status,
        files: submission.files.map((f) => ({
          id: f.id,
          fileName: f.fileName,
          uploadedAt: f.uploadedAt,
        })),
      },
      testResults,
    });
  } catch (error) {
    res.status(500).json({ message: "Error fetching results" });
  }
};

exports.getSubmissionCode = (req, res) => {
  try {
    const { submissionId, fileId } = req.params;
    const submission = getSubmissionById(submissionId);

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Verify ownership
    if (submission.studentId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const file = getFileById(submissionId, fileId);

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    if (!file.fileContent) {
      return res.status(404).json({ message: "File content not found" });
    }

    res.json({
      fileName: file.fileName,
      fileContent: file.fileContent,
    });
  } catch (error) {
    console.error("Error fetching code:", error);
    res.status(500).json({ message: "Error fetching code" });
  }
};

exports.deleteSubmissionFile = (req, res) => {
  try {
    const { submissionId, fileId } = req.params;
    const submission = getSubmissionById(submissionId);

    if (!submission) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Verify ownership
    if (submission.studentId !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    const deleted = deleteFileFromSubmission(submissionId, fileId);

    if (!deleted) {
      return res.status(404).json({ message: "File not found" });
    }

    // Return updated submission without fileContent
    const updatedSubmission = getSubmissionById(submissionId);
    const submissionToReturn = {
      id: updatedSubmission.id,
      assignmentId: updatedSubmission.assignmentId,
      studentId: updatedSubmission.studentId,
      studentEmail: updatedSubmission.studentEmail,
      files: updatedSubmission.files.map((f) => ({
        id: f.id,
        fileName: f.fileName,
        uploadedAt: f.uploadedAt,
      })),
      marks: updatedSubmission.marks,
      totalMarks: updatedSubmission.totalMarks,
      status: updatedSubmission.status,
      viewTestResults: updatedSubmission.viewTestResults,
    };

    res.json({
      message: "File deleted successfully",
      submission: submissionToReturn,
    });
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ message: "Error deleting file" });
  }
};
