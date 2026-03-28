import os
import json
from openai import OpenAI
from typing import Dict

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "dummy_key"))

def generate_full_transcript(session_id: str) -> str:
    """
    In a real app, this would concatenate all transcript pieces from the interview session.
    """
    return "Interviewer: Welcome. Can you introduce yourself?\nCandidate: I am a developer..."

def evaluate_interview(transcript: str) -> Dict[str, float]:
    """
    Evaluates the interview transcript on communication, problem_solving, and professionalism.
    Returns scores out of 100 for each.
    """
    if client.api_key == "dummy_key":
        return {
            "communication": 80.0,
            "problem_solving": 75.0,
            "professionalism": 90.0
        }

    prompt = f"""
    Evaluate this candidate's interview transcript.
    Criteria:
    - communication
    - problem_solving
    - professionalism

    Return ONLY JSON with these keys and numeric values out of 100.
    Transcript:
    {transcript}
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Error evaluating interview: {e}")
        return {"communication": 0, "problem_solving": 0, "professionalism": 0}

def compute_final_score(cv_match: float, interview_score: float, experience_score: float) -> float:
    """
    Combines the matching score, interview score, and experience into a final score out of 100.
    """
    return (0.2 * cv_match) + (0.4 * interview_score) + (0.4 * experience_score)
