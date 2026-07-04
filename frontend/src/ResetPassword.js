import React, { useState, useEffect } from "react";
import "./App.css";

export default function ResetPassword({ onBack, onLoginSuccess }) {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validating, setValidating] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Get token from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");

    if (urlToken) {
      setToken(urlToken);
      verifyToken(urlToken);
    } else {
      setValidating(false);
      setError("Reset token missing. Check the link in your email.");
    }
  }, []);

  // Auto-redirect on success after 3 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        onBack();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [success, onBack]);

  const verifyToken = async (resetToken) => {
    try {
      const response = await fetch(`http://localhost:8000/verify-reset-token/${resetToken}`);
      const data = await response.json();

      if (data.valid) {
        setTokenValid(true);
      } else {
        setError(data.error || "Invalid or expired token.");
      }
    } catch (err) {
      setError("Error verifying token. Try again.");
      console.error(err);
    } finally {
      setValidating(false);
    }
  };

  const validatePasswords = () => {
    if (!newPassword || !confirmPassword) {
      setError("Fill in both password fields.");
      return false;
    }

    if (newPassword.length < 8) {
      setError("Password must have at least 8 characters.");
      return false;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validatePasswords()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:8000/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok && data.status === "success") {
        setSuccess(true);
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setError(data.message || "Error resetting password.");
      }
    } catch (err) {
      setError("Network error. Try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animated-bg" style={{ minHeight: "100vh" }}>
      <header className="header">
        <div className="header-content">
          <div className="logo" onClick={onBack} style={{ cursor: "pointer" }}>
            🍳 SmartChef
          </div>
        </div>
      </header>

      <div style={{ maxWidth: "500px", margin: "4rem auto", padding: "2rem" }}>
        <div className="card" style={{ padding: "2.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔑</div>
            <h1 style={{ fontSize: "2rem", color: "var(--primary, #3B82F6)", marginBottom: "0.5rem" }}>
              Reset Password
            </h1>
            <p style={{ color: "#666", fontSize: "0.95rem" }}>
              Create a new password for your account
            </p>
          </div>

          {validating && (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <div className="spinner"></div>
              <p style={{ marginTop: "1rem", color: "#666" }}>Verifying token...</p>
            </div>
          )}

          {!validating && success && (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  background: "#F0F9FF",
                  border: "2px solid #3B82F6",
                  padding: "1.5rem",
                  borderRadius: "10px",
                  marginBottom: "2rem",
                }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>✅</div>
                <p style={{ color: "#3B82F6", fontWeight: "600", marginBottom: "0.5rem" }}>
                  Password reset successfully!
                </p>
                <p style={{ color: "#555", fontSize: "0.9rem" }}>
                  You can now sign in with your new password.
                </p>
              </div>

              <button className="btn btn-primary" onClick={onBack} style={{ width: "100%" }}>
                🔐 Go to Sign In
              </button>
            </div>
          )}

          {!validating && !success && tokenValid && (
            <form onSubmit={handleSubmit}>
              {error && (
                <div
                  style={{
                    background: "#F0F9FF",
                    border: "2px solid #f44336",
                    color: "#c62828",
                    padding: "1rem",
                    borderRadius: "8px",
                    marginBottom: "1.5rem",
                    fontSize: "0.9rem",
                  }}
                >
                  ⚠️ {error}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">New Password</label>
                <div style={{ position: "relative" }}>
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-input"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "12px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "1.2rem",
                    }}
                  >
                    {showPassword ? "👁️" : "👁️‍🗨️"}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Confirm Password</label>
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-input"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <div
                style={{
                  background: "#f5f5f5",
                  padding: "1rem",
                  borderRadius: "8px",
                  marginBottom: "1.5rem",
                  fontSize: "0.85rem",
                  color: "#666",
                }}
              >
                <p style={{ marginBottom: "0.5rem", fontWeight: "600" }}>Password requirements:</p>
                <ul style={{ marginLeft: "1.5rem", marginTop: "0.5rem" }}>
                  <li>Minimum 8 characters</li>
                  <li>Recommendation: mix digits and symbols</li>
                </ul>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  width: "100%",
                  padding: "0.9rem",
                  marginBottom: "1rem",
                }}
                disabled={loading}
              >
                {loading ? "Resetting..." : "🔓 Reset Password"}
              </button>
            </form>
          )}

          {!validating && !tokenValid && (
            <div style={{ textAlign: "center" }}>
              <div
                style={{
                  background: "#F0F9FF",
                  border: "2px solid #f44336",
                  padding: "1.5rem",
                  borderRadius: "10px",
                  marginBottom: "2rem",
                }}
              >
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>❌</div>
                <p style={{ color: "#c62828", fontWeight: "600", marginBottom: "0.5rem" }}>
                  Invalid or expired token
                </p>
                <p style={{ color: "#555", fontSize: "0.9rem" }}>
                  {error || "The password reset link is no longer valid."}
                </p>
              </div>

              <button
                className="btn btn-secondary"
                onClick={onBack}
                style={{ marginRight: "1rem" }}
              >
                ← Back
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  window.location.href = "/";
                }}
              >
                Request new link 🔐
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}



