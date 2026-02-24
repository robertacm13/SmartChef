import { useState, useEffect } from "react";
import "./App.css";
import Tooltip, { InfoIcon } from "./components/Tooltip";
import { getUserFriendlyError } from "./utils/errorMessages";
import "./utils/errorMessages.css";
import { useKeyboardShortcuts, ShortcutsHelp } from "./utils/keyboardShortcuts";
import "./utils/keyboardShortcuts.css";
import { AnalysisCardSkeleton } from "./components/SkeletonLoader";

export default function History({ userEmail, onBack, onLogout, onNavigate, darkMode, toggleDarkMode, handleSettings, handleHelp }) {
  const ITEMS_PER_PAGE = 20;
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [showNavDropdown, setShowNavDropdown] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
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
  
  // Filtre și căutare
  const [searchQuery, setSearchQuery] = useState("");
  const [ingredientFilter, setIngredientFilter] = useState("all"); // all, 1-3, 4-6, 7+
  const [sortBy, setSortBy] = useState("date-desc"); // date-desc, date-asc, calories-desc, calories-asc
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [userFriendlyError, setUserFriendlyError] = useState(null);

  // Keyboard shortcuts - Nielsen Heuristic #7
  useKeyboardShortcuts({
    'h': () => onBack(),
    'd': () => onNavigate('dashboard'),
    't': () => toggleDarkMode(),
    'f': () => document.querySelector('.search-input')?.focus(),
    '?': () => setShowShortcuts(true),
    'Escape': () => {
      if (selectedAnalysis) setSelectedAnalysis(null);
      else if (deleteConfirm) setDeleteConfirm(null);
      else if (showShortcuts) setShowShortcuts(false);
    }
  });


  useEffect(() => {
    fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8001/analysis_history/${userEmail}`);
      const data = await res.json();
      if (data.status === "success") {
        setAnalyses(data.analyses);
        setError("");
        setUserFriendlyError(null);
      } else {
        const friendlyError = getUserFriendlyError(data.error || "Unknown error");
        setError(friendlyError.message);
        setUserFriendlyError(friendlyError);
      }
    } catch (err) {
      const friendlyError = getUserFriendlyError(err);
      setError(friendlyError.message);
      setUserFriendlyError(friendlyError);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFavorite = async (analysisId, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`http://localhost:8001/analysis/${analysisId}/favorite`, {
        method: 'PUT',
        headers: {
          'X-User-Email': userEmail
        }
      });
      
      const data = await res.json();
      
      if (data.status === "success") {
        // Update local state
        setAnalyses(analyses.map(a => 
          a._id === analysisId 
            ? { ...a, is_favorite: data.is_favorite }
            : a
        ));
      } else {
        const friendlyError = getUserFriendlyError(data.error || "Eroare la actualizarea favorite");
        setUserFriendlyError(friendlyError);
      }
    } catch (err) {
      const friendlyError = getUserFriendlyError(err);
      setUserFriendlyError(friendlyError);
      console.error(err);
    }
  };

  const handleDelete = async (analysisId) => {
    try {
      const res = await fetch(`http://localhost:8001/analysis/${analysisId}`, {
        method: 'DELETE',
        headers: {
          'X-User-Email': userEmail
        }
      });
      
      const data = await res.json();
      
      if (data.status === "success") {
        // Remove from local state
        setAnalyses(analyses.filter(a => a._id !== analysisId));
        setDeleteConfirm(null);
        setSelectedAnalysis(null);
      } else {
        alert("Eroare la ștergere: " + data.detail);
      }
    } catch (err) {
      alert("Eroare la ștergerea analizei");
      console.error(err);
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("ro-RO", {
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  // Funcție de filtrare și sortare
  const getFilteredAndSortedAnalyses = () => {
    let filtered = [...analyses];

    // Filtrare după favorite
    if (favoritesOnly) {
      filtered = filtered.filter(analysis => analysis.is_favorite === true);
    }

    // Căutare după nume fișier sau ingredient
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(analysis => 
        analysis.image_name.toLowerCase().includes(query) ||
        analysis.ingredients.some(ing => ing.toLowerCase().includes(query))
      );
    }

    // Filtrare după număr ingrediente
    if (ingredientFilter !== "all") {
      filtered = filtered.filter(analysis => {
        const count = analysis.ingredients.length;
        if (ingredientFilter === "1-3") return count >= 1 && count <= 3;
        if (ingredientFilter === "4-6") return count >= 4 && count <= 6;
        if (ingredientFilter === "7+") return count >= 7;
        return true;
      });
    }

    // Sortare
    filtered.sort((a, b) => {
      if (sortBy === "date-desc") {
        return new Date(b.timestamp) - new Date(a.timestamp);
      }
      if (sortBy === "date-asc") {
        return new Date(a.timestamp) - new Date(b.timestamp);
      }
      if (sortBy === "calories-desc") {
        const caloriesA = a.nutrition?.total_nutrition?.calories || 0;
        const caloriesB = b.nutrition?.total_nutrition?.calories || 0;
        return caloriesB - caloriesA;
      }
      if (sortBy === "calories-asc") {
        const caloriesA = a.nutrition?.total_nutrition?.calories || 0;
        const caloriesB = b.nutrition?.total_nutrition?.calories || 0;
        return caloriesA - caloriesB;
      }
      if (sortBy === "ingredients-desc") {
        return b.ingredients.length - a.ingredients.length;
      }
      if (sortBy === "ingredients-asc") {
        return a.ingredients.length - b.ingredients.length;
      }
      return 0;
    });

    return filtered;
  };

  const filteredAnalyses = getFilteredAndSortedAnalyses();
  const totalPages = Math.max(1, Math.ceil(filteredAnalyses.length / ITEMS_PER_PAGE));
  const paginatedAnalyses = filteredAnalyses.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, ingredientFilter, sortBy, favoritesOnly]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const renderNutritionBars = (nutrition) => {
    const maxCalories = 800;
    const maxProtein = 50;
    const maxCarbs = 100;
    const maxFat = 50;

    const totalNutrition = nutrition.total_nutrition || nutrition;

    return (
      <div style={{ marginTop: "1rem" }}>
        <div style={{ marginBottom: "0.8rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
            <span style={{ fontSize: "0.9rem", color: "#666" }}>🔥 Calorii</span>
            <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#ff6b35" }}>
              {Number(totalNutrition.calories).toFixed(2)} kcal
            </span>
          </div>
          <div style={{ 
            width: "100%", 
            height: "8px", 
            background: "#f0f0f0", 
            borderRadius: "10px",
            overflow: "hidden"
          }}>
            <div style={{ 
              width: `${Math.min((totalNutrition.calories / maxCalories) * 100, 100)}%`, 
              height: "100%", 
              background: "linear-gradient(90deg, #ff6b35, #ff8c42)",
              transition: "width 0.5s ease"
            }}></div>
          </div>
        </div>

        <div style={{ marginBottom: "0.8rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
            <span style={{ fontSize: "0.9rem", color: "#666" }}>💪 Proteine</span>
            <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#4CAF50" }}>
              {Number(totalNutrition.protein).toFixed(2)}g
            </span>
          </div>
          <div style={{ 
            width: "100%", 
            height: "8px", 
            background: "#f0f0f0", 
            borderRadius: "10px",
            overflow: "hidden"
          }}>
            <div style={{ 
              width: `${Math.min((totalNutrition.protein / maxProtein) * 100, 100)}%`, 
              height: "100%", 
              background: "linear-gradient(90deg, #4CAF50, #66BB6A)",
              transition: "width 0.5s ease"
            }}></div>
          </div>
        </div>

        <div style={{ marginBottom: "0.8rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
            <span style={{ fontSize: "0.9rem", color: "#666" }}>🍞 Carbohidrați</span>
            <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#2196F3" }}>
              {Number(totalNutrition.carbs).toFixed(2)}g
            </span>
          </div>
          <div style={{ 
            width: "100%", 
            height: "8px", 
            background: "#f0f0f0", 
            borderRadius: "10px",
            overflow: "hidden"
          }}>
            <div style={{ 
              width: `${Math.min((totalNutrition.carbs / maxCarbs) * 100, 100)}%`, 
              height: "100%", 
              background: "linear-gradient(90deg, #2196F3, #42A5F5)",
              transition: "width 0.5s ease"
            }}></div>
          </div>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
            <span style={{ fontSize: "0.9rem", color: "#666" }}>🥑 Grăsimi</span>
            <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#FFC107" }}>
              {Number(totalNutrition.fat).toFixed(2)}g
            </span>
          </div>
          <div style={{ 
            width: "100%", 
            height: "8px", 
            background: "#f0f0f0", 
            borderRadius: "10px",
            overflow: "hidden"
          }}>
            <div style={{ 
              width: `${Math.min((totalNutrition.fat / maxFat) * 100, 100)}%`, 
              height: "100%", 
              background: "linear-gradient(90deg, #FFC107, #FFD54F)",
              transition: "width 0.5s ease"
            }}></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="animated-bg" style={{ minHeight: "100vh", paddingBottom: "2rem" }}>
      {/* Skip Link pentru keyboard navigation - WCAG 2.1 */}
      <a href="#main-content" className="skip-link">
        Sari la conținut principal
      </a>
      
      <header className="header">
        <div className="header-content">
          <div className="logo" onClick={onBack} style={{ cursor: "pointer" }}>
            🍳 SmartChef
          </div>
          <div className="nav-buttons">
            {/* Right side - Menu & User */}
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
                      style={{ fontWeight: "600", background: "rgba(255, 107, 53, 0.1)" }}
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
                    }}>
                      <span className="dropdown-icon">📊</span>
                      Date personale
                    </button>
                    
                    <button className="user-dropdown-item" onClick={() => {
                      onNavigate('account-settings');
                      setShowUserDropdown(false);
                    }}>
                      <span className="dropdown-icon">🔑</span>
                      Setările contului
                    </button>

                    <button className="user-dropdown-item" onClick={() => {
                      onNavigate('app-settings');
                      setShowUserDropdown(false);
                    }}>
                      <span className="dropdown-icon">⚙️</span>
                      Setări aplicație
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

      {/* Main Content Area - Accessible landmark */}
      <main id="main-content" style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "2.5rem", fontWeight: "700", color: "#ff6b35", marginBottom: "0.5rem" }}>
            📊 Istoricul Analizelor
          </h2>
          <p style={{ color: "#666", fontSize: "1rem" }}>
            Toate analizele tale de mâncare
          </p>
        </div>

        {/* Search și Filtre */}
        <div style={{ 
          background: "white", 
          borderRadius: "15px", 
          padding: "1.5rem", 
          marginBottom: "2rem",
          boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
        }}>
          {/* Search Bar */}
          <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="text"
              className="search-input"
              placeholder="🔍 Caută după nume fişier sau ingredient..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                padding: "0.8rem 1rem",
                fontSize: "1rem",
                border: "2px solid #e0e0e0",
                borderRadius: "10px",
                fontFamily: "'Poppins', sans-serif"
              }}
              aria-label="Caută analize"
            />
            <InfoIcon text="Caută după numele fişierului sau după orice ingredient. Shortcut: tasta F" />
          </div>

          {/* Filtre */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ flex: "1", minWidth: "200px" }}>
              <label style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.3rem", display: "flex", alignItems: "center" }}>
                📏 Număr ingrediente:
                <InfoIcon text="Filtrează analizele după numărul de ingrediente detectate" />
              </label>
              <select
                value={ingredientFilter}
                onChange={(e) => setIngredientFilter(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.6rem",
                  fontSize: "0.95rem",
                  border: "2px solid #e0e0e0",
                  borderRadius: "8px",
                  fontFamily: "'Poppins', sans-serif"
                }}
              >
                <option value="all">Toate</option>
                <option value="1-3">1-3 ingrediente</option>
                <option value="4-6">4-6 ingrediente</option>
                <option value="7+">7+ ingrediente</option>
              </select>
            </div>

            <div style={{ flex: "1", minWidth: "200px" }}>
              <label style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.3rem", display: "flex", alignItems: "center" }}>
                ⭐ Favorite:
                <InfoIcon text="Arată doar analizele marcate ca favorite" />
              </label>
              <button
                onClick={() => setFavoritesOnly(!favoritesOnly)}
                style={{
                  width: "100%",
                  padding: "0.6rem",
                  fontSize: "0.95rem",
                  border: "2px solid #e0e0e0",
                  borderRadius: "8px",
                  fontFamily: "'Poppins', sans-serif",
                  background: favoritesOnly ? "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)" : "white",
                  color: favoritesOnly ? "white" : "#333",
                  fontWeight: favoritesOnly ? "600" : "400",
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
              >
                {favoritesOnly ? "✅ Doar favorite" : "Toate analizele"}
              </button>
            </div>

            <div style={{ flex: "1", minWidth: "200px" }}>
              <label style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.3rem", display: "flex", alignItems: "center" }}>
                🔄 Sortare:
                <InfoIcon text="Sortează rezultatele după criter diverse" />
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.6rem",
                  fontSize: "0.95rem",
                  border: "2px solid #e0e0e0",
                  borderRadius: "8px",
                  fontFamily: "'Poppins', sans-serif"
                }}
              >
                <option value="date-desc">Data (mai recente)</option>
                <option value="date-asc">Data (mai vechi)</option>
                <option value="calories-desc">Calorii (descrescător)</option>
                <option value="calories-asc">Calorii (crescător)</option>
                <option value="ingredients-desc">Nr. ingrediente (↓)</option>
                <option value="ingredients-asc">Nr. ingrediente (↑)</option>
              </select>
            </div>
          </div>

          {/* Counter rezultate */}
          <div style={{ marginTop: "1rem", textAlign: "center", color: "#666", fontSize: "0.9rem" }}>
            {filteredAnalyses.length} {filteredAnalyses.length === 1 ? 'rezultat găsit' : 'rezultate găsite'}
          </div>
        </div>

        <button
          className="btn btn-secondary"
          onClick={onBack}
          style={{ marginBottom: "2rem" }}
        >
          ← Înapoi
        </button>

        {loading && (
          <div style={{ display: "grid", gap: "1.5rem", padding: "1rem 0" }}>
            {Array.from({ length: 4 }).map((_, index) => (
              <AnalysisCardSkeleton key={`history-skeleton-${index}`} />
            ))}
          </div>
        )}

        {userFriendlyError && (
          <div className={`error-display error-${userFriendlyError.severity}`} role="alert" aria-live="assertive">
            <div className="error-icon">{userFriendlyError.icon}</div>
            <div className="error-content">
              <h3 className="error-title">{userFriendlyError.title}</h3>
              <p className="error-message">{userFriendlyError.message}</p>
              {userFriendlyError.tips && userFriendlyError.tips.length > 0 && (
                <ul className="error-tips">
                  {userFriendlyError.tips.map((tip, index) => (
                    <li key={index}>💡 {tip}</li>
                  ))}
                </ul>
              )}
              <div className="error-actions">
                <button 
                  className="error-action-btn primary"
                  onClick={() => fetchHistory()}
                >
                  {userFriendlyError.action}
                </button>
                <button 
                  className="error-action-btn secondary"
                  onClick={() => setUserFriendlyError(null)}
                >
                  Închide
                </button>
              </div>
            </div>
          </div>
        )}

        {!loading && !error && filteredAnalyses.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "3rem",
            background: "white",
            borderRadius: "20px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)"
          }}>
            <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔍</p>
            <p style={{ fontSize: "1.2rem", color: "#666" }}>
              {analyses.length === 0 
                ? "Nu ai încă nicio analiză. Uploadează prima ta imagine!"
                : "Nu s-au găsit rezultate pentru filtrele aplicate."}
            </p>
          </div>
        )}

        {!loading && !error && filteredAnalyses.length > 0 && (
          <div style={{ position: "relative" }}>
            {/* Timeline line */}
            <div style={{
              position: "absolute",
              left: "20px",
              top: "0",
              bottom: "0",
              width: "3px",
              background: "linear-gradient(180deg, #ff6b35, #ff8c42)",
              borderRadius: "10px"
            }}></div>

            {paginatedAnalyses.map((analysis, index) => (
              <div
                key={analysis._id}
                style={{
                  marginLeft: "50px",
                  marginBottom: "2rem",
                  position: "relative",
                  animation: `slideIn 0.5s ease ${index * 0.1}s backwards`
                }}
              >
                {/* Timeline dot */}
                <div style={{
                  position: "absolute",
                  left: "-38px",
                  top: "20px",
                  width: "16px",
                  height: "16px",
                  background: "#ff6b35",
                  borderRadius: "50%",
                  border: "3px solid white",
                  boxShadow: "0 0 0 3px #ff6b35"
                }}></div>

                <div
                  className="feature-card"
                  style={{
                    padding: "1.5rem",
                    transform: selectedAnalysis?._id === analysis._id ? "scale(1.02)" : "scale(1)",
                    transition: "all 0.3s ease"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "1rem" }}>
                    <div onClick={() => setSelectedAnalysis(
                      selectedAnalysis?._id === analysis._id ? null : analysis
                    )}>
                      <p style={{ fontSize: "0.85rem", color: "#999", marginBottom: "0.3rem" }}>
                        📅 {formatDate(analysis.timestamp)}
                      </p>
                      <p style={{ fontSize: "0.9rem", color: "#666" }}>
                        📁 {analysis.image_name}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Tooltip text={analysis.is_favorite ? "Elimină din favorite" : "Adaugă la favorite"} position="left">
                        <button
                          onClick={(e) => toggleFavorite(analysis._id, e)}
                          style={{
                            background: "none",
                            border: "none",
                            fontSize: "1.5rem",
                            cursor: "pointer",
                            transition: "all 0.3s ease",
                            filter: analysis.is_favorite ? "none" : "grayscale(100%)",
                            opacity: analysis.is_favorite ? 1 : 0.4
                          }}
                          aria-label={analysis.is_favorite ? "Elimină din favorite" : "Adaugă la favorite"}
                          aria-pressed={analysis.is_favorite}
                          onMouseEnter={(e) => {
                            e.target.style.transform = "scale(1.3)";
                            e.target.style.filter = "none";
                            e.target.style.opacity = "1";
                          }}
                          onMouseLeave={(e) => {
                            e.target.style.transform = "scale(1)";
                            if (!analysis.is_favorite) {
                              e.target.style.filter = "grayscale(100%)";
                              e.target.style.opacity = "0.4";
                            }
                          }}
                        >
                          ⭐
                        </button>
                      </Tooltip>
                      <Tooltip text="Şterge analiza" position="left">
                        <button
                          className="delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(analysis);
                          }}
                          aria-label="Şterge analiza"
                          title="Șterge analiza"
                        >
                          🗑️
                        </button>
                      </Tooltip>
                      <span style={{
                        background: "linear-gradient(135deg, #ff6b35, #ff8c42)",
                        color: "white",
                        padding: "0.3rem 0.8rem",
                        borderRadius: "20px",
                        fontSize: "0.85rem",
                        fontWeight: "600"
                      }}>
                        {analysis.ingredients.length} ingrediente
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <p style={{ fontSize: "0.9rem", fontWeight: "600", color: "#333", marginBottom: "0.5rem" }}>
                      🥗 Ingrediente detectate:
                    </p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                      {analysis.ingredients.map((ing, i) => (
                        <span
                          key={i}
                          style={{
                            background: "#f5f5f5",
                            padding: "0.4rem 0.8rem",
                            borderRadius: "15px",
                            fontSize: "0.85rem",
                            color: "#555"
                          }}
                        >
                          {ing}
                        </span>
                      ))}
                    </div>
                  </div>

                  {selectedAnalysis?._id === analysis._id && (
                    <div style={{
                      marginTop: "1.5rem",
                      paddingTop: "1.5rem",
                      borderTop: "2px solid #f0f0f0"
                    }}>
                      <p style={{ fontSize: "1rem", fontWeight: "600", color: "#333", marginBottom: "1rem" }}>
                        📊 Valori Nutriționale:
                      </p>
                      {renderNutritionBars(analysis.nutrition)}
                    </div>
                  )}

                  <p style={{
                    textAlign: "center",
                    marginTop: "1rem",
                    fontSize: "0.85rem",
                    color: "#999",
                    fontStyle: "italic"
                  }}>
                    {selectedAnalysis?._id === analysis._id 
                      ? "Click pentru a ascunde detaliile" 
                      : "Click pentru a vedea detaliile nutriționale"}
                  </p>
                </div>
              </div>
            ))}

            {filteredAnalyses.length > ITEMS_PER_PAGE && (
              <div style={{
                marginTop: "2rem",
                marginLeft: "50px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "1rem"
              }}>
                <button
                  className="btn btn-outline"
                  onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                  disabled={currentPage === 1}
                  aria-label="Pagina anterioară"
                >
                  ← Anterior
                </button>

                <span style={{ fontWeight: 600, color: "#666" }}>
                  Pagina {currentPage} din {totalPages}
                </span>

                <button
                  className="btn btn-outline"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Pagina următoare"
                >
                  Următor →
                </button>
              </div>
            )}
          </div>
        )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="ingredient-modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="delete-confirm-modal" onClick={(e) => e.stopPropagation()}>
            <div className="delete-icon">🗑️</div>
            <h3 style={{ fontSize: "1.5rem", margin: "1rem 0", color: "#2d3436" }}>
              Șterge Analiza?
            </h3>
            <p style={{ color: "#636e72", marginBottom: "1.5rem", lineHeight: "1.6" }}>
              Ești sigur că vrei să ștergi această analiză?<br/>
              <strong>{deleteConfirm.image_name}</strong><br/>
              Această acțiune nu poate fi anulată.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteConfirm(null)}
                style={{ minWidth: "120px" }}
              >
                Anulează
              </button>
              <button
                className="btn-delete-confirm"
                onClick={() => handleDelete(deleteConfirm._id)}
                style={{ minWidth: "120px" }}
              >
                Șterge
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Floating Action Button with Expandable Menu */}
      <div className="fab-container">
        {/* Menu Items (appear when expanded) */}
        <button
          className={`fab-menu-item fab-menu-item-1 ${showFabMenu ? 'show' : ''}`}
          onClick={toggleDarkMode}
          aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
          title={darkMode ? "Light Mode" : "Dark Mode"}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
        
        <button
          className={`fab-menu-item fab-menu-item-2 ${showFabMenu ? 'show' : ''}`}
          onClick={handleSettings}
          aria-label="Settings"
          title="Setări aplicație"
        >
          ⚙️
        </button>
        
        <button
          className={`fab-menu-item fab-menu-item-3 ${showFabMenu ? 'show' : ''}`}
          onClick={handleHelp}
          aria-label="Help & Support"
          title="Help & Support"
        >
          ❓
        </button>
        
        <button
          className={`fab-menu-item fab-menu-item-4 ${showFabMenu ? 'show' : ''}`}
          onClick={() => setShowShortcuts(true)}
          aria-label="Keyboard Shortcuts"
          title="Keyboard Shortcuts (apasă ?)"
        >
          ⌨️
        </button>
        
        {/* Main FAB Button */}
        <button
          className={`fab-main ${showFabMenu ? 'active' : ''}`}
          onClick={() => setShowFabMenu(!showFabMenu)}
          aria-label="Menu"
          aria-expanded={showFabMenu}
          title="Meniu acțiuni rapide"
        >
          <span className="fab-icon">{showFabMenu ? '×' : '+'}</span>
        </button>
      </div>
      
      {/* Keyboard Shortcuts Help Modal */}
      {showShortcuts && (
        <ShortcutsHelp 
          onClose={() => setShowShortcuts(false)}
          customShortcuts={{
            'f': { description: 'Focus căutare', action: 'focus-search' },
            's': { description: 'Mergi la Istoric (acum)', action: 'navigate-history' }
          }}
        />
      )}
      </main>
    </div>
  );
}
