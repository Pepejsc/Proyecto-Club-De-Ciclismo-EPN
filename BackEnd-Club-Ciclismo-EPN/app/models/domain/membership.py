from sqlalchemy import Column, Integer, String, Date, Enum, ForeignKey, Text, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from app.db.database import Base

# --- ENUMS (Deben coincidir con la BD) ---
class MembershipType(str, enum.Enum):
    ENTRENADOR = "ENTRENADOR"
    CICLISTA = "CICLISTA"
    EQUIPO_EPN = "EQUIPO_EPN"

class MembershipStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    PENDING = "PENDING"

class ParticipationLevel(str, enum.Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"
    COMPETITIVE = "COMPETITIVE"

class PaymentMethod(str, enum.Enum):
    CASH = "CASH"
    TRANSFER = "TRANSFER"
    WHATSAPP = "WHATSAPP"

class PaymentStatus(str, enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    REFUNDED = "REFUNDED"

# --- TABLA PRINCIPAL DE MEMBRESÍAS ---
class Membership(Base):
    __tablename__ = "memberships"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user.id"), unique=True, nullable=False)
    
    membership_type = Column(Enum(MembershipType), nullable=False)
    start_date = Column(Date, default=func.current_date())
    end_date = Column(Date) # Se calcula al activar
    
    status = Column(Enum(MembershipStatus), default=MembershipStatus.PENDING)
    
    # Datos Médicos y de Emergencia
    emergency_contact = Column(String(100))
    emergency_phone = Column(String(15))
    medical_conditions = Column(Text)
    participation_level = Column(Enum(ParticipationLevel), default=ParticipationLevel.BEGINNER)
    
    # --- NUEVOS CAMPOS PARA ESTUDIANTES EPN ---
    # nullable=True porque los externos no tienen esto
    unique_code = Column(String(20), nullable=True)  # Código Único (Ej: 201820616)
    matriculation_url = Column(String(1024), nullable=True) # URL del archivo/foto de matrícula
    
    admin_notes = Column(Text)
    
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relaciones
    user = relationship("User", back_populates="membership")
    payments = relationship("MembershipPayment", back_populates="membership")

# --- TABLA DE PAGOS ---
class MembershipPayment(Base):
    __tablename__ = "membership_payments"

    id = Column(Integer, primary_key=True, index=True)
    membership_id = Column(Integer, ForeignKey("memberships.id"), nullable=False)
    
    amount = Column(Integer, nullable=False)
    payment_date = Column(Date, default=func.current_date())
    
    period_start = Column("period_covered_start", Date)
    period_end = Column("period_covered_end", Date)
    
    payment_method = Column(Enum(PaymentMethod), nullable=False)
    status = Column(Enum(PaymentStatus), default=PaymentStatus.PENDING)
    
    payment_reference = Column(String(255))
    receipt_url = Column(String(1024))
    
    created_at = Column(DateTime, server_default=func.now())

    # Relaciones
    membership = relationship("Membership", back_populates="payments")