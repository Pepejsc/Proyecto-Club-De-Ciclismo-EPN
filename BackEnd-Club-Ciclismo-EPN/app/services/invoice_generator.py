import io
import os
import cloudinary
import cloudinary.uploader
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from datetime import datetime

# --- CONFIGURACIÓN DE CLOUDINARY ---
cloudinary.config( 
  cloud_name = "doafnpye7", 
  api_key = "441384165162257", 
  api_secret = "SgCEJFmAYx2vrzhjr1Im-jZScIY", 
  secure = True
)

# === CORRECCIÓN DE LA RUTA DEL LOGO ===
# 1. Obtenemos la ruta de la carpeta donde está ESTE archivo (services)
current_dir = os.path.dirname(os.path.abspath(__file__))

# 2. Navegamos hacia atrás y entramos a resources/images
# Ajusta '..' según tu estructura real. 
# Si services está en app/services, '..' nos lleva a app/
LOGO_PATH = os.path.join(current_dir, "..", "resources", "images", "ClubCiclismo.png")

def generar_factura_pdf(orden):
    """
    Genera una factura PDF profesional y la sube a Cloudinary.
    """
    try:
        buffer = io.BytesIO()
        c = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter
        
        # --- COLORES ---
        COLOR_CORPORATIVO = colors.HexColor("#10325c") # Azul oscuro EPN
        COLOR_GRIS_CLARO = colors.HexColor("#f0f0f0")
        COLOR_TEXTO = colors.HexColor("#333333")
        
        # ==========================================
        # 1. ENCABEZADO (HEADER)
        # ==========================================
        # Barra superior azul
        c.setFillColor(COLOR_CORPORATIVO)
        c.rect(0, height - 110, width, 110, fill=True, stroke=False)
        
        # --- LOGO (LOCAL) ---
        title_x_pos = 50
        
        # Verificamos si el archivo existe antes de intentar dibujarlo
        if os.path.exists(LOGO_PATH):
            try:
                # Dibujamos el logo: (ruta, x, y, ancho, alto)
                # mask='auto' ayuda con la transparencia del PNG
                c.drawImage(LOGO_PATH, 40, height - 95, width=70, height=70, mask='auto')
                title_x_pos = 130 # Movemos el título a la derecha
            except Exception as e:
                print(f"⚠️ Error pintando el logo: {e}")
        else:
            print(f"⚠️ NO SE ENCONTRÓ EL LOGO EN: {LOGO_PATH}")
            # Placeholder (Círculo blanco) solo si falla
            c.setFillColor(colors.white)
            c.circle(75, height - 60, 30, fill=True, stroke=False)
            title_x_pos = 130 

        # Título / Nombre del Club (Texto Blanco)
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 22)
        c.drawString(title_x_pos, height - 60, "CLUB DE CICLISMO EPN")
        
        c.setFont("Helvetica", 11)
        c.drawString(title_x_pos, height - 80, "Escuela Politécnica Nacional - Quito, Ecuador")

        # Fecha y Número de Orden (Derecha)
        fecha_str = datetime.now().strftime("%d/%m/%Y")
        c.setFont("Helvetica-Bold", 14)
        c.drawRightString(width - 50, height - 50, "FACTURA / RECIBO")
        c.setFont("Helvetica", 12)
        c.drawRightString(width - 50, height - 75, f"N° Orden: #{orden.id_sale}")
        c.drawRightString(width - 50, height - 95, f"Fecha: {fecha_str}")

        # ==========================================
        # 2. DATOS DEL CLIENTE
        # ==========================================
        y_info = height - 160
        c.setFillColor(COLOR_TEXTO)
        
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, y_info, "FACTURAR A:")
        
        c.setFont("Helvetica", 12)
        y_info -= 25
        c.drawString(50, y_info, f"Cliente: {orden.customer_name}")
        y_info -= 20
        c.drawString(50, y_info, f"Teléfono: {orden.customer_phone}")

        # ==========================================
        # 3. TABLA DE PRODUCTOS
        # ==========================================
        y_table = y_info - 50
        col_x = [50, 340, 420, 490] 
        
        c.setFillColor(COLOR_GRIS_CLARO)
        c.rect(40, y_table - 8, width - 80, 30, fill=True, stroke=False)
        
        c.setFillColor(COLOR_CORPORATIVO)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(col_x[0] + 10, y_table + 5, "DESCRIPCIÓN / PRODUCTO")
        c.drawRightString(col_x[1] + 30, y_table + 5, "CANT.")
        c.drawRightString(col_x[2] + 40, y_table + 5, "P. UNIT")
        c.drawRightString(width - 50, y_table + 5, "TOTAL")
        
        y_table -= 10
        
        c.setFillColor(COLOR_TEXTO)
        c.setFont("Helvetica", 10)
        
        total_calculado = 0
        
        for item in orden.items:
            y_table -= 25 
            
            if y_table < 150: 
                c.showPage()
                y_table = height - 100
                c.setFont("Helvetica", 10) 
            
            nombre = item.resource.nombre if item.resource else "Producto Eliminado"
            subtotal_item = item.quantity * item.unit_price
            total_calculado += subtotal_item
            
            nombre_corto = (nombre[:55] + '..') if len(nombre) > 55 else nombre
            c.drawString(col_x[0] + 10, y_table, nombre_corto) 
            
            c.drawRightString(col_x[1] + 30, y_table, str(item.quantity))
            c.drawRightString(col_x[2] + 40, y_table, f"${item.unit_price:.2f}")
            c.drawRightString(width - 50, y_table, f"${subtotal_item:.2f}")
            
            c.setStrokeColor(colors.lightgrey)
            c.line(50, y_table - 10, width - 50, y_table - 10)

        # ==========================================
        # 4. TOTAL PAGADO
        # ==========================================
        y_table -= 50
        
        rect_width = 220 
        rect_x = width - 50 - rect_width
        
        c.setFillColor(COLOR_CORPORATIVO)
        c.rect(rect_x, y_table - 15, rect_width, 35, fill=True, stroke=False)
        
        c.setFillColor(colors.white)
        c.setFont("Helvetica-Bold", 13)
        
        c.drawString(rect_x + 15, y_table - 3, "TOTAL PAGADO:")
        
        c.setFont("Helvetica-Bold", 15)
        c.drawRightString(width - 60, y_table - 3, f"${orden.total_amount:.2f}")

        # ==========================================
        # 5. PIE DE PÁGINA
        # ==========================================
        c.setFillColor(COLOR_TEXTO)
        c.setFont("Helvetica-Oblique", 9)
        c.drawCentredString(width / 2, 70, "¡Gracias por tu compra y por apoyar al deporte!")
        
        c.setFont("Helvetica", 8)
        c.setFillColor(colors.grey)
        c.drawCentredString(width / 2, 50, "Este documento es un comprobante electrónico de venta interna.")
        c.drawCentredString(width / 2, 40, "Consultas: clubciclismo@epn.edu.ec")

        c.save()
        
        # --- SUBIDA ---
        buffer.seek(0)
        print("Subiendo PDF final a Cloudinary...")
        
        upload_result = cloudinary.uploader.upload(
            buffer, 
            resource_type="auto", 
            public_id=f"facturas/Factura_{orden.id_sale}_{int(datetime.now().timestamp())}",
            access_mode="public",
            format="pdf"
        )
        
        url_pdf = upload_result['secure_url']
        return url_pdf

    except Exception as e:
        print(f"❌ Error generando PDF: {e}")
        import traceback
        traceback.print_exc()
        return None