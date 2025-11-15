# app/models/domain/membership.py
from sqlalchemy import Column, Integer, String, Date, ForeignKey, Enum, DateTime, Text, DECIMAL
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum
from datetime import datetime

class MembershipStatus(enum.Enum):
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED" 
    PENDING = "PENDING"
    CANCELLED = "CANCELLED"

class MembershipType(enum.Enum):
    ENTRENADOR = "ENTRENADOR"
    CICLISTA = "CICLISTA"
    EQUIPO_EPN = "EQUIPO_EPN"

class Membership(Base):
    __tablename__ = "memberships"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), nullable=False)
    membership_type = Column(Enum(MembershipType), nullable=False)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    status = Column(Enum(MembershipStatus), default=MembershipStatus.PENDING)
    
    # Campos adicionales que mencionaste
    emergency_contact = Column(String(100))
    emergency_phone = Column(String(15))
    medical_conditions = Column(Text)
    participation_level = Column(Enum('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'COMPETITIVE'))
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="memberships")
    payments = relationship("MembershipPayment", back_populates="membership")
    participations = relationship("MembershipParticipation", back_populates="membership")