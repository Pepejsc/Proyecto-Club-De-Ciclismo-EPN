import requests
import os # <--- NECESARIO PARA VERIFICAR RUTAS DE ARCHIVOS

# --- TUS CREDENCIALES DE TELEGRAM ---
TELEGRAM_TOKEN = "8325426543:AAHBkdFMehOdVaoBeMywA0H4vg1qEsn_Dn8"
ADMIN_CHAT_ID = "1360583240"

# --- FUNCIÓN PARA TEXTO SIMPLE (MANTENER) ---
def enviar_telegram(mensaje, botones=None):
    """Función auxiliar para enviar mensajes de SOLO TEXTO"""
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
        payload = {
            "chat_id": ADMIN_CHAT_ID,
            "text": mensaje,
            "parse_mode": "HTML",
            "reply_markup": botones or {}
        }
        requests.post(url, json=payload)
    except Exception as e:
        print(f"❌ Error Telegram (Texto): {e}")

# --- NUEVA FUNCIÓN PARA ENVIAR FOTO ---
def enviar_foto_telegram(mensaje, ruta_imagen_relativa):
    """Función para enviar FOTO con texto (Caption)"""
    try:
        # 1. Limpiar la ruta: quitamos el primer '/' si existe para que sea ruta relativa
        # Ej: "/uploads/..." -> "uploads/..."
        clean_path = ruta_imagen_relativa.lstrip('/')
        
        # 2. Verificar que el archivo exista en el servidor
        if not os.path.exists(clean_path):
            print(f"⚠️ Archivo no encontrado en disco: {clean_path}, enviando solo texto.")
            enviar_telegram(mensaje) # Fallback a texto
            return

        # 3. Preparar el envío
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendPhoto"
        
        # Abrimos el archivo en modo binario de lectura ('rb')
        with open(clean_path, 'rb') as photo_file:
            files = {'photo': photo_file}
            data = {
                'chat_id': ADMIN_CHAT_ID,
                'caption': mensaje, # En sendPhoto, el texto va en 'caption'
                'parse_mode': 'HTML'
            }
            response = requests.post(url, files=files, data=data)
            
            if response.status_code != 200:
                print(f"⚠️ Error Telegram API: {response.text}")

    except Exception as e:
        print(f"❌ Error Telegram (Foto): {e}")
        # Si falla la foto, intentamos enviar al menos el texto
        enviar_telegram(mensaje)

# 1. NOTIFICACIÓN INICIAL (MODIFICADA PARA ENVIAR FOTO)
def notificar_intencion_compra(orden):
    mensaje = f"🔔 <b>NUEVA SOLICITUD DE PEDIDO</b>\n\n"
    mensaje += f"🆔 <b>Orden:</b> #{orden.id_sale}\n"
    mensaje += f"👤 <b>Cliente:</b> {orden.customer_name}\n"
    mensaje += f"📞 <b>Telf:</b> {orden.customer_phone}\n"
    mensaje += f"💰 <b>Total a Pagar:</b> ${orden.total_amount:.2f}\n\n"
    mensaje += f"⚠️ <i>Estado: PENDIENTE. Verifica el comprobante adjunto y autoriza en el panel.</i>"
    
    # Verificamos si hay comprobante para enviar
    if orden.payment_proof_url:
        print(f"📸 Enviando comprobante a Telegram: {orden.payment_proof_url}")
        enviar_foto_telegram(mensaje, orden.payment_proof_url)
    else:
        # Si no hay foto, enviamos texto normal
        enviar_telegram(mensaje)

# 2. NOTIFICACIÓN DE ÉXITO (MANTENER IGUAL)
def notificar_venta_exitosa(orden, pdf_url):
    mensaje = f"✅ <b>VENTA AUTORIZADA Y PROCESADA</b>\n\n"
    mensaje += f"🆔 <b>Orden:</b> #{orden.id_sale}\n"
    mensaje += f"📦 <b>Stock:</b> Descontado del inventario\n"
    mensaje += f"📄 <b>Factura:</b> Generada y guardada en nube\n"
    
    botones = {}
    if pdf_url:
        mensaje += f"\n🔗 <a href='{pdf_url}'>Ver Respaldo PDF</a>"
        botones = {
            "inline_keyboard": [[{"text": "📂 Abrir Factura PDF", "url": pdf_url}]]
        }
    
    enviar_telegram(mensaje, botones)