// Mock data for feedback on submissions
let feedbacks = [];
let nextFeedbackId = 1;

// Mock data for test case results
let testResults = [];

exports.addFeedback = (submissionId, graderId, feedback, marks) => {
  const newFeedback = {
    id: nextFeedbackId++,
    submissionId,
    graderId,
    feedback,
    marks,
    createdAt: new Date(),
  };
  feedbacks.push(newFeedback);
  return newFeedback;
};

exports.getFeedbackBySubmission = (submissionId) => {
  return feedbacks.filter(f => f.submissionId === submissionId);
};

exports.getAllFeedbacks = () => {
  return feedbacks;
};

exports.addTestResult = (submissionId, testName, passed, output) => {
  const result = {
    submissionId,
    testName,
    passed,
    output,
    createdAt: new Date(),
  };
  testResults.push(result);
  return result;
};

exports.getTestResultsBySubmission = (submissionId) => {
  return testResults.filter(t => t.submissionId === submissionId);
};

exports.clearTestResults = (submissionId) => {
  testResults = testResults.filter(t => t.submissionId !== submissionId);
};
