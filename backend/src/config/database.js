// PostgreSQL Database Configuration
const { Sequelize } = require('sequelize');
require('dotenv').config();

const dbPassword = process.env.DB_PASSWORD || 'postgres';

const sequelize = new Sequelize(
  process.env.DB_NAME || 'autograder_db',
  process.env.DB_USER || 'postgres',
  dbPassword,
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false 
      } : false
    },
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// ... keep your authentication test code below ...
sequelize.authenticate()
  .then(() => console.log('✅ PostgreSQL Connected Successfully'))
  .catch(err => console.error('❌ PostgreSQL Connection Error:', err.message));

module.exports = sequelize;