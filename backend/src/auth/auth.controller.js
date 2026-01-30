const jwt = require("jsonwebtoken");

const users = [
  // Students
  { id: 1, email: "student@uni.edu", password: "password", role: "student", name: "John Student" },
  { id: 2, email: "alice@uni.edu", password: "password", role: "student", name: "Alice Smith" },
  { id: 3, email: "bob@uni.edu", password: "password", role: "student", name: "Bob Johnson" },
  
  // Graders (Professors, Lecturers, TAs)
  { id: 101, email: "prof@uni.edu", password: "password", role: "grader", name: "Dr. Professor", title: "Professor" },
  { id: 102, email: "lecturer@uni.edu", password: "password", role: "grader", name: "Ms. Lecturer", title: "Lecturer" },
  { id: 103, email: "ta@uni.edu", password: "password", role: "grader", name: "Mr. TA", title: "Teaching Assistant" },
  
  // Admin
  { id: 201, email: "admin@uni.edu", password: "password", role: "admin", name: "Admin User" },
];

exports.login = (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const user = users.find((u) => u.email === email);
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Simple plain text password check for MVP
    if (user.password !== password) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role, name: user.name },
      "SECRET_KEY",
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Login error" });
  }
};

// Get all users (for admin)
exports.getAllUsers = (req, res) => {
  const userList = users.map(({ password, ...user }) => user);
  res.json(userList);
};

// Get users by role
exports.getUsersByRole = (req, res) => {
  const { role } = req.params;
  const userList = users
    .filter(u => u.role === role)
    .map(({ password, ...user }) => user);
  res.json(userList);
};