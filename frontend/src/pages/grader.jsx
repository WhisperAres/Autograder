import { useState, useEffect } from "react";
import TestCaseManager from "./testCaseManager";
import "./grader.css";

export default function GraderDashboard() {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [codeContent, setCodeContent] = useState("");
  const [codeName, setCodeName] = useState("");
  const [testResults, setTestResults] = useState([]);
  const [runningTests, setRunningTests] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [marks, setMarks] = useState("");
  const [feedback, setFeedback] = useState("");
  const [tab, setTab] = useState("details"); // details, code, feedback
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true;
  });
  const [showTestCaseManager, setShowTestCaseManager] = useState(false);
  const token = localStorage.getItem("token");

  // Apply theme to document root
  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Fetch assignments
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await fetch("http://localhost:5000/grader/assignments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch assignments");
        const data = await response.json();
        setAssignments(data || []);
        setLoading(false);
      } catch (err) {
        setError("Error loading assignments: " + err.message);
        setLoading(false);
      }
    };

    if (token) fetchAssignments();
  }, [token]);

  // Fetch submissions when assignment is selected
  const handleAssignmentClick = async (assignment) => {
    setSelectedAssignment(assignment);
    setSelectedSubmission(null);
    setSubmissions([]);
    setError("");
    setCodeContent("");
    setTestResults([]);
    
    try {
      const response = await fetch(
        `http://localhost:5000/grader/submissions/assignment/${assignment.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!response.ok) throw new Error("Failed to fetch submissions");
      const data = await response.json();
      setSubmissions(data || []);
    } catch (err) {
      setError("Error loading submissions: " + err.message);
    }
  };

  const handleBackToAssignments = () => {
    setSelectedAssignment(null);
    setSelectedSubmission(null);
    setSubmissions([]);
    setCodeContent("");
    setTestResults([]);
    setTab("details");
  };

  const handleViewCode = async (submission) => {
    try {
      setCodeContent("");
      setCodeName("");
      
      // Fetch code files
      const response = await fetch(
        `http://localhost:5000/grader/submissions/${submission.id}/code`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (!response.ok) throw new Error("Failed to fetch code");
      const files = await response.json();
      
      if (!Array.isArray(files) || files.length === 0) {
        setError("No code files found");
        return;
      }

      // Get first file content
      const firstFile = files[0];
      setCodeContent(firstFile.fileContent || "");
      setCodeName(firstFile.fileName || "Code");
    } catch (err) {
      setError("Failed to fetch code: " + err.message);
    }
  };

  const handleRunTests = async (submission) => {
    setRunningTests(true);
    setError("");
    setTestResults([]);
    
    try {
      const response = await fetch(
        `http://localhost:5000/grader/submissions/${submission.id}/run-tests`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      
      if (!response.ok) throw new Error("Failed to run tests");
      const data = await response.json();
      
      setTestResults(data.results || []);
      setSuccessMessage(`Tests executed: ${data.passCount || 0}/${data.totalCount || 0} passed`);
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setError("Error running tests: " + err.message);
    } finally {
      setRunningTests(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!marks) {
      setError("Please enter marks");
      return;
    }
    if (!feedback.trim()) {
      setError("Please enter feedback");
      return;
    }

    setSubmittingFeedback(true);
    setError("");
    
    try {
      const response = await fetch(
        `http://localhost:5000/grader/submissions/${selectedSubmission.id}/feedback`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ feedback, marks: parseInt(marks) }),
        }
      );

      if (!response.ok) throw new Error("Failed to submit feedback");
      
      setSuccessMessage("✓ Feedback submitted successfully!");
      setMarks("");
      setFeedback("");
      
      // Update submission status
      setSelectedSubmission({ ...selectedSubmission, status: "graded", marks: parseInt(marks) });
      setSubmissions(submissions.map(sub =>
        sub.id === selectedSubmission.id
          ? { ...sub, status: "graded", marks: parseInt(marks) }
          : sub
      ));
      
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Error submitting feedback: " + err.message);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  // Show test case manager if selected
  if (showTestCaseManager && selectedAssignment) {
    return (
      <TestCaseManager
        assignment={selectedAssignment}
        onBack={() => {
          setShowTestCaseManager(false);
          setSelectedAssignment(null);
        }}
        token={token}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
      />
    );
  }

  if (loading) {
    return (
      <div className="grader-dashboard">
        <div style={{ textAlign: "center", padding: "3rem", color: "var(--text-secondary)" }}>
          <p>📋 Loading assignments...</p>
        </div>
      </div>
    );
  }

  // Show assignment selection
  if (!selectedAssignment) {
    return (
      <div className="grader-dashboard">
        <div className="dashboard-header">
          <h1>✅ Grader Dashboard</h1>
          <p>Select an assignment to view and grade submissions</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div className="assignments-grid">
          {assignments.length === 0 ? (
            <div className="empty-state">
              <p>No assignments available</p>
            </div>
          ) : (
            assignments.map((assignment) => (
              <div
                key={assignment.id}
                className="assignment-card"
              >
                <div className="card-header">
                  <h3>{assignment.title}</h3>
                  <span className="total-marks">Total: {assignment.totalMarks || 100}</span>
                </div>
                <p className="description">{assignment.description || "No description"}</p>
                <p className="due-date">
                  📅 Due: {new Date(assignment.dueDate).toLocaleDateString()}
                </p>
                <div className="card-buttons">
                  <button 
                    className="btn-select"
                    onClick={() => handleAssignmentClick(assignment)}
                  >
                    Grade Submissions →
                  </button>
                  <button 
                    className="btn-manage-tests"
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setShowTestCaseManager(true);
                    }}
                  >
                    Manage Test Cases
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // Show submissions and grading interface
  return (
    <div className="grader-dashboard">
      {/* Theme Toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="theme-toggle"
        title="Toggle theme"
      >
        {darkMode ? "☀️" : "🌙"}
      </button>

      <div className="dashboard-header">
        <button className="btn-back" onClick={handleBackToAssignments}>
          ← Back to Assignments
        </button>
        <div>
          <h1>{selectedAssignment.title}</h1>
          <p>Total Marks: {selectedAssignment.totalMarks || 100}</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {successMessage && <div className="success-banner">{successMessage}</div>}

      <div className="grader-container">
        {/* Submissions List */}
        <div className="submissions-list-panel">
          <h2>📋 Submissions ({submissions.length})</h2>

          <div className="submissions-list">
            {submissions.length === 0 ? (
              <div className="empty-message">
                <p>No submissions for this assignment</p>
              </div>
            ) : (
              submissions.map((submission) => (
                <div
                  key={submission.id}
                  className={`submission-item ${selectedSubmission?.id === submission.id ? "active" : ""}`}
                  onClick={() => {
                    setSelectedSubmission(submission);
                    setTab("details");
                    setCodeContent("");
                    setTestResults([]);
                    setMarks("");
                    setFeedback("");
                  }}
                >
                  <div className="submission-top">
                    <span className="student-id">👤 Student {submission.studentId}</span>
                    <span className={`status-badge status-${submission.status}`}>
                      {submission.status}
                    </span>
                  </div>
                  <p className="submitted-date">
                    📅 {new Date(submission.submittedAt).toLocaleDateString()}
                  </p>
                  {submission.marks !== null && submission.marks !== undefined && (
                    <p className="marks-info">⭐ Marks: {submission.marks}</p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Submission Details */}
        <div className="submission-details-panel">
          {selectedSubmission ? (
            <>
              <div className="submission-header">
                <div>
                  <h2>Student {selectedSubmission.studentId}</h2>
                  <p>Submitted: {new Date(selectedSubmission.submittedAt).toLocaleString()}</p>
                </div>
                <span className={`status-badge status-${selectedSubmission.status}`}>
                  {selectedSubmission.status}
                </span>
              </div>

              <div className="tabs">
                <button
                  className={`tab ${tab === "details" ? "active" : ""}`}
                  onClick={() => setTab("details")}
                >
                  📝 Details
                </button>
                <button
                  className={`tab ${tab === "code" ? "active" : ""}`}
                  onClick={() => {
                    setTab("code");
                    handleViewCode(selectedSubmission);
                  }}
                >
                  💻 Code
                </button>
                <button
                  className={`tab ${tab === "feedback" ? "active" : ""}`}
                  onClick={() => setTab("feedback")}
                >
                  💬 Feedback
                </button>
              </div>

              {tab === "details" && (
                <div className="tab-content">
                  <div className="detail-item">
                    <label>Student ID:</label>
                    <span>{selectedSubmission.studentId}</span>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <span className={`status-${selectedSubmission.status}`}>
                      {selectedSubmission.status}
                    </span>
                  </div>
                  {selectedSubmission.marks !== null && (
                    <div className="detail-item">
                      <label>Marks:</label>
                      <span>{selectedSubmission.marks}/{selectedSubmission.totalMarks || 100}</span>
                    </div>
                  )}

                  <button
                    className="btn btn-primary"
                    onClick={() => handleRunTests(selectedSubmission)}
                    disabled={runningTests}
                    style={{ marginTop: "1.5rem", width: "100%" }}
                  >
                    {runningTests ? "⏳ Running..." : "▶ Run Tests"}
                  </button>

                  {testResults.length > 0 && (
                    <div className="test-results" style={{ marginTop: "1.5rem" }}>
                      <h4>🧪 Test Results</h4>
                      <div className="results-list">
                        {testResults.map((result, idx) => (
                          <div
                            key={idx}
                            className={`result-item ${result.passed ? "passed" : "failed"}`}
                          >
                            <span className={`badge ${result.passed ? "pass" : "fail"}`}>
                              {result.passed ? "✓ PASS" : "✗ FAIL"}
                            </span>
                            <div className="result-text">
                              <p className="test-name">{result.testName}</p>
                              {!result.passed && (
                                <p className="error-text">Expected: {result.expectedOutput}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {tab === "code" && (
                <div className="tab-content">
                  {codeContent ? (
                    <div className="code-viewer">
                      <div className="code-header">
                        <h4>📄 {codeName}</h4>
                      </div>
                      <pre className="code-content">
                        <code>{codeContent}</code>
                      </pre>
                    </div>
                  ) : (
                    <p className="empty-message">Loading code...</p>
                  )}
                </div>
              )}

              {tab === "feedback" && (
                <div className="tab-content">
                  <div className="feedback-form">
                    <div className="form-group">
                      <label>Marks (0-{selectedAssignment.totalMarks || 100}) *</label>
                      <input
                        type="number"
                        min="0"
                        max={selectedAssignment.totalMarks || 100}
                        value={marks}
                        onChange={(e) => setMarks(e.target.value)}
                        placeholder="Enter marks"
                      />
                    </div>

                    <div className="form-group">
                      <label>Feedback *</label>
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Write feedback for the student..."
                        rows="8"
                      ></textarea>
                    </div>

                    <button
                      className="btn btn-success"
                      onClick={handleSubmitFeedback}
                      disabled={submittingFeedback}
                      style={{ width: "100%" }}
                    >
                      {submittingFeedback ? "⏳ Submitting..." : "✓ Submit Feedback"}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">
              <p>👈 Select a submission to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
