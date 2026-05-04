"""
/history Router
================
Returns past predictions stored in Supabase.
"""

from fastapi import APIRouter, Query, Request
from db.supabase_client import fetch_history

router = APIRouter(prefix="/history", tags=["History"])


@router.get("")
async def get_history(request: Request, limit: int = Query(default=20, ge=1, le=100)):
    """
    Fetch the N most recent predictions.
    """
    auth_header = request.headers.get("Authorization")
    auth_token = auth_header.split("Bearer ")[1] if auth_header and "Bearer " in auth_header else None
    
    records = fetch_history(limit=limit, auth_token=auth_token)
    return {
        "status": "success",
        "count":  len(records),
        "data":   records,
    }
