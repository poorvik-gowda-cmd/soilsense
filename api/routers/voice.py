from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import json
import httpx

router = APIRouter(prefix="/api/voice", tags=["Voice"])

class VoiceRequest(BaseModel):
    text: str

@router.post("/parse")
async def parse_voice(request: VoiceRequest):
    mistral_api_key = os.getenv("MISTRAL_API_KEY")
    if not mistral_api_key:
        raise HTTPException(status_code=500, detail="MISTRAL_API_KEY is not set.")
    
    try:
        prompt = f"""
You are a helpful assistant for a soil health application. 
The user is speaking to a voice assistant to update form parameters.
Extract the soil parameters mentioned in the text and return them as a JSON object.
ONLY include the parameters that were explicitly mentioned. Omit any others.

Valid parameters and their keys:
- Nitrogen (N) -> "N"
- Phosphorus (P) -> "P"
- Potassium (K) -> "K"
- Soil pH -> "pH"
- Temperature -> "temperature"
- Humidity -> "humidity"
- Rainfall -> "rainfall"
- Organic Carbon -> "organic_carbon"

User text: "{request.text}"

Output ONLY a raw JSON object (without markdown formatting) containing the extracted parameters and their numerical values.
Example: {{"N": 90, "pH": 6.5}}
"""
        
        headers = {
            "Authorization": f"Bearer {mistral_api_key}",
            "Content-Type": "application/json",
            "Accept": "application/json"
        }
        
        payload = {
            "model": "mistral-small-latest",
            "messages": [
                {"role": "user", "content": prompt}
            ],
            "response_format": {"type": "json_object"}
        }

        async with httpx.AsyncClient() as client:
            response = await client.post("https://api.mistral.ai/v1/chat/completions", headers=headers, json=payload, timeout=30.0)
            
            if response.status_code != 200:
                raise Exception(f"Mistral API returned status {response.status_code}: {response.text}")
                
            data = response.json()
            result_text = data["choices"][0]["message"]["content"]
            result_json = json.loads(result_text)
            return result_json
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
