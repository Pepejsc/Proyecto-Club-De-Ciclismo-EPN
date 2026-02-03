import json
import os
import shutil
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks, UploadFile, File, Form
from sqlalchemy.orm import Session, joinedload
from app.db.database import get_db
from PIL import Image
from io import BytesIO

from app.models.domain.recurso import InventarioComercial
from app.models.domain.venta import SaleOrder, SaleOrderItem
from app.models.schema.venta import SaleOrderRead 
from app.services.invoice_generator import generar_factura_pdf
from app.services.notification_service import notificar_intencion_compra, notificar_venta_exitosa

router = APIRouter()

UPLOAD_DIR_COMPROBANTES = "uploads/comprobantes"
os.makedirs(UPLOAD_DIR_COMPROBANTES, exist_ok=True)

def save_upload_file(upload_file: UploadFile) -> tuple:
    """
    Guarda el comprobante y retorna (URL relativa, RUTA física absoluta).
    """
    try:
        filename = f"{uuid.uuid4()}_{upload_file.filename}"
        # Ruta física para guardar
        file_path = os.path.join(UPLOAD_DIR_COMPROBANTES, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
            
        # URL web y Ruta absoluta para Telegram
        return f"/uploads/comprobantes/{filename}", os.path.abspath(file_path)
    except Exception as e:
        print(f"Error guardando: {e}")
        return None, None

@router.post("/checkout", status_code=status.HTTP_201_CREATED)
async def procesar_orden(
    customer_name: str = Form(...),
    customer_dni: str = Form(...),
    customer_email: Optional[str] = Form(None),
    customer_phone: str = Form(...),
    total: float = Form(...),
    items_json: str = Form(...), 
    payment_proof: UploadFile = File(...), 
    background_tasks: BackgroundTasks = BackgroundTasks(),
    db: Session = Depends(get_db)
):
    try:
        # Validar Imagen
        file_content = await payment_proof.read()
        if len(file_content) == 0: raise HTTPException(400, "Archivo vacío")
        try:
            image = Image.open(BytesIO(file_content))
            image.verify()
        except:
            raise HTTPException(400, "No es una imagen válida")
        await payment_proof.seek(0)

        # Parsear Items
        try:
            items_list = json.loads(items_json)
        except json.JSONDecodeError:
            raise HTTPException(400, "JSON items inválido")

        # Guardar Comprobante (Obtenemos URL y Ruta Física)
        proof_url, proof_path = save_upload_file(payment_proof)
        if not proof_url: raise HTTPException(500, "Error guardando archivo")

        # Crear Orden
        new_order = SaleOrder(
            customer_name=customer_name,
            customer_phone=customer_phone,
            total_amount=total,
            status="PENDING",
            payment_proof_url=proof_url 
        )
        db.add(new_order)
        db.flush() 

        # Procesar Items
        for item in items_list:
            id_recurso = item.get('id_recurso')
            quantity = item.get('quantity')
            precio = item.get('precio_venta')
            talla = item.get('talla', "Única")

            producto_db = db.query(InventarioComercial).filter(
                InventarioComercial.id_recurso == id_recurso
            ).first()

            if not producto_db: raise HTTPException(404, f"Prod {id_recurso} no existe")
            if producto_db.stock_actual < quantity: raise HTTPException(400, "Stock insuficiente")

            new_item = SaleOrderItem(
                sale_id=new_order.id_sale,
                resource_id=id_recurso,
                quantity=quantity,
                unit_price=precio,
                subtotal=quantity * precio,
                size=talla 
            )
            db.add(new_item)

        db.commit()
        db.refresh(new_order)
        
        # Datos para notificación (Incluyendo ruta física para la foto)
        datos_venta = {
            "id_sale": new_order.id_sale,
            "customer_name": customer_name,
            "customer_dni": customer_dni,
            "customer_phone": customer_phone,
            "total_amount": total,
            "items": items_list,
            "payment_proof_path": proof_path  # <--- CLAVE PARA LA FOTO EN TELEGRAM
        }
        
        background_tasks.add_task(notificar_intencion_compra, datos_venta)
        
        return {"order_id": new_order.id_sale, "message": "Orden creada"}

    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(500, str(e))

@router.get("/", response_model=List[SaleOrderRead])
def listar_ordenes(status: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(SaleOrder).options(joinedload(SaleOrder.items).joinedload(SaleOrderItem.resource))
    if status and status != 'ALL':
        query = query.filter(SaleOrder.status == status)
    ordenes = query.order_by(SaleOrder.id_sale.desc()).all()
    for orden in ordenes:
        for item in orden.items:
            item.product_name = item.resource.nombre if item.resource else "Eliminado"
    return ordenes

@router.put("/{id_sale}/confirmar")
def confirmar_pago(id_sale: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    orden = db.query(SaleOrder).options(joinedload(SaleOrder.items).joinedload(SaleOrderItem.resource)).filter(SaleOrder.id_sale == id_sale).first()
    
    if not orden: raise HTTPException(404, "Orden no encontrada")
    if orden.status == 'PAID': raise HTTPException(400, "Ya pagada")

    # Descontar stock
    for item in orden.items:
        recurso = db.query(InventarioComercial).filter(InventarioComercial.id_recurso == item.resource_id).first()
        if recurso and recurso.stock_actual >= item.quantity:
            recurso.stock_actual -= item.quantity
        else:
            raise HTTPException(400, f"Stock insuficiente: {recurso.nombre if recurso else 'Item'}")
        
    orden.status = 'PAID'
    db.commit()

    # Generar PDF (Puede demorar 1-2 seg, pero es necesario para retornar la URL)
    full_pdf_url = None
    try:
        full_pdf_url = generar_factura_pdf(orden)
    except Exception as e:
        print(f"Error PDF: {e}")

    # Notificar en segundo plano (No bloquea más tiempo)
    venta_data = {"id_sale": orden.id_sale, "invoice_url": full_pdf_url}
    background_tasks.add_task(notificar_venta_exitosa, venta_data)
    
    return {"message": "Orden autorizada", "invoice_url": full_pdf_url}

@router.put("/{id_sale}/cancelar")
def cancelar_orden(id_sale: int, db: Session = Depends(get_db)):
    orden = db.query(SaleOrder).options(joinedload(SaleOrder.items)).filter(SaleOrder.id_sale == id_sale).first()
    if not orden: raise HTTPException(404, "Orden no encontrada")
    if orden.status == 'CANCELLED': return {"message": "Ya cancelada"}
    
    if orden.status == 'PAID':
        for item in orden.items:
            recurso = db.query(InventarioComercial).filter(InventarioComercial.id_recurso == item.resource_id).first()
            if recurso: recurso.stock_actual += item.quantity

    orden.status = 'CANCELLED'
    db.commit()
    return {"message": "Orden cancelada"}