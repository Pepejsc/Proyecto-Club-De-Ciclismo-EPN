import os
import smtplib
import logging
from typing import Optional
from datetime import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

from fastapi import APIRouter, BackgroundTasks, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from dotenv import load_dotenv

# --- Configuración Inicial ---
load_dotenv()

# Configuración de Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/sponsors", tags=["sponsors"])

# Constantes de Configuración (Idealmente mover a un archivo config.py)
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 465
MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
MAIL_ADMIN = os.getenv("MAIL_ADMIN")

# --- Esquemas (Pydantic Models) ---

class SponsorForm(BaseModel):
    company_name: str = Field(..., title="Nombre de la Empresa", example="Tech Solutions S.A.")
    contact_name: str = Field(..., title="Nombre de Contacto", example="Juan Pérez")
    position: str = Field(..., title="Cargo", example="Gerente de Marketing")
    contact_email: EmailStr = Field(..., title="Email Corporativo", example="juan.perez@techsolutions.com")
    contact_phone: str = Field(..., title="Teléfono", example="+593 99 999 9999")
    proposal_description: str = Field(..., title="Descripción de la Propuesta", min_length=10)
    documentation: Optional[str] = Field(None, title="URL o Enlace a documentación extra")

    class Config:
        json_schema_extra = {
            "example": {
                "company_name": "Tech Solutions S.A.",
                "contact_name": "Juan Pérez",
                "position": "Gerente",
                "contact_email": "contacto@empresa.com",
                "contact_phone": "0991234567",
                "proposal_description": "Propuesta de auspicio para el torneo anual...",
                "documentation": "https://drive.google.com/file/d/..."
            }
        }

class SponsorResponse(BaseModel):
    success: bool
    message: str

# --- Servicios (Lógica de Negocio) ---

def _build_email_body(data: dict) -> str:
    """Construye el cuerpo del correo en texto plano."""
    return f"""
    NUEVA SOLICITUD DE AUSPICIO - CLUB CICLISMO EPN
    
    EMPRESA: {data['company_name']}
    
    INFORMACIÓN DE CONTACTO:
    • Nombre: {data['contact_name']}
    • Cargo: {data['position']} 
    • Email: {data['contact_email']}
    • Teléfono: {data['contact_phone']}
    
    PROPUESTA:
    {data['proposal_description']}
    
    DOCUMENTACIÓN: {data.get('documentation', 'N/A')}
    
    ---
    Club Ciclismo EPN
    Recibido: {datetime.now().strftime('%d/%m/%Y a las %H:%M')}
    """

def send_sponsor_email_task(sponsor_data: dict):
    """
    Tarea en segundo plano que gestiona el envío del correo SMTP.
    """
    logger.info(f" Procesando propuesta de: {sponsor_data['company_name']}")

    if not all([MAIL_USERNAME, MAIL_PASSWORD, MAIL_ADMIN]):
        logger.error(" Error de configuración: Faltan variables de entorno para el envío de correos.")
        return

    try:
        subject = f" NUEVO AUSPICIANTE: {sponsor_data['company_name']}"
        body = _build_email_body(sponsor_data)
        
        message = MIMEMultipart()
        message["From"] = MAIL_USERNAME
        message["To"] = MAIL_ADMIN
        message["Subject"] = subject
        message.attach(MIMEText(body, "plain"))
        
        with smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT) as server:
            server.login(MAIL_USERNAME, MAIL_PASSWORD)
            server.sendmail(MAIL_USERNAME, MAIL_ADMIN, message.as_string())
            
        logger.info(f" Email enviado exitosamente a {MAIL_ADMIN}")

    except smtplib.SMTPAuthenticationError:
        logger.error(" Error de autenticación SMTP. Verifique usuario y contraseña.")
    except Exception as e:
        logger.error(f" Error inesperado enviando email: {e}", exc_info=True)

# --- Endpoints ---

@router.post(
    "/apply",
    response_model=SponsorResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Enviar solicitud de auspicio",
    description="Recibe los datos de un potencial auspiciante y notifica al administrador vía correo electrónico en segundo plano."
)
async def apply_sponsor(form: SponsorForm, background_tasks: BackgroundTasks):
    try:
        logger.info(f" Solicitud recibida de: {form.contact_email}")
        
        # Pydantic v2 usa model_dump(), v1 usa dict(). Usamos model_dump para modernidad.
        form_data = form.model_dump() if hasattr(form, "model_dump") else form.dict()

        background_tasks.add_task(send_sponsor_email_task, form_data)
        
        return SponsorResponse(
            success=True,
            message=" Propuesta recibida correctamente. Nos pondremos en contacto pronto."
        )
        
    except Exception as e:
        logger.error(f" Error crítico en endpoint /apply: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error al procesar su solicitud."
        )