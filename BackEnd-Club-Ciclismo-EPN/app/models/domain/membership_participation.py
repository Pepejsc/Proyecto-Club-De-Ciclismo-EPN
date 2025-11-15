# app/models/domain/membership_participation.py
from sqlalchemy import Column, Integer, String, Date, ForeignKey, Enum, Text, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum
from datetime import datetime

class ParticipationRating(enum.Enum):
    POOR = "POOR"
    AVERAGE = "AVERAGE" 
    GOOD = "GOOD"
    EXCELLENT = "EXCELLENT"

class MembershipParticipation(Base):
    __tablename__ = "membership_participations"
    
    id = Column(Integer, primary_key=True, index=True)
    membership_id = Column(Integer, ForeignKey("memberships.id"), nullable=False)
    event_id = Column(Integer, ForeignKey("event.id"))
    participation_date = Column(Date, nullable=False)
    event_type = Column(Enum('TRAINING', 'COMPETITION', 'SOCIAL'))
    notes = Column(Text)
    performance_rating = Column(Enum(ParticipationRating))
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    membership = relationship("Membership", back_populates="participations")