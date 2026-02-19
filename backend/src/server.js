require('dotenv').config();
const express = require('express');
const path = require('path');
const app = require("./app");
const sequelize = require("./config/database");

const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

app.get('/*path', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Initialize database
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    await sequelize.sync();
    console.log("✅ Database tables synchronized");

    const PORT = process.env.PORT || 5000;
    const server = app.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
    });

    server.on('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Server initialization error:", error.message);
    console.error("\n⚠️  Database Connection Failed!");
    console.error("Make sure PostgreSQL is running with correct credentials in .env file:");
    console.error("  - DB_HOST=localhost");
    console.error("  - DB_PORT=5432");
    console.error("  - DB_USER=postgres");
    console.error("  - DB_PASSWORD=your_password");
    console.error("  - DB_NAME=autograder_db");
    console.error("\nOr set DATABASE_URL environment variable for production");
    process.exit(1);
  }
};

startServer();