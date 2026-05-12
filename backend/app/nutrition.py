"""
Nutritional Database Module
Maps ingredients to their nutritional values (per 100g serving).

TODO: Expand this database or integrate with USDA API for comprehensive nutrition data.
"""

from typing import Dict, List

# Nutritional values per 100g of ingredient
# Format: {name: {calories, protein_g, carbs_g, fat_g, fiber_g}}
NUTRITION_DATABASE = {
    "tomato": {
        "calories": 18,
        "protein": 0.9,
        "carbs": 3.9,
        "fat": 0.2,
        "fiber": 1.2,
        "vitamin_c": 13.7,
        "potassium": 237
    },
    "apple": {
        "calories": 52,
        "protein": 0.3,
        "carbs": 14,
        "fat": 0.2,
        "fiber": 2.4,
        "vitamin_c": 4.6,
        "potassium": 107
    },
    "flour": {
        "calories": 364,
        "protein": 10.3,
        "carbs": 76.3,
        "fat": 1,
        "fiber": 2.7,
        "iron": 3.6
    },
    "sugar": {
        "calories": 387,
        "protein": 0,
        "carbs": 100,
        "fat": 0,
        "fiber": 0
    },
    "cinnamon": {
        "calories": 247,
        "protein": 4,
        "carbs": 81,
        "fat": 1.2,
        "fiber": 53.1,
        "calcium": 1002,
        "iron": 8.3
    },
    "orange": {
        "calories": 47,
        "protein": 0.9,
        "carbs": 12,
        "fat": 0.3,
        "fiber": 2.4,
        "vitamin_c": 53.2,
        "potassium": 181
    },
    "oil": {
        "calories": 884,
        "protein": 0,
        "carbs": 0,
        "fat": 100,
        "fiber": 0,
        "vitamin_e": 14
    },
    "egg": {
        "calories": 155,
        "protein": 13,
        "carbs": 1.1,
        "fat": 11,
        "fiber": 0,
        "vitamin_a": 540,
        "vitamin_d": 87
    },
    "cheese": {
        "calories": 402,
        "protein": 25,
        "carbs": 1.3,
        "fat": 33,
        "fiber": 0,
        "calcium": 721,
        "sodium": 621
    },
    "cream cheese": {
        "calories": 342,
        "protein": 5.9,
        "carbs": 4.1,
        "fat": 34.4,
        "fiber": 0,
        "calcium": 98,
        "sodium": 345
    },
    "chicken": {
        "calories": 165,
        "protein": 31,
        "carbs": 0,
        "fat": 3.6,
        "fiber": 0,
        "iron": 0.9,
        "zinc": 1.3
    },
    "rice": {
        "calories": 130,
        "protein": 2.7,
        "carbs": 28,
        "fat": 0.3,
        "fiber": 0.4,
        "magnesium": 12,
        "manganese": 0.5
    },
    "pasta": {
        "calories": 131,
        "protein": 5,
        "carbs": 25,
        "fat": 1.1,
        "fiber": 1.8,
        "folate": 18,
        "iron": 1.3
    },
    "lettuce": {
        "calories": 15,
        "protein": 1.4,
        "carbs": 2.9,
        "fat": 0.2,
        "fiber": 1.3,
        "vitamin_k": 126,
        "folate": 38
    },
    "carrot": {
        "calories": 41,
        "protein": 0.9,
        "carbs": 10,
        "fat": 0.2,
        "fiber": 2.8,
        "vitamin_a": 835,
        "potassium": 320
    },
    "onion": {
        "calories": 40,
        "protein": 1.1,
        "carbs": 9.3,
        "fat": 0.1,
        "fiber": 1.7,
        "vitamin_c": 7.4,
        "folate": 19
    },
    "garlic": {
        "calories": 149,
        "protein": 6.4,
        "carbs": 33,
        "fat": 0.5,
        "fiber": 2.1,
        "vitamin_c": 31,
        "manganese": 1.7
    },
    "potato": {
        "calories": 77,
        "protein": 2,
        "carbs": 17,
        "fat": 0.1,
        "fiber": 2.2,
        "vitamin_c": 19.7,
        "potassium": 425
    },
    "beef": {
        "calories": 250,
        "protein": 26,
        "carbs": 0,
        "fat": 15,
        "fiber": 0,
        "iron": 2.6,
        "zinc": 4.8
    },
    "pork": {
        "calories": 242,
        "protein": 27,
        "carbs": 0,
        "fat": 14,
        "fiber": 0,
        "thiamin": 0.7,
        "selenium": 38
    },
    "fish": {
        "calories": 206,
        "protein": 22,
        "carbs": 0,
        "fat": 12,
        "fiber": 0,
        "omega_3": 2.3,
        "vitamin_d": 526
    },
    "bread": {
        "calories": 265,
        "protein": 9,
        "carbs": 49,
        "fat": 3.2,
        "fiber": 2.7,
        "iron": 3.6,
        "folate": 34
    },
    "milk": {
        "calories": 42,
        "protein": 3.4,
        "carbs": 5,
        "fat": 1,
        "fiber": 0,
        "calcium": 113,
        "vitamin_d": 1.3
    },
    "butter": {
        "calories": 717,
        "protein": 0.9,
        "carbs": 0.1,
        "fat": 81,
        "fiber": 0,
        "vitamin_a": 684,
        "vitamin_e": 2.3
    },
    "olive oil": {
        "calories": 884,
        "protein": 0,
        "carbs": 0,
        "fat": 100,
        "fiber": 0,
        "vitamin_e": 14,
        "vitamin_k": 60
    },
    "bell pepper": {
        "calories": 31,
        "protein": 1,
        "carbs": 6,
        "fat": 0.3,
        "fiber": 2.1,
        "vitamin_c": 128,
        "vitamin_a": 157
    },
    "mushroom": {
        "calories": 22,
        "protein": 3.1,
        "carbs": 3.3,
        "fat": 0.3,
        "fiber": 1,
        "vitamin_d": 18,
        "selenium": 9.3
    },
    "broccoli": {
        "calories": 34,
        "protein": 2.8,
        "carbs": 7,
        "fat": 0.4,
        "fiber": 2.6,
        "vitamin_c": 89,
        "vitamin_k": 102
    },
    "spinach": {
        "calories": 23,
        "protein": 2.9,
        "carbs": 3.6,
        "fat": 0.4,
        "fiber": 2.2,
        "vitamin_k": 483,
        "iron": 2.7
    }
}

def get_nutrition_info(ingredients) -> Dict:
    """
    Get aggregated nutritional information for a list of ingredients with optional weights.
    
    Args:
        ingredients: List of ingredient names (strings) or dicts with {name, weight}
                    If string, assumes 100g default weight.
                    If dict, uses specified weight in grams.
        
    Returns:
        Dictionary with total and per-ingredient nutrition data including calculation formula
    """
    total_nutrition = {
        "calories": 0,
        "protein": 0,
        "carbs": 0,
        "fat": 0,
        "fiber": 0
    }
    
    ingredient_details = []
    individual_nutrition = {}
    unknown_ingredients = []
    calculation_formulas = []
    
    for ingredient in ingredients:
        # Handle both string and dict formats
        if isinstance(ingredient, dict):
            ingredient_name = ingredient.get("name", "").lower()
            weight = ingredient.get("weight", 100)
        else:
            ingredient_name = str(ingredient).lower()
            weight = 100
        
        if ingredient_name in NUTRITION_DATABASE:
            base_nutrition = NUTRITION_DATABASE[ingredient_name]
            
            # Calculate nutrition for actual weight: (weight / 100) * nutrition_per_100g
            weight_multiplier = weight / 100
            calculated_nutrition = {
                "calories": round(base_nutrition.get("calories", 0) * weight_multiplier, 2),
                "protein": round(base_nutrition.get("protein", 0) * weight_multiplier, 2),
                "carbs": round(base_nutrition.get("carbs", 0) * weight_multiplier, 2),
                "fat": round(base_nutrition.get("fat", 0) * weight_multiplier, 2),
                "fiber": round(base_nutrition.get("fiber", 0) * weight_multiplier, 2)
            }
            
            # Add to totals
            total_nutrition["calories"] += calculated_nutrition["calories"]
            total_nutrition["protein"] += calculated_nutrition["protein"]
            total_nutrition["carbs"] += calculated_nutrition["carbs"]
            total_nutrition["fat"] += calculated_nutrition["fat"]
            total_nutrition["fiber"] += calculated_nutrition["fiber"]
            
            # Create calculation formula for this ingredient
            formula = f"{ingredient_name.capitalize()} ({weight}g) = ({weight}/100) × {base_nutrition.get('calories', 0)} kcal = {calculated_nutrition['calories']} kcal"
            calculation_formulas.append(formula)
            
            # Store individual ingredient info
            ingredient_details.append({
                "name": ingredient_name,
                "weight": weight,
                "nutrition": calculated_nutrition,
                "formula": formula
            })
            
            # Add to individual nutrition mapping
            individual_nutrition[ingredient_name] = calculated_nutrition
        else:
            unknown_ingredients.append(ingredient_name if isinstance(ingredient, dict) else ingredient)
    
    # Round total nutrition values
    total_nutrition = {k: round(v, 2) for k, v in total_nutrition.items()}
    
    # Create total formula
    total_formula = f"Total = {' + '.join([str(ing['nutrition']['calories']) for ing in ingredient_details])} = {total_nutrition['calories']} kcal"
    
    return {
        "total_nutrition": total_nutrition,
        "individual_nutrition": individual_nutrition,
        "serving_note": f"Values calculated based on actual ingredient weights",
        "ingredients": ingredient_details,
        "unknown_ingredients": unknown_ingredients,
        "ingredient_count": len(ingredient_details),
        "calculation_formulas": calculation_formulas,
        "total_formula": total_formula
    }

def format_nutrition_response(nutrition_data: Dict) -> str:
    """
    Format nutrition data into a readable string.
    
    Args:
        nutrition_data: Dictionary from get_nutrition_info()
        
    Returns:
        Formatted string with nutrition information
    """
    total = nutrition_data["total_nutrition"]
    
    response = f"""
🍽️ **Total Nutritional Values** (per 100g of each ingredient):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Calories: {total['calories']} kcal
🥩 Protein: {total['protein']:.1f}g
🍞 Carbohydrates: {total['carbs']:.1f}g
🥑 Fat: {total['fat']:.1f}g
🌾 Fiber: {total['fiber']:.1f}g

📋 **Detected Ingredients ({nutrition_data['ingredient_count']}):**
"""
    
    for item in nutrition_data["ingredients"]:
        name = item["name"].capitalize()
        nut = item["nutrition"]
        response += f"\n• {name}: {nut['calories']} kcal | "
        response += f"P: {nut['protein']}g | C: {nut['carbs']}g | F: {nut['fat']}g"
    
    if nutrition_data["unknown_ingredients"]:
        response += f"\n\n⚠️ **Unknown ingredients:** {', '.join(nutrition_data['unknown_ingredients'])}"
    
    return response


def get_ingredient_suggestions(search_text: str) -> List[str]:
    """
    Get autocomplete suggestions for ingredients based on search text.
    
    Args:
        search_text: User's input text to search for
        
    Returns:
        List of matching ingredient names, limited to 10 results
    """
    if not search_text or len(search_text.strip()) == 0:
        return []
    
    search_lower = search_text.lower().strip()
    
    # Get exact matches first, then partial matches
    exact_matches = []
    partial_matches = []
    
    for ingredient in NUTRITION_DATABASE.keys():
        if ingredient == search_lower:
            exact_matches.append(ingredient)
        elif search_lower in ingredient or ingredient.startswith(search_lower):
            partial_matches.append(ingredient)
    
    # Combine: exact matches first, then partial matches
    suggestions = exact_matches + sorted(partial_matches)
    
    # Return top 10 suggestions, formatted nicely
    return [ing.capitalize() for ing in suggestions[:10]]
