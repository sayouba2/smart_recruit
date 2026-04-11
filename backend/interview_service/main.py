import sys
import os
import uuid
import jwt
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import joinedload

# Import shared modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "shared")))
from database import engine, Base, SessionLocal
from models import Application, JobOffer, Interview, User, ApplicationStatus
from deps import SECRET_KEY, ALGORITHM, get_cors_origins

from audio_handler import process_audio_message

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Interview Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_user_from_token(token: str, db):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id_str = payload.get("sub")
        if user_id_str is None: return None
        return db.query(User).filter(User.id == int(user_id_str)).first()
    except:
        return None

@app.get("/")
def read_root():
    return {"message": "Interview Service is running"}

@app.websocket("/ws/{application_id}")
async def websocket_endpoint(websocket: WebSocket, application_id: int, token: str = None):
    db = SessionLocal()
    try:
        if not token:
            await websocket.close(code=1008)
            return
            
        user = get_user_from_token(token, db)
        if not user or user.role.value != "candidate":
            await websocket.close(code=1008)
            return

        app_record = db.query(Application).options(joinedload(Application.job_offer)).filter(Application.id == application_id).first()
        if not app_record or app_record.candidate_id != user.id:
            await websocket.close(code=1008)
            return

        interview_record = db.query(Interview).filter(Interview.application_id == application_id).first()
        if not interview_record:
            await websocket.close(code=1008)
            return
            
        if interview_record.passed:
            # Cannot take interview twice
            await websocket.close(code=1008)
            return

        await websocket.accept()
        session_id = str(uuid.uuid4())
        turn_index = 0
        job_title = app_record.job_offer.title if app_record.job_offer else "Développeur"
        priority_criteria = app_record.job_offer.priority_criteria if app_record.job_offer else ""
        
        # Send first question
        result = await process_audio_message(None, session_id, turn_index, job_title, priority_criteria)
        await websocket.send_json(result)
        turn_index += 1
        
        try:
            while True:
                audio_bytes = await websocket.receive_bytes()
                result = await process_audio_message(audio_bytes, session_id, turn_index, job_title, priority_criteria)
                await websocket.send_json(result)
                
                if result.get("is_finished", False):
                    # Mark as passed
                    interview_record.passed = True
                    db.commit()
                    break
                    
                turn_index += 1
        except WebSocketDisconnect:
            print(f"Client {session_id} disconnected")
        finally:
            # If they disconnected but had some turns done, maybe we mark passed?
            pass
            
    finally:
        db.close()
