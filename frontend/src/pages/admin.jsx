import { useState, useEffect } from "react";
import "./admin.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [users, setUsers] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  
  const [activeTab, setActiveTab] = useState("assignments");
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [detailsTab, setDetailsTab] = useState("submissions");
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true;
  });
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

  // Form states
  const [newAssignment, setNewAssignment] = useState({ title: "", description: "", dueDate: "", totalMarks: 100 });
  const [newUser, setNewUser] = useState({ email: "", name: "", role: "student" });
  const [selectedUserRole, setSelectedUserRole] = useState("");
  const [submissionMarks, setSubmissionMarks] = useState("");
  const [testResults, setTestResults] = useState(null);
  const [bulkTestsRunning, setBulkTestsRunning] = useState(false);
  const [bulkTestResults, setBulkTestResults] = useState(null);

  // Fetch all data
  useEffect(() => {
    fetchAllData();
  }, [token]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [statsRes, assignRes, usersRes, submissionsRes] = await Promise.all([
        fetch("http://localhost:5000/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/admin/assignments", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("http://localhost:5000/admin/submissions", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (assignRes.ok) setAssignments(await assignRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (submissionsRes.ok) setSubmissions(await submissionsRes.json());
    } catch (err) {
      setError("Error loading data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  // Create new assignment
  const handleCreateAssignment = async (e) => {
    e.preventDefault();
    if (!newAssignment.title || !newAssignment.dueDate) {
      setError("Title and due date required");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/admin/assignments", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newAssignment),
      });

      if (!response.ok) throw new Error("Failed to create assignment");

      const data = await response.json();
      setAssignments([...assignments, data.assignment]);
      setNewAssignment({ title: "", description: "", dueDate: "", totalMarks: 100 });
      setError("");
      alert("Assignment created successfully!");
      fetchAllData();
    } catch (err) {
      setError("Error creating assignment: " + err.message);
    }
  };

  // Create new user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUser.email || !newUser.name) {
      setError("Email and name required");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/admin/users", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newUser),
      });

      if (!response.ok) throw new Error("Failed to create user");

      const data = await response.json();
      setUsers([...users, data.user]);
      setNewUser({ email: "", name: "", role: "student" });
      setError("");
      alert(`User created! Temp password: ${data.user.tempPassword}`);
      fetchAllData();
    } catch (err) {
      setError("Error creating user: " + err.message);
    }
  };

  // Update user role
  const handleUpdateUserRole = async (userId, role) => {
    try {
      const response = await fetch(`http://localhost:5000/admin/users/${userId}/role`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) throw new Error("Failed to update role");

      const data = await response.json();
      setUsers(users.map(u => u.id === userId ? data.user : u));
      alert("User role updated!");
      fetchAllData();
    } catch (err) {
      setError("Error updating user: " + err.message);
    }
  };

  // Update submission marks
  const handleUpdateMarks = async (submissionId, marks) => {
    try {
      const response = await fetch(`http://localhost:5000/admin/submissions/${submissionId}/marks`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ marks: parseInt(marks) }),
      });

      if (!response.ok) throw new Error("Failed to update marks");

      const data = await response.json();
      setSubmissions(submissions.map(s => s.id === submissionId ? data.submission : s));
      setSubmissionMarks("");
      alert("Marks updated successfully!");
    } catch (err) {
      setError("Error updating marks: " + err.message);
    }
  };

  // Run test cases
  const handleRunTests = async (submissionId) => {
    try {
      const response = await fetch(`http://localhost:5000/admin/submissions/${submissionId}/run-tests`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to run tests");

      const data = await response.json();
      setTestResults(data.results);
      alert(`Tests completed: ${data.passCount}/${data.totalCount} passed`);
    } catch (err) {
      setError("Error running tests: " + err.message);
    }
  };

  // Run tests for all students in assignment
  const handleBulkRunTests = async () => {
    if (!selectedAssignment) return;

    setBulkTestsRunning(true);
    setError("");
    setBulkTestResults(null);

    try {
      const response = await fetch(
        `http://localhost:5000/admin/assignments/${selectedAssignment.id}/run-all-tests`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to run tests");

      const data = await response.json();
      setBulkTestResults(data);
      setError("");
      alert(`Bulk test completed! Results saved.`);
    } catch (err) {
      setError("Error running bulk tests: " + err.message);
    } finally {
      setBulkTestsRunning(false);
    }
  };

  // Download marks CSV
  const handleDownloadCSV = async (assignmentId) => {
    try {
      const response = await fetch(`http://localhost:5000/admin/assignments/${assignmentId}/export-csv`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to download CSV");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `marks_${assignmentId}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      setError("Error downloading CSV: " + err.message);
    }
  };

  // Delete assignment
  const handleDeleteAssignment = async (assignmentId) => {
    if (!window.confirm("Delete this assignment and all submissions?")) return;

    try {
      const response = await fetch(`http://localhost:5000/admin/assignments/${assignmentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to delete assignment");

      setAssignments(assignments.filter(a => a.id !== assignmentId));
      setSelectedAssignment(null);
      alert("Assignment deleted!");
      fetchAllData();
    } catch (err) {
      setError("Error deleting assignment: " + err.message);
    }
  };

  if (loading) {
    return <div className="admin-dashboard"><div className="loading">Loading admin dashboard...</div></div>;
  }

  const assignmentSubmissions = selectedAssignment
    ? submissions.filter(s => s.assignmentId === selectedAssignment.id)
    : [];

  const studentUsers = users.filter(u => u.role === "student");
  const taUsers = users.filter(u => u.role === "ta");

  return (
    <div className="admin-dashboard">
      {/* Theme Toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="theme-toggle"
        title="Toggle theme"
      >
        {darkMode ? "☀️" : "🌙"}
      </button>

      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <p>Manage assignments, users, grades, and reports</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Main Tabs or Assignment Header */}
      {!selectedAssignment ? (
        <>
          {/* Main Tabs */}
          <div className="main-tabs">
            <button
              className={`tab-btn ${activeTab === "assignments" ? "active" : ""}`}
              onClick={() => { setActiveTab("assignments"); setSelectedAssignment(null); }}
            >
              📋 Assignments
            </button>
            <button
              className={`tab-btn ${activeTab === "users" ? "active" : ""}`}
              onClick={() => { setActiveTab("users"); setSelectedUserRole("student"); }}
            >
              👥 Users
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Assignment Header with Back Button */}
          <div style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border)",
            borderRadius: "8px",
            padding: "20px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap"
          }}>
            <button 
              className="btn-back" 
              onClick={() => setSelectedAssignment(null)}
              style={{ fontSize: "1rem", padding: "8px 16px" }}
            >
              ← Back to Assignments
            </button>
            <h1 style={{ margin: 0, flex: 1, minWidth: "200px" }}>
              {selectedAssignment.title}
            </h1>
            <button className="btn btn-danger" onClick={() => {
              handleDeleteAssignment(selectedAssignment.id);
            }}>🗑️ Delete</button>
          </div>
        </>
      )}

      {/* ASSIGNMENTS TAB */}
      {activeTab === "assignments" && (
        <div className="admin-content">
          {!selectedAssignment ? (
            <>
              {/* Assignments Grid */}
              <div className="assignments-section">
                <div className="section-header">
                  <h2>Assignments</h2>
                  <button className="btn btn-primary" onClick={() => document.getElementById("createAssignmentForm").style.display = 
                    document.getElementById("createAssignmentForm").style.display === "none" ? "block" : "none"}>
                    + New Assignment
                  </button>
                </div>

                {/* Create Assignment Form */}
                <form id="createAssignmentForm" onSubmit={handleCreateAssignment} className="form-panel" style={{display: "none"}}>
                  <h3>Create New Assignment</h3>
                  <div className="form-group">
                    <label>Title *</label>
                    <input
                      type="text"
                      value={newAssignment.title}
                      onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})}
                      placeholder="Assignment title"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={newAssignment.description}
                      onChange={(e) => setNewAssignment({...newAssignment, description: e.target.value})}
                      placeholder="Assignment description"
                      rows="3"
                    ></textarea>
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Due Date *</label>
                      <input
                        type="datetime-local"
                        value={newAssignment.dueDate}
                        onChange={(e) => setNewAssignment({...newAssignment, dueDate: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Total Marks</label>
                      <input
                        type="number"
                        value={newAssignment.totalMarks}
                        onChange={(e) => setNewAssignment({...newAssignment, totalMarks: parseInt(e.target.value)})}
                        min="1"
                      />
                    </div>
                  </div>
                  <button type="submit" className="btn btn-success">Create Assignment</button>
                </form>

                {/* Assignments Grid */}
                <div className="assignments-grid">
                  {assignments.map(assignment => (
                    <div
                      key={assignment.id}
                      className="assignment-card"
                      onClick={() => setSelectedAssignment(assignment)}
                    >
                      <div className="assignment-header">
                        <h3>{assignment.title}</h3>
                        <button
                          className="btn-icon"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownloadCSV(assignment.id);
                          }}
                          title="Download marks as CSV"
                        >
                          ⬇️
                        </button>
                      </div>
                      <p className="assignment-desc">{assignment.description}</p>
                      <div className="assignment-meta">
                        <span>📌 {assignment.totalMarks} marks</span>
                        <span>📅 {new Date(assignment.dueDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Assignment Details */}
              <div className="assignment-details-section">
                <div className="details-tabs">
                  <button
                    className={`tab-btn ${detailsTab === "submissions" ? "active" : ""}`}
                    onClick={() => setDetailsTab("submissions")}
                  >
                    📝 Submissions ({assignmentSubmissions.length})
                  </button>
                  <button
                    className={`tab-btn ${detailsTab === "marks" ? "active" : ""}`}
                    onClick={() => setDetailsTab("marks")}
                  >
                    ✏️ Edit Marks
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={handleBulkRunTests}
                    disabled={bulkTestsRunning || assignmentSubmissions.length === 0}
                    style={{ marginLeft: "auto" }}
                  >
                    {bulkTestsRunning ? "⏳ Running..." : "🧪 Run Tests for All"}
                  </button>
                </div>

                {bulkTestResults && (
                  <div style={{
                    background: "rgba(16, 185, 129, 0.1)",
                    border: "1px solid var(--primary)",
                    borderRadius: "8px",
                    padding: "15px",
                    marginBottom: "20px"
                  }}>
                    <h4 style={{ margin: "0 0 10px 0", color: "var(--primary)" }}>Bulk Test Results</h4>
                    <p style={{ margin: 0 }}>✅ Passed: {bulkTestResults.passCount || 0} | ❌ Failed: {bulkTestResults.failCount || 0}</p>
                  </div>
                )}

                {/* Submissions List */}
                {detailsTab === "submissions" && (
                  <div style={{ maxHeight: "800px", overflowY: "auto" }}>
                    {assignmentSubmissions.length === 0 ? (
                      <p>No submissions yet</p>
                    ) : (
                      assignmentSubmissions.map(submission => (
                        <div
                          key={submission.id}
                          style={{
                            background: "var(--bg-secondary)",
                            border: "1px solid var(--border)",
                            borderRadius: "8px",
                            marginBottom: "15px",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                          }}
                          onClick={() => {
                            setSelectedSubmission(submission.id === selectedSubmission?.id ? null : submission);
                            setSubmissionMarks(submission.marks || "");
                          }}
                        >
                          <div style={{
                            padding: "15px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "15px",
                            flexWrap: "wrap"
                          }}>
                            <div style={{ flex: 1, minWidth: "200px" }}>
                              <h4 style={{ margin: "0 0 5px 0", color: "var(--primary)" }}>
                                {submission.student?.name || "Unknown Student"}
                              </h4>
                              <p style={{ margin: "0 0 8px 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                                {submission.student?.email}
                              </p>
                              <div style={{ display: "flex", gap: "15px", fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                <span className={`status-badge ${submission.status}`}>{submission.status}</span>
                                <span className="marks-badge">{submission.marks || 0}/{submission.totalMarks}</span>
                                <span>📅 {new Date(submission.submittedAt).toLocaleString()}</span>
                              </div>
                            </div>
                            <div style={{ fontSize: "1.2rem", color: "var(--text-muted)" }}>
                              {selectedSubmission?.id === submission.id ? "▼" : "▶"}
                            </div>
                          </div>

                          {/* Inline Code View */}
                          {selectedSubmission?.id === submission.id && (
                            <div style={{
                              borderTop: "1px solid var(--border)",
                              padding: "15px",
                              background: "var(--dark-secondary)"
                            }}>
                              {submission.codeFiles && submission.codeFiles.length > 0 ? (
                                submission.codeFiles.map((file, idx) => (
                                  <div key={idx} style={{ marginBottom: idx < submission.codeFiles.length - 1 ? "20px" : "0" }}>
                                    <h5 style={{ margin: "0 0 10px 0", color: "var(--primary)" }}>
                                      📄 {file.fileName}
                                    </h5>
                                    <pre style={{
                                      background: "var(--bg-secondary)",
                                      padding: "12px",
                                      borderRadius: "6px",
                                      overflow: "auto",
                                      maxHeight: "300px",
                                      margin: 0,
                                      fontSize: "0.8rem",
                                      color: "var(--text-secondary)",
                                      border: "1px solid var(--border)"
                                    }}>
                                      <code>{file.fileContent}</code>
                                    </pre>
                                  </div>
                                ))
                              ) : (
                                <p style={{ margin: 0, color: "var(--text-muted)" }}>No code files</p>
                              )}

                              <button
                                className="btn btn-primary"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRunTests(submission.id);
                                }}
                                style={{ marginTop: "15px", width: "100%" }}
                              >
                                ▶️ Run Tests for This Submission
                              </button>

                              {testResults && (
                                <div style={{ marginTop: "15px" }}>
                                  <h5 style={{ margin: "0 0 10px 0", color: "var(--primary)" }}>Test Results:</h5>
                                  {testResults.map((result, idx) => (
                                    <div key={idx} style={{
                                      padding: "10px",
                                      marginBottom: "8px",
                                      borderRadius: "6px",
                                      background: result.passed ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                                      border: `1px solid ${result.passed ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`
                                    }}>
                                      <p style={{ margin: 0, fontWeight: 600, color: result.passed ? "var(--primary)" : "#dc2626" }}>
                                        {result.passed ? "✅" : "❌"} {result.testName}
                                      </p>
                                      {!result.passed && result.errorMessage && (
                                        <p style={{ margin: "5px 0 0 0", fontSize: "0.85rem", color: "#fca5a5" }}>
                                          {result.errorMessage}
                                        </p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Edit Marks */}
                {detailsTab === "marks" && selectedSubmission && (
                  <div className="marks-editor">
                    <div className="mark-item">
                      <h4>{selectedSubmission.student?.name}</h4>
                      <div className="mark-input-group">
                        <input
                          type="number"
                          min="0"
                          max={selectedSubmission.totalMarks}
                          value={submissionMarks}
                          onChange={(e) => setSubmissionMarks(e.target.value)}
                          placeholder="Enter marks"
                        />
                        <span className="max-marks">/ {selectedSubmission.totalMarks}</span>
                        <button
                          className="btn btn-success"
                          onClick={() => handleUpdateMarks(selectedSubmission.id, submissionMarks)}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* USERS TAB */}
      {activeTab === "users" && (
        <div className="users-section">
          <div className="section-header">
            <h2>User Management</h2>
            <button className="btn btn-primary" onClick={() => document.getElementById("createUserForm").style.display = 
              document.getElementById("createUserForm").style.display === "none" ? "block" : "none"}>
              + Add User
            </button>
          </div>

          {/* Create User Form */}
          <form id="createUserForm" onSubmit={handleCreateUser} className="form-panel" style={{display: "none"}}>
            <h3>Add New User</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  placeholder="user@example.com"
                />
              </div>
              <div className="form-group">
                <label>Name *</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  placeholder="Full name"
                />
              </div>
              <div className="form-group">
                <label>Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="student">Student</option>
                  <option value="ta">Grader (TA)</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <button type="submit" className="btn btn-success">Create User</button>
          </form>

          {/* Users Grid by Role */}
          <div className="users-grid">
            <div className="users-category">
              <h3>👨‍🎓 Students ({studentUsers.length})</h3>
              <div className="users-list">
                {studentUsers.map(user => (
                  <div key={user.id} className="user-card">
                    <div className="user-info">
                      <h4>{user.name}</h4>
                      <p>{user.email}</p>
                    </div>
                    <div className="user-actions">
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                        className="role-select"
                      >
                        <option value="student">Student</option>
                        <option value="ta">Grader</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="users-category">
              <h3>👨‍🏫 Graders ({taUsers.length})</h3>
              <div className="users-list">
                {taUsers.map(user => (
                  <div key={user.id} className="user-card">
                    <div className="user-info">
                      <h4>{user.name}</h4>
                      <p>{user.email}</p>
                    </div>
                    <div className="user-actions">
                      <select
                        value={user.role}
                        onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                        className="role-select"
                      >
                        <option value="student">Student</option>
                        <option value="ta">Grader</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Dashboard Stats */}
      {stats && (
        <div className="dashboard-stats">
          <div className="stat-card">
            <h4>📚 Assignments</h4>
            <p className="stat-number">{stats.totalAssignments}</p>
          </div>
          <div className="stat-card">
            <h4>👥 Total Users</h4>
            <p className="stat-number">{stats.totalUsers}</p>
          </div>
          <div className="stat-card">
            <h4>📝 Submissions</h4>
            <p className="stat-number">{stats.totalSubmissions}</p>
          </div>
          <div className="stat-card">
            <h4>⏳ Pending</h4>
            <p className="stat-number">{stats.pendingGrading}</p>
          </div>
        </div>
      )}
    </div>
  );
}
