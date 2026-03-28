from sqlalchemy import Column, Integer, String, Text, DateTime, Float
from datetime import datetime
from database import Base

class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True, nullable=True) # E.g., from parsing
    email = Column(String(255), index=True, nullable=True)
    skills = Column(Text, nullable=True) # JSON list
    experience = Column(Float, nullable=True) # Years
    education = Column(Text, nullable=True)
    cv_file_path = Column(String(500), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
