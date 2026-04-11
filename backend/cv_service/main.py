import sys
import os
import shutil
import uuid
import httpx
import json
import schemas
from fastapi import FastAPI, UploadFile, File, Depends, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy.orm import joinedload
import PyPDF2

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "shared")))
from database import engine, Base, get_db, SessionLocal
from models import Application, JobOffer, User, Interview, ApplicationStatus
from deps import get_current_user, get_current_active_rh, get_current_active_candidate, get_cors_origins

from parser import parse_cv_text
from matching import match_score
from extraction import extract_skills_from_description

app = FastAPI(title="Application Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def extract_pdf_text(filepath: str) -> str:
    text = ""
    try:
        if filepath.endswith('.pdf'):
            with open(filepath, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                for page in reader.pages:
                    ext = page.extract_text()
                    if ext: text += ext + "\n"
    except Exception as e:
        print(f"File extraction error: {e}")
    return text

def analyze_cv(app_id: int, file_path: str, job_text: str, db: Session):
    application = db.query(Application).filter(Application.id == app_id).first()
    if not application:
        return

    cv_text = extract_pdf_text(file_path)
    parsed_data = parse_cv_text(cv_text)

    candidate_skills = parsed_data.get("skills", [])
    skills_json = json.dumps(candidate_skills)
    application.parsed_skills = skills_json

    job_skills = extract_skills_from_description(job_text)
    raw_match = match_score(job_skills, candidate_skills)
    application.cv_score = round(raw_match * 100, 2)

    interview_link = str(uuid.uuid4())
    application.interview_link = interview_link
    
    new_interview = Interview(
        application_id=app_id,
        passed=False
    )
    db.add(new_interview)
    db.commit()

@app.post("/apply", response_model=schemas.ApplicationResponse)
def submit_application(
    job_offer_id: int = Form(...),
    file: UploadFile = File(...),
    current_candidate: User = Depends(get_current_active_candidate),
    db: Session = Depends(get_db)
):
    # Verify Job
    job = db.query(JobOffer).filter(JobOffer.id == job_offer_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    file_ext = os.path.splitext(file.filename)[1]
    saved_filename = f"{current_candidate.id}_{job_offer_id}_{uuid.uuid4().hex}{file_ext}"
    file_location = os.path.join(UPLOAD_DIR, saved_filename)
    
    with open(file_location, "wb+") as file_object:
        file_object.write(file.file.read())

    new_app = Application(
        candidate_id=current_candidate.id,
        job_offer_id=job_offer_id,
        cv_file=file_location,
        status=ApplicationStatus.pending
    )
    db.add(new_app)
    db.commit()
    db.refresh(new_app)

    # Perform AI Extraction synchronously before returning
    analyze_cv(new_app.id, file_location, job.description, db)
    
    db.refresh(new_app)
    return new_app

@app.get("/my_applications")
def get_my_applications(current_candidate: User = Depends(get_current_active_candidate), db: Session = Depends(get_db)):
    apps = db.query(Application).options(joinedload(Application.job_offer), joinedload(Application.interview)).filter(Application.candidate_id == current_candidate.id).all()
    
    result = []
    for a in apps:
        result.append({
            "id": a.id,
            "job_title": a.job_offer.title if a.job_offer else "Unknown",
            "status": a.status,
            "rejection_reason": a.rejection_reason,
            "interview_link": a.interview_link,
            "interview_passed": a.interview.passed if a.interview else False,
            "created_at": a.created_at
        })
    return result

@app.get("/rh_applications")
def get_rh_applications(job_offer_id: int = None, current_rh: User = Depends(get_current_active_rh), db: Session = Depends(get_db)):
    query = db.query(Application).options(
        joinedload(Application.candidate), 
        joinedload(Application.job_offer),
        joinedload(Application.interview)
    ).join(JobOffer).filter(JobOffer.created_by == current_rh.id)
    
    if job_offer_id:
        query = query.filter(JobOffer.id == job_offer_id)
        
    apps = query.all()
    result = []
    
    for a in apps:
        ai_comment_text = a.interview.ai_comments if a.interview else None
        ai_comment_obj = {}
        if ai_comment_text and ai_comment_text.startswith("{"):
            try:
                ai_comment_obj = json.loads(ai_comment_text)
            except:
                ai_comment_obj = {"comment": ai_comment_text}
        else:
            ai_comment_obj = {"comment": ai_comment_text}

        result.append({
            "id": a.id,
            "candidate_name": a.candidate.name if a.candidate else "Unknown",
            "candidate_email": a.candidate.email if a.candidate else "Unknown",
            "job_title": a.job_offer.title if a.job_offer else "Unknown",
            "status": a.status,
            "cv_score": a.cv_score,
            "parsed_skills": json.loads(a.parsed_skills) if a.parsed_skills else [],
            "interview_score": a.interview.interview_score if a.interview else None,
            "ai_comments": ai_comment_obj.get("comment"),
            "transcript": ai_comment_obj.get("transcript"),
            "hr_report": ai_comment_obj.get("hr_report"),
            "rejection_reason": a.rejection_reason,
            "created_at": a.created_at
        })
    return result

@app.patch("/{app_id}/decision")
def make_decision(app_id: int, decision_data: schemas.ApplicationDecision, current_rh: User = Depends(get_current_active_rh), db: Session = Depends(get_db)):
    app = db.query(Application).join(JobOffer).filter(Application.id == app_id, JobOffer.created_by == current_rh.id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application missing or unauthorized")
        
    if decision_data.decision == "accepted":
        app.status = ApplicationStatus.accepted
        app.rejection_reason = decision_data.comment # We use rejection_reason as generic message for candidate
    elif decision_data.decision == "rejected":
        app.status = ApplicationStatus.rejected
        app.rejection_reason = decision_data.comment
    elif decision_data.decision == "saved":
        app.status = ApplicationStatus.saved
        app.rejection_reason = decision_data.comment
        
    db.commit()
    return {"message": f"Application {app.status.value}"}
