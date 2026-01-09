import { useState, useRef } from "react";
import axios from "axios";
import "./App.css";

export default function Login({ onBack, onLoginSuccess, onNavigateToRegister }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Erori individuale pentru fiecare câmp
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [otpError, setOtpError] = useState("");
  
  // Refs pentru focus management
  const passwordRef = useRef(null);
  const otpRef = useRef(null);
  
  // Validare în timp real
  const [emailValid, setEmailValid] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  const [otpValid, setOtpValid] = useState(false);
  
  // Vizibilitate parolă
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
  
  // Validare la blur (când părăsește câmpul)
  const handleEmailBlur = () => {
    if (email.length === 0) {
      setEmailError("");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Adresa de email nu este validă!");
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
      setPasswordError("Parola trebuie să aibă minim 8 caractere!");
      return;
    }
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasUpperCase) {
      setPasswordError("Parola trebuie să conțină cel puțin o literă mare!");
    } else if (!hasNumber) {
      setPasswordError("Parola trebuie să conțină cel puțin o cifră!");
    } else if (!hasSpecialChar) {
      setPasswordError("Parola trebuie să conțină cel puțin un caracter special!");
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
      setOtpError("Codul 2FA trebuie să fie format din 6 cifre!");
    } else {
      setOtpError("");
    }
  };

  const validateLogin = () => {
    if (!email || !password || !otp) {
      setError("Te rog completează toate câmpurile!");
      return false;
    }
    
    // Validare format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Adresa de email nu este validă!");
      return false;
    }
    
    // Validare lungime minimă parolă
    if (password.length < 8) {
      setError("Parola trebuie să aibă minim 8 caractere!");
      return false;
    }
    
    // Validare format OTP (exact 6 cifre)
    const otpRegex = /^[0-9]{6}$/;
    if (!otpRegex.test(otp)) {
      setError("Codul 2FA trebuie să fie format din 6 cifre!");
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
      const res = await axios.post("http://localhost:8001/login", { 
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
      setError("Eroare la autentificare. Verifică datele introduse!");
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
            Intră în contul tău SmartChef
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
              ✅ Autentificare reușită!
            </p>
            <p style={{ color: "#2e7d32", fontSize: "0.95rem", fontWeight: "600" }}>
              ⏳ Redirecționare în 2 secunde...
            </p>
          </div>
        )}

        <div className="form-group">
          <label className="form-label">Email</label>
          <div style={{ position: "relative" }}>
            <input
              className="form-input"
              type="email"
              placeholder="exemplu@email.com"
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
          <label className="form-label">Parolă</label>
          <div style={{ position: "relative" }}>
            <input
              ref={passwordRef}
              className="form-input"
              type={showPassword ? "text" : "password"}
              placeholder="Introdu parola"
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
        </div>

        <div className="form-group">
          <label className="form-label">Cod 2FA</label>
          <div style={{ position: "relative" }}>
            <input
              ref={otpRef}
              className="form-input"
              type="text"
              placeholder="Codul din Google Authenticator"
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
            📱 Introdu codul din aplicația ta de autentificare
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
          {loading ? "🔄 Se verifică..." : "🔐 Login"}
        </button>

        <button
          className="btn btn-secondary"
          onClick={onBack}
          style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", marginTop: "1rem" }}
        >
          ← Înapoi
        </button>

        <p style={{ textAlign: "center", marginTop: "2rem", color: "#666" }}>
          Nu ai cont?{" "}
          <span
            onClick={onNavigateToRegister}
            style={{ color: "#ff6b35", fontWeight: "600", cursor: "pointer", textDecoration: "underline" }}
          >
            Înregistrează-te aici
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
            💡 Cum folosesc 2FA?
          </p>
          <ol style={{ fontSize: "0.85rem", color: "#666", paddingLeft: "1.2rem", lineHeight: "1.6" }}>
            <li>Deschide Google Authenticator</li>
            <li>Găsește codul pentru SmartChef</li>
            <li>Introdu codul de 6 cifre mai sus</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
