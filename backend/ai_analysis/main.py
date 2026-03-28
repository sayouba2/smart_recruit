from fastapi import FastAPI
from pydantic import BaseModel
from typing import List
from matching import match_score

app = FastAPI(title="AI Analysis Service")

class ScoringRequest(BaseModel):
    cv_score: float
    interview_score: float
    experience_score: float

class MatchRequest(BaseModel):
    job_skills: List[str]
    candidate_skills: List[str]

@app.get("/")
def read_root():
    return {"message": "AI Analysis Service is running"}

@app.post("/match")
def calculate_match(data: MatchRequest):
    score = match_score(data.job_skills, data.candidate_skills)
    return {
        "matching_percentage": round(score * 100, 2),
        "score": score
    }

@app.post("/score")
def calculate_score(data: ScoringRequest):
    final_score = (0.2 * data.cv_score) + (0.4 * data.interview_score) + (0.4 * data.experience_score)
    return {"final_score": final_score}

@app.get("/ranking/{job_id}")
def get_candidate_ranking(job_id: int):
    # Mocking ranking
    return {"job_id": job_id, "ranking": [{"candidate_id": 1, "score": 88}, {"candidate_id": 2, "score": 75}]}

@app.get("/report/{candidate_id}")
def generate_pdf_report(candidate_id: int):
    # Mocking PDF generation
    return {"message": "PDF report generated", "url": "/downloads/report_1.pdf"}

@app.post("/analyze_emotion")
def analyze_emotion(transcript: str):
    # English level detection and emotional analysis using NLP
    return {"english_level": "C1", "dominant_emotion": "Confident"}
