from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class ApplicationResponse(BaseModel):
    id: int
    job_offer_id: int
    status: str
    rejection_reason: Optional[str] = None
    interview_link: Optional[str] = None
    created_at: datetime
    
    # Hidden info in real life, but exposed to RH
    cv_score: Optional[float] = None
    
    class Config:
        orm_mode = True

class ApplicationDecision(BaseModel):
    decision: str  # "accepted" or "rejected"
    comment: Optional[str] = ""
