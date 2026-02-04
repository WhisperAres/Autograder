// Assignment Model
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Assignment = sequelize.define('Assignment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  totalMarks: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
  },
}, {
  tableName: 'assignments',
  timestamps: false,
});

module.exports = Assignment;
