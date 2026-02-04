// PostgreSQL Database Configuration
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Get password - use 'postgres' as default if not set
const dbPassword = process.env.DB_PASSWORD || 'postgres';

// Create connection to PostgreSQL
const sequelize = new Sequelize(
  process.env.DB_NAME || 'autograder_db',
  process.env.DB_USER || 'postgres',
  dbPassword,
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false, // Set to console.log to debug SQL queries
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Test the connection
sequelize.authenticate()
  .then(() => {
    console.log('✅ PostgreSQL Connected Successfully');
  })
  .catch(err => {
    console.error('❌ PostgreSQL Connection Error:', err.message);
  });

module.exports = sequelize;
