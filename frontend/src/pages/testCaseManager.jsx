import { useState, useEffect } from "react";
import "./testCaseManager.css";

export default function TestCaseManager({ assignment, onBack, token, darkMode, setDarkMode }) {
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form states
  const [newTestCase, setNewTestCase] = useState({
    testName: "",
    testCode: "",
    marks: 1,
    isHidden: false,
  });

  // Fetch test cases
  useEffect(() => {
    fetchTestCases();
  }, [assignment.id]);

  const fetchTestCases = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/admin/assignments/${assignment.id}/test-cases`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!response.ok) throw new Error("Failed to fetch test cases");
      const data = await response.json();
      setTestCases(data || []);
    } catch (err) {
      setError("Error loading test cases: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestCase = async (e) => {
    e.preventDefault();
    setError("");

    if (!newTestCase.testName.trim()) {
      setError("Test case name is required");
      return;
    }
    if (!newTestCase.testCode.trim()) {
      setError("Test code is required");
      return;
    }

    setUploading(true);
    try {
      const response = await fetch(
        `http://localhost:5000/admin/assignments/${assignment.id}/test-cases`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            testName: newTestCase.testName,
            testCode: newTestCase.testCode,
            marks: newTestCase.marks,
            isHidden: newTestCase.isHidden,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create test case");
      }

      const responseData = await response.json();
      setSuccessMessage("✓ Test case created successfully!");
      setTimeout(() => setSuccessMessage(""), 3000);

      // Reset form
      setNewTestCase({
        testName: "",
        testCode: "",
        marks: 1,
        isHidden: false,
      });
      setShowForm(false);

      // Refresh list
      fetchTestCases();
    } catch (err) {
      setError("Error creating test case: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTestCase = async (testCaseId) => {
    if (!window.confirm("Delete this test case?")) return;

    try {
      const response = await fetch(
        `http://localhost:5000/admin/test-cases/${testCaseId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!response.ok) throw new Error("Failed to delete test case");

      setSuccessMessage("✓ Test case deleted!");
      setTimeout(() => setSuccessMessage(""), 3000);
      fetchTestCases();
    } catch (err) {
      setError("Error deleting test case: " + err.message);
    }
  };

  if (loading) {
    return (
      <div className="test-case-manager">
        <div className="loading">Loading test cases...</div>
      </div>
    );
  }

  return (
    <div>
    <div className="test-case-manager">
      {/* Theme Toggle */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="theme-toggle"
        title="Toggle theme"
      >
        {darkMode ? "☀️" : "🌙"}
      </button>

      <div className="tcm-header">
        <button className="btn-back" onClick={onBack}>
          ← Back to Assignments
        </button>
        <div className="tcm-title">
          <h1>📝 Manage Test Cases</h1>
          <p>{assignment.title}</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {successMessage && <div className="success-banner">{successMessage}</div>}

      <div className="tcm-content">
        <div className="tcm-section">
          <div className="section-header">
            <h2>Test Cases ({testCases.length})</h2>
            <button
              className="btn-primary"
              onClick={() => setShowForm(!showForm)}
            >
              {showForm ? "✕ Cancel" : "+ Add Test Case"}
            </button>
          </div>

          {showForm && (
            <form onSubmit={handleCreateTestCase} className="test-case-form">
              <div className="form-group">
                <label>Test Case Name *</label>
                <input
                  type="text"
                  placeholder="e.g., Test Case 1 - Array Sorting"
                  value={newTestCase.testName}
                  onChange={(e) =>
                    setNewTestCase({ ...newTestCase, testName: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Test Code *</label>
                <textarea
                  placeholder="Write your test code here"
                  value={newTestCase.testCode}
                  onChange={(e) =>
                    setNewTestCase({ ...newTestCase, testCode: e.target.value })
                  }
                  rows="8"
                  required
                  className="code-editor"
                />
              </div>

              <div className="form-group">
                <label>Marks *</label>
                <input
                  type="number"
                  min="1"
                  value={newTestCase.marks}
                  onChange={(e) =>
                    setNewTestCase({
                      ...newTestCase,
                      marks: parseInt(e.target.value),
                    })
                  }
                />
              </div>

              <button type="submit" className="btn-submit" disabled={uploading}>
                {uploading ? "Creating..." : "Create Test Case"}
              </button>
            </form>
          )}

          {testCases.length === 0 ? (
            <div className="empty-state">
              <p>No test cases yet. Add your first test case to get started!</p>
            </div>
          ) : (
            <div className="test-cases-list">
              {testCases.map((testCase) => (
                <div key={testCase.id} className="test-case-card">
                  <div className="tc-header">
                    <div className="tc-info">
                      <h3>{testCase.testName}</h3>
                      <span className="tc-marks">Marks: {testCase.marks || 1}</span>
                    </div>
                    <button
                      className="btn-danger"
                      onClick={() => handleDeleteTestCase(testCase.id)}
                    >
                      🗑️ Delete
                    </button>
                  </div>

                  <div className="tc-content">
                    <div className="tc-section">
                      <h4>Test Code:</h4>
                      <pre className="test-data">{testCase.testCode}</pre>
                    </div>
                    {testCase.isHidden && (
                      <div className="tc-hidden-badge">🔒 Hidden from students</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="tcm-sidebar">

          <div className="stats-box">
            <h3>Statistics</h3>
            <div className="stat">
              <span>Total Test Cases:</span>
              <strong>{testCases.length}</strong>
            </div>
            <div className="stat">
              <span>Total Marks:</span>
              <strong>{testCases.reduce((sum, tc) => sum + (tc.marks || 0), 0)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>  
  );
}