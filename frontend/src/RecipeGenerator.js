import { useState, useEffect } from "react";
import { MdOutlineKeyboardArrowUp, MdOutlineKeyboardArrowDown } from "react-icons/md";
import "./App.css";
import Navbar from "./components/Navbar";

export default function RecipeGenerator({ userEmail, onBack, onLogout, onNavigate, darkMode, toggleDarkMode, handleHelp }) {
  const [ingredients, setIngredients] = useState("");
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState([]);
  const [error, setError] = useState("");
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showScroll, setShowScroll] = useState(false);
  const [groceryList, setGroceryList] = useState(() => {
    const saved = localStorage.getItem("groceryList");
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem("groceryList", JSON.stringify(groceryList));
  }, [groceryList]);

  // Scroll visibility management
  useEffect(() => {
    const updateScrollVisibility = () => {
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      setShowScroll(scrollableHeight > 0);
    };

    updateScrollVisibility();
    window.addEventListener("scroll", updateScrollVisibility);
    window.addEventListener("resize", updateScrollVisibility);
    
    return () => {
      window.removeEventListener("scroll", updateScrollVisibility);
      window.removeEventListener("resize", updateScrollVisibility);
    };
  }, [recipes, selectedRecipe, groceryList, loading]);

  // Fetch unread notifications
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

  const handleGenerate = async () => {
    if (!ingredients.trim()) {
      setError("Please enter some ingredients.");
      return;
    }

    setLoading(true);
    setError("");
    setRecipes([]);
    setSelectedRecipe(null);

    const ingredientsList = ingredients.split(",").map(i => i.trim()).filter(i => i);

    try {
      const res = await fetch(`http://localhost:8000/generate_recipes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: ingredientsList })
      });

      const data = await res.json();

      if (data.status === "success") {
        setRecipes(data.recipes);
      } else {
        setError("Could not generate recipes.");
      }
    } catch (err) {
      console.error("Error generating recipes:", err);
      setError("Error generating recipes.");
    } finally {
      setLoading(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const scrollToBottom = () => {
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: "smooth" });
  };

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
        currentPage="recipe-generator"
      />

      <a href="#main-content" className="skip-link">Skip to main content</a>
      
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "6rem 2rem 2rem 2rem" }} id="main-content">
        <button
          className="btn btn-secondary"
          onClick={onBack}
          style={{ marginBottom: "2rem" }}
        >
          ← Back
        </button>

        <div className="card" style={{ padding: "2rem", marginBottom: "1.5rem", textAlign: "center" }}>
          <h1 style={{ fontSize: "2.5rem", fontWeight: "700", color: "var(--primary, #3B82F6)", marginBottom: "0.5rem" }}>🍳 Recipe Generator</h1>
          <p style={{ color: "#666", fontSize: "1rem" }}>Enter the ingredients you have and find out what you can cook!</p>
        </div>

        {/* Input Section */}
        <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1.3rem", fontWeight: "700", color: "var(--primary, #3B82F6)", marginBottom: "1rem" }}>📝 Your Ingredients</h3>
          <textarea
            className="form-input"
            rows="4"
            placeholder="Enter ingredients separated by commas (e.g., eggs, tomato, cheese, pasta)"
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            style={{ width: "100%", resize: "vertical", padding: "0.75rem" }}
          />
          
          {error && (
            <p style={{ color: "#EF4444", fontSize: "0.9rem", marginTop: "0.5rem" }}>{error}</p>
          )}

          <div style={{ textAlign: "center", marginTop: "1rem" }}>
            <button 
              className="btn btn-primary" 
              onClick={handleGenerate} 
              disabled={loading}
              style={{ padding: "0.75rem 2rem", fontSize: "1rem", fontWeight: "700" }}
            >
              {loading ? "Generating..." : "✨ Generate Recipes"}
            </button>
          </div>
        </div>

        {/* Grocery List Section */}
        {groceryList.length > 0 && (
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.3rem", fontWeight: "700", color: "var(--primary, #3B82F6)" }}>🛒 Your Grocery List</h3>
              <button
                onClick={() => setGroceryList([])}
                style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer", fontSize: "0.9rem" }}
              >
                Clear All
              </button>
            </div>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {groceryList.map((ing, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: darkMode ? "#1E293B" : "#F1F5F9", padding: "0.5rem 0.75rem", borderRadius: "20px", color: darkMode ? "#E2E8F0" : "#1E293B" }}>
                  <span>{ing}</span>
                  <button
                    onClick={() => setGroceryList(groceryList.filter(item => item !== ing))}
                    style={{ background: "none", border: "none", color: "#64748B", cursor: "pointer", fontSize: "0.9rem" }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results Section */}
        {recipes.length > 0 && (
          <div className="card" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1.3rem", fontWeight: "700", color: "var(--primary, #3B82F6)", marginBottom: "1rem" }}>📖 Suggested Recipes</h3>
            
            {!selectedRecipe ? (
              <div style={{ display: "grid", gap: "1rem" }}>
                {recipes.map((recipe, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedRecipe(recipe)}
                    style={{
                      width: "100%",
                      textAlign: "left",
                      padding: "1rem",
                      background: darkMode ? "#1E293B" : "#F8FAFC",
                      border: "1px solid",
                      borderColor: darkMode ? "#334155" : "#E2E8F0",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontSize: "1.1rem",
                      fontWeight: "600",
                      color: darkMode ? "#E2E8F0" : "#1E293B",
                      transition: "all 0.2s"
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.background = darkMode ? "#334155" : "#E2E8F0";
                      e.currentTarget.style.transform = "translateY(-2px)";
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.background = darkMode ? "#1E293B" : "#F8FAFC";
                      e.currentTarget.style.transform = "translateY(0)";
                    }}
                  >
                    🍽️ {recipe.name}
                  </button>
                ))}
              </div>
            ) : (
              <div>
                <button 
                  onClick={() => setSelectedRecipe(null)}
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
                <h4 style={{ fontSize: "1.4rem", fontWeight: "700", marginBottom: "0.5rem" }}>{selectedRecipe.name}</h4>
                <div style={{ 
                  fontSize: "0.95rem", 
                  color: darkMode ? "#CBD5E1" : "#555",
                  background: darkMode ? "#1E293B" : "#F8FAFC",
                  padding: "1rem",
                  borderRadius: "8px",
                  border: darkMode ? "1px solid #334155" : "1px solid #E2E8F0"
                }}>
                  {selectedRecipe.recipe.split(/(?=\d+\.)/).map((step, idx) => (
                    <p key={idx} style={{ marginBottom: "0.5rem" }}>{step.trim()}</p>
                  ))}
                </div>

                {/* Missing Ingredients */}
                {selectedRecipe.missing_ingredients && selectedRecipe.missing_ingredients.length > 0 && (
                  <div style={{ marginTop: "1rem", padding: "1rem", background: darkMode ? "#334155" : "#FFFBEB", borderRadius: "8px", border: "1px solid #FDE68A" }}>
                    <h5 style={{ fontSize: "1rem", fontWeight: "700", color: "#D97706", marginBottom: "0.5rem" }}>🛒 Missing Ingredients:</h5>
                    <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                      {selectedRecipe.missing_ingredients.map((ing, idx) => (
                        <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem", background: darkMode ? "#1E293B" : "white", padding: "0.25rem 0.75rem", borderRadius: "15px", border: "1px solid #FDE68A", color: darkMode ? "#E2E8F0" : "#1E293B" }}>
                          <span>{ing}</span>
                          <button
                            onClick={() => {
                              if (!groceryList.includes(ing)) {
                                setGroceryList([...groceryList, ing]);
                              }
                            }}
                            style={{ background: "none", border: "none", color: "#3B82F6", cursor: "pointer", fontSize: "1rem", padding: 0 }}
                          >
                            +
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scroll Buttons */}
      <div style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.5rem",
        zIndex: 100
      }}>
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Scroll to top"
          style={{
            padding: "0.75rem",
            background: "#3B82F6",
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
            e.target.style.background = "#2563EB";
            e.target.style.transform = "translateY(-3px)";
            e.target.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.5)";
          }}
          onMouseOut={(e) => {
            e.target.style.background = "#3B82F6";
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 15px rgba(59, 130, 246, 0.4)";
          }}
        >
          <MdOutlineKeyboardArrowUp style={{ width: "1.5rem", height: "1.5rem" }} />
        </button>
        <button 
          onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
          aria-label="Scroll to bottom"
          style={{
            padding: "0.75rem",
            background: "#3B82F6",
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
            e.target.style.background = "#2563EB";
            e.target.style.transform = "translateY(3px)";
            e.target.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.5)";
          }}
          onMouseOut={(e) => {
            e.target.style.background = "#3B82F6";
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 15px rgba(59, 130, 246, 0.4)";
          }}
        >
          <MdOutlineKeyboardArrowDown style={{ width: "1.5rem", height: "1.5rem" }} />
        </button>
      </div>
    </div>
  );
}
