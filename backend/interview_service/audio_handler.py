import os
import json
from openai import OpenAI
import uuid
import base64
import httpx

# Assume environment variables for keys
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "dummy_key"))
ELEVENLABS_API_KEY = os.getenv("ELEVENLABS_API_KEY", "")

AUDIO_STORAGE_DIR = "interview_audios"
os.makedirs(AUDIO_STORAGE_DIR, exist_ok=True)

async def generate_audio_elevenlabs(text: str) -> bytes:
    if not ELEVENLABS_API_KEY or ELEVENLABS_API_KEY == "dummy_key":
        return b""
    url = "https://api.elevenlabs.io/v1/text-to-speech/21m00Tcm4TlvDq8ikWAM"
    headers = {
        "Accept": "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
    }
    data = {"text": text, "model_id": "eleven_monolingual_v1"}
    async with httpx.AsyncClient() as http_client:
        response = await http_client.post(url, json=data, headers=headers)
        if response.status_code == 200:
            return response.content
        else:
            print(f"ElevenLabs error: {response.text}")
            return b""

async def process_audio_message(audio_bytes: bytes, session_id: str) -> dict:
    """
    Process incoming candidate audio:
    1. Store candidate audio
    2. Transcribe candidate audio (Whisper)
    3. Generate AI response (GPT-4)
    4. Generate AI audio (ElevenLabs)
    5. Store AI audio
    """
    turn_id = str(uuid.uuid4())
    
    # 1. Store candidate audio
    candidate_audio_path = f"{AUDIO_STORAGE_DIR}/{session_id}_{turn_id}_candidate.webm"
    with open(candidate_audio_path, "wb") as f:
        f.write(audio_bytes)
        
    # 2. Transcribe using Whisper
    transcript = ""
    if client.api_key == "dummy_key":
        transcript = "Mock candidate transcript: I would first apologize to the client."
    else:
        try:
            with open(candidate_audio_path, "rb") as audio_file:
                transcription = client.audio.transcriptions.create(
                  model="whisper-1", 
                  file=audio_file,
                  response_format="text"
                )
                transcript = transcription
        except Exception as e:
            print(f"Whisper error: {e}")
            transcript = "Could you please repeat that? I couldn't hear clearly."
        
    # 3. GPT-4 conversation logic (dynamic)
    ai_text_response = "That is a great approach. How would you handle a guest who only speaks English?"
    if client.api_key != "dummy_key" and transcript != "Could you please repeat that? I couldn't hear clearly.":
        try:
            prompt = f"You are a professional HR recruiter conducting a verbal interview. The candidate just answered: '{transcript}'. Acknowledge their answer briefly and ask the logical next interview question based on their response. Keep your reply concise, under 3 sentences."
            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.7
            )
            ai_text_response = response.choices[0].message.content
        except Exception as e:
            print(f"GPT error: {e}")
            ai_text_response = "I had a moment of absence. Tell me more about your previous experience."
        
    # 4. Text-to-Speech via ElevenLabs
    ai_audio_bytes = await generate_audio_elevenlabs(ai_text_response)
    
    # 5. Store AI audio and Base64 encode for frontend playback
    ai_audio_path = f"{AUDIO_STORAGE_DIR}/{session_id}_{turn_id}_ai.mp3"
    ai_audio_b64 = ""
    if ai_audio_bytes:
        with open(ai_audio_path, "wb") as f:
            f.write(ai_audio_bytes)
        ai_audio_b64 = base64.b64encode(ai_audio_bytes).decode('utf-8')
        
    return {
        "candidate_text": transcript,
        "ai_text": ai_text_response,
        "ai_audio_path": ai_audio_path if ai_audio_bytes else "",
        "ai_audio_b64": ai_audio_b64
    }
