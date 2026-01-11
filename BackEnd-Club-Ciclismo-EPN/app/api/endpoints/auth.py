import pytz
import base64
import io
import os
import uuid
from PIL import Image
from datetime import timedelta
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from fastapi import Form
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import EmailStr
from sqlalchemy.orm import Session, joinedload
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text  # <--- IMPORTANTE: Necesario para SQL directo

# --- IMPORTS DEL PROYECTO ---
from app.core.security import create_access_token, ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user, get_user
from app.crud.persona import update_persona
from app.crud.token import create_token, verify_token
from app.crud.user import get_user_id_by_email, create_user
from app.db.session import get_db
from app.models.domain.token import AuthToken
from app.models.domain.user import User, Role
from app.models.schema.persona import PersonaResponse, PersonaUpdate
from app.models.schema.user import UserCreate, UserResponse, UserWithPersonaResponse, UserUpdate, Token, TokenData
from app.services.crypt import verify_password
from app.services.email_service import send_email
from app.services.multi_crud_service import reset_password
from app.services.verify import verify_structure_password

# --- IMPORTS PARA ELIMINACIÓN EN CASCADA ---
from app.models.domain.notification import Notification
from app.models.domain.membership import Membership, MembershipPayment
from app.models.domain.document_models import Document
from app.models.domain.event_participant import EventParticipant

router = APIRouter()

ALL_AUTH_ROLES = [Role.ADMIN, Role.NORMAL]

# --- CONFIGURACIÓN DE CARPETA DE IMÁGENES ---
UPLOAD_DIR = "uploads/profiles"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# --- FUNCIÓN BLINDADA PARA GUARDAR FOTO EN DISCO ---
def save_base64_to_disk(base64_str: str) -> str:
    """Decodifica base64, arregla padding, guarda archivo y retorna URL."""
    try:
        # 1. Separar el header si existe (data:image/...)
        if "base64," in base64_str:
            base64_str = base64_str.split("base64,")[1]
        
        # 2. Limpieza de caracteres sucios (espacios, newlines)
        base64_str = base64_str.strip().replace("\n", "").replace("\r", "")

        # 3. ARREGLO DEL ERROR "Multiple of 4": Agregar Padding faltante
        # El base64 debe tener una longitud divisible por 4. Si no, se agregan '='
        missing_padding = len(base64_str) % 4
        if missing_padding:
            base64_str += '=' * (4 - missing_padding)
        
        # 4. Decodificar
        image_data = base64.b64decode(base64_str)
        
        # 5. Procesar con Pillow (Validar y Convertir a RGB)
        img = Image.open(io.BytesIO(image_data))
        if img.mode in ("RGBA", "P"):
            img = img.convert("RGB")
            
        filename = f"{uuid.uuid4()}.jpg"
        file_path = os.path.join(UPLOAD_DIR, filename)
        
        # 6. Guardar redimensionado
        img.thumbnail((800, 800))
        img.save(file_path, format="JPEG", quality=75)
        
        print(f"✅ Imagen guardada correctamente: {filename}")
        return f"/uploads/profiles/{filename}"
        
    except Exception as e:
        print(f"❌ Error guardando imagen en disco: {e}")
        return None

# ==========================================
# ENDPOINTS
# ==========================================

@router.post("/register", response_model=UserResponse)
def register_user(
    register_data: UserCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """ Crear usuario nuevo con verificación de email epn.edu.ec """
    # 1. Detectar Dominio EPN
    is_epn_student = register_data.email.endswith("@epn.edu.ec")
    
    # 2. Asignar Rol o Estado Inicial
    if is_epn_student:
        # Opcional: Aquí podrías forzar un rol específico si fuera necesario
        pass 

    # 3. Crear el usuario (Tu función create_user ya maneja la lógica de BD)
    new_user = create_user(db, register_data)
    
    # 4. Si es EPN, enviar correo de verificación
    if is_epn_student:
        try:
            # Generar Token de Verificación (Reusamos la lógica de AuthToken)
            verification_token = AuthToken()
            verification_token.generate_token(new_user.id)
            create_token(db, verification_token) # Guardar en BD

            # Preparar Correo
            subject = "Verificación de Cuenta EPN"
            
            # Contexto para la plantilla HTML nueva
            context = {
                "body": {
                    "code": verification_token.value,
                    "name": f"{new_user.person.first_name}" # Solo primer nombre para ser más amigable
                }
            }
            
            # Enviar en segundo plano usando la NUEVA PLANTILLA
            background_tasks.add_task(
                send_email, 
                new_user.email, 
                subject, 
                context, 
                "verification_email.html" 
            )
            print(f"📧 Correo de verificación enviado a {new_user.email}")
            
        except Exception as e:
            print(f"❌ Error enviando verificación EPN: {e}")
            # No fallamos el registro, pero el usuario no podrá verificar sin el correo
    
    return new_user

@router.post("/verify-email")
def verify_student_email(code: int, db: Session = Depends(get_db)):
    """ Verifica el código y activa el estatus de estudiante """
    
    # 1. Verificar Token (Reusamos tu función verify_token)
    is_valid, user_id = verify_token(db, code)
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Código inválido o expirado")
    
    # 2. Buscar Usuario
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    # 3. Actualizar Estado del Usuario (Confirmar que es estudiante verificado)
    # Aquí puedes agregar lógica adicional como cambiar rol o activar un flag
    # user.is_verified = True
    
    db.commit()
    
    return {"message": "Correo verificado exitosamente. ¡Bienvenido al Club!"}

@router.post("/token", response_model=Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """ Login y generación de Token """
    user = db.query(User).filter(User.email == form_data.username).first()
    
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@router.post('/reset_password/send')
async def send_reset_password_code(background_tasks: BackgroundTasks, email: EmailStr = Form(...), db: Session = Depends(get_db)):
    """ Enviar código de recuperación """
    subject = 'Recuperación de contraseña'
    try:
        user_id = get_user_id_by_email(db, email)
        if not user_id:
            return {"message": "El código fue enviado exitosamente."}

        reset_token = AuthToken()
        reset_token.generate_token(user_id)

        if not create_token(db, reset_token):
            raise HTTPException(status_code=500, detail="No se pudo generar el token.")

        ecuador_tz = pytz.timezone("America/Guayaquil")
        expiration_time = reset_token.date_expiration.replace(tzinfo=pytz.utc).astimezone(ecuador_tz)

        context = {"body": {"title": "Club de Ciclismo EPN", "code": reset_token.value, "date": expiration_time.strftime("%Y-%m-%d %H:%M:%S")}}
        background_tasks.add_task(send_email, email, subject, context, "email.html")
        return {"message": "El código fue enviado exitosamente."}
    except HTTPException as http_exc:
        raise http_exc
    except Exception as e:
        raise HTTPException(status_code=500, detail="Error interno.")

@router.post('/reset_password/verify', response_model=dict)
async def verify_password_code(code: int, db: Session = Depends(get_db)):
    """ Verificar código """
    is_verified, id_user = verify_token(db, code)
    if is_verified:
        return {'is_valid': True, 'message': 'Código valido'}
    raise HTTPException(status_code=400, detail="Código invalido")

@router.post('/reset_password/reset', response_model=dict)
async def reset_forgotten_password(code: int, new_password: str, db: Session = Depends(get_db)):
    """ Resetear password """
    if not verify_structure_password(new_password):
        raise HTTPException(status_code=400, detail="Contraseña inválida (requiere mayúscula y número)")
    return reset_password(db, code, new_password)

@router.delete("/delete/{user_id}", response_model=UserResponse)
def delete_user_and_persona(user_id: int, db: Session = Depends(get_db), current_user: TokenData = Depends(get_current_user)):
    """ Eliminar usuario (Limpieza profunda de todas las tablas) """
    if current_user.role.value not in [Role.ADMIN]:
        raise HTTPException(status_code=403, detail="Permisos insuficientes")
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
        persona = user.person
        
        # Limpieza de seguridad: si la foto está corrupta (bytes), la ignoramos para poder responder
        if persona and isinstance(persona.profile_picture, bytes):
            persona.profile_picture = None
            
        user_response = UserResponse.from_orm_custom(user)

        # --- BORRADO EN CASCADA ---
        db.query(Document).filter(Document.created_by == user_id).delete()
        try:
            db.execute(text("UPDATE activos_operativos SET id_usuario_responsable = NULL WHERE id_usuario_responsable = :uid"), {"uid": user_id})
        except: pass
        
        db.query(EventParticipant).filter(EventParticipant.user_id == user_id).delete()
        
        user_membership = db.query(Membership).filter(Membership.user_id == user_id).first()
        if user_membership:
            # 1. Borrar Pagos asociados
            db.query(MembershipPayment).filter(MembershipPayment.membership_id == user_membership.id).delete()
            
            # 2. Borrar Historial de Participaciones (Tabla SQL Cruda)
            # Esto evita el error de llave foránea (1451)
            try:
                db.execute(text("DELETE FROM membership_participations WHERE membership_id = :mid"), {"mid": user_membership.id})
            except Exception as e:
                print(f"⚠️ Nota: No se pudo limpiar participaciones o la tabla no existe: {e}")

            # 3. Finalmente borrar la membresía
            db.delete(user_membership)
            
        db.query(AuthToken).filter(AuthToken.user_id == user_id).delete()
        db.query(Notification).filter(Notification.user_id == user_id).delete()
        # --------------------------

        db.delete(user)
        if persona:
            db.delete(persona)
        db.commit()
        
        return user_response

    except SQLAlchemyError as e:
        db.rollback()
        print(f"❌ Error eliminando: {e}")
        # Retornamos un mensaje claro en caso de error de BD
        raise HTTPException(status_code=500, detail=f"Error BD al eliminar: {str(e)}")

@router.get("/users", response_model=list[UserWithPersonaResponse])
def get_users(db: Session = Depends(get_db), current_user: TokenData = Depends(get_current_user)):
    """ Listar usuarios """
    if current_user.role.value not in [Role.ADMIN]:
        raise HTTPException(status_code=403, detail="Permisos insuficientes")
    try:
        users = db.query(User).options(
            joinedload(User.person),
            joinedload(User.membership)
        ).all()

        # Limpieza de seguridad: Si hay bytes viejos, poner None
        for u in users:
            if u.person and isinstance(u.person.profile_picture, bytes):
                u.person.profile_picture = None

        return [UserWithPersonaResponse.from_orm_custom(user) for user in users]
    except Exception as e:
        print(f"Error users: {e}")
        raise HTTPException(status_code=500, detail="Error obteniendo usuarios")

@router.get("/my_profile", response_model=PersonaResponse)
def get_my_profile(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """ Perfil propio """
    try:
        if not current_user.person:
            raise HTTPException(status_code=404, detail="No se encontró información")
        
        # Limpieza de seguridad
        if isinstance(current_user.person.profile_picture, bytes):
             current_user.person.profile_picture = None
             
        return PersonaResponse.from_orm(current_user.person)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error perfil: {str(e)}")

@router.put("/update/basic_information/{persona_id}", response_model=PersonaResponse)
def update_basic_info(persona_id: int, persona_update: PersonaUpdate, db: Session = Depends(get_db), current_user: TokenData = Depends(get_current_user)):
    """ Actualizar perfil """
    if current_user.role.value not in ALL_AUTH_ROLES:
        raise HTTPException(status_code=403, detail="Permisos insuficientes")
    try:
        # 1. Detectar si viene foto nueva (base64 largo)
        if persona_update.profile_picture and len(persona_update.profile_picture) > 300:
            print(">>> Recibida imagen nueva, intentando guardar en disco...")
            
            file_url = save_base64_to_disk(persona_update.profile_picture)
            
            if file_url:
                # Guardamos la URL en la BD
                persona_update.profile_picture = file_url
            else:
                print("❌ Falló el guardado de imagen, se enviará sin cambios.")
                persona_update.profile_picture = None
        
        # 2. Actualizar
        updated_persona = update_persona(db, persona_id, persona_update)
        return PersonaResponse.from_orm(updated_persona)

    except Exception as e:
        print(f"❌ Error update: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al actualizar: {str(e)}")

@router.put("/update/role/{user_id}", response_model=UserResponse)
def update_user_role(user_id: int, user_update: UserUpdate, db: Session = Depends(get_db), current_user: TokenData = Depends(get_current_user)):
    """ Actualizar rol """
    if current_user.role.value not in [Role.ADMIN]:
        raise HTTPException(status_code=403, detail="Permisos insuficientes")
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        if user_update.role:
            user.role = user_update.role
        db.commit()
        db.refresh(user)
        
        if user.person and isinstance(user.person.profile_picture, bytes):
            user.person.profile_picture = None
            
        return UserResponse.from_orm_custom(user)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error rol: {str(e)}")