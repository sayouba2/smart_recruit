import glob
import os
import json
from openai import OpenAI
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from matching import match_score

app = FastAPI(title="AI Analysis Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "dummy_key"))
AUDIO_STORAGE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "shared_audios"))

class ScoringRequest(BaseModel):
    cv_score: float
    interview_score: float
    experience_score: float

class MatchRequest(BaseModel):
    job_skills: List[str]
    candidate_skills: List[str]

class AnalyzeSessionRequest(BaseModel):
    session_id: str

@app.post("/analyze_session")
def analyze_session(req: AnalyzeSessionRequest):
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
                    transcription = client.audio.transcriptions.create(model="whisper-1", file=f, response_format="text")
                    candidate_ans = transcription
            except Exception as e:
                candidate_ans = f"[Erreur de transcription: {e}]"
        else:
            candidate_ans = "[Mode Test - Sans API Key: Le candidat a donné une excellente réponse.]"
            
        full_transcript += f"IA: {q_text}\nCandidat: {candidate_ans}\n\n"
        
    evaluation = {"communication": 85, "problem_solving": 80, "professionalism": 90, "sentiment": "Positif"}
    if client.api_key != "dummy_key" and files:
        prompt = f"""
        Evalue l'entretien suivant sur 100 pour la communication, la résolution de problème et le professionnalisme.
        Donne aussi le sentiment principal (ex: Confident, Stressé, etc.).
        Tu DOIS renvoyer UNIQUEMENT un objet JSON pur: {{"communication": 0, "problem_solving": 0, "professionalism": 0, "sentiment": "..."}}. Ne renvoie aucun autre texte.
        Entretien:
        {full_transcript}
        """
        try:
            res = client.chat.completions.create(model="gpt-3.5-turbo", messages=[{"role": "user", "content": prompt}], temperature=0.0)
            content = res.choices[0].message.content.strip()
            if content.startswith("```json"): content = content[7:-3].strip()
            elif content.startswith("```"): content = content[3:-3].strip()
            evaluation = json.loads(content)
        except Exception as e:
            print(f"Eval error: {e}")
            
    final_score = (evaluation.get("communication", 0) + evaluation.get("problem_solving", 0) + evaluation.get("professionalism", 0)) / 3
    
    return {
        "transcript": full_transcript,
        "evaluation": evaluation,
        "final_interview_score": round(final_score, 2)
    }
