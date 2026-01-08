import { useState, useEffect } from "react";
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import "./App.css";

export default function Dashboard({ userEmail, onBack, onLogout, onNavigate }) {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState(7); // 7 or 30 days

  useEffect(() => {
    fetchAnalyses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAnalyses = async () => {
    try {
      const res = await fetch(`http://localhost:8001/analysis_history/${userEmail}?limit=100`);
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
      <header className="header">
        <div className="header-content">
          <div className="logo" onClick={onBack} style={{ cursor: "pointer" }}>
            🍳 SmartChef
          </div>
          <div className="nav-buttons">
            <button
              className="btn btn-outline"
              onClick={() => onNavigate('dashboard')}
              style={{ marginRight: "1rem", background: "rgba(255,255,255,0.2)" }}
            >
              📈 Dashboard
            </button>
            <button
              className="btn btn-outline"
              onClick={() => onNavigate('history')}
              style={{ marginRight: "1rem" }}
            >
              📊 Istoric
            </button>
            <span style={{ 
              color: "white", 
              marginRight: "1rem", 
              fontWeight: "500",
              display: "inline-flex",
              alignItems: "center",
              height: "100%"
            }}>
              👤 {userEmail}
            </span>
            <button
              className="btn btn-outline"
              onClick={onLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "2rem" }}>
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
          <div style={{ textAlign: "center", padding: "3rem" }}>
            <div className="spinner"></div>
            <p style={{ marginTop: "1rem", color: "#666" }}>Se încarcă datele...</p>
          </div>
        )}

        {error && (
          <div style={{
            background: "#fee",
            border: "2px solid #fcc",
            borderRadius: "12px",
            padding: "1rem",
            textAlign: "center",
            color: "#c33",
            marginBottom: "2rem"
          }}>
            ⚠️ {error}
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
                <div style={{ color: "#666", fontSize: "0.9rem" }}>Total Analize</div>
              </div>

              <div className="feature-card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🔥</div>
                <div style={{ fontSize: "2rem", fontWeight: "700", color: "#ff6b35" }}>
                  {stats.totalCalories.toLocaleString()}
                </div>
                <div style={{ color: "#666", fontSize: "0.9rem" }}>Total Calorii (kcal)</div>
              </div>

              <div className="feature-card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>📉</div>
                <div style={{ fontSize: "2rem", fontWeight: "700", color: "#ff6b35" }}>
                  {stats.avgCalories}
                </div>
                <div style={{ color: "#666", fontSize: "0.9rem" }}>Medie Calorii/Analiză</div>
              </div>

              <div className="feature-card" style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🥗</div>
                <div style={{ fontSize: "2rem", fontWeight: "700", color: "#ff6b35" }}>
                  {stats.topIngredients.length > 0 ? stats.topIngredients[0][0] : 'N/A'}
                </div>
                <div style={{ color: "#666", fontSize: "0.9rem" }}>Top Ingredient</div>
              </div>
            </div>

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
      </div>
    </div>
  );
}
