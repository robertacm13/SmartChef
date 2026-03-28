import { useState, useEffect } from "react";
import { ShortcutsHelp } from "./utils/keyboardShortcuts";
import "./utils/keyboardShortcuts.css";
import "./App.css";

const THEMES = [
  {
    id: "orange",
    name: "Orange",
    emoji: "🟠",
    description: "Tema implicită",
    primary: "#ff6b35",
    accent: "#ff8c42",
    bg: "#ffecd1",
    headerFrom: "#ff8c42",
    headerTo: "#ff6b35",
    fabColor: "#ff6b35",
  },
  {
    id: "forest",
    name: "Forest",
    emoji: "🌿",
    description: "Verde natural",
    primary: "#2e7d32",
    accent: "#43a047",
    bg: "#e8f5e9",
    headerFrom: "#43a047",
    headerTo: "#2e7d32",
    fabColor: "#2e7d32",
  },
  {
    id: "ocean",
    name: "Ocean",
    emoji: "🌊",
    description: "Albastru oceanic",
    primary: "#1565c0",
    accent: "#1976d2",
    bg: "#e3f2fd",
    headerFrom: "#42a5f5",
    headerTo: "#1565c0",
    fabColor: "#1565c0",
  },
  {
    id: "lavender",
    name: "Lavender",
    emoji: "💜",
    description: "Violet delicat",
    primary: "#7b1fa2",
    accent: "#9c27b0",
    bg: "#f3e5f5",
    headerFrom: "#ba68c8",
    headerTo: "#7b1fa2",
    fabColor: "#7b1fa2",
  },
  {
    id: "rose",
    name: "Rose",
    emoji: "🌹",
    description: "Roșu romantic",
    primary: "#c62828",
    accent: "#e53935",
    bg: "#fce4ec",
    headerFrom: "#ef9a9a",
    headerTo: "#c62828",
    fabColor: "#c62828",
  },
];

const FONT_SIZES = [
  { id: "small", name: "Mic", size: "14px", description: "Potrivit pentru ecrane mici" },
  { id: "medium", name: "Mediu", size: "16px", description: "Dimensiunea implicită" },
  { id: "large", name: "Mare", size: "18px", description: "Mai ușor de citit" },
];

const LANGUAGES = [
  { id: "ro", name: "Română", code: "RO" },
  { id: "en", name: "English", code: "EN" },
];

const DEFAULT_PAGES = [
  { id: "main", name: "Analiză", emoji: "🍳", description: "Pagina principală de upload" },
  { id: "dashboard", name: "Dashboard", emoji: "📈", description: "Statistici și grafice" },
  { id: "history", name: "Istoric", emoji: "📋", description: "Istoricul analizelor" },
];

const UNITS = [
  { id: "kcal", name: "kcal", description: "Kilocalorii (standard)" },
  { id: "kj", name: "kJ", description: "Kilojouli (1 kcal = 4.184 kJ)" },
];

export function applyTheme(themeId) {
  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
  document.documentElement.style.setProperty("--primary", theme.primary);
  document.documentElement.style.setProperty("--accent", theme.accent);
  document.documentElement.style.setProperty("--bg", theme.bg);
  document.documentElement.style.setProperty("--header-from", theme.headerFrom);
  document.documentElement.style.setProperty("--header-to", theme.headerTo);
  document.documentElement.style.setProperty("--fab-color", theme.fabColor);
  document.body.setAttribute("data-theme", themeId);
}

export function applyFontSize(sizeId) {
  const size = FONT_SIZES.find((f) => f.id === sizeId) || FONT_SIZES[1];
  // Set on <html> so rem units scale across the whole app
  document.documentElement.style.fontSize = size.size;
}

export default function AppSettings({
  userEmail,
  onBack,
  onLogout,
  onNavigate,
  darkMode,
  toggleDarkMode,
}) {
  const [activeTheme, setActiveTheme] = useState(
    () => localStorage.getItem("appTheme") || "orange"
  );
  const [activeFontSize, setActiveFontSize] = useState(
    () => localStorage.getItem("appFontSize") || "medium"
  );
  const [activeLanguage, setActiveLanguage] = useState(
    () => localStorage.getItem("appLanguage") || "ro"
  );
  const [langBanner, setLangBanner] = useState(false);
  const [activeDefaultPage, setActiveDefaultPage] = useState(
    () => localStorage.getItem("appDefaultPage") || "main"
  );
  const [activeUnits, setActiveUnits] = useState(
    () => localStorage.getItem("appUnits") || "kcal"
  );
  const [saved, setSaved] = useState(false);

  const [showNavDropdown, setShowNavDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userDropdownTimeout, setUserDropdownTimeout] = useState(null);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadNotifications = async () => {
    try {
      const res = await fetch(`http://localhost:8000/notifications/${userEmail}`);
      const data = await res.json();
      if (data.status === "success") {
        setUnreadCount(data.unread_count);
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  // Fetch unread notifications on component mount
  useEffect(() => {
    if (userEmail) {
      fetchUnreadNotifications();
    }
  }, [userEmail, fetchUnreadNotifications]);

  const handleUserMouseEnter = () => {
    if (userDropdownTimeout) clearTimeout(userDropdownTimeout);
    setShowUserDropdown(true);
  };

  const handleUserMouseLeave = () => {
    const timeout = setTimeout(() => setShowUserDropdown(false), 200);
    setUserDropdownTimeout(timeout);
  };

  const handleHelp = () => {
    alert("❓ Help & Support\n\nFor assistance:\n📧 Email: support@smartchef.ro\n🐛 Report bugs on GitHub\n\nQuick Tips:\n- Upload clear food images\n- Use dark mode for better viewing\n- Export analyses as PDF\n- Mark favorites with ⭐");
  };

  const handleThemeChange = (themeId) => {
    setActiveTheme(themeId);
    applyTheme(themeId);
    localStorage.setItem("appTheme", themeId);
    flashSaved();
  };

  const handleFontSizeChange = (sizeId) => {
    setActiveFontSize(sizeId);
    applyFontSize(sizeId);
    localStorage.setItem("appFontSize", sizeId);
    flashSaved();
  };

  const handleLanguageChange = (langId) => {
    setActiveLanguage(langId);
    localStorage.setItem("appLanguage", langId);
    // Apply lang attribute to HTML element
    document.documentElement.lang = langId;
    if (langId === "en") {
      setLangBanner(true);
    } else {
      setLangBanner(false);
    }
    flashSaved();
  };

  const handleDefaultPageChange = (pageId) => {
    setActiveDefaultPage(pageId);
    localStorage.setItem("appDefaultPage", pageId);
    flashSaved();
  };

  const handleUnitsChange = (unitId) => {
    setActiveUnits(unitId);
    localStorage.setItem("appUnits", unitId);
    flashSaved();
  };

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleResetAll = () => {
    if (window.confirm("Resetezi toate setările la valorile implicite?")) {
      handleThemeChange("orange");
      handleFontSizeChange("medium");
      handleLanguageChange("ro");
      setLangBanner(false);
      handleDefaultPageChange("main");
      handleUnitsChange("kcal");
    }
  };

  return (
    <div className="animated-bg" style={{ minHeight: "100vh" }}>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div
            className="logo"
            onClick={onBack}
            style={{ cursor: "pointer" }}
          >
            🍳 SmartChef
          </div>
          <div className="nav-buttons">
            {userEmail ? (
              <div
                style={{
                  display: "flex",
                  gap: "0.8rem",
                  alignItems: "center",
                  marginLeft: "auto",
                  marginRight: "-0.5rem",
                }}
              >
                {/* Navigation Dropdown */}
                <div
                  style={{ position: "relative" }}
                  onMouseEnter={() => setShowNavDropdown(true)}
                  onMouseLeave={() => setShowNavDropdown(false)}
                >
                  <button
                    className="btn btn-outline"
                    style={{ padding: "0.7rem 1.2rem", fontSize: "1.5rem" }}
                  >
                    ☰
                  </button>
                  {showNavDropdown && (
                    <div className="nav-dropdown">
                      <button
                        className="nav-dropdown-item"
                        onClick={() => {
                          onNavigate("dashboard");
                          setShowNavDropdown(false);
                        }}
                      >
                        📈 Dashboard
                      </button>
                      <button
                        className="nav-dropdown-item"
                        onClick={() => {
                          onNavigate("history");
                          setShowNavDropdown(false);
                        }}
                      >
                        📊 Istoric
                      </button>
                    </div>
                  )}
                </div>

                <div
                  style={{
                    width: "1px",
                    height: "30px",
                    background: "rgba(255,255,255,0.3)",
                    margin: "0 0.5rem",
                  }}
                ></div>

                {/* Notifications Bell */}
                <button
                  className="btn btn-outline"
                  onClick={() => onNavigate('notifications')}
                  style={{ 
                    padding: "0.7rem 1.2rem", 
                    fontSize: "1.5rem", 
                    background: "rgba(255,255,255,0.2)",
                    position: "relative"
                  }}
                  title="Notificări"
                >
                  🔔
                  {unreadCount > 0 && (
                    <span style={{
                      position: "absolute",
                      top: "-5px",
                      right: "-5px",
                      background: "#ff6b35",
                      color: "white",
                      borderRadius: "50%",
                      width: "24px",
                      height: "24px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      border: "2px solid white"
                    }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

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
                      gap: "0.5rem",
                    }}
                  >
                    👤 {userEmail}
                    <span
                      style={{
                        fontSize: "0.7rem",
                        transition: "transform 0.3s",
                        display: "inline-block",
                        transform: showUserDropdown
                          ? "rotate(90deg)"
                          : "rotate(0deg)",
                      }}
                    >
                      ►
                    </span>
                  </button>
                  {showUserDropdown && (
                    <div className="user-dropdown">
                      <button
                        className="user-dropdown-item"
                        onClick={() => alert("🚧 Profil - Coming soon!")}
                      >
                        <span className="dropdown-icon">👤</span>
                        Profil
                      </button>
                      <button
                        className="user-dropdown-item"
                        onClick={() => {
                          onNavigate("personal-data");
                          setShowUserDropdown(false);
                        }}
                      >
                        <span className="dropdown-icon">📊</span>
                        Date personale
                      </button>
                      <button
                        className="user-dropdown-item"
                        onClick={() => {
                          onNavigate("account-settings");
                          setShowUserDropdown(false);
                        }}
                      >
                        <span className="dropdown-icon">🔑</span>
                        Setările contului
                      </button>
                      <button
                        className="user-dropdown-item"
                        onClick={() => {
                          onNavigate("app-settings");
                          setShowUserDropdown(false);
                        }}
                        style={{
                          fontWeight: "600",
                        }}
                      >
                        <span className="dropdown-icon">⚙️</span>
                        Setări aplicație
                      </button>
                      <div className="user-dropdown-divider"></div>
                      <button
                        className="user-dropdown-item logout-item"
                        onClick={onLogout}
                      >
                        <span className="dropdown-icon">🚪</span>
                        Logout
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {/* Page Content */}
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "2rem" }}>
        <button
          className="btn btn-secondary"
          onClick={onBack}
          style={{ marginBottom: "2rem" }}
        >
          ← Înapoi
        </button>

        {/* Title Card */}
        <div
          className="card"
          style={{ padding: "2rem", marginBottom: "1.5rem", textAlign: "center" }}
        >
          <h2
            style={{
              fontSize: "2rem",
              fontWeight: "700",
              color: "var(--primary, #ff6b35)",
              marginBottom: "0.5rem",
            }}
          >
            ⚙️ Setări Aplicație
          </h2>
          <p style={{ color: "#666", fontSize: "0.95rem" }}>
            Personalizează aspectul și comportamentul SmartChef
          </p>
          {saved && (
            <div
              style={{
                marginTop: "1rem",
                padding: "0.6rem 1.2rem",
                background: "rgba(76, 175, 80, 0.12)",
                border: "1px solid rgba(76, 175, 80, 0.4)",
                borderRadius: "8px",
                color: "#388e3c",
                fontWeight: "600",
                fontSize: "0.9rem",
                display: "inline-block",
              }}
            >
              ✅ Setare salvată automat
            </div>
          )}
        </div>

        {/* ===== SECTION: Color Theme ===== */}
        <div className="card appsettings-section" style={{ padding: "1.8rem", marginBottom: "1.5rem" }}>
          <h3 className="appsettings-section-title">🎨 Temă de culori</h3>
          <p className="appsettings-section-desc">Alege paleta de culori a interfeței</p>
          <div className="appsettings-theme-grid">
            {THEMES.map((theme) => (
              <button
                key={theme.id}
                className={`appsettings-theme-card ${activeTheme === theme.id ? "active" : ""}`}
                onClick={() => handleThemeChange(theme.id)}
                style={{
                  "--t-primary": theme.primary,
                  "--t-accent": theme.accent,
                  "--t-bg": theme.bg,
                  borderColor:
                    activeTheme === theme.id ? theme.primary : "transparent",
                }}
              >
                <div
                  className="appsettings-theme-preview"
                  style={{
                    background: `linear-gradient(135deg, ${theme.headerFrom} 0%, ${theme.headerTo} 100%)`,
                  }}
                >
                  <div className="appsettings-theme-preview-bar" style={{ background: theme.bg }} />
                  <div className="appsettings-theme-preview-dot" style={{ background: theme.primary }} />
                </div>
                <span className="appsettings-theme-emoji">{theme.emoji}</span>
                <span className="appsettings-theme-name">{theme.name}</span>
                <span className="appsettings-theme-desc">{theme.description}</span>
                {activeTheme === theme.id && (
                  <span className="appsettings-check">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ===== SECTION: Dark Mode ===== */}
        <div className="card appsettings-section" style={{ padding: "1.8rem", marginBottom: "1.5rem" }}>
          <h3 className="appsettings-section-title">🌙 Mod întunecat</h3>
          <p className="appsettings-section-desc">Activează modul dark pentru confort vizual</p>
          <button
            className={`appsettings-toggle-btn ${darkMode ? "active" : ""}`}
            onClick={toggleDarkMode}
          >
            <span className="appsettings-toggle-icon">{darkMode ? "☀️" : "🌙"}</span>
            <span className="appsettings-toggle-text">
              {darkMode ? "Mod întunecat activat — apasă pentru Light" : "Mod deschis activat — apasă pentru Dark"}
            </span>
            <span className={`appsettings-toggle-switch ${darkMode ? "on" : ""}`}>
              <span className="appsettings-toggle-knob" />
            </span>
          </button>
        </div>

        {/* ===== SECTION: Font Size ===== */}
        <div className="card appsettings-section" style={{ padding: "1.8rem", marginBottom: "1.5rem" }}>
          <h3 className="appsettings-section-title">🔤 Dimensiune text</h3>
          <p className="appsettings-section-desc">
            Ajustează mărimea fontului din toată aplicația
            {" "}<span style={{ fontStyle: "italic", color: "#aaa" }}>
              (activ: {FONT_SIZES.find(f => f.id === activeFontSize)?.name})
            </span>
          </p>
          <div className="appsettings-option-row">
            {FONT_SIZES.map((fs) => (
              <button
                key={fs.id}
                className={`appsettings-option-btn ${activeFontSize === fs.id ? "active" : ""}`}
                onClick={() => handleFontSizeChange(fs.id)}
              >
                <span style={{ fontSize: fs.size, fontWeight: "700" }}>Aa</span>
                <span className="appsettings-option-label">{fs.name}</span>
                <span className="appsettings-option-sub">{fs.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ===== SECTION: Language ===== */}
        <div className="card appsettings-section" style={{ padding: "1.8rem", marginBottom: "1.5rem" }}>
          <h3 className="appsettings-section-title">🌍 Limbă</h3>
          <p className="appsettings-section-desc">
            Setează limba interfeței
          </p>
          {langBanner && (
            <div style={{
              padding: "0.7rem 1rem",
              background: "rgba(33, 150, 243, 0.08)",
              border: "1px solid rgba(33, 150, 243, 0.35)",
              borderRadius: "8px",
              color: "#1565c0",
              fontSize: "0.85rem",
              marginBottom: "1rem"
            }}>
              ℹ️ <strong>English</strong> — traducerea completă a interfeței este în lucru. Unele texte vor rămâne în română momentan.
            </div>
          )}
          <div className="appsettings-option-row">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.id}
                className={`appsettings-option-btn ${activeLanguage === lang.id ? "active" : ""}`}
                onClick={() => handleLanguageChange(lang.id)}
              >
                <span style={{ fontSize: "1.4rem", fontWeight: "800", fontFamily: "monospace", letterSpacing: "1px" }}>{lang.code}</span>
                <span className="appsettings-option-label">{lang.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ===== SECTION: Default Page ===== */}
        <div className="card appsettings-section" style={{ padding: "1.8rem", marginBottom: "1.5rem" }}>
          <h3 className="appsettings-section-title">🏠 Pagină implicită după login</h3>
          <p className="appsettings-section-desc">Ce pagină se deschide primul după autentificare</p>
          <div className="appsettings-option-row">
            {DEFAULT_PAGES.map((page) => (
              <button
                key={page.id}
                className={`appsettings-option-btn ${activeDefaultPage === page.id ? "active" : ""}`}
                onClick={() => handleDefaultPageChange(page.id)}
              >
                <span style={{ fontSize: "1.8rem" }}>{page.emoji}</span>
                <span className="appsettings-option-label">{page.name}</span>
                <span className="appsettings-option-sub">{page.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ===== SECTION: Nutritional Units ===== */}
        <div className="card appsettings-section" style={{ padding: "1.8rem", marginBottom: "1.5rem" }}>
          <h3 className="appsettings-section-title">🔥 Unități nutriționale</h3>
          <p className="appsettings-section-desc">Cum sunt afișate caloriile în aplicație</p>
          <div className="appsettings-option-row">
            {UNITS.map((unit) => (
              <button
                key={unit.id}
                className={`appsettings-option-btn ${activeUnits === unit.id ? "active" : ""}`}
                onClick={() => handleUnitsChange(unit.id)}
              >
                <span style={{ fontSize: "1.5rem", fontWeight: "800", fontFamily: "monospace" }}>
                  {unit.name}
                </span>
                <span className="appsettings-option-label">{unit.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Reset button */}
        <div style={{ textAlign: "center", marginTop: "0.5rem", marginBottom: "3rem" }}>
          <button
            className="btn btn-outline"
            onClick={handleResetAll}
            style={{ color: "#e53935", borderColor: "#e53935" }}
          >
            🔄 Resetează toate setările
          </button>
        </div>
      </div>

      {/* Floating Action Button Menu */}
      <div className="fab-container">
        {/* Menu Items (appear when expanded) */}
        <button
          className={`fab-menu-item fab-menu-item-1 ${showFabMenu ? 'show' : ''}`}
          onClick={toggleDarkMode}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
        <button
          className={`fab-menu-item fab-menu-item-2 ${showFabMenu ? 'show' : ''}`}
          onClick={() => {
            // Already on settings page
            alert('⚙️ Sunteți deja pe pagina de setări!');
          }}
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
