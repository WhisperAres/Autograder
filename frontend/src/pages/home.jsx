import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./home.css";

export default function Home() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : false;
  });
  const navigate = useNavigate();

  // Apply theme to document root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  return (
    <div className="home-container">
      {/* Theme Toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="theme-toggle home-theme-toggle"
        title="Toggle theme"
      >
        {darkMode ? "☀️" : "🌙"}
      </button>

      {/* Navigation Bar */}
      <nav className="home-navbar">
        <div className="navbar-content">
          <div className="navbar-brand">
            <h1>📚 Autograder</h1>
          </div>
          <div className="navbar-buttons">
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/login")}
            >
              Login
            </button>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/signup")}
            >
              Create Account
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h2>Welcome to Autograder</h2>
          <p>
            Create your own courses, manage assignments, and automate test
            grading all in one place.
          </p>

          <div className="hero-features">
            <div className="feature-card">
              <div className="feature-icon">👨‍🏫</div>
              <h3>Course Management</h3>
              <p>Create and manage your own courses as an admin</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📝</div>
              <h3>Assignments</h3>
              <p>Create assignments with automated test cases</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">✅</div>
              <h3>Auto Grading</h3>
              <p>Automatic test execution and result reporting</p>
            </div>
          </div>

          <div className="hero-cta">
            <p className="cta-text">
              Ready to get started?
            </p>
            <button
              className="btn btn-large btn-primary"
              onClick={() => navigate("/signup")}
            >
              Create Your First Course
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="home-footer">
        <p>&copy; 2026 Autograder. Automated Education Platform.</p>
      </footer>
    </div>
  );
}
