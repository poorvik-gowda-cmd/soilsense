from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
import os
import json
from mistralai.client import Mistral
from typing import List, Dict, Optional
from db.supabase_client import fetch_history

router = APIRouter(prefix="/api/chat", tags=["Chat"])

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    message: str
    history: List[Message] = []

@router.post("/ask")
async def ask_chatbot(request: Request, payload: ChatRequest):
    mistral_api_key = os.getenv("MISTRAL_API_KEY")
    if not mistral_api_key:
        raise HTTPException(status_code=500, detail="MISTRAL_API_KEY is not set.")
        
    auth_header = request.headers.get("Authorization")
    auth_token = auth_header.split("Bearer ")[1] if auth_header and "Bearer " in auth_header else None
    
    # 1. Fetch the user's latest soil prediction context
    latest_context = ""
    if auth_token:
        records = fetch_history(limit=1, auth_token=auth_token)
        if records and len(records) > 0:
            rec = records[0]
            latest_context = f"""
--- USER'S LATEST SOIL ANALYSIS DATA ---
Date: {rec.get('created_at', 'Unknown')}
Soil Nutrients: Nitrogen(N)={rec.get('n_value')}, Phosphorus(P)={rec.get('p_value')}, Potassium(K)={rec.get('k_value')}
Environment: pH={rec.get('ph')}
Soil Health Index: {rec.get('soil_health_index')} ({rec.get('health_category')})
Recommended Crop: {rec.get('crop_recommendation')} (Est. Yield: {rec.get('yield_prediction')} t/ha)
Fertilizer Advice: {json.dumps(rec.get('fertilizer_advice', []))}
---------------------------------------
"""

    # 2. Construct System Prompt
    system_prompt = f"""You are SoilSense AI, a highly advanced, expert agronomist chatbot. 
Your goal is to help the user understand their soil health, crop recommendations, and fertilizer usage in a smart, actionable way.

{latest_context if latest_context else "The user has not performed a soil analysis yet or no context is available. Answer their questions generally."}

When the user asks questions like "Why is my yield low?" or "How do I fix my pH?", refer explicitly to their latest soil data provided above.
Provide clear, actionable, and scientifically accurate agricultural advice.
Use bullet points for readability. Keep responses concise and practical. Do NOT use markdown headers, just plain text with bullets.
"""

    try:
        client = Mistral(api_key=mistral_api_key)
        
        # 3. Build message list for Mistral
        messages = [{"role": "system", "content": system_prompt}]
        
        # Add history
        for msg in payload.history:
            messages.append({"role": msg.role, "content": msg.content})
            
        # Add current user message
        messages.append({"role": "user", "content": payload.message})
        
        # 4. Call Mistral API
        response = client.chat.complete(
            model="mistral-small-latest",
            messages=messages,
        )
        
        reply = response.choices[0].message.content
        return {"reply": reply}
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        print("Chat Error:", str(e))
        raise HTTPException(status_code=500, detail=str(e))
