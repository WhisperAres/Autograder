const express = require("express");
const checkRole = require("../middlewares/role.middleware");
const verify = require("../middlewares/verify.middleware");
const adminController = require("./admin.controller");

const router = express.Router();

// All admin routes are protected and require admin role
router.use(verify, checkRole("admin"));

// Course management
router.get("/courses", adminController.listCourses);
router.get("/courses/:courseId", adminController.getCourse);
router.post("/courses", adminController.createNewCourse);
router.put("/courses/:courseId", adminController.editCourse);
router.delete("/courses/:courseId", adminController.removeCourse);

// Student enrollment
router.post("/courses/:courseId/enroll", adminController.enrollStudentToCourse);
router.get("/courses/:courseId/students", adminController.getEnrolledStudentsList);

// Grader assignment
router.post("/courses/:courseId/assign-grader", adminController.assignGrader);
router.get("/courses/:courseId/graders", adminController.getAssignedGraders);
router.delete("/courses/:courseId/graders/:graderId", adminController.unassignGrader);

// Dashboard statistics
router.get("/dashboard/stats", adminController.getDashboardStats);

module.exports = router;
