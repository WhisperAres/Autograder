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
                <div className="back-header">
                  <button className="btn-back" onClick={() => setSelectedAssignment(null)}>← Back</button>
                  <h2>{selectedAssignment.title}</h2>
                  <button className="btn btn-danger" onClick={() => {
                    handleDeleteAssignment(selectedAssignment.id);
                  }}>🗑️ Delete</button>
                </div>

                <div className="details-tabs">
                  <button
                    className={`tab-btn ${detailsTab === "submissions" ? "active" : ""}`}
                    onClick={() => setDetailsTab("submissions")}
                  >
                    📝 Submissions ({assignmentSubmissions.length})
                  </button>
                  <button
                    className={`tab-btn ${detailsTab === "code" ? "active" : ""}`}
                    onClick={() => setDetailsTab("code")}
                  >
                    👀 Code
                  </button>
                  <button
                    className={`tab-btn ${detailsTab === "marks" ? "active" : ""}`}
                    onClick={() => setDetailsTab("marks")}
                  >
                    ✏️ Edit Marks
                  </button>
                </div>

                {/* Submissions List */}
                {detailsTab === "submissions" && (
                  <div className="submissions-list">
                    {assignmentSubmissions.length === 0 ? (
                      <p>No submissions yet</p>
                    ) : (
                      assignmentSubmissions.map(submission => (
                        <div
                          key={submission.id}
                          className={`submission-item ${selectedSubmission?.id === submission.id ? "active" : ""}`}
                          onClick={() => {
                            setSelectedSubmission(submission);
                            setSubmissionMarks(submission.marks || "");
                          }}
                        >
                          <div className="submission-info">
                            <h4>{submission.student?.name || "Unknown"}</h4>
                            <p className="submission-email">{submission.student?.email}</p>
                            <div className="submission-meta">
                              <span className={`status-badge ${submission.status}`}>{submission.status}</span>
                              <span className="marks-badge">{submission.marks || 0}/{submission.totalMarks}</span>
                              <span>{new Date(submission.submittedAt).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {/* Code View */}
                {detailsTab === "code" && selectedSubmission && (
                  <div className="code-view">
                    {selectedSubmission.codeFiles && selectedSubmission.codeFiles.length > 0 ? (
                      selectedSubmission.codeFiles.map((file, idx) => (
                        <div key={idx} className="code-file">
                          <div className="code-header">
                            <h4>{file.fileName}</h4>
                          </div>
                          <pre><code>{file.fileContent}</code></pre>
                        </div>
                      ))
                    ) : (
                      <p>No code files found</p>
                    )}

                    <button
                      className="btn btn-primary"
                      onClick={() => handleRunTests(selectedSubmission.id)}
                    >
                      ▶️ Run Tests
                    </button>

                    {testResults && (
                      <div className="test-results">
                        <h4>Test Results:</h4>
                        {testResults.map((result, idx) => (
                          <div key={idx} className={`test-result ${result.passed ? "passed" : "failed"}`}>
                            <p><strong>{result.testName}</strong> - {result.passed ? "✅ PASSED" : "❌ FAILED"}</p>
                            {!result.passed && result.errorMessage && <p className="error">{result.errorMessage}</p>}
                          </div>
                        ))}
                      </div>
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
