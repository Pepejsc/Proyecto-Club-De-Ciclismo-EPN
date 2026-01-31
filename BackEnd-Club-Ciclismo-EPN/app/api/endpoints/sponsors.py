import logging
from fastapi import APIRouter, Form, File, UploadFile, HTTPException, status
from app.services.notification_service import send_sponsor_notification

# Configuración de Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Definición del Router
router = APIRouter(prefix="/sponsors", tags=["sponsors"])

@router.post("/apply", status_code=status.HTTP_202_ACCEPTED)
async def apply_sponsor(
    # Usamos Form(...) en lugar de Pydantic para aceptar FormData del frontend
    company_name: str = Form(...),
    contact_name: str = Form(...),
    position: str = Form(...),
    contact_email: str = Form(...),
    contact_phone: str = Form(...),
    proposal_description: str = Form(...),
    # El archivo es opcional, pero usamos UploadFile para manejar binarios
    file: UploadFile = File(None)
):
    """
    Recibe la solicitud de auspicio vía FormData, valida el archivo 
    y delega el envío del correo al servicio de notificaciones.
    """
    try:
        logger.info(f"📩 Solicitud de auspicio recibida de: {contact_email}")

        # 1. Procesar archivo (Si existe)
        file_bytes = None
        filename = None

        if file:
            # Validación básica de tipo de archivo (MIME Type)
            allowed_types = [
                "application/pdf", 
                "application/msword", 
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document", # .docx
                "image/jpeg", 
                "image/png"
            ]
            
            if file.content_type not in allowed_types:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST, 
                    detail="Tipo de archivo no permitido. Solo PDF, Word o Imágenes."
                )
            
            # Leemos los bytes para pasarlos al servicio de correo
            file_bytes = await file.read()
            filename = file.filename

        # 2. Empaquetar los datos
        sponsor_data = {
            "company_name": company_name,
            "contact_name": contact_name,
            "position": position,
            "contact_email": contact_email,
            "contact_phone": contact_phone,
            "proposal_description": proposal_description
        }

        # 3. Enviar correo usando el servicio centralizado (HTML Profesional)
        # Pasamos los bytes del archivo y el nombre para que se adjunte
        send_sponsor_notification(sponsor_data, file_obj=file_bytes, filename=filename)

        return {
            "success": True, 
            "message": "Propuesta recibida correctamente. Nos pondremos en contacto pronto."
        }

    except HTTPException as he:
        raise he
    except Exception as e:
        logger.error(f"❌ Error crítico en endpoint /apply: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error al procesar su solicitud."
        )