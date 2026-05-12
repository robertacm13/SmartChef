/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import logoImg from "./logo.png";
import { Line } from 'react-chartjs-2';
import { MdOutlineKeyboardArrowUp, MdOutlineKeyboardArrowDown } from "react-icons/md";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import "./App.css";
import Navbar from "./components/Navbar";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function WeightTracking({ userEmail, onBack, onLogout, onNavigate, darkMode, toggleDarkMode, handleHelp, currentPage }) {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [newWeight, setNewWeight] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showScroll, setShowScroll] = useState(false);

  // Fetch unread notifications on component mount
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

    if (userEmail) {
      fetchUnreadNotifications();
    }
  }, [userEmail]);

  useEffect(() => {
    fetchWeightHistory();
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    setNewDate(today);
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
  }, [loading, entries]);

  const fetchWeightHistory = async () => {
    try {
      const res = await fetch(`http://localhost:8000/weight_history/${userEmail}`);
      const data = await res.json();
      
      if (data.status === "success") {
        setEntries(data.entries);
      }
    } catch (err) {
      console.error("Error fetching weight history:", err);
      setError("Error loading history");
    } finally {
      setLoading(false);
    }
  };

  const handleAddEntry = async () => {
    if (!newWeight || parseFloat(newWeight) <= 0) {
      setError("Please enter a valid weight");
      return;
    }
    
    setAdding(true);
    setError("");
    setSuccess("");
    
    try {
      const res = await fetch(`http://localhost:8000/weight_history/${userEmail}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          weight: parseFloat(newWeight),
          date: newDate,
          notes: newNotes || null
        })
      });
      
      const data = await res.json();
      
      if (data.status === "success") {
        setSuccess("✅ Weight recorded!");
        setNewWeight("");
        setNewNotes("");
        fetchWeightHistory();
      } else {
        setError("Error saving entry");
      }
    } catch (err) {
      console.error("Error adding weight:", err);
      setError("Error adding weight entry");
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (entryId) => {
    try {
      const res = await fetch(`http://localhost:8000/weight_history/${entryId}`, {
        method: "DELETE",
        headers: { "X-User-Email": userEmail }
      });
      
      const data = await res.json();
      
      if (data.status === "success") {
        setEntries(entries.filter(e => e._id !== entryId));
        setDeleteConfirm(null);
        setSuccess("✅ Entry deleted");
      } else {
        setError("Error deleting entry");
      }
    } catch (err) {
      console.error("Error deleting entry:", err);
      setError("Error deleting entry");
    }
  };

  // Prepare chart data
  const getChartData = () => {
    if (entries.length === 0) return null;
    
    const sortedEntries = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return {
      labels: sortedEntries.map(e => {
        const date = new Date(e.date);
        return date.toLocaleDateString("en-US", { day: "2-digit", month: "short" });
      }),
      datasets: [{
        label: "Greutate (kg)",
        data: sortedEntries.map(e => e.weight),
        borderColor: "rgba(59, 130, 246, 1)",
        backgroundColor: "rgba(59, 130, 246, 0.1)",
        tension: 0.3,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: "rgba(59, 130, 246, 1)",
        pointBorderColor: "#fff",
        pointBorderWidth: 2
      }]
    };
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: (context) => `${context.parsed.y} kg`
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: (value) => `${value} kg`
        }
      }
    }
  };

  const calculateStats = () => {
    if (entries.length === 0) return null;
    
    const weights = entries.map(e => e.weight);
    const currentWeight = weights[0];
    const startWeight = weights[weights.length - 1];
    const totalChange = currentWeight - startWeight;
    const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length;
    
    return {
      current: currentWeight,
      start: startWeight,
      change: totalChange,
      average: avgWeight
    };
  };

  const stats = calculateStats();
  const chartData = getChartData();

  if (loading) {
    return (
      <div className="animated-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
          <h2>Loading data...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="animated-bg" style={{ minHeight: "100vh", background: darkMode ? "#0F172A" : "#F1F5F9" }}>
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

      {/* Main Content */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "6rem 2rem 2rem 2rem" }}>

        <div className="card" style={{ padding: "6rem 2rem 2rem 2rem", marginBottom: "1.5rem", textAlign: "center", background: darkMode ? "#1E293B" : "#FFFFFF", border: darkMode ? "1px solid #334155" : "1px solid #E2E8F0" }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "700", color: "var(--primary, #3B82F6)", marginBottom: "0.5rem" }}>⚖️ Weight Tracking</h1>
          <p style={{ color: darkMode ? "#94A3B8" : "#64748B", fontSize: "1rem" }}>Monitor your weight progress over time</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <div className="stat-card">
              <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.3rem" }}>Current Weight</div>
              <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "var(--primary, #3B82F6)" }}>{stats.current} kg</div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.3rem" }}>Total Change</div>
              <div style={{ fontSize: "2.2rem", fontWeight: "800", color: stats.change >= 0 ? "#f44336" : "#4caf50" }}>
                {stats.change > 0 ? "+" : ""}{stats.change.toFixed(1)} kg
              </div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.3rem" }}>Average</div>
              <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "#3B82F6" }}>{stats.average.toFixed(1)} kg</div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.3rem" }}>Total Entries</div>
              <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "#3B82F6" }}>{entries.length}</div>
            </div>
          </div>
        )}

        {/* Chart */}
        {chartData && (
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem", background: darkMode ? "#1E293B" : "#FFFFFF", border: darkMode ? "1px solid #334155" : "1px solid #E2E8F0" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--primary, #3B82F6)", marginBottom: "1rem" }}>📈 Progress Over Time</h3>
            <div style={{ height: "300px" }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Add New Entry */}
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--primary, #3B82F6)", marginBottom: "1rem" }}>➕ Add New Entry</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr auto", gap: "1rem", alignItems: "end" }}>
            <div>
              <label className="form-label">Weight (kg)</label>
              <input 
                type="number" 
                step="0.1" 
                className="form-input" 
                value={newWeight} 
                onChange={(e) => setNewWeight(e.target.value)}
                placeholder="Ex: 75.5"
              />
            </div>
            <div>
              <label className="form-label">Date</label>
              <input 
                type="date" 
                className="form-input" 
                value={newDate} 
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Notes (optional)</label>
              <input 
                type="text" 
                className="form-input" 
                value={newNotes} 
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Ex: Morning, after breakfast"
              />
            </div>
            <button 
              className="btn btn-primary" 
              onClick={handleAddEntry} 
              disabled={adding}
              style={{ height: "fit-content", padding: "0.7rem 1.5rem" }}
            >
              {adding ? "..." : "Add"}
            </button>
          </div>
        </div>

        {/* Messages */}
        {success && (
          <div style={{ padding: "1rem", background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "8px", color: "#3B82F6", marginBottom: "1rem" }}>{success}</div>
        )}
        {error && (
          <div style={{ padding: "1rem", background: "rgba(244, 67, 54, 0.1)", border: "1px solid rgba(244, 67, 54, 0.3)", borderRadius: "8px", color: "#d32f2f", marginBottom: "1rem" }}>{error}</div>
        )}

        {/* History Table */}
        <div className="card" style={{ padding: "1.5rem", background: darkMode ? "#1E293B" : "#FFFFFF", border: darkMode ? "1px solid #334155" : "1px solid #E2E8F0" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--primary, #3B82F6)", marginBottom: "1rem" }}>📋 Entry History</h3>
          {entries.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#888" }}>
              <p style={{ fontSize: "2rem", marginBottom: "1rem" }}>📭</p>
              <p>No entries recorded yet</p>
              <p style={{ fontSize: "0.9rem" }}>Add your first entry above to get started!</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #eee" }}>
                    <th style={{ padding: "0.8rem", textAlign: "left", fontWeight: "700", color: "#666" }}>Date</th>
                    <th style={{ padding: "0.8rem", textAlign: "center", fontWeight: "700", color: "#666" }}>Weight</th>
                    <th style={{ padding: "0.8rem", textAlign: "center", fontWeight: "700", color: "#666" }}>Change</th>
                    <th style={{ padding: "0.8rem", textAlign: "left", fontWeight: "700", color: "#666" }}>Notes</th>
                    <th style={{ padding: "0.8rem", textAlign: "center", fontWeight: "700", color: "#666" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => {
                    const prevWeight = entries[index + 1]?.weight;
                    const change = prevWeight ? entry.weight - prevWeight : 0;
                    
                    return (
                      <tr key={entry._id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "0.8rem" }}>
                          {new Date(entry.date).toLocaleDateString("en-US", { day: "2-digit", month: "long", year: "numeric" })}
                        </td>
                        <td style={{ padding: "0.8rem", textAlign: "center", fontWeight: "700", fontSize: "1.1rem" }}>
                          {entry.weight} kg
                        </td>
                        <td style={{ padding: "0.8rem", textAlign: "center", fontWeight: "600", color: change > 0 ? "#f44336" : change < 0 ? "#4caf50" : "#888" }}>
                          {prevWeight ? (
                            <span>{change > 0 ? "+" : ""}{change.toFixed(1)} kg</span>
                          ) : "—"}
                        </td>
                        <td style={{ padding: "0.8rem", fontSize: "0.9rem", color: "#666" }}>
                          {entry.notes || "—"}
                        </td>
                        <td style={{ padding: "0.8rem", textAlign: "center" }}>
                          <button 
                            className="btn btn-outline" 
                            onClick={() => setDeleteConfirm(entry._id)}
                            style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem", color: "#f44336", borderColor: "#f44336" }}
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="delete-confirm-modal" onClick={() => setDeleteConfirm(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "white", padding: "6rem 2rem 2rem 2rem", borderRadius: "16px", maxWidth: "400px" }}>
            <h3 style={{ marginBottom: "1rem", color: "#f44336" }}>🗑️ Confirm deletion</h3>
            <p style={{ marginBottom: "1.5rem", color: "#666" }}>Are you sure you want to delete this measurement?</p>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)} style={{ flex: 1 }}>Cancel</button>
              <button className="btn btn-primary" onClick={() => handleDelete(deleteConfirm)} style={{ flex: 1, background: "#f44336" }}>Delete</button>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}



