const express = require("express");
const cors = require("cors");
const authRoutes = require("./auth/auth.routes");
const assignmentRoutes = require("./auth/assignments.routes");
const submissionRoutes = require("./auth/submissions.routes");
const graderRoutes = require("./auth/grader.routes");
const adminRoutes = require("./auth/admin.routes");
const verifyToken = require("./middlewares/verify.middleware");

const app = express();

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