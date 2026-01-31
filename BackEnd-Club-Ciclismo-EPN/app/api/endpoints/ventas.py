import json
import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from app.db.database import get_db

# Importaciones para validación de imágenes
from PIL import Image, UnidentifiedImageError
from io import BytesIO

from app.models.domain.recurso import InventarioComercial
from app.models.domain.venta import SaleOrder, SaleOrderItem
from app.models.schema.venta import SaleOrderRead 
from app.services.invoice_generator import generar_factura_pdf
from app.services.notification_service import notificar_intencion_compra, notificar_venta_exitosa

router = APIRouter()

# Configuración de carpeta para comprobantes
UPLOAD_DIR_COMPROBANTES = "uploads/comprobantes"
os.makedirs(UPLOAD_DIR_COMPROBANTES, exist_ok=True)

def save_upload_file(upload_file: UploadFile) -> str:
    """Guarda el comprobante y retorna la ruta relativa"""
    try:
        filename = f"{uuid.uuid4()}_{upload_file.filename}"
        file_path = os.path.join(UPLOAD_DIR_COMPROBANTES, filename)
        
        # Guardamos el archivo físico
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
            
        return f"/uploads/comprobantes/{filename}"
    except Exception as e:
        print(f"Error guardando comprobante: {e}")
        return None

@router.post("/checkout", status_code=status.HTTP_201_CREATED)
async def procesar_orden(
    # Recibimos datos como Form Data
    customer_name: str = Form(...),
    customer_phone: str = Form(...),
    total: float = Form(...),
    items_json: str = Form(...), # Recibimos la lista de items como string JSON
    payment_proof: UploadFile = File(...), # El archivo es obligatorio
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    try:
        # =====================================================================
        # 🛡️ VALIDACIÓN ESTRICTA DE IMAGEN (POR CONTENIDO)
        # =====================================================================
        
        # 1. Leemos el archivo completo en memoria RAM
        file_content = await payment_proof.read()

        # 2. Validar que no esté vacío
        if len(file_content) == 0:
             raise HTTPException(status_code=400, detail="El archivo subido está vacío.")

        # 3. Preguntamos a Pillow: "¿Esto es una imagen?"
        try:
            image = Image.open(BytesIO(file_content))
            image.verify()  # Si esto no da error, ES una imagen válida con estructura correcta

            # Detectamos el formato real (PNG, JPEG, GIF, etc.)
            real_format = image.format.lower()

            # CORRECCIÓN AUTOMÁTICA DE NOMBRE:
            # Si el archivo no tiene extensión o tiene una incorrecta, podemos corregirla
            # o simplemente asegurar que tenga una si le falta.
            if "." not in payment_proof.filename:
                payment_proof.filename = f"{payment_proof.filename}.{real_format}"

        except Exception:
            # Si Pillow falla, significa que son bytes basura, virus, texto o un PDF renombrado.
            raise HTTPException(
                status_code=400,
                detail="El archivo subido no es una imagen válida (debe ser JPG, PNG, etc). Por favor verifica el archivo."
            )

        # 4. REBOBINAR EL ARCHIVO (Muy Importante)
        # Como ya lo leímos para validarlo, el puntero está al final.
        # Debemos devolverlo al principio para que save_upload_file pueda leerlo.
        await payment_proof.seek(0)
        
        # =====================================================================
        # FIN VALIDACIÓN
        # =====================================================================

        # 5. Parsear los items que vienen como texto JSON
        try:
            items_list = json.loads(items_json)
        except json.JSONDecodeError:
            raise HTTPException(status_code=400, detail="Formato de items inválido")

        # 6. Guardar el comprobante (Ahora seguro)
        proof_url = save_upload_file(payment_proof)
        if not proof_url:
            raise HTTPException(status_code=500, detail="Error al guardar el comprobante")

        # 7. Crear la Cabecera de la Orden
        new_order = SaleOrder(
            customer_name=customer_name,
            customer_phone=customer_phone,
            total_amount=total,
            status="PENDING",
            payment_proof_url=proof_url 
        )
        db.add(new_order)
        db.flush() 

        # 8. Procesar cada item
        for item in items_list:
            id_recurso = item.get('id_recurso')
            quantity = item.get('quantity')
            precio = item.get('precio_venta')
            nombre = item.get('nombre')
            talla = item.get('talla', "Única")

            # Buscar producto
            producto_db = db.query(InventarioComercial).filter(
                InventarioComercial.id_recurso == id_recurso
            ).first()

            if not producto_db:
                raise HTTPException(status_code=404, detail=f"Producto {nombre} no encontrado")

            if producto_db.stock_actual < quantity:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Stock insuficiente para {nombre}. Disponibles: {producto_db.stock_actual}"
                )

            # Crear Detalle
            new_item = SaleOrderItem(
                sale_id=new_order.id_sale,
                resource_id=id_recurso,
                quantity=quantity,
                unit_price=precio,
                subtotal=quantity * precio,
                size=talla 
            )
            db.add(new_item)

        # 9. Confirmar todo
        db.commit()
        db.refresh(new_order)
        
        # Notificar
        background_tasks.add_task(notificar_intencion_compra, new_order)
        
        return {
            "order_id": new_order.id_sale,
            "message": "Orden creada. Comprobante recibido."
        }

    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        print(f"Error procesando orden: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


@router.get("/", response_model=List[SaleOrderRead])
def listar_ordenes(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(SaleOrder).options(joinedload(SaleOrder.items).joinedload(SaleOrderItem.resource))
    
    if status and status != 'ALL':
        query = query.filter(SaleOrder.status == status)
        
    ordenes = query.order_by(SaleOrder.id_sale.desc()).all()

    for orden in ordenes:
        for item in orden.items:
            if item.resource:
                item.product_name = item.resource.nombre
            else:
                item.product_name = "Producto eliminado"

    return ordenes

@router.put("/{id_sale}/confirmar")
def confirmar_pago(
    id_sale: int, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):
    orden = db.query(SaleOrder).options(
        joinedload(SaleOrder.items).joinedload(SaleOrderItem.resource)
    ).filter(SaleOrder.id_sale == id_sale).first()
    
    if not orden: raise HTTPException(status_code=404, detail="Orden no encontrada")
    if orden.status == 'PAID': raise HTTPException(status_code=400, detail="Ya pagada")

    for item in orden.items:
        recurso = db.query(InventarioComercial).filter(InventarioComercial.id_recurso == item.resource_id).first()
        if not recurso:
            raise HTTPException(status_code=400, detail=f"Producto {item.resource_id} ya no existe")
        
        if recurso.stock_actual < item.quantity:
             raise HTTPException(status_code=400, detail=f"Stock insuficiente para {recurso.nombre}. Quedan {recurso.stock_actual}")

        recurso.stock_actual -= item.quantity
        
    orden.status = 'PAID'
    db.commit()

    full_pdf_url = None
    try:
        full_pdf_url = generar_factura_pdf(orden)
    except Exception as e:
        print(f"Error PDF: {e}")

    background_tasks.add_task(notificar_venta_exitosa, orden, full_pdf_url)
    return {
        "message": f"Orden #{id_sale} autorizada y stock descontado",
        "invoice_url": full_pdf_url 
    }

@router.put("/{id_sale}/cancelar")
def cancelar_orden(id_sale: int, db: Session = Depends(get_db)):
    orden = db.query(SaleOrder).options(joinedload(SaleOrder.items)).filter(SaleOrder.id_sale == id_sale).first()
    
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    
    if orden.status == 'CANCELLED':
        return {"message": "La orden ya estaba cancelada"}
    
    if orden.status == 'PAID':
        # Restaurar stock
        for item in orden.items:
            recurso = db.query(InventarioComercial).filter(InventarioComercial.id_recurso == item.resource_id).first()
            if recurso:
                recurso.stock_actual += item.quantity

    orden.status = 'CANCELLED'
    db.commit()
    
    return {"message": f"Orden #{id_sale} cancelada exitosamente"}