import { useState, useEffect, useCallback } from "react";
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
import logoImg from "./logo.png";
import Navbar from "./components/Navbar";

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
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [userFriendlyError, setUserFriendlyError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [suggestions, setSuggestions] = useState([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [craving, setCraving] = useState("");
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [waterIntake, setWaterIntake] = useState(0.0);
  const [vitaminAdvice, setVitaminAdvice] = useState("Loading advice...");
  const [groceryList, setGroceryList] = useState(() => {
    const saved = localStorage.getItem("groceryList");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("groceryList", JSON.stringify(groceryList));
  }, [groceryList]);

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

  const fetchAnalyses = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:8000/analysis_history/${userEmail}`);
      const data = await res.json();
      if (data.status === "success") {
        setAnalyses(data.analyses);
      } else {
        setError("Could not load data");
      }
    } catch (err) {
      setError("Error loading data");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  const fetchStreak = useCallback(async () => {
    try {
      const now = new Date();
      const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      const tz_offset = now.getTimezoneOffset();
      const res = await fetch(`http://localhost:8000/streak/${userEmail}?date=${date}&tz_offset=${tz_offset}`);
      const data = await res.json();
      if (data.status === "success") {
        setStreak(data);
      }
    } catch (err) {
      console.error("Error fetching streak:", err);
    }
  }, [userEmail]);

  const fetchGoals = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:8000/user_goals/${userEmail}`);
      const data = await res.json();
      if (data.status === "success") {
        setGoals(data.goals);
      }
    } catch (err) {
      console.error("Error fetching goals:", err);
    }
  }, [userEmail]);

  const fetchWaterIntake = useCallback(async () => {
    try {
      const now = new Date();
      const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      const res = await fetch(`http://localhost:8000/get_water_intake/${userEmail}?date=${date}`);
      const data = await res.json();
      if (data.status === "success") {
        setWaterIntake(data.total);
      }
    } catch (err) {
      console.error("Error fetching water intake:", err);
    }
  }, [userEmail]);

  const fetchVitaminAdvice = useCallback(async () => {
    try {
      const now = new Date();
      const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      const tz_offset = now.getTimezoneOffset();
      const res = await fetch(`http://localhost:8000/vitamin_advice/${userEmail}?date=${date}&tz_offset=${tz_offset}`);
      const data = await res.json();
      if (data.status === "success") {
        setVitaminAdvice(data.advice);
      }
    } catch (err) {
      console.error("Error fetching vitamin advice:", err);
    }
  }, [userEmail]);

  const fetchSuggestions = useCallback(async () => {
    setLoadingSuggestions(true);
    try {
      const now = new Date();
      const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      const tz_offset = now.getTimezoneOffset();
      const res = await fetch(`http://localhost:8000/suggest_meals/${userEmail}?date=${date}&tz_offset=${tz_offset}`);
      const data = await res.json();
      if (data.status === "success") {
        setSuggestions(data.suggestions);
      }
    } catch (err) {
      console.error("Error fetching suggestions:", err);
    } finally {
      setLoadingSuggestions(false);
    }
  }, [userEmail]);

  const handleFindRestaurants = async () => {
    try {
      const now = new Date();
      const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
      const tz_offset = now.getTimezoneOffset();
      const res = await fetch(`http://localhost:8000/get_restaurant_query/${userEmail}?date=${date}&tz_offset=${tz_offset}`);
      const data = await res.json();
      if (data.status === "success") {
        const query = encodeURIComponent(data.query);
        window.open(`https://www.google.com/maps/search/${query}+nearby`, '_blank');
      } else {
        window.open(`https://www.google.com/maps/search/healthy+restaurants+nearby`, '_blank');
      }
    } catch (err) {
      console.error("Error getting restaurant query:", err);
      window.open(`https://www.google.com/maps/search/healthy+restaurants+nearby`, '_blank');
    }
  };

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

    fetchAnalyses();
    fetchStreak();
    fetchGoals();
    fetchWaterIntake();
    fetchVitaminAdvice();
    fetchUnreadNotifications();
    fetchSuggestions();
  }, [userEmail, fetchAnalyses, fetchStreak, fetchGoals, fetchSuggestions]);

  // Schedule a one-time refresh at the user's next local midnight to update "today" counters
  useEffect(() => {
    let timeoutId;
    const scheduleMidnightRefresh = () => {
      const now = new Date();
      const next = new Date(now);
      next.setDate(now.getDate() + 1);
      next.setHours(0, 0, 0, 0);
      let ms = next - now;
      if (ms < 0) ms = 0;

      timeoutId = setTimeout(async () => {
        if (userEmail) {
          try {
            await Promise.all([
              fetchAnalyses(),
              fetchStreak(),
              fetchGoals(),
              fetchWaterIntake(),
              fetchVitaminAdvice(),
              fetchSuggestions()
            ]);
          } catch (err) {
            console.error('Error refreshing daily data at midnight:', err);
          }
        }
        // schedule next midnight
        scheduleMidnightRefresh();
      }, ms);
    };

    scheduleMidnightRefresh();
    return () => clearTimeout(timeoutId);
  }, [userEmail, fetchAnalyses, fetchStreak, fetchGoals, fetchWaterIntake, fetchVitaminAdvice, fetchSuggestions]);

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

    // Top ingredients
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
      label: 'Daily Calories',
      data: stats.dailyData.map(d => d.calories),
      borderColor: 'rgba(59, 130, 246, 1)',
      backgroundColor: 'rgba(59, 130, 246, 0.1)',
      tension: 0.4,
      fill: true
    }]
  };

  const barChartData = {
    labels: stats.topIngredients.map(([ing]) => ing.charAt(0).toUpperCase() + ing.slice(1)),
    datasets: [{
      label: 'Frequency',
      data: stats.topIngredients.map(([, count]) => count),
      backgroundColor: [
        'rgba(59, 130, 246, 0.8)',
        'rgba(96, 165, 250, 0.8)',
        'rgba(147, 197, 253, 0.8)',
        'rgba(191, 219, 254, 0.8)',
        'rgba(39, 102, 194, 0.8)'
      ],
      borderColor: [
        'rgba(59, 130, 246, 1)',
        'rgba(96, 165, 250, 1)',
        'rgba(147, 197, 253, 1)',
        'rgba(191, 219, 254, 1)',
        'rgba(39, 102, 194, 1)'
      ],
      borderWidth: 2
    }]
  };

  return (
    <div style={{ minHeight: "100vh", background: darkMode ? "#0F172A" : "var(--bg, #F1F5F9)", color: darkMode ? "#E2E8F0" : "#1E293B", paddingBottom: "2rem" }}>
      {/* --- NAVBAR --- */}
      <Navbar 
        userEmail={userEmail}
        onBack={onBack}
        onNavigate={onNavigate}
        onLogout={onLogout}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        handleHelp={handleHelp}
        currentPage="dashboard"
      />

      {/* Skip Link pentru keyboard navigation - WCAG 2.1 */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Main Content Area - Accessible landmark */}
      <main id="main-content" style={{ maxWidth: "1200px", margin: "0 auto", padding: "6rem 2rem 2rem 2rem" }}>
        {/* Call-to-Action Section */}
        <div style={{
          background: "linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)",
          borderRadius: "16px",
          padding: "3rem 2rem",
          textAlign: "center",
          color: "white",
          marginBottom: "3rem",
          boxShadow: "0 10px 30px rgba(59, 130, 246, 0.2)"
        }}>
          <h3 style={{ fontSize: "2rem", fontWeight: "700", marginBottom: "0.75rem" }}>
            Ready to analyze your meal?
          </h3>
          <p style={{ fontSize: "1rem", marginBottom: "1.5rem", opacity: 0.95 }}>
            Upload an image and instantly discover nutritional values
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "1rem" }}>
            <button
              onClick={() => onNavigate('analyze-food')}
              style={{
                background: "white",
                color: "#3B82F6",
                border: "none",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.boxShadow = "0 6px 16px rgba(0, 0, 0, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.15)";
              }}
            >
              📸 Analyze Now
            </button>
            
            <button
              onClick={() => onNavigate('recipe-generator')}
              style={{
                background: "transparent",
                color: "white",
                border: "2px solid white",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                transition: "all 0.3s ease",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-2px)";
                e.target.style.background = "rgba(255, 255, 255, 0.1)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0)";
                e.target.style.background = "transparent";
              }}
            >
              🍳 Recipe Generator
            </button>
          </div>

        </div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "2.5rem", fontWeight: "700", color: "#3B82F6", marginBottom: "0.5rem" }}>
            📈 Dashboard Statistics
          </h2>
          <p style={{ color: "#666", fontSize: "1rem" }}>
            Analyze your nutritional activity
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
            style={{
              fontSize: "1.1rem",
              fontWeight: "700",
              letterSpacing: "0.5px"
            }}
          >
            Last 7 days
          </button>
          <button
            className={`btn ${timeRange === 30 ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setTimeRange(30)}
            style={{
              fontSize: "1.1rem",
              fontWeight: "700",
              letterSpacing: "0.5px"
            }}
          >
            Last 30 days
          </button>
        </div>



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

        {!loading && !error && analyses.length === 0 ? (
          <div style={{ textAlign: "center", padding: "4rem 2rem", background: darkMode ? "#1E293B" : "#FFFFFF", borderRadius: "16px", boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)", border: darkMode ? "1px solid #334155" : "1px solid #E2E8F0", marginTop: "2rem" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🍽️</div>
            <h3 style={{ fontSize: "1.5rem", fontWeight: "700", color: darkMode ? "#E2E8F0" : "#1E293B", marginBottom: "1rem" }}>
              You haven't made any analysis yet
            </h3>
            <p style={{ color: darkMode ? "#94A3B8" : "#64748B", marginBottom: "2rem" }}>
              Upload your first meal photo to get detailed nutritional insights and start tracking your goals.
            </p>
            <button
              onClick={() => onNavigate('analyze-food')}
              style={{
                background: "#3B82F6",
                color: "white",
                border: "none",
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                fontSize: "1rem",
                fontWeight: "600",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.3)",
                transition: "all 0.2s ease"
              }}
              onMouseOver={(e) => e.target.style.transform = "translateY(-2px)"}
              onMouseOut={(e) => e.target.style.transform = "translateY(0)"}
            >
              📸 Analyze Now
            </button>
          </div>
        ) : !loading && !error && (
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
                <div style={{ fontSize: "2rem", fontWeight: "700", color: "#3B82F6" }}>
                  {stats.totalAnalyses}
                </div>
                <div style={{ color: "#666", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                  Total Analyses
                  <InfoIcon text={`Total number of analyses performed in the last ${timeRange} days`} />
                </div>
              </div>

              <div className="feature-card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🔥</div>
                <div style={{ fontSize: "2rem", fontWeight: "700", color: "#3B82F6" }}>
                  {stats.totalCalories.toLocaleString()}
                </div>
                <div style={{ color: "#666", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                  Total Calories (kcal)
                  <InfoIcon text="Total sum of calories from all your analyses" />
                </div>
              </div>

              <div className="feature-card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📉</div>
                <div style={{ fontSize: "2rem", fontWeight: "700", color: "#3B82F6" }}>
                  {stats.avgCalories}
                </div>
                <div style={{ color: "#666", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                  Average Calories/Analysis
                  <InfoIcon text="Average calories per meal analyzed - useful for daily tracking" />
                </div>
              </div>

              <div className="feature-card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🥗</div>
                <div style={{ fontSize: "2rem", fontWeight: "700", color: "#3B82F6" }}>
                  {stats.topIngredients.length > 0 ? stats.topIngredients[0][0] : 'N/A'}
                </div>
                <div style={{ color: "#666", fontSize: "0.9rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                  Top Ingredient
                  <InfoIcon text="The most frequently appearing ingredient in your analyses" />
                </div>
              </div>

              <div className="feature-card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🔥</div>
                <div style={{ fontSize: "2rem", fontWeight: "700", color: "#3B82F6" }}>
                  {streak ? streak.current_streak : 0}
                </div>
                <div style={{ color: "#666", fontSize: "0.9rem" }}>Current Streak (days)</div>
              </div>

              <div className="feature-card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🏆</div>
                <div style={{ fontSize: "2rem", fontWeight: "700", color: "#3B82F6" }}>
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
                  <span>🎯 Daily Progress ({todayProgress.count} analyses today)</span>
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
                    ⚙️ Goal Settings
                  </button>
                </h3>

                <div style={{ display: "grid", gap: "1rem" }}>
                  {/* Calories */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                      <span>🔥 Calories</span>
                      <span style={{ fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {Math.round(todayProgress.calories)} / {goals.target_calories} kcal
                        {todayProgress.calories > goals.target_calories && (
                          <button 
                            onClick={() => {
                              setWarningMessage("You have exceeded your daily calorie limit! You should go for a walk or run to compensate.");
                              setShowWarningModal(true);
                            }}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", transition: "transform 0.2s" }}
                            title="Warning"
                            onMouseEnter={(e) => e.target.style.transform = "scale(1.3)"}
                            onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                          >
                            ⚠️
                          </button>
                        )}
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
                          ? "linear-gradient(90deg, #F87171, #ee5a6f)" 
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
                      <span>🍗 Protein</span>
                      <span style={{ fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {Math.round(todayProgress.protein)}g / {goals.target_protein}g
                        {todayProgress.protein > goals.target_protein && (
                          <button 
                            onClick={() => {
                              setWarningMessage("You have exceeded your daily protein limit! Excessive intake can strain kidneys. Drink more water to help flush the excess.");
                              setShowWarningModal(true);
                            }}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", transition: "transform 0.2s" }}
                            title="Warning"
                            onMouseEnter={(e) => e.target.style.transform = "scale(1.3)"}
                            onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                          >
                            ⚠️
                          </button>
                        )}
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
                          ? "linear-gradient(90deg, #F87171, #ee5a6f)" 
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
                      <span>🍞 Carbs</span>
                      <span style={{ fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {Math.round(todayProgress.carbs)}g / {goals.target_carbs}g
                        {todayProgress.carbs > goals.target_carbs && (
                          <button 
                            onClick={() => {
                              setWarningMessage("You have exceeded your daily carbohydrate limit! Try to do some exercise to burn the energy and avoid sweets for the rest of the day.");
                              setShowWarningModal(true);
                            }}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", transition: "transform 0.2s" }}
                            title="Warning"
                            onMouseEnter={(e) => e.target.style.transform = "scale(1.3)"}
                            onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                          >
                            ⚠️
                          </button>
                        )}
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
                          ? "linear-gradient(90deg, #F87171, #ee5a6f)" 
                          : "linear-gradient(90deg, #60A5FA, #60A5FA)",
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
                      <span>🥑 Fats</span>
                      <span style={{ fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        {Math.round(todayProgress.fat)}g / {goals.target_fat}g
                        {todayProgress.fat > goals.target_fat && (
                          <button 
                            onClick={() => {
                              setWarningMessage("You have exceeded your daily fat limit! Try to eat leaner foods for the next meals and do some cardio.");
                              setShowWarningModal(true);
                            }}
                            style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", transition: "transform 0.2s" }}
                            title="Warning"
                            onMouseEnter={(e) => e.target.style.transform = "scale(1.3)"}
                            onMouseLeave={(e) => e.target.style.transform = "scale(1)"}
                          >
                            ⚠️
                          </button>
                        )}
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
                          ? "linear-gradient(90deg, #F87171, #ee5a6f)" 
                          : "linear-gradient(90deg, #93C5FD, #3B82F6)",
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

                {/* Hydration & Supplements Card */}
                <div style={{ 
                  marginTop: "1.5rem", 
                  padding: "1rem", 
                  background: darkMode ? "#334155" : "#F8FAFC", 
                  borderRadius: "12px",
                  border: darkMode ? "1px solid #475569" : "1px solid #E2E8F0"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <h4 style={{ fontSize: "1rem", fontWeight: "600", color: darkMode ? "#E2E8F0" : "#1E293B" }}>
                      💧 Hydration & Supplements
                    </h4>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        onClick={async () => {
                          const now = new Date();
                          const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
                          const res = await fetch("http://localhost:8000/add_water_intake", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email: userEmail, amount: -0.5, date })
                          });
                          const data = await res.json();
                          if (data.status === "success") {
                            fetchWaterIntake();
                          }
                        }}
                        style={{
                          background: "#EF4444",
                          color: "white",
                          border: "none",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "6px",
                          fontSize: "0.8rem",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                        onMouseOver={(e) => e.target.style.background = "#DC2626"}
                        onMouseOut={(e) => e.target.style.background = "#EF4444"}
                      >
                        -0.5L
                      </button>
                      <button
                        onClick={async () => {
                          const now = new Date();
                          const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
                          const res = await fetch("http://localhost:8000/add_water_intake", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email: userEmail, amount: -0.25, date })
                          });
                          const data = await res.json();
                          if (data.status === "success") {
                            fetchWaterIntake();
                          }
                        }}
                        style={{
                          background: "#EF4444",
                          color: "white",
                          border: "none",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "6px",
                          fontSize: "0.8rem",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                        onMouseOver={(e) => e.target.style.background = "#DC2626"}
                        onMouseOut={(e) => e.target.style.background = "#EF4444"}
                      >
                        -0.25L
                      </button>
                      <button
                        onClick={async () => {
                          const now = new Date();
                          const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
                          const res = await fetch("http://localhost:8000/add_water_intake", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email: userEmail, amount: 0.25, date })
                          });
                          const data = await res.json();
                          if (data.status === "success") {
                            fetchWaterIntake();
                          }
                        }}
                        style={{
                          background: "#3B82F6",
                          color: "white",
                          border: "none",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "6px",
                          fontSize: "0.8rem",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                        onMouseOver={(e) => e.target.style.background = "#2563EB"}
                        onMouseOut={(e) => e.target.style.background = "#3B82F6"}
                      >
                        +0.25L
                      </button>
                      <button
                        onClick={async () => {
                          const now = new Date();
                          const date = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
                          const res = await fetch("http://localhost:8000/add_water_intake", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email: userEmail, amount: 0.5, date })
                          });
                          const data = await res.json();
                          if (data.status === "success") {
                            fetchWaterIntake();
                          }
                        }}
                        style={{
                          background: "#3B82F6",
                          color: "white",
                          border: "none",
                          padding: "0.25rem 0.5rem",
                          borderRadius: "6px",
                          fontSize: "0.8rem",
                          fontWeight: "600",
                          cursor: "pointer"
                        }}
                        onMouseOver={(e) => e.target.style.background = "#2563EB"}
                        onMouseOut={(e) => e.target.style.background = "#3B82F6"}
                      >
                        +0.5L
                      </button>
                    </div>
                  </div>
                  
                  <p style={{ fontSize: "0.9rem", color: darkMode ? "#CBD5E1" : "#475569", marginBottom: "0.5rem" }}>
                    You drank <span style={{ fontWeight: "700", color: "#3B82F6", fontSize: "1rem" }}>{waterIntake.toFixed(2)}L</span> of water today. Target: <span style={{ fontWeight: "700", color: darkMode ? "#E2E8F0" : "#1E293B" }}>2.5L</span> for your weight.
                  </p>
                  
                  <div style={{ 
                    fontSize: "0.85rem", 
                    color: darkMode ? "#94A3B8" : "#64748B",
                    fontStyle: "italic",
                    borderTop: darkMode ? "1px solid #475569" : "1px solid #E2E8F0",
                    paddingTop: "0.5rem"
                  }}
                    dangerouslySetInnerHTML={{ __html: `💡 ${vitaminAdvice}` }}
                  />
                </div>

                {/* Meal Suggestions & Restaurant Search */}
                <div style={{ 
                  marginTop: "1.5rem", 
                  paddingTop: "1rem", 
                  borderTop: darkMode ? "1px solid #334155" : "1px solid #eee",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "1rem",
                  flexWrap: "wrap"
                }}>
                  <button
                    onClick={() => setShowModal(true)}
                    className="btn btn-outline"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      fontSize: "0.9rem",
                      padding: "0.5rem 1rem"
                    }}
                  >
                    💡 AI Meal Suggestions
                  </button>

                  {/* Craving / Restaurant Search */}
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <input 
                      type="text" 
                      placeholder="Craving something? (e.g., salad)" 
                      value={craving}
                      onChange={(e) => setCraving(e.target.value)}
                      style={{
                        padding: "0.5rem",
                        borderRadius: "8px",
                        border: "1px solid #ccc",
                        fontSize: "0.9rem",
                        width: "280px",
                        background: darkMode ? "#334155" : "white",
                        color: darkMode ? "white" : "#1E293B"
                      }}
                    />
                    <button
                      onClick={() => {
                        if (craving.trim()) {
                          window.open(`https://www.google.com/maps/search/${encodeURIComponent(craving)}+restaurants+nearby`, '_blank');
                        }
                      }}
                      className="btn btn-outline"
                      style={{
                        fontSize: "0.9rem",
                        padding: "0.5rem 1rem",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.5rem"
                      }}
                    >
                      🔍 Find Places to Eat
                    </button>
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
              {/* Line Chart - Daily Calories Evolution */}
              <div className="nutrition-box" style={{ padding: "1.5rem" }}>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "#333" }}>
                  📈 Daily Calories Trend
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
                          text: 'Calories (kcal)'
                        }
                      }
                    }
                  }}
                />
              </div>

              {/* Bar Chart - Top Ingrediente */}
              <div className="nutrition-box" style={{ padding: "1.5rem" }}>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "#333" }}>
                  🏆 Top 5 Detected Ingredients
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
                            text: 'Number of occurrences'
                          }
                        }
                      }
                    }}
                  />
                ) : (
                  <p style={{ textAlign: "center", color: "#999", padding: "2rem" }}>
                    No data available for the selected period
                  </p>
                )}
              </div>
            </div>

            {/* Activity Overview */}
            <div className="nutrition-box" style={{ padding: "2rem", marginTop: "2rem" }}>
              <h3 style={{ fontSize: "1.3rem", marginBottom: "1.5rem", color: "#3B82F6" }}>
                📅 Daily Activity
              </h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {stats.dailyData.reverse().map((day, idx) => {
                  const intensity = day.count > 0 ? Math.min(day.count / 3, 1) : 0;
                  const color = day.count > 0 
                    ? `rgba(59, 130, 246, ${0.2 + intensity * 0.8})`
                    : '#f0f0f0';
                  
                  return (
                    <div
                      key={idx}
                      title={`${day.date}: ${day.count} analyses, ${day.calories} kcal`}
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
                Each square represents a day. Darker color = more analyses.
              </p>
            </div>
          </>
        )}
      

      
      {/* AI Suggestions Modal */}
      {showModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: darkMode ? "#1E293B" : "white",
            padding: "2rem",
            borderRadius: "12px",
            width: "90%",
            maxWidth: "500px",
            maxHeight: "80vh",
            overflowY: "auto",
            color: darkMode ? "#E2E8F0" : "#1E293B",
            position: "relative"
          }}>
            <button 
              onClick={() => {
                setShowModal(false);
                setSelectedMeal(null);
              }}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "none",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                color: darkMode ? "#94A3B8" : "#64748B"
              }}
            >
              ×
            </button>
            
            <h3 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", color: "#3B82F6" }}>
              💡 AI Meal Suggestions
            </h3>
            
            {loadingSuggestions ? (
              <p>Loading suggestions from Ollama...</p>
            ) : suggestions.length > 0 ? (
              <div>
                {!selectedMeal ? (
                  <div>
                    <p style={{ marginBottom: "1rem", fontSize: "0.9rem" }}>Select a meal to see the recipe:</p>
                    <ul style={{ listStyle: "none", padding: 0 }}>
                      {suggestions.map((meal, idx) => (
                        <li key={idx} style={{ marginBottom: "0.5rem" }}>
                          <button
                            onClick={() => setSelectedMeal(meal)}
                            style={{
                              width: "100%",
                              textAlign: "left",
                              padding: "0.75rem",
                              background: darkMode ? "#334155" : "#F1F5F9",
                              border: "none",
                              borderRadius: "8px",
                              cursor: "pointer",
                              fontSize: "1rem",
                              fontWeight: "600",
                              color: darkMode ? "#E2E8F0" : "#1E293B",
                              transition: "background 0.2s"
                            }}
                            onMouseOver={(e) => e.target.style.background = darkMode ? "#475569" : "#E2E8F0"}
                            onMouseOut={(e) => e.target.style.background = darkMode ? "#334155" : "#F1F5F9"}
                          >
                            🍽️ {meal.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div>
                    <button 
                      onClick={() => setSelectedMeal(null)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#3B82F6",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        marginBottom: "1rem",
                        padding: 0
                      }}
                    >
                      ← Back to list
                    </button>
                    <h4 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>{selectedMeal.name}</h4>
                    
                    {/* Reason */}
                    {selectedMeal.reason && (
                      <p style={{ 
                        fontSize: "0.9rem", 
                        color: darkMode ? "#94A3B8" : "#666", 
                        fontStyle: "italic",
                        marginBottom: "1rem" 
                      }}>
                        💡 {selectedMeal.reason}
                      </p>
                    )}
                    
                    <div style={{ 
                      fontSize: "0.9rem", 
                      color: darkMode ? "#CBD5E1" : "#555",
                      background: darkMode ? "#334155" : "#F8FAFC",
                      padding: "1rem",
                      borderRadius: "8px"
                    }}>
                      {selectedMeal.recipe.split(/(?=\d+\.)/).map((step, idx) => (
                        <p key={idx} style={{ marginBottom: "0.5rem", lastChild: { marginBottom: 0 } }}>{step.trim()}</p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p>No suggestions available or you have reached your goals!</p>
            )}
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {showWarningModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: darkMode ? "#1E293B" : "white",
            padding: "2rem",
            borderRadius: "16px",
            width: "400px",
            maxWidth: "90%",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
            border: darkMode ? "1px solid #334155" : "none",
            position: "relative"
          }}>
            <button 
              onClick={() => setShowWarningModal(false)}
              style={{
                position: "absolute",
                top: "1rem",
                right: "1rem",
                background: "none",
                border: "none",
                fontSize: "1.5rem",
                cursor: "pointer",
                color: darkMode ? "#94A3B8" : "#64748B"
              }}
            >
              ×
            </button>
            
            <h3 style={{ fontSize: "1.5rem", marginBottom: "1rem", color: "#EF4444", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              ⚠️ Warning!
            </h3>
            
            <p style={{ 
              fontSize: "1rem", 
              color: darkMode ? "#CBD5E1" : "#1E293B",
              lineHeight: "1.6"
            }}>
              {warningMessage}
            </p>
            
            <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
              <button
                onClick={() => setShowWarningModal(false)}
                onMouseOver={(e) => e.target.style.filter = "brightness(1.1)"}
                onMouseOut={(e) => e.target.style.filter = "none"}
                style={{
                  background: "#EF4444",
                  color: "white",
                  border: "none",
                  padding: "0.5rem 1rem",
                  borderRadius: "8px",
                  fontSize: "0.9rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)"
                }}
              >
                Understood
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
            'd': { description: 'Go to Dashboard (current)', action: 'navigate-dashboard' }
          }}
        />
      )}
      </main>
    </div>
  );
}








