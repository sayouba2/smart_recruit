import sys
import os
import glob
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session, joinedload
from openai import OpenAI
from pydantic import BaseModel

# Shared DB Config
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "shared")))
from database import engine, Base, get_db
from models import Application, JobOffer, Interview, User, ApplicationStatus
from deps import get_current_active_candidate

import schemas

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AI Analysis Service")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "dummy_key"))
AUDIO_STORAGE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "shared_audios"))

def check_priority_criteria(transcript: str, criteria: str) -> dict:
    if not criteria or client.api_key == "dummy_key":
        return {"passed": True, "comment": ""}
        
    prompt = f"""
    En te basant UNIQUEMENT sur cette transcription d'entretien, le candidat respecte-t-il obligatoirement ce critère prioritaire : '{criteria}' ?
    Réponds en JSON formatté exactement comme ceci:
    {{"passed": true/false, "comment": "Brève explication"}}
    
    Transcription:
    {transcript}
    """
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        import json
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(e)
        return {"passed": True, "comment": "AI analysis error fallback."}

@app.post("/analyze_session")
def analyze_session(req: schemas.AnalysisRequest, current_candidate: User = Depends(get_current_active_candidate), db: Session = Depends(get_db)):
    app_record = db.query(Application).options(joinedload(Application.job_offer), joinedload(Application.interview)).filter(Application.id == req.application_id, Application.candidate_id == current_candidate.id).first()
    
    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found")

    session_id = req.session_id
    files = sorted(glob.glob(f"{AUDIO_STORAGE_DIR}/{session_id}_turn_*_candidate.webm"))
    
    full_transcript = ""
    for file_path in files:
        turn_str = "0"
        try:
            turn_str = file_path.split(f"{session_id}_turn_")[1].split("_")[0]
        except IndexError:
            pass
            
        q_path = f"{AUDIO_STORAGE_DIR}/{session_id}_turn_{turn_str}_ai.txt"
        q_text = "[Question introuvable]"
        if os.path.exists(q_path):
            with open(q_path, "r", encoding="utf-8") as f:
                q_text = f.read()
                
        candidate_ans = ""
        if client.api_key != "dummy_key":
            try:
                with open(file_path, "rb") as f:
                    # In a real heavy app we might want BackgroundTasks for this, 
                    # but for this MVP we block and transcribe to send the final score right away
                    transcription = client.audio.transcriptions.create(model="whisper-1", file=f, response_format="text")
                    candidate_ans = transcription
            except Exception as e:
                candidate_ans = f"[Erreur de transcription: {e}]"
        else:
            candidate_ans = "[Mode Test - Sans API Key: Le candidat a donné une excellente réponse.]"
            
        full_transcript += f"IA: {q_text}\nCandidat: {candidate_ans}\n\n"
        
    # Get AI metrics
    import scoring
    evaluation = scoring.evaluate_interview(full_transcript, app_record.job_offer.description if app_record.job_offer else "", app_record.parsed_skills or "")
    interview_score = evaluation.get("score_global", 0)
    
    cv_match = app_record.cv_score if app_record.cv_score else 50.0
    # In absence of full experience parsed model, we rely mainly on cv_match and interview_score
    final_score = scoring.compute_final_score(cv_match, interview_score, 70.0) 
    # Priority Check
    priority_crit = app_record.job_offer.priority_criteria if app_record.job_offer else ""
    priority_result = {"passed": True, "comment": ""}
    
    if priority_crit:
        priority_result = check_priority_criteria(full_transcript, priority_crit)
        
    ai_comment = "Le candidat semble avoir de bonnes compétences globales."
    if not priority_result.get("passed", True):
        app_record.status = ApplicationStatus.rejected
        app_record.rejection_reason = "Éliminé par critère prioritaire caché : " + priority_result.get("comment", "Non respecté.")
        final_score = 0.0
    else:
        ai_comment = evaluation.get("synthese", "Évaluation générée.") + "\n\n(Critère prioritaire: " + priority_result.get("comment", "OK") + ")"

    import json
    saved_comments = json.dumps({
        "comment": ai_comment,
        "transcript": full_transcript,
        "hr_report": evaluation
    })

    if app_record.interview:
        app_record.interview.interview_score = final_score
        app_record.interview.ai_comments = saved_comments
        app_record.interview.passed = True
        
    db.commit()

    return {
        "status": app_record.status.value,
        "final_interview_score": final_score,
        "transcript": full_transcript,
        "priority_check": priority_result
    }
