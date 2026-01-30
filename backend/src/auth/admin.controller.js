const { 
  getAllCourses, 
  getCourseById, 
  createCourse, 
  updateCourse, 
  deleteCourse,
  enrollStudent,
  getEnrolledStudents,
  assignGraderToCourse,
  getGradersForCourse,
  removeGraderFromCourse,
  getCoursesForGrader,
} = require("../models/admin");

// Course Management

exports.listCourses = (req, res) => {
  try {
    const courses = getAllCourses();
    res.json(courses);
  } catch (error) {
    console.error("Error listing courses:", error);
    res.status(500).json({ message: "Error listing courses" });
  }
};

exports.getCourse = (req, res) => {
  try {
    const { courseId } = req.params;
    const course = getCourseById(courseId);

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const students = getEnrolledStudents(courseId);
    const graders = getGradersForCourse(courseId);

    res.json({
      ...course,
      enrolledStudents: students,
      assignedGraders: graders,
    });
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ message: "Error fetching course" });
  }
};

exports.createNewCourse = (req, res) => {
  try {
    const { name, code, semester, description } = req.body;

    if (!name || !code) {
      return res.status(400).json({ message: "Name and code required" });
    }

    const course = createCourse({
      name,
      code,
      semester: semester || "Current",
      description: description || "",
      instructor: req.user.id,
    });

    res.status(201).json({
      message: "Course created successfully",
      course,
    });
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ message: "Error creating course" });
  }
};

exports.editCourse = (req, res) => {
  try {
    const { courseId } = req.params;
    const { name, code, semester, description } = req.body;

    const course = getCourseById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const updated = updateCourse(courseId, {
      name: name || course.name,
      code: code || course.code,
      semester: semester || course.semester,
      description: description || course.description,
    });

    res.json({
      message: "Course updated successfully",
      course: updated,
    });
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ message: "Error updating course" });
  }
};

exports.removeCourse = (req, res) => {
  try {
    const { courseId } = req.params;

    const course = getCourseById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    deleteCourse(courseId);

    res.json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ message: "Error deleting course" });
  }
};

// Student Enrollment

exports.enrollStudentToCourse = (req, res) => {
  try {
    const { courseId } = req.params;
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: "Student ID required" });
    }

    const course = getCourseById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    enrollStudent(studentId, courseId);

    res.json({
      message: "Student enrolled successfully",
      courseId,
      studentId,
    });
  } catch (error) {
    console.error("Error enrolling student:", error);
    res.status(500).json({ message: "Error enrolling student" });
  }
};

exports.getEnrolledStudentsList = (req, res) => {
  try {
    const { courseId } = req.params;

    const course = getCourseById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const students = getEnrolledStudents(courseId);
    res.json({ courseId, students });
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Error fetching students" });
  }
};

// Grader Assignment

exports.assignGrader = (req, res) => {
  try {
    const { courseId } = req.params;
    const { graderId } = req.body;

    if (!graderId) {
      return res.status(400).json({ message: "Grader ID required" });
    }

    const course = getCourseById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    assignGraderToCourse(courseId, graderId);

    res.json({
      message: "Grader assigned successfully",
      courseId,
      graderId,
    });
  } catch (error) {
    console.error("Error assigning grader:", error);
    res.status(500).json({ message: "Error assigning grader" });
  }
};

exports.getAssignedGraders = (req, res) => {
  try {
    const { courseId } = req.params;

    const course = getCourseById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    const graders = getGradersForCourse(courseId);
    res.json({ courseId, graders });
  } catch (error) {
    console.error("Error fetching graders:", error);
    res.status(500).json({ message: "Error fetching graders" });
  }
};

exports.unassignGrader = (req, res) => {
  try {
    const { courseId, graderId } = req.params;

    const course = getCourseById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    removeGraderFromCourse(courseId, graderId);

    res.json({
      message: "Grader unassigned successfully",
      courseId,
      graderId,
    });
  } catch (error) {
    console.error("Error unassigning grader:", error);
    res.status(500).json({ message: "Error unassigning grader" });
  }
};

// Dashboard Statistics

exports.getDashboardStats = (req, res) => {
  try {
    const courses = getAllCourses();

    const stats = {
      totalCourses: courses.length,
      totalStudents: courses.reduce((sum, c) => sum + getEnrolledStudents(c.id).length, 0),
      totalGraders: new Set(courses.flatMap(c => getGradersForCourse(c.id))).size,
      courses: courses.map(c => ({
        id: c.id,
        name: c.name,
        code: c.code,
        students: getEnrolledStudents(c.id).length,
        graders: getGradersForCourse(c.id).length,
      })),
    };

    res.json(stats);
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ message: "Error fetching stats" });
  }
};
