import { useState, useEffect } from "react";
import Modal from "../components/Modal";
import "./testCaseManager.css";

export default function TestCaseManager({ assignment, onBack, token, darkMode, setDarkMode }) {
  const [testCases, setTestCases] = useState([]);
  const [selectedTestCase, setSelectedTestCase] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [editingTestCase, setEditingTestCase] = useState(null);

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
        `http://localhost:5000/admin/page/test-cases-management/${assignment.id}`,
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
      showModal('Error', 'Error loading test cases: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTestCase = async (e) => {
    e.preventDefault();

    if (!newTestCase.testName.trim()) {
      showModal('Validation Error', 'Test case name is required', 'error');
      return;
    }
    if (!newTestCase.testCode.trim()) {
      showModal('Validation Error', 'Test code is required', 'error');
      return;
    }

    setUploading(true);
    try {
      const method = editingTestCase ? "PATCH" : "POST";
      const endpoint = editingTestCase
        ? `http://localhost:5000/admin/page/test-cases-management/${editingTestCase.id}`
        : `http://localhost:5000/admin/page/test-cases-management/${assignment.id}`;

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
      showModal('Success', `Test case ${editingTestCase ? 'updated' : 'created'} successfully!`, 'success');

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
      showModal('Error', `Error ${editingTestCase ? 'updating' : 'creating'} test case: ` + err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTestCase = async (testCaseId) => {
    showModal(
      'Confirm Deletion',
      'Are you sure you want to delete this test case?',
      'warning',
      [
        { label: 'Cancel', onClick: () => setIsModalOpen(false) },
        {
          label: 'Delete', onClick: async () => {
            setIsModalOpen(false);
            try {
              const response = await fetch(
                `http://localhost:5000/admin/page/test-cases-management/${testCaseId}`,
                {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${token}` },
                }
              );

              if (!response.ok) throw new Error("Failed to delete test case");

              showModal('Success', 'Test case deleted!', 'success');
            } catch (err) {
              showModal('Error', 'Failed to delete test case: ' + err.message, 'error');
            }
          }
        }
      ]
    );
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

        <div className="tcm-header">
          <button className="btn-back" onClick={onBack}>
            ← Back to Assignments
          </button>
          <div className="tcm-title">
            <h3>{assignment.title}</h3>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="theme-toggle"
            title="Toggle theme"
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>

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

            {/* List + controls (left column) */}
            {showForm && !editingTestCase && (
              <div className="empty-state" style={{ marginBottom: '1rem' }}>
                <p>Use the editor on the right to add a new test case.</p>
              </div>
            )}

            {testCases.length === 0 ? (
              <div className="empty-state">
                <p>No test cases yet.</p>
              </div>
            ) : (
              <div className="test-cases-list">
                <div className="names-list">
                  {testCases.map((testCase) => (
                    <button
                      key={testCase.id}
                      className={`name-item ${selectedTestCase && selectedTestCase.id === testCase.id ? 'active' : ''}`}
                      onClick={() => { setSelectedTestCase(testCase); setShowForm(false); setEditingTestCase(null); }}
                    >
                      {testCase.testName}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div className="tcm-sidebar">
            {/* Right pane: either editor (create/edit) or selected test case details */}
            {showForm || editingTestCase ? (
              <div className="tcm-section">
                <div className="section-header">
                  <h2>{editingTestCase ? "Edit Test Case" : "New Test Case"}</h2>
                </div>

                <form onSubmit={handleCreateTestCase} className="test-case-form">
                  <div className="form-group">
                    <label>Test Case Name *</label>
                    <input
                      type="text"
                      placeholder="e.g., Test Case 1"
                      value={newTestCase.testName}
                      onChange={(e) =>
                        setNewTestCase({ ...newTestCase, testName: e.target.value })
                      }
                    />
                  </div>

                  <div className="form-group">
                    <label>Test Code *</label>
                    <textarea
                      style={{ fontFamily: 'monospace' }}
                      placeholder="Enter test code here..."
                      value={newTestCase.testCode}
                      onChange={(e) =>
                        setNewTestCase({ ...newTestCase, testCode: e.target.value })
                      }
                      rows="12"
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
                    {/* Display marks info */}
                    {(() => {
                      const currentTotalMarks = testCases.reduce((sum, tc) => sum + (Number(tc.marks) || 0), 0);
                      const assignmentTotal = Number(assignment.totalMarks) || 100;
                      const newMarks = Number(newTestCase.marks) || 0;
                      // If editing, exclude the current test case marks from total before adding new marks
                      const totalWithoutCurrent = editingTestCase
                        ? currentTotalMarks - (Number(editingTestCase.marks) || 0)
                        : currentTotalMarks;
                      const projectedTotal = totalWithoutCurrent + newMarks;
                      const willExceed = projectedTotal > assignmentTotal;

                      return (
                        <div style={{
                          marginTop: "8px",
                          fontSize: "0.85rem",
                          color: willExceed ? "#dc2626" : "var(--text-muted)",
                          fontWeight: willExceed ? "600" : "normal"
                        }}>

                          {willExceed && (
                            <div style={{ marginTop: "6px", color: "#dc2626" }}>
                              Total Marks for assignment: {assignmentTotal.toFixed(2)}<br />
                              ⚠️ Current Total Marks:  {projectedTotal.toFixed(2)}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  <button
                    type="submit"
                    className="btn-submit"
                    disabled={uploading || (() => {
                      const currentTotalMarks = testCases.reduce((sum, tc) => sum + (Number(tc.marks) || 0), 0);
                      const assignmentTotal = Number(assignment.totalMarks) || 100;
                      const projectedTotal = currentTotalMarks;
                      return projectedTotal > assignmentTotal;
                    })()}
                  >
                    {uploading ? (editingTestCase ? "Updating..." : "Creating...") : (editingTestCase ? "Update Test Case" : "Create Test Case")}
                  </button>

                  {editingTestCase && (
                    <button type="button" className="btn-primary" style={{ marginTop: '10px' }} onClick={handleCancelEdit}>
                      ✕ Cancel Edit
                    </button>
                  )}
                </form>
              </div>
            ) : (
              <div className="tcm-section">
                {selectedTestCase ? (
                  <>
                    <div className="section-header">
                      <h2>{selectedTestCase.testName}</h2>
                    </div>
                    <div className="tc-content">
                      <div className="tc-section">
                        <h4>Test Code:</h4>
                        <pre className="test-data">{selectedTestCase.testCode}</pre>
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                        <button className="btn-primary" onClick={() => handleEditTestCase(selectedTestCase)}>Edit</button>
                        <button
                          className="btn-danger"
                          onClick={() => {
                            handleDeleteTestCase(selectedTestCase.id);
                            setSelectedTestCase(null);
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="empty-state">
                    <p>Select a test case name on the left to view details.</p>
                  </div>
                )}
                <div style={{ marginTop: '18px' }}>
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
            )}
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
    </div>
  );
}