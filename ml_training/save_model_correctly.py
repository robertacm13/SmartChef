"""
Script pentru salvarea corectă a modelului antrenat

Folosiți acest script pentru a salva modelul în formatul așteptat de backend.
Rulați acest script DUPĂ ce ați antrenat modelul.
"""

import torch
import sys

def save_trained_model(
    model,
    class_names,
    accuracy,
    output_path="food_recognition_model.pth",
    epoch=None,
    optimizer=None
):
    """
    Salvează modelul antrenat cu toate metadatele necesare.
    
    Args:
        model: Modelul PyTorch antrenat
        class_names: Lista cu numele ingredientelor (în ordinea claselor)
        accuracy: Acuratețea finală pe validation set (%)
        output_path: Unde să salveze fișierul .pth
        epoch: Epoch-ul la care s-a obținut cel mai bun rezultat
        optimizer: Optimizer (opțional, pentru continuare antrenare)
    """
    
    # Pregătește checkpoint-ul
    checkpoint = {
        'model_state_dict': model.state_dict(),
        'class_names': class_names,
        'accuracy': accuracy,
        'num_classes': len(class_names),
        'save_date': str(torch.cuda.Event().record() if torch.cuda.is_available() else "N/A"),
        'architecture': type(model).__name__
    }
    
    if epoch is not None:
        checkpoint['epoch'] = epoch
    
    if optimizer is not None:
        checkpoint['optimizer_state_dict'] = optimizer.state_dict()
    
    # Salvează
    torch.save(checkpoint, output_path)
    
    print(f"✅ Model salvat cu succes: {output_path}")
    print(f"📊 Acuratețe: {accuracy:.2f}%")
    print(f"🎯 Număr clase: {len(class_names)}")
    print(f"📋 Ingrediente: {', '.join(class_names[:5])}...")
    
    # Verifică dimensiunea fișierului
    import os
    size_mb = os.path.getsize(output_path) / (1024 * 1024)
    print(f"💾 Dimensiune: {size_mb:.2f} MB")
    
    return output_path


def example_usage():
    """
    Exemplu de utilizare după antrenare
    """
    print("=" * 60)
    print("EXEMPLU DE SALVARE MODEL")
    print("=" * 60)
    
    # Presupunem că aveți deja modelul antrenat
    # model = your_trained_model
    # class_names = ['tomato', 'egg', 'cheese', ...]
    # best_accuracy = 92.06
    
    print("""
    # În scriptul dvs. de training, după antrenare:
    
    from save_model_correctly import save_trained_model
    
    # Salvați modelul
    save_trained_model(
        model=trained_model,
        class_names=ingredient_class_names,
        accuracy=92.06,  # Acuratețea dvs.
        output_path='food_recognition_model.pth',
        epoch=best_epoch,
        optimizer=optimizer  # opțional
    )
    """)
    
    print("\n" + "=" * 60)
    print("PAȘI DUPĂ SALVARE")
    print("=" * 60)
    print("""
    1. Copiați food_recognition_model.pth în backend/models/
    2. Înlocuiți backend/app/model.py cu backend/app/model_updated.py
    3. Testați cu backend/test_model_integration.py
    4. Restartați serverul backend
    """)


# Script pentru verificare checkpoint existent
def verify_checkpoint(checkpoint_path):
    """
    Verifică un checkpoint existent și afișează informații despre el.
    
    Args:
        checkpoint_path: Calea către fișierul .pth
    """
    try:
        import torch
        
        print(f"\n🔍 Verificare checkpoint: {checkpoint_path}")
        print("=" * 60)
        
        checkpoint = torch.load(checkpoint_path, map_location='cpu')
        
        if isinstance(checkpoint, dict):
            print("📦 Checkpoint conține:")
            for key in checkpoint.keys():
                if key == 'model_state_dict':
                    print(f"   ✅ model_state_dict")
                elif key == 'class_names':
                    classes = checkpoint[key]
                    print(f"   ✅ class_names: {len(classes)} clase")
                    print(f"      Primele 5: {classes[:5]}")
                elif key == 'accuracy':
                    print(f"   ✅ accuracy: {checkpoint[key]:.2f}%")
                else:
                    print(f"   ℹ️  {key}: {type(checkpoint[key])}")
                    
            # Verifică dacă lipsesc câmpuri importante
            if 'class_names' not in checkpoint:
                print("\n⚠️  WARNING: 'class_names' lipsește din checkpoint!")
                print("   Trebuie să știți manual clasele în ordinea corectă.")
            
            if 'model_state_dict' not in checkpoint:
                print("\n⚠️  WARNING: 'model_state_dict' lipsește!")
                print("   Checkpoint-ul ar putea fi doar state_dict direct.")
        else:
            print("ℹ️  Checkpoint este direct state_dict (fără metadata)")
            print("   Număr parametri:", len(checkpoint))
        
        print("=" * 60)
        print("✅ Checkpoint valid!")
        
    except Exception as e:
        print(f"❌ Eroare la verificare: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Verifică checkpoint dacă se specifică calea
        verify_checkpoint(sys.argv[1])
    else:
        # Afișează exemplu de utilizare
        example_usage()
