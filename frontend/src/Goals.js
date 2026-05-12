import { useState, useEffect } from "react";
import "./App.css";
import Navbar from "./components/Navbar";

const GOAL_TYPES = [
  { id: "lose_weight", name: "Weight Loss", emoji: "📉", description: "Caloric deficit for weight loss" },
  { id: "maintain", name: "Maintenance", emoji: "⚖️", description: "Maintain current weight" },
  { id: "gain_weight", name: "Weight Gain", emoji: "📈", description: "Caloric surplus for muscle" },
  { id: "build_muscle", name: "Muscle Building", emoji: "💪", description: "Surplus with focus on protein" }
];

const ACTIVITY_LEVELS = [
  { id: "sedentary", name: "Sedentary", description: "Little or no movement", multiplier: 1.2 },
  { id: "light", name: "Lightly Active", description: "Light exercise 1-3 days/week", multiplier: 1.375 },
  { id: "moderate", name: "Moderately Active", description: "Moderate exercise 3-5 days/week", multiplier: 1.55 },
  { id: "active", name: "Very Active", description: "Intense exercise 6-7 days/week", multiplier: 1.725 },
  { id: "very_active", name: "Extremely Active", description: "Very intense exercise + physical job", multiplier: 1.9 }
];

export default function Goals({ userEmail, onBack, onLogout, onNavigate, darkMode, toggleDarkMode, handleHelp }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [calculated, setCalculated] = useState({});
  const [hasProfile, setHasProfile] = useState(false);
  
  const [goalType, setGoalType] = useState("maintain");
  const [activityLevel, setActivityLevel] = useState("moderate");
  const [customCalories, setCustomCalories] = useState("");
  const [customProtein, setCustomProtein] = useState("");
  const [customCarbs, setCustomCarbs] = useState("");
  const [customFat, setCustomFat] = useState("");
  const [targetWeight, setTargetWeight] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState("-0.5");
  
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
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

  useEffect(() => {
    fetchGoals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchGoals = async () => {
    try {
      const res = await fetch(`http://localhost:8000/user_goals/${userEmail}`);
      const data = await res.json();
      
      if (data.status === "success") {
        setCalculated(data.calculated || {});
        setHasProfile(data.calculated && Object.keys(data.calculated).length > 0);
        
        // Populate form with existing data
        if (data.goals) {
          setGoalType(data.goals.goal_type || "maintain");
          setActivityLevel(data.goals.activity_level || "moderate");
          setCustomCalories(data.goals.target_calories || "");
          setCustomProtein(data.goals.target_protein || "");
          setCustomCarbs(data.goals.target_carbs || "");
          setCustomFat(data.goals.target_fat || "");
          setTargetWeight(data.goals.target_weight || "");
          setWeeklyGoal(data.goals.weekly_goal || "-0.5");
        }
      }
    } catch (err) {
      console.error("Error fetching goals:", err);
      setError("Error loading goals");
    } finally {
      setLoading(false);
    }
  };

  const calculateRecommendedMacros = () => {
    let targetCals = calculated.tdee || 2000;
    
    // Adjust based on goal
    if (goalType === "lose_weight") {
      targetCals = targetCals - 500; // 500 cal deficit
    } else if (goalType === "gain_weight" || goalType === "build_muscle") {
      targetCals = targetCals + 300; // 300 cal surplus
    }
    
    // Macro split based on goal type
    let proteinRatio, carbsRatio, fatRatio;
    
    if (goalType === "build_muscle") {
      proteinRatio = 0.30; // 30% protein
      fatRatio = 0.25;     // 25% fat
      carbsRatio = 0.45;   // 45% carbs
    } else if (goalType === "lose_weight") {
      proteinRatio = 0.35; // 35% protein (preserve muscle)
      fatRatio = 0.25;     // 25% fat
      carbsRatio = 0.40;   // 40% carbs
    } else {
      proteinRatio = 0.25; // 25% protein
      fatRatio = 0.30;     // 30% fat
      carbsRatio = 0.45;   // 45% carbs
    }
    
    return {
      calories: Math.round(targetCals),
      protein: Math.round((targetCals * proteinRatio) / 4), // 4 cal per g
      carbs: Math.round((targetCals * carbsRatio) / 4),
      fat: Math.round((targetCals * fatRatio) / 9) // 9 cal per g
    };
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");
    
    try {
      const recommended = calculateRecommendedMacros();
      
      const goalsData = {
        goal_type: goalType,
        activity_level: activityLevel,
        target_calories: customCalories ? parseInt(customCalories) : recommended.calories,
        target_protein: customProtein ? parseInt(customProtein) : recommended.protein,
        target_carbs: customCarbs ? parseInt(customCarbs) : recommended.carbs,
        target_fat: customFat ? parseInt(customFat) : recommended.fat,
        target_weight: targetWeight ? parseFloat(targetWeight) : null,
        weekly_goal: weeklyGoal ? parseFloat(weeklyGoal) : null
      };
      
      const res = await fetch(`http://localhost:8000/user_goals/${userEmail}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(goalsData)
      });
      
      const data = await res.json();
      
      if (data.status === "success") {
        setSuccess("✅ Obiectivele au fost salvate cu succes!");
        setCalculated(data.calculated || {});
      } else {
        setError("Error saving");
      }
    } catch (err) {
      console.error("Error saving goals:", err);
      setError("Error saving goals");
    } finally {
      setSaving(false);
    }
  };

  const recommended = hasProfile ? calculateRecommendedMacros() : null;

  if (loading) {
    return (
      <div className="animated-bg" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="card" style={{ padding: "3rem", textAlign: "center" }}>
          <h2>Loading goals...</h2>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: darkMode ? "#0F172A" : "#F1F5F9", color: darkMode ? "#E2E8F0" : "#1E293B" }}>
      <Navbar 
        userEmail={userEmail}
        onBack={onBack}
        onNavigate={onNavigate}
        onLogout={onLogout}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        handleHelp={handleHelp}
        currentPage="goals"
      />

      {/* Skip Link untuk keyboard navigation - WCAG 2.1 */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      
      {/* Main Content */}
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "6rem 2rem 2rem 2rem" }} id="main-content">
        <button
          className="btn btn-secondary"
          onClick={onBack}
          style={{ marginBottom: "2rem" }}
        >
          ← Back
        </button>

        <div className="card" style={{ padding: "2rem", marginBottom: "1.5rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "700", color: "var(--primary, #3B82F6)", marginBottom: "0.5rem" }}>🎯 Your Goals</h1>
          <p style={{ color: "#666", fontSize: "1rem" }}>Set personalized nutritional goals based on your profile</p>
        </div>

        {!hasProfile && (
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem", background: "rgba(59, 130, 246, 0.05)", border: "1px solid rgba(59, 130, 246, 0.2)" }}>
            <h3 style={{ marginBottom: "0.5rem", color: "#3B82F6" }}>⚠️ Missing personal data</h3>
            <p style={{ marginBottom: "1rem", color: "#666" }}>To calculate BMR and TDEE, complete your personal data (weight, height, age, gender).</p>
            <button className="btn btn-primary" onClick={() => onNavigate("personal-data")}>📝 Complete Personal Data</button>
          </div>
        )}

        {/* BMR & TDEE Display */}
        {hasProfile && (
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1.3rem", fontWeight: "700", color: "var(--primary, #3B82F6)", marginBottom: "0.5rem" }}>📊 Your Metabolic Calculator</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
              <div style={{ padding: "1rem", background: "rgba(59, 130, 246, 0.08)", borderRadius: "12px", border: "2px solid rgba(59, 130, 246, 0.3)" }}>
                <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.3rem" }}>BMR (Basal Metabolic Rate)</div>
                <div style={{ fontSize: "2rem", fontWeight: "800", color: "#3B82F6" }}>{calculated.bmr || "—"}</div>
                <div style={{ fontSize: "0.8rem", color: "#888" }}>kcal/day at rest</div>
              </div>
              <div style={{ padding: "1rem", background: "rgba(96, 165, 250, 0.08)", borderRadius: "12px", border: "2px solid rgba(96, 165, 250, 0.3)" }}>
                <div style={{ fontSize: "0.85rem", color: "#666", marginBottom: "0.3rem" }}>TDEE (Total Daily Energy Expenditure)</div>
                <div style={{ fontSize: "2rem", fontWeight: "800", color: "#60A5FA" }}>{calculated.tdee || "—"}</div>
                <div style={{ fontSize: "0.8rem", color: "#888" }}>kcal/day with activity</div>
              </div>
            </div>
            <p style={{ marginTop: "1rem", fontSize: "0.9rem", color: "#666", fontStyle: "italic" }}>💡 BMR = calories burned at rest | TDEE = total calories with activity</p>
          </div>
        )}

        {/* Goal Type Selection */}
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1.3rem", fontWeight: "700", color: "var(--primary, #3B82F6)", marginBottom: "1rem" }}>🎯 Goal type</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.8rem" }}>
            {GOAL_TYPES.map(goal => (
              <button
                key={goal.id}
                className={`appsettings-option-btn ${goalType === goal.id ? "active" : ""}`}
                onClick={() => setGoalType(goal.id)}
                style={{ padding: "1rem" }}
              >
                <span style={{ fontSize: "2rem" }}>{goal.emoji}</span>
                <span className="appsettings-option-label">{goal.name}</span>
                <span className="appsettings-option-sub">{goal.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Activity Level */}
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1.3rem", fontWeight: "700", color: "var(--primary, #3B82F6)", marginBottom: "1rem" }}>🏃 Activity level</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {ACTIVITY_LEVELS.map(level => (
              <button
                key={level.id}
                className={`appsettings-option-btn ${activityLevel === level.id ? "active" : ""}`}
                onClick={() => setActivityLevel(level.id)}
                style={{ display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: "0.8rem 1rem" }}
              >
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontWeight: "700", fontSize: "0.95rem" }}>{level.name}</div>
                  <div style={{ fontSize: "0.8rem", color: "#888" }}>{level.description}</div>
                </div>
                <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#666" }}>×{level.multiplier}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Recommended Macros */}
        {recommended && (
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem", background: "rgba(56, 142, 60, 0.08)", border: "1px solid rgba(56, 142, 60, 0.18)" }}>
            <h3 style={{ fontSize: "1.3rem", fontWeight: "700", color: "#2e7d32", marginBottom: "0.5rem" }}>🎖️ Recommended macronutrients</h3>
            <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "1rem" }}>Based on your goal and activity level</p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: "0.8rem" }}>
              <div style={{ padding: "0.8rem", background: "white", borderRadius: "10px", textAlign: "center", border: "2px solid #3B82F6" }}>
                <div style={{ fontSize: "0.75rem", color: "#666", marginBottom: "0.2rem" }}>Calories</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#3B82F6" }}>{recommended.calories}</div>
                <div style={{ fontSize: "0.7rem", color: "#888" }}>kcal/day</div>
              </div>
              <div style={{ padding: "0.8rem", background: "white", borderRadius: "10px", textAlign: "center", border: "2px solid #2196f3" }}>
                <div style={{ fontSize: "0.75rem", color: "#666", marginBottom: "0.2rem" }}>Protein (g)</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#2196f3" }}>{recommended.protein}g</div>
              </div>
              <div style={{ padding: "0.8rem", background: "white", borderRadius: "10px", textAlign: "center", border: "2px solid #3B82F6" }}>
                <div style={{ fontSize: "0.75rem", color: "#666", marginBottom: "0.2rem" }}>Carbohydrates (g)</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#3B82F6" }}>{recommended.carbs}g</div>
              </div>
              <div style={{ padding: "0.8rem", background: "white", borderRadius: "10px", textAlign: "center", border: "2px solid #f44336" }}>
                <div style={{ fontSize: "0.75rem", color: "#666", marginBottom: "0.2rem" }}>Fats (g)</div>
                <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#f44336" }}>{recommended.fat}g</div>
              </div>
            </div>
          </div>
        )}

        {/* Custom Targets (Optional) */}
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1.3rem", fontWeight: "700", color: "var(--primary, #3B82F6)", marginBottom: "0.5rem" }}>⚙️ Personalized Goals (Optional)</h3>
          <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "1rem" }}>Override automatic recommendations — leave empty to use calculations above</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "1rem" }}>
            <div>
              <label className="form-label">Calories (kcal/day)</label>
              <input type="number" className="form-input" value={customCalories} onChange={(e) => setCustomCalories(e.target.value)} placeholder={recommended ? recommended.calories : "2000"} />
            </div>
            <div>
              <label className="form-label">Protein (g)</label>
              <input type="number" className="form-input" value={customProtein} onChange={(e) => setCustomProtein(e.target.value)} placeholder={recommended ? recommended.protein : "150"} />
            </div>
            <div>
              <label className="form-label">Carbohydrates (g)</label>
              <input type="number" className="form-input" value={customCarbs} onChange={(e) => setCustomCarbs(e.target.value)} placeholder={recommended ? recommended.carbs : "200"} />
            </div>
            <div>
              <label className="form-label">Fats (g)</label>
              <input type="number" className="form-input" value={customFat} onChange={(e) => setCustomFat(e.target.value)} placeholder={recommended ? recommended.fat : "65"} />
            </div>
          </div>
        </div>

        {/* Weight Goal */}
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1.3rem", fontWeight: "700", color: "var(--primary, #3B82F6)", marginBottom: "1rem" }}>⚖️ Weight Goals</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label className="form-label">Target Weight (kg)</label>
              <input type="number" step="0.1" className="form-input" value={targetWeight} onChange={(e) => setTargetWeight(e.target.value)} placeholder="Ex: 75.0" />
            </div>
            <div>
              <label className="form-label">Weekly rate (kg/week)</label>
              <select className="form-input" value={weeklyGoal} onChange={(e) => setWeeklyGoal(e.target.value)}>
                <option value="-1">-1.0 kg (rapid weight loss)</option>
                <option value="-0.75">-0.75 kg</option>
                <option value="-0.5">-0.5 kg (recommended for weight loss)</option>
                <option value="-0.25">-0.25 kg</option>
                <option value="0">0 kg (maintenance)</option>
                <option value="0.25">+0.25 kg</option>
                <option value="0.5">+0.5 kg (recommended for gain)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Messages */}
        {success && (
          <div style={{ padding: "1rem", background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.3)", borderRadius: "8px", color: "#3B82F6", marginBottom: "1rem" }}>{success}</div>
        )}
        {error && (
          <div style={{ padding: "1rem", background: "rgba(244, 67, 54, 0.1)", border: "1px solid rgba(244, 67, 54, 0.3)", borderRadius: "8px", color: "#d32f2f", marginBottom: "1rem" }}>{error}</div>
        )}

        {/* Save Button */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ padding: "1rem 3rem", fontSize: "1.1rem", fontWeight: "700" }}>
            {saving ? "Saving..." : "💾 Save goals"}
          </button>
        </div>

        {/* Quick Links */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <button className="btn btn-secondary" onClick={() => onNavigate("weight-tracking")} style={{ padding: "1rem" }}>📊 Weight Tracking</button>
          <button className="btn btn-secondary" onClick={() => onNavigate("dashboard")} style={{ padding: "1rem" }}>📈 View Progress</button>
        </div>
      </div>
    </div>
  );
}








