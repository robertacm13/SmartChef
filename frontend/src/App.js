import React, { useState } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, LineElement, PointElement } from 'chart.js';
import { Pie, Bar } from 'react-chartjs-2';
import Login from "./Login";
import Register from "./Register";
import History from "./History";
import Dashboard from "./Dashboard";
import PersonalData from "./PersonalData";
import AccountSettings from "./AccountSettings";
import "./App.css";

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend);

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState("main");
  const [authToken, setAuthToken] = useState(() => {
    // Restaurează token-ul din localStorage la mount
    return localStorage.getItem('authToken') || null;
  });
  const [userEmail, setUserEmail] = useState(() => {
    // Restaurează email-ul din localStorage la mount
    return localStorage.getItem('userEmail') || "";
  });
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [showNavDropdown, setShowNavDropdown] = useState(false);
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [userDropdownTimeout, setUserDropdownTimeout] = useState(null);

  const handleUserMouseEnter = () => {
    if (userDropdownTimeout) clearTimeout(userDropdownTimeout);
    setShowUserDropdown(true);
  };

  const handleUserMouseLeave = () => {
    const timeout = setTimeout(() => setShowUserDropdown(false), 200);
    setUserDropdownTimeout(timeout);
  };
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  // Toggle dark mode
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
    document.body.classList.toggle('dark-mode', newMode);
  };

  // Apply dark mode on mount
  React.useEffect(() => {
    document.body.classList.toggle('dark-mode', darkMode);
  }, [darkMode]);

  const handleLoginSuccess = (token, email) => {
    setAuthToken(token);
    setUserEmail(email);
    // Salvează datele în localStorage pentru persistență
    localStorage.setItem('authToken', token);
    localStorage.setItem('userEmail', email);
    setCurrentPage("main");
  };

  const handleLogout = () => {
    setAuthToken(null);
    setUserEmail("");
    // Șterge datele din localStorage
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    setSelectedFile(null);
    setPreviewUrl(null);
    setResults(null);
    setCurrentPage("main");
  };

  const handleGoHome = () => {
    setCurrentPage("main");
    setSelectedFile(null);
    setPreviewUrl(null);
    setResults(null);
    setSelectedIngredient(null);
  };

  const handleSettings = () => {
    // Placeholder pentru pagina de setări
    alert("⚙️ Settings page - Coming soon!\n\nHere you will be able to:\n- Change password\n- Update email\n- Manage 2FA settings\n- Set calorie goals\n- Export preferences");
  };

  const handleHelp = () => {
    // Placeholder pentru pagina de help
    alert("❓ Help & Support\n\nFor assistance:\n📧 Email: support@smartchef.ro\n📚 Documentation: Check FEATURES.md\n🐛 Report bugs on GitHub\n\nQuick Tips:\n- Upload clear food images\n- Use dark mode for better viewing\n- Export analyses as PDF\n- Mark favorites with ⭐");
  };

  const handleIngredientClick = (ingredientName) => {
    if (results && results.nutrition && results.nutrition.individual_nutrition) {
      const nutrition = results.nutrition.individual_nutrition[ingredientName.toLowerCase()];
      if (nutrition) {
        setSelectedIngredient({
          name: ingredientName,
          nutrition: nutrition
        });
      }
    }
  };

  const closeIngredientModal = () => {
    setSelectedIngredient(null);
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    
    // Header cu logo și titlu
    doc.setFillColor(255, 107, 53);
    doc.rect(0, 0, pageWidth, 35, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont(undefined, 'bold');
    doc.text('🍳 SmartChef', 15, 20);
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    doc.text('Raport Analiză Nutrițională', 15, 28);
    
    // Data și ora
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(9);
    const now = new Date();
    doc.text(`Generat: ${now.toLocaleString('ro-RO')}`, pageWidth - 60, 20);
    
    // Reset culoare text
    doc.setTextColor(0, 0, 0);
    
    // Imagine analizată
    let yPos = 45;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Imagine Analizată', 15, yPos);
    yPos += 7;
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    doc.text(`Nume fișier: ${selectedFile?.name || 'N/A'}`, 15, yPos);
    
    // Ingrediente detectate
    yPos += 12;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(`🥗 Ingrediente Detectate (${results.ingredients.length})`, 15, yPos);
    yPos += 7;
    
    doc.setFontSize(10);
    doc.setFont(undefined, 'normal');
    const ingredientsText = results.ingredients.join(', ');
    const splitIngredients = doc.splitTextToSize(ingredientsText, pageWidth - 30);
    doc.text(splitIngredients, 15, yPos);
    yPos += splitIngredients.length * 5 + 5;
    
    // Valori nutriționale totale
    yPos += 5;
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('📊 Valori Nutriționale Totale', 15, yPos);
    yPos += 7;
    
    const nutrition = results.nutrition.total_nutrition;
    const nutritionData = [
      ['🔥 Calorii', `${nutrition.calories} kcal`],
      ['💪 Proteine', `${nutrition.protein}g`],
      ['🍞 Carbohidrați', `${nutrition.carbs}g`],
      ['🥑 Grăsimi', `${nutrition.fat}g`],
      ['🌾 Fibre', `${nutrition.fiber}g`]
    ];
    
    doc.autoTable({
      startY: yPos,
      head: [['Nutrient', 'Valoare']],
      body: nutritionData,
      theme: 'grid',
      headStyles: { fillColor: [255, 107, 53], textColor: 255 },
      styles: { fontSize: 10 },
      margin: { left: 15, right: 15 }
    });
    
    yPos = doc.lastAutoTable.finalY + 10;
    
    // Detalii ingrediente individuale
    if (results.nutrition.individual_nutrition) {
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('🥗 Valori Nutriționale pe Ingredient (per 100g)', 15, yPos);
      yPos += 7;
      
      const individualData = results.ingredients.map(ing => {
        const indNut = results.nutrition.individual_nutrition[ing.toLowerCase()];
        if (indNut) {
          return [
            ing.charAt(0).toUpperCase() + ing.slice(1),
            `${indNut.calories} kcal`,
            `${indNut.protein}g`,
            `${indNut.carbs}g`,
            `${indNut.fat}g`
          ];
        }
        return [ing, 'N/A', 'N/A', 'N/A', 'N/A'];
      });
      
      doc.autoTable({
        startY: yPos,
        head: [['Ingredient', 'Calorii', 'Proteine', 'Carbohidrați', 'Grăsimi']],
        body: individualData,
        theme: 'striped',
        headStyles: { fillColor: [255, 107, 53], textColor: 255 },
        styles: { fontSize: 9 },
        margin: { left: 15, right: 15 }
      });
    }
    
    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        `Pagina ${i} din ${pageCount} | SmartChef © 2026`,
        pageWidth / 2,
        doc.internal.pageSize.getHeight() - 10,
        { align: 'center' }
      );
    }
    
    // Salvare PDF
    doc.save(`SmartChef-Analiza-${now.toISOString().slice(0,10)}.pdf`);
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
      alert("Te rog selectează o imagine mai întâi!");
      return;
    }

    setLoading(true);
    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const headers = {};
      // Add user email to headers if authenticated
      if (authToken && userEmail) {
        headers['X-User-Email'] = userEmail;
      }
      
      const res = await fetch("http://127.0.0.1:8001/analyze_food/", {
        method: "POST",
        headers: headers,
        body: formData,
      });
      const data = await res.json();
      setResults(data);
      
      // Show success message if analysis was saved
      if (data.analysis_id) {
        console.log("✅ Analysis saved to database with ID:", data.analysis_id);
      }
    } catch (error) {
      console.error("Error analyzing food:", error);
      alert("Eroare la analizarea imaginii. Asigură-te că backend-ul rulează!");
    } finally {
      setLoading(false);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case "login":
        return <Login onBack={() => setCurrentPage("main")} onLoginSuccess={handleLoginSuccess} onNavigateToRegister={() => setCurrentPage("register")} />;
      case "register":
        return <Register onBack={() => setCurrentPage("main")} onRegisterSuccess={() => setCurrentPage("login")} onNavigateToLogin={() => setCurrentPage("login")} />;
      case "history":
        return <History userEmail={userEmail} onBack={handleGoHome} onLogout={handleLogout} onNavigate={(page) => setCurrentPage(page)} darkMode={darkMode} toggleDarkMode={toggleDarkMode} handleSettings={handleSettings} handleHelp={handleHelp} />;
      case "dashboard":
        return <Dashboard userEmail={userEmail} onBack={handleGoHome} onLogout={handleLogout} onNavigate={(page) => setCurrentPage(page)} darkMode={darkMode} toggleDarkMode={toggleDarkMode} handleSettings={handleSettings} handleHelp={handleHelp} />;
      case "personal-data":
        return <PersonalData userEmail={userEmail} onBack={handleGoHome} onLogout={handleLogout} onNavigate={(page) => setCurrentPage(page)} />;
      case "account-settings":
        return <AccountSettings userEmail={userEmail} onBack={handleGoHome} onEmailChange={(newEmail) => { 
          setUserEmail(newEmail); 
          localStorage.setItem('userEmail', newEmail); 
          handleLogout(); 
        }} onLogout={handleLogout} onNavigate={(page) => setCurrentPage(page)} />;
      default:
        return (
          <div className="animated-bg" style={{ minHeight: "100vh" }}>
            {/* Header */}
            <header className="header">
              <div className="header-content">
                <div className="logo" onClick={handleGoHome} style={{ cursor: "pointer" }}>
                  🍳 SmartChef
                </div>
                <div className="nav-buttons">
                  {authToken ? (
                    <>
                      {/* Right side - Menu & User */}
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
                                  setCurrentPage("dashboard");
                                  setShowNavDropdown(false);
                                }}
                              >
                                📈 Dashboard
                              </button>
                              <button
                                className="nav-dropdown-item"
                                onClick={() => {
                                  setCurrentPage("history");
                                  setShowNavDropdown(false);
                                }}
                              >
                                📊 Istoric
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
                                setCurrentPage("personal-data");
                                setShowUserDropdown(false);
                              }}>
                                <span className="dropdown-icon">📊</span>
                                Date personale
                              </button>
                              
                              <button className="user-dropdown-item" onClick={() => {
                                setCurrentPage("account-settings");
                                setShowUserDropdown(false);
                              }}>
                                <span className="dropdown-icon">⚙️</span>
                                Setările contului
                              </button>
                              
                              <div className="user-dropdown-divider"></div>
                              <button className="user-dropdown-item logout-item" onClick={handleLogout}>
                                <span className="dropdown-icon">🚪</span>
                                Logout
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div style={{ display: "flex", gap: "0.5rem", marginLeft: "auto" }}>
                      <button
                        className="btn btn-outline"
                        onClick={() => setCurrentPage("login")}
                      >
                        Login
                      </button>
                      <button
                        className="btn btn-secondary"
                        onClick={() => setCurrentPage("register")}
                      >
                        Register
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </header>

            {/* Main Content Container */}
            <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "3rem 2rem" }}>
              {/* Hero Section - Always show */}
              <div style={{ textAlign: "center", marginBottom: "3rem" }}>
                <h1 style={{ 
                  fontSize: "3.5rem", 
                  fontWeight: "800", 
                  color: "#ff6b35",
                  marginBottom: "1rem",
                  textShadow: "2px 2px 4px rgba(0,0,0,0.1)"
                }}>
                  ✨ Bine ai venit la SmartChef! ✨
                </h1>
                <p style={{ 
                  fontSize: "1.3rem", 
                  color: "#666",
                  fontWeight: "400"
                }}>
                  Analiză inteligentă a alimentelor cu AI și valori nutriționale
                </p>
              </div>

              {/* Feature Cards - Always show */}
              <div style={{ 
                display: "grid", 
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", 
                gap: "2rem",
                marginBottom: "3rem"
              }}>
                <div className="feature-card">
                  <div className="feature-icon">🔍</div>
                  <h3 style={{ fontSize: "1.4rem", marginBottom: "0.8rem", color: "#333" }}>
                    Recunoaștere AI
                  </h3>
                  <p style={{ color: "#666", lineHeight: "1.6" }}>
                    Detectează automat ingredientele din fotografii folosind inteligență artificială
                  </p>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">📊</div>
                  <h3 style={{ fontSize: "1.4rem", marginBottom: "0.8rem", color: "#333" }}>
                    Valori Nutriționale
                  </h3>
                  <p style={{ color: "#666", lineHeight: "1.6" }}>
                    Calculează automat calorii, proteine, carbohidrați și alte valori
                  </p>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">🔒</div>
                  <h3 style={{ fontSize: "1.4rem", marginBottom: "0.8rem", color: "#333" }}>
                    Securitate 2FA
                  </h3>
                  <p style={{ color: "#666", lineHeight: "1.6" }}>
                    Contul tău este protejat cu autentificare în doi pași
                  </p>
                </div>
              </div>

              {/* Upload Section - Only for authenticated users */}
              {!authToken ? (
                <div className="card" style={{ maxWidth: "600px", margin: "0 auto", textAlign: "center" }}>
                  <h2 style={{ fontSize: "2rem", color: "#ff6b35", marginBottom: "1rem" }}>
                    🔒 Autentificare Necesară
                  </h2>
                  <p style={{ fontSize: "1.1rem", color: "#666", marginBottom: "2rem" }}>
                    Te rog să te autentifici pentru a folosi funcția de analiză alimentară
                  </p>
                  <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
                    <button
                      className="btn btn-primary"
                      onClick={() => setCurrentPage("login")}
                      style={{ padding: "1rem 2rem" }}
                    >
                      🔐 Login
                    </button>
                    <button
                      className="btn btn-secondary"
                      onClick={() => setCurrentPage("register")}
                      style={{ padding: "1rem 2rem" }}
                    >
                      📝 Înregistrare
                    </button>
                  </div>
                </div>
              ) : (
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
                      <p style={{ fontSize: "0.9rem", color: "#999" }}>
                        Acceptăm JPG, PNG, JPEG
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

                  <button
                    className="btn btn-primary"
                    onClick={analyzeFood}
                    disabled={loading || !selectedFile}
                    style={{
                      width: "100%",
                      padding: "1.2rem",
                      fontSize: "1.1rem",
                      marginTop: "1.5rem",
                      opacity: loading || !selectedFile ? 0.6 : 1,
                      cursor: loading || !selectedFile ? "not-allowed" : "pointer"
                    }}
                  >
                    {loading ? "🔄 Se analizează..." : "🔍 Analizează Alimentul"}
                  </button>

                  {loading && (
                    <div style={{ textAlign: "center", padding: "2rem 0" }}>
                      <div className="spinner" style={{ margin: "0 auto" }}></div>
                      <p style={{ marginTop: "1rem", color: "#666", fontSize: "1rem" }}>
                        Se analizează imaginea...
                      </p>
                      {/* Skeleton loaders */}
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
                                      return context.label + ': ' + context.parsed + 'g';
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
                              {results.nutrition.total_nutrition.calories} kcal
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
                              {results.nutrition.total_nutrition.protein}g
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
                              {results.nutrition.total_nutrition.carbs}g
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
                              {results.nutrition.total_nutrition.fat}g
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
                              {results.nutrition.total_nutrition.fiber}g
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
                        <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                          <button
                            className="btn btn-primary"
                            onClick={generatePDF}
                            style={{ 
                              flex: 1,
                              padding: "1rem",
                              fontSize: "1rem"
                            }}
                          >
                            📝 Descarcă Raport PDF
                          </button>
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
                            style={{ 
                              flex: 1,
                              padding: "1rem",
                              fontSize: "1rem"
                            }}
                          >
                            📊 Descarcă JSON
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <>
      {renderPage()}
      
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
                  <span className="modal-nutrition-value">{Number(selectedIngredient.nutrition.calories).toFixed(1)} kcal</span>
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
                  <span className="modal-nutrition-value">{Number(selectedIngredient.nutrition.protein).toFixed(1)}g</span>
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
                  <span className="modal-nutrition-value">{Number(selectedIngredient.nutrition.carbs).toFixed(1)}g</span>
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
                  <span className="modal-nutrition-value">{Number(selectedIngredient.nutrition.fat).toFixed(1)}g</span>
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
                  <span className="modal-nutrition-value">{Number(selectedIngredient.nutrition.fiber).toFixed(1)}g</span>
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
          title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
        <button
          className={`fab-menu-item fab-menu-item-2 ${showFabMenu ? 'show' : ''}`}
          onClick={handleSettings}
          title="Settings"
        >
          ⚙️
        </button>
        <button
          className={`fab-menu-item fab-menu-item-3 ${showFabMenu ? 'show' : ''}`}
          onClick={handleHelp}
          title="Help & Support"
        >
          ❓
        </button>
        
        {/* Main FAB Button */}
        <button
          className={`fab-main ${showFabMenu ? 'active' : ''}`}
          onClick={() => setShowFabMenu(!showFabMenu)}
          title="Menu"
        >
          <span className="fab-icon">{showFabMenu ? '×' : '+'}</span>
        </button>
      </div>
    </>
  );
}

export default App;
