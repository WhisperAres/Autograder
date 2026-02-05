const express = require("express");
const cors = require("cors");
const authRoutes = require("./auth/auth.routes");
const assignmentRoutes = require("./auth/assignments.routes");
const submissionRoutes = require("./auth/submissions.routes");
const graderRoutes = require("./auth/grader.routes");
const adminRoutes = require("./auth/admin.routes");
const verifyToken = require("./middlewares/verify.middleware");

// Import all models for association setup
const User = require("./models/user");
const Assignment = require("./models/assignment");
const Submission = require("./models/submission");
const CodeFile = require("./models/codeFile");
const TestCase = require("./models/testCase");
const TestResult = require("./models/testResult");
const GraderSolution = require("./models/graderSolution");
const GraderSolutionFile = require("./models/graderSolutionFile");

const app = express();

// Setup model associations (must be done before routes are used)
Submission.belongsTo(Assignment, { foreignKey: 'assignmentId', as: 'assignment' });
Submission.belongsTo(User, { foreignKey: 'studentId', as: 'student' });
Submission.hasMany(CodeFile, { foreignKey: 'submissionId', as: 'codeFiles' });
Submission.hasMany(TestResult, { foreignKey: 'submissionId', as: 'testResults' });

CodeFile.belongsTo(Submission, { foreignKey: 'submissionId' });

TestCase.belongsTo(Assignment, { foreignKey: 'assignmentId' });
TestResult.belongsTo(Submission, { foreignKey: 'submissionId' });
TestResult.belongsTo(TestCase, { foreignKey: 'testCaseId', as: 'testCase' });

Assignment.hasMany(TestCase, { foreignKey: 'assignmentId', as: 'testCases' });
Assignment.hasMany(Submission, { foreignKey: 'assignmentId', as: 'submissions' });

// Grader Solution associations
GraderSolution.hasMany(GraderSolutionFile, { foreignKey: 'solutionId', as: 'files' });
GraderSolutionFile.belongsTo(GraderSolution, { foreignKey: 'solutionId' });
GraderSolution.belongsTo(Assignment, { foreignKey: 'assignmentId', as: 'assignment' });
GraderSolution.belongsTo(User, { foreignKey: 'graderId', as: 'grader' });
Assignment.hasMany(GraderSolution, { foreignKey: 'assignmentId', as: 'graderSolutions' });

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get("/", (req, res) => {
    res.send("Backend is running");
});

app.use("/auth", authRoutes);
app.use("/assignments", verifyToken, assignmentRoutes);
app.use("/submissions", verifyToken, submissionRoutes);
app.use("/grader", graderRoutes);
app.use("/admin", adminRoutes);

module.exports = app;