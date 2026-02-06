import { useState, useEffect } from "react";
import "./testCaseManager.css";

export default function TestCaseManager({ assignment, onBack, token, darkMode, setDarkMode }) {
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState(null);

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
      // Ensure marks are converted to numbers
      const testCasesWithNumericMarks = (data || []).map(tc => ({
        ...tc,
        marks: typeof tc.marks === 'string' ? parseFloat(tc.marks) : tc.marks
      }));
      setTestCases(testCasesWithNumericMarks);
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
      const method = editingTestCase ? "PATCH" : "POST";
      const endpoint = editingTestCase 
        ? `http://localhost:5000/admin/test-cases/${editingTestCase.id}`
        : `http://localhost:5000/admin/assignments/${assignment.id}/test-cases`;

      const response = await fetch(endpoint, {
        method,
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
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to ${editingTestCase ? 'update' : 'create'} test case`);
      }

      const responseData = await response.json();
      setSuccessMessage(`✓ Test case ${editingTestCase ? 'updated' : 'created'} successfully!`);
      setTimeout(() => setSuccessMessage(""), 3000);

      // Reset form
      setNewTestCase({
        testName: "",
        testCode: "",
        marks: 1,
        isHidden: false,
      });
      setShowForm(false);
      setEditingTestCase(null);

      // Refresh list
      fetchTestCases();
    } catch (err) {
      setError(`Error ${editingTestCase ? 'updating' : 'creating'} test case: ` + err.message);
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

  const handleEditTestCase = (testCase) => {
    setEditingTestCase(testCase);
    setNewTestCase({
      testName: testCase.testName,
      testCode: testCase.testCode,
      marks: testCase.marks || 1,
      isHidden: testCase.isHidden || false,
    });
    setShowForm(true);
  };

  const handleCancelEdit = () => {
    setEditingTestCase(null);
    setNewTestCase({
      testName: "",
      testCode: "",
      marks: 1,
      isHidden: false,
    });
    setShowForm(false);
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
              onClick={() => {
                if (editingTestCase) {
                  handleCancelEdit();
                } else {
                  setShowForm(!showForm);
                }
              }}
            >
              {editingTestCase ? "✕ Cancel Edit" : showForm ? "✕ Cancel" : "+ Add Test Case"}
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
                  placeholder="Enter test code with assertions (e.g., assertEquals(5+5, 10), assertTrue(isValid()))"
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
                  min="0.01"
                  step="0.01"
                  value={newTestCase.marks}
                  onChange={(e) =>
                    setNewTestCase({
                      ...newTestCase,
                      marks: parseFloat(e.target.value),
                    })
                  }
                />
              </div>

              <button type="submit" className="btn-submit" disabled={uploading}>
                {uploading ? (editingTestCase ? "Updating..." : "Creating...") : (editingTestCase ? "Update Test Case" : "Create Test Case")}
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
                      <span className="tc-marks">Marks: {Number(testCase.marks).toFixed(2)}</span>
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="btn-primary"
                        onClick={() => handleEditTestCase(testCase)}
                        style={{ padding: "6px 12px", fontSize: "0.85rem" }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn-danger"
                        onClick={() => handleDeleteTestCase(testCase.id)}
                      >
                        🗑️ Delete
                      </button>
                    </div>
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
              <strong>{testCases.reduce((sum, tc) => sum + (Number(tc.marks) || 0), 0).toFixed(2)}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>  
  );
}