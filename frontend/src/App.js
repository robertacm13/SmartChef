import React, { useState, lazy, Suspense } from "react";
import { applyTheme, applyFontSize } from "./AppSettings";
import Dashboard from "./Dashboard";
import "./App.css";

const Login = lazy(() => import("./Login"));
const Register = lazy(() => import("./Register"));
const History = lazy(() => import("./History"));
const PersonalData = lazy(() => import("./PersonalData"));
const AccountSettings = lazy(() => import("./AccountSettings"));
const AppSettings = lazy(() => import("./AppSettings"));
const Goals = lazy(() => import("./Goals"));
const WeightTracking = lazy(() => import("./WeightTracking"));
const Home = lazy(() => import("./Home"));
const AnalyzeFood = lazy(() => import("./AnalyzeFood"));

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
    const savedTheme = localStorage.getItem('appTheme') || 'orange';
    const savedFontSize = localStorage.getItem('appFontSize') || 'medium';
    const savedLang = localStorage.getItem('appLanguage') || 'ro';
    applyTheme(savedTheme);
    applyFontSize(savedFontSize);
    document.documentElement.lang = savedLang;
  }, []);

  const handleLoginSuccess = (token, email) => {
    setAuthToken(token);
    setUserEmail(email);
    // Salvează datele în localStorage pentru persistență
    localStorage.setItem('authToken', token);
    localStorage.setItem('userEmail', email);
    // Navighează la pagina implicită setată de utilizator
    const defaultPage = localStorage.getItem('appDefaultPage') || 'main';
    setCurrentPage(defaultPage);
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

  const handleHelp = () => {
    // Placeholder pentru pagina de help
    alert("❓ Help & Support\n\nFor assistance:\n📧 Email: support@smartchef.ro\n📚 Documentation: Check FEATURES.md\n🐛 Report bugs on GitHub\n\nQuick Tips:\n- Upload clear food images\n- Use dark mode for better viewing\n- Export analyses as PDF\n- Mark favorites with ⭐");
  };

  const renderPage = () => {
    switch (currentPage) {
      case "login":
        return <Login onBack={() => setCurrentPage("main")} onLoginSuccess={handleLoginSuccess} onNavigateToRegister={() => setCurrentPage("register")} />;
      case "register":
        return <Register onBack={() => setCurrentPage("main")} onRegisterSuccess={() => setCurrentPage("login")} onNavigateToLogin={() => setCurrentPage("login")} />;
      case "history":
        return <History userEmail={userEmail} onBack={handleGoHome} onLogout={handleLogout} onNavigate={(page) => setCurrentPage(page)} darkMode={darkMode} toggleDarkMode={toggleDarkMode} handleSettings={handleSettings} handleHelp={handleHelp} />;
      case "dashboard":
        return <Dashboard userEmail={userEmail} onBack={handleGoHome} onLogout={handleLogout} onNavigate={(page) => setCurrentPage(page)} darkMode={darkMode} toggleDarkMode={toggleDarkMode} handleSettings={handleSettings} handleHelp={handleHelp} />;
      case "personal-data":
        return <PersonalData userEmail={userEmail} onBack={handleGoHome} onLogout={handleLogout} onNavigate={(page) => setCurrentPage(page)} />;
      case "account-settings":
        return <AccountSettings userEmail={userEmail} onBack={handleGoHome} onEmailChange={(newEmail) => { 
          setUserEmail(newEmail); 
          localStorage.setItem('userEmail', newEmail); 
          handleLogout(); 
        }} onLogout={handleLogout} onNavigate={(page) => setCurrentPage(page)} />;
      case "app-settings":
        return <AppSettings userEmail={userEmail} onBack={handleGoHome} onLogout={handleLogout} onNavigate={(page) => setCurrentPage(page)} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />;
      case "goals":
        return <Goals userEmail={userEmail} onBack={handleGoHome} onLogout={handleLogout} onNavigate={(page) => setCurrentPage(page)} />;
      case "weight-tracking":
        return <WeightTracking userEmail={userEmail} onBack={handleGoHome} onLogout={handleLogout} onNavigate={(page) => setCurrentPage(page)} />;
      case "analyze-food":
        return <AnalyzeFood authToken={authToken} userEmail={userEmail} onNavigate={(page) => setCurrentPage(page)} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />;
      default:
        return <Home authToken={authToken} userEmail={userEmail} onNavigate={(page) => setCurrentPage(page)} onLogout={handleLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} />;
    }
  };

  return (
    <>
      <a href="#main-content" className="skip-link">Sari la conținutul principal</a>
      <Suspense
        fallback={
          <div className="container" style={{ textAlign: "center", padding: "3rem" }}>
            <div className="spinner"></div>
            <p style={{ marginTop: "1rem", color: "#666" }}>Se încarcă pagina...</p>
          </div>
        }
      >
        <main id="main-content" tabIndex="-1">
          {renderPage()}
        </main>
      </Suspense>
    </>
  );
}

export default App;
