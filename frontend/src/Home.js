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
  const [showTutorial, setShowTutorial] = React.useState(false);
  const [unreadCount, setUnreadCount] = React.useState(0);

  // Check if user has seen tutorial on first visit
  React.useEffect(() => {
    const tutorialCompleted = localStorage.getItem('tutorial_completed');
    if (!tutorialCompleted && authToken) {
      // Show tutorial for first-time users
      setShowTutorial(true);
    }
    
    // Fetch unread notifications
    if (userEmail) {
      fetchUnreadNotifications();
    }
  }, [authToken, userEmail]);

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
    alert("❓ Help & Support\n\nFor assistance:\n📧 Email: support@smartchef.ro\n Report bugs on GitHub\n\nQuick Tips:\n- Upload clear food images\n- Use dark mode for better viewing\n- Export analyses as PDF\n- Mark favorites with ⭐");
  };

  return (
    <div className="animated-bg" style={{ minHeight: "100vh" }}>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo" onClick={() => onNavigate("main")} style={{ cursor: "pointer" }}>
            🍳 SmartChef
          </div>
          <div className="nav-buttons">
            {authToken ? (
              <>
                {/* Right side - Menu & User */}
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
                          📊 Istoric
                        </button>
                        <button
                          className="nav-dropdown-item"
                          onClick={() => {
                            onNavigate("goals");
                            setShowNavDropdown(false);
                          }}
                        >
                          🎯 Obiective
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
                          onNavigate("personal-data");
                          setShowUserDropdown(false);
                        }}>
                          <span className="dropdown-icon">📊</span>
                          Date personale
                        </button>
                        
                        <button className="user-dropdown-item" onClick={() => {
                          onNavigate("account-settings");
                          setShowUserDropdown(false);
                        }}>
                          <span className="dropdown-icon">🔑</span>
                          Setările contului
                        </button>

                        <button className="user-dropdown-item" onClick={() => {
                          onNavigate("app-settings");
                          setShowUserDropdown(false);
                        }}>
                          <span className="dropdown-icon">⚙️</span>
                          Setări aplicație
                        </button>
                        
                        <button className="user-dropdown-item" onClick={() => {
                          setShowTutorial(true);
                          setShowUserDropdown(false);
                        }}>
                          <span className="dropdown-icon">🎓</span>
                          Revedere Tutorial
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
                >
                  Login
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => onNavigate("register")}
                >
                  Register
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "3rem 2rem" }}>
        {/* Hero Section */}
        <div style={{ textAlign: "center", marginBottom: "4rem" }}>
          <h1 style={{ 
            fontSize: "3.5rem", 
            fontWeight: "800", 
            color: "#ff6b35",
            marginBottom: "1rem",
            textShadow: "2px 2px 4px rgba(0,0,0,0.1)"
          }}>
            ✨ Bine ai venit la SmartChef! ✨
          </h1>
          <p style={{ 
            fontSize: "1.3rem", 
            color: "#666",
            fontWeight: "400",
            maxWidth: "800px",
            margin: "0 auto"
          }}>
            Analiză inteligentă a alimentelor cu AI și valori nutriționale
          </p>
        </div>

        {/* Main Features - Spotlight Style */}
        <div style={{ marginBottom: "5rem" }}>
          {/* Feature 1 - Left */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "4rem", 
            marginBottom: "4rem",
            flexWrap: "wrap"
          }}>
            <div style={{ 
              flex: "1", 
              minWidth: "300px",
              padding: "2rem",
              background: "linear-gradient(135deg, rgba(255,107,53,0.1) 0%, rgba(255,107,53,0.05) 100%)",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "200px"
            }}>
              <div style={{ fontSize: "5rem", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))" }}>🔍</div>
            </div>
            <div style={{ flex: "1.5", minWidth: "300px" }}>
              <h2 style={{ 
                fontSize: "2rem", 
                color: "#ff6b35", 
                marginBottom: "1rem",
                fontWeight: "700"
              }}>
                Recunoaștere AI Inteligentă
              </h2>
              <p style={{ 
                fontSize: "1.1rem", 
                color: "#666", 
                lineHeight: "1.8",
                marginBottom: "1rem"
              }}>
                Tehnologie avansată de deep learning care identifică automat ingredientele din fotografiile tale. 
                Suportă sute de alimente și mâncăruri diferite cu precizie ridicată.
              </p>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <span style={{
                  background: "#fff3ef",
                  color: "#ff6b35",
                  padding: "0.5rem 1rem",
                  borderRadius: "20px",
                  fontSize: "0.9rem",
                  fontWeight: "600"
                }}>✓ Precizie ridicată</span>
                <span style={{
                  background: "#fff3ef",
                  color: "#ff6b35",
                  padding: "0.5rem 1rem",
                  borderRadius: "20px",
                  fontSize: "0.9rem",
                  fontWeight: "600"
                }}>✓ Instant</span>
              </div>
            </div>
          </div>

          {/* Feature 2 - Right */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "4rem", 
            marginBottom: "4rem",
            flexWrap: "wrap",
            flexDirection: "row-reverse"
          }}>
            <div style={{ 
              flex: "1", 
              minWidth: "300px",
              padding: "2rem",
              background: "linear-gradient(135deg, rgba(33,150,243,0.1) 0%, rgba(33,150,243,0.05) 100%)",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "200px"
            }}>
              <div style={{ fontSize: "5rem", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))" }}>📊</div>
            </div>
            <div style={{ flex: "1.5", minWidth: "300px" }}>
              <h2 style={{ 
                fontSize: "2rem", 
                color: "#2196F3", 
                marginBottom: "1rem",
                fontWeight: "700"
              }}>
                Valori Nutriționale Complete
              </h2>
              <p style={{ 
                fontSize: "1.1rem", 
                color: "#666", 
                lineHeight: "1.8",
                marginBottom: "1rem"
              }}>
                Calculează instant macro și micronutrienții pentru fiecare ingredient. 
                Obții calorii, proteine, carbohidrați, grăsimi, fibre și multe altele.
              </p>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <span style={{
                  background: "#e3f2fd",
                  color: "#2196F3",
                  padding: "0.5rem 1rem",
                  borderRadius: "20px",
                  fontSize: "0.9rem",
                  fontWeight: "600"
                }}>✓ Date precise</span>
                <span style={{
                  background: "#e3f2fd",
                  color: "#2196F3",
                  padding: "0.5rem 1rem",
                  borderRadius: "20px",
                  fontSize: "0.9rem",
                  fontWeight: "600"
                }}>✓ Export PDF</span>
              </div>
            </div>
          </div>

          {/* Feature 3 - Left */}
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "4rem", 
            marginBottom: "4rem",
            flexWrap: "wrap"
          }}>
            <div style={{ 
              flex: "1", 
              minWidth: "300px",
              padding: "2rem",
              background: "linear-gradient(135deg, rgba(76,175,80,0.1) 0%, rgba(76,175,80,0.05) 100%)",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: "200px"
            }}>
              <div style={{ fontSize: "5rem", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.1))" }}>🎯</div>
            </div>
            <div style={{ flex: "1.5", minWidth: "300px" }}>
              <h2 style={{ 
                fontSize: "2rem", 
                color: "#4CAF50", 
                marginBottom: "1rem",
                fontWeight: "700"
              }}>
                Tracking & Obiective Personalizate
              </h2>
              <p style={{ 
                fontSize: "1.1rem", 
                color: "#666", 
                lineHeight: "1.8",
                marginBottom: "1rem"
              }}>
                Setează-ți obiective nutriționale cu calculator BMR/TDEE, tracking greutate, 
                streak counter și dashboard cu statistici detaliate pentru progresul tău.
              </p>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <span style={{
                  background: "#e8f5e9",
                  color: "#4CAF50",
                  padding: "0.5rem 1rem",
                  borderRadius: "20px",
                  fontSize: "0.9rem",
                  fontWeight: "600"
                }}>✓ BMR/TDEE</span>
                <span style={{
                  background: "#e8f5e9",
                  color: "#4CAF50",
                  padding: "0.5rem 1rem",
                  borderRadius: "20px",
                  fontSize: "0.9rem",
                  fontWeight: "600"
                }}>✓ Grafice</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Benefits */}
        <div style={{ 
          background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
          borderRadius: "20px",
          padding: "3rem",
          marginBottom: "4rem"
        }}>
          <h2 style={{ 
            textAlign: "center", 
            fontSize: "2.2rem", 
            color: "#333", 
            marginBottom: "3rem",
            fontWeight: "700"
          }}>
            🌟 Și multe altele...
          </h2>
          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
            gap: "2rem"
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <div style={{ fontSize: "2.5rem", flexShrink: 0 }}>🔒</div>
              <div>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem", color: "#333", fontWeight: "600" }}>
                  Securitate 2FA
                </h3>
                <p style={{ color: "#555", fontSize: "0.95rem", lineHeight: "1.6" }}>
                  Protecție avansată cu autentificare în doi pași
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <div style={{ fontSize: "2.5rem", flexShrink: 0 }}>📈</div>
              <div>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem", color: "#333", fontWeight: "600" }}>
                  Dashboard Interactiv
                </h3>
                <p style={{ color: "#555", fontSize: "0.95rem", lineHeight: "1.6" }}>
                  Vizualizează statistici și evoluția ta zilnică
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <div style={{ fontSize: "2.5rem", flexShrink: 0 }}>🔥</div>
              <div>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem", color: "#333", fontWeight: "600" }}>
                  Streak System
                </h3>
                <p style={{ color: "#555", fontSize: "0.95rem", lineHeight: "1.6" }}>
                  Motivație prin zile consecutive de activitate
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <div style={{ fontSize: "2.5rem", flexShrink: 0 }}>🎨</div>
              <div>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem", color: "#333", fontWeight: "600" }}>
                  Personalizare Totală
                </h3>
                <p style={{ color: "#555", fontSize: "0.95rem", lineHeight: "1.6" }}>
                  5 teme, control font, limbă și unități măsură
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <div style={{ fontSize: "2.5rem", flexShrink: 0 }}>📜</div>
              <div>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem", color: "#333", fontWeight: "600" }}>
                  Istoric Complet
                </h3>
                <p style={{ color: "#555", fontSize: "0.95rem", lineHeight: "1.6" }}>
                  Păstrează toate analizele cu filtre avansate
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <div style={{ fontSize: "2.5rem", flexShrink: 0 }}>⚖️</div>
              <div>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem", color: "#333", fontWeight: "600" }}>
                  Weight Tracking
                </h3>
                <p style={{ color: "#555", fontSize: "0.95rem", lineHeight: "1.6" }}>
                  Monitorizează greutatea cu grafice timeline
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        {!authToken ? (
          <div className="card" style={{ 
            maxWidth: "600px", 
            margin: "4rem auto 0", 
            textAlign: "center",
            padding: "3rem"
          }}>
            <h2 style={{ fontSize: "2rem", color: "#ff6b35", marginBottom: "1rem" }}>
              🚀 Începe Acum
            </h2>
            <p style={{ fontSize: "1.1rem", color: "#666", marginBottom: "2rem" }}>
              Creează un cont gratuit pentru a accesa toate funcționalitățile SmartChef
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button
                className="btn btn-primary"
                onClick={() => onNavigate("register")}
                style={{ padding: "1rem 2.5rem", fontSize: "1.1rem" }}
              >
                📝 Înregistrare Gratuită
              </button>
              <button
                className="btn btn-outline"
                onClick={() => onNavigate("login")}
                style={{ padding: "1rem 2.5rem", fontSize: "1.1rem" }}
              >
                🔐 Login
              </button>
            </div>
          </div>
        ) : (
          <div style={{ textAlign: "center", marginTop: "4rem" }}>
            <div style={{
              background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
              color: "white",
              padding: "3rem",
              borderRadius: "20px",
              boxShadow: "0 10px 30px rgba(255, 107, 53, 0.3)"
            }}>
              <h2 style={{ fontSize: "2.5rem", marginBottom: "1rem", fontWeight: "700" }}>
                🍽️ Gata să analizezi mâncarea ta?
              </h2>
              <p style={{ fontSize: "1.2rem", marginBottom: "2rem", opacity: 0.95 }}>
                Încarcă o imagine și descoperă instant valorile nutriționale
              </p>
              <button
                className="btn"
                onClick={() => onNavigate("analyze-food")}
                style={{ 
                  background: "white",
                  color: "#ff6b35",
                  padding: "1.2rem 3rem",
                  fontSize: "1.2rem",
                  fontWeight: "700",
                  border: "none",
                  boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
                }}
              >
                📸 Analizează Acum
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Button with Expandable Menu */}
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
          customShortcuts={{
            'h': { description: 'Mergi la Home (acum)', action: 'navigate-home' }
          }}
        />
      )}

      {/* Onboarding Tutorial */}
      {showTutorial && (
        <Tutorial onComplete={() => setShowTutorial(false)} />
      )}
    </div>
  );
}

export default Home;
