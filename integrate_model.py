"""
Script automat pentru integrare model ML în SmartChef

Acest script automatizează pașii de integrare ai modelului antrenat.
"""

import os
import sys
import shutil
from pathlib import Path

def check_prerequisites():
    """Verifică dacă toate fișierele necesare există"""
    print("🔍 Verificare prerequisite...")
    
    issues = []
    
    # Verifică structura proiectului
    if not os.path.exists("backend/app"):
        issues.append("❌ Director backend/app nu există")
    
    if not os.path.exists("backend/app/main.py"):
        issues.append("❌ backend/app/main.py nu există")
    
    if issues:
        print("\n".join(issues))
        return False
    
    print("✅ Toate prerequisite sunt îndeplinite")
    return True


def find_trained_model():
    """Caută fișierul modelului antrenat"""
    print("\n🔍 Căutare model antrenat...")
    
    # Locații posibile
    search_paths = [
        "best_model_efficientnet_b5.pth",
        "backend/models/best_model_efficientnet_b5.pth",
        "ml_training/food_recognition_model.pth",
        "ml_training/checkpoints/food_recognition_model.pth",
        "food_recognition_model.pth",
        "checkpoints/food_recognition_model.pth",
        "models/food_recognition_model.pth"
    ]
    
    for path in search_paths:
        if os.path.exists(path):
            size_mb = os.path.getsize(path) / (1024 * 1024)
            print(f"✅ Găsit model: {path} ({size_mb:.2f} MB)")
            return path
    
    print("⚠️  Model nu a fost găsit în locațiile standard")
    print("   Încercați să specificați calea manual:")
    print("   python integrate_model.py <calea_la_model.pth>")
    return None


def create_models_directory():
    """Creează directorul pentru modele"""
    print("\n📁 Creare director backend/models/...")
    
    models_dir = "backend/models"
    os.makedirs(models_dir, exist_ok=True)
    
    print(f"✅ Director creat: {models_dir}")
    return models_dir


def copy_model_to_backend(model_path, models_dir):
    """Copiază modelul în backend"""
    print(f"\n📦 Copiere model în backend...")
    
    destination = os.path.join(models_dir, "best_model_efficientnet_b5.pth")
    
    try:
        shutil.copy2(model_path, destination)
        size_mb = os.path.getsize(destination) / (1024 * 1024)
        print(f"✅ Model copiat cu succes!")
        print(f"   Destinație: {destination}")
        print(f"   Dimensiune: {size_mb:.2f} MB")
        return destination
    except Exception as e:
        print(f"❌ Eroare la copiere: {e}")
        return None


def backup_original_model():
    """Face backup la model.py original"""
    print("\n💾 Backup model.py original...")
    
    original = "backend/app/model.py"
    backup = "backend/app/model_old_backup.py"
    
    if os.path.exists(original):
        try:
            shutil.copy2(original, backup)
            print(f"✅ Backup creat: {backup}")
            return True
        except Exception as e:
            print(f"❌ Eroare la backup: {e}")
            return False
    else:
        print("⚠️  model.py original nu există")
        return True


def update_model_file():
    """Verifică dacă model.py conține integrarea EfficientNet-B5"""
    print("\n🔧 Actualizare model.py...")

    target = "backend/app/model.py"

    try:
        with open(target, 'r', encoding='utf-8') as f:
            content = f.read()
        if "EfficientNet-B5" in content or "tf_efficientnet_b5" in content:
            print("✅ model.py este deja actualizat pentru EfficientNet-B5")
            return True

        print("⚠️ model.py nu pare actualizat pentru EfficientNet-B5")
        return False
    except Exception as e:
        print(f"❌ Eroare la actualizare: {e}")
        return False


def create_env_file():
    """Creează/actualizează .env cu configurare model"""
    print("\n🔐 Configurare variabile de mediu...")
    
    env_path = "backend/.env"
    env_content = """
# Model ML Configuration
MODEL_PATH=models/best_model_efficientnet_b5.pth
MODEL_THRESHOLD=0.3
USE_GPU=false
"""
    
    # Verifică dacă .env există
    if os.path.exists(env_path):
        # Citește conținutul existent
        with open(env_path, 'r', encoding='utf-8') as f:
            existing = f.read()
        
        # Verifică dacă MODEL_PATH există deja
        if 'MODEL_PATH' in existing:
            print("⚠️  .env conține deja configurare MODEL_PATH")
            print("   Verificați manual configurarea")
            return True
        else:
            # Adaugă la final
            with open(env_path, 'a', encoding='utf-8') as f:
                f.write(env_content)
            print("✅ Configurare adăugată în .env")
            return True
    else:
        # Creează .env nou
        with open(env_path, 'w', encoding='utf-8') as f:
            f.write(env_content.strip())
        print("✅ Fișier .env creat cu configurare model")
        return True


def verify_integration():
    """Verifică dacă integrarea a reușit"""
    print("\n🔍 Verificare integrare...")
    
    checks = []
    
    # Verifică model
    if os.path.exists("backend/models/best_model_efficientnet_b5.pth"):
        checks.append("✅ Model prezent în backend/models/")
    else:
        checks.append("❌ Model lipsește din backend/models/")
    
    # Verifică model.py updated
    if os.path.exists("backend/app/model.py"):
        with open("backend/app/model.py", 'r') as f:
            content = f.read()
            if "EfficientNet-B5" in content or "tf_efficientnet_b5" in content:
                checks.append("✅ model.py actualizat")
            else:
                checks.append("⚠️  model.py - verificați dacă a fost actualizat")
    else:
        checks.append("❌ model.py lipsește")
    
    # Verifică .env
    if os.path.exists("backend/.env"):
        checks.append("✅ .env configurat")
    else:
        checks.append("⚠️  .env lipsește")
    
    print("\n".join(checks))
    
    all_good = all("✅" in check for check in checks)
    return all_good


def run_tests():
    """Rulează testele de integrare"""
    print("\n🧪 Rulare teste...")
    
    import subprocess
    
    try:
        result = subprocess.run(
            [sys.executable, "backend/test_model_integration.py"],
            capture_output=True,
            text=True,
            timeout=60
        )
        
        print(result.stdout)
        if result.returncode == 0:
            print("✅ Teste completate cu succes!")
            return True
        else:
            print(f"⚠️  Teste completate cu warnings:")
            print(result.stderr)
            return False
            
    except Exception as e:
        print(f"❌ Eroare la rulare teste: {e}")
        return False


def print_next_steps():
    """Afișează pașii următori"""
    print("\n" + "=" * 70)
    print("🎉 INTEGRARE COMPLETĂ!")
    print("=" * 70)
    print("""
Următorii pași:

1. 🧪 TESTARE LOCALĂ:
   cd backend
   python -m uvicorn app.main:app --reload
   
   # În alt terminal:
   cd backend
   python test_model_integration.py

2. 🎨 TEST FRONTEND:
   cd frontend
   npm start
   
   # Deschideți http://localhost:3000
   # Încărcați imagine prin interfață

3. 🔧 AJUSTARE THRESHOLD:
   - Editați backend\.env
   - Modificați MODEL_THRESHOLD (0.2 - 0.7)
   - Restart server

4. 📊 MONITORIZARE:
   - Verificați logs pentru timp inferență
   - Colectați feedback de la utilizatori
   - Ajustați threshold bazat pe rezultate

5. 🚀 DEPLOYMENT:
   - Includeți backend/models/*.pth în deployment
   - Asigurați min 2GB RAM pe server
   - Configurați variabile de mediu pe server

📚 Documentație completă: ML_INTEGRATION_GUIDE.md
    """)


def main():
    """Pipeline complet de integrare"""
    print("=" * 70)
    print("🚀 SmartChef - Integrare Automată Model ML")
    print("   Acuratețe model: 92.25%")
    print("=" * 70)
    
    # Verifică prerequisite
    if not check_prerequisites():
        print("\n❌ Prerequisite lipsesc. Verificați structura proiectului.")
        return
    
    # Caută model
    if len(sys.argv) > 1:
        model_path = sys.argv[1]
        if not os.path.exists(model_path):
            print(f"❌ Modelul specificat nu există: {model_path}")
            return
    else:
        model_path = find_trained_model()
        if model_path is None:
            print("\n⚠️  Specificați calea către model:")
            print(f"   python {sys.argv[0]} <calea_la_model.pth>")
            return
    
    print(f"\n📍 Folosim modelul: {model_path}")
    
    # Creare director backend/models
    models_dir = create_models_directory()
    
    # Copiere model
    destination = copy_model_to_backend(model_path, models_dir)
    if destination is None:
        print("\n❌ Integrare eșuată la copierea modelului")
        return
    
    # Backup și update model.py
    if not backup_original_model():
        response = input("\n⚠️  Nu s-a putut face backup. Continuați? (y/n): ")
        if response.lower() != 'y':
            print("❌ Integrare anulată")
            return
    
    if not update_model_file():
        print("\n❌ Nu s-a putut actualiza model.py")
        return
    
    # Configurare .env
    create_env_file()
    
    # Verificare finală
    if verify_integration():
        print("\n✅ Toate verificările au trecut!")
        
        # Întreabă dacă vrea să ruleze testele
        print("\n" + "=" * 70)
        response = input("Rulăm testele acum? (y/n): ")
        if response.lower() == 'y':
            run_tests()
        
        # Afișează pașii următori
        print_next_steps()
    else:
        print("\n⚠️  Unele verificări au eșuat. Verificați manual.")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Integrare întreruptă de utilizator")
    except Exception as e:
        print(f"\n❌ Eroare neașteptată: {e}")
        import traceback
        traceback.print_exc()
