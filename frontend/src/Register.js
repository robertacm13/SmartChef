import { useState, useRef } from "react";
import axios from "axios";
import { QRCodeSVG } from "qrcode.react";
import "./App.css";

export default function Register({ onBack, onRegisterSuccess, onNavigateToLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [qr, setQr] = useState("");
  const [error, setError] = useState("");
  
  // Individual errors for each field
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  
  // Refs for focus management
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  
  // Real-time validation
  const [emailValid, setEmailValid] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  const [confirmPasswordValid, setConfirmPasswordValid] = useState(false);
  
  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
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
  
  const validateConfirmPasswordField = (value, passwordValue) => {
    setConfirmPasswordValid(value.length > 0 && passwordValue.length > 0 && value === passwordValue);
  };
  
  // Validation on blur (when field loses focus)
  const handleEmailBlur = () => {
    if (email.length === 0) {
      setEmailError("");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Email address is not valid! (ex: example@email.com)");
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
      setPasswordError("Password must contain at least one special character (!@#$%^&* etc.)!");
    } else {
      setPasswordError("");
    }
  };
  
  const handleConfirmPasswordBlur = () => {
    if (confirmPassword.length === 0) {
      setConfirmPasswordError("");
      return;
    }
    if (confirmPassword !== password) {
      setConfirmPasswordError("Passwords do not match!");
    } else {
      setConfirmPasswordError("");
    }
  };

  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      setError("Please fill in all fields!");
      return false;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Email address is not valid! (ex: example@email.com)");
      return false;
    }
    
    // Validate password length
    if (password.length < 8) {
      setError("Password must have at least 8 characters!");
      return false;
    }
    
    // Validate password complexity (at least uppercase letter, digit and special character)
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasUpperCase) {
      setError("Password must contain at least one uppercase letter!");
      return false;
    }
    
    if (!hasNumber) {
      setError("Password must contain at least one digit!");
      return false;
    }
    
    if (!hasSpecialChar) {
      setError("Password must contain at least one special character (!@#$%^&* etc.)!");
      return false;
    }
    
    // Validate password confirmation
    if (password !== confirmPassword) {
      setError("Passwords do not match!");
      return false;
    }
    
    setError("");
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      const res = await axios.post("http://localhost:8000/register", { email, password });
      if (res.data.otp_uri) {
        setQr(res.data.otp_uri);
        setError("");
      } else if (res.data.error) {
        setQr("");
        setError(res.data.error);
      }
    } catch (err) {
      setQr("");
      setError("Registration error. Check your connection!");
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
            Sign Up
          </h2>
          <p style={{ color: "#666", fontSize: "1rem" }}>
            Create a new SmartChef account
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
              placeholder="Minimum 8 characters"
              value={password}
              onChange={e => {
                setPassword(e.target.value);
                validatePasswordField(e.target.value);
                validateConfirmPasswordField(confirmPassword, e.target.value);
                if (passwordError) setPasswordError("");
              }}
              onBlur={handlePasswordBlur}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  confirmPasswordRef.current?.focus();
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
          <p style={{ fontSize: "0.85rem", color: "#999", marginTop: "0.3rem" }}>
            Minimum 8 characters, uppercase letter, digit, special character
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Confirm Password</label>
          <div style={{ position: "relative" }}>
            <input
              ref={confirmPasswordRef}
              className="form-input"
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Re-enter password"
              value={confirmPassword}
              onChange={e => {
                setConfirmPassword(e.target.value);
                validateConfirmPasswordField(e.target.value, password);
                if (confirmPasswordError) setConfirmPasswordError("");
              }}
              onBlur={handleConfirmPasswordBlur}
              onKeyDown={e => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleRegister();
                }
              }}
              style={{ paddingRight: confirmPasswordValid ? "5rem" : "3.5rem", borderColor: confirmPasswordError ? "#f44336" : "" }}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              style={{
                position: "absolute",
                right: confirmPasswordValid ? "3rem" : "1rem",
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
              {showConfirmPassword ? (
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
            {confirmPasswordValid && (
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
          {confirmPasswordError && (
            <p style={{ fontSize: "0.85rem", color: "#f44336", marginTop: "0.3rem" }}>
              ⚠️ {confirmPasswordError}
            </p>
          )}
        </div>

        <button
          className="btn btn-primary"
          onClick={handleRegister}
          style={{
            width: "100%",
            padding: "1rem",
            fontSize: "1.1rem",
            marginTop: "1rem",
            background: "linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%)",
            color: "white"
          }}
        >
          📝 Sign Up
        </button>

        <button
          className="btn btn-secondary"
          onClick={onBack}
          style={{
            width: "100%",
            padding: "1rem",
            fontSize: "1.1rem",
            marginTop: "1rem",
            background: "white",
            color: "#ff6b35",
            border: "2px solid #ff6b35"
          }}
        >
          ← Back
        </button>

        {qr && (
          <div style={{
            marginTop: "2rem",
            padding: "2rem",
            background: "linear-gradient(135deg, #ffebcc 0%, #ffe0b3 100%)",
            borderRadius: "20px",
            border: "3px solid #ff6b35"
          }}>
            <h3 style={{ textAlign: "center", color: "#ff6b35", marginBottom: "1rem", fontSize: "1.3rem", fontWeight: "700" }}>
              ✅ Account created successfully!
            </h3>
            <p style={{ textAlign: "center", marginBottom: "1.5rem", color: "#666" }}>
              Scan the QR code with Google Authenticator:
            </p>
            <div style={{ display: "flex", justifyContent: "center", background: "white", padding: "1.5rem", borderRadius: "15px" }}>
              <QRCodeSVG value={qr} size={220} />
            </div>
            <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.9rem", color: "#666" }}>
              💡 You will need the app code to sign in
            </p>
            <button
              className="btn btn-primary"
              onClick={onRegisterSuccess}
              style={{
                width: "100%",
                padding: "1rem",
                fontSize: "1.1rem",
                marginTop: "1.5rem",
                background: "linear-gradient(135deg, #ff8c42 0%, #ff6b35 100%)",
                color: "white"
              }}
            >
              ✅ Continue to Sign In
            </button>
          </div>
        )}

        <p style={{ textAlign: "center", marginTop: "2rem", color: "#666" }}>
          Already have an account?{" "}
          <span
            onClick={onNavigateToLogin}
            style={{ color: "#ff6b35", fontWeight: "600", cursor: "pointer", textDecoration: "underline" }}
          >
            Sign in here
          </span>
        </p>
      </div>
    </div>
  );
}
