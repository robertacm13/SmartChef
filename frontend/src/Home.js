import React, { useState } from "react";
import { ShortcutsHelp } from "./utils/keyboardShortcuts";
import "./utils/keyboardShortcuts.css";
import Tutorial from "./components/Tutorial";
import { FaFacebook, FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";
import { MdOutlineKeyboardArrowUp, MdOutlineKeyboardArrowDown } from "react-icons/md";
import logoImg from "./logo.png";

function Home({ authToken, userEmail, onNavigate, onLogout, darkMode, toggleDarkMode }) {
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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

  return (
    <div style={{ minHeight: "100vh", background: darkMode ? "#0F172A" : "#FFFFFF", color: darkMode ? "#E2E8F0" : "#1E293B" }}>
      {/* --- NAVBAR --- */}
      <nav style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1rem 2rem",
        borderBottom: "1px solid #E2E8F0",
        background: darkMode ? "#1E293B" : "#F8FAFC",
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 1000,
        width: "100%"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
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
          <span style={{ fontSize: "1.25rem", fontWeight: "bold", letterSpacing: "-0.05em" }}>SmartChef</span>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {authToken ? (
            <>
              <button 
                onClick={() => onNavigate("dashboard")}
                style={{ padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: "500", background: "none", border: "none", cursor: "pointer", color: darkMode ? "#E2E8F0" : "#1E293B" }}
              >
                Dashboard
              </button>
              <button 
                onClick={() => onNavigate("dashboard")}
                style={{ padding: "0.625rem 1.25rem", background: "#3B82F6", color: "white", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: "600", border: "none", cursor: "pointer" }}
              >
                Analyze
              </button>
              <button 
                onClick={onLogout}
                style={{ padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: "500", background: "none", border: "none", cursor: "pointer", color: darkMode ? "#E2E8F0" : "#1E293B" }}
              >
                Log Out
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={() => onNavigate("login")}
                style={{ padding: "0.5rem 1rem", fontSize: "0.875rem", fontWeight: "500", background: "none", border: "none", cursor: "pointer", color: darkMode ? "#E2E8F0" : "#1E293B" }}
              >
                Log In
              </button>
              <button 
                onClick={() => onNavigate("register")}
                style={{ padding: "0.625rem 1.25rem", background: "#3B82F6", color: "white", borderRadius: "0.375rem", fontSize: "0.875rem", fontWeight: "600", border: "none", cursor: "pointer" }}
              >
                Sign Up
              </button>
            </>
          )}
          
          {/* Light/Dark Toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginLeft: "1rem", paddingLeft: "1rem", borderLeft: "1px solid #E2E8F0" }}>
            {/* Help Button */}
            <button
              onClick={() => setShowHelpModal(true)}
              aria-label="Open help and support"
              style={{
                padding: "0.5rem 0.75rem",
                fontSize: "1.125rem",
                background: "none",
                border: "none",
                cursor: "pointer",
                color: darkMode ? "#E2E8F0" : "#1E293B",
                transition: "all 0.3s ease",
                borderRadius: "0.375rem"
              }}
              onMouseOver={(e) => {
                e.target.style.background = darkMode ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.1)";
                e.target.style.color = "#3B82F6";
              }}
              onMouseOut={(e) => {
                e.target.style.background = "none";
                e.target.style.color = darkMode ? "#E2E8F0" : "#1E293B";
              }}
            >
              ?
            </button>
            
            <span style={{ fontSize: "0.75rem", fontWeight: "500", opacity: 0.6 }}>Light/Dark</span>
            <button 
              onClick={toggleDarkMode}
              style={{
                width: "48px",
                height: "24px",
                background: darkMode ? "#3B82F6" : "#E2E8F0",
                borderRadius: "9999px",
                padding: "0.25rem",
                transition: "all 0.3s ease",
                border: "none",
                cursor: "pointer",
                position: "relative",
                display: "flex",
                alignItems: "center"
              }}
            >
              <div style={{
                width: "16px",
                height: "16px",
                background: "white",
                borderRadius: "9999px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                transform: darkMode ? "translateX(24px)" : "translateX(0)",
                transition: "transform 0.3s ease"
              }} />
            </button>
          </div>
        </div>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main style={{ paddingTop: "80px" }}>
        {!authToken ? (
          <>
            {/* --- HERO SECTION --- */}
            <section style={{ background: darkMode ? "#0F172A" : "#FFFFFF", padding: "4rem 2rem", maxWidth: "1400px", margin: "0 auto" }}>
              <div style={{ display: "flex", gap: "3rem", alignItems: "center", flexWrap: "wrap" }}>
                {/* Left: Text */}
                <div style={{ flex: 1, minWidth: "350px" }}>
                  <h1 style={{
                    fontSize: "3.5rem",
                    fontWeight: "800",
                    color: darkMode ? "#E2E8F0" : "#1E293B",
                    marginBottom: "1.5rem",
                    lineHeight: "1.1"
                  }}>
                    Precision in nutrition,<br />
                    through a simple <span style={{ color: "#3B82F6", fontStyle: "italic" }}>Photograph</span>.
                  </h1>
                  
                  <p style={{
                    fontSize: "1.125rem",
                    color: darkMode ? "#94A3B8" : "#64748B",
                    marginBottom: "2rem",
                    fontWeight: "400",
                    lineHeight: "1.6",
                    maxWidth: "28rem"
                  }}>
                    Use our model to instantly analyze the calories and macronutrients of your meals.
                  </p>

                  <button
                    onClick={() => onNavigate("register")}
                    style={{
                      padding: "1rem 2rem",
                      background: "#3B82F6",
                      color: "white",
                      border: "none",
                      borderRadius: "0.5rem",
                      fontSize: "1.125rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      boxShadow: "0 10px 25px rgba(59, 130, 246, 0.2)"
                    }}
                    onMouseOver={(e) => {
                      e.target.style.background = "#2563EB";
                      e.target.style.transform = "translateY(-2px)";
                      e.target.style.boxShadow = "0 15px 35px rgba(59, 130, 246, 0.3)";
                    }}
                    onMouseOut={(e) => {
                      e.target.style.background = "#3B82F6";
                      e.target.style.transform = "translateY(0)";
                      e.target.style.boxShadow = "0 10px 25px rgba(59, 130, 246, 0.2)";
                    }}
                  >
                    Start now
                  </button>
                </div>

                {/* Right: Image */}
                <div style={{ flex: 1, minWidth: "350px", textAlign: "center" }}>
                  <div style={{
                    position: "relative",
                    borderRadius: "1rem",
                    overflow: "hidden",
                    border: darkMode ? "1px solid #334155" : "1px solid #E2E8F0",
                    boxShadow: "0 20px 50px rgba(0,0,0,0.1)"
                  }}>
                    <img 
                      src="https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=600" 
                      alt="Healthy Food Analysis" 
                      style={{ width: "100%", height: "auto", display: "block" }}
                    />
                    {/* Analysis Overlay */}
                    <div style={{
                      position: "absolute",
                      top: "1rem",
                      right: "1rem",
                      background: darkMode ? "rgba(30, 41, 59, 0.95)" : "rgba(255, 255, 255, 0.95)",
                      backdropFilter: "blur(10px)",
                      padding: "1rem",
                      borderRadius: "0.5rem",
                      boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
                      border: darkMode ? "1px solid #334155" : "1px solid #E2E8F0",
                      maxWidth: "200px",
                      fontSize: "0.875rem",
                      color: darkMode ? "#E2E8F0" : "#1E293B"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.75rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.05em" }}>Smart Recognition</span>
                      </div>
                      <p style={{ fontWeight: "700", borderBottom: "1px solid #E2E8F0", paddingBottom: "0.5rem", marginBottom: "0.5rem", color: "#3B82F6" }}>Buddha Bowl</p>
                      <div style={{ lineHeight: "1.6" }}>
                        <p>Calories: <span style={{ fontWeight: "700" }}>550 kcal</span></p>
                        <p>Protein: <span style={{ fontWeight: "700" }}>25g</span></p>
                        <p>Carbs: <span style={{ fontWeight: "700" }}>60g</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* --- FEATURES SECTION --- */}
            <section style={{ maxWidth: "1200px", margin: "0 auto", padding: "6rem 2rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "5rem" }}>
                {/* Feature 1 */}
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    padding: "1rem",
                    background: darkMode ? "#1E3A5F" : "#F0F9FF",
                    borderRadius: "1rem",
                    color: "#3B82F6",
                    fontSize: "2rem",
                    marginBottom: "1rem",
                    display: "inline-block"
                  }}>
                    📸
                  </div>
                  <h3 style={{ fontWeight: "700", fontSize: "1.25rem", marginBottom: "0.5rem", color: darkMode ? "#E2E8F0" : "#1E293B" }}>Instant Recognition</h3>
                  <p style={{ fontSize: "0.875rem", color: darkMode ? "#94A3B8" : "#64748B", lineHeight: "1.5" }}>Take a photo, get the data. No manual database.</p>
                </div>
                
                {/* Feature 2 */}
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    padding: "1rem",
                    background: darkMode ? "#1E3A5F" : "#F0F9FF",
                    borderRadius: "1rem",
                    color: "#3B82F6",
                    fontSize: "2rem",
                    marginBottom: "1rem",
                    display: "inline-block"
                  }}>
                    📊
                  </div>
                  <h3 style={{ fontWeight: "700", fontSize: "1.25rem", marginBottom: "0.5rem", color: darkMode ? "#E2E8F0" : "#1E293B" }}>Detailed Analysis</h3>
                  <p style={{ fontSize: "0.875rem", color: darkMode ? "#94A3B8" : "#64748B", lineHeight: "1.5" }}>Macronutrients, fiber and vitamins in one place.</p>
                </div>
                
                {/* Feature 3 */}
                <div style={{ textAlign: "center" }}>
                  <div style={{
                    padding: "1rem",
                    background: darkMode ? "#1E3A5F" : "#F0F9FF",
                    borderRadius: "1rem",
                    color: "#3B82F6",
                    fontSize: "2rem",
                    marginBottom: "1rem",
                    display: "inline-block"
                  }}>
                    📈
                  </div>
                  <h3 style={{ fontWeight: "700", fontSize: "1.25rem", marginBottom: "0.5rem", color: darkMode ? "#E2E8F0" : "#1E293B" }}>Progress Tracking</h3>
                  <p style={{ fontSize: "0.875rem", color: darkMode ? "#94A3B8" : "#64748B", lineHeight: "1.5" }}>Intuitive charts for easy progress tracking.</p>
                </div>
              </div>
            </section>

            {/* --- SOCIAL & HELP SECTION --- */}
            <section style={{ background: darkMode ? "#1E293B" : "#F8FAFC", padding: "3rem 2rem", textAlign: "center" }}>
              <div style={{ display: "flex", justifyContent: "center", gap: "2rem", marginBottom: "1.5rem" }}>
                <a 
                  href="https://www.facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="Visit our Facebook page"
                  style={{ 
                    fontSize: "1.75rem", 
                    color: darkMode ? "#64748B" : "#94A3B8", 
                    transition: "all 0.3s ease", 
                    textDecoration: "none", 
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "2.5rem",
                    height: "2.5rem",
                    borderRadius: "50%",
                    backgroundColor: darkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)"
                  }} 
                  onMouseOver={(e) => {
                    e.target.style.color = "#3B82F6";
                    e.target.style.backgroundColor = "rgba(59, 130, 246, 0.15)";
                    e.target.style.transform = "scale(1.1)";
                  }} 
                  onMouseOut={(e) => {
                    e.target.style.color = darkMode ? "#64748B" : "#94A3B8";
                    e.target.style.backgroundColor = darkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)";
                    e.target.style.transform = "scale(1)";
                  }}
                >
                  <FaFacebook style={{ width: "1.25rem", height: "1.25rem" }} />
                </a>
                <a 
                  href="https://www.instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="Visit our Instagram page"
                  style={{ 
                    fontSize: "1.75rem", 
                    color: darkMode ? "#64748B" : "#94A3B8", 
                    transition: "all 0.3s ease", 
                    textDecoration: "none", 
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "2.5rem",
                    height: "2.5rem",
                    borderRadius: "50%",
                    backgroundColor: darkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)"
                  }} 
                  onMouseOver={(e) => {
                    e.target.style.color = "#3B82F6";
                    e.target.style.backgroundColor = "rgba(59, 130, 246, 0.15)";
                    e.target.style.transform = "scale(1.1)";
                  }} 
                  onMouseOut={(e) => {
                    e.target.style.color = darkMode ? "#64748B" : "#94A3B8";
                    e.target.style.backgroundColor = darkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)";
                    e.target.style.transform = "scale(1)";
                  }}
                >
                  <FaInstagram style={{ width: "1.25rem", height: "1.25rem" }} />
                </a>
                <a 
                  href="https://www.linkedin.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="Visit our LinkedIn page"
                  style={{ 
                    fontSize: "1.75rem", 
                    color: darkMode ? "#64748B" : "#94A3B8", 
                    transition: "all 0.3s ease", 
                    textDecoration: "none", 
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "2.5rem",
                    height: "2.5rem",
                    borderRadius: "50%",
                    backgroundColor: darkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)"
                  }} 
                  onMouseOver={(e) => {
                    e.target.style.color = "#3B82F6";
                    e.target.style.backgroundColor = "rgba(59, 130, 246, 0.15)";
                    e.target.style.transform = "scale(1.1)";
                  }} 
                  onMouseOut={(e) => {
                    e.target.style.color = darkMode ? "#64748B" : "#94A3B8";
                    e.target.style.backgroundColor = darkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)";
                    e.target.style.transform = "scale(1)";
                  }}
                >
                  <FaLinkedin style={{ width: "1.25rem", height: "1.25rem" }} />
                </a>
                <a 
                  href="https://www.twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label="Visit our Twitter page"
                  style={{ 
                    fontSize: "1.75rem", 
                    color: darkMode ? "#64748B" : "#94A3B8", 
                    transition: "all 0.3s ease", 
                    textDecoration: "none", 
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "2.5rem",
                    height: "2.5rem",
                    borderRadius: "50%",
                    backgroundColor: darkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)"
                  }} 
                  onMouseOver={(e) => {
                    e.target.style.color = "#3B82F6";
                    e.target.style.backgroundColor = "rgba(59, 130, 246, 0.15)";
                    e.target.style.transform = "scale(1.1)";
                  }} 
                  onMouseOut={(e) => {
                    e.target.style.color = darkMode ? "#64748B" : "#94A3B8";
                    e.target.style.backgroundColor = darkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)";
                    e.target.style.transform = "scale(1)";
                  }}
                >
                  <FaTwitter style={{ width: "1.25rem", height: "1.25rem" }} />
                </a>
              </div>
              <p style={{ fontSize: "0.75rem", color: darkMode ? "#64748B" : "#94A3B8" }}>© 2026 SmartChef. All rights reserved.</p>
            </section>
          </>
        ) : (
          // Authenticated User View
          <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "3rem 2rem" }}>
            <div style={{ textAlign: "center", marginTop: "4rem" }}>
              <div style={{
                background: "linear-gradient(135deg, #3B82F6 0%, #2563EB 100%)",
                color: "white",
                padding: "3rem",
                borderRadius: "1.25rem",
                boxShadow: "0 10px 30px rgba(59, 130, 246, 0.3)"
              }}>
                <h2 style={{ fontSize: "2.5rem", marginBottom: "1rem", fontWeight: "700" }}>
                  🍽️ Ready to analyze your meal?
                </h2>
                <p style={{ fontSize: "1.125rem", marginBottom: "2rem", opacity: 0.95 }}>
                  Upload an image and instantly discover nutritional values
                </p>
                <button
                  onClick={() => onNavigate("dashboard")}
                  style={{ 
                    background: "white",
                    color: "#3B82F6",
                    padding: "1rem 2rem",
                    fontSize: "1.125rem",
                    fontWeight: "700",
                    border: "none",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
                    borderRadius: "0.75rem",
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

      {/* --- FLOATING ACTION BUTTONS --- */}
      <div style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        zIndex: 100
      }}>
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Scroll to top"
          style={{
            padding: "0.75rem",
            background: "#3B82F6",
            color: "white",
            border: "none",
            borderRadius: "50%",
            boxShadow: "0 4px 15px rgba(59, 130, 246, 0.4)",
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
            e.target.style.background = "#2563EB";
            e.target.style.transform = "translateY(-3px)";
            e.target.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.5)";
          }}
          onMouseOut={(e) => {
            e.target.style.background = "#3B82F6";
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 15px rgba(59, 130, 246, 0.4)";
          }}
        >
          <MdOutlineKeyboardArrowUp style={{ width: "1.5rem", height: "1.5rem" }} />
        </button>
        <button 
          onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
          aria-label="Scroll to bottom"
          style={{
            padding: "0.75rem",
            background: "#3B82F6",
            color: "white",
            border: "none",
            borderRadius: "50%",
            boxShadow: "0 4px 15px rgba(59, 130, 246, 0.4)",
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
            e.target.style.background = "#2563EB";
            e.target.style.transform = "translateY(3px)";
            e.target.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.5)";
          }}
          onMouseOut={(e) => {
            e.target.style.background = "#3B82F6";
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 15px rgba(59, 130, 246, 0.4)";
          }}
        >
          <MdOutlineKeyboardArrowDown style={{ width: "1.5rem", height: "1.5rem" }} />
        </button>
      </div>

      {/* Help Modal */}
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
            background: darkMode ? "#1E293B" : "white",
            borderRadius: "1.25rem",
            padding: "2rem",
            maxWidth: "600px",
            maxHeight: "80vh",
            overflow: "auto",
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)"
          }}>
            <h2 style={{ fontSize: "1.875rem", color: "#3B82F6", marginBottom: "1rem" }}>
              ❓ Help & Support
            </h2>
            <p style={{ color: darkMode ? "#94A3B8" : "#666", marginBottom: "1.5rem", lineHeight: "1.8" }}>
              SmartChef uses advanced AI to analyze your meals instantly. Simply take a photo of your food and get complete nutritional information.
            </p>
            <div style={{ marginBottom: "1rem" }}>
              <h3 style={{ color: darkMode ? "#E2E8F0" : "#1E293B", marginBottom: "0.5rem", fontWeight: "600" }}>
                Getting Started
              </h3>
              <p style={{ color: darkMode ? "#94A3B8" : "#666", fontSize: "0.95rem" }}>
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
                padding: "0.5rem 1rem",
                borderRadius: "0.75rem",
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

      {/* Keyboard Shortcuts */}
      {showShortcuts && (
        <ShortcutsHelp onClose={() => setShowShortcuts(false)} />
      )}

      {/* Tutorial */}
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

