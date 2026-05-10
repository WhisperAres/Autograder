import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/auth";
import "./admin.css";

export default function AdminCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newCourse, setNewCourse] = useState({ name: "", code: "", description: "" });
  const [creating, setCreating] = useState(false);

  const parseCourses = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.courses)) return payload.courses;
    const created = Array.isArray(payload?.createdCourses) ? payload.createdCourses : [];
    const enrolled = Array.isArray(payload?.enrolledCourses) ? payload.enrolledCourses : [];
    return [...created, ...enrolled];
  };

  const fetchCourses = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await api.get("/courses/my-courses");
      setCourses(parseCourses(res.data));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load courses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
    fetchCourses();
  }, []);

  const openCourse = (courseId) => {
    localStorage.setItem("selectedCourseId", String(courseId));
    navigate(`/admin/dashboard?courseId=${courseId}`);
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    if (!newCourse.name.trim()) {
      setError("Course name is required");
      return;
    }

    setCreating(true);
    setError("");
    try {
      const res = await api.post("/courses", {
        name: newCourse.name.trim(),
        code: newCourse.code?.trim() || "",
        description: newCourse.description?.trim() || "",
      });
      const createdCourseId = res?.data?.course?.id;
      setNewCourse({ name: "", code: "", description: "" });
      await fetchCourses();
      if (createdCourseId) {
        openCourse(createdCourseId);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create course");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Select a Course</h1>
        <p>Choose one of your courses or create a new one.</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-panel" style={{ marginBottom: "1rem" }}>
        <h3>Create New Course</h3>
        <form onSubmit={handleCreateCourse}>
          <div className="form-row">
            <div className="form-group">
              <label>Course Name *</label>
              <input
                type="text"
                value={newCourse.name}
                onChange={(e) => setNewCourse({ ...newCourse, name: e.target.value })}
                placeholder="Course name"
                disabled={creating}
              />
            </div>
            <div className="form-group">
              <label>Course Code</label>
              <input
                type="text"
                value={newCourse.code}
                onChange={(e) => setNewCourse({ ...newCourse, code: e.target.value })}
                placeholder="CS101"
                disabled={creating}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={newCourse.description}
              onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
              placeholder="Optional description"
              rows="3"
              disabled={creating}
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={creating}>
            {creating ? "Creating..." : "Create Course"}
          </button>
        </form>
      </div>

      <div className="users-section">
        <div className="section-header">
          <h2>Your Courses</h2>
        </div>
        {loading ? (
          <div className="loading">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="empty-state">No courses found. Create your first course above.</div>
        ) : (
          <div className="users-list-panel">
            {courses.map((course) => (
              <div key={course.id} className="user-card">
                <div className="user-info">
                  <h4>{course.name}</h4>
                  <p>{course.code || "No code"}{course.description ? ` • ${course.description}` : ""}</p>
                </div>
                <div className="user-actions">
                  <button className="btn btn-primary" onClick={() => openCourse(course.id)}>
                    Open Dashboard
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

