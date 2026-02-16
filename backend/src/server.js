require('dotenv').config();
const express = require('express');
const path = require('path');
const app = require("./app");
const sequelize = require("./config/database");

const frontendPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendPath));

app.get('(.*)', (req, res) => {
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

    // Consider using { alter: false } in production to prevent accidental data loss
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
    process.exit(1);
  }
};

startServer();