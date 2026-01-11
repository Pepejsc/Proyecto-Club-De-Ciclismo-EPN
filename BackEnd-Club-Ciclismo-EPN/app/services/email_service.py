import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from pathlib import Path
from dotenv import load_dotenv
import os
from jinja2 import Template
from datetime import datetime
from email.mime.application import MIMEApplication


# Cargar variables de entorno
load_dotenv()

EMAIL_USER = os.getenv("MAIL_USERNAME")
EMAIL_PASS = os.getenv("MAIL_PASSWORD")
ADMIN_EMAIL = os.getenv("MAIL_ADMIN")

def render_template(template_name: str, context: dict) -> str:
    """
    Renderiza una plantilla HTML con Jinja2.
    """
    template_path = Path(__file__).parent.parent / "resources" / "templates" / template_name
    template_content = template_path.read_text(encoding="utf-8")
    template = Template(template_content)
    return template.render(context)

# Función para enviar correo electrónico reseet de contraseña
def send_email(recipient: str, subject: str, context: dict, template: str):
    """
    Envía un correo electrónico con una plantilla HTML e imagen adjunta.
    """
    # Renderizar la plantilla
    html_content = render_template(template, context)

    # Configurar el mensaje
    message = MIMEMultipart("related")  # Cambiado a "related" para imágenes
    message["From"] = EMAIL_USER
    message["To"] = recipient
    message["Subject"] = subject

    # Crear parte alternativa para HTML
    alternative_part = MIMEMultipart("alternative")
    message.attach(alternative_part)

    # Agregar el contenido HTML
    html_part = MIMEText(html_content, "html")
    alternative_part.attach(html_part)

    # Adjuntar imagen del logo
    logo_path = Path(__file__).parent.parent / "resources" / "images" / "ClubCiclismo.png"
    if logo_path.exists():
        with open(logo_path, "rb") as img_file:
            logo_img = MIMEImage(img_file.read())
            logo_img.add_header("Content-ID", "<club_logo>")
            logo_img.add_header("Content-Disposition", "inline", filename="ClubCiclismo.png")
            message.attach(logo_img)
    else:
        print(f"⚠️  Logo no encontrado en: {logo_path}")

    # Conectar al servidor de Gmail
    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
        server.login(EMAIL_USER, EMAIL_PASS)
        server.sendmail(EMAIL_USER, recipient, message.as_string())


# Función para enviar notificación de nuevo auspiciante
def send_simple_sponsor_email(sponsor_data: dict):
    """Envía un email simple con los datos del formulario"""
    try:
        # Crear el mensaje de texto plano
        subject = f"🚴 Nuevo Auspiciante: {sponsor_data['company_name']}"
        
        body = f"""
        NUEVA SOLICITUD DE AUSPICIO
        
        🏢 EMPRESA: {sponsor_data['company_name']}
        
        👤 CONTACTO:
        - Nombre: {sponsor_data['contact_name']}
        - Cargo: {sponsor_data['position']}
        - Email: {sponsor_data['contact_email']}
        - Teléfono: {sponsor_data['contact_phone']}
        
        📝 PROPUESTA:
        {sponsor_data['proposal_description']}
        
        ---
        📅 Recibido: {datetime.now().strftime('%d/%m/%Y %H:%M')}
        🏛️ Club Ciclismo EPN
        """
        
        # Enviar email simple
        send_email(
            recipient=ADMIN_EMAIL,
            subject=subject,
            body=body,
            is_html=False  # Texto plano
        )
        
        print(f"✅ Auspiciante {sponsor_data['company_name']} notificado")
        
    except Exception as e:
        print(f"❌ Error enviando email de auspiciante: {e}")