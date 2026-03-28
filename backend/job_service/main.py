import sys
import os
import json
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

# Import shared modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "shared")))
from database import engine, Base, get_db
from models import JobOffer, User
from deps import get_current_active_rh

import schemas
from extraction import extract_skills_from_description

# Ensure tables are created
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Job Service (RH Dashboard)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/", response_model=schemas.JobResponse)
def create_job(job: schemas.JobCreate, current_rh: User = Depends(get_current_active_rh), db: Session = Depends(get_db)):
    """ Secure route: Only RH can create jobs. """
    new_job = JobOffer(
        title=job.title,
        description=job.description,
        domain=job.domain,
        priority_criteria=job.priority_criteria,
        created_by=current_rh.id
    )
    db.add(new_job)
    db.commit()
    db.refresh(new_job)
    return new_job

@app.get("/", response_model=list[schemas.JobResponse])
def get_jobs(db: Session = Depends(get_db)):
    """ Public route: List all jobs. """
    jobs = db.query(JobOffer).all()
    # If we wanted to hide priority criteria from public, we could map them to a different schema
    # But for now we just return them. The frontend can just not display it to candidates.
    return jobs

@app.get("/rh_jobs", response_model=list[schemas.JobResponse])
def get_rh_jobs(current_rh: User = Depends(get_current_active_rh), db: Session = Depends(get_db)):
    """ List jobs created by this specific RH. """
    jobs = db.query(JobOffer).filter(JobOffer.created_by == current_rh.id).all()
    return jobs

@app.delete("/{job_id}")
def delete_job(job_id: int, current_rh: User = Depends(get_current_active_rh), db: Session = Depends(get_db)):
    job = db.query(JobOffer).filter(JobOffer.id == job_id, JobOffer.created_by == current_rh.id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found or unauthorized")
    db.delete(job)
    db.commit()
    return {"message": "Job deleted"}
