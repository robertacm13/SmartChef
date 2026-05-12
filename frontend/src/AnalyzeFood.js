import React, { useState } from "react";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip as ChartTooltip,
  Legend
} from 'chart.js';
import CustomTooltip, { InfoIcon } from "./components/Tooltip";
import { getUserFriendlyError, ErrorDisplay } from "./utils/errorMessages";
import { useKeyboardShortcuts, ShortcutsHelp, ShortcutBadge } from "./utils/keyboardShortcuts";
import "./utils/keyboardShortcuts.css";
import Navbar from "./components/Navbar";
import { MdOutlineKeyboardArrowUp, MdOutlineKeyboardArrowDown } from "react-icons/md";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

function AnalyzeFood({ authToken, userEmail, onNavigate, onLogout, darkMode, toggleDarkMode, handleHelp }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [showNavDropdown, setShowNavDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userDropdownTimeout, setUserDropdownTimeout] = useState(null);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [userFriendlyError, setUserFriendlyError] = useState(null);
  const [showAddIngredientModal, setShowAddIngredientModal] = useState(false);
  const [newIngredientName, setNewIngredientName] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [editedIngredients, setEditedIngredients] = useState([]);
  const [ingredientSuggestions, setIngredientSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showScroll, setShowScroll] = useState(false);

  const nutrientColorMap = {
    calories: {
      label: "#F97316",
      background: "linear-gradient(90deg, #F97316, #FB923C)",
      fill: "rgba(249, 115, 22, 0.15)"
    },
    protein: {
      label: "#16A34A",
      background: "linear-gradient(90deg, #16A34A, #4ADE80)",
      fill: "rgba(22, 163, 74, 0.15)"
    },
    carbs: {
      label: "#2563EB",
      background: "linear-gradient(90deg, #2563EB, #38BDF8)",
      fill: "rgba(37, 99, 235, 0.15)"
    },
    fat: {
      label: "#7C3AED",
      background: "linear-gradient(90deg, #7C3AED, #A855F7)",
      fill: "rgba(124, 58, 237, 0.15)"
    },
    fiber: {
      label: "#0F766E",
      background: "linear-gradient(90deg, #0F766E, #2DD4BF)",
      fill: "rgba(15, 118, 110, 0.15)"
    }
  };

  const ingredientBarColors = [
    "rgba(239, 68, 68, 0.75)",
    "rgba(249, 115, 22, 0.75)",
    "rgba(245, 158, 11, 0.75)",
    "rgba(34, 197, 94, 0.75)",
    "rgba(14, 165, 233, 0.75)",
    "rgba(59, 130, 246, 0.75)",
    "rgba(168, 85, 247, 0.75)",
    "rgba(236, 72, 153, 0.75)"
  ];

  // Scroll event listener for showing scroll buttons
  React.useEffect(() => {
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
  }, [loading, results, previewUrl, showAddIngredientModal, showSuggestions, editedIngredients.length]);

  // Fetch unread notifications on component mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  React.useEffect(() => {
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
  }, [authToken, userEmail]);

  // Initialize edited ingredients when a new food is detected (not on nutrition recalculation)
  React.useEffect(() => {
    if (results && results.ingredients) {
      setEditedIngredients(results.ingredients.map(ing => ({
        name: ing,
        weight: 100 // default 100g
      })));
    }
  }, [results?.ingredients?.join(',')]); // Re-initialize when ingredient list changes

  // Keyboard shortcuts - Nielsen Heuristic #7
  useKeyboardShortcuts({
    'h': () => onNavigate('main'),
    's': () => onNavigate('history'),
    'd': () => onNavigate('dashboard'),
    't': () => toggleDarkMode(),
    'u': () => document.querySelector('input[type="file"]')?.click(),
    '?': () => setShowShortcuts(true),
    'Enter': () => { if (selectedFile && !loading) analyzeFood(); },
    'Escape': () => {
      if (selectedIngredient) setSelectedIngredient(null);
      else if (showShortcuts) setShowShortcuts(false);
    }
  });

  const handleUserMouseEnter = () => {
    if (userDropdownTimeout) clearTimeout(userDropdownTimeout);
    setShowUserDropdown(true);
  };

  const handleUserMouseLeave = () => {
    const timeout = setTimeout(() => setShowUserDropdown(false), 200);
    setUserDropdownTimeout(timeout);
  };

  const handleSettings = () => {
    onNavigate("app-settings");
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      handleFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        handleFile(file);
      } else {
        const friendlyError = getUserFriendlyError("Please upload an image file.");
        setUserFriendlyError(friendlyError);
      }
    }
  };

  const handleFile = (file) => {
    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setResults(null);
  };

  const analyzeFood = async () => {
    if (!selectedFile) {
      const friendlyError = getUserFriendlyError("No file selected");
      setUserFriendlyError(friendlyError);
      return;
    }

    setLoading(true);
    setUserFriendlyError(null);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const headers = {};
      if (authToken && userEmail) {
        headers['X-User-Email'] = userEmail;
      }
      
      const res = await fetch("http://127.0.0.1:8000/analyze_food/", {
        method: "POST",
        headers: headers,
        body: formData,
      });
      
      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }
      
      const data = await res.json();
      setResults(data);
      setUserFriendlyError(null);
      
      if (data.analysis_id) {
        console.log("✅ Analysis saved to database with ID:", data.analysis_id);
      }
    } catch (error) {
      console.error("Error analyzing food:", error);
      const friendlyError = getUserFriendlyError(error);
      setUserFriendlyError(friendlyError);
    } finally {
      setLoading(false);
    }
  };

  const handleIngredientClick = (ingredientName) => {
    const indNut = results.nutrition.individual_nutrition[ingredientName.toLowerCase()];
    if (indNut) {
      setSelectedIngredient({
        name: ingredientName,
        nutrition: indNut
      });
    }
  };

  const closeIngredientModal = () => {
    setSelectedIngredient(null);
  };

  const deleteIngredient = (ingredientName) => {
    const updatedIngredients = editedIngredients.filter(ing => ing.name !== ingredientName);
    setEditedIngredients(updatedIngredients);
    recalculateNutrition(updatedIngredients);
  };

  const handleAddIngredient = () => {
    if (!newIngredientName.trim()) {
      alert("⚠️ Please enter an ingredient!");
      return;
    }

    if (editedIngredients.some(ing => ing.name === newIngredientName.toLowerCase())) {
      alert("ℹ️ This ingredient is already in the list!");
      return;
    }

    const updatedIngredients = [...editedIngredients, { name: newIngredientName.toLowerCase(), weight: 100 }];
    setEditedIngredients(updatedIngredients);
    recalculateNutrition(updatedIngredients);
    setNewIngredientName("");
    setShowAddIngredientModal(false);
    setShowSuggestions(false);
    setIngredientSuggestions([]);
  };

  const formatFoodName = (foodName) => {
    if (!foodName) return "";

    const cleaned = String(foodName)
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/^[^a-zA-Z0-9]+/, "")
      .replace(/[_-]+/g, " ")
      .replace(/[^a-zA-Z0-9\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleaned) return "";

    return cleaned
      .split(" ")
      .filter(Boolean)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const handleIngredientInputChange = async (value) => {
    setNewIngredientName(value);

    if (value.trim().length === 0) {
      setShowSuggestions(false);
      setIngredientSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`http://127.0.0.1:8000/ingredient_suggestions/?search=${encodeURIComponent(value)}`);
      const data = await response.json();
      setIngredientSuggestions(data.suggestions || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Error fetching suggestions:", error);
    }
  };

  const selectSuggestion = (suggestion) => {
    setNewIngredientName(suggestion);
    setShowSuggestions(false);
  };

  const recalculateNutrition = async (ingredientsList) => {
    if (!results) return;

    try {
      // Convert ingredient objects to format backend expects
      const ingredientData = ingredientsList.map(ing => ({
        name: typeof ing === 'string' ? ing : ing.name,
        weight: typeof ing === 'string' ? 100 : (ing.weight || 100)
      }));

      // Get nutrition info for new ingredient list with weights
      const response = await fetch("http://127.0.0.1:8000/calculate_nutrition/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ingredients: ingredientData })
      });

      if (!response.ok) {
        console.error("Failed to recalculate nutrition");
        return;
      }

      const nutritionData = await response.json();

      // Update results with new nutrition data
      setResults({
        ...results,
        ingredients: ingredientsList.map(ing => typeof ing === 'string' ? ing : ing.name),
        nutrition: nutritionData
      });
    } catch (error) {
      console.error("Error recalculating nutrition:", error);
    }
  };

  const generatePDF = () => {
    if (!results) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const now = new Date();
    
    // Header
    doc.setFillColor(59, 130, 246);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text('SmartChef', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Food Analysis Report', pageWidth / 2, 25, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generated: ${now.toLocaleDateString('en-US')} ${now.toLocaleTimeString('en-US')}`, pageWidth / 2, 33, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    let yPos = 50;
    
    // Food Name - Clean up any non-alphabetic prefixes
    if (results.food_name && results.food_name !== "unknown") {
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246);
      const cleanFoodName = formatFoodName(results.food_name);
      doc.text(cleanFoodName, 15, yPos);
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      if (results.confidence) {
        doc.text('Confidence: ' + results.confidence + '%', 15, yPos + 7);
      }
      yPos += 15;
      doc.setTextColor(0, 0, 0);
    }
    
    // Detected Ingredients
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Detected Ingredients:', 15, yPos);
    yPos += 8;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const ingredientsText = results.ingredients.map(ing => 
      ing.charAt(0).toUpperCase() + ing.slice(1)
    ).join(', ');
    const splitIngredients = doc.splitTextToSize(ingredientsText, pageWidth - 30);
    doc.text(splitIngredients, 15, yPos);
    yPos += (splitIngredients.length * 6) + 10;
    
    // Total Nutritional Values
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Nutritional Values', 15, yPos);
    yPos += 7;
    
    const nutritionData = [
      ['Nutrient', 'Value'],
      ['Calories', `${Number(results.nutrition.total_nutrition.calories).toFixed(2)} kcal`],
      ['Protein', `${Number(results.nutrition.total_nutrition.protein).toFixed(2)} g`],
      ['Carbohydrates', `${Number(results.nutrition.total_nutrition.carbs).toFixed(2)} g`],
      ['Fat', `${Number(results.nutrition.total_nutrition.fat).toFixed(2)} g`],
      ['Fiber', `${Number(results.nutrition.total_nutrition.fiber).toFixed(2)} g`]
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [nutritionData[0]],
      body: nutritionData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246], textColor: 255, font: 'helvetica' },
      styles: { fontSize: 10, font: 'helvetica' },
      margin: { left: 15, right: 15 }
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
    
    // Individual Ingredient Nutritional Values
    if (results.nutrition.individual_nutrition) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Nutritional Values per Ingredient (per 100g)', 15, yPos);
      yPos += 7;
      
      const individualData = results.ingredients.map(ing => {
        const indNut = results.nutrition.individual_nutrition[ing.toLowerCase()];
        if (indNut) {
          return [
            ing.charAt(0).toUpperCase() + ing.slice(1),
            `${Number(indNut.calories).toFixed(2)} kcal`,
            `${Number(indNut.protein).toFixed(2)}g`,
            `${Number(indNut.carbs).toFixed(2)}g`,
            `${Number(indNut.fat).toFixed(2)}g`
          ];
        }
        return [ing, 'N/A', 'N/A', 'N/A', 'N/A'];
      });
      
      autoTable(doc, {
        startY: yPos,
        head: [['Ingredient', 'Calories', 'Protein', 'Carbohydrates', 'Fat']],
        body: individualData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246], textColor: 255, font: 'helvetica' },
        styles: { fontSize: 9, font: 'helvetica' },
        margin: { left: 15, right: 15 }
      });
    }
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Page ${i} of ${pageCount} | SmartChef (c) 2026`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    doc.save(`SmartChef-Analiza-${now.toISOString().slice(0,10)}.pdf`);
  };

  return (
    <div className="animated-bg" style={{ minHeight: "100vh", background: darkMode ? "#0F172A" : "var(--bg, #F1F5F9)", paddingBottom: "2rem" }}>
      {/* --- NAVBAR --- */}
      <Navbar 
        userEmail={userEmail}
        onBack={() => onNavigate("main")}
        onNavigate={onNavigate}
        onLogout={onLogout}
        darkMode={darkMode}
        toggleDarkMode={toggleDarkMode}
        handleHelp={handleHelp}
        currentPage="analyze-food"
      />

      {/* Main Content Container */}
      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "3rem 2rem" }}>
        {/* Back Button */}
        <button
          onClick={() => onNavigate("main")}
          style={{
            background: "transparent",
            border: "2px solid var(--primary)",
            color: "var(--primary)",
            padding: "0.7rem 1.5rem",
            borderRadius: "10px",
            cursor: "pointer",
            fontSize: "1rem",
            fontWeight: "600",
            marginBottom: "2rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}
        >
          ← Back
        </button>

        <div className="card" style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ 
            fontSize: "2rem", 
            marginBottom: "2rem", 
            color: "#3B82F6",
            textAlign: "center",
            fontWeight: "700"
          }}>
            📸 Upload a Food Image
          </h2>

          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />

          {!previewUrl ? (
            <label 
              htmlFor="file-upload" 
              className="upload-area"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              style={{
                border: isDragging ? "3px dashed #10B981" : "3px dashed #3B82F6",
                backgroundColor: isDragging ? "rgba(16, 185, 129, 0.1)" : "rgba(59, 130, 246, 0.05)",
                transition: "all 0.3s ease"
              }}
            >
              <div className="upload-icon" style={{ color: isDragging ? "#10B981" : "#3B82F6" }}>{isDragging ? "⬇️" : "📁"}</div>
              <p style={{ fontSize: "1.1rem", color: "#666", marginBottom: "0.5rem" }}>
                {isDragging ? "Drop image here" : "Click to select or drag and drop an image"}
              </p>
              <p style={{ fontSize: "0.9rem", color: "#999", display: "flex", alignItems: "center", gap: "4px", justifyContent: "center" }}>
                We accept JPG, PNG, JPEG
                <InfoIcon text="You can upload images in JPG, PNG or JPEG format. The maximum recommended size is 10MB. For best results, make sure the image is bright and the ingredients are visible." />
              </p>
            </label>
          ) : (
            <div>
              <div className="image-preview">
                <img src={previewUrl} alt="Food preview" />
              </div>
              <label htmlFor="file-upload">
                <div style={{
                  textAlign: "center",
                  marginTop: "1rem",
                  cursor: "pointer",
                  color: "#3B82F6",
                  fontWeight: "600",
                  fontSize: "1rem"
                }}>
                  🔄 Change Image
                </div>
              </label>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "center" }}>
            <CustomTooltip 
              text="Analyze the image and get detailed nutritional information"
              position="top"
            >
              <button
                className="btn btn-primary"
                onClick={analyzeFood}
                disabled={loading || !selectedFile}
                aria-label="Analyze food (Enter)"
                style={{
                  width: "100%",
                  maxWidth: "400px",
                  margin: "1.5rem auto",
                  padding: "1.3rem 2rem",
                  fontSize: "1.2rem",
                  opacity: loading || !selectedFile ? 0.6 : 1,
                  cursor: loading || !selectedFile ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  fontWeight: "700",
                  letterSpacing: "0.5px",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 15px rgba(59, 130, 246, 0.3)"
                }}
                onMouseEnter={(e) => {
                  if (!loading && selectedFile) {
                    e.target.style.transform = "translateY(-3px)";
                    e.target.style.boxShadow = "0 6px 20px rgba(59, 130, 246, 0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 15px rgba(59, 130, 246, 0.3)";
                }}
              >
                {loading ? "🔄 Analyzing..." : (
                  <>
                    🔍 Analyze Food
                    <ShortcutBadge shortcut="Enter" />
                  </>
                )}
              </button>
            </CustomTooltip>
          </div>

          {/* Error Display */}
          {userFriendlyError && (
            <ErrorDisplay error={userFriendlyError} onClose={() => setUserFriendlyError(null)} />
          )}

          {loading && (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <div className="spinner" style={{ margin: "0 auto" }}></div>
              <p style={{ marginTop: "1rem", color: "#666", fontSize: "1rem" }}>
                Analyzing image...
              </p>
              <div style={{ marginTop: "2rem" }}>
                <div className="skeleton skeleton-text" style={{ height: "30px", marginBottom: "1rem" }}></div>
                <div className="skeleton skeleton-text short" style={{ height: "20px", marginBottom: "2rem" }}></div>
                <div className="skeleton skeleton-card" style={{ height: "150px", marginBottom: "1rem" }}></div>
                <div className="skeleton skeleton-card" style={{ height: "200px" }}></div>
              </div>
            </div>
          )}

          {results && results.status === "success" && (
            <div className="results-container" style={{ animation: "fadeIn 0.8s ease-out" }}>
              <div className="results-header">
                ✅ Analysis Results
              </div>

              {results.analysis_id && (
                <p style={{ 
                  textAlign: "center", 
                  color: "#3B82F6", 
                  fontSize: "0.9rem",
                  marginBottom: "1rem",
                  fontWeight: "600"
                }}>
                  💾 Analysis saved to history!
                </p>
              )}

              {results.food_name && results.food_name !== "unknown" && (
                <div style={{ 
                  textAlign: "center", 
                  backgroundColor: "rgba(59, 130, 246, 0.08)", 
                  padding: "1rem", 
                  borderRadius: "12px", 
                  marginBottom: "1.5rem",
                  border: "2px solid #3B82F6"
                }}>
                  <h2 style={{ 
                    fontSize: "1.8rem", 
                    margin: "0", 
                    color: "#3B82F6",
                    textTransform: "capitalize"
                  }}>
                    🍽️ {formatFoodName(results.food_name)}
                  </h2>
                  {results.confidence && (
                    <p style={{ margin: "0.5rem 0 0 0", color: "#666", fontSize: "0.95rem" }}>
                      Confidence: {results.confidence}%
                    </p>
                  )}
                </div>
              )}

              <div style={{ marginBottom: "2rem" }}>
                <h3 style={{ fontSize: "1.3rem", marginBottom: "1rem", color: "#2e7d32" }}>
                  🥗 Detected Ingredients ({editedIngredients.length}):
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
                  {editedIngredients.map((ingredient, index) => (
                    <div
                      key={index}
                      style={{
                        background: "#f9f9f9",
                        border: "2px solid #3B82F6",
                        borderRadius: "12px",
                        padding: "1rem",
                        display: "flex",
                        flexDirection: "column",
                        gap: "0.5rem"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <span style={{ fontWeight: "700", fontSize: "1rem", color: "#333", textTransform: "capitalize" }}>
                          {ingredient.name}
                        </span>
                        <button
                          onClick={() => deleteIngredient(ingredient.name)}
                          style={{
                            background: "#e74c3c",
                            color: "white",
                            border: "none",
                            borderRadius: "50%",
                            width: "26px",
                            height: "26px",
                            cursor: "pointer",
                            fontSize: "0.9rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            padding: "0",
                            fontWeight: "bold",
                            transition: "all 0.2s ease"
                          }}
                          onMouseOver={(e) => e.target.style.background = "#c0392b"}
                          onMouseOut={(e) => e.target.style.background = "#e74c3c"}
                          title="Delete ingredient"
                        >
                          ×
                        </button>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <label style={{ fontSize: "0.85rem", color: "#666", fontWeight: "600", minWidth: "60px" }}>
                          Weight (g):
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="1000"
                          value={ingredient.weight}
                          onChange={(e) => {
                            const updatedIngredients = editedIngredients.map((ing, i) =>
                              i === index ? { ...ing, weight: parseInt(e.target.value) || 100 } : ing
                            );
                            setEditedIngredients(updatedIngredients);
                            recalculateNutrition(updatedIngredients);
                          }}
                          style={{
                            flex: 1,
                            padding: "0.5rem",
                            border: "1px solid #ddd",
                            borderRadius: "6px",
                            fontSize: "0.9rem",
                            fontWeight: "600",
                            color: "#3B82F6"
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setShowAddIngredientModal(true)}
                  style={{
                    marginTop: "1rem",
                    background: "#3B82F6",
                    color: "white",
                    border: "none",
                    padding: "0.7rem 1.5rem",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontSize: "1rem",
                    fontWeight: "600",
                    transition: "all 0.3s ease",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                  onMouseOver={(e) => e.target.style.background = "#45a049"}
                  onMouseOut={(e) => e.target.style.background = "#3B82F6"}
                  title="Add ingredient"
                >
                  ➕ Add Ingredient
                </button>
              </div>

              {/* Calculation Formulas Section */}
              {results.nutrition.calculation_formulas && results.nutrition.calculation_formulas.length > 0 && (
                <div style={{
                  background: "#f0f9ff",
                  border: "2px solid #3B82F6",
                  borderRadius: "12px",
                  padding: "1.5rem",
                  marginBottom: "2rem"
                }}>
                  <h3 style={{ fontSize: "1.2rem", marginBottom: "1rem", color: "#2563EB", fontWeight: "700" }}>
                    📐 Calculation Formula
                  </h3>
                  <div style={{ background: "white", padding: "1rem", borderRadius: "8px", marginBottom: "1rem", borderLeft: "4px solid #3B82F6" }}>
                    {results.nutrition.calculation_formulas.map((formula, idx) => (
                      <div key={idx} style={{ fontSize: "0.95rem", marginBottom: "0.5rem", color: "#333", fontFamily: "monospace" }}>
                        {formula}
                      </div>
                    ))}
                    {results.nutrition.total_formula && (
                      <div style={{
                        fontSize: "1rem",
                        fontWeight: "700",
                        color: "#059669",
                        marginTop: "1rem",
                        paddingTop: "0.75rem",
                        borderTop: "2px solid #e5e7eb"
                      }}>
                        {results.nutrition.total_formula}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Nutritional Charts */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem", marginBottom: "2rem" }}>
                {/* Pie Chart - Macronutrients */}
                <div className="nutrition-box" style={{ padding: "1.5rem" }}>
                  <h4 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "#333", textAlign: "center" }}>
                    🥧 Macronutrient Distribution
                  </h4>
                  <Pie 
                    data={{
                      labels: ['Protein', 'Carbohydrates', 'Fat'],
                      datasets: [{
                        data: [
                          results.nutrition.total_nutrition.protein,
                          results.nutrition.total_nutrition.carbs,
                          results.nutrition.total_nutrition.fat
                        ],
                        backgroundColor: [
                          'rgba(34, 197, 94, 0.85)',
                          'rgba(59, 130, 246, 0.85)',
                          'rgba(168, 85, 247, 0.85)'
                        ],
                        borderColor: [
                          'rgba(34, 197, 94, 1)',
                          'rgba(59, 130, 246, 1)',
                          'rgba(168, 85, 247, 1)'
                        ],
                        borderWidth: 2
                      }]
                    }}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'bottom'
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return context.label + ': ' + Number(context.parsed).toFixed(2) + 'g';
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>

                {/* Bar Chart - Comparație Ingrediente */}
                <div className="nutrition-box" style={{ padding: "1.5rem" }}>
                  <h4 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "#333", textAlign: "center" }}>
                    📊 Calories per Ingredient
                  </h4>
                  <Bar 
                    data={{
                      labels: results.ingredients.map(ing => ing.charAt(0).toUpperCase() + ing.slice(1)),
                      datasets: [{
                        label: 'Calories (kcal)',
                        data: results.ingredients.map(ing => {
                          const indNut = results.nutrition.individual_nutrition?.[ing.toLowerCase()];
                          return indNut?.calories || 0;
                        }),
                        backgroundColor: results.ingredients.map((_, index) => ingredientBarColors[index % ingredientBarColors.length]),
                        borderColor: results.ingredients.map((_, index) => ingredientBarColors[index % ingredientBarColors.length].replace('0.75', '1')),
                        borderWidth: 2
                      }]
                    }}
                    options={{
                      responsive: true,
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
              </div>

              <div className="nutrition-box">
                <h3 style={{ fontSize: "1.3rem", marginBottom: "1.5rem", color: "#3B82F6", textAlign: "center" }}>
                  📊 Total Nutritional Values
                </h3>

                {/* Progress Bars for nutrition */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "1rem", fontWeight: "600", color: "#333" }}>🔥 Calories</span>
                    <span style={{ fontSize: "1.1rem", fontWeight: "700", color: nutrientColorMap.calories.label }}>
                      {Number(results.nutrition.total_nutrition.calories).toFixed(2)} kcal
                    </span>
                  </div>
                  <div style={{ 
                    width: "100%", 
                    height: "12px", 
                    background: "#f0f0f0", 
                    borderRadius: "10px",
                    overflow: "hidden"
                  }}>
                    <div style={{ 
                      width: `${Math.min((results.nutrition.total_nutrition.calories / 800) * 100, 100)}%`, 
                      height: "100%", 
                      background: nutrientColorMap.calories.background,
                      transition: "width 0.8s ease",
                      borderRadius: "10px"
                    }}></div>
                  </div>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "1rem", fontWeight: "600", color: "#333" }}>💪 Protein</span>
                    <span style={{ fontSize: "1.1rem", fontWeight: "700", color: nutrientColorMap.protein.label }}>
                      {Number(results.nutrition.total_nutrition.protein).toFixed(2)}g
                    </span>
                  </div>
                  <div style={{ 
                    width: "100%", 
                    height: "12px", 
                    background: "#f0f0f0", 
                    borderRadius: "10px",
                    overflow: "hidden"
                  }}>
                    <div style={{ 
                      width: `${Math.min((results.nutrition.total_nutrition.protein / 50) * 100, 100)}%`, 
                      height: "100%", 
                      background: nutrientColorMap.protein.background,
                      transition: "width 0.8s ease",
                      borderRadius: "10px"
                    }}></div>
                  </div>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "1rem", fontWeight: "600", color: "#333" }}>🍞 Carbohydrates</span>
                    <span style={{ fontSize: "1.1rem", fontWeight: "700", color: nutrientColorMap.carbs.label }}>
                      {Number(results.nutrition.total_nutrition.carbs).toFixed(2)}g
                    </span>
                  </div>
                  <div style={{ 
                    width: "100%", 
                    height: "12px", 
                    background: "#f0f0f0", 
                    borderRadius: "10px",
                    overflow: "hidden"
                  }}>
                    <div style={{ 
                      width: `${Math.min((results.nutrition.total_nutrition.carbs / 100) * 100, 100)}%`, 
                      height: "100%", 
                      background: nutrientColorMap.carbs.background,
                      transition: "width 0.8s ease",
                      borderRadius: "10px"
                    }}></div>
                  </div>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "1rem", fontWeight: "600", color: "#333" }}>🥑 Fat</span>
                    <span style={{ fontSize: "1.1rem", fontWeight: "700", color: nutrientColorMap.fat.label }}>
                      {Number(results.nutrition.total_nutrition.fat).toFixed(2)}g
                    </span>
                  </div>
                  <div style={{ 
                    width: "100%", 
                    height: "12px", 
                    background: "#f0f0f0", 
                    borderRadius: "10px",
                    overflow: "hidden"
                  }}>
                    <div style={{ 
                      width: `${Math.min((results.nutrition.total_nutrition.fat / 50) * 100, 100)}%`, 
                      height: "100%", 
                      background: nutrientColorMap.fat.background,
                      transition: "width 0.8s ease",
                      borderRadius: "10px"
                    }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "1rem", fontWeight: "600", color: "#333" }}>🌾 Fibre</span>
                    <span style={{ fontSize: "1.1rem", fontWeight: "700", color: nutrientColorMap.fiber.label }}>
                      {Number(results.nutrition.total_nutrition.fiber).toFixed(2)}g
                    </span>
                  </div>
                  <div style={{ 
                    width: "100%", 
                    height: "12px", 
                    background: "#f0f0f0", 
                    borderRadius: "10px",
                    overflow: "hidden"
                  }}>
                    <div style={{ 
                      width: `${Math.min((results.nutrition.total_nutrition.fiber / 30) * 100, 100)}%`, 
                      height: "100%", 
                      background: nutrientColorMap.fiber.background,
                      transition: "width 0.8s ease",
                      borderRadius: "10px"
                    }}></div>
                  </div>
                </div>

                {/* Download Buttons */}
                <div style={{ display: "flex", gap: "1rem", marginTop: "2rem", justifyContent: "center" }}>
                  <CustomTooltip 
                    text="Generate a detailed PDF report with nutritional analysis"
                    position="top"
                  >
                    <button
                      className="btn btn-primary"
                      onClick={generatePDF}
                      aria-label="Download PDF report"
                      style={{ 
                        flex: 1,
                        padding: "1rem",
                        fontSize: "1rem"
                      }}
                    >
                      📝 Download PDF Report
                    </button>
                  </CustomTooltip>
                  <CustomTooltip 
                    text="Export raw data in JSON format for further processing"
                    position="top"
                  >
                    <button
                      className="btn btn-outline"
                      onClick={() => {
                        const dataStr = JSON.stringify(results, null, 2);
                        const dataBlob = new Blob([dataStr], { type: 'application/json' });
                        const url = URL.createObjectURL(dataBlob);
                        const link = document.createElement('a');
                        link.href = url;
                        link.download = `smartchef-analiza-${new Date().toISOString().slice(0,10)}.json`;
                        link.click();
                        URL.revokeObjectURL(url);
                      }}
                      aria-label="Download JSON"
                      style={{ 
                        flex: 1,
                        padding: "1rem",
                        fontSize: "1rem",
                        color: "#3B82F6",
                        fontWeight: "600"
                      }}
                    >
                      📊 Download JSON
                    </button>
                  </CustomTooltip>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ingredient Nutrition Modal */}
      {selectedIngredient && (
        <div className="ingredient-modal-overlay" onClick={closeIngredientModal}>
          <div className="ingredient-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={closeIngredientModal}>
              ✕
            </button>
            <h2 className="modal-title">
              🥗 {selectedIngredient.name.charAt(0).toUpperCase() + selectedIngredient.name.slice(1)}
            </h2>
            <div className="modal-subtitle">Nutritional Values (per 100g)</div>
            
            <div className="modal-nutrition-bars">
              <div className="modal-nutrition-item">
                <div className="modal-nutrition-label">
                  <span>🔥 Calories</span>
                  <span className="modal-nutrition-value">{Number(selectedIngredient.nutrition.calories).toFixed(2)} kcal</span>
                </div>
                <div className="modal-progress-bar">
                  <div 
                    className="modal-progress-fill calories-fill"
                    style={{width: `${Math.min((selectedIngredient.nutrition.calories / 500) * 100, 100)}%`}}
                  ></div>
                </div>
              </div>

              <div className="modal-nutrition-item">
                <div className="modal-nutrition-label">
                  <span>💪 Protein</span>
                  <span className="modal-nutrition-value">{Number(selectedIngredient.nutrition.protein).toFixed(2)}g</span>
                </div>
                <div className="modal-progress-bar">
                  <div 
                    className="modal-progress-fill protein-fill"
                    style={{width: `${Math.min((selectedIngredient.nutrition.protein / 50) * 100, 100)}%`}}
                  ></div>
                </div>
              </div>

              <div className="modal-nutrition-item">
                <div className="modal-nutrition-label">
                  <span>🍞 Carbohydrates</span>
                  <span className="modal-nutrition-value">{Number(selectedIngredient.nutrition.carbs).toFixed(2)}g</span>
                </div>
                <div className="modal-progress-bar">
                  <div 
                    className="modal-progress-fill carbs-fill"
                    style={{width: `${Math.min((selectedIngredient.nutrition.carbs / 100) * 100, 100)}%`}}
                  ></div>
                </div>
              </div>

              <div className="modal-nutrition-item">
                <div className="modal-nutrition-label">
                  <span>🥑 Fat</span>
                  <span className="modal-nutrition-value">{Number(selectedIngredient.nutrition.fat).toFixed(2)}g</span>
                </div>
                <div className="modal-progress-bar">
                  <div 
                    className="modal-progress-fill fat-fill"
                    style={{width: `${Math.min((selectedIngredient.nutrition.fat / 50) * 100, 100)}%`}}
                  ></div>
                </div>
              </div>

              <div className="modal-nutrition-item">
                <div className="modal-nutrition-label">
                  <span>🌾 Fibre</span>
                  <span className="modal-nutrition-value">{Number(selectedIngredient.nutrition.fiber).toFixed(2)}g</span>
                </div>
                <div className="modal-progress-bar">
                  <div 
                    className="modal-progress-fill fiber-fill"
                    style={{width: `${Math.min((selectedIngredient.nutrition.fiber / 20) * 100, 100)}%`}}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Ingredient Modal */}
      {showAddIngredientModal && (
        <div className="ingredient-modal-overlay" onClick={() => {
          setShowAddIngredientModal(false);
          setShowSuggestions(false);
        }}>
          <div className="ingredient-modal" onClick={(e) => e.stopPropagation()}>
            <button 
              className="modal-close" 
              onClick={() => {
                setShowAddIngredientModal(false);
                setNewIngredientName("");
                setShowSuggestions(false);
                setIngredientSuggestions([]);
              }}
            >
              ✕
            </button>
            <h2 className="modal-title">➕ Add Ingredient</h2>
            <div className="modal-subtitle">Enter ingredient name</div>
            
            <div style={{ padding: "1.5rem 0", position: "relative" }}>
              <input
                type="text"
                value={newIngredientName}
                onChange={(e) => handleIngredientInputChange(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    handleAddIngredient();
                  }
                }}
                onFocus={() => {
                  if (newIngredientName.trim().length > 0) {
                    setShowSuggestions(true);
                  }
                }}
                placeholder="e.g. broccoli, apple, rice..."
                style={{
                  width: "100%",
                  padding: "0.8rem",
                  fontSize: "1rem",
                  border: "2px solid #3B82F6",
                  borderRadius: "8px",
                  boxSizing: "border-box",
                  marginBottom: "0.5rem"
                }}
              />
              
              {/* Autocomplete Suggestions Dropdown */}
              {showSuggestions && ingredientSuggestions.length > 0 && (
                <div style={{
                  position: "absolute",
                  top: "60px",
                  left: 0,
                  right: 0,
                  background: "white",
                  border: "2px solid #3B82F6",
                  borderRadius: "8px",
                  maxHeight: "250px",
                  overflowY: "auto",
                  zIndex: 1000,
                  boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
                }}>
                  {ingredientSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      onClick={() => selectSuggestion(suggestion)}
                      style={{
                        padding: "0.8rem",
                        borderBottom: index < ingredientSuggestions.length - 1 ? "1px solid #e0e0e0" : "none",
                        cursor: "pointer",
                        backgroundColor: newIngredientName.toLowerCase() === suggestion.toLowerCase() ? "#e3f2fd" : "white",
                        transition: "background-color 0.2s ease"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = "#f0f4f8";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = newIngredientName.toLowerCase() === suggestion.toLowerCase() ? "#e3f2fd" : "white";
                      }}
                    >
                      <span style={{ fontSize: "0.95rem", color: "#333", fontWeight: "500" }}>
                        🥬 {suggestion}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              
              <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                <button
                  onClick={handleAddIngredient}
                  style={{
                    flex: 1,
                    background: "#3B82F6",
                    color: "white",
                    border: "none",
                    padding: "0.8rem",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "1rem",
                    fontWeight: "600",
                    transition: "all 0.3s ease"
                  }}
                  onMouseOver={(e) => e.target.style.background = "#45a049"}
                  onMouseOut={(e) => e.target.style.background = "#3B82F6"}
                >
                  ✓ Add
                </button>
                <button
                  onClick={() => {
                    setShowAddIngredientModal(false);
                    setNewIngredientName("");
                    setShowSuggestions(false);
                    setIngredientSuggestions([]);
                  }}
                  style={{
                    flex: 1,
                    background: "#f44336",
                    color: "white",
                    border: "none",
                    padding: "0.8rem",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "1rem",
                    fontWeight: "600",
                    transition: "all 0.3s ease"
                  }}
                  onMouseOver={(e) => e.target.style.background = "#da190b"}
                  onMouseOut={(e) => e.target.style.background = "#f44336"}
                >
                  ✕ Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help Modal */}
      {showShortcuts && (
        <ShortcutsHelp
          onClose={() => setShowShortcuts(false)}
          customShortcuts={{
            'u': { description: 'Trigger image upload', action: 'upload-image' },
            'Enter': { description: 'Analyze the uploaded image', action: 'submit' },
            'Escape': { description: 'Close modals / Cancel', action: 'cancel' }
          }}
        />
      )}

      <div
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.5rem",
          zIndex: 1100,
          opacity: showScroll ? 1 : 0.92
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
    </div>
  );
}

export default AnalyzeFood;



