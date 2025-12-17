from pydantic import BaseModel
from typing import Optional
from datetime import date, datetime
from enum import Enum

# Reutilizamos los Enums para validación
class MembershipType(str, Enum):
    ENTRENADOR = "ENTRENADOR"
    CICLISTA = "CICLISTA"
    EQUIPO_EPN = "EQUIPO_EPN"

class ParticipationLevel(str, Enum):
    BEGINNER = "BEGINNER"
    INTERMEDIATE = "INTERMEDIATE"
    ADVANCED = "ADVANCED"
    COMPETITIVE = "COMPETITIVE"

class MembershipStatus(str, Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    PENDING = "PENDING"

# --- SCHEMA BASE (Campos compartidos) ---
class MembershipBase(BaseModel):
    membership_type: MembershipType
    participation_level: ParticipationLevel
    emergency_contact: str
    emergency_phone: str
    medical_conditions: Optional[str] = None

# --- SCHEMA DE CREACIÓN ---
class MembershipCreate(MembershipBase):
    pass

# --- SCHEMA DE RESPUESTA ---
class MembershipResponse(MembershipBase):
    id: int
    user_id: int
    status: MembershipStatus
    start_date: Optional[date]
    end_date: Optional[date]
    created_at: datetime

    class Config:
        from_attributes = True # <--- CAMBIO 1: Actualizado para Pydantic v2

# --- SCHEMA PARA ACTUALIZACIÓN ---
class MembershipUpdate(BaseModel):
    membership_type: Optional[MembershipType] = None
    participation_level: Optional[ParticipationLevel] = None
    status: Optional[MembershipStatus] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    emergency_contact: Optional[str] = None
    emergency_phone: Optional[str] = None
    medical_conditions: Optional[str] = None
    admin_notes: Optional[str] = None

    class Config:
        from_attributes = True


# --- SCHEMA PARA STATUS (El que usa la lista de usuarios) ---
class MembershipStatusResponse(BaseModel):
    id: int
    user_id: int
    status: MembershipStatus
    membership_type: MembershipType
    start_date: Optional[date]
    end_date: Optional[date]
    participation_level: ParticipationLevel
    emergency_contact: Optional[str]
    emergency_phone: Optional[str]
    medical_conditions: Optional[str]
    
    # --- CAMBIO 2: Hacerlos opcionales con default None ---
    # Esto evita que falle la lista de admin donde estos datos no se calculan
    member_name: Optional[str] = None
    profile_picture_url: Optional[str] = None

    class Config:
        from_attributes = True # <--- CAMBIO 3: Actualizado para Pydantic v2