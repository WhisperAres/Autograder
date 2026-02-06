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
  const [codeFiles, setCodeFiles] = useState([]);
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [testResults, setTestResults] = useState([]);
  const [runningTests, setRunningTests] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [marks, setMarks] = useState("");
  const [feedback, setFeedback] = useState("");
  const [tab, setTab] = useState("details"); // details, code, feedback
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [currentSolutionId, setCurrentSolutionId] = useState(null);
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
    setUploadFile(null);
    setUploadFiles([]);
  };

  const handleBackToAssignments = () => {
    setSelectedAssignment(null);
    setSelectedSubmission(null);
    setSubmissions([]);
    setCodeContent("");
    setTestResults([]);
    setTab("details");
    setUploadFile(null);
    setUploadFiles([]);
  };

  const handleFileUpload = async () => {
    if (uploadFiles.length === 0 && !uploadFile) {
      setError("Please select at least one file");
      return;
    }

    setUploading(true);
    setError("");
    
    const formData = new FormData();
    
    // Support both single file and multiple files
    if (uploadFiles.length > 0) {
      uploadFiles.forEach(file => {
        formData.append("files", file);
      });
    } else if (uploadFile) {
      formData.append("files", uploadFile);
    }

    try {
      const response = await fetch(
        `http://localhost:5000/grader/solutions/${selectedAssignment.id}`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Failed to upload files");
      
      const data = await response.json();
      setSuccessMessage(`${data.fileCount || 1} file(s) uploaded successfully!`);
      
      // Store solution ID and files
      if (data.files) {
        setCurrentSolutionId(data.solutionId);
        setCodeFiles(data.files);
        // Show first file by default
        if (data.files.length > 0) {
          setSelectedFileId(0);
          setCodeContent(data.files[0].fileContent);
          setCodeName(data.files[0].fileName);
        }
      }
      
      setUploadFile(null);
      setUploadFiles([]);
      setTab("code");
      
      setTimeout(() => setSuccessMessage(""), 4000);
    } catch (err) {
      setError("Error uploading files: " + err.message);
    } finally {
      setUploading(false);
    }
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

  const handleSelectFile = (fileIndex) => {
    setSelectedFileId(fileIndex);
    const file = codeFiles[fileIndex];
    setCodeContent(file.fileContent);
    setCodeName(file.fileName);
  };

  const handleDeleteFile = async (fileId) => {
    if (!currentSolutionId) return;
    
    try {
      setError("");
      const response = await fetch(
        `http://localhost:5000/grader/solutions/${currentSolutionId}/file/${fileId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to delete file");
      
      const data = await response.json();
      setSuccessMessage("File deleted successfully!");
      
      // Update file list
      const updatedFiles = codeFiles.filter(f => f.id !== fileId);
      setCodeFiles(updatedFiles);
      
      if (updatedFiles.length === 0) {
        setCodeContent("");
        setCodeName("");
        setSelectedFileId(null);
      } else {
        // Show first file
        setSelectedFileId(0);
        setCodeContent(updatedFiles[0].fileContent);
        setCodeName(updatedFiles[0].fileName);
      }
      
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Error deleting file: " + err.message);
    }
  };

  const handleDeleteAllFiles = async () => {
    if (!currentSolutionId) return;
    
    if (!window.confirm("Are you sure you want to delete all files?")) return;
    
    try {
      setError("");
      const response = await fetch(
        `http://localhost:5000/grader/solutions/${currentSolutionId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to delete solution");
      
      setSuccessMessage("All files deleted successfully!");
      setCodeFiles([]);
      setCodeContent("");
      setCodeName("");
      setSelectedFileId(null);
      setCurrentSolutionId(null);
      setTestResults([]);
      
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError("Error deleting files: " + err.message);
    }
  };

  const handleRunTests = async (assignment) => {
    setRunningTests(true);
    setError("");
    setTestResults([]);
    
    try {
      // Use saved solution ID if available
      let payload = {};
      
      if (currentSolutionId && codeFiles.length > 0) {
        payload = { solutionId: currentSolutionId };
      } else if (uploadFiles.length > 0 || uploadFile) {
        // Read file contents if not saved yet
        const filesToTest = uploadFiles.length > 0 ? uploadFiles : (uploadFile ? [uploadFile] : []);
        
        if (filesToTest.length === 0) {
          setError("Please upload files first");
          setRunningTests(false);
          return;
        }

        const solutionFiles = await Promise.all(
          filesToTest.map(file => 
            new Promise((resolve) => {
              const reader = new FileReader();
              reader.onload = (e) => {
                resolve({
                  fileName: file.name,
                  fileContent: e.target.result
                });
              };
              reader.readAsText(file);
            })
          )
        );
        
        payload = { solutionFiles };
      } else {
        setError("Please upload files first");
        setRunningTests(false);
        return;
      }

      const response = await fetch(
        `http://localhost:5000/grader/solutions/${assignment.id}/run-tests`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload)
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
          body: JSON.stringify({ feedback, marks: parseFloat(marks) }),
        }
      );

      if (!response.ok) throw new Error("Failed to submit feedback");
      
      setSuccessMessage("✓ Feedback submitted successfully!");
      setMarks("");
      setFeedback("");
      
      // Update submission status
      setSelectedSubmission({ ...selectedSubmission, status: "graded", marks: parseFloat(marks) });
      setSubmissions(submissions.map(sub =>
        sub.id === selectedSubmission.id
          ? { ...sub, status: "graded", marks: parseFloat(marks) }
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

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {assignments.length === 0 ? (
            <div className="empty-state">
              <p>No assignments available</p>
            </div>
          ) : (
            assignments.map((assignment) => (
              <div
                key={assignment.id}
                onClick={() => handleAssignmentClick(assignment)}
                style={{
                  padding: "12px 16px",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "16px",
                  transition: "all 0.15s ease"
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = "rgba(16, 185, 129, 0.06)"}
                onMouseLeave={(e) => e.currentTarget.style.background = "var(--bg-secondary)"}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h4 style={{ margin: "0 0 4px 0", color: "var(--primary)" }}>{assignment.title}</h4>
                  <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", display: "flex", gap: "12px", alignItems: "center" }}>
                    <span>📌 {assignment.totalMarks || 100} marks</span>
                    <span>📅 {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "No due date"}</span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button
                    className="btn-select"
                    onClick={(e) => { e.stopPropagation(); handleAssignmentClick(assignment); }}
                  >
                    Grade Submissions →
                  </button>
                  <button
                    className="btn-manage-tests"
                    onClick={(e) => { e.stopPropagation(); setSelectedAssignment(assignment); setShowTestCaseManager(true); }}
                    title="Edit test cases for this assignment"
                  >
                    ✏️ Edit Test Cases
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

      <button className="btn-back" onClick={handleBackToAssignments}>← Back to Assignments</button>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "20px" }}>
        <h1>{selectedAssignment.title}</h1>
        <p style={{ color: "var(--text-secondary)", marginBottom: "30px" }}>
          Total Marks: {selectedAssignment.totalMarks || 100}
        </p>

        {error && <div className="error-banner">{error}</div>}
        {successMessage && <div className="success-banner">{successMessage}</div>}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
          {/* Upload Solution */}
          <div style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "12px",
            padding: "25px"
          }}>
            <h2 style={{ marginTop: 0, color: "var(--primary)" }}>📤 Upload Your Solution</h2>
            <div style={{
              border: "2px dashed var(--primary)",
              borderRadius: "8px",
              padding: "30px",
              textAlign: "center",
              cursor: "pointer",
              marginBottom: "15px",
              background: "rgba(16, 185, 129, 0.05)"
            }}>
              <input
                type="file"
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  setUploadFiles(files);
                  setUploadFile(files[0] || null);
                }}
                style={{ display: "none" }}
                id="fileInput"
                accept=".java,.py,.js,.cpp,.c,.txt"
                multiple
              />
              <label htmlFor="fileInput" style={{ cursor: "pointer", display: "block" }}>
                <p style={{ margin: 0, marginBottom: "10px" }}>📁 Click to upload</p>
                <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.9rem" }}>
                  or drag and drop files (.java, .py, .js, .cpp, .c, .txt)
                </p>
              </label>
            </div>
            {uploadFiles.length > 0 && (
              <div style={{ marginBottom: "15px" }}>
                <p style={{ color: "var(--primary)", fontWeight: 600, marginBottom: "8px" }}>
                  ✓ Selected Files ({uploadFiles.length}):
                </p>
                <ul style={{ margin: 0, paddingLeft: "20px", color: "var(--text-secondary)" }}>
                  {uploadFiles.map((file, idx) => (
                    <li key={idx} style={{ fontSize: "0.9rem" }}>
                      {file.name}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <button
              className="btn btn-success"
              onClick={handleFileUpload}
              disabled={uploading || (uploadFiles.length === 0 && !uploadFile)}
              style={{ width: "100%" }}
            >
              {uploading ? "⏳ Uploading..." : "Upload Solution(s)"}
            </button>
          </div>

          {/* Code Viewer & Tests */}
          <div>
            {codeFiles.length > 0 && (
              <div style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                overflow: "hidden",
                marginBottom: "20px"
              }}>
                {/* File Tabs */}
                <div style={{
                  display: "flex",
                  borderBottom: "1px solid var(--border)",
                  overflowX: "auto",
                  padding: "0 15px"
                }}>
                  {codeFiles.map((file, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSelectFile(idx)}
                      style={{
                        padding: "12px 15px",
                        border: "none",
                        background: selectedFileId === idx ? "var(--bg-tertiary)" : "transparent",
                        borderBottom: selectedFileId === idx ? "3px solid var(--primary)" : "none",
                        color: selectedFileId === idx ? "var(--primary)" : "var(--text-secondary)",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        fontWeight: selectedFileId === idx ? 600 : 400,
                        whiteSpace: "nowrap"
                      }}
                    >
                      📄 {file.fileName}
                    </button>
                  ))}
                </div>

                {/* File Content */}
                <div style={{ padding: "25px" }}>
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "15px"
                  }}>
                    <h3 style={{ margin: 0, color: "var(--primary)" }}>💻 {codeName}</h3>
                    {codeFiles.length > 1 && (
                      <div style={{ display: "flex", gap: "10px" }}>
                        <button
                          onClick={() => handleDeleteFile(codeFiles[selectedFileId].id)}
                          style={{
                            padding: "6px 12px",
                            background: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            fontWeight: 500
                          }}
                          title="Delete this file"
                        >
                          🗑️ Delete
                        </button>
                        <button
                          onClick={handleDeleteAllFiles}
                          style={{
                            padding: "6px 12px",
                            background: "#7f1d1d",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "0.85rem",
                            fontWeight: 500
                          }}
                          title="Delete all files"
                        >
                          🗑️ Delete All
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <pre style={{
                    background: "var(--dark-secondary)",
                    padding: "15px",
                    borderRadius: "8px",
                    overflow: "auto",
                    maxHeight: "400px",
                    color: "var(--text-secondary)",
                    fontSize: "0.85rem",
                    margin: 0
                  }}>
                    <code>{codeContent}</code>
                  </pre>
                </div>
              </div>
            )}

            {codeFiles.length > 0 && (
              <button
                className="btn btn-primary"
                onClick={() => handleRunTests({ id: selectedAssignment.id })}
                disabled={runningTests}
                style={{ width: "100%" }}
              >
                {runningTests ? "⏳ Running..." : "▶ Run Tests"}
              </button>
            )}

            {testResults.length > 0 && (
              <div style={{
                background: "var(--bg-secondary)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "25px",
                marginTop: "20px"
              }}>
                <h3 style={{ marginTop: 0, color: "var(--primary)" }}>🧪 Test Results</h3>
                {testResults.map((result, idx) => (
                  <div
                    key={idx}
                    style={{
                      padding: "12px",
                      marginBottom: "10px",
                      borderRadius: "6px",
                      background: result.passed ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                      border: `1px solid ${result.passed ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`
                    }}
                  >
                    <strong style={{ color: result.passed ? "var(--primary)" : "#dc2626" }}>
                      {result.passed ? "✅" : "❌"} {result.testName}
                    </strong>
                    {!result.passed && result.errorMessage && (
                      <p style={{ margin: "8px 0 0 0", color: "#fca5a5", fontSize: "0.85rem" }}>
                        {result.errorMessage}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
