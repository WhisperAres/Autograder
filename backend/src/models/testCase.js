// Test Case Model - Store test cases for assignments
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TestCase = sequelize.define('TestCase', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  assignmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  testName: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  testCode: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Test code with assertions (e.g., assertEquals, assertTrue)'
  },
  marks: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  isHidden: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'test_cases',
  timestamps: false,
});

module.exports = TestCase;
