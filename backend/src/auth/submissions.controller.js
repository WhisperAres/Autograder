const Submission = require('../models/submission');
const CodeFile = require('../models/codeFile');
const Assignment = require('../models/assignment');
const FileService = require('../services/fileService');

exports.uploadSubmission = async (req, res) => {
  try {
    const assignmentId = req.params.assignmentId;
    console.log("Params:", req.params);
console.log("Body:", req.body);

    const studentId = req.user.id;
    const studentEmail = req.user.email;

    console.log('Request body:', req.body);

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!assignmentId) {
      return res.status(400).json({ message: 'Assignment ID required' });
    }

    // Get assignment to check due date and fetch totalMarks
    const assignment = await Assignment.findByPk(parseInt(assignmentId));
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }

    // Check if submission is past due date
    const now = new Date();
    const dueDate = new Date(assignment.dueDate);
    if (now > dueDate) {
      return res.status(403).json({ 
        message: `Submission closed. Due date was ${dueDate.toLocaleString()}`,
        isLate: true
      });
    }

    let fileContent;
    try {
      fileContent = req.file.buffer.toString('utf-8');
    } catch (err) {
      fileContent = req.file.buffer.toString('binary');
    }

    // Check if submission exists
    let submission = await Submission.findOne({
      where: {
        studentId,
        assignmentId: parseInt(assignmentId),
      },
    });

    if (!submission) {
      // Create new submission with assignment's totalMarks
      submission = await Submission.create({
        studentId,
        studentEmail,
        assignmentId: parseInt(assignmentId),
        marks: 0,
        totalMarks: assignment.totalMarks,
        status: 'pending',
        viewTestResults: false,
        submittedAt: new Date(),
      });
    } else {
      // Update submission time
      submission.submittedAt = new Date();
      await submission.save();
    }

    // Save code file to database
    await FileService.saveCodeFile(
      submission.id,
      req.file.originalname,
      fileContent
    );

    // Fetch all files for this submission
    const files = await CodeFile.findAll({
      where: { submissionId: submission.id },
      attributes: ['id', 'fileName', 'uploadedAt'],
    });

    res.json({
      message: 'File uploaded successfully',
      submission: {
        id: submission.id,
        assignmentId: submission.assignmentId,
        studentId: submission.studentId,
        studentEmail: submission.studentEmail,
        files: files,
        marks: submission.marks,
        totalMarks: submission.totalMarks,
        status: submission.status,
        viewTestResults: submission.viewTestResults,
        submittedAt: submission.submittedAt,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Error uploading submission' });
  }
};

exports.getStudentSubmissions = async (req, res) => {
  try {
    const studentId = req.user.id;

    // Fetch submissions for this student
    const submissions = await Submission.findAll({
      where: { studentId },
    });

    // For each submission, fetch all files
    const submissionsWithFiles = await Promise.all(
      submissions.map(async (submission) => {
        const files = await CodeFile.findAll({
          where: { submissionId: submission.id },
          attributes: ['id', 'fileName'],
        });

        return {
          id: submission.id,
          assignmentId: submission.assignmentId,
          studentId: submission.studentId,
          studentEmail: submission.studentEmail,
          files: files,
          marks: submission.marks,
          totalMarks: submission.totalMarks,
          status: submission.status,
          viewMarks: submission.viewMarks,
        };
      })
    );

    res.json(submissionsWithFiles);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ message: 'Error fetching submissions' });
  }
};

exports.getSubmissionCode = async (req, res) => {
  try {
    const { submissionId, fileId } = req.params;

    // Verify submission exists and belongs to user
    const submission = await Submission.findByPk(submissionId);
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Verify ownership
    if (submission.studentId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Fetch file with content from database
    const file = await FileService.getFileWithContent(fileId);
    if (!file) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.json({
      fileName: file.fileName,
      fileContent: file.fileContent,
    });
  } catch (error) {
    console.error('Error fetching code:', error);
    res.status(500).json({ message: 'Error fetching code' });
  }
};

exports.getSubmissionResults = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const submission = await Submission.findByPk(submissionId);

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Verify ownership
    if (submission.studentId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Allow viewing if either test results or marks visibility is enabled,
    // or if the assignment-level canViewMarks is enabled
    const assignment = await Assignment.findByPk(submission.assignmentId);
    const allowed = submission.viewTestResults || submission.viewMarks || (assignment && assignment.canViewMarks);
    if (!allowed) {
      return res.status(403).json({ message: 'Test results not available yet' });
    }

    // Fetch test results joined with test case names
    const TestResult = require('../models/testResult');
    const TestCase = require('../models/testCase');

    const results = await TestResult.findAll({
      where: { submissionId },
      include: [{ model: TestCase, as: 'testCase', attributes: ['id', 'testName'] }],
      order: [['id', 'ASC']]
    });

    const files = await CodeFile.findAll({
      where: { submissionId },
      attributes: ['id', 'fileName'],
    });

    // Map to simple structure for frontend
    const mapped = results.map(r => ({
      id: r.id,
      testCaseId: r.testCaseId,
      testName: r.testCase ? r.testCase.testName : `Test ${r.testCaseId}`,
      passed: Boolean(r.passed),
    }));

    res.json({
      submission: {
        id: submission.id,
        assignmentId: submission.assignmentId,
        marks: submission.marks,
        totalMarks: submission.totalMarks,
        status: submission.status,
        files: files,
      },
      testResults: mapped,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching results' });
  }
};

exports.deleteSubmissionFile = async (req, res) => {
  try {
    const { submissionId, fileId } = req.params;
    const submission = await Submission.findByPk(submissionId);

    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' });
    }

    // Verify ownership
    if (submission.studentId !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Delete file from database
    const deleted = await FileService.deleteCodeFile(fileId);
    if (!deleted) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Fetch remaining files
    const remainingFiles = await CodeFile.findAll({
      where: { submissionId },
      attributes: ['id', 'fileName'],
    });

    res.json({
      message: 'File deleted successfully',
      submission: {
        id: submission.id,
        assignmentId: submission.assignmentId,
        studentId: submission.studentId,
        studentEmail: submission.studentEmail,
        files: remainingFiles,
        marks: submission.marks,
        totalMarks: submission.totalMarks,
        status: submission.status,
        viewTestResults: submission.viewTestResults,
      },
    });
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Error deleting file' });
  }
};
