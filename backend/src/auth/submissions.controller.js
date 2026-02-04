const Submission = require('../models/submission');
const CodeFile = require('../models/codeFile');
const FileService = require('../services/fileService');

exports.uploadSubmission = async (req, res) => {
  try {
    const { assignmentId } = req.body;
    const studentId = req.user.id;
    const studentEmail = req.user.email;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    if (!assignmentId) {
      return res.status(400).json({ message: 'Assignment ID required' });
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
      // Create new submission
      submission = await Submission.create({
        studentId,
        studentEmail,
        assignmentId: parseInt(assignmentId),
        marks: 0,
        totalMarks: 100,
        status: 'pending',
        viewTestResults: false,
      });
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
      attributes: ['id', 'fileName'],
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
          viewTestResults: submission.viewTestResults,
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

    // Check if student is allowed to view test results
    if (!submission.viewTestResults) {
      return res.status(403).json({ message: 'Test results not available yet' });
    }

    // Fetch files for submission
    const files = await CodeFile.findAll({
      where: { submissionId },
      attributes: ['id', 'fileName'],
    });

    res.json({
      submission: {
        id: submission.id,
        assignmentId: submission.assignmentId,
        marks: submission.marks,
        totalMarks: submission.totalMarks,
        status: submission.status,
        files: files,
      },
      testResults: [],
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
