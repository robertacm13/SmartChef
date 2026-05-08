import React from "react";
import { ShortcutsHelp } from "./utils/keyboardShortcuts";
import "./utils/keyboardShortcuts.css";
import Tutorial from "./components/Tutorial";

function Home({ authToken, userEmail, onNavigate, onLogout, darkMode, toggleDarkMode }) {
  const [showNavDropdown, setShowNavDropdown] = React.useState(false);
  const [showUserDropdown, setShowUserDropdown] = React.useState(false);
  const [userDropdownTimeout, setUserDropdownTimeout] = React.useState(null);
  const [showFabMenu, setShowFabMenu] = React.useState(false);
  const [showShortcuts, setShowShortcuts] = React.useState(false);
  const [showHelpModal, setShowHelpModal] = React.useState(false);
  const [showTutorial, setShowTutorial] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    const tutorialCompleted = localStorage.getItem('tutorial_completed');
    if (!tutorialCompleted && authToken) {
      setShowTutorial(true);
    }
    
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

    if (userEmail) {
      fetchUnreadNotifications();
    }
  }, [authToken, userEmail]);

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
    setShowHelpModal(true);
  };

  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF" }}>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo" onClick={() => onNavigate("main")} style={{ cursor: "pointer" }}>
            🍳 SmartChef
          </div>
          <div className="nav-buttons">
            {authToken ? (
              <>
                <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", marginLeft: "auto", marginRight: "-0.5rem" }}>
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
                          📊 History
                        </button>
                        <button
                          className="nav-dropdown-item"
                          onClick={() => {
                            onNavigate("goals");
                            setShowNavDropdown(false);
                          }}
                        >
                          🎯 Goals
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
                    title="Notifications"
                  >
                    🔔
                    {unreadCount > 0 && (
                      <span style={{
                        position: "absolute",
                        top: "-5px",
                        right: "-5px",
                        background: "#ef4444",
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
                        <button className="user-dropdown-item" onClick={() => alert('🚧 Profile - Coming soon!')}>
                          <span className="dropdown-icon">👤</span>
                          Profile
                        </button>
                        
                        <button className="user-dropdown-item" onClick={() => {
                          onNavigate("personal-data");
                          setShowUserDropdown(false);
                        }}>
                          <span className="dropdown-icon">📊</span>
                          Personal Data
                        </button>
                        
                        <button className="user-dropdown-item" onClick={() => {
                          onNavigate("account-settings");
                          setShowUserDropdown(false);
                        }}>
                          <span className="dropdown-icon">🔑</span>
                          Account Settings
                        </button>

                        <button className="user-dropdown-item" onClick={() => {
                          onNavigate("app-settings");
                          setShowUserDropdown(false);
                        }}>
                          <span className="dropdown-icon">⚙️</span>
                          App Settings
                        </button>
                        
                        <button className="user-dropdown-item" onClick={() => {
                          setShowTutorial(true);
                          setShowUserDropdown(false);
                        }}>
                          <span className="dropdown-icon">🎓</span>
                          Replay Tutorial
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
              </>
            ) : (
              <div style={{ display: "flex", gap: "0.5rem", marginLeft: "auto" }}>
                <button
                  className="btn btn-outline"
                  onClick={() => onNavigate("login")}
                  style={{ color: "white", border: "2px solid white" }}
                >
                  Log In
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => onNavigate("register")}
                  style={{ 
                    background: "#3B82F6",
                    color: "white",
                    border: "none"
                  }}
                >
                  Înregistrare
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ paddingTop: authToken ? "80px" : "80px" }}>
        {!authToken ? (
          <>
            {/* Hero Section */}
            <section style={{
              background: "#FFFFFF",
              padding: "4rem 2rem",
              textAlign: "center"
            }}>
              <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                {/* Main Hero Text */}
                <h1 style={{
                  fontSize: "3.5rem",
                  fontWeight: "800",
                  color: "#1E293B",
                  marginBottom: "1rem",
                  lineHeight: "1.2"
                }}>
                  Nutriție de precizie,<br />
                  printr-o simplă <span style={{ color: "#3B82F6" }}>fotografie</span>.
                </h1>
                
                <p style={{
                  fontSize: "1.3rem",
                  color: "#64748B",
                  marginBottom: "3rem",
                  fontWeight: "400"
                }}>
                  Folosește inteligența artificială pentru a analiza instant caloriile și macronutrienii meselui tale.
                </p>

                {/* CTA Button */}
                <button
                  onClick={() => onNavigate("register")}
                  style={{
                    background: "#3B82F6",
                    color: "white",
                    border: "none",
                    padding: "1rem 2.5rem",
                    fontSize: "1.1rem",
                    fontWeight: "700",
                    borderRadius: "12px",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    boxShadow: "0 4px 15px rgba(16, 185, 129, 0.3)"
                  }}
                  onMouseOver={(e) => {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 6px 20px rgba(16, 185, 129, 0.4)";
                  }}
                  onMouseOut={(e) => {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 15px rgba(16, 185, 129, 0.3)";
                  }}
                >
                  Incepe Gratuit
                </button>
              </div>
            </section>

            {/* Hero Image Section - Simulating a food image with placeholder */}
            <section style={{
              background: "#F0FDFA",
              padding: "3rem 2rem",
              textAlign: "center"
            }}>
              <div style={{
                maxWidth: "900px",
                margin: "0 auto",
                background: "linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)",
                borderRadius: "20px",
                padding: "4rem 2rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: "400px",
                border: "3px solid #3B82F6",
                boxShadow: "0 10px 30px rgba(16, 185, 129, 0.2)"
              }}>
                <div style={{ fontSize: "6rem" }}>📸</div>
              </div>
            </section>

            {/* Features Section */}
            <section style={{
              background: "#FFFFFF",
              padding: "5rem 2rem"
            }}>
              <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                  gap: "2rem"
                }}>
                  {/* Feature 1: Recunoaștere Instant */}
                  <div style={{
                    background: "#F0FDFA",
                    borderRadius: "16px",
                    padding: "2.5rem",
                    textAlign: "center",
                    border: "2px solid transparent",
                    transition: "all 0.3s ease",
                    cursor: "pointer"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = "#3B82F6";
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow = "0 10px 30px rgba(16, 185, 129, 0.2)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  >
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📸</div>
                    <h3 style={{
                      fontSize: "1.3rem",
                      color: "#1E293B",
                      fontWeight: "700",
                      marginBottom: "1rem"
                    }}>
                      Recunoaștere<br />Instant
                    </h3>
                    <p style={{
                      color: "#64748B",
                      fontSize: "0.95rem",
                      lineHeight: "1.6"
                    }}>
                      Faci poza. Primejti date. Fără bază de date manuale.
                    </p>
                  </div>

                  {/* Feature 2: Analiză Detaliată */}
                  <div style={{
                    background: "#F0FDFA",
                    borderRadius: "16px",
                    padding: "2.5rem",
                    textAlign: "center",
                    border: "2px solid transparent",
                    transition: "all 0.3s ease",
                    cursor: "pointer"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = "#3B82F6";
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow = "0 10px 30px rgba(16, 185, 129, 0.2)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  >
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📊</div>
                    <h3 style={{
                      fontSize: "1.3rem",
                      color: "#1E293B",
                      fontWeight: "700",
                      marginBottom: "1rem"
                    }}>
                      Analiză<br />Detaliată
                    </h3>
                    <p style={{
                      color: "#64748B",
                      fontSize: "0.95rem",
                      lineHeight: "1.6"
                    }}>
                      Macronutrienți, fibre și vitamine într-un singur loc.
                    </p>
                  </div>

                  {/* Feature 3: Monitorizare Progres */}
                  <div style={{
                    background: "#F0FDFA",
                    borderRadius: "16px",
                    padding: "2.5rem",
                    textAlign: "center",
                    border: "2px solid transparent",
                    transition: "all 0.3s ease",
                    cursor: "pointer"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = "#3B82F6";
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow = "0 10px 30px rgba(16, 185, 129, 0.2)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = "transparent";
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                  >
                    <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>📈</div>
                    <h3 style={{
                      fontSize: "1.3rem",
                      color: "#1E293B",
                      fontWeight: "700",
                      marginBottom: "1rem"
                    }}>
                      Monitorizare<br />Progres
                    </h3>
                    <p style={{
                      color: "#64748B",
                      fontSize: "0.95rem",
                      lineHeight: "1.6"
                    }}>
                      Grafice intuitive pentru ușor urmărire progresului.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Footer */}
            <footer style={{
              background: "#1E293B",
              color: "white",
              padding: "3rem 2rem",
              textAlign: "center"
            }}>
              <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
                <p style={{ marginBottom: "1.5rem", fontSize: "0.95rem" }}>
                  © 2024 SmartChef. Toate drepturile rezervate.
                </p>
                <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem" }}>
                  <a href="#" style={{ color: "white", fontSize: "1.5rem", transition: "all 0.3s" }} onMouseOver={(e) => e.target.style.transform = "scale(1.2)"} onMouseOut={(e) => e.target.style.transform = "scale(1)"}>f</a>
                  <a href="#" style={{ color: "white", fontSize: "1.5rem", transition: "all 0.3s" }} onMouseOver={(e) => e.target.style.transform = "scale(1.2)"} onMouseOut={(e) => e.target.style.transform = "scale(1)"}>📷</a>
                  <a href="#" style={{ color: "white", fontSize: "1.5rem", transition: "all 0.3s" }} onMouseOver={(e) => e.target.style.transform = "scale(1.2)"} onMouseOut={(e) => e.target.style.transform = "scale(1)"}>in</a>
                  <a href="#" style={{ color: "white", fontSize: "1.5rem", transition: "all 0.3s" }} onMouseOver={(e) => e.target.style.transform = "scale(1.2)"} onMouseOut={(e) => e.target.style.transform = "scale(1)"}>?</a>
                </div>
              </div>
            </footer>
          </>
        ) : (
          // Authenticated User View
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "3rem 2rem" }}>
            <div style={{ textAlign: "center", marginTop: "4rem" }}>
              <div style={{
                background: "linear-gradient(135deg, #3B82F6 0%, #059669 100%)",
                color: "white",
                padding: "3rem",
                borderRadius: "20px",
                boxShadow: "0 10px 30px rgba(16, 185, 129, 0.3)"
              }}>
                <h2 style={{ fontSize: "2.5rem", marginBottom: "1rem", fontWeight: "700" }}>
                  🍽️ Ready to analyze your meal?
                </h2>
                <p style={{ fontSize: "1.2rem", marginBottom: "2rem", opacity: 0.95 }}>
                  Upload an image and instantly discover nutritional values
                </p>
                <button
                  className="btn"
                  onClick={() => onNavigate("analyze-food")}
                  style={{ 
                    background: "white",
                    color: "#3B82F6",
                    padding: "1.2rem 3rem",
                    fontSize: "1.2rem",
                    fontWeight: "700",
                    border: "none",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                    borderRadius: "12px",
                    cursor: "pointer"
                  }}
                >
                  📸 Analyze Now
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button with Expandable Menu */}
      <div className="fab-container">
        <button
          className={`fab-menu-item fab-menu-item-1 ${showFabMenu ? 'show' : ''}`}
          onClick={toggleDarkMode}
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? "☀️" : "🌙"}
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
          title="Keyboard Shortcuts (press ?)"
        >
          ⌨️
        </button>
        
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
          customShortcuts={{
            'h': { description: 'Mergi la Home (acum)', action: 'navigate-home' }
          }}
        />
      )}

      {/* Help & Support Modal */}
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
            background: "white",
            borderRadius: "20px",
            padding: "2rem",
            maxWidth: "600px",
            maxHeight: "80vh",
            overflow: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
          }}>
            <h2 style={{ fontSize: "1.8rem", color: "#3B82F6", marginBottom: "1rem" }}>
              ❓ Help & Support
            </h2>
            <p style={{ color: "#666", marginBottom: "1.5rem", lineHeight: "1.8" }}>
              SmartChef uses advanced AI to analyze your meals instantly. 
              Simply take a photo of your food and get complete nutritional information.
            </p>
            <div style={{ marginBottom: "1rem" }}>
              <h3 style={{ color: "#1E293B", marginBottom: "0.5rem", fontWeight: "600" }}>
                Getting Started
              </h3>
              <p style={{ color: "#666", fontSize: "0.95rem" }}>
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
                padding: "0.8rem 1.5rem",
                borderRadius: "12px",
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

      {/* Tutorial Modal */}
      {showTutorial && (
        <Tutorial onClose={() => {
          setShowTutorial(false);
          localStorage.setItem('tutorial_completed', 'true');
        }} />
      )}
    </div>
  );
}

export default Home;







