"""
Export Model pentru SmartChef Backend

Acest script ajută la exportul modelului antrenat în formatul așteptat.
Folosiți-l dacă aveți doar weights (state_dict) fără metadata.
"""

import torch
import argparse
import os
from pathlib import Path


def export_model(input_path, output_path, class_names, accuracy=None, architecture='resnet50'):
    """
    Exportă modelul în formatul așteptat de backend.
    
    Args:
        input_path: Calea către modelul antrenat (.pth/.pt)
        output_path: Unde să salveze modelul formatat
        class_names: Lista de ingrediente (în ordinea claselor)
        accuracy: Acuratețea modelului (opțional)
        architecture: Arhitectura folosită
    """
    
    print("=" * 70)
    print("🔄 EXPORT MODEL PENTRU SMARTCHEF BACKEND")
    print("=" * 70)
    
    print(f"\n📂 Input: {input_path}")
    print(f"📂 Output: {output_path}")
    print(f"🎯 Classes: {len(class_names)}")
    print(f"📊 Accuracy: {accuracy}%" if accuracy else "📊 Accuracy: Not specified")
    
    try:
        # Încarcă checkpoint-ul existent
        print("\n🔄 Loading original checkpoint...")
        checkpoint_original = torch.load(input_path, map_location='cpu')
        
        # Verifică tipul checkpoint-ului
        if isinstance(checkpoint_original, dict):
            # Checkpoint cu metadata
            print("✅ Checkpoint conține metadata")
            
            # Extrage state_dict
            if 'model_state_dict' in checkpoint_original:
                state_dict = checkpoint_original['model_state_dict']
            elif 'state_dict' in checkpoint_original:
                state_dict = checkpoint_original['state_dict']
            else:
                # Încearcă să folosim checkpoint-ul direct
                state_dict = checkpoint_original
            
            # Păstrează metadata existentă
            existing_accuracy = checkpoint_original.get('accuracy', accuracy)
            existing_classes = checkpoint_original.get('class_names', class_names)
            
        else:
            # Checkpoint este direct state_dict
            print("ℹ️  Checkpoint este state_dict direct (fără metadata)")
            state_dict = checkpoint_original
            existing_accuracy = accuracy
            existing_classes = class_names
        
        # Creează checkpoint-ul nou în formatul așteptat
        new_checkpoint = {
            'model_state_dict': state_dict,
            'class_names': existing_classes if isinstance(existing_classes, list) else class_names,
            'num_classes': len(class_names),
            'architecture': architecture,
        }
        
        if existing_accuracy is not None:
            new_checkpoint['accuracy'] = existing_accuracy
        
        # Salvează
        print("\n💾 Saving formatted checkpoint...")
        torch.save(new_checkpoint, output_path)
        
        # Verifică rezultatul
        size_mb = os.path.getsize(output_path) / (1024 * 1024)
        
        print("\n" + "=" * 70)
        print("✅ EXPORT REUȘIT!")
        print("=" * 70)
        print(f"📦 Fișier salvat: {output_path}")
        print(f"💾 Dimensiune: {size_mb:.2f} MB")
        print(f"🎯 Clase: {len(new_checkpoint['class_names'])}")
        
        if 'accuracy' in new_checkpoint:
            print(f"📊 Acuratețe: {new_checkpoint['accuracy']:.2f}%")
        
        print("\n📋 Ingrediente incluse:")
        for i, cls in enumerate(new_checkpoint['class_names'][:10]):
            print(f"   {i+1}. {cls}")
        if len(new_checkpoint['class_names']) > 10:
            print(f"   ... și încă {len(new_checkpoint['class_names']) - 10} ingrediente")
        
        print("\n🎯 Următorii pași:")
        print(f"   1. Verificați: python ml_training/save_model_correctly.py {output_path}")
        print(f"   2. Integrați: python integrate_model.py {output_path}")
        
        return True
        
    except Exception as e:
        print(f"\n❌ EROARE: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    parser = argparse.ArgumentParser(
        description="Export model pentru SmartChef backend"
    )
    
    parser.add_argument(
        '--input', '-i',
        required=True,
        help='Calea către modelul antrenat (.pth)'
    )
    
    parser.add_argument(
        '--output', '-o',
        default='food_recognition_model.pth',
        help='Calea unde să salveze modelul formatat (default: food_recognition_model.pth)'
    )
    
    parser.add_argument(
        '--classes', '-c',
        help='Lista de clase separate prin virgulă (ex: tomato,egg,cheese)'
    )
    
    parser.add_argument(
        '--accuracy', '-a',
        type=float,
        default=92.06,
        help='Acuratețea modelului (default: 92.06)'
    )
    
    parser.add_argument(
        '--architecture', '-arch',
        default='resnet50',
        help='Arhitectura modelului (default: resnet50)'
    )
    
    args = parser.parse_args()
    
    # Pregătește lista de clase
    if args.classes:
        class_names = [c.strip() for c in args.classes.split(',')]
    else:
        # Folosește lista default
        class_names = [
            "tomato", "egg", "cheese", "chicken", "rice", "pasta",
            "lettuce", "carrot", "onion", "garlic", "potato", "beef",
            "pork", "fish", "bread", "milk", "butter", "olive oil",
            "bell pepper", "mushroom", "broccoli", "spinach"
        ]
        print(f"⚠️  Nu s-au specificat clase, folosim lista default")
        print(f"   Pentru a specifica clase: --classes tomato,egg,cheese,...")
    
    # Export
    success = export_model(
        input_path=args.input,
        output_path=args.output,
        class_names=class_names,
        accuracy=args.accuracy,
        architecture=args.architecture
    )
    
    if success:
        print("\n🎉 Export complet!")
    else:
        print("\n❌ Export eșuat")
        sys.exit(1)


if __name__ == "__main__":
    # Verifică dacă rulează cu argumente
    if len(sys.argv) == 1:
        print("""
╔════════════════════════════════════════════════════════════════════╗
║  Export Model pentru SmartChef                                     ║
╚════════════════════════════════════════════════════════════════════╝

Acest script transformă modelul dvs. antrenat în formatul
așteptat de backend-ul SmartChef.

📖 USAGE:

  python export_your_model.py --input <model.pth> [opțiuni]

📋 EXEMPLE:

  # Export simplu (cu clase default)
  python export_your_model.py --input my_trained_model.pth

  # Export cu clase custom și acuratețe
  python export_your_model.py \\
    --input my_model.pth \\
    --output food_recognition_model.pth \\
    --classes "tomato,egg,cheese,chicken,rice,pasta" \\
    --accuracy 92.06

  # Cu arhitectură diferită
  python export_your_model.py \\
    --input efficientnet_model.pth \\
    --architecture efficientnet_b0 \\
    --accuracy 94.5

⚙️  OPȚIUNI:

  --input, -i       Calea către modelul antrenat (OBLIGATORIU)
  --output, -o      Calea output (default: food_recognition_model.pth)
  --classes, -c     Lista clase separate prin virgulă
  --accuracy, -a    Acuratețea modelului (default: 92.06)
  --architecture    Arhitectura (default: resnet50)

📞 AJUTOR:

  python export_your_model.py --help
        """)
    else:
        main()
