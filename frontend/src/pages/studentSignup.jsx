import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/auth';
import './studentSignup.css';

export default function StudentSignup() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : true;
  });

  // Validate token on component mount
  useEffect(() => {
    if (!token) {
      setError('Invalid invitation link. Please check the link and try again.');
      setLoading(false);
      return;
    }

    const validateToken = async () => {
      try {
        const response = await api.get(`/invite/validate/${token}`);
        setEmail(response.data.email);
        setTokenValid(true);
        setError('');
      } catch (err) {
        const message = err.response?.data?.message || 'Invalid or expired invitation link';
        setError(message);
        setTokenValid(false);
      } finally {
        setLoading(false);
      }
    };

    validateToken();
  }, [token]);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!password || !confirmPassword) {
      setError('Please enter password in both fields');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post('/invite/complete-signup', {
        token,
        password,
      });

      setSuccess('Account created successfully! Redirecting to login...');
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      const message = err.response?.data?.message || 'Error creating account';
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="signup-container" data-theme={darkMode ? 'dark' : 'light'}>
      <div className="signup-card">
        <div className="signup-header">
          <h1>Create Your Account</h1>
          <p>Welcome to Autograder! Complete your sign-up to get started.</p>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
            <p>Validating your invitation...</p>
          </div>
        ) : tokenValid ? (
          <form onSubmit={handleSignup} className="signup-form">
            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <div className="email-display">
                <input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="email-input"
                />
                <span className="lock-icon">🔒</span>
              </div>
              <p className="field-note">Your email address cannot be changed and will be your username</p>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="password-input-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter a secure password"
                  disabled={submitting}
                  className="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="toggle-password"
                  disabled={submitting}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <div className="password-requirements">
                <div className="requirement">
                  <span className={password.length >= 6 ? 'met' : 'unmet'}>✓</span>
                  At least 6 characters
                </div>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="password-input-wrapper">
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  disabled={submitting}
                  className="password-input"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="toggle-password"
                  disabled={submitting}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              {password && confirmPassword && (
                <div className="match-indicator">
                  {password === confirmPassword ? (
                    <span className="match">✓ Passwords match</span>
                  ) : (
                    <span className="no-match">✗ Passwords do not match</span>
                  )}
                </div>
              )}
            </div>

            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}

            <button
              type="submit"
              disabled={submitting}
              className="submit-button"
            >
              {submitting ? 'Creating Account...' : 'Create Account'}
            </button>

            <p className="login-link">
              Already have an account? <a href="/login">Sign in here</a>
            </p>
          </form>
        ) : (
          <div className="error-state">
            <div className="error-icon">⚠️</div>
            <p>{error}</p>
            <a href="/login" className="back-to-login">
              Back to Login
            </a>
          </div>
        )}
      </div>

      <div className="signup-footer">
        <p>© 2024 Autograder. All rights reserved.</p>
      </div>
    </div>
  );
}
