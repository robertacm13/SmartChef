import React, { useState, useEffect } from "react";
import logoImg from "./logo.png";
import { MdOutlineKeyboardArrowUp, MdOutlineKeyboardArrowDown } from "react-icons/md";
import "./App.css";
import Toast from "./components/Toast";
import Tooltip from "./components/Tooltip";
import "./utils/errorMessages.css";
import { useKeyboardShortcuts } from "./utils/keyboardShortcuts";
import Navbar from "./components/Navbar";

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
  const [filterType, setFilterType] = useState("all"); // all, unread, analysis_complete, goal_achieved, etc.
  const [unreadCount, setUnreadCount] = useState(0);
  const [showScroll, setShowScroll] = useState(false);

  const formatMealName = (value) => {
    if (!value) return "your meal";
    return String(value)
      .replace(/[_-]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
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

  // Scroll event listener for showing scroll buttons
  useEffect(() => {
    const updateScrollVisibility = () => {
      const isScrollable = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) - window.innerHeight > 100;
      setShowScroll(isScrollable);
    };

    // Check immediately and at multiple intervals to ensure buttons appear
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
  }, [notifications, filterType]);

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
        return "";
      case "weight_reminder":
        return "";
            case "meal_reminder":
              return "🍽️";
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
        return "#60A5FA";
      case "weight_reminder":
        return "#2563EB";
            case "meal_reminder":
              return "#F59E0B";
      default:
        return "#666";
    }
  };

  const getNotificationTitle = (notification) => {
    if (notification.type === "analysis_complete") {
      const mealName = formatMealName(notification?.data?.food_name || notification?.food_name);
      return `${mealName} analysis completed!`;
    }

    return notification.title;
  };

  const getNotificationMessage = (notification) => {
    if (notification.type === "analysis_complete") {
      return "";
    }

    return notification.message;
  };

  const filteredNotifications = filterType === "all" 
    ? notifications 
    : filterType === "reminders"
    ? notifications.filter(n => ["daily_reminder", "weight_reminder", "meal_reminder"].includes(n.type))
    : notifications.filter(n => n.type === filterType);

  return (
    <div style={{ minHeight: "100vh", background: darkMode ? "#0F172A" : "#F1F5F9", color: darkMode ? "#E2E8F0" : "#1E293B" }}>
      {/* Navbar */}
      <Navbar 
        userEmail={userEmail}
        onBack={onBack}
        onNavigate={onNavigate}
        onLogout={onLogout}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        handleHelp={handleHelp}
        currentPage="notifications"
      />

      <main id="main-content" style={{ maxWidth: "800px", margin: "0 auto", padding: "6rem 2rem 2rem 2rem" }}>
        {/* Back Button */}
        <button
          className="btn btn-secondary"
          onClick={onBack}
          style={{ marginBottom: "2rem" }}
        >
          ← Back
        </button>

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
          {["all", "analysis_complete", "goal_achieved", "reminders"].map(type => (
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
              {type === "all" ? "All" : type === "reminders" ? "reminders" : type.replace("_", " ")}
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
                        {getNotificationTitle(notification)}
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
                    {getNotificationMessage(notification) && (
                      <p style={{ margin: "0.5rem 0 0 0", color: "#666", fontSize: "0.95rem" }}>
                        {getNotificationMessage(notification)}
                      </p>
                    )}
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

      {/* Scroll to Top/Bottom floating buttons */}
      {true && (
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



