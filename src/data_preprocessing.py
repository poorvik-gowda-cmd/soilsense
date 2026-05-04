"""
Input Validation and Preprocessing
====================================
Validates incoming soil data, clamps to sensible ranges,
and provides scaled features for the ML models.
"""

from pydantic import BaseModel, Field, validator
from typing import Optional
import numpy as np


# ── Pydantic input schema ─────────────────────────────────────────────────────

class SoilInput(BaseModel):
    N:               float = Field(..., ge=0,   le=560,  description="Nitrogen (kg/ha)")
    P:               float = Field(..., ge=0,   le=50,   description="Phosphorus (kg/ha)")
    K:               float = Field(..., ge=0,   le=500,  description="Potassium (kg/ha)")
    pH:              float = Field(..., ge=3.5, le=10.0, description="Soil pH")
    temperature:     float = Field(..., ge=-10, le=55,   description="°C")
    humidity:        float = Field(..., ge=0,   le=100,  description="%")
    rainfall:        float = Field(..., ge=0,   le=5000, description="mm/year")
    organic_carbon:  float = Field(0.5, ge=0,   le=5.0,  description="% OC")
    latitude:        Optional[float] = Field(None, ge=-90,  le=90,   description="Latitude")
    longitude:       Optional[float] = Field(None, ge=-180, le=180,  description="Longitude")

    class Config:
        json_schema_extra = {
            "example": {
                "N": 90, "P": 42, "K": 43,
                "pH": 6.5, "temperature": 25.0,
                "humidity": 80.0, "rainfall": 200.0,
                "organic_carbon": 0.8,
                "latitude": 28.6139, "longitude": 77.2090
            }
        }


# ── Feature vector builder ────────────────────────────────────────────────────

def build_feature_vector(data: SoilInput) -> np.ndarray:
    """
    Returns a 1×7 numpy array in the order the models were trained on:
    [N, P, K, temperature, humidity, pH, rainfall]
    """
    return np.array([[
        data.N,
        data.P,
        data.K,
        data.temperature,
        data.humidity,
        data.pH,
        data.rainfall,
    ]])


def to_dict(data: SoilInput) -> dict:
    """Flat dict of all input fields (for DB storage)."""
    return {
        "n_value":        data.N,
        "p_value":        data.P,
        "k_value":        data.K,
        "ph":             data.pH,
        "temperature":    data.temperature,
        "humidity":       data.humidity,
        "rainfall":       data.rainfall,
        "organic_carbon": data.organic_carbon,
        "latitude":       data.latitude,
        "longitude":      data.longitude,
    }
