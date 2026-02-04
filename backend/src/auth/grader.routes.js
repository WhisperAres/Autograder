const express = require("express");
const checkRole = require("../middlewares/role.middleware");
const verify = require("../middlewares/verify.middleware");
const graderController = require("./grader.controller");

const router = express.Router();

// All grader routes are protected and require grader or ta role
router.use(verify, checkRole("grader", "ta"));

// Assignments
router.get("/assignments", graderController.getAssignments);

// Submission viewing
router.get("/submissions", graderController.getAllSubmissions);
router.get("/submissions/assignment/:assignmentId", graderController.getSubmissionsByAssignment);
router.get("/submissions/:submissionId", graderController.getSubmissionForGrading);
router.get("/submissions/:submissionId/code", graderController.getSubmissionCode);
router.get("/submissions/:submissionId/code/:fileId", graderController.getSubmissionCode);
router.get("/submissions/:submissionId/feedback", graderController.getSubmissionFeedback);

// Test case running
router.post("/submissions/:submissionId/run-tests", graderController.runTestCases);

// Feedback provision
router.post("/submissions/:submissionId/feedback", graderController.provideFeedback);

// Submission status management
router.patch("/submissions/:submissionId/status", graderController.updateSubmissionStatus);

module.exports = router;
