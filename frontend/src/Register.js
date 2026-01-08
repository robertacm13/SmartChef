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
  
  // Erori individuale pentru fiecare câmp
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  
  // Refs pentru focus management
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  
  // Validare în timp real
  const [emailValid, setEmailValid] = useState(false);
  const [passwordValid, setPasswordValid] = useState(false);
  const [confirmPasswordValid, setConfirmPasswordValid] = useState(false);
  
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
  
  // Validare la blur (când părăsește câmpul)
  const handleEmailBlur = () => {
    if (email.length === 0) {
      setEmailError("");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Adresa de email nu este validă! (ex: exemplu@email.com)");
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
      setPasswordError("Parola trebuie să conțină cel puțin un caracter special (!@#$%^&* etc.)!");
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
      setConfirmPasswordError("Parolele nu se potrivesc!");
    } else {
      setConfirmPasswordError("");
    }
  };

  const validateForm = () => {
    if (!email || !password || !confirmPassword) {
      setError("Te rog completează toate câmpurile!");
      return false;
    }
    
    // Validare format email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Adresa de email nu este validă! (ex: exemplu@email.com)");
      return false;
    }
    
    // Validare lungime parolă
    if (password.length < 8) {
      setError("Parola trebuie să aibă minim 8 caractere!");
      return false;
    }
    
    // Validare complexitate parolă (cel puțin o literă mare, o cifră și un caracter special)
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasUpperCase) {
      setError("Parola trebuie să conțină cel puțin o literă mare!");
      return false;
    }
    
    if (!hasNumber) {
      setError("Parola trebuie să conțină cel puțin o cifră!");
      return false;
    }
    
    if (!hasSpecialChar) {
      setError("Parola trebuie să conțină cel puțin un caracter special (!@#$%^&* etc.)!");
      return false;
    }
    
    // Validare confirmare parolă
    if (password !== confirmPassword) {
      setError("Parolele nu se potrivesc!");
      return false;
    }
    
    setError("");
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      const res = await axios.post("http://localhost:8001/register", { email, password });
      if (res.data.otp_uri) {
        setQr(res.data.otp_uri);
        setError("");
      }
      if (res.data.error) {
        setError(res.data.error);
      }
    } catch (err) {
      setError("Eroare la înregistrare. Verifică conexiunea!");
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
            Înregistrare
          </h2>
          <p style={{ color: "#666", fontSize: "1rem" }}>
            Creează un cont nou SmartChef
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
              type="password"
              placeholder="Minim 8 caractere"
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
              style={{ paddingRight: passwordValid ? "3rem" : "1rem", borderColor: passwordError ? "#f44336" : "" }}
            />
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
            Minim 8 caractere, o literă mare, o cifră, un caracter special
          </p>
        </div>

        <div className="form-group">
          <label className="form-label">Confirmă Parola</label>
          <div style={{ position: "relative" }}>
            <input
              ref={confirmPasswordRef}
              className="form-input"
              type="password"
              placeholder="Rescrie parola"
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
              style={{ paddingRight: confirmPasswordValid ? "3rem" : "1rem", borderColor: confirmPasswordError ? "#f44336" : "" }}
            />
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
          style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", marginTop: "1rem" }}
        >
          📝 Înregistrează-te
        </button>

        <button
          className="btn btn-secondary"
          onClick={onBack}
          style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", marginTop: "1rem" }}
        >
          ← Înapoi
        </button>

        {qr && (
          <div style={{
            marginTop: "2rem",
            padding: "2rem",
            background: "linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)",
            borderRadius: "20px",
            border: "3px solid #4CAF50"
          }}>
            <h3 style={{ textAlign: "center", color: "#2e7d32", marginBottom: "1rem", fontSize: "1.3rem" }}>
              ✅ Cont creat cu succes!
            </h3>
            <p style={{ textAlign: "center", marginBottom: "1.5rem", color: "#666" }}>
              Scanează codul QR cu Google Authenticator:
            </p>
            <div style={{ display: "flex", justifyContent: "center", background: "white", padding: "1.5rem", borderRadius: "15px" }}>
              <QRCodeSVG value={qr} size={220} />
            </div>
            <p style={{ textAlign: "center", marginTop: "1.5rem", fontSize: "0.9rem", color: "#666" }}>
              💡 Vei avea nevoie de codul din aplicație pentru login
            </p>
            <button
              className="btn btn-primary"
              onClick={onRegisterSuccess}
              style={{ width: "100%", padding: "1rem", fontSize: "1.1rem", marginTop: "1.5rem" }}
            >
              ✅ Continuă la Login
            </button>
          </div>
        )}

        <p style={{ textAlign: "center", marginTop: "2rem", color: "#666" }}>
          Ai deja cont?{" "}
          <span
            onClick={onNavigateToLogin}
            style={{ color: "#ff6b35", fontWeight: "600", cursor: "pointer", textDecoration: "underline" }}
          >
            Login aici
          </span>
        </p>
      </div>
    </div>
  );
}
