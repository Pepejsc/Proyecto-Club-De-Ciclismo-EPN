from pydantic import BaseModel
from enum import Enum
from typing import Optional
from pydantic import EmailStr

# Imports de tus otros schemas
from app.models.schema.membership import MembershipStatusResponse
from app.models.schema.persona import PersonaCreate, PersonaResponse

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: str

class Role(str, Enum):
    ADMIN = "Admin"
    NORMAL = "Normal"

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str
    role: Role = Role.NORMAL
    persona: PersonaCreate

class UserResponse(UserBase):
    id: int
    role: Role
    person: Optional[PersonaResponse] = None

    class Config:
        from_attributes = True
    
    @classmethod
    def from_orm_custom(cls, user):
        return cls(
            id=user.id,
            email=user.email,
            role=user.role,
            person=PersonaResponse.from_orm(user.person) if user.person else None
        )

class UserUpdate(BaseModel):
    role: Optional[Role] = None
    class Config:
        from_attributes = True

class RegisterUser(PersonaCreate):
    email: EmailStr
    password: str

# --- AQUÍ ESTÁ EL CAMBIO CRÍTICO ---
class UserWithPersonaResponse(BaseModel):
    id: int
    role: Role
    person: Optional[PersonaResponse] = None
    membership: Optional[MembershipStatusResponse] = None

    class Config:
        from_attributes = True
    
    @classmethod
    def from_orm_custom(cls, user):
        # 1. Intentar cargar la persona
        person_data = None
        if user.person:
            try:
                person_data = PersonaResponse.from_orm(user.person)
            except Exception as e:
                print(f"⚠️ Error cargando persona para user {user.id}: {e}")

        # 2. Intentar cargar la membresía (Blindaje)
        membership_data = None
        if user.membership:
            try:
                membership_data = MembershipStatusResponse.from_orm(user.membership)
            except Exception as e:
                print(f"⚠️ Error cargando membresía para user {user.id}: {e}")
                # Si falla, la dejamos en None, pero NO rompemos la lista.

        return cls(
            id=user.id,
            role=user.role,
            person=person_data,
            membership=membership_data
        )

class UserBasicResponse(BaseModel):
    id: int
    person: PersonaResponse
    class Config:
        from_attributes = True