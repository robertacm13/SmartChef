import React, { useState } from "react";

function App() {
  const [ingredients, setIngredients] = useState("");
  const [recipes, setRecipes] = useState("");

  const generateRecipes = async () => {
    const res = await fetch("http://127.0.0.1:8000/generate_recipe/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: ingredients.split(",") }),
    });
    const data = await res.json();
    setRecipes(data.recipes);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-6">
      <h1 className="text-3xl font-bold mb-4">SmartChef 🍳</h1>
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

export default App;
