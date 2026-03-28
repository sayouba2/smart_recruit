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
async def websocket_endpoint(websocket: WebSocket, job: str = "Développeur"):
    await websocket.accept()
    session_id = str(uuid.uuid4())
    turn_index = 0
    
    # Send the first AI question immediately
    result = await process_audio_message(None, session_id, turn_index, job)
    await websocket.send_json(result)
    turn_index += 1
    
    try:
        while True:
            # Wait for user's audio response
            audio_bytes = await websocket.receive_bytes()
            
            # Process their audio and fetch the NEXT question
            result = await process_audio_message(audio_bytes, session_id, turn_index, job)
            await websocket.send_json(result)
            
            if not result.get("is_finished", False):
                turn_index += 1
                
    except WebSocketDisconnect:
        print(f"Client {session_id} disconnected")
