import smtplib
import requests
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

TELEGRAM_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
TELEGRAM_CHAT_ID = os.getenv("TELEGRAM_CHAT_ID")

# ==========================================
# 1. UTILIDADES GENERALES DE CORREO
# ==========================================
def render_template(template_name: str, context: dict) -> str:
    template_path = Path(__file__).parent.parent / "resources" / "templates" / template_name
    if not template_path.exists():
        return f"<html><body><h1>Notificación</h1><p>{str(context)}</p></body></html>"
    template_content = template_path.read_text(encoding="utf-8")
    template = Template(template_content)
    return template.render(context)

def send_email(recipient: str, subject: str, context: dict, template: str, attachment_file=None, attachment_name=None):
    try:
        html_content = render_template(template, context)
        message = MIMEMultipart("mixed") 
        message["From"] = f"Club Ciclismo EPN <{EMAIL_USER}>"
        message["To"] = recipient
        message["Subject"] = subject

        msg_related = MIMEMultipart("related")
        message.attach(msg_related)
        msg_alternative = MIMEMultipart("alternative")
        msg_related.attach(msg_alternative)
        msg_alternative.attach(MIMEText(html_content, "html"))

        logo_path = Path(__file__).parent.parent / "resources" / "images" / "ClubCiclismo.png"
        if logo_path.exists():
            with open(logo_path, "rb") as img_file:
                logo_img = MIMEImage(img_file.read())
                logo_img.add_header("Content-ID", "<club_logo>") 
                logo_img.add_header("Content-Disposition", "inline", filename="ClubCiclismo.png")
                msg_related.attach(logo_img)
        
        if attachment_file and attachment_name:
            file_data = attachment_file.read() if hasattr(attachment_file, 'read') else attachment_file
            part = MIMEApplication(file_data, Name=attachment_name)
            part['Content-Disposition'] = f'attachment; filename="{attachment_name}"'
            message.attach(part)

        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(EMAIL_USER, EMAIL_PASS)
            server.sendmail(EMAIL_USER, recipient, message.as_string())
        return True
    except Exception as e:
        print(f"❌ Error correo: {e}")
        return False

# ==========================================
# 2. FUNCIONES DE AUSPICIANTES
# ==========================================
def send_sponsor_notification(sponsor_data: dict, file_obj=None, filename=None):
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
    send_email(ADMIN_EMAIL, subject, context, "new_sponsor.html", attachment_file=file_obj, attachment_name=filename)

# ==========================================
# 3. UTILIDADES TELEGRAM (TEXTO E IMAGEN)
# ==========================================

def enviar_telegram_texto(mensaje: str):
    """Envía solo texto a Telegram"""
    if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID: return
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
        data = {"chat_id": TELEGRAM_CHAT_ID, "text": mensaje, "parse_mode": "HTML"}
        requests.post(url, data=data)
    except Exception as e:
        print(f"❌ Error Telegram Texto: {e}")

def enviar_telegram_foto(mensaje: str, ruta_imagen: str):
    """Envía FOTO + TEXTO a Telegram"""
    if not TELEGRAM_TOKEN or not TELEGRAM_CHAT_ID: return
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendPhoto"
        
        # Preparamos los datos
        data = {"chat_id": TELEGRAM_CHAT_ID, "caption": mensaje, "parse_mode": "HTML"}
        
        # Abrimos el archivo de la imagen
        with open(ruta_imagen, "rb") as image_file:
            files = {"photo": image_file}
            requests.post(url, data=data, files=files)
            
        print("✅ Foto enviada a Telegram")
    except Exception as e:
        print(f"❌ Error Telegram Foto: {e}")
        # Si falla la foto, intentamos mandar al menos el texto
        enviar_telegram_texto(mensaje + "\n\n(⚠️ No se pudo cargar la imagen)")

# ==========================================
# 4. NOTIFICACIONES DE VENTAS
# ==========================================

def notificar_intencion_compra(venta_data: dict):
    """
    Notifica NUEVO PEDIDO a Telegram INCLUYENDO LA FOTO DEL COMPROBANTE.
    """
    try:
        orden_id = venta_data.get('id_sale')
        nombre = venta_data.get('customer_name')
        cedula = venta_data.get('customer_dni', 'S/N')
        telefono = venta_data.get('customer_phone')
        total = venta_data.get('total_amount')
        ruta_comprobante = venta_data.get('payment_proof_path') # <--- Ruta física del archivo

        mensaje = (
            f"🔔 <b>NUEVA SOLICITUD DE PEDIDO</b>\n\n"
            f"🆔 <b>Orden:</b> #{orden_id}\n"
            f"👤 <b>Cliente:</b> {nombre} (CI: {cedula})\n"
            f"📞 <b>Telf:</b> {telefono}\n"
            f"💰 <b>Total:</b> ${float(total):.2f}\n\n"
            f"⚠️ <i>Revisa la imagen adjunta para validar el pago.</i>"
            f"⚠️ <i>Autoriza la compra de este producto en el panel de administración.</i>"
        )
        
        # Si tenemos la ruta del archivo y existe, mandamos foto
        if ruta_comprobante and os.path.exists(ruta_comprobante):
            enviar_telegram_foto(mensaje, ruta_comprobante)
        else:
            enviar_telegram_texto(mensaje)
            
    except Exception as e:
        print(f"Error notificación compra: {e}")

def notificar_venta_exitosa(venta_data: dict):
    """Notifica VENTA APROBADA (Texto con enlace)"""
    try:
        id_sale = venta_data.get('id_sale')
        pdf_url = venta_data.get('invoice_url', '#')
        
        mensaje = (
            f"✅ <b>VENTA AUTORIZADA</b>\n\n"
            f"🆔 <b>Orden:</b> #{id_sale}\n"
            f"📦 <b>Stock:</b> Actualizado\n"
            f"📄 <b>Factura:</b> Generada\n\n"
            f"🔗 <a href='{pdf_url}'>Abrir PDF de Respaldo</a>"
        )
        enviar_telegram_texto(mensaje)
    except Exception as e:
        print(f"Error notificación éxito: {e}")