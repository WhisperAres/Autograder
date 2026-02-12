import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import TestCaseManager from "./testCaseManager";
import Modal from "../components/Modal";
import "./grader.css";
import axios from 'axios';

export default function GraderDashboard() {
  const [assignments, setAssignments] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [codeFiles, setCodeFiles] = useState([]);
  const [codeContent, setCodeContent] = useState("");
  const [codeName, setCodeName] = useState("");
  const [selectedFileId, setSelectedFileId] = useState(null);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [runningTests, setRunningTests] = useState(false);
  const [testResults, setTestResults] = useState([]);
  const [showTestCaseManager, setShowTestCaseManager] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem("darkMode");
    return saved ? JSON.parse(saved) : true;
  });

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalType, setModalType] = useState('info');
  const [modalActions, setModalActions] = useState([]);

  // Helper function to show modal
  const showModal = (title, message, type = 'info', actions = []) => {
    setModalTitle(title);
    setModalMessage(message);
    setModalType(type);
    setModalActions(actions.length > 0 ? actions : [{ label: 'OK', onClick: () => setIsModalOpen(false) }]);
    setIsModalOpen(true);
  };

  const token = localStorage.getItem("token");
  const params = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (darkMode) document.documentElement.setAttribute("data-theme", "dark");
    else document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  useEffect(() => {
    const fetchAssignments = async () => {
      setLoading(true);
      try {
        const res = await fetch("http://localhost:5000/grader/page/dashboard", { headers: { Authorization: `Bearer ${token}` } });
        if (!res.ok) throw new Error("Failed to fetch assignments");
        const data = await res.json();
        setAssignments(data || []);
      } catch (err) {
        showModal('Error', "Error loading assignments: " + err.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchAssignments();
  }, [token]);

  // Respond to route params (assignmentId -> open test manager, submissionId -> load submission)
  useEffect(() => {
    const { assignmentId, submissionId } = params || {};
    if (assignmentId && assignments.length > 0) {
      const found = assignments.find((a) => String(a.id) === String(assignmentId));
      if (found) {
        setSelectedAssignment(found);
        setShowTestCaseManager(true);
      }
    } else if (submissionId) {
      (async () => {
        try {
          const res = await fetch(`http://localhost:5000/grader/page/grade-submissions/${submissionId}`, { headers: { Authorization: `Bearer ${token}` } });
          if (!res.ok) throw new Error("Failed to fetch submission");
          const submission = await res.json();
          setSelectedAssignment({ id: submission.assignmentId, title: submission.assignmentTitle, totalMarks: submission.totalMarks });
          setSelectedSubmission(submission);
          await fetchCodeForSubmission(submission.id);
        } catch (err) {
        }
      })();
    } else {
      // No route params - reset to dashboard view
      setSelectedAssignment(null);
      setSelectedSubmission(null);
      setSubmissions([]);
      setCodeFiles([]);
      setCodeContent("");
      setTestResults([]);
      setShowTestCaseManager(false);
    }
  }, [params, assignments, token]);

  const fetchSubmissionsForAssignment = async (assignmentId) => {
    try {
      const res = await fetch(`http://localhost:5000/grader/page/submissions/${assignmentId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return setSubmissions([]);
      const data = await res.json();
      setSubmissions(data || []);
    } catch (err) {
      setSubmissions([]);
    }
  };

  const handleAssignmentClick = (assignment) => {
    setSelectedAssignment(assignment);
    setSelectedSubmission(null);
    setCodeFiles([]);
    setCodeContent("");
    setTestResults([]);
    setUploadFiles([]);
    // navigate to assignment-specific grader URL
    navigate(`/grader/grade-submissions/${assignment.id}`);
    // also fetch submissions
    fetchSubmissionsForAssignment(assignment.id);
  };

  const handleBackToAssignments = () => {
    setSelectedAssignment(null);
    setSelectedSubmission(null);
    setSubmissions([]);
    setCodeFiles([]);
    setCodeContent("");
    setTestResults([]);
    navigate("/grader/dashboard");
  };

  const fetchCodeForSubmission = async (submissionId) => {
    try {
      const res = await fetch(`http://localhost:5000/grader/page/grade-submissions/${submissionId}/code`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to fetch code");
      const files = await res.json();
      setCodeFiles(files || []);
      if (files && files.length > 0) {
        setSelectedFileId(0);
        setCodeContent(files[0].fileContent || "");
        setCodeName(files[0].fileName || "Code");
      }
    } catch (err) {
      showModal('Error', "Failed to fetch code: " + err.message, 'error');
    }
  };

  const handleViewCode = async (submission) => {
    setSelectedSubmission(submission);
    await fetchCodeForSubmission(submission.id);
  };

  const handleFileUpload = async () => {
    if ((uploadFiles.length === 0 && !uploadFile) || !selectedAssignment) {
      showModal('Error', "Please select files and an assignment", 'error');
      return;
    }
    setUploading(true);
    try {
      const form = new FormData();
      if (uploadFiles.length > 0) uploadFiles.forEach((f) => form.append("files", f));
      else form.append("files", uploadFile);

      const res = await fetch(`http://localhost:5000/grader/page/test-solutions/${selectedAssignment.id}/upload`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form });
      if (!res.ok) throw new Error("Failed to upload files");
      const data = await res.json();
      showModal('Success', `${data.fileCount || 1} file(s) uploaded`, 'success');
      if (data.files) {
        setCodeFiles(data.files);
        setSelectedFileId(0);
        setCodeContent(data.files[0].fileContent || "");
        setCodeName(data.files[0].fileName || "Code");
      }
      setUploadFiles([]);
      setUploadFile(null);
      // refresh submissions
      fetchSubmissionsForAssignment(selectedAssignment.id);
    } catch (err) {
      showModal('Error', "Error uploading files: " + err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (fileId) => {
    if (!fileId) return;
    try {
      const res = await fetch(`http://localhost:5000/grader/page/test-solutions/${fileId}/file/${fileId}/delete`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error("Failed to delete file");
      setCodeFiles((prev) => prev.filter((f) => f.id !== fileId));
      showModal('Success', "File deleted", 'success');
    } catch (err) {
      showModal('Error', "Error deleting file: " + err.message, 'error');
    }
  };

  const handleRunTests = async (assignment) => {
    setRunningTests(true);
    try {
      // Build payload with actual file contents
      const payload = {
        solutionFiles: codeFiles.map(f => ({
          fileName: f.fileName,
          fileContent: f.fileContent
        }))
      };

      if (!payload.solutionFiles || payload.solutionFiles.length === 0) {
        throw new Error("No solution files to test");
      }

      const res = await fetch(`http://localhost:5000/grader/page/test-solutions/${assignment.id}/run-tests`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error("Failed to run tests");
      const data = await res.json();
      setTestResults(data.results || []);
      showModal('Success', `Tests: ${data.passCount || 0}/${data.totalCount || 0}`, 'success');
    } catch (err) {
      showModal('Error', "Error running tests: " + err.message, 'error');
    } finally {
      setRunningTests(false);
    }
  };

  // Inactivity logout (30 minutes)
  useEffect(() => {
    let timeout;

    const resetTimer = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        // Perform logout after 30 minutes of inactivity
        handleLogout();
      }, 30 * 60 * 1000); // 30 minutes
    };

    // Add event listeners for user activity
    window.addEventListener('mousemove', resetTimer);
    window.addEventListener('keydown', resetTimer);

    // Start timer
    resetTimer();

    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener('mousemove', resetTimer);
      window.removeEventListener('keydown', resetTimer);
      if (timeout) clearTimeout(timeout);
    };
  }, [navigate]);

  const handleLogout = () => {
    // Clear localStorage token/user and navigate to login without full reload
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login', { replace: true });
  };

  // Ensure component respects SPA auth state (use localStorage)
  useEffect(() => {
    if (!localStorage.getItem('token')) {
      // if no token present, send the user to login
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  // Render
  if (showTestCaseManager && selectedAssignment) {
    return (
      <TestCaseManager
        assignment={selectedAssignment}
        token={token}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onBack={() => {
          setShowTestCaseManager(false);
          setSelectedAssignment(null);
          navigate('/grader/dashboard');
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="grader-dashboard">
        <div style={{ textAlign: "center", padding: "3rem" }}>📋 Loading assignments...</div>
      </div>
    );
  }

  // Assignment list view
  if (!selectedAssignment) {
    return (
      <div className="grader-dashboard">
        <div className="dashboard-header">
          <h1>✅ Grader Dashboard</h1>
          <p>Select an assignment to manage</p>
          <button onClick={() => setDarkMode(!darkMode)} className="theme-toggle">{darkMode ? '☀️' : '🌙'}</button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
          {assignments.length === 0 ? (
            <div className="empty-state"><p>No assignments available</p></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {assignments.map((a) => (
                <div key={a.id} className="assignment-card" style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--bg-secondary)', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, color: 'var(--primary)' }}>{a.title}</h3>
                    <div style={{ color: 'var(--text-muted)' }}>Marks - {a.totalMarks || 100}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={(e) => { e.stopPropagation(); handleAssignmentClick(a); }} className="btn-select">Grade Submissions</button>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedAssignment(a); setShowTestCaseManager(true); navigate(`/grader/test-solutions/${a.id}`); }} className="btn-manage-tests">Edit Test Cases</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Selected assignment view
  return (
    <div className="grader-dashboard">
      <div className="dashboard-header">
        <button className="btn-back" onClick={handleBackToAssignments}>← Back to Assignments</button>
        <button onClick={() => setDarkMode(!darkMode)} className="theme-toggle">{darkMode ? '☀️' : '🌙'}</button>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 20 }}>
        {/* only show error if a submission is actively selected */}
        {selectedSubmission && error && <div className="error-banner">{error}</div>}
        {successMessage && <div className="success-banner">{successMessage}</div>}

        <div style={{ display: 'flex', gap: 20 }}>
          {submissions.length > 0 && (
            <div style={{ width: 320 }} className="submissions-list-panel">
              <h2>Submissions</h2>
              <div className="submissions-list">
                {submissions.map((sub) => (
                  <div key={sub.id} className={`submission-item ${selectedSubmission && selectedSubmission.id === sub.id ? 'active' : ''}`} onClick={() => { handleViewCode(sub); navigate(`/grader/grade-submissions/${sub.id}`); }}>
                    <div className="submission-top">
                      <div>
                        <div className="student-id">{sub.studentName || sub.studentId || 'Student'}</div>
                        <div className="submitted-date">{sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : ''}</div>
                      </div>
                      <div className={`status-badge ${sub.status ? 'status-' + sub.status : ''}`}>{sub.status || 'pending'}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ flex: 1 }} className="submission-details-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div>
                <h1 style={{ margin: 0 }}>{selectedAssignment.title}</h1>
                <div style={{ color: 'var(--text-muted)' }}>Total Marks: <strong style={{ color: 'var(--primary)' }}>{selectedAssignment.totalMarks || 100}</strong></div>
              </div>
              <div />
            </div>

            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: 12, padding: 20, marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <h2 style={{ margin: 0, color: 'var(--primary)' }}>📤 Upload Your Solution</h2>
                <button className="btn-back" onClick={handleBackToAssignments}>[ Back ]</button>
              </div>

              <div style={{ border: '2px dashed var(--primary)', borderRadius: 8, padding: 30, textAlign: 'center', background: 'rgba(16,185,129,0.05)', marginBottom: 12 }}>
                <input id="grader-file-input" type="file" style={{ display: 'none' }} accept=".java,.py,.js,.cpp,.c,.txt" multiple onChange={(e) => { const files = Array.from(e.target.files || []); setUploadFiles(files); setUploadFile(files[0] || null); }} />
                <label htmlFor="grader-file-input" style={{ cursor: 'pointer' }}>
                  <p style={{ margin: 0 }}>📁 Click to upload</p>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 13 }}>or drag and drop files (.java, .py, .js, .cpp, .c, .txt)</p>
                </label>
              </div>

              {uploadFiles.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <p style={{ color: 'var(--primary)', margin: 0, marginBottom: 6 }}>✓ Selected Files ({uploadFiles.length})</p>
                  <ul style={{ margin: 0, paddingLeft: 20 }}>{uploadFiles.map((f, i) => <li key={i}>{f.name}</li>)}</ul>
                </div>
              )}

              <button className="btn btn-success" onClick={handleFileUpload} disabled={uploading || (uploadFiles.length === 0 && !uploadFile)} style={{ width: '100%' }}>{uploading ? '⏳ Uploading...' : 'Upload Solution(s)'}</button>
            </div>

            {/* Code viewer + tests */}
            {codeFiles.length > 0 && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 12, marginBottom: 12 }}>
                  <div style={{ borderRight: '1px solid var(--border)', padding: 12 }}>
                    {codeFiles.map((f, i) => (
                      <button key={i} onClick={() => { setSelectedFileId(i); setCodeContent(f.fileContent || ''); setCodeName(f.fileName || 'Code'); }} style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 10px', marginBottom: 8 }}>{f.fileName}</button>
                    ))}
                  </div>
                  <div style={{ padding: 12 }}>
                    <h3 style={{ marginTop: 0 }}>💻 {codeName}</h3>
                    <pre style={{ background: 'var(--dark-secondary)', padding: 12, borderRadius: 8, maxHeight: 400, overflow: 'auto' }}><code>{codeContent}</code></pre>
                  </div>
                </div>

                <button className="btn btn-primary" onClick={() => handleRunTests(selectedAssignment)} disabled={runningTests} style={{ width: '100%' }}>{runningTests ? '⏳ Running...' : '▶ Run Tests'}</button>

                {testResults.length > 0 && (
                  <div style={{ marginTop: 12 }}>
                    {testResults.map((r, idx) => (
                      <div key={idx} style={{ padding: 10, borderRadius: 6, marginBottom: 8, background: r.passed ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', border: `1px solid ${r.passed ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)'}` }}>
                        <strong>{r.passed ? '✅' : '❌'} {r.testName}</strong>
                        {r.errorMessage && <p style={{ margin: 6, color: '#fca5a5' }}>{r.errorMessage}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalTitle}
        message={modalMessage}
        type={modalType}
        actions={modalActions}
      />
    </div>
  );
}

