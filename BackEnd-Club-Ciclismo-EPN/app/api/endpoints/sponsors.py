# app/api/endpoints/sponsors.py
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

# ✅ DEFINIR EL ROUTER PRIMERO
router = APIRouter(prefix="/sponsors", tags=["sponsors"])

# Modelo para los datos
class SponsorForm(BaseModel):
    company_name: str
    contact_name: str
    position: str
    contact_email: str
    contact_phone: str
    proposal_description: str
    documentation: str = None

# Endpoint
@router.post("/apply")
async def apply_sponsor(form: SponsorForm, background_tasks: BackgroundTasks):
    try:
        print("📨 Datos recibidos:", form.dict())
        
        # Procesar en segundo plano
        background_tasks.add_task(process_sponsor_data, form.dict())
        
        return {
            "success": True,
            "message": "✅ Propuesta recibida correctamente. Nos pondremos en contacto pronto."
        }
        
    except Exception as e:
        print("❌ Error en endpoint:", e)
        raise HTTPException(status_code=500, detail="Error interno del servidor")

def process_sponsor_data(sponsor_data: dict):
    """Función para procesar los datos y enviar email"""
    try:
        print(f"🎯 Procesando propuesta de: {sponsor_data['company_name']}")
        
        # Enviar email
        send_sponsor_email(sponsor_data)
        
        print("✅ Procesamiento completado")
        
    except Exception as e:
        print(f"❌ Error procesando datos: {e}")

def send_sponsor_email(sponsor_data: dict):
    """Envía email con los datos del auspiciante"""
    try:
        # Configuración de email
        EMAIL_USER = os.getenv("MAIL_USERNAME")
        EMAIL_PASS = os.getenv("MAIL_PASSWORD") 
        ADMIN_EMAIL = os.getenv("MAIL_ADMIN")
        
        print(f"📧 Intentando enviar email a: {ADMIN_EMAIL}")
        
        # Crear el mensaje
        subject = f"🚴 NUEVO AUSPICIANTE: {sponsor_data['company_name']}"
        
        body = f"""
        NUEVA SOLICITUD DE AUSPICIO - CLUB CICLISMO EPN
        
        🏢 EMPRESA: {sponsor_data['company_name']}
        
        👤 INFORMACIÓN DE CONTACTO:
        • Nombre: {sponsor_data['contact_name']}
        • Cargo: {sponsor_data['position']} 
        • Email: {sponsor_data['contact_email']}
        • Teléfono: {sponsor_data['contact_phone']}
        
        📝 PROPUESTA:
        {sponsor_data['proposal_description']}
        
        ---
        🏛️ Club Ciclismo EPN
        📅 Recibido: {datetime.now().strftime('%d/%m/%Y a las %H:%M')}
        """
        
        # Configurar el mensaje de email
        message = MIMEMultipart()
        message["From"] = EMAIL_USER
        message["To"] = ADMIN_EMAIL
        message["Subject"] = subject
        
        # Agregar el cuerpo del mensaje
        message.attach(MIMEText(body, "plain"))
        
        # Enviar el email
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL_USER, EMAIL_PASS)
            server.sendmail(EMAIL_USER, ADMIN_EMAIL, message.as_string())
            
        print(f"✅ Email enviado exitosamente a {ADMIN_EMAIL}")
        
    except Exception as e:
        print(f"❌ Error enviando email: {e}")

# Verificación (temporal)
print("✅ sponsors.py cargado correctamente")
print(f"✅ Router definido: {router.prefix}")