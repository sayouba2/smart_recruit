from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, Base, get_db
from models import Job
from schemas import JobCreate, JobResponse
import json
from extraction import extract_skills_from_description

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Job Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "Job Service is running"}

@app.post("/jobs/", response_model=JobResponse)
def create_job(job: JobCreate, db: Session = Depends(get_db)):
    # Extract skills using OpenAI wrapper
    extracted_skills = extract_skills_from_description(job.description)
    
    db_job = Job(
        title=job.title,
        description=job.description,
        experience_required=job.experience_required,
        skills_required=json.dumps(extracted_skills)
    )
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job

@app.get("/jobs/", response_model=list[JobResponse])
def get_jobs(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Job).offset(skip).limit(limit).all()
