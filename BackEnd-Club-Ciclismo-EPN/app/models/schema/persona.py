import base64
from typing import Optional
from pydantic import BaseModel
from app.models.domain.persona import SkillLevel, BloodType

# Esquema base para datos personales
class PersonaBase(BaseModel):
    first_name: str
    last_name: str
    phone_number: str
    city: str
    neighborhood: str
    blood_type: BloodType
    skill_level: SkillLevel
    profile_picture: Optional[str] = None

# Crear persona (registro)
class PersonaCreate(PersonaBase):
    pass

# Actualizar datos parcialmente
class PersonaUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone_number: Optional[str] = None
    city: Optional[str] = None
    neighborhood: Optional[str] = None
    blood_type: Optional[BloodType] = None
    skill_level: Optional[SkillLevel] = None
    profile_picture: Optional[str] = None

    class Config:
        from_attributes = True

class PersonaResponse(PersonaBase):
    id: int

    class Config:
        from_attributes = True
    
    # ¡HEMOS ELIMINADO EL MÉTODO from_orm MANUAL!
    # Ahora Pydantic leerá automáticamente la URL de la base de datos
    # y la pasará al frontend tal cual.