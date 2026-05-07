import { useState, useEffect } from "react";
import { Line } from 'react-chartjs-2';
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function WeightTracking({ userEmail, onBack, onLogout, onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState([]);
  const [newWeight, setNewWeight] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newNotes, setNewNotes] = useState("");
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const [showNavDropdown, setShowNavDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userDropdownTimeout, setUserDropdownTimeout] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

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

  const handleUserMouseEnter = () => {
    if (userDropdownTimeout) clearTimeout(userDropdownTimeout);
    setShowUserDropdown(true);
  };

  const handleUserMouseLeave = () => {
    const timeout = setTimeout(() => setShowUserDropdown(false), 200);
    setUserDropdownTimeout(timeout);
  };

  useEffect(() => {
    fetchWeightHistory();
    // Set today's date as default
    const today = new Date().toISOString().split('T')[0];
    setNewDate(today);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      setError("Introdu o greutate validă");
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
        setSuccess("✅ Greutatea a fost înregistrată!");
        setNewWeight("");
        setNewNotes("");
        fetchWeightHistory();
      } else {
        setError("Eroare la salvare");
      }
    } catch (err) {
      console.error("Error adding weight:", err);
      setError("Eroare la adăugarea greutății");
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
        setSuccess("✅ Intrarea a fost ștearsă");
      } else {
        setError("Eroare la ștergere");
      }
    } catch (err) {
      console.error("Error deleting entry:", err);
      setError("Eroare la ștergerea intrării");
    }
  };

  // Prepare chart data
  const getChartData = () => {
    if (entries.length === 0) return null;
    
    const sortedEntries = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return {
      labels: sortedEntries.map(e => {
        const date = new Date(e.date);
        return date.toLocaleDateString("ro-RO", { day: "2-digit", month: "short" });
      }),
      datasets: [{
        label: "Greutate (kg)",
        data: sortedEntries.map(e => e.weight),
        borderColor: "rgba(76, 175, 80, 1)",
        backgroundColor: "rgba(76, 175, 80, 0.1)",
        tension: 0.3,
        fill: true,
        pointRadius: 5,
        pointHoverRadius: 7,
        pointBackgroundColor: "rgba(76, 175, 80, 1)",
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
          <h2>Se încarcă datele...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="animated-bg" style={{ minHeight: "100vh" }}>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo" onClick={onBack} style={{ cursor: "pointer" }}>
            🍳 SmartChef
          </div>
          <div className="nav-buttons">
            <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", marginLeft: "auto", marginRight: "-0.5rem" }}>
              <div 
                style={{ position: "relative" }}
                onMouseEnter={() => setShowNavDropdown(true)}
                onMouseLeave={() => setShowNavDropdown(false)}
              >
                <button className="btn btn-outline" style={{ padding: "0.7rem 1.2rem", fontSize: "1.5rem" }}>☰</button>
                {showNavDropdown && (
                  <div className="nav-dropdown">
                    <button className="nav-dropdown-item" onClick={() => { onNavigate("dashboard"); setShowNavDropdown(false); }}>📈 Dashboard</button>
                    <button className="nav-dropdown-item" onClick={() => { onNavigate("history"); setShowNavDropdown(false); }}>📊 History</button>
                    <button className="nav-dropdown-item" onClick={() => { onNavigate("goals"); setShowNavDropdown(false); }}>🎯 Goals</button>
                  </div>
                )}
              </div>
              
              <div style={{ width: "1px", height: "30px", background: "rgba(255,255,255,0.3)", margin: "0 0.5rem" }}></div>
              
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
              
              <div style={{ position: "relative" }} onMouseEnter={handleUserMouseEnter} onMouseLeave={handleUserMouseLeave}>
                <button className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  👤 {userEmail}
                  <span style={{ fontSize: "0.7rem", transition: "transform 0.3s", display: "inline-block", transform: showUserDropdown ? "rotate(90deg)" : "rotate(0deg)" }}>►</span>
                </button>
                {showUserDropdown && (
                  <div className="user-dropdown">
                    <button className="user-dropdown-item" onClick={() => onNavigate("personal-data")}><span className="dropdown-icon">📊</span> Personal Data</button>
                    <button className="user-dropdown-item" onClick={() => onNavigate("account-settings")}><span className="dropdown-icon">🔑</span> Account Settings</button>
                    <button className="user-dropdown-item" onClick={() => onNavigate("app-settings")}><span className="dropdown-icon">⚙️</span> App Settings</button>
                    <div className="user-dropdown-divider"></div>
                    <button className="user-dropdown-item logout-item" onClick={onLogout}><span className="dropdown-icon">🚪</span> Logout</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "2rem" }}>
        <button className="btn btn-secondary" onClick={onBack} style={{ marginBottom: "2rem" }}>← Înapoi</button>

        <div className="card" style={{ padding: "2rem", marginBottom: "1.5rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "700", color: "var(--primary, #ff6b35)", marginBottom: "0.5rem" }}>⚖️ Tracking Greutate</h1>
          <p style={{ color: "#666", fontSize: "1rem" }}>Monitorizează-ți evoluția greutății în timp</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
            <div className="stat-card">
              <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.3rem" }}>Greutate curentă</div>
              <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "var(--primary, #ff6b35)" }}>{stats.current} kg</div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.3rem" }}>Schimbare totală</div>
              <div style={{ fontSize: "2.2rem", fontWeight: "800", color: stats.change >= 0 ? "#f44336" : "#4caf50" }}>
                {stats.change > 0 ? "+" : ""}{stats.change.toFixed(1)} kg
              </div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.3rem" }}>Media generală</div>
              <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "#2196f3" }}>{stats.average.toFixed(1)} kg</div>
            </div>
            <div className="stat-card">
              <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.3rem" }}>Total măsurători</div>
              <div style={{ fontSize: "2.2rem", fontWeight: "800", color: "#9c27b0" }}>{entries.length}</div>
            </div>
          </div>
        )}

        {/* Chart */}
        {chartData && (
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--primary, #ff6b35)", marginBottom: "1rem" }}>📈 Evoluție în timp</h3>
            <div style={{ height: "300px" }}>
              <Line data={chartData} options={chartOptions} />
            </div>
          </div>
        )}

        {/* Add New Entry */}
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--primary, #ff6b35)", marginBottom: "1rem" }}>➕ Adaugă o nouă măsurătoare</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 2fr auto", gap: "1rem", alignItems: "end" }}>
            <div>
              <label className="form-label">Greutate (kg)</label>
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
              <label className="form-label">Dată</label>
              <input 
                type="date" 
                className="form-input" 
                value={newDate} 
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div>
              <label className="form-label">Notițe (opțional)</label>
              <input 
                type="text" 
                className="form-input" 
                value={newNotes} 
                onChange={(e) => setNewNotes(e.target.value)}
                placeholder="Ex: Dimineață, după mic dejun"
              />
            </div>
            <button 
              className="btn btn-primary" 
              onClick={handleAddEntry} 
              disabled={adding}
              style={{ height: "fit-content", padding: "0.7rem 1.5rem" }}
            >
              {adding ? "..." : "Adaugă"}
            </button>
          </div>
        </div>

        {/* Messages */}
        {success && (
          <div style={{ padding: "1rem", background: "rgba(76, 175, 80, 0.1)", border: "1px solid rgba(76, 175, 80, 0.3)", borderRadius: "8px", color: "#388e3c", marginBottom: "1rem" }}>{success}</div>
        )}
        {error && (
          <div style={{ padding: "1rem", background: "rgba(244, 67, 54, 0.1)", border: "1px solid rgba(244, 67, 54, 0.3)", borderRadius: "8px", color: "#d32f2f", marginBottom: "1rem" }}>{error}</div>
        )}

        {/* History Table */}
        <div className="card" style={{ padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--primary, #ff6b35)", marginBottom: "1rem" }}>📋 Istoric măsurători</h3>
          {entries.length === 0 ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#888" }}>
              <p style={{ fontSize: "2rem", marginBottom: "1rem" }}>📭</p>
              <p>Nu ai încă măsurători înregistrate</p>
              <p style={{ fontSize: "0.9rem" }}>Adaugă prima măsurătoare mai sus pentru a începe!</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #eee" }}>
                    <th style={{ padding: "0.8rem", textAlign: "left", fontWeight: "700", color: "#666" }}>Dată</th>
                    <th style={{ padding: "0.8rem", textAlign: "center", fontWeight: "700", color: "#666" }}>Greutate</th>
                    <th style={{ padding: "0.8rem", textAlign: "center", fontWeight: "700", color: "#666" }}>Schimbare</th>
                    <th style={{ padding: "0.8rem", textAlign: "left", fontWeight: "700", color: "#666" }}>Notițe</th>
                    <th style={{ padding: "0.8rem", textAlign: "center", fontWeight: "700", color: "#666" }}>Acțiuni</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry, index) => {
                    const prevWeight = entries[index + 1]?.weight;
                    const change = prevWeight ? entry.weight - prevWeight : 0;
                    
                    return (
                      <tr key={entry._id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                        <td style={{ padding: "0.8rem" }}>
                          {new Date(entry.date).toLocaleDateString("ro-RO", { day: "2-digit", month: "long", year: "numeric" })}
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
          <div onClick={(e) => e.stopPropagation()} style={{ background: "white", padding: "2rem", borderRadius: "16px", maxWidth: "400px" }}>
            <h3 style={{ marginBottom: "1rem", color: "#f44336" }}>🗑️ Confirmare ștergere</h3>
            <p style={{ marginBottom: "1.5rem", color: "#666" }}>Sigur vrei să ștergi această măsurătoare?</p>
            <div style={{ display: "flex", gap: "1rem" }}>
              <button className="btn btn-outline" onClick={() => setDeleteConfirm(null)} style={{ flex: 1 }}>Anulează</button>
              <button className="btn btn-primary" onClick={() => handleDelete(deleteConfirm)} style={{ flex: 1, background: "#f44336" }}>Șterge</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
