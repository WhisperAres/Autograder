// backend/src/config/database.js
const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

if (process.env.DATABASE_URL) {
  // Production: Use the connection string provided by Render/Supabase
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false // Required for Render/Supabase
      }
    }
  });
} else {
  // Local Development: Use individual variables
  sequelize = new Sequelize(
    process.env.DB_NAME || 'autograder_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: false,
    }
  );
}

// Test the connection
sequelize.authenticate()
  .then(() => console.log('✅ PostgreSQL Connected Successfully'))
  .catch(err => console.error('❌ PostgreSQL Connection Error:', err.message));

module.exports = sequelize;