from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from src.data_preprocessing import SoilInput, to_dict
from db.supabase_client import save_prediction

router = APIRouter(prefix="/predict", tags=["Prediction"])

@router.post("")
async def predict(data: SoilInput, request_obj: None = None):
    from fastapi import Request
    return await run_prediction(data)

async def run_prediction(data: SoilInput, predictor, auth_token: str = None):
    try:
        # Convert Request object to flat dictionary
        input_dict = {
            "N": data.N, "P": data.P, "K": data.K,
            "pH": data.pH, "temperature": data.temperature,
            "humidity": data.humidity, "rainfall": data.rainfall,
            "organic_carbon": data.organic_carbon
        }
        
        # Run the 4-Model Pipeline 
        ml_result = predictor.run_all(input_dict)

        # We construct a fertilizer dictionary list for UI compatibility (so it matches the old shape),
        # but the actual logic is purely powered by the 4th ML model
        advice_dicts = [{
            "nutrient": "AI Complete Insight",
            "product": ml_result.fertilizer,
            "reason": "Machine learning prediction based on NPK and soil metrics.",
            "dosage": "Consult local agronomy standards.",
            "priority": "high",
            "urgency_color": "#4ade80"
        }]

        # Prepare DB Record
        timestamp = datetime.now(timezone.utc).isoformat()
        record = {
            **to_dict(data),
            "soil_health_index":    ml_result.shi_score,
            "health_category":      ml_result.health_category,
            "crop_recommendation":  ml_result.crop,
            "crop_confidence":      ml_result.crop_confidence,
            "yield_prediction":     ml_result.yield_estimate,
            "fertilizer_advice":    advice_dicts,
            "created_at":           timestamp,
        }
        
        # Save to Supabase (via HTTP REST)
        saved = save_prediction(record, auth_token)

        # ── Real component adequacy scores (0-100) ──────────────────────────────
        # Each score represents how close the parameter is to its ideal range
        def clamp(v): return max(0, min(100, v))
        n_score  = clamp((data.N / 140) * 100)           # ideal N: ~140 kg/ha
        p_score  = clamp((data.P / 25)  * 100)           # ideal P: ~25 kg/ha
        k_score  = clamp((data.K / 200) * 100)           # ideal K: ~200 kg/ha
        ph_score = clamp(100 - abs(data.pH - 6.5) * 25)  # ideal pH: 6.5
        oc_score = clamp((data.organic_carbon / 2.0) * 100)  # ideal OC: ~2%

        return {
            "status": "success",
            "timestamp": timestamp,
            "id": saved["id"] if saved else None,
            "soil_health": {
                "index": ml_result.shi_score,
                "category": ml_result.health_category,
                "color": "#22c55e" if ml_result.shi_score > 50 else "#f87171",
                "component_scores": {
                    "N": round(n_score),
                    "P": round(p_score),
                    "K": round(k_score),
                    "pH": round(ph_score),
                    "OC": round(oc_score)
                }
            },
            "ml": {
                "crop_recommendation": ml_result.crop,
                "confidence": round(ml_result.crop_confidence * 100, 1),
                "top3_crops": ml_result.top3_crops,
                "yield_estimate_t_ha": ml_result.yield_estimate,
            },
            "fertilizer_advice": advice_dicts,
            "input_summary": input_dict,
            "location": {
                "latitude": data.latitude,
                "longitude": data.longitude,
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
