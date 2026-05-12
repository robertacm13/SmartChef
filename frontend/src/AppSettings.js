import { useState, useEffect } from "react";
import logoImg from "./logo.png";
import { ShortcutsHelp } from "./utils/keyboardShortcuts";
import "./utils/keyboardShortcuts.css";
import "./App.css";
import Navbar from "./components/Navbar";

const THEMES = [
  {
    id: "orange",
    name: "Ocean Blue",
    emoji: "🌊",
    description: "Default classic blue",
    primary: "#3B82F6",
    accent: "#2563EB",
    bg: "#DBEAFE",
    headerFrom: "#2563EB",
    headerTo: "#3B82F6",
    fabColor: "#3B82F6",
  },
  {
    id: "forest",
    name: "Emerald",
    emoji: "🌿",
    description: "Fresh green theme",
    primary: "#10B981",
    accent: "#059669",
    bg: "#DCFCE7",
    headerFrom: "#059669",
    headerTo: "#10B981",
    fabColor: "#10B981",
  },
  {
    id: "ocean",
    name: "Sunset",
    emoji: "🌅",
    description: "Warm orange & amber",
    primary: "#F59E0B",
    accent: "#D97706",
    bg: "#FFEDD5",
    headerFrom: "#D97706",
    headerTo: "#F59E0B",
    fabColor: "#F59E0B",
  },
  {
    id: "lavender",
    name: "Rose",
    emoji: "🌸",
    description: "Soft pink & rose",
    primary: "#F43F5E",
    accent: "#E11D48",
    bg: "#FFE4E6",
    headerFrom: "#E11D48",
    headerTo: "#F43F5E",
    fabColor: "#F43F5E",
  },
  {
    id: "rose",
    name: "Purple",
    emoji: "🔮",
    description: "Deep violet theme",
    primary: "#8B5CF6",
    accent: "#7C3AED",
    bg: "#EDE9FE",
    headerFrom: "#7C3AED",
    headerTo: "#8B5CF6",
    fabColor: "#8B5CF6",
  },
  {
    id: "grey",
    name: "Classic Grey",
    emoji: "⚪",
    description: "Neutral grey theme",
    primary: "#3B82F6",
    accent: "#2563EB",
    bg: "#F1F5F9",
    headerFrom: "#2563EB",
    headerTo: "#3B82F6",
    fabColor: "#3B82F6",
  },
];

const FONT_SIZES = [
  { id: "small", name: "Small", size: "14px", description: "Suitable for small screens" },
  { id: "medium", name: "Medium", size: "16px", description: "Default size" },
  { id: "large", name: "Large", size: "18px", description: "Easier to read" },
];

const LANGUAGES = [
  { id: "ro", name: "Română", code: "RO" },
  { id: "en", name: "English", code: "EN" },
];

const DEFAULT_PAGES = [
  { id: "main", name: "Analyze", emoji: "🍳", description: "Main upload page" },
  { id: "dashboard", name: "Dashboard", emoji: "📈", description: "Statistics and charts" },
  { id: "history", name: "History", emoji: "📋", description: "Analysis history" },
];

const UNITS = [
  { id: "kcal", name: "kcal", description: "Kilocalories (standard)" },
  { id: "kj", name: "kJ", description: "Kilojoules (1 kcal = 4.184 kJ)" },
];

export function applyTheme(themeId) {
  const theme = THEMES.find((t) => t.id === themeId) || THEMES[0];
  document.documentElement.style.setProperty("--primary", theme.primary);
  document.documentElement.style.setProperty("--accent", theme.accent);
  document.documentElement.style.setProperty("--bg", theme.bg);
  document.documentElement.style.setProperty("--header-from", theme.headerFrom);
  document.documentElement.style.setProperty("--header-to", theme.headerTo);
  document.documentElement.style.setProperty("--fab-color", theme.fabColor);
  // Convert hex to rgb components for rgba() usage
  const hex = theme.primary.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  document.documentElement.style.setProperty("--primary-rgb", `${r}, ${g}, ${b}`);
  document.body.setAttribute("data-theme", themeId);
}

export function applyFontSize(sizeId) {
  const size = FONT_SIZES.find((f) => f.id === sizeId) || FONT_SIZES[1];
  // Set on <html> so rem units scale across the whole app
  document.documentElement.style.fontSize = size.size;
}

const TRANSLATIONS = {
  ro: {
    appSettings: "Setări aplicație",
    customizeApp: "Personalizează aspectul și comportamentul SmartChef",
    settingSaved: "Setare salvată automat",
    colorTheme: "Temă culori",
    choosePalette: "Alege paleta de culori a interfeței",
    darkMode: "Mod întunecat",
    enableDarkMode: "Activează modul întunecat pentru confort vizual",
    darkModeEnabled: "Mod întunecat activat — apasă pentru Lumini",
    lightModeEnabled: "Mod luminos activat — apasă pentru Întuneric",
    textSize: "Dimensiune text",
    adjustFontSize: "Ajustează dimensiunea fontului în întreaga aplicație",
    current: "curent",
    language: "Limbă",
    setLanguage: "Setează limba interfeței",
    homePageAfterSignIn: "Pagina de pornire după autentificare",
    whichPageOpens: "Care pagină se deschide prima după autentificare",
    nutritionalUnits: "Unități nutriționale",
    howCaloriesDisplayed: "Cum sunt afișate caloriile în aplicație",
    resetAllSettings: "Resetează toate setările",
    confirmReset: "Resetezi toate setările la valorile implicite?",
    back: "Înapoi",
    skipToMain: "Sari la conținutul principal",
    themes: {
      orange: { name: "Ocean Blue", desc: "Albastru clasic implicit" },
      forest: { name: "Emerald", desc: "Temă verde proaspătă" },
      ocean: { name: "Sunset", desc: "Portocaliu cald și chihlimbar" },
      lavender: { name: "Rose", desc: "Roz moale și trandafir" },
      rose: { name: "Purple", desc: "Temă violet profund" },
      grey: { name: "Classic Grey", desc: "Temă neutră de gri" },
    },
    fontSizes: {
      small: { name: "Mic", desc: "Potrivit pentru ecrane mici" },
      medium: { name: "Mediu", desc: "Dimensiune implicită" },
      large: { name: "Mare", desc: "Mai ușor de citit" },
    },
    defaultPages: {
      main: { name: "Analiză", desc: "Pagina principală de încărcare" },
      dashboard: { name: "Panou control", desc: "Statistici și grafice" },
      history: { name: "Istoric", desc: "Istoricul analizelor" },
    },
    units: {
      kcal: { name: "kcal", desc: "Kilocalorii (standard)" },
      kj: { name: "kJ", desc: "Kilojouli (1 kcal = 4.184 kJ)" },
    }
  },
  en: {
    appSettings: "App Settings",
    customizeApp: "Customize the appearance and behavior of SmartChef",
    settingSaved: "Setting saved automatically",
    colorTheme: "Color Theme",
    choosePalette: "Choose the interface color palette",
    darkMode: "Dark Mode",
    enableDarkMode: "Enable dark mode for visual comfort",
    darkModeEnabled: "Dark mode enabled — press for Light",
    lightModeEnabled: "Light mode enabled — press for Dark",
    textSize: "Text Size",
    adjustFontSize: "Adjust the font size across the entire app",
    current: "current",
    language: "Language",
    setLanguage: "Set the interface language",
    homePageAfterSignIn: "Home Page after Sign In",
    whichPageOpens: "Which page opens first after authentication",
    nutritionalUnits: "Nutritional Units",
    howCaloriesDisplayed: "How calories are displayed in the app",
    resetAllSettings: "Reset all settings",
    confirmReset: "Reset all settings to default values?",
    back: "Back",
    skipToMain: "Skip to main content",
    themes: {
      orange: { name: "Ocean Blue", desc: "Default classic blue" },
      forest: { name: "Emerald", desc: "Fresh green theme" },
      ocean: { name: "Sunset", desc: "Warm orange & amber" },
      lavender: { name: "Rose", desc: "Soft pink & rose" },
      rose: { name: "Purple", desc: "Deep violet theme" },
      grey: { name: "Classic Grey", desc: "Neutral grey theme" },
    },
    fontSizes: {
      small: { name: "Small", desc: "Suitable for small screens" },
      medium: { name: "Medium", desc: "Default size" },
      large: { name: "Large", desc: "Easier to read" },
    },
    defaultPages: {
      main: { name: "Analyze", desc: "Main upload page" },
      dashboard: { name: "Dashboard", desc: "Statistics and charts" },
      history: { name: "History", desc: "Analysis history" },
    },
    units: {
      kcal: { name: "kcal", desc: "Kilocalories (standard)" },
      kj: { name: "kJ", desc: "Kilojoules (1 kcal = 4.184 kJ)" },
    }
  }
};

export default function AppSettings({
  userEmail,
  onBack,
  onLogout,
  onNavigate,
  darkMode,
  toggleDarkMode,
  currentPage,
  handleHelp,
}) {
  const [activeTheme, setActiveTheme] = useState(
    () => localStorage.getItem("appTheme") || "orange"
  );
  const [activeFontSize, setActiveFontSize] = useState(
    () => localStorage.getItem("appFontSize") || "medium"
  );
  const [activeLanguage, setActiveLanguage] = useState("en");
  const t = TRANSLATIONS[activeLanguage] || TRANSLATIONS.en;
  const [langBanner, setLangBanner] = useState(false);
  const [activeDefaultPage, setActiveDefaultPage] = useState(
    () => localStorage.getItem("appDefaultPage") || "main"
  );
  const [activeUnits, setActiveUnits] = useState(
    () => localStorage.getItem("appUnits") || "kcal"
  );
  const [saved, setSaved] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);

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
    if (window.confirm(t.confirmReset)) {
      handleThemeChange("orange");
      handleFontSizeChange("medium");
      handleLanguageChange("en");
      setLangBanner(false);
      handleDefaultPageChange("main");
      handleUnitsChange("kcal");
    }
  };

  return (
    <div className="animated-bg" style={{ minHeight: "100vh", background: darkMode ? "#0F172A" : "var(--bg, #F1F5F9)" }}>
      {/* Skip Link untuk keyboard navigation - WCAG 2.1 */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      <Navbar
        userEmail={userEmail}
        onBack={onBack}
        onNavigate={onNavigate}
        onLogout={onLogout}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        handleHelp={handleHelp}
        currentPage={currentPage}
      />

      {/* Page Content */}
      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "6rem 2rem 2rem 2rem" }}>
        <button
          className="btn btn-secondary"
          onClick={onBack}
          style={{ marginBottom: "2rem" }}
        >
          ← {t.back}
        </button>

        {/* Title Card */}
        <div
          className="card"
          style={{ padding: "6rem 2rem 2rem 2rem", marginBottom: "1.5rem", textAlign: "center", background: darkMode ? "#1E293B" : "#FFFFFF", border: darkMode ? "1px solid #334155" : "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)" }}
        >
          <h2
            style={{
              fontSize: "2rem",
              fontWeight: "700",
              color: "var(--primary, #3B82F6)",
              marginBottom: "0.5rem",
            }}
          >
            ⚙️ {t.appSettings}
          </h2>
          <p style={{ color: darkMode ? "#94A3B8" : "#64748B", fontSize: "0.95rem" }}>
            {t.customizeApp}
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
              {t.settingSaved}
            </div>
          )}
        </div>

        {/* ===== SECTION: Color Theme ===== */}
        <div className="card appsettings-section" style={{ padding: "1.8rem", marginBottom: "1.5rem" }}>
          <h3 className="appsettings-section-title">🎨 {t.colorTheme}</h3>
          <p className="appsettings-section-desc">{t.choosePalette}</p>
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
                <span className="appsettings-theme-name">{t.themes[theme.id]?.name || theme.name}</span>
                <span className="appsettings-theme-desc">{t.themes[theme.id]?.desc || theme.description}</span>
                {activeTheme === theme.id && (
                  <span className="appsettings-check">✓</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ===== SECTION: Dark Mode ===== */}
        <div className="card appsettings-section" style={{ padding: "1.8rem", marginBottom: "1.5rem" }}>
          <h3 className="appsettings-section-title">🌙 {t.darkMode}</h3>
          <p className="appsettings-section-desc">{t.enableDarkMode}</p>
          <button
            className={`appsettings-toggle-btn ${darkMode ? "active" : ""}`}
            onClick={toggleDarkMode}
          >
            <span className="appsettings-toggle-icon">{darkMode ? "☀️" : "🌙"}</span>
            <span className="appsettings-toggle-text">
              {darkMode ? t.darkModeEnabled : t.lightModeEnabled}
            </span>
            <span className={`appsettings-toggle-switch ${darkMode ? "on" : ""}`}>
              <span className="appsettings-toggle-knob" />
            </span>
          </button>
        </div>

        {/* ===== SECTION: Font Size ===== */}
        <div className="card appsettings-section" style={{ padding: "1.8rem", marginBottom: "1.5rem" }}>
          <h3 className="appsettings-section-title">🔤 {t.textSize}</h3>
          <p className="appsettings-section-desc">
            {t.adjustFontSize}
            {" "}<span style={{ fontStyle: "italic", color: "#aaa" }}>
              ({t.current}: {t.fontSizes[activeFontSize]?.name || FONT_SIZES.find(f => f.id === activeFontSize)?.name})
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
                <span className="appsettings-option-label">{t.fontSizes[fs.id]?.name || fs.name}</span>
                <span className="appsettings-option-sub">{t.fontSizes[fs.id]?.desc || fs.description}</span>
              </button>
            ))}
          </div>
        </div>


        {/* ===== SECTION: Default Page ===== */}
        <div className="card appsettings-section" style={{ padding: "1.8rem", marginBottom: "1.5rem" }}>
          <h3 className="appsettings-section-title">🏠 {t.homePageAfterSignIn}</h3>
          <p className="appsettings-section-desc">{t.whichPageOpens}</p>
          <div className="appsettings-option-row">
            {DEFAULT_PAGES.map((page) => (
              <button
                key={page.id}
                className={`appsettings-option-btn ${activeDefaultPage === page.id ? "active" : ""}`}
                onClick={() => handleDefaultPageChange(page.id)}
              >
                <span style={{ fontSize: "1.8rem" }}>{page.emoji}</span>
                <span className="appsettings-option-label">{t.defaultPages[page.id]?.name || page.name}</span>
                <span className="appsettings-option-sub">{t.defaultPages[page.id]?.desc || page.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ===== SECTION: Nutritional Units ===== */}
        <div className="card appsettings-section" style={{ padding: "1.8rem", marginBottom: "1.5rem" }}>
          <h3 className="appsettings-section-title">🔥 {t.nutritionalUnits}</h3>
          <p className="appsettings-section-desc">{t.howCaloriesDisplayed}</p>
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
                <span className="appsettings-option-label">{t.units[unit.id]?.desc || unit.description}</span>
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
            🔄 {t.resetAllSettings}
          </button>
        </div>
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





