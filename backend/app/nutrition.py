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

def get_nutrition_info(ingredients: List[str]) -> Dict:
    """
    Get aggregated nutritional information for a list of ingredients.
    Assumes 100g of each ingredient for calculation.
    
    Args:
        ingredients: List of ingredient names
        
    Returns:
        Dictionary with total and per-ingredient nutrition data
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
    
    for ingredient in ingredients:
        ingredient_lower = ingredient.lower()
        
        if ingredient_lower in NUTRITION_DATABASE:
            nutrition = NUTRITION_DATABASE[ingredient_lower]
            
            # Add to totals
            total_nutrition["calories"] += nutrition.get("calories", 0)
            total_nutrition["protein"] += nutrition.get("protein", 0)
            total_nutrition["carbs"] += nutrition.get("carbs", 0)
            total_nutrition["fat"] += nutrition.get("fat", 0)
            total_nutrition["fiber"] += nutrition.get("fiber", 0)
            
            # Store individual ingredient info
            ingredient_details.append({
                "name": ingredient,
                "nutrition": nutrition
            })
            
            # Add to individual nutrition mapping
            individual_nutrition[ingredient_lower] = {
                "calories": nutrition.get("calories", 0),
                "protein": nutrition.get("protein", 0),
                "carbs": nutrition.get("carbs", 0),
                "fat": nutrition.get("fat", 0),
                "fiber": nutrition.get("fiber", 0)
            }
        else:
            unknown_ingredients.append(ingredient)
    
    return {
        "total_nutrition": total_nutrition,
        "individual_nutrition": individual_nutrition,
        "serving_note": "Values calculated for 100g of each ingredient",
        "ingredients": ingredient_details,
        "unknown_ingredients": unknown_ingredients,
        "ingredient_count": len(ingredient_details)
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
