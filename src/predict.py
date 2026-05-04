"""
100% ML Model Loader and Inference
===================================
Loads the 4 trained ML pipelines at startup.
"""

from pathlib import Path
from dataclasses import dataclass
from typing import List, Dict
import numpy as np
import joblib

BASE_DIR = Path(__file__).parent.parent
MODEL_DIR = BASE_DIR / "models"

@dataclass
class MLResult:
    crop: str
    crop_confidence: float
    top3_crops: List[dict]
    yield_estimate: float
    shi_score: float
    health_category: str
    fertilizer: str

class Predictor:
    def __init__(self):
        try:
            self.crop_model = joblib.load(MODEL_DIR / "crop_pipeline.pkl")
            self.yield_model = joblib.load(MODEL_DIR / "yield_pipeline.pkl")
            self.shi_model = joblib.load(MODEL_DIR / "shi_pipeline.pkl")
            self.fert_model = joblib.load(MODEL_DIR / "fert_pipeline.pkl")
            self.crop_le = joblib.load(MODEL_DIR / "crop_encoder.pkl")
            self.fert_le = joblib.load(MODEL_DIR / "fert_encoder.pkl")
            print("All 4 ML Pipelines loaded.")
        except FileNotFoundError as e:
            raise FileNotFoundError(f"Model missing: {e}. Run 'python src/train_model.py' first.")

    def run_all(self, data: dict) -> MLResult:
        """
        data dict contains: N, P, K, temperature, humidity, pH, rainfall, organic_carbon
        """
        # Crop/Yield/SHI require: [N, P, K, temp, hum, pH, rainfall]
        features_7 = np.array([[
            data["N"], data["P"], data["K"], 
            data["temperature"], data["humidity"], 
            data["pH"], data["rainfall"]
        ]])
        
        # 1. Crop
        proba = self.crop_model.predict_proba(features_7)[0]
        top3_idx = np.argsort(proba)[::-1][:3]
        top3 = [
            {"crop": self.crop_le.classes_[i], "confidence": round(float(proba[i]), 4)}
            for i in top3_idx
        ]
        best_crop = top3[0]["crop"]
        conf = top3[0]["confidence"]
        
        # 2. Yield
        yield_est = round(max(0.1, float(self.yield_model.predict(features_7)[0])), 2)
        
        # 3. SHI Score
        shi_score = round(max(0.0, min(100.0, float(self.shi_model.predict(features_7)[0]))), 1)
        if shi_score >= 81: cat = "Excellent"
        elif shi_score >= 61: cat = "Good"
        elif shi_score >= 41: cat = "Moderate"
        elif shi_score >= 21: cat = "Poor"
        else: cat = "Critical"

        # 4. Fertilizer
        # Fertilizer model requires: [N, P, K, temp, hum, moisture]
        # Soil moisture is highly correlated with humidity and rainfall. 
        # If the user form doesn't provide it directly, we approximate it.
        moisture = data.get("moisture", data["humidity"] * 0.8)
        
        features_6 = np.array([[
            data["N"], data["P"], data["K"],
            data["temperature"], data["humidity"], moisture
        ]])
        
        fert_idx = self.fert_model.predict(features_6)[0]
        best_fert = self.fert_le.classes_[fert_idx]

        return MLResult(
            crop=best_crop,
            crop_confidence=conf,
            top3_crops=top3,
            yield_estimate=yield_est,
            shi_score=shi_score,
            health_category=cat,
            fertilizer=best_fert
        )
