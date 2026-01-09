import { useState, useEffect } from "react";
import "./App.css";

export default function PersonalData({ userEmail, onBack, onLogout, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [showNavDropdown, setShowNavDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [navDropdownTimeout, setNavDropdownTimeout] = useState(null);
  const [userDropdownTimeout, setUserDropdownTimeout] = useState(null);

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

  const fetchProfile = async () => {
    try {
      const res = await fetch(`http://localhost:8001/user_profile/${userEmail}`);
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
        setError("Eroare la încărcarea datelor");
      }
    } catch (err) {
      setError("Eroare la conectarea cu serverul");
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

      const res = await fetch(`http://localhost:8001/user_profile/${userEmail}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(apiData)
      });

      const data = await res.json();

      if (res.ok && data.status === "success") {
        setSuccess("✅ Datele personale au fost salvate cu succes!");
        setTimeout(() => setSuccess(""), 3000);
      } else {
        setError(data.detail || "Eroare la salvarea datelor");
      }
    } catch (err) {
      setError("Eroare la conectarea cu serverul");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="animated-bg" style={{ minHeight: "100vh", padding: "2rem" }}>
        <div style={{ textAlign: "center", padding: "3rem" }}>
          <div className="spinner" style={{ margin: "0 auto 1rem" }}></div>
          <p style={{ color: "#666" }}>Se încarcă datele...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="animated-bg" style={{ minHeight: "100vh", paddingBottom: "2rem" }}>
      <header className="header">
        <div className="header-content">
          <div className="logo" onClick={onBack} style={{ cursor: "pointer" }}>
            🍳 SmartChef
          </div>
          <div className="nav-buttons">
            <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", marginLeft: "auto", marginRight: "-0.5rem" }}>
              {/* Navigation Dropdown */}
              <div 
                style={{ position: "relative" }}
                onMouseEnter={handleNavMouseEnter}
                onMouseLeave={handleNavMouseLeave}
              >
                <button
                  className="btn btn-outline"
                  style={{ padding: "0.7rem 1.2rem", fontSize: "1.5rem", background: "rgba(255,255,255,0.2)" }}
                >
                  ☰
                </button>
                {showNavDropdown && (
                  <div className="nav-dropdown">
                    <button
                      className="nav-dropdown-item"
                      onClick={() => {
                        onNavigate('dashboard');
                        setShowNavDropdown(false);
                      }}
                    >
                      📈 Dashboard
                    </button>
                    <button
                      className="nav-dropdown-item"
                      onClick={() => {
                        onNavigate('history');
                        setShowNavDropdown(false);
                      }}
                    >
                      📊 Istoric
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
                      onNavigate('personal-data');
                      setShowUserDropdown(false);
                    }} style={{ fontWeight: "600", background: "rgba(255, 107, 53, 0.1)" }}>
                      <span className="dropdown-icon">📊</span>
                      Date personale
                    </button>
                    
                    <button className="user-dropdown-item" onClick={() => {
                      onNavigate('account-settings');
                      setShowUserDropdown(false);
                    }}>
                      <span className="dropdown-icon">⚙️</span>
                      Setările contului
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
          </div>
        </div>
      </header>

      <div style={{ maxWidth: "600px", margin: "0 auto", padding: "2rem" }}>
        <button
          className="btn btn-secondary"
          onClick={onBack}
          style={{ marginBottom: "2rem" }}
        >
          ← Înapoi
        </button>

        <div className="card" style={{ padding: "2rem" }}>
          <h2 style={{ 
            fontSize: "2rem", 
            fontWeight: "700", 
            color: "#ff6b35", 
            marginBottom: "0.5rem",
            textAlign: "center"
          }}>
            📊 Date Personale
          </h2>
          <p style={{ 
            color: "#666", 
            fontSize: "0.95rem", 
            textAlign: "center",
            marginBottom: "2rem"
          }}>
            Completează informațiile tale personale
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
              background: "rgba(76, 175, 80, 0.1)",
              border: "1px solid rgba(76, 175, 80, 0.3)",
              borderRadius: "8px",
              color: "#388e3c",
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
                  Prenume
                </label>
                <input
                  type="text"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  placeholder="ex: Ion"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "border-color 0.3s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#ff6b35"}
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
                  Nume
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  placeholder="ex: Popescu"
                  style={{
                    width: "100%",
                    padding: "0.75rem",
                    border: "2px solid #e0e0e0",
                    borderRadius: "8px",
                    fontSize: "1rem",
                    outline: "none",
                    transition: "border-color 0.3s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#ff6b35"}
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
                Vârstă (ani)
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="ex: 25"
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
                onFocus={(e) => e.target.style.borderColor = "#ff6b35"}
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
                  Înălțime (cm)
                </label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="ex: 175"
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
                  onFocus={(e) => e.target.style.borderColor = "#ff6b35"}
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
                  Greutate (kg)
                </label>
                <input
                  type="number"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange}
                  placeholder="ex: 70"
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
                  onFocus={(e) => e.target.style.borderColor = "#ff6b35"}
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
                Sex
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
                onFocus={(e) => e.target.style.borderColor = "#ff6b35"}
                onBlur={(e) => e.target.style.borderColor = "#e0e0e0"}
              >
                <option value="">Selectează</option>
                <option value="male">Masculin</option>
                <option value="female">Feminin</option>
                <option value="other">Altul</option>
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
              {saving ? "Se salvează..." : "💾 Salvează datele"}
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
            💡 <strong>Sfat:</strong> Aceste informații ne ajută să îți oferim recomandări nutriționale personalizate și să calculăm mai precis necesarul tău caloric zilnic.
          </p>
        </div>
      </div>
    </div>
  );
}
