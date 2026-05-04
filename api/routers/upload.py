import pandas as pd
from io import StringIO
from fastapi import APIRouter, UploadFile, File, HTTPException, Request
from datetime import datetime, timezone
from db.supabase_client import save_bulk_predictions
from src.data_preprocessing import SoilInput

router = APIRouter(prefix="/upload", tags=["Upload"])

@router.post("")
async def upload_csv(request: Request, file: UploadFile = File(...)):
    """
    Accepts a CSV file of soil parameters, imputes missing values, 
    runs the ML pipeline, and bulk saves to Supabase.
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(400, "Only CSV files are supported")
        
    auth_header = request.headers.get("Authorization")
    auth_token = auth_header.split("Bearer ")[1] if auth_header and "Bearer " in auth_header else None
    
    predictor = request.app.state.predictor
    if not predictor:
        raise HTTPException(503, "ML models not loaded")

    contents = await file.read()
    try:
        df = pd.read_csv(StringIO(contents.decode("utf-8")))
    except Exception as e:
        raise HTTPException(400, f"Error parsing CSV: {e}")

    # Standard columns expected
    expected_cols = ["N", "P", "K", "pH", "temperature", "humidity", "rainfall", "organic_carbon"]
    optional_geo_cols = ["latitude", "longitude"]
    
    # Map incoming columns to expected (case-insensitive)
    col_map = {c.lower(): c for c in df.columns}
    for req in expected_cols:
        req_lower = req.lower()
        if req_lower not in col_map:
            raise HTTPException(400, f"Missing required column: {req}")
        df.rename(columns={col_map[req_lower]: req}, inplace=True)

    # Also remap optional geo columns if they exist in the CSV
    has_geo = False
    for geo in optional_geo_cols:
        if geo in col_map:
            df.rename(columns={col_map[geo]: geo}, inplace=True)
    if "latitude" in df.columns and "longitude" in df.columns:
        has_geo = True

    # Track imputation count for feedback
    imputed_count = 0
    for col in expected_cols:
        n_missing = df[col].isnull().sum()
        if n_missing > 0:
            df[col].fillna(df[col].median(), inplace=True)
            imputed_count += n_missing
            
    # Drop rows that still have NaNs in required cols
    df.dropna(subset=expected_cols, inplace=True)
    
    if df.empty:
        raise HTTPException(400, "No valid data rows found after parsing and imputation.")

    records = []
    timestamp = datetime.now(timezone.utc).isoformat()
    
    for _, row in df.iterrows():
        input_dict = {
            "N": float(row["N"]), "P": float(row["P"]), "K": float(row["K"]),
            "pH": float(row["pH"]), "temperature": float(row["temperature"]),
            "humidity": float(row["humidity"]), "rainfall": float(row["rainfall"]),
            "organic_carbon": float(row["organic_carbon"])
        }
        
        # Run pipeline
        ml_result = predictor.run_all(input_dict)
        
        advice_dicts = [{
            "nutrient": "AI Complete Insight",
            "product": ml_result.fertilizer,
            "reason": "Machine learning prediction based on NPK and soil metrics.",
            "dosage": "Consult local agronomy standards.",
            "priority": "high",
            "urgency_color": "#4ade80"
        }]
        
        record = {
            "n_value": input_dict["N"], "p_value": input_dict["P"], "k_value": input_dict["K"],
            "ph": input_dict["pH"], "temperature": input_dict["temperature"], 
            "humidity": input_dict["humidity"], "rainfall": input_dict["rainfall"], 
            "organic_carbon": input_dict["organic_carbon"],
            "soil_health_index": ml_result.shi_score,
            "health_category": ml_result.health_category,
            "crop_recommendation": ml_result.crop,
            "crop_confidence": ml_result.crop_confidence,
            "yield_prediction": ml_result.yield_estimate,
            "fertilizer_advice": advice_dicts,
            "created_at": timestamp,
            "latitude": float(row["latitude"]) if has_geo and pd.notna(row.get("latitude")) else None,
            "longitude": float(row["longitude"]) if has_geo and pd.notna(row.get("longitude")) else None,
        }
        records.append(record)

    # Bulk insert
    success = save_bulk_predictions(records, auth_token)
    if not success:
        raise HTTPException(500, "Failed to save bulk predictions to database")

    geo_count = sum(1 for r in records if r.get("latitude") is not None)
    msg = f"Successfully processed and saved {len(records)} records."
    if imputed_count > 0:
        msg += f" {imputed_count} missing value(s) were auto-imputed using column medians."
    if has_geo:
        msg += f" {geo_count} records include GPS coordinates and will appear on the map."

    return {
        "status": "success",
        "processed_count": len(records),
        "imputed_count": int(imputed_count),
        "geo_count": geo_count,
        "message": msg
    }
