import os
import json
from openai import OpenAI
from typing import List

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "dummy_key"))

def extract_skills_from_description(description: str) -> List[str]:
    if client.api_key == "dummy_key":
        return ["Python", "FastAPI", "React", "Docker"]

    prompt = f"""
    You are an expert HR technical recruiter. Extract the key technical skills, programming languages, years of experience, language skills, soft skills 
    and tools mentioned in the following job description.
    Return ONLY a raw JSON list of strings, e.g. ["Python", "Django", "Docker", "3 years", "English", "Teamwork"]. 
    Do not return any other text or markdown code blocks.
    
    Job Description:
    {description}
    """
    
    try:
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.0
        )
        content = response.choices[0].message.content.strip()
        if content.startswith("```json"):
            content = content[7:-3].strip()
        elif content.startswith("```"):
            content = content[3:-3].strip()
            
        return json.loads(content)
    except Exception as e:
        print(f"Error during job extraction: {e}")
        return []
