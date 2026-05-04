"""
/analytics Router
==================
Returns aggregated statistics from historical data for chart rendering.
"""

from fastapi import APIRouter, Request
from db.supabase_client import fetch_analytics
from collections import Counter

router = APIRouter(prefix="/analytics", tags=["Analytics"])


@router.get("")
async def get_analytics(request: Request):
    """
    Aggregate the last 500 predictions for dashboard charts.
    Returns:
      - crop distribution
      - average NPK values
      - SHI distribution by category
      - average yield per crop
    """
    auth_header = request.headers.get("Authorization")
    auth_token = auth_header.split("Bearer ")[1] if auth_header and "Bearer " in auth_header else None
    
    records = fetch_analytics(auth_token=auth_token)

    if not records:
        return {
            "status": "no_data",
            "message": "No predictions recorded yet.",
            "data": {},
        }

    # ── Crop distribution ──────────────────────────────────────────────────────
    crop_counter = Counter(r["crop_recommendation"] for r in records if r.get("crop_recommendation"))
    crop_distribution = [
        {"crop": k, "count": v}
        for k, v in crop_counter.most_common(10)
    ]

    # ── SHI category breakdown ─────────────────────────────────────────────────
    shi_counter = Counter(r["health_category"] for r in records if r.get("health_category"))
    shi_distribution = dict(shi_counter)

    # ── Average NPK ────────────────────────────────────────────────────────────
    def avg(key):
        vals = [r[key] for r in records if r.get(key) is not None]
        return round(sum(vals) / len(vals), 2) if vals else 0

    avg_npk = {
        "N": avg("n_value"),
        "P": avg("p_value"),
        "K": avg("k_value"),
        "pH": avg("ph"),
    }

    # ── Average yield per crop ─────────────────────────────────────────────────
    crop_yields: dict = {}
    for r in records:
        crop = r.get("crop_recommendation")
        yld  = r.get("yield_prediction")
        if crop and yld is not None:
            if crop not in crop_yields:
                crop_yields[crop] = []
            crop_yields[crop].append(yld)

    avg_yield_per_crop = [
        {"crop": c, "avg_yield": round(sum(v) / len(v), 2)}
        for c, v in sorted(crop_yields.items(), key=lambda x: -sum(x[1]) / len(x[1]))
    ][:10]

    # ── SHI trend (last 20 records) ────────────────────────────────────────────
    shi_trend = [
        {
            "timestamp": r.get("created_at", "")[:10],
            "score": r.get("soil_health_index"),
        }
        for r in records[:20]
        if r.get("soil_health_index") is not None
    ]

    # ── pH Histogram Data ──────────────────────────────────────────────────────
    ph_values = [r["ph"] for r in records if r.get("ph") is not None]

    # ── Yield vs Fertilizer ────────────────────────────────────────────────────
    yield_vs_fert = {}
    for r in records:
        adv = r.get("fertilizer_advice")
        yld = r.get("yield_prediction")
        if adv and isinstance(adv, list) and len(adv) > 0 and yld is not None:
            fert = adv[0].get("product", "Unknown")
            if fert not in yield_vs_fert:
                yield_vs_fert[fert] = []
            yield_vs_fert[fert].append(yld)
            
    avg_yield_vs_fert = [
        {"fertilizer": f, "avg_yield": round(sum(v) / len(v), 2)}
        for f, v in yield_vs_fert.items()
    ]

    # ── Fertilizer distribution ───────────────────────────────────────────────
    fert_counter = Counter()
    for r in records:
        adv = r.get("fertilizer_advice")
        if adv and isinstance(adv, list) and len(adv) > 0:
            fert_counter[adv[0].get("product", "Unknown")] += 1
    
    fert_distribution = [
        {"product": k, "count": v}
        for k, v in fert_counter.most_common(5)
    ]

    # ── Total Average SHI ──────────────────────────────────────────────────────
    shi_vals = [r["soil_health_index"] for r in records if r.get("soil_health_index") is not None]
    avg_shi = round(sum(shi_vals) / len(shi_vals), 1) if shi_vals else 0

    # ── Correlation Heatmap ────────────────────────────────────────────────────
    import pandas as pd
    corr_data = []
    if len(records) > 1:
        try:
            df = pd.DataFrame([{
                "N": r.get("n_value"), "P": r.get("p_value"), "K": r.get("k_value"),
                "pH": r.get("ph"), "SHI": r.get("soil_health_index"), "Yield": r.get("yield_prediction")
            } for r in records]).dropna()
            if not df.empty and len(df) > 1:
                corr_matrix = df.corr().round(2).fillna(0)
                # Convert to heatmap format: [{"x": "N", "y": "P", "value": 0.5}, ...]
                for col in corr_matrix.columns:
                    for idx in corr_matrix.index:
                        corr_data.append({
                            "x": col,
                            "y": idx,
                            "value": corr_matrix.loc[idx, col]
                        })
        except Exception:
            pass

    # ── Geospatial Points for Map ──────────────────────────────────────────────
    geospatial_points = [
        {
            "lat": r["latitude"],
            "lng": r["longitude"],
            "shi": r.get("soil_health_index"),
            "category": r.get("health_category"),
            "crop": r.get("crop_recommendation"),
            "yield": r.get("yield_prediction"),
        }
        for r in records
        if r.get("latitude") is not None and r.get("longitude") is not None
    ]

    return {
        "status":            "success",
        "total_predictions": len(records),
        "data": {
            "crop_distribution":  crop_distribution,
            "shi_distribution":   shi_distribution,
            "avg_npk":            avg_npk,
            "avg_shi":            avg_shi,
            "avg_yield_per_crop": avg_yield_per_crop,
            "shi_trend":          shi_trend,
            "ph_histogram":       ph_values,
            "yield_vs_fert":      avg_yield_vs_fert,
            "fert_distribution":  fert_distribution,
            "correlation_matrix": corr_data,
            "geospatial_points":  geospatial_points,
            "recent_records":     records[:10],
        },
    }
