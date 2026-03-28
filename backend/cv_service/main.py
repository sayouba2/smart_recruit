from fastapi import FastAPI, UploadFile, File, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from database import engine, Base, get_db
from models import Candidate
from schemas import CandidateResponse
import json
import os
from parser import parse_cv_text
import PyPDF2

Base.metadata.create_all(bind=engine)

app = FastAPI(title="CV Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
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
                    extracted = page.extract_text()
                    if extracted:
                        text += extracted + "\n"
        # Support for docx could be added here
    except Exception as e:
        print(f"File extraction error: {e}")
    return text

@app.get("/")
def read_root():
    return {"message": "CV Service is running"}

@app.post("/upload", response_model=CandidateResponse)
def upload_cv(file: UploadFile = File(...), db: Session = Depends(get_db)):
    file_location = f"{UPLOAD_DIR}/{file.filename}"
    with open(file_location, "wb+") as file_object:
        file_object.write(file.file.read())
    
    # Extract real text from the uploaded file
    extracted_text = extract_pdf_text(file_location)
    
    parsed_data = parse_cv_text(extracted_text)
    
    db_candidate = Candidate(
        name=parsed_data.get("name"),
        skills=json.dumps(parsed_data.get("skills", [])),
        experience=parsed_data.get("experience"),
        education=parsed_data.get("education"),
        cv_file_path=file_location
    )
    db.add(db_candidate)
    db.commit()
    db.refresh(db_candidate)
    
    return db_candidate
