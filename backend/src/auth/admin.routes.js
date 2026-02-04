const express = require("express");
const checkRole = require("../middlewares/role.middleware");
const verify = require("../middlewares/verify.middleware");
const adminController = require("./admin.controller");

const router = express.Router();

// Verify token for all routes
router.use(verify);

// ==================== USER MANAGEMENT ====================
router.get("/users", checkRole("admin"), adminController.getAllUsers);
router.post("/users", checkRole("admin"), adminController.createUser);
router.get("/users/role/:role", checkRole("admin"), adminController.getUsersByRole);
router.patch("/users/:userId/role", checkRole("admin"), adminController.updateUserRole);

// ==================== ASSIGNMENT MANAGEMENT ====================
router.get("/assignments", checkRole("admin"), adminController.getAssignments);
router.post("/assignments", checkRole("admin"), adminController.createAssignment);
router.patch("/assignments/:assignmentId", checkRole("admin"), adminController.updateAssignment);
router.delete("/assignments/:assignmentId", checkRole("admin"), adminController.deleteAssignment);

// ==================== TEST CASE MANAGEMENT ====================
// Allow both admin and ta (graders) to manage test cases
router.get("/assignments/:assignmentId/test-cases", checkRole("admin", "ta"), adminController.getTestCases);
router.post("/assignments/:assignmentId/test-cases", checkRole("admin", "ta"), adminController.createTestCase);
router.patch("/test-cases/:testCaseId", checkRole("admin", "ta"), adminController.updateTestCase);
router.delete("/test-cases/:testCaseId", checkRole("admin", "ta"), adminController.deleteTestCase);

// ==================== GRADING & SUBMISSIONS ====================
router.get("/submissions", checkRole("admin"), adminController.getAllSubmissions);
router.get("/submissions/assignment/:assignmentId", checkRole("admin"), adminController.getSubmissionsByAssignment);
router.patch("/submissions/:submissionId/marks", checkRole("admin", "ta"), adminController.updateSubmissionMarks);
router.post("/submissions/:submissionId/run-tests", checkRole("admin", "ta"), adminController.runTestCases);

// ==================== REPORTING & DOWNLOADS ====================
router.get("/assignments/:assignmentId/marks-report", checkRole("admin"), adminController.getMarksReport);
router.get("/assignments/:assignmentId/export-csv", checkRole("admin"), adminController.downloadMarksCSV);

// ==================== DASHBOARD ====================
router.get("/stats", checkRole("admin"), adminController.getDashboardStats);

module.exports = router;
