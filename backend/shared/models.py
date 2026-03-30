from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, Boolean, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from database import Base

class RoleEnum(str, enum.Enum):
    candidate = "candidate"
    rh = "rh"

class ApplicationStatus(str, enum.Enum):
    pending = "pending"
    accepted = "accepted"
    rejected = "rejected"
    saved = "saved"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password = Column(String(255), nullable=False)  # Hashed
    role = Column(Enum(RoleEnum), default=RoleEnum.candidate, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    created_jobs = relationship("JobOffer", back_populates="creator")
    applications = relationship("Application", back_populates="candidate")

class JobOffer(Base):
    __tablename__ = "job_offers"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=False)
    domain = Column(String(255), nullable=True) # E.g., IT, Finance, Marketing
    priority_criteria = Column(String(500), nullable=True) # Hidden from candidate, mandatory for acceptance
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    creator = relationship("User", back_populates="created_jobs")
    applications = relationship("Application", back_populates="job_offer", cascade="all, delete")

class Application(Base):
    __tablename__ = "applications"
    id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("users.id"))
    job_offer_id = Column(Integer, ForeignKey("job_offers.id"))
    cv_file = Column(String(500), nullable=False)
    status = Column(Enum(ApplicationStatus), default=ApplicationStatus.pending)
    rejection_reason = Column(Text, nullable=True)
    interview_link = Column(String(500), nullable=True) # UUID for WebSocket session
    created_at = Column(DateTime, default=datetime.utcnow)

    # AI Parsed Meta Data (Hidden from Candidate)
    cv_score = Column(Float, default=0.0)
    parsed_skills = Column(Text, nullable=True)
    
    # Relationships
    candidate = relationship("User", back_populates="applications")
    job_offer = relationship("JobOffer", back_populates="applications")
    interview = relationship("Interview", back_populates="application", uselist=False, cascade="all, delete")

class Interview(Base):
    __tablename__ = "interviews"
    id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.id"), unique=True)
    interview_score = Column(Float, nullable=True)
    ai_comments = Column(Text, nullable=True)
    interview_date = Column(DateTime, nullable=True)
    passed = Column(Boolean, default=False)
    
    # Relationships
    application = relationship("Application", back_populates="interview")
