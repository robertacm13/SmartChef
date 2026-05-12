import React, { useState, lazy, Suspense } from "react";
import { applyTheme, applyFontSize } from "./AppSettings";
import Dashboard from "./Dashboard";
import "./App.css";

const Login = lazy(() => import("./Login"));
const Register = lazy(() => import("./Register"));
const ForgotPassword = lazy(() => import("./ForgotPassword"));
const ResetPassword = lazy(() => import("./ResetPassword"));
const History = lazy(() => import("./History"));
const Notifications = lazy(() => import("./Notifications"));
const PersonalData = lazy(() => import("./PersonalData"));
const AccountSettings = lazy(() => import("./AccountSettings"));
const AppSettings = lazy(() => import("./AppSettings"));
const Goals = lazy(() => import("./Goals"));
const WeightTracking = lazy(() => import("./WeightTracking"));
const Home = lazy(() => import("./Home"));
const AnalyzeFood = lazy(() => import("./AnalyzeFood"));
const RecipeGenerator = lazy(() => import("./RecipeGenerator"));

function App() {
  const [currentPage, setCurrentPage] = useState("main");
  const [authToken, setAuthToken] = useState(() => {
    // Restaurează token-ul din localStorage la mount
    return localStorage.getItem('authToken') || null;
  });
  const [userEmail, setUserEmail] = useState(() => {
    // Restaurează email-ul din localStorage la mount
    return localStorage.getItem('userEmail') || "";
  });
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
    document.body.classList.toggle('dark-mode', newMode);
  };

  // Apply dark mode on mount
  React.useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  // Apply saved theme and font size on mount
  React.useEffect(() => {
    // Force grey theme for pre-login pages (Home, Register, Login)
    if (!authToken) {
      applyTheme('grey');
    } else {
      // Allow saved theme only after login
      const savedTheme = localStorage.getItem('appTheme') || 'grey';
      applyTheme(savedTheme);
    }
    const savedFontSize = localStorage.getItem('appFontSize') || 'medium';
    const savedLang = localStorage.getItem('appLanguage') || 'ro';
    applyFontSize(savedFontSize);
    document.documentElement.lang = savedLang;
  }, [authToken]);

  // Auto-redirect to dashboard if logged in and on home page
  React.useEffect(() => {
    if (authToken && currentPage === "main") {
      setCurrentPage("dashboard");
    }
  }, [authToken, currentPage]);

  // Check for password reset token in URL on mount
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const resetToken = params.get("token");
    
    if (resetToken) {
      setCurrentPage("reset-password");
    }
  }, []);

  const handleLoginSuccess = (token, email) => {
    setAuthToken(token);
    setUserEmail(email);
    // Salvează datele în localStorage pentru persistență
    localStorage.setItem('authToken', token);
    localStorage.setItem('userEmail', email);
    // Navighează la dashboard după login
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUserEmail("");
    // Șterge datele din localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    setCurrentPage("main");
  };

  const handleGoHome = () => {
    setCurrentPage("main");
  };

  const handleSettings = () => {
    setCurrentPage("app-settings");
  };

  const [showHelpModal, setShowHelpModal] = React.useState(false);

  const handleHelp = () => {
    setShowHelpModal(true);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "login":
        return <Login onBack={() => setCurrentPage("main")} onLoginSuccess={handleLoginSuccess} onNavigateToRegister={() => setCurrentPage("register")} onNavigate={(page) => setCurrentPage(page)} darkMode={darkMode} toggleDarkMode={toggleDarkMode} currentPage={currentPage} />;
      case "register":
        return <Register onBack={() => setCurrentPage("main")} onRegisterSuccess={() => setCurrentPage("login")} onNavigateToLogin={() => setCurrentPage("login")} darkMode={darkMode} toggleDarkMode={toggleDarkMode} currentPage={currentPage} />;
      case "forgot-password":
        return <ForgotPassword onBack={() => setCurrentPage("login")} onNavigate={(page) => setCurrentPage(page)} currentPage={currentPage} />;
      case "reset-password":
        return <ResetPassword onBack={() => setCurrentPage("login")} onLoginSuccess={handleLoginSuccess} currentPage={currentPage} />;
      case "history":
        return <History userEmail={userEmail} onBack={handleGoHome} onLogout={handleLogout} onNavigate={(page) => setCurrentPage(page)} darkMode={darkMode} toggleDarkMode={toggleDarkMode} handleSettings={handleSettings} handleHelp={handleHelp} currentPage={currentPage} />;
      case "notifications":
        return <Notifications userEmail={userEmail} onBack={handleGoHome} onLogout={handleLogout} onNavigate={(page) => setCurrentPage(page)} darkMode={darkMode} toggleDarkMode={toggleDarkMode} handleSettings={handleSettings} handleHelp={handleHelp} currentPage={currentPage} />;
      case "dashboard":
        return <Dashboard userEmail={userEmail} onBack={handleGoHome} onLogout={handleLogout} onNavigate={(page) => setCurrentPage(page)} darkMode={darkMode} toggleDarkMode={toggleDarkMode} handleSettings={handleSettings} handleHelp={handleHelp} currentPage={currentPage} />;
      case "personal-data":
        return <PersonalData userEmail={userEmail} onBack={handleGoHome} onLogout={handleLogout} onNavigate={(page) => setCurrentPage(page)} currentPage={currentPage} darkMode={darkMode} toggleDarkMode={toggleDarkMode} handleHelp={handleHelp} />;
      case "account-settings":
        return <AccountSettings userEmail={userEmail} onBack={handleGoHome} onEmailChange={(newEmail) => { 
          setUserEmail(newEmail); 
          localStorage.setItem('userEmail', newEmail); 
          handleLogout(); 
        }} onLogout={handleLogout} onNavigate={(page) => setCurrentPage(page)} currentPage={currentPage} darkMode={darkMode} toggleDarkMode={toggleDarkMode} handleHelp={handleHelp} />;
      case "app-settings":
        return <AppSettings userEmail={userEmail} onBack={handleGoHome} onLogout={handleLogout} onNavigate={(page) => setCurrentPage(page)} darkMode={darkMode} toggleDarkMode={toggleDarkMode} currentPage={currentPage} handleHelp={handleHelp} />;
      case "goals":
        return <Goals userEmail={userEmail} onBack={handleGoHome} onLogout={handleLogout} onNavigate={(page) => setCurrentPage(page)} currentPage={currentPage} darkMode={darkMode} toggleDarkMode={toggleDarkMode} handleHelp={handleHelp} />;
      case "weight-tracking":
        return <WeightTracking userEmail={userEmail} onBack={handleGoHome} onLogout={handleLogout} onNavigate={(page) => setCurrentPage(page)} currentPage={currentPage} darkMode={darkMode} toggleDarkMode={toggleDarkMode} handleHelp={handleHelp} />;
      case "analyze-food":
        return <AnalyzeFood authToken={authToken} userEmail={userEmail} onNavigate={(page) => setCurrentPage(page)} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} currentPage={currentPage} handleHelp={handleHelp} />;
      case "recipe-generator":
        return <RecipeGenerator userEmail={userEmail} onBack={handleGoHome} onLogout={handleLogout} onNavigate={(page) => setCurrentPage(page)} darkMode={darkMode} toggleDarkMode={toggleDarkMode} handleHelp={handleHelp} currentPage={currentPage} />;
      default:
        return <Home authToken={authToken} userEmail={userEmail} onNavigate={(page) => setCurrentPage(page)} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} currentPage={currentPage} />;
    }
  };

  return (
    <>
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <Suspense
        fallback={
          <div className="container" style={{ textAlign: "center", padding: "3rem" }}>
            <div className="spinner"></div>
            <p style={{ marginTop: "1rem", color: "#666" }}>Loading page...</p>
          </div>
        }
      >
        <main id="main-content" tabIndex="-1">
          {renderPage()}
        </main>
      </Suspense>

      {/* Help & Support Modal */}
      {showHelpModal && (
        <div
          onClick={() => setShowHelpModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.55)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999,
            backdropFilter: "blur(4px)"
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: darkMode ? "#1E293B" : "#FFFFFF",
              borderRadius: "20px",
              padding: "2.5rem",
              maxWidth: "480px",
              width: "90%",
              boxShadow: "0 25px 60px rgba(0,0,0,0.3)",
              border: darkMode ? "1px solid #334155" : "1px solid #E2E8F0",
              position: "relative",
              animation: "fadeInScale 0.2s ease"
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setShowHelpModal(false)}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: darkMode ? "#334155" : "#F1F5F9",
                border: "none",
                borderRadius: "50%",
                width: "32px",
                height: "32px",
                cursor: "pointer",
                fontSize: "1rem",
                color: darkMode ? "#94A3B8" : "#64748B",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: "bold"
              }}
            >✕</button>

            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <div style={{
                width: "48px", height: "48px",
                background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                borderRadius: "12px",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "1.5rem"
              }}>❓</div>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.4rem", fontWeight: "700", color: darkMode ? "#E2E8F0" : "#1E293B" }}>
                  Help &amp; Support
                </h2>
                <p style={{ margin: 0, fontSize: "0.85rem", color: darkMode ? "#94A3B8" : "#64748B" }}>SmartChef v1.0</p>
              </div>
            </div>

            {/* Contact section */}
            <div style={{
              background: darkMode ? "#0F172A" : "#F8FAFC",
              borderRadius: "12px",
              padding: "1.25rem",
              marginBottom: "1rem",
              border: darkMode ? "1px solid #334155" : "1px solid #E2E8F0"
            }}>
              <p style={{ margin: "0 0 0.75rem 0", fontWeight: "600", fontSize: "0.9rem", color: darkMode ? "#94A3B8" : "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>For assistance</p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                <a href="mailto:support@smartchef.ro" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#3B82F6", textDecoration: "none", fontSize: "0.95rem", fontWeight: "500" }}>
                  📧 support@smartchef.ro
                </a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#3B82F6", textDecoration: "none", fontSize: "0.95rem", fontWeight: "500" }}>
                  🐛 Report bugs on GitHub
                </a>
              </div>
            </div>

            {/* Quick Tips */}
            <div style={{
              background: darkMode ? "#0F172A" : "#F8FAFC",
              borderRadius: "12px",
              padding: "1.25rem",
              marginBottom: "1.5rem",
              border: darkMode ? "1px solid #334155" : "1px solid #E2E8F0"
            }}>
              <p style={{ margin: "0 0 0.75rem 0", fontWeight: "600", fontSize: "0.9rem", color: darkMode ? "#94A3B8" : "#64748B", textTransform: "uppercase", letterSpacing: "0.05em" }}>Quick Tips</p>
              <ul style={{ margin: 0, paddingLeft: "1.25rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                {[
                  "Upload clear, well-lit food images",
                  "Use dark mode for better night viewing",
                  "Export analyses as PDF to save them",
                  "Mark favourites with ⭐ for quick access",
                  "Use keyboard shortcuts for faster navigation"
                ].map((tip, i) => (
                  <li key={i} style={{ fontSize: "0.9rem", color: darkMode ? "#CBD5E1" : "#475569", lineHeight: "1.5" }}>{tip}</li>
                ))}
              </ul>
            </div>

            {/* Close button */}
            <button
              onClick={() => setShowHelpModal(false)}
              style={{
                width: "100%",
                padding: "0.75rem",
                background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "opacity 0.2s"
              }}
              onMouseOver={e => e.currentTarget.style.opacity = "0.9"}
              onMouseOut={e => e.currentTarget.style.opacity = "1"}
            >
              Got it!
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default App;

