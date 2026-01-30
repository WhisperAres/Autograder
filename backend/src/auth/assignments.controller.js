const { getAllAssignments, getAssignmentById } = require("../models/assignments");

exports.getAllAssignments = (req, res) => {
  try {
    const assignments = getAllAssignments();
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching assignments" });
  }
};

exports.getAssignmentById = (req, res) => {
  try {
    const { id } = req.params;
    const assignment = getAssignmentById(id);
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: "Error fetching assignment" });
  }
};
