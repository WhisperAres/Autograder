import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./dashboard.css";

export default function Dashboard({ handleLogout, user }) {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [assignmentSubmission, setAssignmentSubmission] = useState(null);
  const [testResults, setTestResults] = useState(null);
  const [showTestResults, setShowTestResults] = useState(false);
  const [codeContent, setCodeContent] = useState("");
  const [codeName, setCodeName] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Apply theme to document root and save preference
  useEffect(() => {
    if (darkMode) {
      document.documentElement.setAttribute('data-theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  // Fetch assignments and submissions
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchData = async () => {
      try {
        const assignmentsRes = await fetch("http://localhost:5000/assignments", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const assignmentsData = await assignmentsRes.json();
        setAssignments(assignmentsData);

        const submissionsRes = await fetch("http://localhost:5000/submissions", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const submissionsData = await submissionsRes.json();
        setSubmissions(submissionsData);

        setLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleAssignmentClick = (assignment) => {
    setSelectedAssignment(assignment);
    setSelectedFile(null);
    setCodeContent("");
    const submission = submissions.find((s) => s.assignmentId === assignment.id);
    setAssignmentSubmission(submission || null);
  };

  const handleBackToAssignments = () => {
    setSelectedAssignment(null);
    setSelectedFile(null);
    setFiles([]);
    setShowTestResults(false);
    setCodeContent("");
  };;

  const handleFileChange = (e) => {
    setFiles([...files, ...e.target.files]);
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (files.length === 0 || !selectedAssignment) {
      alert("Please select files");
      return;
    }

    setUploadingFiles(true);
    const token = localStorage.getItem("token");

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("assignmentId", selectedAssignment.id);

        const response = await fetch("http://localhost:5000/submissions", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!response.ok) {
          alert("Upload failed");
          setUploadingFiles(false);
          return;
        }
      }

      setFiles([]);
      alert("Files uploaded successfully!");

      const submissionsRes = await fetch("http://localhost:5000/submissions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const submissionsData = await submissionsRes.json();
      setSubmissions(submissionsData);

      const updatedSubmission = submissionsData.find(
        (s) => s.assignmentId === selectedAssignment.id
      );
      setAssignmentSubmission(updatedSubmission || null);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Upload failed");
    } finally {
      setUploadingFiles(false);
    }
  };

  const handleViewResults = async () => {
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `http://localhost:5000/submissions/${assignmentSubmission.id}/results`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        alert("Results not available");
        return;
      }

      const data = await response.json();
      setTestResults(data);
      setShowTestResults(true);
    } catch (error) {
      console.error("Error fetching results:", error);
      alert("Failed to load results");
    }
  };

  const handleViewCode = async (file) => {
    if (!assignmentSubmission || !file || !file.id) {
      console.error("Invalid file or submission", { file, assignmentSubmission });
      alert("Error: Invalid file");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const fileId = parseInt(file.id);
      const submissionId = parseInt(assignmentSubmission.id);
      const url = `http://localhost:5000/submissions/${submissionId}/code/${fileId}`;
      console.log("Fetching code from:", url);
      
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error:", errorData);
        alert("Failed to load code: " + (errorData.message || response.statusText));
        return;
      }

      const data = await response.json();
      if (!data.fileContent) {
        alert("No content found for this file");
        return;
      }
      setCodeContent(data.fileContent);
      setCodeName(data.fileName);
      setSelectedFile(file);
    } catch (error) {
      console.error("Error fetching code:", error);
      alert("Failed to load code: " + error.message);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!assignmentSubmission || !fileId) {
      console.error("Invalid submission or file ID", { fileId, assignmentSubmission });
      alert("Error: Invalid file");
      return;
    }

    if (!confirm("Are you sure you want to delete this file?")) {
      return;
    }

    setDeleting(true);
    const token = localStorage.getItem("token");

    try {
      const submissionId = parseInt(assignmentSubmission.id);
      const parsedFileId = parseInt(fileId);
      const url = `http://localhost:5000/submissions/${submissionId}/file/${parsedFileId}`;
      console.log("Deleting file from:", url);
      
      const response = await fetch(url, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error:", errorData);
        alert("Failed to delete file: " + (errorData.message || "Unknown error"));
        setDeleting(false);
        return;
      }

      const data = await response.json();
      if (data.submission) {
        setAssignmentSubmission(data.submission);
      }

      // Clear selected file if it was the deleted one
      if (selectedFile?.id === fileId) {
        setSelectedFile(null);
        setCodeContent("");
      }

      // Refresh submissions
      const submissionsRes = await fetch("http://localhost:5000/submissions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const submissionsData = await submissionsRes.json();
      setSubmissions(submissionsData);

      alert("File deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      alert("Failed to delete file: " + error.message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-content">
          <h1 className="brand">Autograder</h1>
          <div className="navbar-actions">
            <span className="user-email">{user?.email || "User"}</span>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className="btn-icon"
              title="Toggle theme"
            >
              {darkMode ? "☀️" : "🌙"}
            </button>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="main-content">
        {!selectedAssignment ? (
          // Assignments List View
          <div className="assignments-view">
            <div className="view-header">
              <h2>Assignments</h2>
            </div>
            <div className="assignments-grid">
              {assignments.length === 0 ? (
                <p className="empty-state">No assignments available</p>
              ) : (
                assignments.map((assignment) => {
                  const hasSubmission = submissions.some(
                    (s) => s.assignmentId === assignment.id
                  );
                  return (
                    <div
                      key={assignment.id}
                      className="assignment-card"
                      onClick={() => handleAssignmentClick(assignment)}
                    >
                      <div className="card-header">
                        <h3>{assignment.title}</h3>
                        {hasSubmission && (
                          <span className="badge-submitted">✓ Submitted</span>
                        )}
                      </div>
                      <p className="card-description">{assignment.description}</p>
                      <p className="card-meta">Due: {assignment.dueDate}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ) : (
          // Assignment Detail View
          <div className="assignment-detail-view">
            {/* Header with Back Button */}
            <div className="detail-header">
              <button
                onClick={handleBackToAssignments}
                className="btn-back"
              >
                ← Back
              </button>
              <h2>{selectedAssignment.title}</h2>
            </div>

            <div className="detail-content">
              {/* Left: Files Panel */}
              <div className="files-panel">
                <div className="panel-title">Files</div>

                {/* Upload Section */}
                <div className="upload-box">
                  <form onSubmit={handleUpload}>
                    <div className="file-input-wrapper">
                      <input
                        type="file"
                        id="file-input"
                        onChange={(e) => setFiles([...files, ...e.target.files])}
                        accept=".js,.py,.java,.cpp,.c,.txt"
                        multiple
                        className="file-input-hidden"
                      />
                      <label htmlFor="file-input" className="btn-upload">
                        + Select Files
                      </label>
                    </div>

                    {files.length > 0 && (
                      <div className="upload-preview">
                        <div className="preview-title">
                          To Upload: {files.length}
                        </div>
                        <ul className="file-list-upload">
                          {files.map((file, index) => (
                            <li key={index}>
                              <span>{file.name}</span>
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="btn-remove"
                              >
                                ✕
                              </button>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={uploadingFiles || files.length === 0}
                      className="btn-submit"
                    >
                      {uploadingFiles ? "Uploading..." : "Upload"}
                    </button>
                  </form>
                </div>

                {/* Submitted Files List */}
                {assignmentSubmission && assignmentSubmission.files.length > 0 && (
                  <div className="submitted-files">
                    <div className="panel-subtitle">
                      Submitted: {assignmentSubmission.files.length}
                    </div>
                    <ul className="files-list">
                      {assignmentSubmission.files.map((file) => (
                        <li
                          key={file.id}
                          className={`file-item ${
                            selectedFile?.id === file.id ? "active" : ""
                          }`}
                        >
                          <button
                            className="file-name-btn"
                            onClick={() => handleViewCode(file)}
                            style={{ background: "none", border: "none", cursor: "pointer", padding: 0, flex: 1, textAlign: "left" }}
                          >
                            {file.fileName}
                          </button>
                          <button
                            className="btn-remove-small"
                            onClick={() => handleDeleteFile(file.id)}
                            disabled={deleting}
                          >
                            ✕
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Marks Section */}
                {assignmentSubmission && assignmentSubmission.status === "evaluated" && (
                  <div className="marks-box">
                    <div className="marks-label">Score</div>
                    <div className="marks-value">
                      {assignmentSubmission.marks}/{assignmentSubmission.totalMarks}
                    </div>
                    {assignmentSubmission.viewTestResults && (
                      <button
                        onClick={handleViewResults}
                        className="btn-results"
                      >
                        View Results
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Right: Code Viewer */}
              <div className="code-panel">
                {codeContent ? (
                  <div className="code-box">
                    <div className="code-header">{codeName}</div>
                    <pre className="code-display">{codeContent}</pre>
                  </div>
                ) : (
                  <div className="code-empty">
                    <p>Select a file to view code</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Test Results Modal */}
      {showTestResults && testResults && (
        <div className="modal-overlay" onClick={() => setShowTestResults(false)}>
          <div
            className="modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Test Results</h3>
              <button
                onClick={() => setShowTestResults(false)}
                className="btn-close-modal"
              >
                ✕
              </button>
            </div>

            <div className="modal-content">
              <div className="score-display">
                <span className="score">
                  {testResults.submission.marks}/{testResults.submission.totalMarks}
                </span>
              </div>

              <div className="results-list">
                {testResults.testResults.map((test, index) => (
                  <div
                    key={index}
                    className={`result-item ${test.passed ? "pass" : "fail"}`}
                  >
                    <span className="result-badge">
                      {test.passed ? "✓" : "✗"}
                    </span>
                    <div className="result-info">
                      <p className="result-name">{test.testCase}</p>
                      <p className="result-details">
                        Expected: {test.expected} | Got: {test.actual}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button
                onClick={() => setShowTestResults(false)}
                className="btn-close-results"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
