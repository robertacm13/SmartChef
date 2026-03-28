import React, { useState } from "react";
import jsPDF from "jspdf";
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
import "./utils/errorMessages.css";
import { useKeyboardShortcuts, ShortcutsHelp, ShortcutBadge } from "./utils/keyboardShortcuts";
import "./utils/keyboardShortcuts.css";

ChartJS.register(
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartTooltip,
  Legend
);

function AnalyzeFood({ authToken, userEmail, onNavigate, onLogout, darkMode, toggleDarkMode }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [showNavDropdown, setShowNavDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userDropdownTimeout, setUserDropdownTimeout] = useState(null);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [userFriendlyError, setUserFriendlyError] = useState(null);

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

  const handleHelp = () => {
    alert("❓ Help & Support\n\nFor assistance:\n📧 Email: support@smartchef.ro\n Report bugs on GitHub\n\nQuick Tips:\n- Upload clear food images\n- Use dark mode for better viewing\n- Export analyses as PDF\n- Mark favorites with ⭐");
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      setResults(null);
    }
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

  const generatePDF = () => {
    if (!results) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const now = new Date();
    
    // Header
    doc.setFillColor(255, 107, 53);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(26);
    doc.setFont('helvetica', 'bold');
    doc.text('SmartChef', pageWidth / 2, 15, { align: 'center' });
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Raport Analiza Alimentara', pageWidth / 2, 25, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Generat: ${now.toLocaleDateString('ro-RO')} ${now.toLocaleTimeString('ro-RO')}`, pageWidth / 2, 33, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    let yPos = 50;
    
    // Food Name
    if (results.food_name && results.food_name !== "unknown") {
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(255, 107, 53);
      doc.text('🍽️ ' + results.food_name.replace(/_/g, ' ').toUpperCase(), 15, yPos);
      doc.setTextColor(100, 100, 100);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      if (results.confidence) {
        doc.text('Confidence: ' + results.confidence + '%', 15, yPos + 7);
      }
      yPos += 15;
      doc.setTextColor(0, 0, 0);
    }
    
    // Ingrediente
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Ingrediente Detectate:', 15, yPos);
    yPos += 8;
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const ingredientsText = results.ingredients.map(ing => 
      ing.charAt(0).toUpperCase() + ing.slice(1)
    ).join(', ');
    const splitIngredients = doc.splitTextToSize(ingredientsText, pageWidth - 30);
    doc.text(splitIngredients, 15, yPos);
    yPos += (splitIngredients.length * 6) + 10;
    
    // Valori nutritionale totale
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Valori Nutritionale Totale', 15, yPos);
    yPos += 7;
    
    const nutritionData = [
      ['Nutrient', 'Valoare'],
      ['Calorii', `${Number(results.nutrition.total_nutrition.calories).toFixed(2)} kcal`],
      ['Proteine', `${Number(results.nutrition.total_nutrition.protein).toFixed(2)} g`],
      ['Carbohidrati', `${Number(results.nutrition.total_nutrition.carbs).toFixed(2)} g`],
      ['Grasimi', `${Number(results.nutrition.total_nutrition.fat).toFixed(2)} g`],
      ['Fibre', `${Number(results.nutrition.total_nutrition.fiber).toFixed(2)} g`]
    ];
    
    autoTable(doc, {
      startY: yPos,
      head: [nutritionData[0]],
      body: nutritionData.slice(1),
      theme: 'grid',
      headStyles: { fillColor: [255, 107, 53], textColor: 255, font: 'helvetica' },
      styles: { fontSize: 10, font: 'helvetica' },
      margin: { left: 15, right: 15 }
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
    
    // Detalii ingrediente individuale
    if (results.nutrition.individual_nutrition) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Valori Nutritionale pe Ingredient (per 100g)', 15, yPos);
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
        head: [['Ingredient', 'Calorii', 'Proteine', 'Carbohidrati', 'Grasimi']],
        body: individualData,
        theme: 'striped',
        headStyles: { fillColor: [255, 107, 53], textColor: 255, font: 'helvetica' },
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
        `Pagina ${i} din ${pageCount} | SmartChef (c) 2026`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    doc.save(`SmartChef-Analiza-${now.toISOString().slice(0,10)}.pdf`);
  };

  return (
    <div className="animated-bg" style={{ minHeight: "100vh" }}>
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo" onClick={() => onNavigate("main")} style={{ cursor: "pointer" }}>
            🍳 SmartChef
          </div>
          <div className="nav-buttons">
            {authToken && (
              <>
                <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", marginLeft: "auto", marginRight: "-0.5rem" }}>
                  {/* Navigation Dropdown */}
                  <div 
                    style={{ position: "relative" }}
                    onMouseEnter={() => setShowNavDropdown(true)}
                    onMouseLeave={() => setShowNavDropdown(false)}
                  >
                    <button
                      className="btn btn-outline"
                      style={{ padding: "0.7rem 1.2rem", fontSize: "1.5rem" }}
                    >
                      ☰
                    </button>
                    {showNavDropdown && (
                      <div className="nav-dropdown">
                        <button
                          className="nav-dropdown-item"
                          onClick={() => {
                            onNavigate("dashboard");
                            setShowNavDropdown(false);
                          }}
                        >
                          📈 Dashboard
                        </button>
                        <button
                          className="nav-dropdown-item"
                          onClick={() => {
                            onNavigate("history");
                            setShowNavDropdown(false);
                          }}
                        >
                          📊 Istoric
                        </button>
                        <button
                          className="nav-dropdown-item"
                          onClick={() => {
                            onNavigate("goals");
                            setShowNavDropdown(false);
                          }}
                        >
                          🎯 Obiective
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
                          onNavigate("personal-data");
                          setShowUserDropdown(false);
                        }}>
                          <span className="dropdown-icon">📊</span>
                          Date personale
                        </button>
                        
                        <button className="user-dropdown-item" onClick={() => {
                          onNavigate("account-settings");
                          setShowUserDropdown(false);
                        }}>
                          <span className="dropdown-icon">🔑</span>
                          Setările contului
                        </button>

                        <button className="user-dropdown-item" onClick={() => {
                          onNavigate("app-settings");
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
              </>
            )}
          </div>
        </div>
      </header>

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
          ← Înapoi la pagina principală
        </button>

        <div className="card" style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ 
            fontSize: "2rem", 
            marginBottom: "2rem", 
            color: "#ff6b35",
            textAlign: "center",
            fontWeight: "700"
          }}>
            📸 Încarcă o imagine cu mâncare
          </h2>

          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: "none" }}
          />

          {!previewUrl ? (
            <label htmlFor="file-upload" className="upload-area">
              <div className="upload-icon">📁</div>
              <p style={{ fontSize: "1.1rem", color: "#666", marginBottom: "0.5rem" }}>
                Click pentru a selecta o imagine
              </p>
              <p style={{ fontSize: "0.9rem", color: "#999", display: "flex", alignItems: "center", gap: "4px", justifyContent: "center" }}>
                Acceptăm JPG, PNG, JPEG
                <InfoIcon text="Poți încărca imagini în format JPG, PNG sau JPEG. Dimensiunea maximă recomandată este 10MB. Pentru cele mai bune rezultate, asigură-te că imaginea este luminoasă și ingredientele sunt vizibile." />
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
                  color: "#ff6b35",
                  fontWeight: "600",
                  fontSize: "1rem"
                }}>
                  🔄 Schimbă imaginea
                </div>
              </label>
            </div>
          )}

          <CustomTooltip 
            text="Analizează imaginea și obține informații nutriționale detaliate"
            position="top"
          >
            <button
              className="btn btn-primary"
              onClick={analyzeFood}
              disabled={loading || !selectedFile}
              aria-label="Analizează alimentul (Enter)"
              style={{
                width: "100%",
                padding: "1.2rem",
                fontSize: "1.1rem",
                marginTop: "1.5rem",
                opacity: loading || !selectedFile ? 0.6 : 1,
                cursor: loading || !selectedFile ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem"
              }}
            >
              {loading ? "🔄 Se analizează..." : (
                <>
                  🔍 Analizează Alimentul
                  <ShortcutBadge shortcut="Enter" />
                </>
              )}
            </button>
          </CustomTooltip>

          {/* Error Display */}
          {userFriendlyError && (
            <ErrorDisplay error={userFriendlyError} onClose={() => setUserFriendlyError(null)} />
          )}

          {loading && (
            <div style={{ textAlign: "center", padding: "2rem 0" }}>
              <div className="spinner" style={{ margin: "0 auto" }}></div>
              <p style={{ marginTop: "1rem", color: "#666", fontSize: "1rem" }}>
                Se analizează imaginea...
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
                ✅ Rezultate Analiză
              </div>

              {results.analysis_id && (
                <p style={{ 
                  textAlign: "center", 
                  color: "#4CAF50", 
                  fontSize: "0.9rem",
                  marginBottom: "1rem",
                  fontWeight: "600"
                }}>
                  💾 Analiza a fost salvată în istoric!
                </p>
              )}

              {results.food_name && results.food_name !== "unknown" && (
                <div style={{ 
                  textAlign: "center", 
                  backgroundColor: "#fff3e0", 
                  padding: "1rem", 
                  borderRadius: "12px", 
                  marginBottom: "1.5rem",
                  border: "2px solid #ff9800"
                }}>
                  <h2 style={{ 
                    fontSize: "1.8rem", 
                    margin: "0", 
                    color: "#ff6b35",
                    textTransform: "capitalize"
                  }}>
                    🍽️ {results.food_name.replace(/_/g, ' ')}
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
                  🥗 Ingrediente Detectate ({results.ingredients.length}):
                </h3>
                <div>
                  {results.ingredients.map((ingredient, index) => (
                    <span 
                      key={index} 
                      className="ingredient-badge clickable"
                      onClick={() => handleIngredientClick(ingredient)}
                      title="Click pentru detalii nutriționale"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              </div>

              {/* Grafice Nutriționale */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "2rem", marginBottom: "2rem" }}>
                {/* Pie Chart - Macronutrienți */}
                <div className="nutrition-box" style={{ padding: "1.5rem" }}>
                  <h4 style={{ fontSize: "1.1rem", marginBottom: "1rem", color: "#333", textAlign: "center" }}>
                    🥧 Distribuție Macronutrienți
                  </h4>
                  <Pie 
                    data={{
                      labels: ['Proteine', 'Carbohidrați', 'Grăsimi'],
                      datasets: [{
                        data: [
                          results.nutrition.total_nutrition.protein,
                          results.nutrition.total_nutrition.carbs,
                          results.nutrition.total_nutrition.fat
                        ],
                        backgroundColor: [
                          'rgba(76, 175, 80, 0.8)',
                          'rgba(33, 150, 243, 0.8)',
                          'rgba(255, 193, 7, 0.8)'
                        ],
                        borderColor: [
                          'rgba(76, 175, 80, 1)',
                          'rgba(33, 150, 243, 1)',
                          'rgba(255, 193, 7, 1)'
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
                    📊 Calorii pe Ingredient
                  </h4>
                  <Bar 
                    data={{
                      labels: results.ingredients.map(ing => ing.charAt(0).toUpperCase() + ing.slice(1)),
                      datasets: [{
                        label: 'Calorii (kcal)',
                        data: results.ingredients.map(ing => {
                          const indNut = results.nutrition.individual_nutrition?.[ing.toLowerCase()];
                          return indNut?.calories || 0;
                        }),
                        backgroundColor: 'rgba(255, 107, 53, 0.7)',
                        borderColor: 'rgba(255, 107, 53, 1)',
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
                            text: 'Calorii (kcal)'
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>

              <div className="nutrition-box">
                <h3 style={{ fontSize: "1.3rem", marginBottom: "1.5rem", color: "#ff6b35", textAlign: "center" }}>
                  📊 Valori Nutriționale Totale
                </h3>

                {/* Progress Bars pentru nutriție */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "1rem", fontWeight: "600", color: "#333" }}>🔥 Calorii</span>
                    <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "#ff6b35" }}>
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
                      background: "linear-gradient(90deg, #ff6b35, #ff8c42)",
                      transition: "width 0.8s ease",
                      borderRadius: "10px"
                    }}></div>
                  </div>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "1rem", fontWeight: "600", color: "#333" }}>💪 Proteine</span>
                    <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "#4CAF50" }}>
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
                      background: "linear-gradient(90deg, #4CAF50, #66BB6A)",
                      transition: "width 0.8s ease",
                      borderRadius: "10px"
                    }}></div>
                  </div>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "1rem", fontWeight: "600", color: "#333" }}>🍞 Carbohidrați</span>
                    <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "#2196F3" }}>
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
                      background: "linear-gradient(90deg, #2196F3, #42A5F5)",
                      transition: "width 0.8s ease",
                      borderRadius: "10px"
                    }}></div>
                  </div>
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "1rem", fontWeight: "600", color: "#333" }}>🥑 Grăsimi</span>
                    <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "#FFC107" }}>
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
                      background: "linear-gradient(90deg, #FFC107, #FFD54F)",
                      transition: "width 0.8s ease",
                      borderRadius: "10px"
                    }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "1rem", fontWeight: "600", color: "#333" }}>🌾 Fibre</span>
                    <span style={{ fontSize: "1.1rem", fontWeight: "700", color: "#8BC34A" }}>
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
                      background: "linear-gradient(90deg, #8BC34A, #9CCC65)",
                      transition: "width 0.8s ease",
                      borderRadius: "10px"
                    }}></div>
                  </div>
                </div>

                {/* Butoane Download */}
                <div style={{ display: "flex", gap: "1rem", marginTop: "2rem", justifyContent: "center" }}>
                  <CustomTooltip 
                    text="Generează un raport PDF detaliat cu analiza nutrițională"
                    position="top"
                  >
                    <button
                      className="btn btn-primary"
                      onClick={generatePDF}
                      aria-label="Descarcă raport PDF"
                      style={{ 
                        flex: 1,
                        padding: "1rem",
                        fontSize: "1rem"
                      }}
                    >
                      📝 Descarcă Raport PDF
                    </button>
                  </CustomTooltip>
                  <CustomTooltip 
                    text="Exportă datele brute în format JSON pentru procesare ulterioară"
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
                      aria-label="Descarcă JSON"
                      style={{ 
                        flex: 1,
                        padding: "1rem",
                        fontSize: "1rem",
                        color: "#ff6b35",
                        fontWeight: "600"
                      }}
                    >
                      📊 Descarcă JSON
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
            <div className="modal-subtitle">Valori Nutriționale (per 100g)</div>
            
            <div className="modal-nutrition-bars">
              <div className="modal-nutrition-item">
                <div className="modal-nutrition-label">
                  <span>🔥 Calorii</span>
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
                  <span>💪 Proteine</span>
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
                  <span>🍞 Carbohidrați</span>
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
                  <span>🥑 Grăsimi</span>
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

      {/* Floating Action Button with Expandable Menu */}
      <div className="fab-container">
        {/* Menu Items (appear when expanded) */}
        <button
          className={`fab-menu-item fab-menu-item-1 ${showFabMenu ? 'show' : ''}`}
          onClick={toggleDarkMode}
          aria-label={darkMode ? "Mod luminos" : "Mod întunecat"}
          title={darkMode ? "Comută la Mod Luminos" : "Comută la Mod întunecat"}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
        <button
          className={`fab-menu-item fab-menu-item-2 ${showFabMenu ? 'show' : ''}`}
          onClick={handleSettings}
          aria-label="Setări"
          title="Setări Aplicație"
        >
          ⚙️
        </button>
        <button
          className={`fab-menu-item fab-menu-item-3 ${showFabMenu ? 'show' : ''}`}
          onClick={handleHelp}
          aria-label="Ajutor"
          title="Ajutor & Suport"
        >
          ❓
        </button>
        <button
          className={`fab-menu-item fab-menu-item-4 ${showFabMenu ? 'show' : ''}`}
          onClick={() => setShowShortcuts(true)}
          aria-label="Scurtături tastatură"
          title="Comenzi Rapid de la Tastatură (apasă ?)"
        >
          ⌨️
        </button>
        
        {/* Main FAB Button */}
        <button
          className={`fab-main ${showFabMenu ? 'active' : ''}`}
          onClick={() => setShowFabMenu(!showFabMenu)}
          aria-label="Menu"
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
            'u': { description: 'Declanșează încărcare imagine', action: 'upload-image' },
            'Enter': { description: 'Analizează imaginea încărcată', action: 'submit' },
            'Escape': { description: 'Închide modal-uri / Anulează', action: 'cancel' }
          }}
        />
      )}    </div>
  );
}

export default AnalyzeFood;