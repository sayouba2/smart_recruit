from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class CandidateBase(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    skills: Optional[str] = None
    experience: Optional[float] = None
    education: Optional[str] = None
    cv_file_path: Optional[str] = None

class CandidateCreate(CandidateBase):
    pass

class CandidateResponse(CandidateBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True
