const express = require("express");
const cors = require("cors");
const path = require("path");
const authRoutes = require("./auth/auth.routes");
const assignmentRoutes = require("./auth/assignments.routes");
const submissionRoutes = require("./auth/submissions.routes");
const graderRoutes = require("./auth/grader.routes");
const adminRoutes = require("./auth/admin.routes");
const adminPagesRoutes = require("./auth/admin-pages.routes");
const graderPagesRoutes = require("./auth/grader-pages.routes");
const studentPagesRoutes = require("./auth/student-pages.routes");
const verifyToken = require("./middlewares/verify.middleware");

const User = require("./models/user");
const Assignment = require("./models/assignment");
const Submission = require("./models/submission");
const CodeFile = require("./models/codeFile");
const TestCase = require("./models/testCase");
const TestResult = require("./models/testResult");
const GraderSolution = require("./models/graderSolution");
const GraderSolutionFile = require("./models/graderSolutionFile");

const app = express();

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

app.use("/api/auth", authRoutes);
app.use("/api/assignments", verifyToken, assignmentRoutes);
app.use("/api/submissions", verifyToken, submissionRoutes);
app.use("/api/grader", graderRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/admin/page", verifyToken, adminPagesRoutes);
app.use("/api/grader/page", verifyToken, graderPagesRoutes);
app.use("/api/student/page", verifyToken, studentPagesRoutes);

// --- SERVE REACT FRONTEND ---
// Serve static files from the React app build directory
app.use(express.static(path.join(__dirname, "../../frontend/dist")));

// The "catch-all" handler: for any request that doesn't
// match one above, send back React's index.html file.
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/dist", "index.html"));
});

// --- TEMPORARY MAGIC ADMIN ROUTE ---
// TODO: Remove this block after you have created your user!
const User = require('./models/user');
const bcrypt = require('bcryptjs');

app.get('/magic-create-admin', async (req, res) => {
  try {
    // 1. Check if user already exists
    const existing = await User.findOne({ where: { email: 'admin@uni.edu' } });
    if (existing) return res.send("User 'admin@uni.edu' already exists!");

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // 3. Create the user
    const user = await User.create({
      email: 'f20220490@goa.bits-pilani.ac.in',
      name: 'Khush Jain',
      role: 'admin',
      password: hashedPassword
    });

    res.send(`
      <h1>🎉 Success!</h1>
      <p>Admin user created successfully.</p>
      <ul>
        <li><strong>Email:</strong> admin@uni.edu</li>
        <li><strong>Password:</strong> admin123</li>
      </ul>
      <p>You can now go to your frontend and login.</p>
    `);
  } catch (error) {
    res.status(500).send(`<h1>❌ Error</h1><p>${error.message}</p>`);
  }
});
// -----------------------------------

module.exports = app;