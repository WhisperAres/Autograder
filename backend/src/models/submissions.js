// Mock database for submissions and results
// Each submission now has multiple files
const submissions = [
  {
    id: 1,
    studentId: 1,
    studentEmail: "student@uni.edu",
    assignmentId: 1,
    files: [
      {
        id: 1,
        fileName: "sum.js",
        fileContent: `function sum(a, b) {
  return a + b;
}

// Test cases:
// sum(2, 3) = 5
// sum(-1, 1) = 0
// sum(100, 200) = 300

module.exports = sum;`,
        uploadedAt: "2026-01-25T10:30:00Z",
      },
      {
        id: 2,
        fileName: "helper.js",
        fileContent: `// Helper functions for sum.js

function validateInputs(a, b) {
  return typeof a === 'number' && typeof b === 'number';
}

module.exports = { validateInputs };`,
        uploadedAt: "2026-01-25T10:35:00Z",
      },
    ],
    marks: 95,
    totalMarks: 100,
    status: "evaluated",
    viewTestResults: true,
  },
];

const testResults = {
  1: [
    { testCase: "Test 1: Add 2 + 3", expected: "5", actual: "5", passed: true },
    {
      testCase: "Test 2: Add -1 + 1",
      expected: "0",
      actual: "0",
      passed: true,
    },
    {
      testCase: "Test 3: Add 100 + 200",
      expected: "300",
      actual: "300",
      passed: true,
    },
    {
      testCase: "Test 4: Add 0.5 + 0.5",
      expected: "1",
      actual: "1",
      passed: true,
    },
    {
      testCase: "Test 5: Add -5 + -3",
      expected: "-8",
      actual: "-8",
      passed: false,
    },
  ],
};

module.exports = {
  getAllSubmissions: () => submissions,
  getSubmissionsByStudentId: (studentId) =>
    submissions.filter((s) => s.studentId === parseInt(studentId)),
  getSubmissionById: (id) => submissions.find((s) => s.id === parseInt(id)),
  getSubmissionsByAssignmentAndStudent: (assignmentId, studentId) =>
    submissions.find(
      (s) =>
        s.assignmentId === parseInt(assignmentId) &&
        s.studentId === parseInt(studentId)
    ),
  getFileById: (submissionId, fileId) => {
    const submission = submissions.find((s) => s.id === parseInt(submissionId));
    return submission
      ? submission.files.find((f) => f.id === parseInt(fileId))
      : null;
  },
  getTestResults: (submissionId) => testResults[submissionId] || [],
  addSubmission: (submission) => {
    const newId = Math.max(...submissions.map((s) => s.id), 0) + 1;
    const newSubmission = {
      id: newId,
      ...submission,
      files: submission.files || [],
      marks: 0,
      totalMarks: 100,
      status: "pending",
      viewTestResults: false,
    };
    submissions.push(newSubmission);
    return newSubmission;
  },
  addFileToSubmission: (submissionId, file) => {
    const submission = submissions.find((s) => s.id === parseInt(submissionId));
    if (submission) {
      const newFileId =
        Math.max(...submission.files.map((f) => f.id), 0) + 1;
      const newFile = {
        id: newFileId,
        ...file,
      };
      submission.files.push(newFile);
      return newFile;
    }
    return null;
  },
  addTestResults: (submissionId, results) => {
    testResults[submissionId] = results;
  },
  updateSubmissionStatus: (submissionId, status) => {
    const submission = submissions.find((s) => s.id === parseInt(submissionId));
    if (submission) {
      submission.status = status;
    }
    return submission;
  },
  updateSubmissionMarks: (submissionId, marks) => {
    const submission = submissions.find((s) => s.id === parseInt(submissionId));
    if (submission) {
      submission.marks = marks;
    }
    return submission;
  },
  updateSubmissionViewTestResults: (submissionId, canView) => {
    const submission = submissions.find((s) => s.id === parseInt(submissionId));
    if (submission) {
      submission.viewTestResults = canView;
    }
    return submission;
  },
  deleteFileFromSubmission: (submissionId, fileId) => {
    const submission = submissions.find((s) => s.id === parseInt(submissionId));
    if (submission) {
      const fileIndex = submission.files.findIndex((f) => f.id === parseInt(fileId));
      if (fileIndex > -1) {
        submission.files.splice(fileIndex, 1);
        return true;
      }
    }
    return false;
  },
};
