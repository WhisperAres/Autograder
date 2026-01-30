// Mock database for assignments
const assignments = [
  {
    id: 1,
    title: "Sum of Two Numbers",
    description: "Write a function that takes two numbers and returns their sum.",
    dueDate: "2026-02-15",
    createdAt: "2026-01-20",
  },
  {
    id: 2,
    title: "Fibonacci Sequence",
    description: "Generate the first n Fibonacci numbers.",
    dueDate: "2026-02-22",
    createdAt: "2026-01-21",
  },
  {
    id: 3,
    title: "Palindrome Checker",
    description: "Check if a given string is a palindrome.",
    dueDate: "2026-03-01",
    createdAt: "2026-01-22",
  },
];

module.exports = {
  getAllAssignments: () => assignments,
  getAssignmentById: (id) => assignments.find((a) => a.id === parseInt(id)),
};
