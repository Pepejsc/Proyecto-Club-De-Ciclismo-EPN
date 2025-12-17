from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from sqlalchemy.orm import Session, joinedload
from app.db.database import get_db
from typing import List, Optional
from app.models.schema.venta import SaleOrderRead
from app.models.domain.recurso import InventarioComercial
from app.models.domain.venta import SaleOrder, SaleOrderItem
from app.models.schema.venta import CheckoutSchema, SaleOrderRead
from app.services.invoice_generator import generar_factura_pdf
from app.services.notification_service import notificar_intencion_compra, notificar_venta_exitosa


router = APIRouter()

@router.post("/checkout", status_code=status.HTTP_201_CREATED)
def procesar_orden(
    order_data: CheckoutSchema,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)):

    try:
        # 1. Crear la Cabecera de la Orden
        new_order = SaleOrder(
            customer_name=order_data.customer_name,
            customer_phone=order_data.customer_phone,
            total_amount=order_data.total,
            status="PENDING"
        )
        db.add(new_order)
        db.flush() # Para obtener el ID de la orden antes del commit final

        # 2. Procesar cada item
        for item in order_data.items:
            # Buscar el producto en inventario
            producto_db = db.query(InventarioComercial).filter(
                InventarioComercial.id_recurso == item.id_recurso
            ).first()

            if not producto_db:
                raise HTTPException(status_code=404, detail=f"Producto {item.nombre} no encontrado")

            # Verificar Stock suficiente
            if producto_db.stock_actual < item.quantity:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Stock insuficiente para {item.nombre}. Disponibles: {producto_db.stock_actual}"
                )

            # Crear Detalle de Venta
            new_item = SaleOrderItem(
                sale_id=new_order.id_sale,
                resource_id=item.id_recurso,
                quantity=item.quantity,
                unit_price=item.precio_venta,
                subtotal=item.quantity * item.precio_venta
            )
            db.add(new_item)

        # 3. Confirmar todo
        db.commit()
        db.refresh(new_order)
        background_tasks.add_task(notificar_intencion_compra, new_order)
        return {
            "order_id": new_order.id_sale,
            "message": "Orden creada. En espera de confirmación de pago."}

    except HTTPException as e:
        raise e
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))



@router.get("/", response_model=List[SaleOrderRead])
def listar_ordenes(status: Optional[str] = None, db: Session = Depends(get_db)):
    # Usamos joinedload para traer la orden y sus items
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

        # Aquí sí restamos
        recurso.stock_actual -= item.quantity
    # 2. Actualizamos estado
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
    
    # Si ya estaba cancelada, no hacemos nada
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