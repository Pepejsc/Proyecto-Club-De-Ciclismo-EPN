import base64
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from sqlalchemy import func
from typing import Any
from datetime import date, timedelta, datetime
from app.models.domain.notification import Notification

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.domain.user import User
# Asegúrate de que MembershipStatus en domain ya tenga ACTIVO, INACTIVO, PENDIENTE
from app.models.domain.membership import Membership, MembershipStatus 
from app.models.schema.membership import MembershipCreate, MembershipResponse, MembershipStatusResponse, MembershipUpdate
from app.models.domain.persona import Persona

router = APIRouter()

@router.post("/", response_model=MembershipResponse)
def create_membership(
    membership_in: MembershipCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Any:
    """
    Crea una nueva membresía para el usuario logueado.
    """
    # 1. Verificar si ya existe
    existing_membership = db.query(Membership).filter(Membership.user_id == current_user.id).first()
    
    if existing_membership:
        raise HTTPException(
            status_code=400,
            detail="El usuario ya tiene una membresía registrada."
        )

    # --- CALCULAR FECHAS ---
    today = date.today()
    expiration_date = today + timedelta(days=365) # Membresía válida por 1 año
    now = datetime.now()

    # 2. Crear el objeto Membership
    new_membership = Membership(
        user_id=current_user.id,
        membership_type=membership_in.membership_type,
        participation_level=membership_in.participation_level,
        emergency_contact=membership_in.emergency_contact,
        emergency_phone=membership_in.emergency_phone,
        medical_conditions=membership_in.medical_conditions,
        
        # CORRECCIÓN: Usar estado en Español
        status=MembershipStatus.ACTIVO, 
        
        start_date=today,
        end_date=expiration_date,
        created_at=now,
        updated_at=now
    )

    db.add(new_membership)
    db.commit()
    db.refresh(new_membership)
    
    try:
        welcome_notification = Notification(
            user_id=current_user.id,
            category="MEMBRESIA",
            title="¡Membresía Creada Exitosamente!",
            message="Tu membresía ha sido activada. ¡Bienvenido al Club de Ciclismo!",
            is_read=False,
            priority="MEDIA",
            action_link="/user/mi-membresia",
            create_at=datetime.now()
        )
        db.add(welcome_notification)
        db.commit()
    except Exception as e:
        print(f"Error creando notificación: {e}")

    return new_membership

@router.get("/my-status", response_model=MembershipStatusResponse)
def read_my_membership_status(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. Buscar membresía
    membership = db.query(Membership).filter(Membership.user_id == current_user.id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Sin membresía")
    
    # 2. Buscar datos personales
    person_data = db.query(Persona).filter(Persona.id == current_user.person_id).first()
    if not person_data:
        raise HTTPException(status_code=404, detail="Datos personales no encontrados")

    full_name = f"{person_data.first_name} {person_data.last_name}"

    # --- PROCESAMIENTO DE IMAGEN ---
    final_profile_pic = None
    if person_data.profile_picture:
        if isinstance(person_data.profile_picture, bytes):
            b64_encoded = base64.b64encode(person_data.profile_picture).decode("utf-8")
            final_profile_pic = f"data:image/png;base64,{b64_encoded}"
        else:
            final_profile_pic = person_data.profile_picture

    # 3. Respuesta
    response_data = MembershipStatusResponse(
        **membership.__dict__,
        member_name=full_name,
        profile_picture_url=final_profile_pic
    )
    
    return response_data

@router.put("/{user_id}/toggle-status", response_model=MembershipResponse)
def toggle_membership_status(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Buscar la membresía
    membership = db.query(Membership).filter(Membership.user_id == user_id).first()
    
    if not membership:
        raise HTTPException(status_code=404, detail="El usuario no tiene membresía para activar.")

    # CORRECCIÓN: Lógica con estados en Español
    if membership.status == MembershipStatus.ACTIVE:
        membership.status = MembershipStatus.INACTIVE # Antes CANCELLED/SUSPENDED
    else:
        # Si está inactivo o pendiente, la activamos
        membership.status = MembershipStatus.ACTIVE

    db.commit()
    db.refresh(membership)
    return membership

@router.put("/{user_id}", response_model=MembershipResponse)
def update_membership(
    user_id: int,
    membership_in: MembershipUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # 1. BUSCAR MEMBRESÍA
    membership = db.query(Membership).filter(Membership.user_id == user_id).first()
    
    if not membership:
        raise HTTPException(status_code=404, detail="Membresía no encontrada")

    # 2. VALIDAR PERMISOS
    is_admin = current_user.role.value == "Admin"
    is_owner = current_user.id == user_id

    if not is_admin and not is_owner:
        raise HTTPException(status_code=403, detail="No tienes permiso para editar esta membresía")

    # 3. Actualizar campos
    update_data = membership_in.dict(exclude_unset=True)
    
    # Si es usuario normal, NO dejar cambiar STATUS
    if not is_admin and "status" in update_data:
        del update_data["status"] 

    for key, value in update_data.items():
        setattr(membership, key, value)

    try:
        db.add(membership)
        db.commit()
        db.refresh(membership)
        return membership
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al actualizar: {str(e)}")

# =============================================================================
# ENDPOINTS ADICIONALES (RENOVACIÓN Y ESTADÍSTICAS)
# =============================================================================

@router.post("/{user_id}/renew")
def renew_membership(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Renueva una membresía INACTIVA (vencida) por 1 año adicional
    """
    # Permisos
    if current_user.id != user_id and current_user.role.value != "Admin":
        raise HTTPException(status_code=403, detail="No tienes permiso para renovar esta membresía")

    membership = db.query(Membership).filter(Membership.user_id == user_id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Membresía no encontrada")

    # CORRECCIÓN: Verificar INACTIVO (Antes EXPIRED)
    if membership.status != MembershipStatus.INACTIVO:
        raise HTTPException(
            status_code=400, 
            detail="Solo se pueden renovar membresías inactivas o vencidas"
        )

    # Calcular nueva fecha
    new_end_date = date.today() + timedelta(days=365)
    previous_end_date = membership.end_date

    # Actualizar estado a ACTIVO
    membership.end_date = new_end_date
    membership.status = MembershipStatus.ACTIVO
    membership.updated_at = datetime.now()

    # Registrar en historial (SQL directo)
    try:
        table_exists = db.execute(text("SHOW TABLES LIKE 'membership_participations'")).fetchone()
        if table_exists:
            insert_query = text("""
                INSERT INTO membership_participations 
                (membership_id, participation_date, event_type, notes, created_at)
                VALUES (:membership_id, :participation_date, :event_type, :notes, :created_at)
            """)
            db.execute(insert_query, {
                'membership_id': membership.id,
                'participation_date': date.today(),
                'event_type': 'SOCIAL',
                'notes': f'Renovación de membresía - De {previous_end_date} a {new_end_date}',
                'created_at': datetime.now()
            })
    except Exception as e:
        print(f"Error registrando renovación: {e}")

    db.commit()
    db.refresh(membership)

    return {
        "success": True,
        "message": "Membresía renovada exitosamente",
        "new_end_date": new_end_date
    }

@router.post("/{user_id}/request-reactivation")
def request_reactivation(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Solicita reactivación de una membresía PENDIENTE
    """
    if current_user.id != user_id:
        raise HTTPException(status_code=403, detail="No tienes permiso")

    membership = db.query(Membership).filter(Membership.user_id == user_id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Membresía no encontrada")

    # CORRECCIÓN: Usar PENDIENTE
    if membership.status != MembershipStatus.PENDIENTE:
        raise HTTPException(
            status_code=400, 
            detail="Solo se puede solicitar reactivación para membresías PENDIENTES"
        )

    # Notificar Admins
    admins = db.query(User).filter(User.role == "Admin").all()
    for admin in admins:
        try:
            admin_notification = Notification(
                user_id=admin.id,
                category="MEMBRESIA",
                title="Solicitud de Reactivación",
                message=f"Usuario {current_user.email} solicita reactivar membresía ID {membership.id}.",
                is_read=False,
                priority="ALTA",
                action_link=f"/admin/memberships/{membership.id}",
                create_at=datetime.now()
            )
            db.add(admin_notification)
        except Exception:
            pass

    db.commit()
    return {"success": True, "message": "Solicitud enviada"}

@router.get("/{user_id}/participation-stats")
def get_participation_stats(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # (El código de participaciones SQL puro no necesita cambios de Enum, 
    #  a menos que la tabla participation use status, pero parece usar event_type)
    
    # ... (código existente de verificación de permisos y búsqueda de membresía) ...
    if current_user.id != user_id and current_user.role.value != "Admin":
        raise HTTPException(status_code=403, detail="No autorizado")

    membership = db.query(Membership).filter(Membership.user_id == user_id).first()
    if not membership:
        raise HTTPException(status_code=404, detail="Membresía no encontrada")

    # ... (Lógica de conteo SQL igual que tenías) ...
    participation_count = 0
    try:
        table_exists = db.execute(text("SHOW TABLES LIKE 'membership_participations'")).fetchone()
        if table_exists:
            count_query = text("SELECT COUNT(*) FROM membership_participations WHERE membership_id = :mid")
            result = db.execute(count_query, {'mid': membership.id}).fetchone()
            participation_count = result[0] if result else 0
    except:
        participation_count = 0

    return {
        "membership_id": membership.id,
        "participation_count": participation_count,
        "current_status": membership.status.value # Devolverá 'ACTIVO', 'INACTIVO', etc.
    }

@router.get("/stats")
def get_membership_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Obtiene estadísticas generales. 
    Este endpoint reemplaza la necesidad de 'app/services/membership_service.py'
    si el dashboard llama a este endpoint directamente.
    """
    if current_user.role.value != "Admin":
        raise HTTPException(status_code=403, detail="Acceso denegado")

    # Estadísticas por ESTADO (Ahora agrupará por ACTIVO, INACTIVO, PENDIENTE)
    status_stats = db.query(
        Membership.status,
        func.count(Membership.id)
    ).group_by(Membership.status).all()

    # Membresías del mes
    current_month = datetime.now().month
    current_year = datetime.now().year
    new_this_month = db.query(Membership).filter(
        func.extract('month', Membership.created_at) == current_month,
        func.extract('year', Membership.created_at) == current_year
    ).count()

    # Formatear respuesta para el Dashboard
    stats_by_status = {status: count for status, count in status_stats}

    return {
        "total_memberships": sum(stats_by_status.values()),
        "by_status": stats_by_status, # Claves serán: ACTIVO, INACTIVO, PENDIENTE
        "new_this_month": new_this_month,
        "last_updated": datetime.now()
    }