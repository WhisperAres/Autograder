import { useState, useEffect } from "react";
import "./grader.css";

export default function GraderDashboard() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [marks, setMarks] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [runningTests, setRunningTests] = useState(false);
  const [showCodeViewer, setShowCodeViewer] = useState(false);
  const [codeContent, setCodeContent] = useState("");
  const [codeName, setCodeName] = useState("");
  const [testResults, setTestResults] = useState([]);
  const [tabs, setTabs] = useState("submissions"); // submissions, code, feedback
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await fetch("http://localhost:5000/grader/submissions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch submissions");
        const data = await response.json();
        setSubmissions(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSubmissions();
  }, [token]);

  const handleViewCode = async (submission) => {
    try {
      const response = await fetch(
        `http://localhost:5000/grader/submissions/${submission.id}/code`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await response.json();
      setCodeContent(data.fileContent);
      setCodeName(data.fileName);
      setShowCodeViewer(true);
    } catch (err) {
      setError("Failed to fetch code: " + err.message);
    }
  };

  const handleRunTests = async (submission) => {
    setRunningTests(true);
    try {
      const testCases = [
        { name: "Test Case 1" },
        { name: "Test Case 2" },
        { name: "Test Case 3" },
      ];

      const response = await fetch(
        `http://localhost:5000/grader/submissions/${submission.id}/run-tests`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ testCases }),
        }
      );

      if (!response.ok) throw new Error("Failed to run tests");
      const data = await response.json();
      setTestResults(data.results);
      setTabs("feedback");
    } catch (err) {
      setError("Error running tests: " + err.message);
    } finally {
      setRunningTests(false);
    }
  };

  const handleSubmitFeedback = async () => {
    if (!feedback || marks === "") {
      setError("Please enter both feedback and marks");
      return;
    }

    setSubmittingFeedback(true);
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
      setError("");
      setFeedback("");
      setMarks("");
      alert("Feedback submitted successfully!");
    } catch (err) {
      setError("Error submitting feedback: " + err.message);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleSelectSubmission = (submission) => {
    setSelectedSubmission(submission);
    setTabs("submissions");
    setFeedback("");
    setMarks("");
    setTestResults([]);
  };

  if (loading) {
    return <div className="grader-dashboard"><div className="loading">Loading submissions...</div></div>;
  }

  return (
    <div className="grader-dashboard">
      <div className="grader-header">
        <h1>Grader Dashboard</h1>
        <p>Review and grade student submissions</p>
      </div>

      <div className="grader-container">
        {/* Left Panel - Submissions List */}
        <div className="submissions-panel">
          <h2>All Submissions ({submissions.length})</h2>
          <div className="submissions-list">
            {submissions.length === 0 ? (
              <p className="no-submissions">No submissions found</p>
            ) : (
              submissions.map((submission) => (
                <div
                  key={submission.id}
                  className={`submission-item ${
                    selectedSubmission?.id === submission.id ? "active" : ""
                  }`}
                  onClick={() => handleSelectSubmission(submission)}
                >
                  <div className="submission-header">
                    <h4>{submission.fileName}</h4>
                    <span className={`status-badge status-${submission.status}`}>
                      {submission.status}
                    </span>
                  </div>
                  <p className="submission-meta">
                    Student ID: {submission.studentId}
                  </p>
                  <p className="submission-meta">
                    Uploaded: {new Date(submission.uploadedAt).toLocaleString()}
                  </p>
                  {submission.marks && (
                    <p className="submission-marks">
                      Marks: {submission.marks}/{submission.totalMarks}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Panel - Submission Details */}
        <div className="details-panel">
          {selectedSubmission ? (
            <>
              <div className="details-header">
                <h2>{selectedSubmission.fileName}</h2>
                <span className={`status-badge status-${selectedSubmission.status}`}>
                  {selectedSubmission.status}
                </span>
              </div>

              <div className="details-tabs">
                <button
                  className={`tab-button ${tabs === "submissions" ? "active" : ""}`}
                  onClick={() => setTabs("submissions")}
                >
                  Details
                </button>
                <button
                  className={`tab-button ${tabs === "code" ? "active" : ""}`}
                  onClick={() => {
                    setTabs("code");
                    handleViewCode(selectedSubmission);
                  }}
                >
                  Code
                </button>
                <button
                  className={`tab-button ${tabs === "feedback" ? "active" : ""}`}
                  onClick={() => setTabs("feedback")}
                >
                  Feedback & Tests
                </button>
              </div>

              {error && <div className="error-message">{error}</div>}

              {tabs === "submissions" && (
                <div className="details-content">
                  <div className="detail-item">
                    <label>Student ID:</label>
                    <span>{selectedSubmission.studentId}</span>
                  </div>
                  <div className="detail-item">
                    <label>Assignment ID:</label>
                    <span>{selectedSubmission.assignmentId}</span>
                  </div>
                  <div className="detail-item">
                    <label>Uploaded:</label>
                    <span>
                      {new Date(selectedSubmission.uploadedAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Current Marks:</label>
                    <span>
                      {selectedSubmission.marks || "Not graded"} /{" "}
                      {selectedSubmission.totalMarks}
                    </span>
                  </div>
                  <div className="detail-item">
                    <label>Status:</label>
                    <span className={`status-${selectedSubmission.status}`}>
                      {selectedSubmission.status}
                    </span>
                  </div>

                  <div className="action-buttons">
                    <button
                      className="btn btn-primary"
                      onClick={() => handleRunTests(selectedSubmission)}
                      disabled={runningTests}
                    >
                      {runningTests ? "Running Tests..." : "Run Test Cases"}
                    </button>
                  </div>
                </div>
              )}

              {tabs === "code" && showCodeViewer && (
                <div className="details-content">
                  <div className="code-viewer">
                    <div className="code-header">
                      <h4>{codeName}</h4>
                    </div>
                    <pre className="code-content">
                      <code>{codeContent}</code>
                    </pre>
                  </div>
                </div>
              )}

              {tabs === "feedback" && (
                <div className="details-content">
                  {testResults.length > 0 && (
                    <div className="test-results">
                      <h4>Test Results</h4>
                      <div className="results-list">
                        {testResults.map((result, idx) => (
                          <div key={idx} className="result-item">
                            <div className={`result-status ${result.passed ? "passed" : "failed"}`}>
                              {result.passed ? "✓ PASSED" : "✗ FAILED"}
                            </div>
                            <div className="result-info">
                              <p className="test-name">{result.testName}</p>
                              <p className="test-output">{result.output}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="feedback-form">
                    <h4>Provide Feedback</h4>

                    <div className="form-group">
                      <label>Marks *</label>
                      <input
                        type="number"
                        value={marks}
                        onChange={(e) => setMarks(e.target.value)}
                        placeholder="Enter marks (0-100)"
                        min="0"
                        max="100"
                      />
                    </div>

                    <div className="form-group">
                      <label>Feedback *</label>
                      <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder="Write your feedback here..."
                        rows="6"
                      ></textarea>
                    </div>

                    <button
                      className="btn btn-success"
                      onClick={handleSubmitFeedback}
                      disabled={submittingFeedback}
                    >
                      {submittingFeedback ? "Submitting..." : "Submit Feedback"}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="no-selection">
              <p>Select a submission to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
