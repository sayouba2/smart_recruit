def match_score(job_skills: list, candidate_skills: list) -> float:
    """
    Calculates the matching percentage between required job skills and 
    the skills extracted from a candidate's CV.
    """
    if not job_skills:
        return 1.0 # If no skills are strictly required
        
    job_skills_lower = set(s.lower() for s in job_skills)
    candidate_skills_lower = set(s.lower() for s in candidate_skills)
    
    common = job_skills_lower & candidate_skills_lower
    return len(common) / len(job_skills_lower)
