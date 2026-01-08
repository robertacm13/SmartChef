"""
Script pentru verificarea documentelor din baza de date MongoDB
"""
from app.database import food_analyses_collection, users_collection

def check_analyses():
    print("\n📊 === ANALIZE DIN BAZA DE DATE ===\n")
    
    analyses = list(food_analyses_collection.find())
    
    if not analyses:
        print("❌ Nu există analize în baza de date")
        return
    
    print(f"✅ Total analize: {len(analyses)}\n")
    
    for i, analysis in enumerate(analyses, 1):
        print(f"{i}. ID: {analysis['_id']}")
        print(f"   User: {analysis.get('user_email', 'N/A')}")
        print(f"   Imagine: {analysis.get('image_name', 'N/A')}")
        print(f"   Ingrediente: {', '.join(analysis.get('ingredients', []))}")
        print(f"   Data: {analysis.get('timestamp', 'N/A')}")
        print()

def check_users():
    print("\n👤 === UTILIZATORI DIN BAZA DE DATE ===\n")
    
    users = list(users_collection.find())
    
    if not users:
        print("❌ Nu există utilizatori în baza de date")
        return
    
    print(f"✅ Total utilizatori: {len(users)}\n")
    
    for i, user in enumerate(users, 1):
        print(f"{i}. Email: {user.get('email', 'N/A')}")
        print(f"   Data creării: {user.get('created_at', 'N/A')}")
        print()

if __name__ == "__main__":
    check_analyses()
    check_users()
