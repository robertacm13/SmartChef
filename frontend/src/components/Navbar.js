import React, { useState, useEffect } from "react";
import logoImg from "../logo.png";
import Tutorial from "./Tutorial";
import { MdOutlineKeyboardArrowUp, MdOutlineKeyboardArrowDown } from "react-icons/md";

export default function Navbar({ 
  userEmail, 
  onBack, 
  onNavigate, 
  onLogout, 
  darkMode, 
  toggleDarkMode, 
  handleHelp,
  currentPage 
}) {
  const [showNavDropdown, setShowNavDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [navDropdownTimeout, setNavDropdownTimeout] = useState(null);
  const [userDropdownTimeout, setUserDropdownTimeout] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [scrollDir, setScrollDir] = useState("down"); // "up" or "down"
  const [showScroll, setShowScroll] = useState(false);
  const [showFAB, setShowFAB] = useState(false);

  useEffect(() => {
    const fetchUnreadNotifications = async () => {
      if (!userEmail) return;
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

    // Fetch immediately on mount
    fetchUnreadNotifications();

    // Set up interval to refresh every 5 seconds
    const intervalId = setInterval(fetchUnreadNotifications, 5000);

    // Refresh when page becomes visible
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchUnreadNotifications();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [userEmail]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setShowScroll(docHeight > 200);
      setScrollDir(scrollTop < docHeight / 2 ? "down" : "up");
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollClick = () => {
    if (scrollDir === "down") {
      window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

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

  const getButtonStyle = (pageName) => {
    const isActive = currentPage === pageName;
    return {
      padding: "0.5rem 1rem",
      fontSize: "0.95rem",
      fontWeight: isActive ? "700" : "500",
      background: isActive ? (darkMode ? "rgba(var(--primary-rgb), 0.2)" : "rgba(var(--primary-rgb), 0.1)") : "none",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      color: isActive ? "var(--primary)" : (darkMode ? "#E2E8F0" : "#1E293B"),
      transition: "all 0.2s ease"
    };
  };

  return (
    <>
    <nav style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "1rem 2rem",
      borderBottom: darkMode ? "1px solid #334155" : "1px solid #E2E8F0",
      background: darkMode ? "#1E293B" : "#FFFFFF",
      boxShadow: darkMode ? "none" : "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
      position: "fixed",
      top: 0,
      left: 0,
      right: 0,
      zIndex: 1000,
      width: "100%"
    }}>
      {/* Logo */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", cursor: "pointer" }} onClick={onBack}>
        <div style={{
          width: "40px", 
          height: "40px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden"
        }}>
          <img 
            src={logoImg} 
            alt="SmartChef Logo" 
            style={{ width: "100%", height: "100%", objectFit: "contain" }} 
          />
        </div>
        <span style={{ fontSize: "1.25rem", fontWeight: "700", letterSpacing: "-0.05em", color: darkMode ? "#E2E8F0" : "#1E293B" }}>
          SmartChef
        </span>
      </div>

      {/* Right Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
        {/* Navigation Dropdown (Hamburger) */}
        <div 
          style={{ position: "relative" }}
          onMouseEnter={handleNavMouseEnter}
          onMouseLeave={handleNavMouseLeave}
        >
          <button
            style={{
              padding: "0.5rem 1rem",
              fontSize: "1.2rem",
              background: showNavDropdown ? (darkMode ? "rgba(var(--primary-rgb), 0.2)" : "rgba(var(--primary-rgb), 0.1)") : "transparent",
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              color: showNavDropdown ? "var(--primary)" : (darkMode ? "#E2E8F0" : "#1E293B"),
              transition: "all 0.2s ease"
            }}
            aria-label="Navigation Menu"
          >
            ☰
          </button>
          {showNavDropdown && (
            <div style={{
              position: "absolute",
              top: "100%",
              left: 0,
              background: darkMode ? "#1E293B" : "white",
              border: `1px solid ${darkMode ? "#475569" : "#E2E8F0"}`,
              borderRadius: "8px",
              minWidth: "160px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
              marginTop: "0.5rem",
              zIndex: 1001,
              overflow: "hidden"
            }}>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  textAlign: "left",
                  padding: "0.75rem 1.25rem",
                  border: "none",
                  background: currentPage === "dashboard" ? (darkMode ? "rgba(var(--primary-rgb), 0.15)" : "rgba(var(--primary-rgb), 0.05)") : "none",
                  cursor: "pointer",
                  color: currentPage === "dashboard" ? "var(--primary)" : (darkMode ? "#E2E8F0" : "#1E293B"),
                  fontWeight: currentPage === "dashboard" ? "700" : "500",
                  fontSize: "0.95rem",
                  borderBottom: `1px solid ${darkMode ? "#334155" : "#F1F5F9"}`
                }}
                onClick={() => {
                  onNavigate('dashboard');
                  setShowNavDropdown(false);
                }}
              >
                📈 Dashboard
              </button>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  textAlign: "left",
                  padding: "0.75rem 1.25rem",
                  border: "none",
                  background: currentPage === "history" ? (darkMode ? "rgba(var(--primary-rgb), 0.15)" : "rgba(var(--primary-rgb), 0.05)") : "none",
                  cursor: "pointer",
                  color: currentPage === "history" ? "var(--primary)" : (darkMode ? "#E2E8F0" : "#1E293B"),
                  fontWeight: currentPage === "history" ? "700" : "500",
                  fontSize: "0.95rem",
                  borderBottom: `1px solid ${darkMode ? "#334155" : "#F1F5F9"}`
                }}
                onClick={() => {
                  onNavigate('history');
                  setShowNavDropdown(false);
                }}
              >
                📊 History
              </button>
              <button
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: "100%",
                  textAlign: "left",
                  padding: "0.75rem 1.25rem",
                  border: "none",
                  background: currentPage === "goals" ? (darkMode ? "rgba(var(--primary-rgb), 0.15)" : "rgba(var(--primary-rgb), 0.05)") : "none",
                  cursor: "pointer",
                  color: currentPage === "goals" ? "var(--primary)" : (darkMode ? "#E2E8F0" : "#1E293B"),
                  fontWeight: currentPage === "goals" ? "700" : "500",
                  fontSize: "0.95rem"
                }}
                onClick={() => {
                  onNavigate('goals');
                  setShowNavDropdown(false);
                }}
              >
                🎯 Goals
              </button>
            </div>
          )}
        </div>

        {/* Analyze Button */}
        <button 
          onClick={() => onNavigate("analyze-food")}
          style={{ 
            padding: "0.625rem 1.25rem", 
            background: "var(--primary)", 
            color: "white", 
            borderRadius: "0.5rem", 
            fontSize: "0.9rem", 
            fontWeight: "600", 
            border: "none", 
            cursor: "pointer",
            boxShadow: "0 4px 6px rgba(var(--primary-rgb), 0.3)",
            transition: "all 0.2s ease"
          }}
          onMouseOver={(e) => {
            e.target.style.transform = "translateY(-1px)";
            e.target.style.boxShadow = "0 6px 8px rgba(var(--primary-rgb), 0.4)";
          }}
          onMouseOut={(e) => {
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 6px rgba(var(--primary-rgb), 0.3)";
          }}
        >
          Analyze
        </button>

        {/* Vertical Divider */}
        <div style={{
          width: "1px",
          height: "30px",
          background: darkMode ? "#334155" : "#E2E8F0",
          margin: "0 0.5rem"
        }}></div>

        {/* Notifications Bell */}
        <button
          onClick={() => onNavigate('notifications')}
          style={{ 
            padding: "0.5rem", 
            fontSize: "1.2rem", 
            background: "transparent",
            border: "none",
            cursor: "pointer",
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "8px"
          }}
          title="Notifications"
        >
          🔔
          {unreadCount > 0 && (
            <span style={{
              position: "absolute",
              top: "2px",
              right: "2px",
              background: "#EF4444",
              color: "white",
              borderRadius: "50%",
              width: "18px",
              height: "18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.7rem",
              fontWeight: "700",
              border: `2px solid ${darkMode ? "#1E293B" : "white"}`
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
            style={{ 
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: showUserDropdown ? (darkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)") : "none",
              border: "none",
              cursor: "pointer",
              color: darkMode ? "#E2E8F0" : "#1E293B",
              fontSize: "0.9rem",
              fontWeight: "600",
              padding: "0.5rem 0.75rem",
              borderRadius: "8px",
              transition: "background 0.2s ease"
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
            <div style={{
              position: "absolute",
              top: "100%",
              right: 0,
              background: darkMode ? "#1E293B" : "white",
              border: `1px solid ${darkMode ? "#475569" : "#E2E8F0"}`,
              borderRadius: "10px",
              minWidth: "220px",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
              marginTop: "0.5rem",
              zIndex: 1001,
              overflow: "hidden"
            }}>
              <div style={{ padding: "1rem", borderBottom: `1px solid ${darkMode ? "#334155" : "#F1F5F9"}`, background: darkMode ? "#0F172A" : "#F8FAFC" }}>
                <p style={{ margin: 0, fontSize: "0.8rem", color: darkMode ? "#94A3B8" : "#64748B" }}>Signed in as</p>
                <p style={{ margin: 0, fontSize: "0.95rem", fontWeight: "600", color: darkMode ? "#E2E8F0" : "#1E293B", wordBreak: "break-all" }}>{userEmail}</p>
              </div>

              <div style={{ padding: "0.5rem" }}>
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    width: "100%",
                    textAlign: "left",
                    padding: "0.75rem 1rem",
                    border: "none",
                    background: currentPage === "personal-data" ? (darkMode ? "rgba(var(--primary-rgb), 0.15)" : "rgba(var(--primary-rgb), 0.05)") : "none",
                    cursor: "pointer",
                    color: currentPage === "personal-data" ? "var(--primary)" : (darkMode ? "#E2E8F0" : "#1E293B"),
                    fontSize: "0.95rem",
                    borderRadius: "6px",
                    fontWeight: currentPage === "personal-data" ? "600" : "400"
                  }}
                  onClick={() => {
                    onNavigate('personal-data');
                    setShowUserDropdown(false);
                  }}
                >
                  📊 Personal Data
                </button>
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    width: "100%",
                    textAlign: "left",
                    padding: "0.75rem 1rem",
                    border: "none",
                    background: currentPage === "account-settings" ? (darkMode ? "rgba(var(--primary-rgb), 0.15)" : "rgba(var(--primary-rgb), 0.05)") : "none",
                    cursor: "pointer",
                    color: currentPage === "account-settings" ? "var(--primary)" : (darkMode ? "#E2E8F0" : "#1E293B"),
                    fontSize: "0.95rem",
                    borderRadius: "6px",
                    fontWeight: currentPage === "account-settings" ? "600" : "400"
                  }}
                  onClick={() => {
                    onNavigate('account-settings');
                    setShowUserDropdown(false);
                  }}
                >
                  🔑 Account Settings
                </button>
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    width: "100%",
                    textAlign: "left",
                    padding: "0.75rem 1rem",
                    border: "none",
                    background: currentPage === "app-settings" ? (darkMode ? "rgba(var(--primary-rgb), 0.15)" : "rgba(var(--primary-rgb), 0.05)") : "none",
                    cursor: "pointer",
                    color: currentPage === "app-settings" ? "var(--primary)" : (darkMode ? "#E2E8F0" : "#1E293B"),
                    fontSize: "0.95rem",
                    borderRadius: "6px",
                    fontWeight: currentPage === "app-settings" ? "600" : "400"
                  }}
                  onClick={() => {
                    onNavigate('app-settings');
                    setShowUserDropdown(false);
                  }}
                >
                  ⚙️ App Settings
                </button>
                
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    width: "100%",
                    textAlign: "left",
                    padding: "0.75rem 1rem",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    color: darkMode ? "#E2E8F0" : "#1E293B",
                    fontSize: "0.95rem",
                    borderRadius: "6px",
                    fontWeight: "400"
                  }}
                  onClick={() => {
                    setShowTutorial(true);
                    setShowUserDropdown(false);
                  }}
                >
                  📚 Tutorial
                </button>

                <div style={{ height: "1px", background: darkMode ? "#334155" : "#F1F5F9", margin: "0.5rem 0" }}></div>
                
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    width: "100%",
                    textAlign: "left",
                    padding: "0.75rem 1rem",
                    border: "none",
                    background: "none",
                    cursor: "pointer",
                    color: "#EF4444",
                    fontSize: "0.95rem",
                    fontWeight: "600",
                    borderRadius: "6px"
                  }}
                  onClick={onLogout}
                >
                  🚪 Log Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>

    {/* Floating Action Button - Settings/Help/DarkMode */}
    <div style={{
      position: "fixed",
      bottom: "9.5rem",
      right: "2rem",
      zIndex: 1100,
      display: "flex",
      flexDirection: "column",
      alignItems: "center"
    }}>
      {showFAB && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          gap: "1rem",
          marginBottom: "1.5rem",
          animation: "slideUp 0.3s ease-out",
          alignItems: "center"
        }}>
          {/* Settings Button */}
          <button
            onClick={() => onNavigate('app-settings')}
            title="Settings"
            style={{
              padding: "0.75rem",
              background: "var(--primary)",
              color: "white",
              border: "none",
              borderRadius: "50%",
              boxShadow: "0 4px 15px rgba(var(--primary-rgb), 0.4)",
              cursor: "pointer",
              fontSize: "1.3rem",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "2.75rem",
              height: "2.75rem"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "var(--accent)";
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(var(--primary-rgb), 0.5)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "var(--primary)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(var(--primary-rgb), 0.4)";
            }}
          >
            ⚙️
          </button>

          {/* Help Button */}
          <button
            onClick={() => {
              handleHelp();
              setShowFAB(false);
            }}
            title="Help"
            style={{
              padding: "0.75rem",
              background: "var(--primary)",
              color: "white",
              border: "none",
              borderRadius: "50%",
              boxShadow: "0 4px 15px rgba(var(--primary-rgb), 0.4)",
              cursor: "pointer",
              fontSize: "1.3rem",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "2.75rem",
              height: "2.75rem"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "var(--accent)";
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(var(--primary-rgb), 0.5)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "var(--primary)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(var(--primary-rgb), 0.4)";
            }}
          >
            ❔
          </button>

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            title="Toggle dark mode"
            style={{
              padding: "0.75rem",
              background: "var(--primary)",
              color: "white",
              border: "none",
              borderRadius: "50%",
              boxShadow: "0 4px 15px rgba(var(--primary-rgb), 0.4)",
              cursor: "pointer",
              fontSize: "1.3rem",
              transition: "all 0.3s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "2.75rem",
              height: "2.75rem"
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = "var(--accent)";
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(var(--primary-rgb), 0.5)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "var(--primary)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(var(--primary-rgb), 0.4)";
            }}
          >
            {darkMode ? "☀️" : "🌙"}
          </button>
        </div>
      )}

      {/* Main FAB Toggle Button */}
      <button
        onClick={() => setShowFAB(!showFAB)}
        title="Options"
        style={{
          padding: "0.75rem",
          background: "var(--primary)",
          color: "white",
          border: "none",
          borderRadius: "50%",
          boxShadow: "0 4px 15px rgba(var(--primary-rgb), 0.4)",
          cursor: "pointer",
          fontSize: "1.5rem",
          transition: "all 0.3s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "2.75rem",
          height: "2.75rem",
          transform: showFAB ? "rotate(45deg)" : "rotate(0deg)"
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.background = "var(--accent)";
          e.currentTarget.style.transform = showFAB ? "rotate(45deg) translateY(-3px)" : "translateY(-3px)";
          e.currentTarget.style.boxShadow = "0 6px 20px rgba(var(--primary-rgb), 0.5)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.background = "var(--primary)";
          e.currentTarget.style.transform = showFAB ? "rotate(45deg)" : "rotate(0deg)";
          e.currentTarget.style.boxShadow = "0 4px 15px rgba(var(--primary-rgb), 0.4)";
        }}
      >
        {showFAB ? "✕" : "+"}
      </button>
    </div>

    {/* Scroll to Top/Bottom floating buttons - matching Register style */}
    {showScroll && (
      <div style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        zIndex: 1100
      }}>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Scroll to top"
          style={{
            padding: "0.75rem",
            background: "var(--primary)",
            color: "white",
            border: "none",
            borderRadius: "50%",
            boxShadow: "0 4px 15px rgba(var(--primary-rgb), 0.4)",
            cursor: "pointer",
            fontSize: "1.25rem",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "2.75rem",
            height: "2.75rem"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "var(--accent)";
            e.currentTarget.style.transform = "translateY(-3px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(var(--primary-rgb), 0.5)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "var(--primary)";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 15px rgba(var(--primary-rgb), 0.4)";
          }}
        >
          <MdOutlineKeyboardArrowUp style={{ width: "1.5rem", height: "1.5rem" }} />
        </button>
        <button
          onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
          aria-label="Scroll to bottom"
          style={{
            padding: "0.75rem",
            background: "var(--primary)",
            color: "white",
            border: "none",
            borderRadius: "50%",
            boxShadow: "0 4px 15px rgba(var(--primary-rgb), 0.4)",
            cursor: "pointer",
            fontSize: "1.25rem",
            transition: "all 0.3s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "2.75rem",
            height: "2.75rem"
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = "var(--accent)";
            e.currentTarget.style.transform = "translateY(3px)";
            e.currentTarget.style.boxShadow = "0 6px 20px rgba(var(--primary-rgb), 0.5)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = "var(--primary)";
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow = "0 4px 15px rgba(var(--primary-rgb), 0.4)";
          }}
        >
          <MdOutlineKeyboardArrowDown style={{ width: "1.5rem", height: "1.5rem" }} />
        </button>
      </div>
    )}

    {/* Tutorial Modal */}
    {showTutorial && (
      <Tutorial onComplete={() => setShowTutorial(false)} />
    )}
    </>
  );
}
