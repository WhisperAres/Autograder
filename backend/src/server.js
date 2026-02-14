require('dotenv').config();
const app = require("./app");
const sequelize = require("./config/database");

// Initialize database
const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connection established");

    // Sync models
    await sequelize.sync({ alter: true });
    console.log("✅ Database tables synchronized");

    // Start server
    const server = app.listen(5000, () => {
      console.log("✅ Server running on port 5000");
    });
    
    // Handle server errors
    server.on('error', (err) => {
      console.error('Server error:', err);
      process.exit(1);
    });
  } catch (error) {
    console.error("❌ Server initialization error:", error.message);
    console.error("Full error:", error);
  
    if (error.message.includes('password authentication failed')) {
      console.error("\n Troubleshooting:");
      console.error("   - Check your PostgreSQL is running");
      console.error("   - Verify DB_PASSWORD in .env file");
      console.error("   - Default credentials: user=postgres, password='' (empty)");
    }
    
    process.exit(1);
  }
};

startServer();
