import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import './App.css'
import Login from './pages/login'
import Dashboard from './pages/dashboard'
import GraderDashboard from './pages/grader'
import AdminDashboard from './pages/admin'
import InviteStudents from './pages/inviteStudents'
import StudentSignup from './pages/studentSignup'

function App() {
  const initializeAuth = () => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    
    if (token && storedUser) {
      const parsed = JSON.parse(storedUser)
      const normalizedRole = (parsed.role === 'ta' || parsed.role === 'TA') ? 'grader' : parsed.role;
      const userData = { ...parsed, role: normalizedRole };
      return { isAuth: true, role: userData.role, user: userData }
    }
    return { isAuth: false, role: null, user: null }
  }

  const authState = initializeAuth()
  const [isAuthenticated, setIsAuthenticated] = useState(authState.isAuth)
  const [userRole, setUserRole] = useState(authState.role)
  const [user, setUser] = useState(authState.user)

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setIsAuthenticated(false)
    setUserRole(null)
    setUser(null)
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={
            isAuthenticated ? 
            (userRole === 'grader' ? <Navigate to="/grader/dashboard" replace={true} /> : <Navigate to={`/${userRole}`} replace={true} />) : 
            <Login setIsAuthenticated={setIsAuthenticated} setUserRole={setUserRole} setUser={setUser} />
          } 
        />
        <Route
          path="/student"
          element={
            isAuthenticated && userRole === 'student' ?
            <Navigate to="/student/dashboard" /> :
            <Navigate to="/login" />
          }
        />

        <Route
          path="/student/dashboard"
          element={
            isAuthenticated && userRole === 'student' ?
            <Dashboard handleLogout={handleLogout} user={user} /> :
            <Navigate to="/login" />
          }
        />

        <Route
          path="/student/submit/:assignmentId"
          element={
            isAuthenticated && userRole === 'student' ?
            <Dashboard handleLogout={handleLogout} user={user} /> :
            <Navigate to="/login" />
          }
        />

        <Route
          path="/student/view-results/:submissionId"
          element={
            isAuthenticated && userRole === 'student' ?
            <Dashboard handleLogout={handleLogout} user={user} /> :
            <Navigate to="/login" />
          }
        />

        <Route
          path="/grader"
          element={
            isAuthenticated && userRole === 'grader' ? (
              <Navigate to="/grader/dashboard" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/grader/dashboard"
          element={
            isAuthenticated && userRole === 'grader' ? (
              <div className="with-navbar">
                <nav className="navbar">
                  <div className="navbar-content">
                    <h2 className="navbar-title">Autograder - Grader</h2>
                    <div className="navbar-user">
                      <span>{user?.name}</span>
                      <button className="logout-btn" onClick={handleLogout}>Logout</button>
                    </div>
                  </div>
                </nav>
                <GraderDashboard />
              </div>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/grader/test-solutions/:assignmentId"
          element={
            isAuthenticated && userRole === 'grader' ? (
              <div className="with-navbar">
                <nav className="navbar">
                  <div className="navbar-content">
                    <h2 className="navbar-title">Autograder - Grader</h2>
                    <div className="navbar-user">
                      <span>{user?.name}</span>
                      <button className="logout-btn" onClick={handleLogout}>Logout</button>
                    </div>
                  </div>
                </nav>
                <GraderDashboard />
              </div>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/grader/grade-submissions/:assignmentId"
          element={
            isAuthenticated && userRole === 'grader' ? (
              <div className="with-navbar">
                <nav className="navbar">
                  <div className="navbar-content">
                    <h2 className="navbar-title">Autograder - Grader</h2>
                    <div className="navbar-user">
                      <span>{user?.name}</span>
                      <button className="logout-btn" onClick={handleLogout}>Logout</button>
                    </div>
                  </div>
                </nav>
                <GraderDashboard />
              </div>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/grader/dashboard"
          element={
            isAuthenticated && userRole === 'grader' ? (
              <div className="with-navbar">
                <nav className="navbar">
                  <div className="navbar-content">
                    <h2 className="navbar-title">Autograder - Grader</h2>
                    <div className="navbar-user">
                      <span>{user?.name}</span>
                      <button className="logout-btn" onClick={handleLogout}>Logout</button>
                    </div>
                  </div>
                </nav>
                <GraderDashboard />
              </div>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/admin"
          element={
            isAuthenticated && userRole === 'admin' ?
            <Navigate to="/admin/dashboard" /> :
            <Navigate to="/login" />
          }
        />

        <Route
          path="/admin/dashboard"
          element={
            isAuthenticated && userRole === 'admin' ? (
              <div className="with-navbar">
                <nav className="navbar">
                  <div className="navbar-content">
                    <h2 className="navbar-title">Autograder - Admin</h2>
                    <div className="navbar-user">
                      <span>{user?.name}</span>
                      <button className="logout-btn" onClick={handleLogout}>Logout</button>
                    </div>
                  </div>
                </nav>
                <AdminDashboard />
              </div>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/admin/test-cases-management/:assignmentId"
          element={
            isAuthenticated && userRole === 'admin' ? (
              <div className="with-navbar">
                <nav className="navbar">
                  <div className="navbar-content">
                    <h2 className="navbar-title">Autograder - Admin</h2>
                    <div className="navbar-user">
                      <span>{user?.name}</span>
                      <button className="logout-btn" onClick={handleLogout}>Logout</button>
                    </div>
                  </div>
                </nav>
                <AdminDashboard />
              </div>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/admin/grade-submission/:submissionId"
          element={
            isAuthenticated && userRole === 'admin' ? (
              <div className="with-navbar">
                <nav className="navbar">
                  <div className="navbar-content">
                    <h2 className="navbar-title">Autograder - Admin</h2>
                    <div className="navbar-user">
                      <span>{user?.name}</span>
                      <button className="logout-btn" onClick={handleLogout}>Logout</button>
                    </div>
                  </div>
                </nav>
                <AdminDashboard />
              </div>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route
          path="/student-signup"
          element={
            <StudentSignup />
          }
        />

        <Route
          path="/admin/invite-students"
          element={
            isAuthenticated && userRole === 'admin' ? (
              <div className="with-navbar">
                <nav className="navbar">
                  <div className="navbar-content">
                    <h2 className="navbar-title">Autograder - Admin</h2>
                    <div className="navbar-user">
                      <span>{user?.name}</span>
                      <button className="logout-btn" onClick={handleLogout}>Logout</button>
                    </div>
                  </div>
                </nav>
                <InviteStudents />
              </div>
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        <Route 
          path="/" 
          element={
            isAuthenticated ? 
            <Navigate to={`/${userRole}`} /> : 
            <Navigate to="/login" />
          } 
        />
      </Routes>
    </Router>
  )
}

export default App
