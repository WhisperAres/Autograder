import { useState, useEffect } from "react";
import "./admin.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showNewCourseForm, setShowNewCourseForm] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showEnrollForm, setShowEnrollForm] = useState(false);
  const [showAssignGraderForm, setShowAssignGraderForm] = useState(false);

  // Form states
  const [courseForm, setCourseForm] = useState({ name: "", code: "", semester: "", description: "" });
  const [enrollForm, setEnrollForm] = useState({ studentId: "" });
  const [graderForm, setGraderForm] = useState({ graderId: "" });

  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, coursesRes] = await Promise.all([
          fetch("http://localhost:5000/admin/dashboard/stats", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("http://localhost:5000/admin/courses", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (!statsRes.ok || !coursesRes.ok) throw new Error("Failed to fetch data");

        const statsData = await statsRes.json();
        const coursesData = await coursesRes.json();

        setStats(statsData);
        setCourses(coursesData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!courseForm.name || !courseForm.code) {
      setError("Course name and code are required");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/admin/courses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(courseForm),
      });

      if (!response.ok) throw new Error("Failed to create course");

      const newCourse = await response.json();
      setCourses([...courses, newCourse.course]);
      setCourseForm({ name: "", code: "", semester: "", description: "" });
      setShowNewCourseForm(false);
      setError("");
      alert("Course created successfully!");
    } catch (err) {
      setError("Error creating course: " + err.message);
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        const response = await fetch(`http://localhost:5000/admin/courses/${courseId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!response.ok) throw new Error("Failed to delete course");

        setCourses(courses.filter(c => c.id !== courseId));
        setSelectedCourse(null);
        alert("Course deleted successfully!");
      } catch (err) {
        setError("Error deleting course: " + err.message);
      }
    }
  };

  const handleEnrollStudent = async (e) => {
    e.preventDefault();
    if (!enrollForm.studentId) {
      setError("Student ID is required");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/admin/courses/${selectedCourse.id}/enroll`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ studentId: parseInt(enrollForm.studentId) }),
        }
      );

      if (!response.ok) throw new Error("Failed to enroll student");

      setEnrollForm({ studentId: "" });
      setShowEnrollForm(false);
      setError("");
      alert("Student enrolled successfully!");
    } catch (err) {
      setError("Error enrolling student: " + err.message);
    }
  };

  const handleAssignGrader = async (e) => {
    e.preventDefault();
    if (!graderForm.graderId) {
      setError("Grader ID is required");
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:5000/admin/courses/${selectedCourse.id}/assign-grader`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ graderId: parseInt(graderForm.graderId) }),
        }
      );

      if (!response.ok) throw new Error("Failed to assign grader");

      setGraderForm({ graderId: "" });
      setShowAssignGraderForm(false);
      setError("");
      alert("Grader assigned successfully!");
    } catch (err) {
      setError("Error assigning grader: " + err.message);
    }
  };

  if (loading) {
    return <div className="admin-dashboard"><div className="loading">Loading admin dashboard...</div></div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <p>Manage courses, students, and graders</p>
      </div>

      <div className="admin-tabs">
        <button
          className={`tab-btn ${activeTab === "dashboard" ? "active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          📊 Dashboard
        </button>
        <button
          className={`tab-btn ${activeTab === "courses" ? "active" : ""}`}
          onClick={() => setActiveTab("courses")}
        >
          📚 Courses
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {activeTab === "dashboard" && stats && (
        <div className="dashboard-view">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-content">
                <h3>{stats.totalCourses}</h3>
                <p>Total Courses</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <h3>{stats.totalStudents}</h3>
                <p>Total Students</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">👨‍🏫</div>
              <div className="stat-content">
                <h3>{stats.totalGraders}</h3>
                <p>Total Graders</p>
              </div>
            </div>
          </div>

          <div className="courses-overview">
            <h2>Courses Overview</h2>
            <div className="courses-table">
              <table>
                <thead>
                  <tr>
                    <th>Course Code</th>
                    <th>Course Name</th>
                    <th>Students</th>
                    <th>Graders</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.courses.map((course) => (
                    <tr key={course.id}>
                      <td>{course.code}</td>
                      <td>{course.name}</td>
                      <td>{course.students}</td>
                      <td>{course.graders}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "courses" && (
        <div className="courses-view">
          <div className="courses-header">
            <h2>Manage Courses</h2>
            <button
              className="btn btn-primary"
              onClick={() => setShowNewCourseForm(!showNewCourseForm)}
            >
              {showNewCourseForm ? "Cancel" : "+ New Course"}
            </button>
          </div>

          {showNewCourseForm && (
            <div className="form-container">
              <h3>Create New Course</h3>
              <form onSubmit={handleCreateCourse}>
                <div className="form-group">
                  <label>Course Name *</label>
                  <input
                    type="text"
                    value={courseForm.name}
                    onChange={(e) => setCourseForm({ ...courseForm, name: e.target.value })}
                    placeholder="e.g., Introduction to Programming"
                  />
                </div>

                <div className="form-group">
                  <label>Course Code *</label>
                  <input
                    type="text"
                    value={courseForm.code}
                    onChange={(e) => setCourseForm({ ...courseForm, code: e.target.value })}
                    placeholder="e.g., CS101"
                  />
                </div>

                <div className="form-group">
                  <label>Semester</label>
                  <input
                    type="text"
                    value={courseForm.semester}
                    onChange={(e) => setCourseForm({ ...courseForm, semester: e.target.value })}
                    placeholder="e.g., Spring 2025"
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    value={courseForm.description}
                    onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                    placeholder="Course description..."
                    rows="3"
                  ></textarea>
                </div>

                <button type="submit" className="btn btn-success">
                  Create Course
                </button>
              </form>
            </div>
          )}

          <div className="courses-list">
            {courses.length === 0 ? (
              <p className="no-courses">No courses found. Create one to get started!</p>
            ) : (
              courses.map((course) => (
                <div
                  key={course.id}
                  className={`course-card ${selectedCourse?.id === course.id ? "active" : ""}`}
                  onClick={() => setSelectedCourse(course)}
                >
                  <div className="course-card-header">
                    <h3>{course.name}</h3>
                    <button
                      className="btn-delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCourse(course.id);
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                  <p className="course-code">{course.code}</p>
                  <p className="course-semester">{course.semester}</p>
                  <p className="course-description">{course.description}</p>
                </div>
              ))
            )}
          </div>

          {selectedCourse && (
            <div className="course-details">
              <h2>{selectedCourse.name} - Management</h2>

              <div className="management-section">
                <div className="section-header">
                  <h3>Enrolled Students</h3>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowEnrollForm(!showEnrollForm)}
                  >
                    {showEnrollForm ? "Cancel" : "+ Enroll Student"}
                  </button>
                </div>

                {showEnrollForm && (
                  <form onSubmit={handleEnrollStudent} className="form-container">
                    <div className="form-group">
                      <label>Student ID *</label>
                      <input
                        type="number"
                        value={enrollForm.studentId}
                        onChange={(e) => setEnrollForm({ studentId: e.target.value })}
                        placeholder="Enter student ID"
                      />
                    </div>
                    <button type="submit" className="btn btn-success">
                      Enroll Student
                    </button>
                  </form>
                )}
              </div>

              <div className="management-section">
                <div className="section-header">
                  <h3>Assigned Graders</h3>
                  <button
                    className="btn btn-primary"
                    onClick={() => setShowAssignGraderForm(!showAssignGraderForm)}
                  >
                    {showAssignGraderForm ? "Cancel" : "+ Assign Grader"}
                  </button>
                </div>

                {showAssignGraderForm && (
                  <form onSubmit={handleAssignGrader} className="form-container">
                    <div className="form-group">
                      <label>Grader ID *</label>
                      <input
                        type="number"
                        value={graderForm.graderId}
                        onChange={(e) => setGraderForm({ graderId: e.target.value })}
                        placeholder="Enter grader ID (101-103)"
                      />
                    </div>
                    <button type="submit" className="btn btn-success">
                      Assign Grader
                    </button>
                  </form>
                )}

                <div className="info-box">
                  <p>Available Grader IDs:</p>
                  <ul>
                    <li>101 - Dr. Professor</li>
                    <li>102 - Ms. Lecturer</li>
                    <li>103 - Mr. TA</li>
                  </ul>
                </div>

                <div className="info-box">
                  <p>Available Student IDs:</p>
                  <ul>
                    <li>1 - John Student</li>
                    <li>2 - Alice Smith</li>
                    <li>3 - Bob Johnson</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
