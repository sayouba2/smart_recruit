from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from database import Base

class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), index=True, nullable=False)
    description = Column(Text, nullable=False)
    skills_required = Column(Text, nullable=True) # Stored as JSON string or comma-separated
    experience_required = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
