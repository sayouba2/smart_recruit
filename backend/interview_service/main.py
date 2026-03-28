from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from audio_handler import process_audio_message
import uuid

app = FastAPI(title="Interview Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Interview Service is running"}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    session_id = str(uuid.uuid4())
    try:
        while True:
            # Expecting raw audio bytes from the client
            audio_bytes = await websocket.receive_bytes()
            
            # Process the audio (Whisper -> GPT -> ElevenLabs)
            result = await process_audio_message(audio_bytes, session_id)
            
            # Send back the AI response info
            await websocket.send_json({
                "ai_text": result["ai_text"],
                "ai_audio_path": result["ai_audio_path"],
                "ai_audio_b64": result["ai_audio_b64"]
            })
            
            # Note: The client would then ideally pull the audio file or receive it directly over WS.
            
    except WebSocketDisconnect:
        print(f"Client {session_id} disconnected")
