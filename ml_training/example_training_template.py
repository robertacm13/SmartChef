"""
Template pentru training food recognition model

Acest template arată structura recomandată pentru antrenarea modelului.
Adaptați la nevoile dvs. specifice.
"""

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, Dataset
from torchvision import models, transforms
from PIL import Image
import os
from pathlib import Path
from tqdm import tqdm
from sklearn.metrics import accuracy_score, precision_recall_fscore_support
import numpy as np

# ============================================================================
# CONFIGURARE
# ============================================================================

CONFIG = {
    # Date
    'data_dir': 'food_dataset/',  # Director cu imagini
    'train_split': 0.8,
    'val_split': 0.2,
    
    # Model
    'architecture': 'resnet50',  # resnet50, efficientnet_b0, etc.
    'num_classes': 22,  # Numărul de ingrediente
    'pretrained': True,  # Folosește pretrained weights
    
    # Training
    'batch_size': 32,
    'num_epochs': 50,
    'learning_rate': 0.001,
    'weight_decay': 1e-4,
    
    # Optimizare
    'device': 'cuda' if torch.cuda.is_available() else 'cpu',
    'num_workers': 4,
    
    # Salvare
    'checkpoint_dir': 'checkpoints/',
    'save_best_only': True
}

# Lista de ingrediente (clasele modelului)
CLASS_NAMES = [
    "tomato", "egg", "cheese", "chicken", "rice", "pasta",
    "lettuce", "carrot", "onion", "garlic", "potato", "beef",
    "pork", "fish", "bread", "milk", "butter", "olive oil",
    "bell pepper", "mushroom", "broccoli", "spinach"
]

# ============================================================================
# DATASET
# ============================================================================

class FoodDataset(Dataset):
    """
    Custom Dataset pentru imagini de mâncare.
    
    Structură așteptată:
    food_dataset/
        train/
            class1/
                img1.jpg
                img2.jpg
            class2/
                img1.jpg
        val/
            class1/
            class2/
    """
    
    def __init__(self, root_dir, transform=None, is_multilabel=True):
        self.root_dir = root_dir
        self.transform = transform
        self.is_multilabel = is_multilabel
        
        # TODO: Implementați încărcarea imaginilor și labels
        # self.images = []
        # self.labels = []
    
    def __len__(self):
        return len(self.images)
    
    def __getitem__(self, idx):
        image = Image.open(self.images[idx]).convert('RGB')
        label = self.labels[idx]
        
        if self.transform:
            image = self.transform(image)
        
        return image, label


# ============================================================================
# DATA PREPROCESSING
# ============================================================================

def get_transforms(is_training=True):
    """
    Transformări pentru imagini.
    Training: cu augmentări
    Validation: doar normalizare
    """
    if is_training:
        return transforms.Compose([
            transforms.Resize(256),
            transforms.RandomCrop(224),
            transforms.RandomHorizontalFlip(),
            transforms.RandomRotation(15),
            transforms.ColorJitter(brightness=0.2, contrast=0.2),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])
    else:
        return transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            )
        ])


# ============================================================================
# MODEL
# ============================================================================

def create_model(num_classes, architecture='resnet50', pretrained=True):
    """
    Creează modelul de clasificare.
    
    Args:
        num_classes: Numărul de ingrediente
        architecture: 'resnet50', 'resnet101', 'efficientnet_b0'
        pretrained: Folosește ImageNet pretrained weights
    
    Returns:
        model: PyTorch model
    """
    if architecture == 'resnet50':
        model = models.resnet50(pretrained=pretrained)
        # Modifică ultimul layer pentru multi-label classification
        model.fc = nn.Linear(model.fc.in_features, num_classes)
        
    elif architecture == 'resnet101':
        model = models.resnet101(pretrained=pretrained)
        model.fc = nn.Linear(model.fc.in_features, num_classes)
        
    elif architecture == 'efficientnet_b0':
        model = models.efficientnet_b0(pretrained=pretrained)
        model.classifier[1] = nn.Linear(model.classifier[1].in_features, num_classes)
    
    else:
        raise ValueError(f"Arhitectură necunoscută: {architecture}")
    
    return model


# ============================================================================
# TRAINING
# ============================================================================

def train_one_epoch(model, dataloader, criterion, optimizer, device):
    """Training loop pentru un epoch"""
    model.train()
    running_loss = 0.0
    all_predictions = []
    all_labels = []
    
    pbar = tqdm(dataloader, desc="Training")
    for images, labels in pbar:
        images = images.to(device)
        labels = labels.to(device)
        
        # Forward pass
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels.float())
        
        # Backward pass
        loss.backward()
        optimizer.step()
        
        running_loss += loss.item()
        
        # Pentru metrici
        predictions = (torch.sigmoid(outputs) > 0.5).cpu().numpy()
        all_predictions.extend(predictions)
        all_labels.extend(labels.cpu().numpy())
        
        pbar.set_postfix({'loss': loss.item()})
    
    # Calculate metrics
    epoch_loss = running_loss / len(dataloader)
    accuracy = accuracy_score(np.array(all_labels).flatten(), 
                             np.array(all_predictions).flatten())
    
    return epoch_loss, accuracy


def validate(model, dataloader, criterion, device):
    """Validation loop"""
    model.eval()
    running_loss = 0.0
    all_predictions = []
    all_labels = []
    
    with torch.no_grad():
        pbar = tqdm(dataloader, desc="Validation")
        for images, labels in pbar:
            images = images.to(device)
            labels = labels.to(device)
            
            outputs = model(images)
            loss = criterion(outputs, labels.float())
            
            running_loss += loss.item()
            
            predictions = (torch.sigmoid(outputs) > 0.5).cpu().numpy()
            all_predictions.extend(predictions)
            all_labels.extend(labels.cpu().numpy())
            
            pbar.set_postfix({'loss': loss.item()})
    
    epoch_loss = running_loss / len(dataloader)
    accuracy = accuracy_score(np.array(all_labels).flatten(), 
                             np.array(all_predictions).flatten())
    
    return epoch_loss, accuracy


def main():
    """
    Pipeline complet de training
    
    Pentru a folosi acest template:
    1. Pregătiți dataset-ul în formatul corect
    2. Actualizați CONFIG cu setările dvs.
    3. Implementați FoodDataset pentru a încărca datele
    4. Rulați training-ul
    5. Salvați modelul cu save_model_correctly.py
    """
    print("🚀 SmartChef Food Recognition Training")
    print("=" * 70)
    
    # Setup
    device = torch.device(CONFIG['device'])
    print(f"📱 Device: {device}")
    
    # TODO: Implementați încărcarea datelor
    # train_dataset = FoodDataset(...)
    # val_dataset = FoodDataset(...)
    # train_loader = DataLoader(train_dataset, ...)
    # val_loader = DataLoader(val_dataset, ...)
    
    # Create model
    model = create_model(
        num_classes=CONFIG['num_classes'],
        architecture=CONFIG['architecture'],
        pretrained=CONFIG['pretrained']
    )
    model = model.to(device)
    
    # Loss și optimizer
    # Pentru multi-label classification
    criterion = nn.BCEWithLogitsLoss()
    optimizer = optim.Adam(
        model.parameters(),
        lr=CONFIG['learning_rate'],
        weight_decay=CONFIG['weight_decay']
    )
    
    # Learning rate scheduler
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(
        optimizer, mode='min', patience=5, factor=0.5
    )
    
    # Training loop
    best_accuracy = 0.0
    
    for epoch in range(CONFIG['num_epochs']):
        print(f"\n📅 Epoch {epoch+1}/{CONFIG['num_epochs']}")
        
        # Train
        train_loss, train_acc = train_one_epoch(
            model, train_loader, criterion, optimizer, device
        )
        
        # Validate
        val_loss, val_acc = validate(
            model, val_loader, criterion, device
        )
        
        print(f"   Train Loss: {train_loss:.4f}, Acc: {train_acc:.4f}")
        print(f"   Val Loss: {val_loss:.4f}, Acc: {val_acc:.4f}")
        
        # Learning rate scheduling
        scheduler.step(val_loss)
        
        # Save best model
        if val_acc > best_accuracy:
            best_accuracy = val_acc
            
            checkpoint = {
                'model_state_dict': model.state_dict(),
                'class_names': CLASS_NAMES,
                'accuracy': best_accuracy * 100,
                'epoch': epoch + 1,
                'optimizer_state_dict': optimizer.state_dict()
            }
            
            save_path = os.path.join(
                CONFIG['checkpoint_dir'], 
                'food_recognition_model.pth'
            )
            os.makedirs(CONFIG['checkpoint_dir'], exist_ok=True)
            torch.save(checkpoint, save_path)
            
            print(f"   ✅ Saved best model: {save_path} (acc: {best_accuracy:.4f})")
    
    print(f"\n🎉 Training completed!")
    print(f"   Best validation accuracy: {best_accuracy*100:.2f}%")


if __name__ == "__main__":
    print("""
    ⚠️  ATENȚIE: Acesta este un TEMPLATE
    
    Pentru a antrena modelul:
    1. Pregătiți dataset-ul cu imagini etichetate
    2. Implementați FoodDataset pentru datele dvs.
    3. Configurați parametrii în CONFIG
    4. Rulați scriptul
    
    Dacă ați antrenat deja modelul cu 92.06% acuratețe,
    folosiți save_model_correctly.py pentru a-l salva în formatul corect.
    """)
    
    # Decomentați pentru a rula training-ul
    # main()
