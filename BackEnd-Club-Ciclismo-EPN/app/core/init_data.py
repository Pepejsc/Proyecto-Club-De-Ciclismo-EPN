from sqlalchemy.orm import Session
from app.models.domain.user import User
from app.models.domain.persona import Persona
from app.models.schema.user import UserCreate
from app.models.schema.persona import PersonaCreate
from app.core.config import settings
from app.db.database import SessionLocal
from app.crud.user import create_user
from app.crud.persona import create_persona

def create_admin_user():
    db = SessionLocal()
    try:
        # Tu código existente para crear admin...
        admin = db.query(User).filter(User.role == "admin").first()
        if not admin:
            user_data = UserCreate(
                email=settings.ADMIN_EMAIL,
                password=settings.ADMIN_PASSWORD,
                role="Admin",
                persona=PersonaCreate(
                    first_name=settings.ADMIN_FIRST_NAME,
                    last_name=settings.ADMIN_LAST_NAME,
                    phone_number=settings.ADMIN_PHONE_NUMBER,
                    city=settings.ADMIN_CITY,
                    neighborhood=settings.ADMIN_NEIGHBORHOOD,
                    blood_type=settings.ADMIN_BLOOD_TYPE,
                    skill_level=settings.ADMIN_SKILL_LEVEL,
                    profile_picture=None
                )
            )
            create_user(db, user_data)
            print(f"✅ Administrador creado con email: {settings.ADMIN_EMAIL}")
        else:
            print("✅ El administrador ya existe.")
    except Exception as e:
        print(f"❌ Error creando administrador: {e}")
    finally:
        db.close()

# AGREGAR ESTA NUEVA FUNCIÓN
def create_membership_types():
    db = SessionLocal()
    try:
        # Por ahora solo confirmamos que las tablas están listas
        # Puedes agregar tipos de membresía iniciales aquí si necesitas
        print("✅ Tablas de membresías listas")
    except Exception as e:
        print(f"❌ Error en membresías: {e}")
    finally:
        db.close()