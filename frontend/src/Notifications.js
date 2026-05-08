import React, { useState, useEffect } from "react";
import "./App.css";
import Toast from "./components/Toast";
import Tooltip from "./components/Tooltip";
import "./utils/errorMessages.css";
import { useKeyboardShortcuts } from "./utils/keyboardShortcuts";

export default function Notifications({ 
  userEmail, 
  onBack, 
  onLogout, 
  onNavigate, 
  darkMode, 
  toggleDarkMode, 
  handleSettings, 
  handleHelp 
}) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [showNavDropdown, setShowNavDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [navDropdownTimeout, setNavDropdownTimeout] = useState(null);
  const [userDropdownTimeout, setUserDropdownTimeout] = useState(null);
  const [filterType, setFilterType] = useState("all"); // all, unread, analysis_complete, goal_achieved, etc.
  const [unreadCount, setUnreadCount] = useState(0);

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

  useKeyboardShortcuts({
    'h': () => onBack(),
    'd': () => onNavigate('dashboard'),
    't': () => toggleDarkMode(),
    'Escape': () => {
      if (toast) setToast(null);
    }
  });

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:8000/notifications/${userEmail}`);
        const data = await res.json();

        if (data.status === "success") {
          setNotifications(data.notifications);
          setUnreadCount(data.unread_count);
          setError("");
        } else {
          setError(data.detail || "Error fetching notifications");
        }
      } catch (err) {
        setError("Network error. Please try again.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    // Poll for new notifications every 10 seconds
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, [userEmail]);

  const markNotificationAsRead = async (notificationId, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`http://localhost:8000/notifications/${notificationId}/read`, {
        method: "PUT",
      });

      if (res.ok) {
        // Update local state
        setNotifications(notifications.map(n => 
          n._id === notificationId ? { ...n, is_read: true } : n
        ));
        setUnreadCount(Math.max(0, unreadCount - 1));
        setToast({ message: "Notification marked as read", type: "success" });
      } else {
        setToast({ message: "Error marking notification as read", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Network error", type: "error" });
      console.error(err);
    }
  };

  const deleteNotification = async (notificationId, e) => {
    e.stopPropagation();
    try {
      const res = await fetch(`http://localhost:8000/notifications/${notificationId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setNotifications(notifications.filter(n => n._id !== notificationId));
        setToast({ message: "Notification deleted", type: "success" });
      } else {
        setToast({ message: "Error deleting notification", type: "error" });
      }
    } catch (err) {
      setToast({ message: "Network error", type: "error" });
      console.error(err);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case "analysis_complete":
        return "✅";
      case "goal_achieved":
        return "🎉";
      case "daily_reminder":
        return "📅";
      case "weight_reminder":
        return "⚖️";
      default:
        return "📢";
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case "analysis_complete":
        return "#3B82F6";
      case "goal_achieved":
        return "#3B82F6";
      case "daily_reminder":
        return "#2196F3";
      case "weight_reminder":
        return "#9C27B0";
      default:
        return "#666";
    }
  };

  const filteredNotifications = filterType === "all" 
    ? notifications 
    : notifications.filter(n => n.type === filterType);

  return (
    <div className="animated-bg" style={{ minHeight: "100vh" }}>
      <header className="header">
        <div className="header-content">
          <div className="logo" onClick={onBack} style={{ cursor: "pointer" }}>
            🍳 SmartChef
          </div>
          <div className="nav-buttons">
            <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", marginLeft: "auto", marginRight: "-0.5rem" }}>
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
                      📊 History
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
                title="Notifications"
              >
                🔔
                {unreadCount > 0 && (
                  <span style={{
                    position: "absolute",
                    top: "-5px",
                    right: "-5px",
                    background: "#3B82F6",
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
                    <button className="user-dropdown-item" onClick={() => alert('🚧 Profile - Coming soon!')}>
                      <span className="dropdown-icon">👤</span>
                      Profile
                    </button>
                    
                    <button className="user-dropdown-item" onClick={() => {
                      onNavigate('personal-data');
                      setShowUserDropdown(false);
                    }}>
                      <span className="dropdown-icon">📊</span>
                      Personal Data
                    </button>
                    
                    <button className="user-dropdown-item" onClick={() => {
                      onNavigate('account-settings');
                      setShowUserDropdown(false);
                    }}>
                      <span className="dropdown-icon">🔑</span>
                      Account Settings
                    </button>

                    <button className="user-dropdown-item" onClick={() => {
                      onNavigate('app-settings');
                      setShowUserDropdown(false);
                    }}>
                      <span className="dropdown-icon">⚙️</span>
                      App Settings
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

      <main id="main-content" style={{ maxWidth: "800px", margin: "0 auto", padding: "2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <h2 style={{ fontSize: "2.5rem", fontWeight: "700", color: "#3B82F6", marginBottom: "0.5rem" }}>
            🔔 Notifications
          </h2>
          <p style={{ color: "#666", fontSize: "1rem" }}>
            {unreadCount > 0 ? `${unreadCount} unread notifications` : "All notifications have been read"}
          </p>
        </div>

        {/* Filter Buttons */}
        <div style={{ 
          display: "flex", 
          gap: "0.5rem", 
          marginBottom: "2rem",
          flexWrap: "wrap",
          justifyContent: "center"
        }}>
          {["all", "analysis_complete", "goal_achieved", "daily_reminder"].map(type => (
            <button
              key={type}
              className="btn btn-outline"
              onClick={() => setFilterType(type)}
              style={{
                background: filterType === type ? "#3B82F6" : "transparent",
                color: filterType === type ? "white" : "#666",
                border: filterType === type ? "none" : "2px solid #ddd"
              }}
            >
              {type === "all" ? "All" : type.replace("_", " ")}
            </button>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div style={{
            background: "#F0F9FF",
            border: "2px solid #f44336",
            color: "#c62828",
            padding: "1rem",
            borderRadius: "8px",
            marginBottom: "1.5rem",
            textAlign: "center"
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: "center", padding: "2rem" }}>
            <div className="spinner"></div>
            <p style={{ marginTop: "1rem", color: "#666" }}>Loading notifications...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredNotifications.length === 0 && (
          <div style={{
            textAlign: "center",
            padding: "3rem",
            background: "white",
            borderRadius: "20px",
            boxShadow: "0 4px 15px rgba(0,0,0,0.1)"
          }}>
            <p style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎯</p>
            <p style={{ fontSize: "1.2rem", color: "#666" }}>
              No notifications at the moment
            </p>
          </div>
        )}

        {/* Notifications List */}
        {!loading && filteredNotifications.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {filteredNotifications.map((notification) => (
              <div
                key={notification._id}
                className="feature-card"
                style={{
                  padding: "1.5rem",
                  borderLeft: `4px solid ${getNotificationColor(notification.type)}`,
                  background: notification.is_read ? "#f9f9f9" : "white",
                  opacity: notification.is_read ? 0.7 : 1,
                  cursor: "pointer",
                  transition: "all 0.3s ease"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.8rem", marginBottom: "0.5rem" }}>
                      <span style={{ fontSize: "1.5rem" }}>
                        {getNotificationIcon(notification.type)}
                      </span>
                      <h3 style={{ margin: 0, color: "#333", fontSize: "1.1rem", fontWeight: "600" }}>
                        {notification.title}
                      </h3>
                      {!notification.is_read && (
                        <span style={{
                          display: "inline-block",
                          width: "8px",
                          height: "8px",
                          background: "#3B82F6",
                          borderRadius: "50%",
                          marginLeft: "0.5rem"
                        }}></span>
                      )}
                    </div>
                    <p style={{ margin: "0.5rem 0 0 0", color: "#666", fontSize: "0.95rem" }}>
                      {notification.message}
                    </p>
                    <p style={{ margin: "0.5rem 0 0 0", color: "#999", fontSize: "0.85rem" }}>
                      📅 {new Date(notification.timestamp).toLocaleString('en-US')}
                    </p>
                  </div>

                  <div style={{ display: "flex", gap: "0.5rem", marginLeft: "1rem" }}>
                    {!notification.is_read && (
                      <Tooltip text="Mark as read">
                        <button
                          className="btn btn-outline"
                          onClick={(e) => markNotificationAsRead(notification._id, e)}
                          style={{ padding: "0.5rem 0.8rem", fontSize: "1rem", minWidth: "auto" }}
                          title="Mark as read"
                        >
                          ✓
                        </button>
                      </Tooltip>
                    )}
                    <Tooltip text="Delete">
                      <button
                        className="delete-btn"
                        onClick={(e) => deleteNotification(notification._id, e)}
                        style={{ padding: "0.5rem 0.8rem", fontSize: "1rem" }}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}



