from fastapi import FastAPI
from fastapi import HTTPException
from fastapi.middleware.cors import CORSMiddleware
from openai import OpenAI
import os
from dotenv import load_dotenv
from pydantic import BaseModel

# Încarcă cheia API din .env
load_dotenv()
client = OpenAI()

app = FastAPI()

# Permite accesul de la frontend (React)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Ingredients(BaseModel):
    items: list[str] = []


@app.post("/generate_recipe/")
async def generate_recipe(ingredients: Ingredients):
    # if os.getenv("MOCK_OPENAI") == "1":
    #     user_ingredients = ingredients.items
    #     # Returnează un răspuns determinist pentru testare locală, fără apel la OpenAI
    #     sample = (
    #         f"Rețetă 1: Omletă cu {', '.join(user_ingredients)}.\n"
    #         f"Rețetă 2: Salată rapidă cu {', '.join(user_ingredients)}.\n"
    #         f"Rețetă 3: Paste simple cu {', '.join(user_ingredients)}."
    #     )
    #     return {"recipes": sample}

    if not os.getenv("OPENAI_API_KEY"):
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY lipsă. Adaugă-l în .env sau ca variabilă de mediu.")

    user_ingredients = ingredients.items
    prompt = f"Generează 3 rețete simple folosind aceste ingrediente: {', '.join(user_ingredients)}."

    try:
        response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=500
    )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Eroare OpenAI: {e}")

    return {"recipes": response.choices[0].message.content}
