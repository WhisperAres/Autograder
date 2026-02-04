// Submission Model - Track student submissions
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Submission = sequelize.define('Submission', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  studentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  studentEmail: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  assignmentId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  marks: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  totalMarks: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
  },
  status: {
    type: DataTypes.ENUM('pending', 'evaluated', 'graded'),
    defaultValue: 'pending',
  },
  viewTestResults: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'submissions',
  timestamps: false,
});

module.exports = Submission;
