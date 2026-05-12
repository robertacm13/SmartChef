import { useState, useRef } from "react";
import axios from "axios";
import "./App.css";
import logo from "./logo.png";
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";
import { MdOutlineKeyboardArrowUp, MdOutlineKeyboardArrowDown } from "react-icons/md";

export default function Login({ onBack, onLoginSuccess, onNavigateToRegister, onNavigate, darkMode, toggleDarkMode }) {
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
  const [showHelpModal, setShowHelpModal] = useState(false);
  
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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: darkMode ? "#0F172A" : "#F1F5F9", color: darkMode ? "#E2E8F0" : "#1E293B" }}>
      {/* --- NAVBAR --- */}
      <nav className="pre-login-nav" style={{ background: darkMode ? "#1E293B" : "#FFFFFF", borderBottom: `1px solid ${darkMode ? "#334155" : "#E2E8F0"}` }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }} onClick={onBack}>
          <img src={logo} alt="SmartChef Logo" style={{ width: "40px", height: "40px", objectFit: "contain" }} />
          <span className="nav-logo-text" style={{ fontSize: "1.25rem", fontWeight: "bold", letterSpacing: "-0.05em", color: darkMode ? "#E2E8F0" : "#1E293B" }}>SmartChef</span>
        </div>

        {/* Right side */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button className="nav-text-btn" onClick={onBack}
            style={{ padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: "500", background: "none", border: "none", cursor: "pointer", color: darkMode ? "#E2E8F0" : "#1E293B" }}>
            Back
          </button>
          <button onClick={onNavigateToRegister}
            style={{ padding: "0.5rem 1rem", background: "var(--primary)", color: "white", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: "600", border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
            Sign Up
          </button>

          {/* Divider */}
          <div style={{ width: "1px", height: "24px", background: darkMode ? "#334155" : "#E2E8F0", margin: "0 0.25rem" }} />

          {/* Help */}
          <button onClick={() => setShowHelpModal(true)} aria-label="Help"
            style={{ padding: "0.4rem 0.6rem", fontSize: "1rem", background: "none", border: "none", cursor: "pointer", color: darkMode ? "#E2E8F0" : "#64748B", borderRadius: "6px" }}>
            ?
          </button>

          {/* Dark mode toggle — pill only */}
          <button onClick={toggleDarkMode} aria-label="Toggle dark mode"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            style={{
              width: "44px", height: "24px",
              background: darkMode ? "var(--primary)" : "#E2E8F0",
              borderRadius: "9999px", padding: "0.2rem",
              border: "none", cursor: "pointer", position: "relative",
              display: "flex", alignItems: "center", transition: "background 0.3s ease", flexShrink: 0
            }}>
            <div style={{
              width: "16px", height: "16px", background: "white",
              borderRadius: "9999px", boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              transform: darkMode ? "translateX(20px)" : "translateX(0)",
              transition: "transform 0.3s ease"
            }} />
          </button>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main style={{ paddingTop: "80px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{ maxWidth: "500px", margin: "0 auto", padding: "2rem" }}>
          
          <div style={{ textAlign: "center", marginBottom: "2rem" }}>
            <h1 style={{
              fontSize: "2.5rem",
              fontWeight: "800",
              color: darkMode ? "#E2E8F0" : "#1E293B",
              marginBottom: "0.5rem",
              lineHeight: "1.1"
            }}>
              Welcome Back
            </h1>
            <p style={{
              fontSize: "1rem",
              color: darkMode ? "#94A3B8" : "#64748B",
              marginBottom: "0.5rem"
            }}>
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
                  color: "#3B82F6", 
                  fontSize: "0.85rem", 
                  fontWeight: "600", 
                  cursor: "pointer", 
                  textDecoration: "underline",
                  transition: "color 0.2s ease"
                }}
                onMouseEnter={(e) => e.target.style.color = "var(--primary, #3B82F6)"}
                onMouseLeave={(e) => e.target.style.color = "#3B82F6"}
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
            onClick={handleLogin}
            disabled={loading}
            style={{ 
              width: "100%", 
              padding: "1rem", 
              background: "#3B82F6",
              color: "white",
              border: "none",
              borderRadius: "0.5rem",
              fontSize: "1.1rem",
              fontWeight: "700",
              cursor: loading ? "not-allowed" : "pointer",
              marginTop: "1rem",
              opacity: loading ? 0.6 : 1,
              transition: "all 0.3s ease",
              boxShadow: "0 10px 25px rgba(59, 130, 246, 0.2)"
            }}
            onMouseOver={(e) => {
              if (!loading) {
                e.target.style.background = "#2563EB";
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 15px 35px rgba(59, 130, 246, 0.3)";
              }
            }}
            onMouseOut={(e) => {
              e.target.style.background = "#3B82F6";
              e.target.style.transform = "translateY(0)";
              e.target.style.boxShadow = "0 10px 25px rgba(59, 130, 246, 0.2)";
            }}
          >
            {loading ? "🔄 Verifying..." : "Sign In"}
          </button>

          <div style={{
            marginTop: "2rem",
            padding: "1.5rem",
            background: darkMode ? "#1E3A5F" : "#F8FAFC",
            borderRadius: "12px",
            border: darkMode ? "1px solid #334155" : "1px solid #E2E8F0"
          }}>
            <p style={{ fontSize: "0.9rem", color: darkMode ? "#E2E8F0" : "#666", marginBottom: "0.8rem", fontWeight: "600", margin: "0 0 0.8rem 0" }}>
              💡 How do I use 2FA?
            </p>
            <ol style={{ fontSize: "0.85rem", color: darkMode ? "#94A3B8" : "#666", paddingLeft: "1.2rem", lineHeight: "1.6", margin: "0" }}>
              <li>Open Google Authenticator</li>
              <li>Find the code for SmartChef</li>
              <li>Enter the 6-digit code above</li>
            </ol>
          </div>

          <p style={{ textAlign: "center", marginTop: "2rem", color: darkMode ? "#94A3B8" : "#666" }}>
            Don't have an account?{" "}
            <span
              onClick={onNavigateToRegister}
              style={{ color: "#3B82F6", fontWeight: "600", cursor: "pointer", textDecoration: "underline" }}
            >
              Sign up here
            </span>
          </p>
        </div>

        {/* --- SOCIAL & FOOTER SECTION --- */}
        <section style={{ background: darkMode ? "#1E293B" : "#F8FAFC", padding: "3rem 2rem", textAlign: "center", marginTop: "auto" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginBottom: "1.5rem" }}>
            <a 
              href="https://www.facebook.com" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Visit our Facebook page"
              style={{ 
                fontSize: "1.75rem", 
                color: darkMode ? "#64748B" : "#94A3B8", 
                transition: "all 0.3s ease", 
                textDecoration: "none", 
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "50%",
                backgroundColor: darkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)"
              }} 
              onMouseOver={(e) => {
                e.target.style.color = "#3B82F6";
                e.target.style.backgroundColor = "rgba(59, 130, 246, 0.15)";
                e.target.style.transform = "scale(1.1)";
              }} 
              onMouseOut={(e) => {
                e.target.style.color = darkMode ? "#64748B" : "#94A3B8";
                e.target.style.backgroundColor = darkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)";
                e.target.style.transform = "scale(1)";
              }}
            >
              <FaFacebook style={{ width: "1.25rem", height: "1.25rem" }} />
            </a>
            <a 
              href="https://www.instagram.com" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Visit our Instagram page"
              style={{ 
                fontSize: "1.75rem", 
                color: darkMode ? "#64748B" : "#94A3B8", 
                transition: "all 0.3s ease", 
                textDecoration: "none", 
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "50%",
                backgroundColor: darkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)"
              }} 
              onMouseOver={(e) => {
                e.target.style.color = "#3B82F6";
                e.target.style.backgroundColor = "rgba(59, 130, 246, 0.15)";
                e.target.style.transform = "scale(1.1)";
              }} 
              onMouseOut={(e) => {
                e.target.style.color = darkMode ? "#64748B" : "#94A3B8";
                e.target.style.backgroundColor = darkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)";
                e.target.style.transform = "scale(1)";
              }}
            >
              <FaInstagram style={{ width: "1.25rem", height: "1.25rem" }} />
            </a>
            <a 
              href="https://www.linkedin.com" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Visit our LinkedIn page"
              style={{ 
                fontSize: "1.75rem", 
                color: darkMode ? "#64748B" : "#94A3B8", 
                transition: "all 0.3s ease", 
                textDecoration: "none", 
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "50%",
                backgroundColor: darkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)"
              }} 
              onMouseOver={(e) => {
                e.target.style.color = "#3B82F6";
                e.target.style.backgroundColor = "rgba(59, 130, 246, 0.15)";
                e.target.style.transform = "scale(1.1)";
              }} 
              onMouseOut={(e) => {
                e.target.style.color = darkMode ? "#64748B" : "#94A3B8";
                e.target.style.backgroundColor = darkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)";
                e.target.style.transform = "scale(1)";
              }}
            >
              <FaLinkedin style={{ width: "1.25rem", height: "1.25rem" }} />
            </a>
            <a 
              href="https://www.twitter.com" 
              target="_blank" 
              rel="noopener noreferrer"
              aria-label="Visit our Twitter page"
              style={{ 
                fontSize: "1.75rem", 
                color: darkMode ? "#64748B" : "#94A3B8", 
                transition: "all 0.3s ease", 
                textDecoration: "none", 
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: "2.5rem",
                height: "2.5rem",
                borderRadius: "50%",
                backgroundColor: darkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)"
              }} 
              onMouseOver={(e) => {
                e.target.style.color = "#3B82F6";
                e.target.style.backgroundColor = "rgba(59, 130, 246, 0.15)";
                e.target.style.transform = "scale(1.1)";
              }} 
              onMouseOut={(e) => {
                e.target.style.color = darkMode ? "#64748B" : "#94A3B8";
                e.target.style.backgroundColor = darkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)";
                e.target.style.transform = "scale(1)";
              }}
            >
              <FaTwitter style={{ width: "1.25rem", height: "1.25rem" }} />
            </a>
          </div>
          <p style={{ fontSize: "0.75rem", color: darkMode ? "#64748B" : "#94A3B8" }}>© 2026 SmartChef. All rights reserved.</p>
        </section>
      </main>

      {/* Help Modal */}
      {showHelpModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000
        }}>
          <div style={{
            background: darkMode ? "#1E293B" : "white",
            borderRadius: "1.25rem",
            padding: "2rem",
            maxWidth: "600px",
            maxHeight: "80vh",
            overflow: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
          }}>
            <h2 style={{ fontSize: "1.875rem", color: "#3B82F6", marginBottom: "1rem" }}>
              Help & Support
            </h2>
            <p style={{ color: darkMode ? "#94A3B8" : "#666", marginBottom: "1.5rem", lineHeight: "1.8" }}>
              SmartChef uses advanced AI to analyze your meals instantly. Simply take a photo of your food and get complete nutritional information.
            </p>
            <div style={{ marginBottom: "1rem" }}>
              <h3 style={{ color: darkMode ? "#E2E8F0" : "#1E293B", marginBottom: "0.5rem", fontWeight: "600" }}>
                Getting Started
              </h3>
              <p style={{ color: darkMode ? "#94A3B8" : "#666", fontSize: "0.95rem" }}>
                1. Create a free account<br/>
                2. Go to Analyze Food<br/>
                3. Upload a food photo<br/>
                4. Get instant nutritional analysis
              </p>
            </div>
            <button
              onClick={() => setShowHelpModal(false)}
              style={{
                background: "#3B82F6",
                color: "white",
                border: "none",
                padding: "0.5rem 1rem",
                borderRadius: "0.75rem",
                cursor: "pointer",
                fontWeight: "600",
                marginTop: "1rem"
              }}
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* --- FLOATING ACTION BUTTONS --- */}
      <div style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        zIndex: 100
      }}>
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Scroll to top"
          style={{
            padding: "0.75rem",
            background: "#3B82F6",
            color: "white",
            border: "none",
            borderRadius: "50%",
            boxShadow: "0 4px 15px rgba(59, 130, 246, 0.4)",
            cursor: "pointer",
            fontSize: "1.25rem",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "2.75rem",
            height: "2.75rem"
          }}
          onMouseOver={(e) => {
            e.target.style.background = "#2563EB";
            e.target.style.transform = "translateY(-3px)";
            e.target.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.5)";
          }}
          onMouseOut={(e) => {
            e.target.style.background = "#3B82F6";
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 15px rgba(59, 130, 246, 0.4)";
          }}
        >
          <MdOutlineKeyboardArrowUp style={{ width: "1.5rem", height: "1.5rem" }} />
        </button>
        <button 
          onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
          aria-label="Scroll to bottom"
          style={{
            padding: "0.75rem",
            background: "#3B82F6",
            color: "white",
            border: "none",
            borderRadius: "50%",
            boxShadow: "0 4px 15px rgba(59, 130, 246, 0.4)",
            cursor: "pointer",
            fontSize: "1.25rem",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "2.75rem",
            height: "2.75rem"
          }}
          onMouseOver={(e) => {
            e.target.style.background = "#2563EB";
            e.target.style.transform = "translateY(3px)";
            e.target.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.5)";
          }}
          onMouseOut={(e) => {
            e.target.style.background = "#3B82F6";
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 15px rgba(59, 130, 246, 0.4)";
          }}
        >
          <MdOutlineKeyboardArrowDown style={{ width: "1.5rem", height: "1.5rem" }} />
        </button>
      </div>
    </div>
  );
}

