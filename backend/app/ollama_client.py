import requests
import json
import base64

OLLAMA_URL = "http://localhost:11434/api/generate"
MODEL_NAME = "qwen2.5-coder:1.5b"

def generate_suggestions(missing_nutrients: dict) -> str:
    """
    Generate meal suggestions using local Ollama model based on missing nutrients.
    Returns a JSON string representing a list of meals with names, recipes, and reasons.
    """
    prompt = f"""
You are a helpful nutrition assistant.
The user needs to consume the following remaining nutrients today to reach their goal:
- Calories: {missing_nutrients.get('calories', 0)} kcal
- Protein: {missing_nutrients.get('protein', 0)}g
- Carbs: {missing_nutrients.get('carbs', 0)}g
- Fat: {missing_nutrients.get('fat', 0)}g

Suggest 2-3 simple and healthy meals or snacks that would help the user fill these gaps.
You MUST return the result as a JSON array of objects. Do not include any other text, markdown fences, or explanations.
Each object must have exactly three fields: 'name', 'recipe', and 'reason'.
The 'reason' field should explain WHY you chose this recipe based on the user's missing nutrients (e.g., "You still need 150g of protein, and this meal is a great source.").

Example output:
[
  {{
    "name": "Scrambled Eggs with Spinach", 
    "recipe": "1. Whisk 2 eggs. 2. Sauté a handful of spinach in 1 tsp olive oil. 3. Add eggs and scramble.",
    "reason": "You need more protein and iron today. This meal provides high-quality protein and some iron from spinach."
  }}
]
"""
    
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.3
        }
    }
    
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()
        raw_text = result.get("response", "[]")
        
        # Clean up potential markdown fences if the model ignores the instruction
        cleaned_text = raw_text.strip()
        if cleaned_text.startswith("```json"):
            cleaned_text = cleaned_text[7:]
        if cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-3]
        cleaned_text = cleaned_text.strip()
        
        return cleaned_text
    except Exception as e:
        print(f"Error calling Ollama: {e}")
        return "[]"

def generate_recipes_from_ingredients(ingredients: list) -> str:
    """
    Generate recipes using local Ollama model based on a list of ingredients.
    Returns a JSON string representing a list of recipes.
    """
    ingredients_str = ", ".join(ingredients)
    prompt = f"""
You are a creative chef.
The user has the following ingredients: {ingredients_str}.

Suggest 2-3 simple and delicious recipes that can be made using mostly these ingredients.
You can assume the user has basic pantry staples like oil, salt, pepper, and water.
You MUST return the result as a JSON array of objects. Do not include any other text, markdown fences, or explanations.
Each object must have exactly three fields: 'name', 'recipe', and 'missing_ingredients'.
The 'missing_ingredients' field must be an array of strings containing ingredients that are needed for the recipe but were NOT provided in the user's list (excluding basic pantry staples like oil, salt, pepper, and water).

Example output:
[
  {{
    "name": "Tomato Basil Pasta", 
    "recipe": "1. Boil pasta. 2. Sauté tomatoes and basil in olive oil. 3. Mix together.",
    "missing_ingredients": ["pasta", "parmesan"]
  }}
]
"""
    
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.5
        }
    }
    
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()
        raw_text = result.get("response", "[]")
        
        # Clean up potential markdown fences
        cleaned_text = raw_text.strip()
        if cleaned_text.startswith("```json"):
            cleaned_text = cleaned_text[7:]
        if cleaned_text.endswith("```"):
            cleaned_text = cleaned_text[:-3]
        cleaned_text = cleaned_text.strip()
        
        return cleaned_text
    except Exception as e:
        print(f"Error calling Ollama: {e}")
        return "[]"

def detect_ingredients_from_image(image_bytes: bytes, food_name: str = "") -> list:
    """
    Detect visible ingredients in an image using Moondream vision model in Ollama.
    Returns a list of ingredient names.
    """
    try:
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        
        meal_context = f" The detected meal is {food_name}." if food_name else ""
        prompt = (
            f"Based on the detected meal being {food_name}, list the typical recipe ingredients for this dish.{'' if food_name else ' List the visible food ingredients in this image.'} "
            "Return a comma-separated list of ingredient names only, up to 8 items. "
            "Do not return the dish name itself or descriptive labels. "
            "If you cannot identify ingredients with reasonable confidence, return an empty list."
        )
        
        payload = {
            "model": "moondream",
            "prompt": prompt,
            "images": [base64_image],
            "stream": False,
            "options": {
                "temperature": 0.2
            }
        }
        
        response = requests.post(OLLAMA_URL, json=payload, timeout=90)
        response.raise_for_status()
        result = response.json()
        raw_text = result.get("response", "")
        
        # Handle both comma-separated and Python list formats
        raw_text = raw_text.strip()
        if raw_text.startswith("[") and raw_text.endswith("]"):
            raw_text = raw_text[1:-1]
        
        # Parse comma-separated list and filter only multi-word phrases that are not ingredients.
        ingredients = []
        meal_name_normalized = food_name.strip().lower().replace("_", " ").replace("-", " ")
        
        for item in raw_text.split(","):
            cleaned = item.strip().lower().strip('"\'`[]').strip()
            cleaned = cleaned.replace("?", "").replace(".", "").strip()
            
            # Skip empty or very short items
            if not cleaned or len(cleaned) < 2:
                continue
            
            # Skip if it's the meal name itself or a variant of it
            if meal_name_normalized:
                # Check exact match and partial matches
                if cleaned == meal_name_normalized:
                    continue
                if cleaned in meal_name_normalized or meal_name_normalized in cleaned:
                    # Only skip if it's a significant part of the meal name
                    if len(cleaned) > len(meal_name_normalized) / 2:
                        continue
            
            # Skip obvious non-ingredient multi-word phrases
            if " " in cleaned:  # Multi-word item
                if cleaned in {"carrot cake", "cream cheese frosting", "orange icing", 
                              "chocolate frosting", "vanilla frosting"}:
                    continue
            
            ingredients.append(cleaned)
        generic_pair = {"tomato", "onion"}
        if ingredients and set(ingredients).issubset(generic_pair):
            return []
        return ingredients
    except Exception as e:
        print(f"Error calling Moondream: {e}")
        return []

def generate_restaurant_query(missing_nutrients: dict) -> str:
    """
    Generate a search query for Google Maps based on missing nutrients.
    Returns a string (e.g., "high protein restaurants").
    """
    prompt = f"""
You are a helpful nutrition assistant.
The user needs to consume the following remaining nutrients today to reach their goal:
- Calories: {missing_nutrients.get('calories', 0)} kcal
- Protein: {missing_nutrients.get('protein', 0)}g
- Carbs: {missing_nutrients.get('carbs', 0)}g
- Fat: {missing_nutrients.get('fat', 0)}g

Suggest a short search query (2-4 words) for Google Maps to find a suitable restaurant or food place.
Examples: "high protein restaurants", "healthy salads", "low fat meals", "whole grain pasta".
You MUST return ONLY the search query string. Do not include any other text, quotes, or explanations.
"""
    
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.3
        }
    }
    
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()
        raw_text = result.get("response", "healthy restaurants")
        
        # Clean up potential quotes
        cleaned_text = raw_text.strip().replace('"', '').replace("'", "")
        
        return cleaned_text
    except Exception as e:
        print(f"Error calling Ollama: {e}")
        return "healthy restaurants"

def generate_vitamin_advice(missing_nutrients: dict) -> str:
    """
    Generate advice on missing vitamins based on missing nutrients.
    """
    prompt = f"""
You are a helpful nutrition assistant.
The user is missing these nutrients today:
- Calories: {missing_nutrients.get('calories', 0)} kcal
- Protein: {missing_nutrients.get('protein', 0)}g
- Carbs: {missing_nutrients.get('carbs', 0)}g
- Fat: {missing_nutrients.get('fat', 0)}g

Suggest 1-2 vitamins or minerals they might be lacking based on these gaps, and a food source for them.
Keep it short (1-2 sentences).
Use <b> tags to bold the specific food items recommended.
Example: "Based on your low protein intake, you might also be low on Vitamin B12. Try adding some <b>fish</b> or <b>dairy</b>."
You MUST return ONLY the advice string. Do not include any other text, quotes, or explanations.
"""
    
    payload = {
        "model": MODEL_NAME,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.3
        }
    }
    
    try:
        response = requests.post(OLLAMA_URL, json=payload, timeout=30)
        response.raise_for_status()
        result = response.json()
        raw_text = result.get("response", "Eat more fruits and vegetables for vitamins.")
        return raw_text.strip()
    except Exception as e:
        print(f"Error calling Ollama: {e}")
        return "Eat more fruits and vegetables for vitamins."
