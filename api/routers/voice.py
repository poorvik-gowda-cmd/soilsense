from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import json
from mistralai import Mistral

router = APIRouter(prefix="/api/voice", tags=["Voice"])

class VoiceRequest(BaseModel):
    text: str

@router.post("/parse")
async def parse_voice(request: VoiceRequest):
    mistral_api_key = os.getenv("MISTRAL_API_KEY")
    if not mistral_api_key:
        raise HTTPException(status_code=500, detail="MISTRAL_API_KEY is not set.")
    
    try:
        client = Mistral(api_key=mistral_api_key)
        
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
        response = client.chat.complete(
            model="mistral-small-latest",
            messages=[
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        result_text = response.choices[0].message.content
        result_json = json.loads(result_text)
        return result_json
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
