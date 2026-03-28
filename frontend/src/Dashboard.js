import { useState, useEffect } from "react";
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import "./App.css";
import { InfoIcon } from "./components/Tooltip";
import { StatCardSkeleton, ChartSkeleton } from "./components/SkeletonLoader";
import "./utils/errorMessages.css";
import { useKeyboardShortcuts, ShortcutsHelp } from "./utils/keyboardShortcuts";
import "./utils/keyboardShortcuts.css";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

export default function Dashboard({ userEmail, onBack, onLogout, onNavigate, darkMode, toggleDarkMode, handleSettings, handleHelp }) {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState(7); // 7 or 30 days
  const [streak, setStreak] = useState(null);
  const [goals, setGoals] = useState(null);
  const [showNavDropdown, setShowNavDropdown] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [navDropdownTimeout, setNavDropdownTimeout] = useState(null);
  const [userDropdownTimeout, setUserDropdownTimeout] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [userFriendlyError, setUserFriendlyError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  // Keyboard shortcuts - Nielsen Heuristic #7
  useKeyboardShortcuts({
    'h': () => onBack(),
    's': () => onNavigate('history'),
    't': () => toggleDarkMode(),
    '?': () => setShowShortcuts(true),
    'Escape': () => {
      if (showShortcuts) setShowShortcuts(false);
    }
  });

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

  useEffect(() => {
    fetchAnalyses();
    fetchStreak();
    fetchGoals();
    fetchUnreadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAnalyses = async () => {
    try {
      const res = await fetch(`http://localhost:8000/analysis_history/${userEmail}`);
      const data = await res.json();
      if (data.status === "success") {
        setAnalyses(data.analyses);
      } else {
        setError("Nu am putut încărca datele");
      }
    } catch (err) {
      setError("Eroare la încărcarea datelor");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStreak = async () => {
    try {
      const res = await fetch(`http://localhost:8000/streak/${userEmail}`);
      const data = await res.json();
      if (data.status === "success") {
        setStreak(data);
      }
    } catch (err) {
      console.error("Error fetching streak:", err);
    }
  };

  const fetchGoals = async () => {
    try {
      const res = await fetch(`http://localhost:8001/user_goals/${userEmail}`);
      const data = await res.json();
      if (data.status === "success") {
        setGoals(data.goals);
      }
    } catch (err) {
      console.error("Error fetching goals:", err);
    }
  };

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

  // Calculează statistici
  const getStats = () => {
    const now = new Date();
    const cutoffDate = new Date(now);
    cutoffDate.setDate(cutoffDate.getDate() - timeRange);

    const recentAnalyses = analyses.filter(a => 
      new Date(a.timestamp) >= cutoffDate
    );

    // Total calorii
    const totalCalories = recentAnalyses.reduce((sum, a) => {
      return sum + (a.nutrition?.total_nutrition?.calories || 0);
    }, 0);

    // Top ingrediente
    const ingredientCount = {};
    recentAnalyses.forEach(a => {
      a.ingredients.forEach(ing => {
        ingredientCount[ing] = (ingredientCount[ing] || 0) + 1;
      });
    });
    const topIngredients = Object.entries(ingredientCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    // Evoluție zilnică
    const dailyData = {};
    for (let i = 0; i < timeRange; i++) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().slice(0, 10);
      dailyData[dateStr] = { calories: 0, count: 0 };
    }

    recentAnalyses.forEach(a => {
      const dateStr = new Date(a.timestamp).toISOString().slice(0, 10);
      if (dailyData[dateStr]) {
        dailyData[dateStr].calories += (a.nutrition?.total_nutrition?.calories || 0);
        dailyData[dateStr].count += 1;
      }
    });

    return {
      totalAnalyses: recentAnalyses.length,
      totalCalories,
      avgCalories: recentAnalyses.length > 0 ? Math.round(totalCalories / recentAnalyses.length) : 0,
      topIngredients,
      dailyData: Object.entries(dailyData)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, data]) => ({ date, ...data }))
    };
  };

  const stats = getStats();

  // Calculează progresul zilnic vs obiective
  const getTodayProgress = () => {
    const today = new Date().toISOString().slice(0, 10);
    const todaysAnalyses = analyses.filter(a => 
      new Date(a.timestamp).toISOString().slice(0, 10) === today
    );

    let calories = 0, protein = 0, carbs = 0, fat = 0;
    todaysAnalyses.forEach(a => {
      const nutrition = a.nutrition?.total_nutrition;
      if (nutrition) {
        calories += nutrition.calories || 0;
        protein += nutrition.protein || 0;
        carbs += nutrition.carbohydrates || 0;
        fat += nutrition.fat || 0;
      }
    });

    return { calories, protein, carbs, fat, count: todaysAnalyses.length };
  };

  const todayProgress = getTodayProgress();

  // Pregătire date grafice
  const lineChartData = {
    labels: stats.dailyData.map(d => {
      const date = new Date(d.date);
      return `${date.getDate()}/${date.getMonth() + 1}`;
    }),
    datasets: [{
      label: 'Calorii Zilnice',
      data: stats.dailyData.map(d => d.calories),
      borderColor: 'rgba(255, 107, 53, 1)',
      backgroundColor: 'rgba(255, 107, 53, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  const barChartData = {
    labels: stats.topIngredients.map(([ing]) => ing.charAt(0).toUpperCase() + ing.slice(1)),
    datasets: [{
      label: 'Frecvență',
      data: stats.topIngredients.map(([, count]) => count),
      backgroundColor: [
        'rgba(255, 107, 53, 0.8)',
        'rgba(76, 175, 80, 0.8)',
        'rgba(33, 150, 243, 0.8)',
        'rgba(255, 193, 7, 0.8)',
        'rgba(156, 39, 176, 0.8)'
      ],
      borderColor: [
        'rgba(255, 107, 53, 1)',
        'rgba(76, 175, 80, 1)',
        'rgba(33, 150, 243, 1)',
        'rgba(255, 193, 7, 1)',
        'rgba(156, 39, 176, 1)'
      ],
      borderWidth: 2
    }]
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
                      style={{ fontWeight: "600" }}
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
      <main id="main-content" style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "2.5rem", fontWeight: "700", color: "#ff6b35", marginBottom: "0.5rem" }}>
            📈 Dashboard Statistici
          </h2>
          <p style={{ color: "#666", fontSize: "1rem" }}>
            Analiza activității tale nutriționale
          </p>
        </div>

        {/* Time Range Selector */}
        <div style={{ 
          display: "flex", 
          justifyContent: "center", 
          gap: "1rem", 
          marginBottom: "2rem" 
        }}>
          <button
            className={`btn ${timeRange === 7 ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setTimeRange(7)}
          >
            Ultimele 7 zile
          </button>
          <button
            className={`btn ${timeRange === 30 ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setTimeRange(30)}
          >
            Ultimele 30 zile
          </button>
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
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "1.5rem"
            }}>
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
              <StatCardSkeleton />
            </div>
            <ChartSkeleton height="320px" />
            <ChartSkeleton height="320px" />
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
                  onClick={() => {
                    fetchAnalyses();
                    fetchStreak();
                    fetchGoals();
                  }}
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

        {!loading && !error && (
          <>
            {/* Stat Cards */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
              gap: "1.5rem",
              marginBottom: "2rem"
            }}>
              <div className="feature-card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📊</div>
                <div style={{ fontSize: "2rem", fontWeight: "700", color: "#ff6b35" }}>
                  {stats.totalAnalyses}
                </div>
                <div style={{ color: "#666", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                  Total Analize
                  <InfoIcon text={`Numărul total de analize efectuate în ultimele ${timeRange} zile`} />
                </div>
              </div>

              <div className="feature-card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🔥</div>
                <div style={{ fontSize: "2rem", fontWeight: "700", color: "#ff6b35" }}>
                  {stats.totalCalories.toLocaleString()}
                </div>
                <div style={{ color: "#666", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                  Total Calorii (kcal)
                  <InfoIcon text="Suma totală a caloriilor din toate analizele tale" />
                </div>
              </div>

              <div className="feature-card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📉</div>
                <div style={{ fontSize: "2rem", fontWeight: "700", color: "#ff6b35" }}>
                  {stats.avgCalories}
                </div>
                <div style={{ color: "#666", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                  Medie Calorii/Analiză
                  <InfoIcon text="Media caloriilor per masă analizată - util pentru tracking zilnic" />
                </div>
              </div>

              <div className="feature-card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🥗</div>
                <div style={{ fontSize: "2rem", fontWeight: "700", color: "#ff6b35" }}>
                  {stats.topIngredients.length > 0 ? stats.topIngredients[0][0] : 'N/A'}
                </div>
                <div style={{ color: "#666", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                  Top Ingredient
                  <InfoIcon text="Ingredientul cel mai frecvent din analizele tale" />
                </div>
              </div>

              <div className="feature-card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🔥</div>
                <div style={{ fontSize: "2rem", fontWeight: "700", color: "#ff6b35" }}>
                  {streak ? streak.current_streak : 0}
                </div>
                <div style={{ color: "#666", fontSize: "0.9rem" }}>Streak Actual (zile)</div>
              </div>

              <div className="feature-card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🏆</div>
                <div style={{ fontSize: "2rem", fontWeight: "700", color: "#ff6b35" }}>
                  {streak ? streak.longest_streak : 0}
                </div>
                <div style={{ color: "#666", fontSize: "0.9rem" }}>Record Streak</div>
              </div>
            </div>

            {/* Daily Progress vs Goals */}
            {goals && (
              <div className="nutrition-box" style={{ 
                padding: "1.5rem",
                marginBottom: "2rem"
              }}>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "#333", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>🎯 Progres Zilnic ({todayProgress.count} analize astăzi)</span>
                  <button 
                    onClick={() => onNavigate("goals")}
                    style={{
                      background: "linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%)",
                      color: "white",
                      border: "none",
                      padding: "0.5rem 1rem",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "0.9rem",
                      fontWeight: "600"
                    }}
                  >
                    ⚙️ Setări Obiective
                  </button>
                </h3>

                <div style={{ display: "grid", gap: "1rem" }}>
                  {/* Calories */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                      <span>🔥 Calorii</span>
                      <span style={{ fontWeight: "600" }}>
                        {Math.round(todayProgress.calories)} / {goals.target_calories} kcal
                      </span>
                    </div>
                    <div style={{
                      width: "100%",
                      height: "24px",
                      background: "#eee",
                      borderRadius: "12px",
                      overflow: "hidden",
                      position: "relative"
                    }}>
                      <div style={{
                        width: `${Math.min((todayProgress.calories / goals.target_calories) * 100, 100)}%`,
                        height: "100%",
                        background: todayProgress.calories > goals.target_calories 
                          ? "linear-gradient(90deg, #ff6b6b, #ee5a6f)" 
                          : "linear-gradient(90deg, #51cf66, #37b24d)",
                        transition: "width 0.3s ease"
                      }}></div>
                      <span style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        color: todayProgress.calories > goals.target_calories * 0.3 ? "white" : "#333"
                      }}>
                        {Math.round((todayProgress.calories / goals.target_calories) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Protein */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                      <span>🍗 Proteine</span>
                      <span style={{ fontWeight: "600" }}>
                        {Math.round(todayProgress.protein)}g / {goals.target_protein}g
                      </span>
                    </div>
                    <div style={{
                      width: "100%",
                      height: "24px",
                      background: "#eee",
                      borderRadius: "12px",
                      overflow: "hidden",
                      position: "relative"
                    }}>
                      <div style={{
                        width: `${Math.min((todayProgress.protein / goals.target_protein) * 100, 100)}%`,
                        height: "100%",
                        background: todayProgress.protein > goals.target_protein 
                          ? "linear-gradient(90deg, #ff6b6b, #ee5a6f)" 
                          : "linear-gradient(90deg, #4dabf7, #339af0)",
                        transition: "width 0.3s ease"
                      }}></div>
                      <span style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        color: todayProgress.protein > goals.target_protein * 0.3 ? "white" : "#333"
                      }}>
                        {Math.round((todayProgress.protein / goals.target_protein) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Carbs */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                      <span>🍞 Carbohidrați</span>
                      <span style={{ fontWeight: "600" }}>
                        {Math.round(todayProgress.carbs)}g / {goals.target_carbs}g
                      </span>
                    </div>
                    <div style={{
                      width: "100%",
                      height: "24px",
                      background: "#eee",
                      borderRadius: "12px",
                      overflow: "hidden",
                      position: "relative"
                    }}>
                      <div style={{
                        width: `${Math.min((todayProgress.carbs / goals.target_carbs) * 100, 100)}%`,
                        height: "100%",
                        background: todayProgress.carbs > goals.target_carbs 
                          ? "linear-gradient(90deg, #ff6b6b, #ee5a6f)" 
                          : "linear-gradient(90deg, #ffd43b, #fab005)",
                        transition: "width 0.3s ease"
                      }}></div>
                      <span style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        color: todayProgress.carbs > goals.target_carbs * 0.3 ? "white" : "#333"
                      }}>
                        {Math.round((todayProgress.carbs / goals.target_carbs) * 100)}%
                      </span>
                    </div>
                  </div>

                  {/* Fat */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                      <span>🥑 Grăsimi</span>
                      <span style={{ fontWeight: "600" }}>
                        {Math.round(todayProgress.fat)}g / {goals.target_fat}g
                      </span>
                    </div>
                    <div style={{
                      width: "100%",
                      height: "24px",
                      background: "#eee",
                      borderRadius: "12px",
                      overflow: "hidden",
                      position: "relative"
                    }}>
                      <div style={{
                        width: `${Math.min((todayProgress.fat / goals.target_fat) * 100, 100)}%`,
                        height: "100%",
                        background: todayProgress.fat > goals.target_fat 
                          ? "linear-gradient(90deg, #ff6b6b, #ee5a6f)" 
                          : "linear-gradient(90deg, #ff8787, #fa5252)",
                        transition: "width 0.3s ease"
                      }}></div>
                      <span style={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        fontSize: "0.75rem",
                        fontWeight: "600",
                        color: todayProgress.fat > goals.target_fat * 0.3 ? "white" : "#333"
                      }}>
                        {Math.round((todayProgress.fat / goals.target_fat) * 100)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Charts Grid */}
            <div style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))", 
              gap: "2rem" 
            }}>
              {/* Line Chart - Evoluție Calorii */}
              <div className="nutrition-box" style={{ padding: "1.5rem" }}>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "#333" }}>
                  📈 Evoluție Calorii Zilnice
                </h3>
                <Line 
                  data={lineChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: true,
                    plugins: {
                      legend: {
                        display: false
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        title: {
                          display: true,
                          text: 'Calorii (kcal)'
                        }
                      }
                    }
                  }}
                />
              </div>

              {/* Bar Chart - Top Ingrediente */}
              <div className="nutrition-box" style={{ padding: "1.5rem" }}>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "#333" }}>
                  🏆 Top 5 Ingrediente Detectate
                </h3>
                {stats.topIngredients.length > 0 ? (
                  <Bar 
                    data={barChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: true,
                      plugins: {
                        legend: {
                          display: false
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            stepSize: 1
                          },
                          title: {
                            display: true,
                            text: 'Număr apariții'
                          }
                        }
                      }
                    }}
                  />
                ) : (
                  <p style={{ textAlign: "center", color: "#999", padding: "2rem" }}>
                    Nu există date pentru perioada selectată
                  </p>
                )}
              </div>
            </div>

            {/* Activity Overview */}
            <div className="nutrition-box" style={{ padding: "2rem", marginTop: "2rem" }}>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "1.5rem", color: "#ff6b35" }}>
                📅 Activitate Zilnică
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {stats.dailyData.reverse().map((day, idx) => {
                  const intensity = day.count > 0 ? Math.min(day.count / 3, 1) : 0;
                  const color = day.count > 0 
                    ? `rgba(255, 107, 53, ${0.2 + intensity * 0.8})`
                    : '#f0f0f0';
                  
                  return (
                    <div
                      key={idx}
                      title={`${day.date}: ${day.count} analize, ${day.calories} kcal`}
                      style={{
                        width: "30px",
                        height: "30px",
                        backgroundColor: color,
                        borderRadius: "5px",
                        border: "1px solid #ddd",
                        cursor: "pointer"
                      }}
                    ></div>
                  );
                })}
              </div>
              <p style={{ marginTop: "1rem", fontSize: "0.85rem", color: "#666" }}>
                Fiecare pătrat reprezintă o zi. Culoarea mai intensă = mai multe analize.
              </p>
            </div>
          </>
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
            'd': { description: 'Mergi la Dashboard (acum)', action: 'navigate-dashboard' }
          }}
        />
      )}
      </main>
    </div>
  );
}
