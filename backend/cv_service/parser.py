import os
import json
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY", "dummy_key"))

def parse_cv_text(text: str) -> dict:
    if client.api_key == "dummy_key":
        return {
            "name": "Jane Doe",
            "skills": ["Python", "Machine Learning", "FastAPI"],
            "experience": 3.0,
            "education": "MSc Computer Science"
        }

    prompt = f"""
    Extract the following details from the CV text below:
    - "name" (string, candidate's full name)
    - "skills" (list of strings, technical skills)
    - "experience" (float, total years of professional experience)
    - "education" (string, highest degree or school)

    Return ONLY a raw JSON object with these exact keys. Do not include markdown or code block syntax.
    CV Text:
    {text}
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
        print(f"Error parsing CV: {e}")
        return {}
