"""
Script de testare pentru integrarea modelului ML

Testează:
1. Încărcarea modelului
2. Predicțiile pe imagini test
3. Performanța (timp de inferență)
"""

import sys
import os
from pathlib import Path
import time

# Add backend to path
backend_path = Path(__file__).parent
sys.path.insert(0, str(backend_path))

def test_model_loading():
    """Test 1: Verifică dacă modelul se încarcă corect"""
    print("\n" + "=" * 70)
    print("TEST 1: ÎNCĂRCARE MODEL")
    print("=" * 70)
    
    try:
        from app.model import get_model
        
        model = get_model()
        print(f"✅ Model încărcat cu succes")
        print(f"   Device: {model.device}")
        print(f"   Classes: {len(model.ingredient_classes)}")
        print(f"   Model loaded: {model.model_loaded}")
        print(f"   Ingrediente: {', '.join(model.ingredient_classes[:10])}...")
        
        return model
        
    except Exception as e:
        print(f"❌ Eroare la încărcare: {e}")
        import traceback
        traceback.print_exc()
        return None


def test_prediction_with_sample(model):
    """Test 2: Testează predicție cu o imagine de test"""
    print("\n" + "=" * 70)
    print("TEST 2: PREDICȚIE PE IMAGINE TEST")
    print("=" * 70)
    
    # Căutăm o imagine de test
    test_image_paths = [
        "test_food.jpg",
        "test_image.jpg",
        "../test_food.jpg",
        "sample_food.jpg"
    ]
    
    test_image = None
    for path in test_image_paths:
        if os.path.exists(path):
            test_image = path
            break
    
    if test_image is None:
        print("⚠️  Nu s-a găsit imagine de test")
        print("   Creați o imagine test numită 'test_food.jpg' în directorul backend/")
        print("   Testăm cu imagine simplă generată...")
        
        # Creăm o imagine test simplă
        from PIL import Image
        import io
        img = Image.new('RGB', (224, 224), color='red')
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='JPEG')
        image_bytes = img_bytes.getvalue()
        print("   ✅ Imagine test generată (dummy)")
    else:
        print(f"📷 Folosim imagine: {test_image}")
        with open(test_image, 'rb') as f:
            image_bytes = f.read()
    
    # Test predicție
    try:
        start_time = time.time()
        
        # Test cu threshold diferite
        thresholds = [0.2, 0.3, 0.5, 0.7]
        
        for threshold in thresholds:
            ingredients = model.predict(image_bytes, threshold=threshold)
            inference_time = time.time() - start_time
            
            print(f"\n📊 Threshold {threshold:.1f}:")
            print(f"   Ingrediente detectate: {len(ingredients)}")
            print(f"   Lista: {', '.join(ingredients)}")
            print(f"   ⏱️  Timp inferență: {inference_time*1000:.2f}ms")
            
            start_time = time.time()  # Reset for next iteration
        
        print("\n✅ Test predicție reușit!")
        
    except Exception as e:
        print(f"❌ Eroare la predicție: {e}")
        import traceback
        traceback.print_exc()


def test_nutrition_integration():
    """Test 3: Verifică integrarea cu modulul de nutriție"""
    print("\n" + "=" * 70)
    print("TEST 3: INTEGRARE CU BAZA DE DATE NUTRIȚIONALĂ")
    print("=" * 70)
    
    try:
        from app.nutrition import get_nutrition_info, NUTRITION_DATABASE
        
        # Ingrediente test
        test_ingredients = ["tomato", "egg", "cheese"]
        
        print(f"🧪 Testăm cu ingrediente: {test_ingredients}")
        
        nutrition = get_nutrition_info(test_ingredients)
        
        print(f"\n📊 Rezultat nutrițional:")
        print(f"   Total calorii: {nutrition.get('calories', 0)} kcal")
        print(f"   Proteine: {nutrition.get('protein', 0)}g")
        print(f"   Carbohidrați: {nutrition.get('carbs', 0)}g")
        print(f"   Grăsimi: {nutrition.get('fat', 0)}g")
        
        # Verifică câte ingrediente sunt în baza de date
        print(f"\n📚 Baza de date nutrițională:")
        print(f"   Ingrediente disponibile: {len(NUTRITION_DATABASE)}")
        print(f"   Lista: {', '.join(list(NUTRITION_DATABASE.keys())[:10])}...")
        
        print("\n✅ Test integrare nutriție reușit!")
        
    except Exception as e:
        print(f"❌ Eroare: {e}")
        import traceback
        traceback.print_exc()


def test_api_endpoint():
    """Test 4: Verifică endpoint-ul API"""
    print("\n" + "=" * 70)
    print("TEST 4: VERIFICARE API ENDPOINT")
    print("=" * 70)
    
    print("""
    Pentru a testa API-ul complet:
    
    1. Porniti serverul:
       cd backend
       python -m uvicorn app.main:app --reload
    
    2. Într-un terminal separat, testați:
       
       # PowerShell:
       $response = Invoke-WebRequest -Uri http://localhost:8000/analyze_food/ `
         -Method POST `
         -Form @{file=Get-Item "test_food.jpg"} `
         -Headers @{"X-User-Email"="test@example.com"}
       $response.Content | ConvertFrom-Json
       
       # sau folosiți Postman/Insomnia pentru POST la:
       # http://localhost:8000/analyze_food/
       # Cu file upload și header X-User-Email
    
    3. Verificați răspunsul JSON pentru:
       - ingredients: lista detectată
       - nutrition: valorile nutriționale
       - status: "success"
    """)


def main():
    """Rulează toate testele"""
    print("🚀 TESTARE INTEGRARE MODEL ML - SmartChef")
    print("=" * 70)
    
    # Test 1: Încărcare model
    model = test_model_loading()
    
    if model is None:
        print("\n❌ Modelul nu s-a încărcat. Oprim testarea.")
        return
    
    # Test 2: Predicție
    test_prediction_with_sample(model)
    
    # Test 3: Integrare nutriție
    test_nutrition_integration()
    
    # Test 4: Instrucțiuni API
    test_api_endpoint()
    
    # Sumar final
    print("\n" + "=" * 70)
    print("✅ TESTARE COMPLETĂ")
    print("=" * 70)
    print("""
    Următorii pași:
    1. ✅ Modelul se încarcă corect
    2. ⏭️  Copiați modelul antrenat în backend/models/best_model_efficientnet_b5.pth
    3. ⏭️  Verificați MODEL_PATH și MODEL_THRESHOLD în backend/.env
    4. ⏭️  Porniți serverul și testați cu imagini reale
    5. ⏭️  Ajustați threshold-ul pentru performanță optimă
    
    Tips:
    - Threshold 0.3: Mai multe ingrediente (recall mai mare)
    - Threshold 0.5: Balans între precizie și recall
    - Threshold 0.7: Doar predicții foarte sigure (precizie mare)
    
    Pentru modelul dvs. cu 92.25% acuratețe, recomand threshold 0.3-0.4.
    """)


if __name__ == "__main__":
    main()
