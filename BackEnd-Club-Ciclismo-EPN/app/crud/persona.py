import base64
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.models.domain.persona import Persona
from app.models.schema.persona import PersonaCreate, PersonaUpdate
from app.services.verify import verify_cellphone_number, verify_location_field

# Nota: Ya no importamos verify_image_size porque auth.py maneja la imagen

def create_persona(db: Session, persona_data: PersonaCreate):
    # Validar número de teléfono
    if not verify_cellphone_number(persona_data.phone_number):
        raise HTTPException(status_code=400,
                            detail="Número de teléfono inválido. Debe tener entre 7 y 10 dígitos numéricos.")

    # Validar ciudad y barrio
    persona_data.city = verify_location_field(persona_data.city, "Ciudad")
    persona_data.neighborhood = verify_location_field(persona_data.neighborhood, "Barrio")

    # Verificar si el número de teléfono ya está registrado
    existing_persona = db.query(Persona).filter(Persona.phone_number == persona_data.phone_number).first()
    if existing_persona:
        raise HTTPException(status_code=400, detail="El número de teléfono ya está registrado.")

    try:
        new_persona = Persona(**persona_data.dict())
        db.add(new_persona)
        db.commit()
        db.refresh(new_persona)
        return new_persona
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Error de integridad al crear persona.")


def get_persona_by_id(db: Session, persona_id: int):
    return db.query(Persona).filter(Persona.id == persona_id).first()


def get_all_personas(db: Session):
    return db.query(Persona).all()


def update_persona(db: Session, persona_id: int, persona_data: PersonaUpdate):
    persona = db.query(Persona).filter(Persona.id == persona_id).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada.")

    # exclude_unset=True evita sobreescribir con null lo que no enviaste
    update_data = persona_data.dict(exclude_unset=True)

    # Validación del número de teléfono
    if "phone_number" in update_data and not verify_cellphone_number(update_data["phone_number"]):
        raise HTTPException(
            status_code=400,
            detail="Número de teléfono inválido. Debe tener entre 7 y 10 dígitos numéricos."
        )

    # Validación de ubicación
    if "city" in update_data:
        update_data["city"] = verify_location_field(update_data["city"], "Ciudad")
    if "neighborhood" in update_data:
        update_data["neighborhood"] = verify_location_field(update_data["neighborhood"], "Barrio")

    # --- CORRECCIÓN: Eliminamos el bloque que intentaba verificar la imagen ---
    # Como auth.py ya nos manda la URL limpia (string), simplemente dejamos
    # que el bucle de abajo la guarde tal cual.
    
    # Aplicar cambios dinámicamente
    for key, value in update_data.items():
        setattr(persona, key, value)

    try:
        db.add(persona)
        db.commit()
        db.refresh(persona)
        return persona
    except Exception as e:
        db.rollback()
        print(f"Error en DB update_persona: {e}")
        raise HTTPException(status_code=500, detail="Error al actualizar persona en base de datos")

def delete_persona(db: Session, persona_id: int):
    persona = get_persona_by_id(db, persona_id)
    if not persona:
        raise HTTPException(status_code=404, detail="Persona no encontrada")

    try:
        db.delete(persona)
        db.commit()
        return {"detail": "Persona eliminada correctamente"}
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail="Error al eliminar la persona")