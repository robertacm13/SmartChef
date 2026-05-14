import { useState, useEffect } from "react";
import { MdOutlineKeyboardArrowUp, MdOutlineKeyboardArrowDown } from "react-icons/md";
import { ShortcutsHelp } from "./utils/keyboardShortcuts";
import "./utils/keyboardShortcuts.css";
import "./App.css";
import Navbar from "./components/Navbar";

export default function PersonalData({ userEmail, onBack, onLogout, onNavigate, currentPage, darkMode, toggleDarkMode, handleHelp }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showScroll, setShowScroll] = useState(false);
  
  const [showShortcuts, setShowShortcuts] = useState(false);

  const handleSettings = () => {
    onNavigate("app-settings");
  };
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    age: "",
    height: "",
    weight: "",
    sex: ""
  });

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Scroll event listener for showing scroll buttons
  useEffect(() => {
    const updateScrollVisibility = () => {
      const isScrollable = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - window.innerHeight > 100;
      setShowScroll(isScrollable);
    };

    // Check immediately and at multiple intervals
    updateScrollVisibility();
    setTimeout(updateScrollVisibility, 50);
    setTimeout(updateScrollVisibility, 200);
    setTimeout(updateScrollVisibility, 500);
    
    window.addEventListener("scroll", updateScrollVisibility);
    window.addEventListener("resize", updateScrollVisibility);
    return () => {
      window.removeEventListener("scroll", updateScrollVisibility);
      window.removeEventListener("resize", updateScrollVisibility);
    };
  }, [loading, formData]);

  const fetchProfile = async () => {
    try {
      const res = await fetch(`http://localhost:8000/user_profile/${userEmail}`);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (data.status === "success") {
        setFormData({
          first_name: data.profile.first_name || "",
          last_name: data.profile.last_name || "",
          age: data.profile.age || "",
          height: data.profile.height || "",
          weight: data.profile.weight || "",
          sex: data.profile.sex || ""
        });
      } else {
        setError("Error loading data");
      }
    } catch (err) {
      setError(`Error connecting to server. Make sure the backend is running on port 8000.`);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      // Prepare data for API (convert empty strings to null, numbers to proper type)
      const apiData = {
        first_name: formData.first_name || null,
        last_name: formData.last_name || null,
        age: formData.age ? parseInt(formData.age) : null,
        height: formData.height ? parseFloat(formData.height) : null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        sex: formData.sex || null
      };

      const res = await fetch(`http://localhost:8000/user_profile/${userEmail}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(apiData)
      });

      const data = await res.json();

      if (res.ok && data.status === "success") {
        setSuccess("✅ Personal data saved successfully!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.detail || "Error saving data");
      }
    } catch (err) {
      setError("Error connecting to server");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animated-bg" style={{ minHeight: "100vh", paddingBottom: "2rem", background: darkMode ? "#0F172A" : "#F1F5F9" }}>
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
        <div style={{ textAlign: "center", padding: "3rem", marginTop: "4rem" }}>
          <div className="spinner" style={{ margin: "0 auto 1rem" }}></div>
          <p style={{ color: "#666" }}>Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animated-bg" style={{ minHeight: "100vh", paddingBottom: "2rem", background: darkMode ? "#0F172A" : "#F1F5F9" }}>
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

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "6rem 2rem 2rem 2rem" }}>
        <button
          className="btn btn-secondary"
          onClick={onBack}
          style={{ marginBottom: "2rem" }}
        >
          ← Back
        </button>

        <div className="card" style={{ padding: "6rem 2rem 2rem 2rem", background: darkMode ? "#1E293B" : "#FFFFFF", border: darkMode ? "1px solid #334155" : "1px solid #E2E8F0", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)" }}>
          <h2 style={{ 
            fontSize: "2rem", 
            fontWeight: "700", 
            color: "#3B82F6", 
            marginBottom: "0.5rem",
            textAlign: "center"
          }}>
            📊 Personal Data
          </h2>
          <p style={{ 
            color: darkMode ? "#94A3B8" : "#64748B", 
            fontSize: "0.95rem", 
            textAlign: "center",
            marginBottom: "2rem"
          }}>
            Complete your personal information
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
              background: "rgba(59, 130, 246, 0.1)",
              border: "1px solid rgba(59, 130, 246, 0.3)",
              borderRadius: "8px",
              color: "#3B82F6",
              marginBottom: "1rem"
            }}>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ 
                  display: "block", 
                  fontWeight: "600", 
                  marginBottom: "0.5rem",
                  color: "#333"
                }}>
                  First Name
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="e.g. John"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "border-color 0.3s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#3B82F6"}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                />
              </div>

              <div>
                <label style={{ 
                  display: "block", 
                  fontWeight: "600", 
                  marginBottom: "0.5rem",
                  color: "#333"
                }}>
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="e.g. Smith"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "border-color 0.3s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#3B82F6"}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                />
              </div>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <label style={{ 
                display: "block", 
                fontWeight: "600", 
                marginBottom: "0.5rem",
                color: "#333"
              }}>
                Age (years)
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="e.g. 25"
                min="1"
                max="120"
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "2px solid #e0e0e0",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  outline: "none",
                  transition: "border-color 0.3s"
                }}
                onFocus={(e) => e.target.style.borderColor = "#3B82F6"}
                onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginTop: "1rem" }}>
              <div>
                <label style={{ 
                  display: "block", 
                  fontWeight: "600", 
                  marginBottom: "0.5rem",
                  color: "#333"
                }}>
                  Height (cm)
                </label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="e.g. 175"
                  min="50"
                  max="250"
                  step="0.1"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "border-color 0.3s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#3B82F6"}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                />
              </div>

              <div>
                <label style={{ 
                  display: "block", 
                  fontWeight: "600", 
                  marginBottom: "0.5rem",
                  color: "#333"
                }}>
                  Weight (kg)
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="e.g. 70"
                  min="20"
                  max="300"
                  step="0.1"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "border-color 0.3s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#3B82F6"}
                  onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
                />
              </div>
            </div>

            <div style={{ marginTop: "1rem" }}>
              <label style={{ 
                display: "block", 
                fontWeight: "600", 
                marginBottom: "0.5rem",
                color: "#333"
              }}>
                Gender
              </label>
              <select
                name="sex"
                value={formData.sex}
                onChange={handleChange}
                style={{
                  width: "100%",
                  padding: "0.75rem",
                  border: "2px solid #e0e0e0",
                  borderRadius: "8px",
                  fontSize: "1rem",
                  outline: "none",
                  transition: "border-color 0.3s",
                  cursor: "pointer",
                  background: "white"
                }}
                onFocus={(e) => e.target.style.borderColor = "#3B82F6"}
                onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
              >
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
              style={{
                width: "100%",
                marginTop: "2rem",
                padding: "1rem",
                fontSize: "1.1rem",
                fontWeight: "600"
              }}
            >
              {saving ? "Saving..." : "💾 Save Data"}
            </button>
          </form>
        </div>

        <div style={{
          marginTop: "1.5rem",
          padding: "1rem",
          background: "rgba(33, 150, 243, 0.1)",
          borderRadius: "8px",
          border: "1px solid rgba(33, 150, 243, 0.2)"
        }}>
          <p style={{ fontSize: "0.9rem", color: "#666", margin: 0 }}>
            💡 <strong>Tip:</strong> This information helps us provide you with personalized nutritional recommendations and calculate your daily caloric needs more accurately.
          </p>
        </div>
      </div>

      {/* Scroll to Top/Bottom floating buttons */}
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
              e.currentTarget.style.background = "var(--accent)";
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.5)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "var(--primary)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(59, 130, 246, 0.4)";
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
              e.currentTarget.style.background = "var(--accent)";
              e.currentTarget.style.transform = "translateY(3px)";
              e.currentTarget.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.5)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "var(--primary)";
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 15px rgba(59, 130, 246, 0.4)";
            }}
          >
            <MdOutlineKeyboardArrowDown style={{ width: "1.5rem", height: "1.5rem" }} />
          </button>
        </div>
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {showShortcuts && (
        <ShortcutsHelp 
          onClose={() => setShowShortcuts(false)}
        />
      )}
    </div>
  );
}





