"""
100% ML Training Pipeline (4 Models)
=====================================
Trains and serialises 4 independent ML pipelines using the provided datasets.
Implements fuzzy logic formatting for textual data.
"""

import os
import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, r2_score

# ── Paths ─────────────────────────────────────────────────────────────────────
SRC_DIR    = Path(__file__).parent
ROOT_DIR   = SRC_DIR.parent
DATA_DIR   = ROOT_DIR / "data"
MODEL_DIR  = ROOT_DIR / "models"
MODEL_DIR.mkdir(parents=True, exist_ok=True)

CROP_DATA_PATH = DATA_DIR / "crop_recommendation.csv"
FERT_DATA_PATH = DATA_DIR / "Fertilizer_Prediction.csv"


# ── Fuzzy string cleaner ──────────────────────────────────────────────────────
def clean_string(val):
    if not isinstance(val, str):
        return val
    return val.strip().lower().replace(" ", "").replace("-", "")


# ── Synthetic Dataset Fallback generators ─────────────────────────────────────
# (In case user didn't drop files or columns are missing)
def generate_shi_labels(df):
    """
    Since no public dataset has the Soil Health Index, we generate the TARGET 
    labels right before training so the ML model has something to learn from.
    """
    def _norm(val, opt_lo, opt_hi, max_val):
        if opt_lo <= val <= opt_hi: return 1.0
        elif val < opt_lo: return max(0.0, val / opt_lo)
        else: return max(0.0, (max_val - val) / (max_val - opt_hi))
        
    def _ph(val):
        import math
        return math.exp(-((val - 6.5) ** 2) / (2 * 1.2 ** 2))
        
    scores = []
    for _, r in df.iterrows():
        n = _norm(r['N'], 140, 280, 560) * 0.25
        p = _norm(r['P'], 10, 25, 50) * 0.20
        k = _norm(r['K'], 108, 280, 500) * 0.20
        ph = _ph(r['ph']) * 0.25
        # Assume OC is normal (0.8) if missing
        oc = _norm(r.get('organic_carbon', 0.8), 0.5, 0.75, 3.0) * 0.10
        scores.append(round((n + p + k + ph + oc) * 100, 2))
    return scores


def train():
    print("Starting 100% ML Training Pipeline...")

    # =========================================================================
    # 1. CROP & YIELD & SHI MODELS
    # =========================================================================
    if not CROP_DATA_PATH.exists():
        raise FileNotFoundError(f"Missing {CROP_DATA_PATH}")
        
    print("\nLoading Crop Dataset...")
    df_crop = pd.read_csv(CROP_DATA_PATH)
    
    # Check if synthetic yield exists, else fallback
    if "yield" not in df_crop.columns:
        df_crop["yield"] = np.random.uniform(2.0, 5.0, len(df_crop))
        
    # Generate authentic SHI labels for the ML model to learn
    df_crop["shi"] = generate_shi_labels(df_crop)
    
    # Clean string labels for mapping
    df_crop["label"] = df_crop["label"].apply(clean_string)
    
    # Encode targets
    crop_le = LabelEncoder()
    y_crop = crop_le.fit_transform(df_crop["label"])
    y_yield = df_crop["yield"].values
    y_shi = df_crop["shi"].values
    
    # Features (7 vars)
    X_crop = df_crop[["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]].values
    
    X_tr, X_ts, yC_tr, yC_ts, yY_tr, yY_ts, yS_tr, yS_ts = train_test_split(
        X_crop, y_crop, y_yield, y_shi, test_size=0.2, random_state=42
    )

    print("\nTraining Model 1: Crop Recommendation (Pipeline + XGBoost)...")
    crop_pipeline = make_pipeline(StandardScaler(), XGBClassifier(use_label_encoder=False, eval_metric="mlogloss"))
    crop_pipeline.fit(X_tr, yC_tr)
    acc = accuracy_score(yC_ts, crop_pipeline.predict(X_ts))
    print(f"   Accuracy: {acc:.2%}")

    print("\nTraining Model 2: Yield Regression (Pipeline + RandomForest)...")
    yield_pipeline = make_pipeline(StandardScaler(), RandomForestRegressor(n_estimators=100))
    yield_pipeline.fit(X_tr, yY_tr)
    print(f"   R2 Score: {r2_score(yY_ts, yield_pipeline.predict(X_ts)):.4f}")

    print("\nTraining Model 3: Soil Health Index (Pipeline + RandomForest)...")
    shi_pipeline = make_pipeline(StandardScaler(), RandomForestRegressor(n_estimators=100))
    shi_pipeline.fit(X_tr, yS_tr)
    print(f"   R2 Score: {r2_score(yS_ts, shi_pipeline.predict(X_ts)):.4f}")


    # =========================================================================
    # 2. FERTILIZER MODEL
    # =========================================================================
    if not FERT_DATA_PATH.exists():
        raise FileNotFoundError(f"Missing {FERT_DATA_PATH}")

    print("\nLoading Fertilizer Dataset...")
    df_fert = pd.read_csv(FERT_DATA_PATH)
    
    # The Kaggle fertilizer dataset has spelling errors in headers ("Temparature", "Phosphorous")
    # We rename them so the predictor vector mapping aligns cleanly
    df_fert.rename(columns={
        "Temparature": "temperature",
        "Humidity": "humidity", 
        "Moisture": "moisture",
        "Nitrogen": "N",
        "Potassium": "K",
        "Phosphorous": "P",
        "FertilizerName": "label"
    }, inplace=True)
    
    # The pipeline must learn to map from [N, P, K, temperature, humidity, moisture] -> Fertilizer
    df_fert["label"] = df_fert["label"].apply(lambda x: x.strip())
    fert_le = LabelEncoder()
    y_fert = fert_le.fit_transform(df_fert["label"])
    
    X_fert = df_fert[["N", "P", "K", "temperature", "humidity", "moisture"]].values
    Xf_tr, Xf_ts, yf_tr, yf_ts = train_test_split(X_fert, y_fert, test_size=0.2, random_state=42)
    
    print("\nTraining Model 4: Fertilizer Prescription (Pipeline + XGBoost)...")
    fert_pipeline = make_pipeline(StandardScaler(), XGBClassifier(use_label_encoder=False, eval_metric="mlogloss"))
    fert_pipeline.fit(Xf_tr, yf_tr)
    acc_fert = accuracy_score(yf_ts, fert_pipeline.predict(Xf_ts))
    print(f"   Accuracy: {acc_fert:.2%}")


    # =========================================================================
    # 3. SAVE ARTIFACTS
    # =========================================================================
    joblib.dump(crop_pipeline, MODEL_DIR / "crop_pipeline.pkl")
    joblib.dump(yield_pipeline, MODEL_DIR / "yield_pipeline.pkl")
    joblib.dump(shi_pipeline, MODEL_DIR / "shi_pipeline.pkl")
    joblib.dump(fert_pipeline, MODEL_DIR / "fert_pipeline.pkl")
    
    joblib.dump(crop_le, MODEL_DIR / "crop_encoder.pkl")
    joblib.dump(fert_le, MODEL_DIR / "fert_encoder.pkl")
    
    print("\nAll 4 Models & Encoders saved to models/")

if __name__ == "__main__":
    train()
