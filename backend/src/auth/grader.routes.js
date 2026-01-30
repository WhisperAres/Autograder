const express = require("express");
const checkRole = require("../middlewares/role.middleware");
const verify = require("../middlewares/verify.middleware");
const graderController = require("./grader.controller");

const router = express.Router();

// All grader routes are protected and require grader role
router.use(verify, checkRole("grader"));

// Submission viewing
router.get("/submissions", graderController.getAllSubmissions);
router.get("/submissions/:submissionId", graderController.getSubmissionForGrading);
router.get("/submissions/:submissionId/code", graderController.getSubmissionCode);
router.get("/submissions/:submissionId/feedback", graderController.getSubmissionFeedback);

// Test case running
router.post("/submissions/:submissionId/run-tests", graderController.runTestCases);

// Feedback provision
router.post("/submissions/:submissionId/feedback", graderController.provideFeedback);

// Submission status management
router.patch("/submissions/:submissionId/status", graderController.updateSubmissionStatus);

module.exports = router;
