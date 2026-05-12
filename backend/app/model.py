"""
Food recognition inference for SmartChef.

Loads an EfficientNet-B5 checkpoint trained on Food-101 and maps predicted food
labels to ingredient labels used by the nutrition module.
"""

from collections import OrderedDict
import io
import os
from pathlib import Path
from typing import Dict, Iterable, List, Optional

from PIL import Image
from app.ollama_client import detect_ingredients_from_image

# Lazy imports to avoid hard failures at startup on environments with broken torch DLLs.
torch = None
nn = None
transforms = None
timm = None


def _ensure_torch_loaded() -> None:
    """Load torch stack lazily when needed."""
    global torch, nn, transforms, timm
    if torch is not None:
        return

    import torch as torch_module
    import torch.nn as nn_module
    from torchvision import transforms as transforms_module
    import timm as timm_module

    torch = torch_module
    nn = nn_module
    transforms = transforms_module
    timm = timm_module


NUTRITION_INGREDIENT_CLASSES: List[str] = [
    "tomato",
    "egg",
    "cheese",
    "chicken",
    "rice",
    "pasta",
    "lettuce",
    "carrot",
    "onion",
    "garlic",
    "potato",
    "beef",
    "pork",
    "fish",
    "bread",
    "milk",
    "butter",
    "olive oil",
    "bell pepper",
    "mushroom",
    "broccoli",
    "spinach",
]


FOOD101_CLASSES: List[str] = [
    "apple_pie", "baby_back_ribs", "baklava", "beef_carpaccio", "beef_tartare",
    "beet_salad", "beignets", "bibimbap", "bread_pudding", "breakfast_burrito",
    "bruschetta", "caesar_salad", "cannoli", "caprese_salad", "carrot_cake",
    "ceviche", "cheese_plate", "cheesecake", "chicken_curry", "chicken_quesadilla",
    "chicken_wings", "chocolate_cake", "chocolate_mousse", "churros", "clam_chowder",
    "club_sandwich", "crab_cakes", "creme_brulee", "croque_madame", "cup_cakes",
    "deviled_eggs", "donuts", "dumplings", "edamame", "eggs_benedict", "escargots",
    "falafel", "filet_mignon", "fish_and_chips", "foie_gras", "french_fries",
    "french_onion_soup", "french_toast", "fried_calamari", "fried_rice", "frozen_yogurt",
    "garlic_bread", "gnocchi", "greek_salad", "grilled_cheese_sandwich", "grilled_salmon",
    "guacamole", "gyoza", "hamburger", "hot_and_sour_soup", "hot_dog", "huevos_rancheros",
    "hummus", "ice_cream", "lasagna", "lobster_bisque", "lobster_roll_sandwich",
    "macaroni_and_cheese", "macarons", "miso_soup", "mussels", "nachos", "omelette",
    "onion_rings", "oysters", "pad_thai", "paella", "pancakes", "panna_cotta",
    "peking_duck", "pho", "pizza", "pork_chop", "poutine", "prime_rib",
    "pulled_pork_sandwich", "ramen", "ravioli", "red_velvet_cake", "risotto", "samosa",
    "sashimi", "scallops", "seaweed_salad", "shrimp_and_grits", "spaghetti_bolognese",
    "spaghetti_carbonara", "spring_rolls", "steak", "strawberry_shortcake", "sushi", "tacos",
    "takoyaki", "tiramisu", "tuna_tartare", "waffles",
]


FOOD_CLASS_TO_INGREDIENTS: Dict[str, List[str]] = {
    "apple_pie": ["apple", "flour", "sugar", "butter", "cinnamon"],
    "pizza": ["cheese", "tomato", "bread"],
    "spaghetti_bolognese": ["pasta", "beef", "tomato", "onion"],
    "spaghetti_carbonara": ["pasta", "egg", "cheese"],
    "fried_rice": ["rice", "egg", "onion", "carrot"],
    "lasagna": ["pasta", "cheese", "tomato", "beef"],
    "ramen": ["pasta", "egg", "onion"],
    "omelette": ["egg", "cheese", "onion"],
    "caesar_salad": ["lettuce", "cheese", "olive oil"],
    "greek_salad": ["lettuce", "tomato", "olive oil", "onion"],
    "caprese_salad": ["tomato", "cheese", "olive oil"],
    "seaweed_salad": ["lettuce", "olive oil"],
    "french_fries": ["potato", "olive oil"],
    "french_onion_soup": ["onion", "butter", "bread"],
    "garlic_bread": ["bread", "garlic", "butter"],
    "grilled_cheese_sandwich": ["bread", "cheese", "butter"],
    "hamburger": ["beef", "bread", "onion"],
    "hot_dog": ["pork", "bread"],
    "pulled_pork_sandwich": ["pork", "bread", "onion"],
    "pork_chop": ["pork"],
    "baby_back_ribs": ["pork"],
    "steak": ["beef"],
    "filet_mignon": ["beef"],
    "prime_rib": ["beef"],
    "beef_carpaccio": ["beef"],
    "beef_tartare": ["beef", "egg", "onion"],
    "grilled_salmon": ["fish", "olive oil"],
    "fish_and_chips": ["fish", "potato"],
    "ceviche": ["fish", "onion"],
    "sashimi": ["fish"],
    "sushi": ["fish", "rice"],
    "tuna_tartare": ["fish", "onion"],
    "shrimp_and_grits": ["fish", "butter"],
    "chicken_curry": ["chicken", "onion", "garlic"],
    "chicken_quesadilla": ["chicken", "cheese"],
    "chicken_wings": ["chicken"],
    "breakfast_burrito": ["egg", "cheese", "onion"],
    "guacamole": ["tomato", "onion"],
    "falafel": ["lettuce", "onion", "garlic", "bread", "olive oil"],
    "huevos_rancheros": ["egg", "tomato", "onion"],
    "pad_thai": ["pasta", "egg"],
    "pho": ["pasta", "beef", "onion"],
    "paella": ["rice", "fish"],
    "risotto": ["rice", "cheese", "onion"],
    "tacos": ["beef", "tomato", "onion"],
}


KEYWORD_TO_INGREDIENT: Dict[str, str] = {
    "beef": "beef",
    "pork": "pork",
    "chicken": "chicken",
    "fish": "fish",
    "salmon": "fish",
    "tuna": "fish",
    "shrimp": "fish",
    "lobster": "fish",
    "crab": "fish",
    "mussels": "fish",
    "oysters": "fish",
    "sashimi": "fish",
    "sushi": "fish",
    "egg": "egg",
    "cheese": "cheese",
    "rice": "rice",
    "spaghetti": "pasta",
    "macaroni": "pasta",
    "ravioli": "pasta",
    "gnocchi": "pasta",
    "ramen": "pasta",
    "pasta": "pasta",
    "pizza": "cheese",
    "sandwich": "bread",
    "toast": "bread",
    "bread": "bread",
    "salad": "lettuce",
    "tomato": "tomato",
    "onion": "onion",
    "garlic": "garlic",
    "potato": "potato",
    "fries": "potato",
    "broccoli": "broccoli",
    "spinach": "spinach",
    "mushroom": "mushroom",
    "carrot": "carrot",
    "butter": "butter",
    "olive": "olive oil",
    "milk": "milk",
}


def _dedupe(items: Iterable[str]) -> List[str]:
    seen = set()
    output: List[str] = []
    for item in items:
        if item and item not in seen:
            seen.add(item)
            output.append(item)
    return output


def _map_food_class_to_ingredients(food_class: str) -> List[str]:
    if food_class in FOOD_CLASS_TO_INGREDIENTS:
        return FOOD_CLASS_TO_INGREDIENTS[food_class]

    inferred: List[str] = []
    tokens = food_class.split("_")
    for token in tokens:
        ingredient = KEYWORD_TO_INGREDIENT.get(token)
        if ingredient:
            inferred.append(ingredient)

    if not inferred:
        for keyword, ingredient in KEYWORD_TO_INGREDIENT.items():
            if keyword in food_class:
                inferred.append(ingredient)

    if not inferred:
        inferred = ["tomato", "onion"]

    return _dedupe(inferred)


def _create_efficientnet_b5_model(num_classes: int):
    """Create the architecture used during training notebook export."""
    backbone = timm.create_model(
        "tf_efficientnet_b5.ns_jft_in1k",
        pretrained=False,
        num_classes=0,
        global_pool="avg",
    )
    head = nn.Sequential(
        nn.Dropout(p=0.4),
        nn.Linear(backbone.num_features, num_classes),
    )

    class FoodClassifier(nn.Module):
        def __init__(self, b, h):
            super().__init__()
            self.backbone = b
            self.head = h

        def forward(self, x):
            return self.head(self.backbone(x))

    return FoodClassifier(backbone, head)


class FoodRecognitionModel:
    """EfficientNet-B5 model adapter used by the API."""

    def __init__(self, model_path: Optional[str] = None, use_gpu: bool = False):
        self.ingredient_classes = NUTRITION_INGREDIENT_CLASSES.copy()
        self.food_classes = FOOD101_CLASSES.copy()
        self.model = None
        self.model_loaded = False
        self.device = "cpu"
        self.last_top_foods: List[Dict[str, float]] = []

        self._torch_available = False
        self._torch_error = ""

        try:
            _ensure_torch_loaded()
            self._torch_available = True
            self.device = "cuda" if use_gpu and torch.cuda.is_available() else "cpu"
        except Exception as exc:
            self._torch_available = False
            self._torch_error = str(exc)
            print(f"Warning: Torch stack unavailable ({self._torch_error})")
            print("Install Visual C++ Redistributable if on Windows and DLL errors appear.")

        if model_path and Path(model_path).exists():
            self.load_model(model_path)
        else:
            print(f"Warning: model file not found at path: {model_path}")

    def _get_transforms(self):
        return transforms.Compose([
            transforms.Resize(456),
            transforms.CenterCrop(456),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225],
            ),
        ])

    def _extract_state_dict(self, checkpoint):
        if isinstance(checkpoint, dict):
            for key in ("model_state_dict", "state_dict", "model"):
                value = checkpoint.get(key)
                if isinstance(value, dict):
                    return value
            if checkpoint and all(hasattr(v, "shape") for v in checkpoint.values()):
                return checkpoint
        if hasattr(checkpoint, "keys"):
            return checkpoint
        raise ValueError("Unsupported checkpoint format")

    def _normalize_state_dict(self, state_dict: Dict[str, object]) -> OrderedDict:
        normalized = OrderedDict()
        for key, value in state_dict.items():
            cleaned_key = key[7:] if key.startswith("module.") else key
            normalized[cleaned_key] = value
        return normalized

    def load_model(self, model_path: str) -> None:
        if not self._torch_available:
            print("Warning: skipping model load because torch is unavailable.")
            return

        try:
            print(f"Loading EfficientNet-B5 model from: {model_path}")
            checkpoint = torch.load(model_path, map_location=self.device, weights_only=False)

            if isinstance(checkpoint, dict) and "class_names" in checkpoint:
                class_names = checkpoint["class_names"]
                if isinstance(class_names, list) and len(class_names) == len(self.food_classes):
                    self.food_classes = class_names

            state_dict = self._extract_state_dict(checkpoint)
            state_dict = self._normalize_state_dict(state_dict)

            self.model = _create_efficientnet_b5_model(num_classes=len(self.food_classes))
            load_result = self.model.load_state_dict(state_dict, strict=False)

            if len(load_result.missing_keys) > 8:
                raise RuntimeError(
                    "Checkpoint mismatch. Missing keys: "
                    f"{len(load_result.missing_keys)}, unexpected keys: {len(load_result.unexpected_keys)}"
                )

            self.model.to(self.device)
            self.model.eval()
            self.model_loaded = True

            print("Model loaded successfully.")
            print(f"Device: {self.device}")
            print(f"Classes: {len(self.food_classes)}")
        except Exception as exc:
            self.model_loaded = False
            self.model = None
            print(f"Error loading model: {exc}")

    def predict(self, image_bytes: bytes, threshold: float = 0.3) -> Dict[str, object]:
        """
        Predict food name and ingredients from an image.

        For this B5 checkpoint, the network predicts Food-101 classes first and
        then maps top classes to known SmartChef ingredients using hardcoded mappings.
        
        Returns dict with:
        - food_name: str (e.g., "pizza", "spaghetti_bolognese")
        - ingredients: List[str] (mapped ingredient labels)
        - confidence: float (confidence of top food prediction)
        """
        try:
            if not self._torch_available or not self.model_loaded or self.model is None:
                return {
                    "food_name": "unknown",
                    "ingredients": [],
                    "confidence": 0.0
                }

            image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            image_tensor = self._get_transforms()(image).unsqueeze(0).to(self.device)

            with torch.no_grad():
                logits = self.model(image_tensor)
                probs = torch.softmax(logits, dim=1)[0]

            top_k = min(5, len(self.food_classes))
            top_probs, top_indices = torch.topk(probs, k=top_k)
            threshold = max(0.01, min(float(threshold), 0.99))

            selected_foods: List[str] = []
            self.last_top_foods = []
            top_food_name = ""
            top_confidence = 0.0

            for idx, (prob, food_idx) in enumerate(zip(top_probs.tolist(), top_indices.tolist())):
                food_label = self.food_classes[food_idx]
                self.last_top_foods.append({"food": food_label, "confidence": prob})
                if idx == 0:
                    top_food_name = food_label
                    top_confidence = prob
                if prob >= threshold:
                    selected_foods.append(food_label)

            if not selected_foods:
                selected_foods = [self.food_classes[top_indices[0].item()]]

            ingredient_predictions: List[str] = []
            for food_label in selected_foods:
                ingredient_predictions.extend(_map_food_class_to_ingredients(food_label))

            ingredient_predictions = _dedupe(ingredient_predictions)

            return {
                "food_name": top_food_name,
                "ingredients": ingredient_predictions[:8],
                "confidence": top_confidence
            }
        except Exception as exc:
            print(f"Prediction error: {exc}")
            return {
                "food_name": "unknown",
                "ingredients": [],
                "confidence": 0.0
            }


_model_instance = None


def _resolve_model_path_from_env(model_path_env: Optional[str]) -> str:
    backend_dir = Path(__file__).resolve().parent.parent
    project_dir = backend_dir.parent

    if model_path_env:
        candidate = Path(model_path_env)
        if candidate.is_absolute():
            return str(candidate)

        backend_relative = backend_dir / candidate
        if backend_relative.exists():
            return str(backend_relative)

        project_relative = project_dir / candidate
        if project_relative.exists():
            return str(project_relative)

        return str(backend_relative)

    default_candidates = [
        backend_dir / "models" / "best_model_efficientnet_b5.pth",
        backend_dir / "models" / "food_recognition_model.pth",
        project_dir / "best_model_efficientnet_b5.pth",
    ]
    for candidate in default_candidates:
        if candidate.exists():
            return str(candidate)

    return str(default_candidates[0])


def get_model() -> FoodRecognitionModel:
    """Get or create the singleton model instance."""
    global _model_instance
    if _model_instance is None:
        model_path_env = os.getenv("MODEL_PATH")
        use_gpu = os.getenv("USE_GPU", "false").lower() == "true"
        resolved_model_path = _resolve_model_path_from_env(model_path_env)

        print(f"Initializing model from: {resolved_model_path}")
        _model_instance = FoodRecognitionModel(resolved_model_path, use_gpu=use_gpu)
    return _model_instance
