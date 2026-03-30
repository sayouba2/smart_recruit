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

def evaluate_interview(transcript: str, job_desc: str = "", cv_skills: str = "") -> dict:
    """
    Evaluates the interview transcript on using the advanced AI HR prompt.
    Returns the parsed JSON HR report.
    """
    if client.api_key == "dummy_key":
        return {
            "nom_candidat": "Mock Candidate",
            "niveau_langue": { "note": 80, "commentaire": "Niveau satisfaisant." },
            "politesse": { "note": 90, "commentaire": "Très poli et courtois." },
            "qualite_reponse": { "note": 85, "commentaire": "Réponses claires." },
            "score_global": 85,
            "synthese": "Candidat avec un bon profil global.",
            "points_forts": ["Expérience", "Communication"],
            "points_faibles": ["Manque de détails techniques"],
            "recommandation_finale": "Recommandé"
        }

    eval_prompt = f"""
    Tu es un expert RH. Analyse la transcription complète de cet entretien et rédige le RAPPORT RH final.
    Tu dois te baser sur l'offre d'emploi et les compétences du CV du candidat pour juger la pertinence de ses réponses.
    
    [OFFRE D'EMPLOI]
    {job_desc}
    
    [COMPÉTENCES CV DU CANDIDAT]
    {cv_skills}
    
    [TRANSCRIPTION DE L'ENTRETIEN]
    {transcript}

    Génère une évaluation au format JSON strict avec UNIQUEMENT les clés suivantes : 
    - "nom_candidat": "Le prénom ou nom donné par le candidat"
    - "niveau_langue": {{ "note": 0, "commentaire": "Analyse du bilinguisme Français/Anglais" }}
    - "politesse": {{ "note": 0, "commentaire": "Analyse du sens du service VIP, présentation verbale et politesse" }}
    - "qualite_reponse": {{ "note": 0, "commentaire": "Analyse de l'expérience, de la gestion du stress et des réponses aux mises en situation" }}
    - "score_global": 0 (Une note sur 100)
    - "synthese": "Un résumé RH professionnel du profil, incluant la motivation et l'âge/expérience du candidat."
    - "points_forts": ["...", "..."]
    - "points_faibles": ["...", "..."]
    - "recommandation_finale": "Recommandé / Recommandé avec réserve / Non recommandé"
    IMPORTANT : Ne renvoie STRICTEMENT QUE l'objet JSON valide. Aucun markdown, aucun texte avant ou après.
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-4",
            messages=[{"role": "user", "content": eval_prompt}],
            temperature=0.0
        )
        return json.loads(response.choices[0].message.content)
    except Exception as e:
        print(f"Error evaluating interview: {e}")
        return {
            "nom_candidat": "Erreur",
            "niveau_langue": { "note": 0, "commentaire": "Erreur d'analyse." },
            "politesse": { "note": 0, "commentaire": "Erreur d'analyse." },
            "qualite_reponse": { "note": 0, "commentaire": "Erreur d'analyse." },
            "score_global": 0,
            "synthese": "L'API a renvoyé une erreur format pendant la génération.",
            "points_forts": [],
            "points_faibles": [],
            "recommandation_finale": "Non évalué"
        }

def compute_final_score(cv_match: float, interview_score: float, experience_score: float) -> float:
    """
    Combines the matching score, interview score, and experience into a final score out of 100.
    """
    return (0.2 * cv_match) + (0.4 * interview_score) + (0.4 * experience_score)
