import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/auth";
import "./admin.css";
import "./adminCourses.css";

export default function StudentCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", "dark");
  }, []);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/courses/my-courses");
        const payload = res.data || {};
        const enrolled = Array.isArray(payload.enrolledCourses) ? payload.enrolledCourses : [];
        const available = Array.isArray(payload.courses) ? payload.courses : enrolled;
        setCourses(available);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load courses");
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const openCourse = (courseId) => {
    localStorage.setItem("selectedCourseId", String(courseId));
    navigate(`/student/dashboard?courseId=${courseId}`);
  };

  return (
    <div className="admin-dashboard">
      <div className="course-shell">
      <div className="course-card">
        <div className="section-header">
          <h2>Your Courses</h2>
        </div>
        {error && <div className="alert alert-error">{error}</div>}
        {loading ? (
          <div className="loading">Loading courses...</div>
        ) : courses.length === 0 ? (
          <div className="empty-state">No course enrollment found yet.</div>
        ) : (
          <div className="course-list">
            {courses.map((course) => (
              <div key={course.id} className="course-item">
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
    </div>
  );
}
