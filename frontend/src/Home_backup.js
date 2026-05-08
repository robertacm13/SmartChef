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

  // Check if user has seen tutorial on first visit
  React.useEffect(() => {
    const tutorialCompleted = localStorage.getItem('tutorial_completed');
    if (!tutorialCompleted && authToken) {
      // Show tutorial for first-time users
      setShowTutorial(true);
    }
    
    // Fetch unread notifications
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
                        background: "#3B82F6",
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
            color: "#3B82F6",
            marginBottom: "1rem",
            textShadow: "2px 2px 4px rgba(0,0,0,0.1)"
          }}>
            ✨ Welcome to SmartChef! ✨
          </h1>
          <p style={{ 
            fontSize: "1.3rem", 
            color: "#666",
            fontWeight: "400",
            maxWidth: "800px",
            margin: "0 auto"
          }}>
            Intelligent food analysis with AI and nutritional values
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
              background: "linear-gradient(135deg, rgba(59, 130, 246,0.1) 0%, rgba(59, 130, 246,0.05) 100%)",
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
                color: "#3B82F6", 
                marginBottom: "1rem",
                fontWeight: "700"
              }}>
                Intelligent AI Recognition
              </h2>
              <p style={{ 
                fontSize: "1.1rem", 
                color: "#666", 
                lineHeight: "1.8",
                marginBottom: "1rem"
              }}>
                Advanced deep learning technology that automatically identifies ingredients from your food photos. 
                Supports hundreds of foods and dishes with high accuracy.
              </p>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <span style={{
                  background: "#fff3ef",
                  color: "#3B82F6",
                  padding: "0.5rem 1rem",
                  borderRadius: "20px",
                  fontSize: "0.9rem",
                  fontWeight: "600"
                }}>✓ High accuracy</span>
                <span style={{
                  background: "#fff3ef",
                  color: "#3B82F6",
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
              background: "linear-gradient(135deg, rgba(59, 130, 246,0.1) 0%, rgba(59, 130, 246,0.05) 100%)",
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
                color: "#3B82F6", 
                marginBottom: "1rem",
                fontWeight: "700"
              }}>
                Complete Nutritional Values
              </h2>
              <p style={{ 
                fontSize: "1.1rem", 
                color: "#666", 
                lineHeight: "1.8",
                marginBottom: "1rem"
              }}>
                Instantly calculate macros and micronutrients for each ingredient. 
                Get calories, protein, carbs, fat, fiber and much more.
              </p>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <span style={{
                  background: "#fff3ef",
                  color: "#3B82F6",
                  padding: "0.5rem 1rem",
                  borderRadius: "20px",
                  fontSize: "0.9rem",
                  fontWeight: "600"
                }}>✓ Accurate data</span>
                <span style={{
                  background: "#fff3ef",
                  color: "#3B82F6",
                  padding: "0.5rem 1rem",
                  borderRadius: "20px",
                  fontSize: "0.9rem",
                  fontWeight: "600"
                }}>✓ PDF Export</span>
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
              background: "linear-gradient(135deg, rgba(59, 130, 246,0.1) 0%, rgba(59, 130, 246,0.05) 100%)",
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
                color: "#3B82F6", 
                marginBottom: "1rem",
                fontWeight: "700"
              }}>
                Tracking & Personalized Objectives
              </h2>
              <p style={{ 
                fontSize: "1.1rem", 
                color: "#666", 
                lineHeight: "1.8",
                marginBottom: "1rem"
              }}>
                Set nutritional objectives with BMR/TDEE calculator, weight tracking, 
                streak counter and dashboard with detailed statistics for your progress.
              </p>
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                <span style={{
                  background: "#fff3ef",
                  color: "#3B82F6",
                  padding: "0.5rem 1rem",
                  borderRadius: "20px",
                  fontSize: "0.9rem",
                  fontWeight: "600"
                }}>✓ BMR/TDEE</span>
                <span style={{
                  background: "#fff3ef",
                  color: "#3B82F6",
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
          background: "linear-gradient(135deg, #fff3ef 0%, #ffe0b3 100%)",
          borderRadius: "20px",
          padding: "3rem",
          marginBottom: "4rem"
        }}>
          <h2 style={{ 
            textAlign: "center", 
            fontSize: "2.2rem", 
            color: "#3B82F6", 
            marginBottom: "3rem",
            fontWeight: "700"
          }}>
            🌟 And much more...
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
                  2FA Security
                </h3>
                <p style={{ color: "#555", fontSize: "0.95rem", lineHeight: "1.6" }}>
                  Advanced protection with two-factor authentication
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
                  Visualize statistics and your daily progress
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
                  Motivation through consecutive activity streaks
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <div style={{ fontSize: "2.5rem", flexShrink: 0 }}>🎨</div>
              <div>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem", color: "#333", fontWeight: "600" }}>
                  Complete Customization
                </h3>
                <p style={{ color: "#555", fontSize: "0.95rem", lineHeight: "1.6" }}>
                  5 themes, font control, language and measurement units
                </p>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "flex-start", gap: "1rem" }}>
              <div style={{ fontSize: "2.5rem", flexShrink: 0 }}>📜</div>
              <div>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem", color: "#333", fontWeight: "600" }}>
                  Complete History
                </h3>
                <p style={{ color: "#555", fontSize: "0.95rem", lineHeight: "1.6" }}>
                  Keep all analyses with advanced filters
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
                  Monitor weight with timeline charts
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
            <h2 style={{ fontSize: "2rem", color: "#3B82F6", marginBottom: "1rem" }}>
              🚀 Start Now
            </h2>
            <p style={{ fontSize: "1.1rem", color: "#666", marginBottom: "2rem" }}>
              Create a free account to access all SmartChef features
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button
                className="btn btn-primary"
                onClick={() => onNavigate("register")}
                style={{ 
                  padding: "1rem 2.5rem", 
                  fontSize: "1.1rem",
                  background: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)",
                  color: "white"
                }}
              >
                📝 Free Registration
              </button>
              <button
                className="btn btn-outline"
                onClick={() => onNavigate("login")}
                style={{ 
                  padding: "1rem 2.5rem", 
                  fontSize: "1.1rem",
                  background: "white",
                  color: "#3B82F6",
                  border: "2px solid #3B82F6"
                }}
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
              boxShadow: "0 10px 30px rgba(59, 130, 246, 0.3)"
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
                  boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
                }}
              >
                📸 Analyze Now
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
          title="Keyboard Shortcuts (press ?)"
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
            maxWidth: "500px",
            width: "90%",
            boxShadow: "0 10px 40px rgba(0, 0, 0, 0.3)",
            position: "relative"
          }}>
            {/* Close Button (X) */}
            <button
              onClick={() => setShowHelpModal(false)}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "none",
                border: "none",
                fontSize: "2rem",
                cursor: "pointer",
                color: "#666",
                width: "40px",
                height: "40px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.color = "#3B82F6";
                e.target.style.transform = "scale(1.2)";
              }}
              onMouseLeave={(e) => {
                e.target.style.color = "#666";
                e.target.style.transform = "scale(1)";
              }}
            >
              ×
            </button>

            {/* Modal Content */}
            <h2 style={{ 
              fontSize: "1.8rem", 
              color: "#3B82F6", 
              marginBottom: "1.5rem",
              paddingRight: "2rem"
            }}>
              ❓ Help & Support
            </h2>

            <div style={{ color: "#333", lineHeight: "1.8" }}>
              <p style={{ marginBottom: "1rem", fontWeight: "600", color: "#666" }}>
                For assistance:
              </p>
              <ul style={{ marginBottom: "1.5rem", paddingLeft: "1.5rem" }}>
                <li style={{ marginBottom: "0.5rem" }}>📧 <strong>Email:</strong> support@smartchef.ro</li>
                <li style={{ marginBottom: "0.5rem" }}>🐛 <strong>Report bugs</strong> on GitHub</li>
              </ul>

              <p style={{ marginBottom: "1rem", fontWeight: "600", color: "#666" }}>
                Quick Tips:
              </p>
              <ul style={{ paddingLeft: "1.5rem" }}>
                <li style={{ marginBottom: "0.5rem" }}>📸 Upload clear food images</li>
                <li style={{ marginBottom: "0.5rem" }}>🌙 Use dark mode for better viewing</li>
                <li style={{ marginBottom: "0.5rem" }}>📄 Export analyses as PDF</li>
                <li>⭐ Mark favorites with stars</li>
              </ul>
            </div>

            {/* OK Button */}
            <button
              onClick={() => setShowHelpModal(false)}
              style={{
                marginTop: "2rem",
                width: "100%",
                padding: "1rem",
                background: "linear-gradient(135deg, #2563EB 0%, #3B82F6 100%)",
                color: "white",
                border: "none",
                borderRadius: "12px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer",
                transition: "all 0.3s ease"
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "none";
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* Onboarding Tutorial */}
      {showTutorial && (
        <Tutorial onComplete={() => setShowTutorial(false)} />
      )}
    </div>
  );
}

export default Home;


