import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.image import MIMEImage
from email.mime.application import MIMEApplication
from pathlib import Path
from dotenv import load_dotenv
import os
from jinja2 import Template
from datetime import datetime

# Cargar variables de entorno
load_dotenv()

EMAIL_USER = os.getenv("MAIL_USERNAME")
EMAIL_PASS = os.getenv("MAIL_PASSWORD")
ADMIN_EMAIL = os.getenv("MAIL_ADMIN")

# ==========================================
# 1. UTILIDADES GENERALES DE CORREO
# ==========================================

def render_template(template_name: str, context: dict) -> str:
    """Renderiza una plantilla HTML con Jinja2."""
    template_path = Path(__file__).parent.parent / "resources" / "templates" / template_name
    
    # Si no existe la plantilla, retornamos un HTML básico de error o genérico
    if not template_path.exists():
        print(f"⚠️ Plantilla {template_name} no encontrada. Usando fallback.")
        return f"<html><body><h1>Notificación</h1><p>{str(context)}</p></body></html>"
        
    template_content = template_path.read_text(encoding="utf-8")
    template = Template(template_content)
    return template.render(context)

def send_email(recipient: str, subject: str, context: dict, template: str, attachment_file=None, attachment_name=None):
    """
    Envía un correo electrónico HTML formal.
    Soporta imágenes inline (logo) y archivos adjuntos.
    """
    try:
        # Renderizar la plantilla HTML
        html_content = render_template(template, context)

        # Configurar el mensaje raíz
        message = MIMEMultipart("mixed") 
        message["From"] = f"Club Ciclismo EPN <{EMAIL_USER}>"
        message["To"] = recipient
        message["Subject"] = subject

        # Parte 'related' para HTML e imágenes embebidas
        msg_related = MIMEMultipart("related")
        message.attach(msg_related)

        # Parte 'alternative' para texto plano vs HTML
        msg_alternative = MIMEMultipart("alternative")
        msg_related.attach(msg_alternative)

        # Agregar el contenido HTML
        html_part = MIMEText(html_content, "html")
        msg_alternative.attach(html_part)

        # --- 1. ADJUNTAR LOGO (INLINE) ---
        logo_path = Path(__file__).parent.parent / "resources" / "images" / "ClubCiclismo.png"
        if logo_path.exists():
            with open(logo_path, "rb") as img_file:
                logo_img = MIMEImage(img_file.read())
                logo_img.add_header("Content-ID", "<club_logo>") 
                logo_img.add_header("Content-Disposition", "inline", filename="ClubCiclismo.png")
                msg_related.attach(logo_img)
        
        # --- 2. ADJUNTAR ARCHIVO (OPCIONAL) ---
        if attachment_file and attachment_name:
            file_data = attachment_file.read() if hasattr(attachment_file, 'read') else attachment_file
            part = MIMEApplication(file_data, Name=attachment_name)
            part['Content-Disposition'] = f'attachment; filename="{attachment_name}"'
            message.attach(part)

        # Conectar al servidor SMTP (Gmail)
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL_USER, EMAIL_PASS)
            server.sendmail(EMAIL_USER, recipient, message.as_string())
            
        print(f"✅ Correo enviado exitosamente a {recipient}")
        return True

    except Exception as e:
        print(f"❌ Error crítico enviando correo a {recipient}: {e}")
        return False

# ==========================================
# 2. FUNCIONES DE AUSPICIANTES (NUEVAS)
# ==========================================

def send_sponsor_notification(sponsor_data: dict, file_obj=None, filename=None):
    """
    Notifica al admin sobre un nuevo auspiciante.
    """
    subject = f"Nueva Propuesta de Auspicio: {sponsor_data['company_name']}"
    
    context = {
        "company_name": sponsor_data['company_name'],
        "contact_name": sponsor_data['contact_name'],
        "position": sponsor_data['position'],
        "contact_email": sponsor_data['contact_email'],
        "contact_phone": sponsor_data['contact_phone'],
        "proposal_description": sponsor_data['proposal_description'],
        "current_year": datetime.now().year
    }

    # Usa la nueva plantilla 'new_sponsor.html'
    send_email(
        recipient=ADMIN_EMAIL,
        subject=subject,
        context=context,
        template="new_sponsor.html", 
        attachment_file=file_obj,
        attachment_name=filename
    )

# ==========================================
# 3. FUNCIONES DE VENTAS (RESTAURADAS)
# ==========================================

def notificar_intencion_compra(venta_data: dict):
    """
    Envía correo al cliente con instrucciones de pago (Transferencia).
    """
    try:
        subject = f"Confirmación de Pedido #{venta_data.get('id_sale', '???')} - Pendiente de Pago"
        recipient = venta_data.get('customer_email')
        
        if not recipient:
            print("⚠️ No hay email de cliente para notificar intención de compra.")
            return

        # Contexto para la plantilla (asumiendo que tienes una plantilla de ventas o usamos una genérica)
        # Si no tienes 'sales_pending.html', puedes crearla o el sistema usará el fallback.
        context = {
            "nombre_cliente": venta_data.get('customer_name'),
            "id_orden": venta_data.get('id_sale'),
            "total": venta_data.get('total_amount'),
            "items": venta_data.get('items', []),
            "current_year": datetime.now().year
        }
        
        # Nota: Asegúrate de tener 'email_template.html' o crea 'sales_pending.html'
        # Por ahora usaremos 'email_template.html' si existía antes, o el fallback.
        send_email(recipient, subject, context, "email_template.html")
        
        # Opcional: Notificar también al admin que hay una nueva venta pendiente
        send_email(ADMIN_EMAIL, f"Nueva Venta Pendiente #{venta_data.get('id_sale')}", context, "email_template.html")

    except Exception as e:
        print(f"❌ Error en notificar_intencion_compra: {e}")


def notificar_venta_exitosa(venta_data: dict):
    """
    Envía correo al cliente confirmando el pago y enviando factura (link).
    """
    try:
        subject = f"¡Pago Aprobado! Orden #{venta_data.get('id_sale')}"
        recipient = venta_data.get('customer_email')

        if not recipient:
            return

        context = {
            "nombre_cliente": venta_data.get('customer_name'),
            "id_orden": venta_data.get('id_sale'),
            "mensaje": "Tu pago ha sido verificado correctamente. Adjuntamos el enlace a tu factura.",
            "invoice_url": venta_data.get('invoice_url'),
            "current_year": datetime.now().year
        }

        # Usa 'email_template.html' o crea uno específico 'sales_success.html'
        send_email(recipient, subject, context, "email_template.html")

    except Exception as e:
        print(f"❌ Error en notificar_venta_exitosa: {e}")