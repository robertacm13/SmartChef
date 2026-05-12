import { useState, useEffect, useCallback } from "react";
import "./App.css";
import Tooltip, { InfoIcon } from "./components/Tooltip";
import { getUserFriendlyError } from "./utils/errorMessages";
import "./utils/errorMessages.css";
import { useKeyboardShortcuts, ShortcutsHelp } from "./utils/keyboardShortcuts";
import "./utils/keyboardShortcuts.css";
import { AnalysisCardSkeleton } from "./components/SkeletonLoader";
import logoImg from "./logo.png";
import Navbar from "./components/Navbar";
import { MdOutlineKeyboardArrowUp, MdOutlineKeyboardArrowDown } from "react-icons/md";

export default function History({ userEmail, onBack, onLogout, onNavigate, darkMode, toggleDarkMode, handleSettings, handleHelp }) {
  const ITEMS_PER_PAGE = 20;
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAnalysis, setSelectedAnalysis] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  // Filtre și căutare
  const [searchQuery, setSearchQuery] = useState("");
  const [ingredientFilter, setIngredientFilter] = useState("all"); // all, 1-3, 4-6, 7+
  const [sortBy, setSortBy] = useState("date-desc"); // date-desc, date-asc, calories-desc, calories-asc
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [userFriendlyError, setUserFriendlyError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showScroll, setShowScroll] = useState(false);

  // Keyboard shortcuts - Nielsen Heuristic #7
  useKeyboardShortcuts({
    'h': () => onBack(),
    'd': () => onNavigate('dashboard'),
    't': () => toggleDarkMode(),
    'f': () => document.querySelector('.search-input')?.focus(),
    '?': () => setShowShortcuts(true),
    'Escape': () => {
      if (showShortcuts) setShowShortcuts(false);
      if (selectedAnalysis) setSelectedAnalysis(null);
      else if (deleteConfirm) setDeleteConfirm(null);
    }
  });

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:8000/analysis_history/${userEmail}`);
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
  }, [userEmail]);

  useEffect(() => {
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

    fetchHistory();
    fetchUnreadNotifications();
  }, [userEmail, fetchHistory]);

  // Scroll event listener for showing scroll buttons
  useEffect(() => {
    const updateScrollVisibility = () => {
      const isScrollable = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - window.innerHeight > 100;
      setShowScroll(isScrollable);
    };

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
  }, [loading, analyses, currentPage]);

  const toggleFavorite = async (analysisId, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`http://localhost:8000/analysis/${analysisId}/favorite`, {
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
        const friendlyError = getUserFriendlyError(data.error || "Error updating favorite");
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
      const res = await fetch(`http://localhost:8000/analysis/${analysisId}`, {
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
        alert("Error deleting: " + data.detail);
      }
    } catch (err) {
      alert("Error deleting analysis");
      console.error(err);
    }
  };

  const formatDate = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
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

    // Filter by number of ingredients
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
            <span style={{ fontSize: "0.9rem", color: "#666" }}>🔥 Calories</span>
            <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#3B82F6" }}>
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
              background: "linear-gradient(90deg, #3B82F6, #2563EB)",
              transition: "width 0.5s ease"
            }}></div>
          </div>
        </div>

        <div style={{ marginBottom: "0.8rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
            <span style={{ fontSize: "0.9rem", color: "#666" }}>💪 Protein</span>
            <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#3B82F6" }}>
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
              background: "linear-gradient(90deg, #3B82F6, #60A5FA)",
              transition: "width 0.5s ease"
            }}></div>
          </div>
        </div>

        <div style={{ marginBottom: "0.8rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
            <span style={{ fontSize: "0.9rem", color: "#666" }}>🍞 Carbohydrates</span>
            <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#3B82F6" }}>
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
              background: "linear-gradient(90deg, #3B82F6, #60A5FA)",
              transition: "width 0.5s ease"
            }}></div>
          </div>
        </div>

        <div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" }}>
            <span style={{ fontSize: "0.9rem", color: "#666" }}>🥑 Fat</span>
            <span style={{ fontSize: "0.9rem", fontWeight: "600", color: "#3B82F6" }}>
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
              background: "linear-gradient(90deg, #3B82F6, #60A5FA)",
              transition: "width 0.5s ease"
            }}></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ minHeight: "100vh", background: darkMode ? "#0F172A" : "var(--bg, #F1F5F9)", color: darkMode ? "#E2E8F0" : "#1E293B", paddingBottom: "2rem" }}>
      <Navbar 
        userEmail={userEmail}
        onBack={onBack}
        onNavigate={onNavigate}
        onLogout={onLogout}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        handleHelp={handleHelp}
        currentPage="history"
      />

      {/* Skip Link pentru keyboard navigation - WCAG 2.1 */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      {/* Main Content Area - Accessible landmark */}
      <main id="main-content" style={{ maxWidth: "1000px", margin: "0 auto", padding: "6rem 2rem 2rem 2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "2.5rem", fontWeight: "700", color: "#3B82F6", marginBottom: "0.5rem" }}>
            📊 Analysis History
          </h2>
          <p style={{ color: "#666", fontSize: "1rem" }}>
            All your food analyses
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
              placeholder="🔍 Search by filename or ingredient..."
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
              aria-label="Search analyses"
            />
            <InfoIcon text="Search by filename or any ingredient. Shortcut: F key" />
          </div>

          {/* Filtre */}
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ flex: "1", minWidth: "200px" }}>
              <label style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.3rem", display: "flex", alignItems: "center" }}>
                📏 Number of Ingredients:
                <InfoIcon text="Filter analyses by number of detected ingredients" />
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
                <option value="all">All</option>
                <option value="1-3">1-3 ingredients</option>
                <option value="4-6">4-6 ingredients</option>
                <option value="7+">7+ ingredients</option>
              </select>
            </div>

            <div style={{ flex: "1", minWidth: "200px" }}>
              <label style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.3rem", display: "flex", alignItems: "center" }}>
                ⭐ Favorites:
                <InfoIcon text="Show only analyses marked as favorites" />
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
                {favoritesOnly ? "✅ Favorites only" : "All analyses"}
              </button>
            </div>

            <div style={{ flex: "1", minWidth: "200px" }}>
              <label style={{ fontSize: "0.9rem", color: "#666", marginBottom: "0.3rem", display: "flex", alignItems: "center" }}>
                🔄 Sort:
                <InfoIcon text="Sort results by various criteria" />
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
                <option value="date-desc">Date (newest)</option>
                <option value="date-asc">Date (oldest)</option>
                <option value="calories-desc">Calories (high-low)</option>
                <option value="calories-asc">Calories (low-high)</option>
                <option value="ingredients-desc">Ingredients count (↓)</option>
                <option value="ingredients-asc">Ingredients count (↑)</option>
              </select>
            </div>
          </div>

          {/* Counter rezultate */}
          <div style={{ marginTop: "1rem", textAlign: "center", color: "#666", fontSize: "0.9rem" }}>
            {filteredAnalyses.length} {filteredAnalyses.length === 1 ? 'result found' : 'results found'}
          </div>
        </div>

        <button
          className="btn btn-secondary"
          onClick={onBack}
          style={{ marginBottom: "2rem" }}
        >
          ← Back
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
                  Close
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
                ? "You don't have any analyses yet. Upload your first image!"
                : "No results found for the applied filters."}
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
              background: "linear-gradient(180deg, #3B82F6, #2563EB)",
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
                  background: "#3B82F6",
                  borderRadius: "50%",
                  border: "3px solid white",
                  boxShadow: "0 0 0 3px #3B82F6"
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
                    <div style={{ display: "flex", gap: "1rem", alignItems: "flex-start", flex: 1 }} onClick={() => setSelectedAnalysis(
                      selectedAnalysis?._id === analysis._id ? null : analysis
                    )}>
                      {/* Thumbnail Image */}
                      {analysis.image_thumbnail && (
                        <img
                          src={analysis.image_thumbnail}
                          alt="Food thumbnail"
                          style={{
                            width: "120px",
                            height: "120px",
                            borderRadius: "10px",
                            objectFit: "cover",
                            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
                            flexShrink: 0,
                            cursor: "pointer"
                          }}
                        />
                      )}
                      
                      {/* Text Info */}
                      <div>
                        <p style={{ fontSize: "0.85rem", color: "#999", marginBottom: "0.3rem" }}>
                          📅 {formatDate(analysis.timestamp)}
                        </p>
                        <p style={{ fontSize: "0.9rem", color: "#666" }}>
                          📁 {analysis.image_name}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <Tooltip text={analysis.is_favorite ? "Remove from favorites" : "Add to favorites"} position="left">
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
                          aria-label={analysis.is_favorite ? "Remove from favorites" : "Add to favorites"}
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
                      <Tooltip text="Delete analysis" position="left">
                        <button
                          className="delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirm(analysis);
                          }}
                          aria-label="Delete analysis"
                          title="Delete analysis"
                        >
                          🗑️
                        </button>
                      </Tooltip>
                      <span style={{
                        background: "linear-gradient(135deg, #3B82F6, #2563EB)",
                        color: "white",
                        padding: "0.3rem 0.8rem",
                        borderRadius: "20px",
                        fontSize: "0.85rem",
                        fontWeight: "600"
                      }}>
                        {analysis.ingredients.length} ingredients
                      </span>
                    </div>
                  </div>

                  <div style={{ marginBottom: "1rem" }}>
                    <p style={{ fontSize: "0.9rem", fontWeight: "600", color: "#333", marginBottom: "0.5rem" }}>
                      🥗 Detected Ingredients:
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
                        📊 Nutritional Values:
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
                      ? "Click to hide details" 
                      : "Click to see nutritional details"}
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
                  aria-label="Previous page"
                >
                  ← Previous
                </button>

                <span style={{ fontWeight: 600, color: "#666" }}>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  className="btn btn-outline"
                  onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                  disabled={currentPage === totalPages}
                  aria-label="Next page"
                >
                  Next →
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
              Delete Analysis?
            </h3>
            <p style={{ color: "#636e72", marginBottom: "1.5rem", lineHeight: "1.6" }}>
              Are you sure you want to delete this analysis?<br/>
              <strong>{deleteConfirm.image_name}</strong><br/>
              This action cannot be undone.
            </p>
            <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
              <button
                className="btn btn-secondary"
                onClick={() => setDeleteConfirm(null)}
                style={{ minWidth: "120px" }}
              >
                Cancel
              </button>
              <button
                className="btn-delete-confirm"
                onClick={() => handleDelete(deleteConfirm._id)}
                style={{ minWidth: "120px" }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      

      
      {/* Keyboard Shortcuts Help Modal */}
      {showShortcuts && (
        <ShortcutsHelp 
          onClose={() => setShowShortcuts(false)}
          customShortcuts={{
            'f': { description: 'Focus search', action: 'focus-search' },
            's': { description: 'Go to History (current)', action: 'navigate-history' }
          }}
        />
      )}

      {showScroll && (
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
            zIndex: 1100
          }}
        >
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
      </main>
    </div>
  );
}







