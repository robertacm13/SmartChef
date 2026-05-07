import { useState, useRef } from "react";
import axios from "axios";
import "./App.css";

export default function Login({ onBack, onLoginSuccess, onNavigateToRegister, onNavigate }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Individual errors for each field
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [otpError, setOtpError] = useState("");
  
  // Refs for focus management
  const passwordRef = useRef(null);
  const otpRef = useRef(null);
  
  // Real-time validation
  const [emailValid, setEmailValid] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  const [otpValid, setOtpValid] = useState(false);
  
  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  
  const validateEmailField = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    setEmailValid(value.length > 0 && emailRegex.test(value));
  };
  
  const validatePasswordField = (value) => {
    const hasLength = value.length >= 8;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
    setPasswordValid(hasLength && hasUpperCase && hasNumber && hasSpecialChar);
  };
  
  const validateOtpField = (value) => {
    const otpRegex = /^[0-9]{6}$/;
    setOtpValid(value.length > 0 && otpRegex.test(value));
  };
  
  // Validation on blur (when field loses focus)
  const handleEmailBlur = () => {
    if (email.length === 0) {
      setEmailError("");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Email address is not valid!");
    } else {
      setEmailError("");
    }
  };
  
  const handlePasswordBlur = () => {
    if (password.length === 0) {
      setPasswordError("");
      return;
    }
    if (password.length < 8) {
      setPasswordError("Password must have at least 8 characters!");
      return;
    }
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasUpperCase) {
      setPasswordError("Password must contain at least one uppercase letter!");
    } else if (!hasNumber) {
      setPasswordError("Password must contain at least one digit!");
    } else if (!hasSpecialChar) {
      setPasswordError("Password must contain at least one special character!");
    } else {
      setPasswordError("");
    }
  };
  
  const handleOtpBlur = () => {
    if (otp.length === 0) {
      setOtpError("");
      return;
    }
    const otpRegex = /^[0-9]{6}$/;
    if (!otpRegex.test(otp)) {
      setOtpError("2FA code must be 6 digits!");
    } else {
      setOtpError("");
    }
  };

  const validateLogin = () => {
    if (!email || !password || !otp) {
      setError("Please fill in all fields!");
      return false;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Email address is not valid!");
      return false;
    }
    
    // Validate minimum password length
    if (password.length < 8) {
      setError("Password must have at least 8 characters!");
      return false;
    }
    
    // Validate OTP format (exactly 6 digits)
    const otpRegex = /^[0-9]{6}$/;
    if (!otpRegex.test(otp)) {
      setError("2FA code must be 6 digits!");
      return false;
    }
    
    setError("");
    return true;
  };

  const handleLogin = async () => {
    if (!validateLogin()) return;

    setLoading(true);
    setError("");

    try {
      const res = await axios.post("http://localhost:8000/login", { 
        email, 
        password, 
        otp_code: otp 
      });
      
      if (res.data.token) {
        setToken(res.data.token);
        setError("");
        // Redirect to main page after 2 seconds
        setTimeout(() => {
          onLoginSuccess(res.data.token, email);
        }, 2000);
      } else if (res.data.error) {
        setError(res.data.error);
      }
    } catch (err) {
      setError("Authentication error. Check your credentials!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animated-bg" style={{ minHeight: "100vh", paddingBottom: "2rem" }}>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo" onClick={onBack} style={{ cursor: "pointer" }}>
            🍳 SmartChef
          </div>
        </div>
      </header>

      <div className="form-container">
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "2.2rem", fontWeight: "700", color: "#ff6b35", marginBottom: "0.5rem" }}>
            Login
          </h2>
          <p style={{ color: "#666", fontSize: "1rem" }}>
            Sign in to your SmartChef account
          </p>
        </div>

        {error && (
          <div style={{
            background: "#fee",
            border: "2px solid #fcc",
            borderRadius: "12px",
            padding: "1rem",
            marginBottom: "1.5rem",
            color: "#c33",
            fontWeight: "500"
          }}>
            ⚠️ {error}
          </div>
        )}

        {token && (
          <div style={{
            background: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
            border: "3px solid #4CAF50",
            borderRadius: "12px",
            padding: "1.5rem",
            marginBottom: "1.5rem",
            textAlign: "center"
          }}>
            <p style={{ color: "#2e7d32", fontWeight: "600", fontSize: "1.2rem", marginBottom: "0.8rem" }}>
              ✅ Successfully authenticated!
            </p>
            <p style={{ color: "#2e7d32", fontSize: "0.95rem", fontWeight: "600" }}>
              ⏳ Redirecting in 2 seconds...
            </p>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Email</label>
          <div style={{ position: "relative" }}>
            <input
              className="form-input"
              type="email"
              placeholder="example@email.com"
              value={email}
              onChange={e => {
                setEmail(e.target.value);
                validateEmailField(e.target.value);
                if (emailError) setEmailError("");
              }}
              onBlur={handleEmailBlur}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  passwordRef.current?.focus();
                }
              }}
              style={{ paddingRight: emailValid ? "3rem" : "1rem", borderColor: emailError ? "#f44336" : "" }}
            />
            {emailValid && (
              <span style={{
                position: "absolute",
                right: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#4CAF50",
                fontSize: "1.5rem",
                fontWeight: "bold"
              }}>
                ✓
              </span>
            )}
          </div>
          {emailError && (
            <p style={{ fontSize: "0.85rem", color: "#f44336", marginTop: "0.3rem" }}>
              ⚠️ {emailError}
            </p>
          )}
        </div>

        <div className="form-group">
          <label className="form-label">Password</label>
          <div style={{ position: "relative" }}>
            <input
              ref={passwordRef}
              className="form-input"
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                validatePasswordField(e.target.value);
                if (passwordError) setPasswordError("");
              }}
              onBlur={handlePasswordBlur}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  otpRef.current?.focus();
                }
              }}
              style={{ paddingRight: passwordValid ? "5rem" : "3.5rem", borderColor: passwordError ? "#f44336" : "" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: passwordValid ? "3rem" : "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "0",
                color: "#666",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                  <line x1="1" y1="1" x2="23" y2="23"></line>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              )}
            </button>
            {passwordValid && (
              <span style={{
                position: "absolute",
                right: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#4CAF50",
                fontSize: "1.5rem",
                fontWeight: "bold"
              }}>
                ✓
              </span>
            )}
          </div>
          {passwordError && (
            <p style={{ fontSize: "0.85rem", color: "#f44336", marginTop: "0.3rem" }}>
              ⚠️ {passwordError}
            </p>
          )}
          <div style={{ marginTop: "0.5rem", textAlign: "right" }}>
            <span
              onClick={() => onNavigate && onNavigate("forgot-password")}
              style={{ 
                color: "#ff6b35", 
                fontSize: "0.85rem", 
                fontWeight: "600", 
                cursor: "pointer", 
                textDecoration: "underline",
                transition: "color 0.2s ease"
              }}
              onMouseEnter={(e) => e.target.style.color = "var(--primary, #ff6b35)"}
              onMouseLeave={(e) => e.target.style.color = "#ff6b35"}
            >
              Forgot password?
            </span>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">2FA Code</label>
          <div style={{ position: "relative" }}>
            <input
              ref={otpRef}
              className="form-input"
              type="text"
              placeholder="Code from Google Authenticator"
              value={otp}
              onChange={e => {
                setOtp(e.target.value);
                validateOtpField(e.target.value);
                if (otpError) setOtpError("");
              }}
              onBlur={handleOtpBlur}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleLogin();
                }
              }}
              maxLength={6}
              style={{ paddingRight: otpValid ? "3rem" : "1rem", borderColor: otpError ? "#f44336" : "" }}
            />
            {otpValid && (
              <span style={{
                position: "absolute",
                right: "1rem",
                top: "50%",
                transform: "translateY(-50%)",
                color: "#4CAF50",
                fontSize: "1.5rem",
                fontWeight: "bold"
              }}>
                ✓
              </span>
            )}
          </div>
          {otpError && (
            <p style={{ fontSize: "0.85rem", color: "#f44336", marginTop: "0.3rem" }}>
              ⚠️ {otpError}
            </p>
          )}
          <p style={{ fontSize: "0.85rem", color: "#999", marginTop: "0.3rem" }}>
            📱 Enter the code from your authentication app
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleLogin}
          disabled={loading}
          style={{ 
            width: "100%", 
            padding: "1rem", 
            fontSize: "1.1rem", 
            marginTop: "1rem",
            opacity: loading ? 0.6 : 1,
            cursor: loading ? "not-allowed" : "pointer"
          }}
        >
          {loading ? "🔄 Verifying..." : "🔐 Sign In"}
        </button>

        <button
          className="btn btn-secondary"
          onClick={onBack}
          style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", marginTop: "1rem" }}
        >
          ← Back
        </button>

        <p style={{ textAlign: "center", marginTop: "2rem", color: "#666" }}>
          Don't have an account?{" "}
          <span
            onClick={onNavigateToRegister}
            style={{ color: "#ff6b35", fontWeight: "600", cursor: "pointer", textDecoration: "underline" }}
          >
            Sign up here
          </span>
        </p>

        <div style={{
          marginTop: "2rem",
          padding: "1.5rem",
          background: "#f5f5f5",
          borderRadius: "12px",
          border: "2px solid #e0e0e0"
        }}>
          <p style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.8rem", fontWeight: "600" }}>
            💡 How do I use 2FA?
          </p>
          <ol style={{ fontSize: "0.85rem", color: "#666", paddingLeft: "1.2rem", lineHeight: "1.6" }}>
            <li>Open Google Authenticator</li>
            <li>Find the code for SmartChef</li>
            <li>Enter the 6-digit code above</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
