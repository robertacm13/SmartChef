import React, { useState } from "react";
import "./App.css";
import logo from "./logo.png";

export default function ForgotPassword({ onBack, onNavigate }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      const response = await fetch("http://localhost:8000/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message);
        setSubmitted(true);
        setEmail("");
      } else {
        setError(data.message || "Failed to send reset email");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#F1F5F9" }}>
      {/* Navbar */}
      <nav style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1rem 2rem",
        borderBottom: "1px solid #E2E8F0",
        background: "#FFFFFF",
        position: "fixed",
        top: 0, left: 0, right: 0,
        zIndex: 1000,
        width: "100%",
        boxShadow: "0 1px 3px rgba(0,0,0,0.06)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }} onClick={onBack}>
          <img src={logo} alt="SmartChef Logo" style={{ width: "40px", height: "40px", objectFit: "contain" }} />
          <span style={{ fontSize: "1.25rem", fontWeight: "700", letterSpacing: "-0.05em", color: "#1E293B" }}>SmartChef</span>
        </div>
        <button
          onClick={onBack}
          style={{ padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: "500", background: "none", border: "none", cursor: "pointer", color: "#1E293B" }}
        >
          ← Back to Sign In
        </button>
      </nav>

      <div style={{ maxWidth: "500px", margin: "0 auto", padding: "2rem", paddingTop: "6rem" }}>
        <div className="card" style={{ padding: "2.5rem" }}>
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔐</div>
            <h1 style={{ fontSize: "2rem", color: "var(--primary, #3B82F6)", marginBottom: "0.5rem" }}>
              Password Recovery
            </h1>
            <p style={{ color: "#666", fontSize: "0.95rem" }}>
              {submitted
                ? "Check your email for reset instructions"
                : "Enter the email address associated with your account"}
            </p>
          </div>

          {submitted ? (
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
                <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>✅</div>
                <p style={{ color: "#3B82F6", fontWeight: "600", marginBottom: "0.5rem" }}>
                  Email sent successfully!
                </p>
                <p style={{ color: "#555", fontSize: "0.9rem" }}>
                  Check your inbox and spam folder. The reset link will expire in 1 hour.
                </p>
              </div>

              <button
                className="btn btn-secondary"
                onClick={onBack}
                style={{ marginTop: "1rem" }}
              >
                ← Back to Sign In
              </button>
            </div>
          ) : (
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

              {message && (
                <div
                  style={{
                    background: "#F0F9FF",
                    border: "2px solid #3B82F6",
                    color: "#3B82F6",
                    padding: "1rem",
                    borderRadius: "8px",
                    marginBottom: "1.5rem",
                    fontSize: "0.9rem",
                  }}
                >
                  ℹ️ {message}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="your@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
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
                {loading ? "Sending..." : "📧 Send reset email"}
              </button>
            </form>
          )}
        </div>

        <div style={{ textAlign: "center", marginTop: "2rem", color: "#666", fontSize: "0.85rem" }}>
          <p>
            Security notice: You won't receive any email if the address is not associated with a SmartChef account.
          </p>
        </div>
      </div>
    </div>
  );
}







