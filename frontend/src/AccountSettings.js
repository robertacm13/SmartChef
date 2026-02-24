import { useState } from "react";
import { ShortcutsHelp } from "./utils/keyboardShortcuts";
import "./utils/keyboardShortcuts.css";
import "./App.css";

export default function AccountSettings({ userEmail, onBack, onEmailChange, onLogout, onNavigate }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [showPasswordFields, setShowPasswordFields] = useState(false);
  const [showEmailFields, setShowEmailFields] = useState(true);
  
  const [currentPassword, setCurrentPassword] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [passwordValid, setPasswordValid] = useState(false);
  const [validatingPassword, setValidatingPassword] = useState(false);
  const [newPasswordSameAsCurrent, setNewPasswordSameAsCurrent] = useState(false);
  const [newPasswordValid, setNewPasswordValid] = useState(false);
  const [confirmPasswordValid, setConfirmPasswordValid] = useState(false);
  const [newEmailValid, setNewEmailValid] = useState(false);
  
  const [showNavDropdown, setShowNavDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [navDropdownTimeout, setNavDropdownTimeout] = useState(null);
  const [userDropdownTimeout, setUserDropdownTimeout] = useState(null);
  const [passwordValidationTimeout, setPasswordValidationTimeout] = useState(null);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  // Vizibilitate parole
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleNavMouseEnter = () => {
    if (navDropdownTimeout) clearTimeout(navDropdownTimeout);
    setShowNavDropdown(true);
  };

  const handleNavMouseLeave = () => {
    const timeout = setTimeout(() => setShowNavDropdown(false), 200);
    setNavDropdownTimeout(timeout);
  };

  const handleUserMouseEnter = () => {
    if (userDropdownTimeout) clearTimeout(userDropdownTimeout);
    setShowUserDropdown(true);
  };

  const handleUserMouseLeave = () => {
    const timeout = setTimeout(() => setShowUserDropdown(false), 200);
    setUserDropdownTimeout(timeout);
  };

  const handleSettings = () => {
    onNavigate("app-settings");
  };

  const handleHelp = () => {
    alert("❓ Help & Support\n\nFor assistance:\n📧 Email: support@smartchef.ro\n🐛 Report bugs on GitHub\n\nQuick Tips:\n- Upload clear food images\n- Use dark mode for better viewing\n- Export analyses as PDF\n- Mark favorites with ⭐");
  };

  const validateCurrentPassword = async (password) => {
    if (!password || password.length < 8) {
      setPasswordValid(false);
      return;
    }

    setValidatingPassword(true);
    try {
      const res = await fetch(`http://localhost:8001/account_settings/${userEmail}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          current_password: password,
          new_email: null,
          new_password: null
        })
      });

      const data = await res.json();
      
      // Parola este corectă dacă primim 200 OK cu validation_only=true
      if (res.ok && data.validation_only === true) {
        setPasswordValid(true);
      } else if (!res.ok && res.status === 401) {
        // 401 = Unauthorized = parolă incorectă
        setPasswordValid(false);
      } else {
        // Orice alt caz = parolă incorectă
        setPasswordValid(false);
      }
    } catch (err) {
      console.error("Error validating password:", err);
      setPasswordValid(false);
    } finally {
      setValidatingPassword(false);
    }
  };

  const handleCurrentPasswordChange = (e) => {
    const newPasswordValue = e.target.value;
    setCurrentPassword(newPasswordValue);
    
    // Reset validation immediately when field changes
    setPasswordValid(false);
    setValidatingPassword(false);
    
    // Clear previous timeout
    if (passwordValidationTimeout) {
      clearTimeout(passwordValidationTimeout);
    }
    
    // Reset validation if field is empty or too short
    if (newPasswordValue.length === 0 || newPasswordValue.length < 8) {
      return;
    }
    
    // Debounce validation - wait 1 second after user stops typing
    const timeout = setTimeout(() => {
      validateCurrentPassword(newPasswordValue);
    }, 1000);
    
    setPasswordValidationTimeout(timeout);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!currentPassword) {
      setError("❌ Introdu parola curentă pentru a verifica identitatea");
      return;
    }

    if (!showEmailFields && !showPasswordFields) {
      setError("❌ Selectează ce dorești să modifici (Email sau Parolă)");
      return;
    }

    if (showPasswordFields) {
      // Verifică dacă parola curentă este validată
      if (!passwordValid) {
        setError("❌ Parola curentă este incorectă. Te rog verifică și încearcă din nou.");
        return;
      }
      
      if (!newPassword) {
        setError("❌ Introdu noua parolă");
        return;
      }
      if (newPassword.length < 8) {
        setError("❌ Parola nouă trebuie să aibă cel puțin 8 caractere");
        return;
      }
      const hasUpperCase = /[A-Z]/.test(newPassword);
      const hasNumber = /[0-9]/.test(newPassword);
      const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
      
      if (!hasUpperCase) {
        setError("❌ Parola trebuie să conțină cel puțin o literă mare");
        return;
      }
      if (!hasNumber) {
        setError("❌ Parola trebuie să conțină cel puțin o cifră");
        return;
      }
      if (!hasSpecialChar) {
        setError("❌ Parola trebuie să conțină cel puțin un caracter special (!@#$%^&* etc.)");
        return;
      }
      if (newPassword === currentPassword) {
        setError("❌ Parola nouă nu poate fi identică cu cea curentă");
        return;
      }
      if (!confirmPassword) {
        setError("❌ Te rog confirmă parola nouă");
        return;
      }
      if (newPassword !== confirmPassword) {
        setError("❌ Parolele noi nu se potrivesc");
        return;
      }
    }

    if (showEmailFields) {
      if (!newEmail) {
        setError("❌ Introdu noul email");
        return;
      }
      if (!newEmail.includes("@")) {
        setError("❌ Email-ul nu este valid");
        return;
      }
      if (newEmail === userEmail) {
        setError("❌ Noul email este identic cu cel actual");
        return;
      }
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const apiData = {
        current_password: currentPassword,
        new_email: showEmailFields ? newEmail : null,
        new_password: showPasswordFields ? newPassword : null
      };

      const res = await fetch(`http://localhost:8001/account_settings/${userEmail}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(apiData)
      });

      const data = await res.json();

      if (res.ok && data.status === "success") {
        setSuccess(`✅ ${data.message}`);
        
        // Reset form fields
        setCurrentPassword("");
        setNewEmail("");
        setNewPassword("");
        setConfirmPassword("");
        
        // Reset validation states
        setPasswordValid(false);
        setValidatingPassword(false);
        setNewPasswordSameAsCurrent(false);
        setNewPasswordValid(false);
        setConfirmPasswordValid(false);
        setNewEmailValid(false);
        
        // Reset button selection - set Email as default
        setShowEmailFields(true);
        setShowPasswordFields(false);
        
        // If email was changed, notify parent component
        if (data.new_email && data.new_email !== userEmail) {
          setTimeout(() => {
            if (onEmailChange) {
              onEmailChange(data.new_email);
            }
          }, 2000);
        }
      } else {
        setError(`❌ ${data.detail || "Eroare la actualizarea setărilor"}`);
      }
    } catch (err) {
      setError("❌ Eroare la conectarea cu serverul");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animated-bg" style={{ minHeight: "100vh", paddingBottom: "2rem" }}>
      <header className="header">
        <div className="header-content">
          <div className="logo" onClick={onBack} style={{ cursor: "pointer" }}>
            🍳 SmartChef
          </div>
          <div className="nav-buttons">
            <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", marginLeft: "auto", marginRight: "-0.5rem" }}>
              {/* Navigation Dropdown */}
              <div 
                style={{ position: "relative" }}
                onMouseEnter={handleNavMouseEnter}
                onMouseLeave={handleNavMouseLeave}
              >
                <button
                  className="btn btn-outline"
                  style={{ padding: "0.7rem 1.2rem", fontSize: "1.5rem", background: "rgba(255,255,255,0.2)" }}
                >
                  ☰
                </button>
                {showNavDropdown && (
                  <div className="nav-dropdown">
                    <button
                      className="nav-dropdown-item"
                      onClick={() => {
                        onNavigate('dashboard');
                        setShowNavDropdown(false);
                      }}
                    >
                      📈 Dashboard
                    </button>
                    <button
                      className="nav-dropdown-item"
                      onClick={() => {
                        onNavigate('history');
                        setShowNavDropdown(false);
                      }}
                    >
                      📊 Istoric
                    </button>
                  </div>
                )}
              </div>
              
              <div style={{
                width: "1px",
                height: "30px",
                background: "rgba(255,255,255,0.3)",
                margin: "0 0.5rem"
              }}></div>
              
              {/* User Dropdown */}
              <div 
                style={{ position: "relative" }}
                onMouseEnter={handleUserMouseEnter}
                onMouseLeave={handleUserMouseLeave}
              >
                <button
                  className="btn btn-outline"
                  style={{ 
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                >
                  👤 {userEmail}
                  <span style={{ 
                    fontSize: "0.7rem",
                    transition: "transform 0.3s",
                    display: "inline-block",
                    transform: showUserDropdown ? "rotate(90deg)" : "rotate(0deg)"
                  }}>►</span>
                </button>
                {showUserDropdown && (
                  <div className="user-dropdown">
                    <button className="user-dropdown-item" onClick={() => alert('🚧 Profil - Coming soon!')}>
                      <span className="dropdown-icon">👤</span>
                      Profil
                    </button>
                    
                    <button className="user-dropdown-item" onClick={() => {
                      onNavigate('personal-data');
                      setShowUserDropdown(false);
                    }}>
                      <span className="dropdown-icon">📊</span>
                      Date personale
                    </button>
                    
                    <button className="user-dropdown-item" onClick={() => {
                      onNavigate('account-settings');
                      setShowUserDropdown(false);
                    }} style={{ fontWeight: "600", background: "rgba(255, 107, 53, 0.1)" }}>
                      <span className="dropdown-icon">🔑</span>
                      Setările contului
                    </button>

                    <button className="user-dropdown-item" onClick={() => {
                      onNavigate('app-settings');
                      setShowUserDropdown(false);
                    }}>
                      <span className="dropdown-icon">⚙️</span>
                      Setări aplicație
                    </button>
                    
                    <div className="user-dropdown-divider"></div>
                    <button className="user-dropdown-item logout-item" onClick={onLogout}>
                      <span className="dropdown-icon">🚪</span>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem" }}>
        <button
          className="btn btn-secondary"
          onClick={onBack}
          style={{ marginBottom: "2rem" }}
        >
          ← Înapoi
        </button>

        <div className="card" style={{ padding: "2rem" }}>
          <h2 style={{ 
            fontSize: "2rem", 
            fontWeight: "700", 
            color: "#ff6b35", 
            marginBottom: "0.5rem",
            textAlign: "center"
          }}>
            ⚙️ Setările Contului
          </h2>
          <p style={{ 
            color: "#666", 
            fontSize: "0.95rem", 
            textAlign: "center",
            marginBottom: "2rem"
          }}>
            Modifică email-ul sau parola contului tău
          </p>

          {error && (
            <div style={{
              padding: "1rem",
              background: "rgba(244, 67, 54, 0.1)",
              border: "1px solid rgba(244, 67, 54, 0.3)",
              borderRadius: "8px",
              color: "#d32f2f",
              marginBottom: "1rem"
            }}>
              {error}
            </div>
          )}

          {success && (
            <div style={{
              padding: "1rem",
              background: "rgba(76, 175, 80, 0.1)",
              border: "1px solid rgba(76, 175, 80, 0.3)",
              borderRadius: "8px",
              color: "#388e3c",
              marginBottom: "1rem"
            }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Current Email Display */}
            <div style={{
              padding: "1rem",
              background: "rgba(33, 150, 243, 0.05)",
              borderRadius: "8px",
              marginBottom: "1.5rem",
              border: "1px solid rgba(33, 150, 243, 0.2)"
            }}>
              <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>
                📧 <strong>Email curent:</strong> {userEmail}
              </p>
            </div>

            {/* What to Change Selection */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ 
                display: "block", 
                fontWeight: "600", 
                marginBottom: "0.8rem",
                color: "#333"
              }}>
                Ce dorești să modifici?
              </label>
              
              <div style={{ display: "flex", gap: "1rem" }}>
                <button
                  type="button"
                  className={`btn ${showEmailFields ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => {
                    setShowEmailFields(true);
                    setShowPasswordFields(false);
                    setError("");
                    setSuccess("");
                  }}
                  style={{ 
                    flex: 1,
                    fontWeight: "600",
                    fontSize: "1rem",
                    color: showEmailFields ? "#fff" : "#ff6b35"
                  }}
                >
                  📧 Email
                </button>
                
                <button
                  type="button"
                  className={`btn ${showPasswordFields ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => {
                    setShowPasswordFields(true);
                    setShowEmailFields(false);
                    setError("");
                    setSuccess("");
                  }}
                  style={{ 
                    flex: 1,
                    fontWeight: "600",
                    fontSize: "1rem",
                    color: showPasswordFields ? "#fff" : "#ff6b35"
                  }}
                >
                  🔐 Parolă
                </button>
              </div>
            </div>

            {/* New Email Field */}
            {showEmailFields && (
              <>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ 
                    display: "block", 
                    fontWeight: "600", 
                    marginBottom: "0.5rem",
                    color: "#333"
                  }}>
                    📧 Email Nou
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type="email"
                      id="newEmailField"
                      value={newEmail}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewEmail(value);
                        
                        // Validează email în timp real
                        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                        const isValidFormat = emailRegex.test(value);
                        const isDifferent = value !== userEmail;
                        
                        setNewEmailValid(isValidFormat && isDifferent && value.length > 0);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          document.querySelector('#emailCurrentPasswordField')?.focus();
                        }
                      }}
                      placeholder="exemplu@email.com"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        paddingRight: "3rem",
                        border: newEmailValid ? "2px solid #4caf50" : "2px solid #e0e0e0",
                        borderRadius: "8px",
                        fontSize: "1rem",
                        outline: "none",
                        transition: "border-color 0.3s"
                      }}
                      onFocus={(e) => e.target.style.borderColor = newEmailValid ? "#4caf50" : "#ff6b35"}
                      onBlur={(e) => e.target.style.borderColor = newEmailValid ? "#4caf50" : "#e0e0e0"}
                    />
                    {newEmailValid && (
                      <div style={{
                        position: "absolute",
                        right: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: "1.5rem",
                        color: "#4caf50"
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                </div>

                <div style={{
                  height: "1px",
                  background: "#e0e0e0",
                  margin: "1.5rem 0"
                }}></div>

                {/* Current Password Verification for Email Change */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ 
                    display: "block", 
                    fontWeight: "600", 
                    marginBottom: "0.5rem",
                    color: "#333"
                  }}>
                    🔒 Parola Curentă (pentru verificare)
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      id="emailCurrentPasswordField"
                      value={currentPassword}
                      onChange={handleCurrentPasswordChange}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          // Dacă parola e validă, submit formular
                          if (passwordValid) {
                            document.querySelector('button[type="submit"]')?.click();
                          }
                        }
                      }}
                      placeholder="Introdu parola curentă"
                      required
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        paddingRight: passwordValid ? "5rem" : "3.5rem",
                        border: passwordValid ? "2px solid #4caf50" : "2px solid #e0e0e0",
                        borderRadius: "8px",
                        fontSize: "1rem",
                        outline: "none",
                        transition: "border-color 0.3s"
                      }}
                      onFocus={(e) => e.target.style.borderColor = passwordValid ? "#4caf50" : "#ff6b35"}
                      onBlur={(e) => e.target.style.borderColor = passwordValid ? "#4caf50" : "#e0e0e0"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
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
                        zIndex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      {showCurrentPassword ? (
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
                    {validatingPassword && (
                      <div style={{
                        position: "absolute",
                        right: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "20px",
                        height: "20px",
                        border: "2px solid #ff6b35",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite"
                      }}></div>
                    )}
                    {!validatingPassword && passwordValid && (
                      <div style={{
                        position: "absolute",
                        right: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: "1.5rem",
                        color: "#4caf50"
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* New Password Fields */}
            {showPasswordFields && (
              <>
                {/* Current Password Verification */}
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ 
                    display: "block", 
                    fontWeight: "600", 
                    marginBottom: "0.5rem",
                    color: "#333"
                  }}>
                    🔒 Parola Curentă (pentru verificare)
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      id="currentPasswordField"
                      value={currentPassword}
                      onChange={handleCurrentPasswordChange}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          document.getElementById('newPasswordField')?.focus();
                        }
                      }}
                      placeholder="Introdu parola curentă"
                      required
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        paddingRight: passwordValid ? "5rem" : "3.5rem",
                        border: passwordValid ? "2px solid #4caf50" : "2px solid #e0e0e0",
                        borderRadius: "8px",
                        fontSize: "1rem",
                        outline: "none",
                        transition: "border-color 0.3s"
                      }}
                      onFocus={(e) => e.target.style.borderColor = passwordValid ? "#4caf50" : "#ff6b35"}
                      onBlur={(e) => e.target.style.borderColor = passwordValid ? "#4caf50" : "#e0e0e0"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
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
                        zIndex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      {showCurrentPassword ? (
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
                    {validatingPassword && (
                      <div style={{
                        position: "absolute",
                        right: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        width: "20px",
                        height: "20px",
                        border: "2px solid #ff6b35",
                        borderTopColor: "transparent",
                        borderRadius: "50%",
                        animation: "spin 0.8s linear infinite"
                      }}></div>
                    )}
                    {!validatingPassword && passwordValid && (
                      <div style={{
                        position: "absolute",
                        right: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: "1.5rem",
                        color: "#4caf50"
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ 
                    display: "block", 
                    fontWeight: "600", 
                    marginBottom: "0.5rem",
                    color: "#333"
                  }}>
                    🔐 Parolă Nouă
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showNewPassword ? "text" : "password"}
                      id="newPasswordField"
                      value={newPassword}
                      onChange={(e) => {
                        const value = e.target.value;
                        setNewPassword(value);
                        
                        // Verifică în timp real dacă parola nouă este identică cu cea curentă
                        if (value.length > 0 && value === currentPassword) {
                          setNewPasswordSameAsCurrent(true);
                          setNewPasswordValid(false);
                        } else {
                          setNewPasswordSameAsCurrent(false);
                          
                          // Validează cerințele parolei în timp real
                          const hasMinLength = value.length >= 8;
                          const hasUpperCase = /[A-Z]/.test(value);
                          const hasNumber = /[0-9]/.test(value);
                          const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(value);
                          
                          const isValid = hasMinLength && hasUpperCase && hasNumber && hasSpecialChar;
                          setNewPasswordValid(isValid);
                          
                          // Re-validează confirmarea dacă există
                          if (confirmPassword.length > 0) {
                            setConfirmPasswordValid(value === confirmPassword && isValid);
                          }
                        }
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          document.getElementById('confirmPasswordField')?.focus();
                        }
                      }}
                      placeholder="Minim 8 caractere, 1 majusculă, 1 cifră, 1 caracter special"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        paddingRight: (newPasswordSameAsCurrent || newPasswordValid) ? "5rem" : "3.5rem",
                        border: newPasswordSameAsCurrent ? "2px solid #f44336" : (newPasswordValid ? "2px solid #4caf50" : "2px solid #e0e0e0"),
                        borderRadius: "8px",
                        fontSize: "1rem",
                        outline: "none",
                        transition: "border-color 0.3s"
                      }}
                      onFocus={(e) => e.target.style.borderColor = newPasswordSameAsCurrent ? "#f44336" : (newPasswordValid ? "#4caf50" : "#ff6b35")}
                      onBlur={(e) => e.target.style.borderColor = newPasswordSameAsCurrent ? "#f44336" : (newPasswordValid ? "#4caf50" : "#e0e0e0")}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      style={{
                        position: "absolute",
                        right: (newPasswordSameAsCurrent || newPasswordValid) ? "3rem" : "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: "0",
                        color: "#666",
                        zIndex: 1,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center"
                      }}
                    >
                      {showNewPassword ? (
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
                    {newPasswordSameAsCurrent && (
                      <div style={{
                        position: "absolute",
                        right: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: "1.5rem",
                        color: "#f44336"
                      }}>
                        ✕
                      </div>
                    )}
                    {!newPasswordSameAsCurrent && newPasswordValid && (
                      <div style={{
                        position: "absolute",
                        right: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: "1.5rem",
                        color: "#4caf50"
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                  {newPasswordSameAsCurrent && (
                    <p style={{ fontSize: "0.85rem", color: "#f44336", marginTop: "0.5rem", marginBottom: 0 }}>
                      ⚠️ Parola nouă nu poate fi identică cu cea curentă
                    </p>
                  )}
                  {!newPasswordSameAsCurrent && (
                    <p style={{ fontSize: "0.85rem", color: "#666", marginTop: "0.5rem", marginBottom: 0 }}>
                      Cerințe: min. 8 caractere, o majusculă, o cifră, un caracter special (!@#$%^&*)
                    </p>
                  )}
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ 
                    display: "block", 
                    fontWeight: "600", 
                    marginBottom: "0.5rem",
                    color: "#333"
                  }}>
                    🔐 Confirmă Parola Nouă
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPasswordField"
                      value={confirmPassword}
                      onChange={(e) => {
                        const value = e.target.value;
                        setConfirmPassword(value);
                        
                        // Validează în timp real dacă match cu parola nouă și dacă parola nouă e validă
                        if (value.length > 0 && value === newPassword && newPasswordValid) {
                          setConfirmPasswordValid(true);
                        } else {
                          setConfirmPasswordValid(false);
                        }
                      }}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          // Dacă confirmarea e validă, submit formular
                          if (confirmPasswordValid) {
                            document.querySelector('button[type="submit"]')?.click();
                          }
                        }
                      }}
                      placeholder="Re-introdu parola"
                      style={{
                        width: "100%",
                        padding: "0.75rem",
                        paddingRight: confirmPasswordValid ? "5rem" : "3.5rem",
                        border: confirmPasswordValid ? "2px solid #4caf50" : "2px solid #e0e0e0",
                        borderRadius: "8px",
                        fontSize: "1rem",
                        outline: "none",
                        transition: "border-color 0.3s"
                      }}
                      onFocus={(e) => e.target.style.borderColor = confirmPasswordValid ? "#4caf50" : "#ff6b35"}
                      onBlur={(e) => e.target.style.borderColor = confirmPasswordValid ? "#4caf50" : "#e0e0e0"}
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
                        zIndex: 1,
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
                      <div style={{
                        position: "absolute",
                        right: "1rem",
                        top: "50%",
                        transform: "translateY(-50%)",
                        fontSize: "1.5rem",
                        color: "#4caf50"
                      }}>
                        ✓
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || (!showEmailFields && !showPasswordFields)}
              style={{
                width: "100%",
                marginTop: "2rem",
                padding: "1rem",
                fontSize: "1.1rem",
                fontWeight: "600",
                opacity: (!showEmailFields && !showPasswordFields) ? 0.5 : 1
              }}
            >
              {saving ? "Se salvează..." : "💾 Salvează modificările"}
            </button>
          </form>
        </div>

        <div style={{
          marginTop: "1.5rem",
          padding: "1rem",
          background: "rgba(255, 193, 7, 0.1)",
          borderRadius: "8px",
          border: "1px solid rgba(255, 193, 7, 0.3)"
        }}>
          <p style={{ fontSize: "0.9rem", color: "#666", margin: 0 }}>
            ⚠️ <strong>Atenție:</strong> Pentru securitatea contului tău, trebuie să introduci parola curentă pentru orice modificare. Dacă modifici email-ul, vei fi delogat automat.
          </p>
        </div>
      </div>

      {/* Floating Action Button Menu */}
      <div className="fab-container">
        {/* Menu Items (appear when expanded) */}
        <button
          className={`fab-menu-item fab-menu-item-1 ${showFabMenu ? 'show' : ''}`}
          onClick={() => {
            alert('🌙 Dark Mode toggle - funcționalitate viitoare!');
          }}
          title="Dark Mode"
        >
          🌙
        </button>
        <button
          className={`fab-menu-item fab-menu-item-2 ${showFabMenu ? 'show' : ''}`}
          onClick={handleSettings}
          title="Settings"
        >
          ⚙️
        </button>
        <button
          className={`fab-menu-item fab-menu-item-3 ${showFabMenu ? 'show' : ''}`}
          onClick={handleHelp}
          title="Help & Support"
        >
          ❓
        </button>
        <button
          className={`fab-menu-item fab-menu-item-4 ${showFabMenu ? 'show' : ''}`}
          onClick={() => setShowShortcuts(true)}
          title="Keyboard Shortcuts (apasă ?)"
        >
          ⌨️
        </button>
        
        {/* Main FAB Button */}
        <button
          className={`fab-main ${showFabMenu ? 'active' : ''}`}
          onClick={() => setShowFabMenu(!showFabMenu)}
          title="Menu"
        >
          <span className="fab-icon">{showFabMenu ? '×' : '+'}</span>
        </button>
      </div>

      {/* Keyboard Shortcuts Help Modal */}
      {showShortcuts && (
        <ShortcutsHelp 
          onClose={() => setShowShortcuts(false)}
        />
      )}
    </div>
  );
}
