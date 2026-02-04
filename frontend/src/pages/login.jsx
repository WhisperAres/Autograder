import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";

export default function Login({ setIsAuthenticated, setUserRole, setUser }) {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved ? JSON.parse(saved) : false;
    });
    const navigate = useNavigate();

    // Apply theme to document root
    useEffect(() => {
        if (darkMode) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
    }, [darkMode]);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await fetch(
                "http://localhost:5000/auth/login",
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                }
            );

            const data = await response.json();

            if (response.ok) {
                localStorage.setItem("token", data.token);
                localStorage.setItem("user", JSON.stringify(data.user));
                setIsAuthenticated(true);
                setUserRole(data.user.role);
                setUser(data.user);
                navigate(`/${data.user.role}`);
            } else {
                setError(data.message || "Login failed");
            }
        } catch (error) {
            console.error("Login error:", error);
            setError("Connection error. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const quickLogin = (credentials) => {
        setEmail(credentials.email);
        setPassword(credentials.password);
    };

    return (
        <div className="login-container">
            {/* Theme Toggle */}
            <button
                onClick={() => setDarkMode(!darkMode)}
                className="theme-toggle"
                title="Toggle theme"
            >
                {darkMode ? "☀️" : "🌙"}
            </button>

            <div className="login-wrapper">
                {/* Main Login Card */}
                <div className="login-card">
                    <div className="login-header">
                        <h1 className="brand-title">Autograder</h1>
                    </div>

                    <form onSubmit={handleLogin} className="login-form">
                        <div className="form-group">
                            <label htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                placeholder="Enter email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                                className="form-input"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                placeholder="Enter password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                                className="form-input"
                            />
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <button
                            type="submit"
                            className="btn-login"
                            disabled={loading}
                        >
                            {loading ? "Logging in..." : "Login"}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
