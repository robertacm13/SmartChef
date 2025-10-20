import React, { useState } from "react";
import Login from "./Login";
import Register from "./Register";

function App() {
  const [ingredients, setIngredients] = useState("");
  const [recipes, setRecipes] = useState("");
  const [currentPage, setCurrentPage] = useState("main"); // "main", "login", "register"

  const generateRecipes = async () => {
    const res = await fetch("http://127.0.0.1:8001/generate_recipe/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: ingredients.split(",") }),
    });
    const data = await res.json();
    setRecipes(data.recipes);
  };

  const renderPage = () => {
    switch (currentPage) {
      case "login":
        return <Login onBack={() => setCurrentPage("main")} />;
      case "register":
        return <Register onBack={() => setCurrentPage("main")} />;
      default:
        return (
          <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
            <h1 className="text-3xl font-bold mb-4">SmartChef 🍳</h1>
            
            {/* Navigation buttons */}
            <div className="mb-6 flex gap-4">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => setCurrentPage("login")}
              >
                Login
              </button>
              <button
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
                onClick={() => setCurrentPage("register")}
              >
                Register
              </button>
            </div>
            
            <input
              className="p-2 border rounded w-80"
              placeholder="Ex: ouă, roșii, brânză"
              value={ingredients}
              onChange={(e) => setIngredients(e.target.value)}
            />
            <button
              className="mt-4 p-2 bg-green-600 text-white rounded"
              onClick={generateRecipes}
            >
              Găsește rețete
            </button>
            <pre className="mt-6 p-4 bg-white shadow w-96 whitespace-pre-wrap">{recipes}</pre>
          </div>
        );
    }
  };

  return renderPage();
}

export default App;
