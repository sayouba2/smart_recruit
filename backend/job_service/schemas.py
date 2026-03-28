from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class JobCreate(BaseModel):
    title: str
    description: str
    domain: str
    priority_criteria: str

class JobResponse(BaseModel):
    id: int
    title: str
    description: str
    domain: str
    priority_criteria: Optional[str] = None # Will not be returned to candidates
    created_by: int
    created_at: datetime

    class Config:
        orm_mode = True

class JobListResponse(BaseModel):
    id: int
    title: str
    domain: str
    created_at: datetime
    # We omit description for the public list if we want, or keep it short
    class Config:
        orm_mode = True
