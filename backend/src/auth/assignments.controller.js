const Assignment = require("../models/assignment");
const TestCase = require("../models/testCase");

exports.getAllAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.findAll({
      where: { isHidden: false },
      include: [{ model: TestCase, as: "testCases" }],
      order: [["id", "DESC"]]
    });
    res.json(assignments);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    res.status(500).json({ message: "Error fetching assignments" });
  }
};

exports.getAssignmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const assignment = await Assignment.findByPk(id, {
      include: [{ model: TestCase, as: "testCases" }]
    });
    if (!assignment) {
      return res.status(404).json({ message: "Assignment not found" });
    }
    
    // Check if assignment is hidden
    if (assignment.isHidden) {
      return res.status(403).json({ message: "This assignment is not available to students" });
    }
    
    res.json(assignment);
  } catch (error) {
    console.error("Error fetching assignment:", error);
    res.status(500).json({ message: "Error fetching assignment" });
  }
};
