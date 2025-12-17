import io
import os
# --- CORRECCIÓN DE IMPORTACIONES ---
import cloudinary
import cloudinary.uploader
# -----------------------------------
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from datetime import datetime

# --- CONFIGURACIÓN DE CLOUDINARY (PON TUS DATOS REALES AQUÍ) ---
cloudinary.config( 
  cloud_name = "doafnpye7",      # COPIA ESTO DE TU DASHBOARD DE CLOUDINARY
  api_key = "441384165162257",          # COPIA ESTO DE TU DASHBOARD
  api_secret = "SgCEJFmAYx2vrzhjr1Im-jZScIY",      # COPIA ESTO DE TU DASHBOARD
  secure = True
)

def generar_factura_pdf(orden):
    """
    Genera el PDF en memoria y lo sube a Cloudinary.
    Retorna la URL pública del PDF.
    """
    try:
        # Creamos un buffer en memoria (RAM)
        buffer = io.BytesIO()
        
        c = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        # --- DIBUJO DEL PDF ---
        c.setFont("Helvetica-Bold", 20)
        c.drawString(50, height - 50, "CLUB DE CICLISMO EPN")
        
        c.setFont("Helvetica", 10)
        c.drawString(50, height - 70, "Orden de Compra Web")
        
        # Datos Cliente
        c.line(50, height - 90, width - 50, height - 90)
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, height - 120, f"Orden #: {orden.id_sale}")
        c.drawString(50, height - 140, f"Cliente: {orden.customer_name}")
        c.drawString(50, height - 160, f"Teléfono: {orden.customer_phone}")
        
        # Items
        y = height - 200
        c.drawString(50, y, "DETALLE:")
        y -= 20
        c.setFont("Helvetica", 10)
        
        for item in orden.items:
            # Recuperar nombre (Manejo de error si no existe resource)
            nombre = item.resource.nombre if item.resource else "Producto"
            texto = f"{item.quantity} x {nombre} - ${item.unit_price}"
            c.drawString(60, y, texto)
            y -= 15
            
        # Total
        c.setFont("Helvetica-Bold", 14)
        c.drawString(50, y - 30, f"TOTAL: ${orden.total_amount:.2f}")

        c.showPage()
        c.save()
        
        # Reiniciar puntero del buffer
        buffer.seek(0)
        
        # --- SUBIDA A CLOUDINARY ---
        print("Subiendo a Cloudinary...") # Log para depurar
        upload_result = cloudinary.uploader.upload(
            buffer, 
            resource_type="auto", 
            public_id=f"facturas/Orden_{orden.id_sale}_{datetime.now().timestamp()}",
            access_mode="public",
            format="pdf"
        )
        
        url_pdf = upload_result['secure_url']
        print(f"PDF Subido: {url_pdf}")
        return url_pdf

    except Exception as e:
        print(f"❌ Error CRÍTICO generando/subiendo PDF: {e}")
        return None