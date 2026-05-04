import joblib
from pathlib import Path

MODEL_DIR = Path("backend/ml/models")

try:
    crop_le = joblib.load(MODEL_DIR / "crop_encoder.pkl")
    fert_le = joblib.load(MODEL_DIR / "fert_encoder.pkl")
    print("Crops:", list(crop_le.classes_))
    print("Fertilizers:", list(fert_le.classes_))
except Exception as e:
    print(f"Error: {e}")
