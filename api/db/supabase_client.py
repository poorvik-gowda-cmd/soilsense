import os
import httpx
import base64
import json
from typing import Optional, List
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL", "").strip().rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY", "").strip()

def is_ready():
    return bool(SUPABASE_URL and SUPABASE_KEY and "your-project" not in SUPABASE_URL)

def extract_user_id_from_token(token: str) -> Optional[str]:
    """Decode the JWT payload (no signature verification needed — Supabase verifies on its end).
    Returns the 'sub' claim which is the Supabase user UUID."""
    try:
        payload_part = token.split(".")[1]
        # Fix base64 padding
        payload_part += "=" * (4 - len(payload_part) % 4)
        decoded = base64.urlsafe_b64decode(payload_part)
        claims = json.loads(decoded)
        return claims.get("sub")
    except Exception:
        return None

def get_headers(auth_token: Optional[str] = None):
    headers = {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=representation"
    }
    if auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"
    else:
        headers["Authorization"] = f"Bearer {SUPABASE_KEY}"
    return headers

def save_prediction(record: dict, auth_token: Optional[str] = None) -> Optional[dict]:
    if not is_ready():
        return None
    try:
        # Always explicitly set user_id so RLS isolation is guaranteed
        if auth_token:
            uid = extract_user_id_from_token(auth_token)
            if uid:
                record = {**record, "user_id": uid}

        url = f"{SUPABASE_URL}/rest/v1/predictions"
        resp = httpx.post(url, headers=get_headers(auth_token), json=record, timeout=10.0)
        resp.raise_for_status()
        data = resp.json()
        return data[0] if data else None
    except Exception as e:
        print(f"DB write error: {e}")
        return None

def save_bulk_predictions(records: List[dict], auth_token: Optional[str] = None) -> bool:
    if not is_ready() or not records:
        return False
    try:
        # Inject user_id into every record for guaranteed RLS isolation
        if auth_token:
            uid = extract_user_id_from_token(auth_token)
            if uid:
                records = [{**r, "user_id": uid} for r in records]

        url = f"{SUPABASE_URL}/rest/v1/predictions"
        resp = httpx.post(url, headers=get_headers(auth_token), json=records, timeout=20.0)
        resp.raise_for_status()
        return True
    except Exception as e:
        print(f"Bulk DB write error: {e}")
        return False

def fetch_history(limit: int = 50, auth_token: Optional[str] = None) -> List[dict]:
    if not is_ready():
        return []
    try:
        url = f"{SUPABASE_URL}/rest/v1/predictions?select=*&order=created_at.desc&limit={limit}"
        resp = httpx.get(url, headers=get_headers(auth_token), timeout=10.0)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"DB read error: {e}")
        return []

def fetch_analytics(auth_token: Optional[str] = None) -> List[dict]:
    if not is_ready():
        return []
    try:
        url = f"{SUPABASE_URL}/rest/v1/predictions?select=n_value,p_value,k_value,ph,soil_health_index,health_category,crop_recommendation,yield_prediction,fertilizer_advice,latitude,longitude,created_at&order=created_at.desc&limit=500"
        resp = httpx.get(url, headers=get_headers(auth_token), timeout=10.0)
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        print(f"DB analytics error: {e}")
        return []
