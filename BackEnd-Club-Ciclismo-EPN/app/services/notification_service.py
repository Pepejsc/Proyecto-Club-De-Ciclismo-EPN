import requests

# --- TUS CREDENCIALES DE TELEGRAM ---
TELEGRAM_TOKEN = "8325426543:AAHBkdFMehOdVaoBeMywA0H4vg1qEsn_Dn8"
ADMIN_CHAT_ID = "1360583240"

def notificar_admin_telegram(orden, pdf_url):
    print(f"Enviando alerta a Telegram ({ADMIN_CHAT_ID})...")
    
    try:
        # Construimos el mensaje con formato HTML
        mensaje = f"⚠️ <b>AUTORIZACIÓN DE VENTA REQUERIDA</b> ⚠️\n\n"
        mensaje += f"🆔 <b>Orden:</b> #{orden.id_sale}\n"
        mensaje += f"👤 <b>Cliente:</b> {orden.customer_name}\n"
        mensaje += f"📞 <b>Telf:</b> {orden.customer_phone}\n"
        mensaje += f"💰 <b>Total:</b> ${orden.total_amount:.2f}\n\n"
        mensaje += f"Por favor, revisa y autoriza la venta en el sistema administrativo."
        
        # Botones Inline (Link a la factura)
        reply_markup = {}
        if pdf_url:
            reply_markup = {
                "inline_keyboard": [[
                    {"text": "📄 Ver Factura Final", "url": pdf_url}
                ]]
            }
        else:
            mensaje += "⚠️ No se pudo generar la factura PDF."
        
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendMessage"
        
        payload = {
            "chat_id": ADMIN_CHAT_ID,
            "text": mensaje,
            "parse_mode": "HTML",
            "reply_markup": reply_markup
        }
        
        response = requests.post(url, json=payload)

        if response.status_code == 200:
            print("✅ Notificación enviada a Telegram exitosamente.")
            return True
        else:
            print(f"⚠️ Error Telegram: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error enviando notificación: {e}")
        return False

def enviar_telegram(mensaje, botones=None):
    """Función auxiliar para enviar mensajes a Telegram"""
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
        print(f"❌ Error Telegram: {e}")

# 1. NOTIFICACIÓN INICIAL (Cuando el usuario da clic en comprar)
def notificar_intencion_compra(orden):
    mensaje = f"🔔 <b>NUEVA SOLICITUD DE PEDIDO</b>\n\n"
    mensaje += f"🆔 <b>Orden:</b> #{orden.id_sale}\n"
    mensaje += f"👤 <b>Cliente:</b> {orden.customer_name}\n"
    mensaje += f"📞 <b>Telf:</b> {orden.customer_phone}\n"
    mensaje += f"💰 <b>Total a Pagar:</b> ${orden.total_amount:.2f}\n\n"
    mensaje += f"⚠️ <i>Estado: PENDIENTE. Verifica el pago y autoriza en el panel para generar la factura.</i>"
    
    enviar_telegram(mensaje)

# 2. NOTIFICACIÓN DE ÉXITO (Cuando el Admin confirma el pago)
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