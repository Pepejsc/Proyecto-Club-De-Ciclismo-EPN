from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from fastapi import Request
from sqlalchemy.orm import Session, joinedload
from typing import List, Optional
import os
import uuid
import shutil 

from app.db.database import get_db 
from app.models.domain.recurso import (
    Recurso, 
    InventarioComercial, 
    ActivoOperativo,
    TipoRecursoEnum,
    RecursoImagen
)
from app.models.schema.recurso import (
    RecursoRead,
    ProductoPublico
)

UPLOAD_DIR = "uploads/recursos"
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter()

def save_upload_file(upload_file: UploadFile) -> str:
    try:
        file_extension = upload_file.filename.split('.')[-1]
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename) 
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
        return f"/uploads/recursos/{unique_filename}"
    finally:
        upload_file.file.close()

@router.get("/comerciales/", response_model=List[ProductoPublico])
def listar_productos_comerciales(request: Request, db: Session = Depends(get_db)):
    base_url = str(request.base_url).rstrip('/') 
    productos_db = db.query(InventarioComercial).options(
        joinedload(InventarioComercial.imagenes_secundarias)
    )
    
    productos_publicos = []
    for p in productos_db:
        full_imagen_url = None
        if p.imagen_url:
            full_imagen_url = f"{base_url}{p.imagen_url}"
        imagenes_secundarias_urls = [
            {"id": img.id, "imagen_url": f"{base_url}{img.imagen_url}"} 
            for img in p.imagenes_secundarias
        ]
        productos_publicos.append(
            ProductoPublico(
                id_recurso=p.id_recurso,
                nombre=p.nombre,
                descripcion=p.descripcion,
                imagen_url=full_imagen_url,
                precio_venta=p.precio_venta,
                imagenes_secundarias=imagenes_secundarias_urls
            )
        )
    return productos_publicos

@router.post("/", response_model=RecursoRead, status_code=status.HTTP_201_CREATED)
def crear_nuevo_recurso(
    tipo_recurso: str = Form(...),
    nombre: str = Form(...),
    descripcion: str = Form(...),
    categoria: Optional[str] = Form(None),
    fecha_adquisicion: str = Form(...),
    costo_adquisicion: float = Form(...),
    observacion: Optional[str] = Form(None),
    tallas_disponibles: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None), 
    files_gallery: Optional[List[UploadFile]] = File(None),
    precio_venta: Optional[float] = Form(None),
    stock_inicial: Optional[int] = Form(None),
    sku: Optional[str] = Form(None),
    codigo_activo: Optional[str] = Form(None),
    estado: Optional[str] = Form(None),
    ubicacion: Optional[str] = Form(None),
    id_usuario_responsable: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    imagen_url_db = None
    if file:
        imagen_url_db = save_upload_file(file)
    recurso_data = {
        "nombre": nombre, "descripcion": descripcion, "imagen_url": imagen_url_db,
        "categoria": categoria, "fecha_adquisicion": fecha_adquisicion,
        "costo_adquisicion": costo_adquisicion, "observacion": observacion,
        "tallas_disponibles": tallas_disponibles
    }
    db_recurso = None
    if tipo_recurso == TipoRecursoEnum.COMERCIAL:
        recurso_data.update({"precio_venta": precio_venta, "stock_actual": stock_inicial, "sku": sku})
        db_recurso = InventarioComercial(**recurso_data)
    elif tipo_recurso == TipoRecursoEnum.OPERATIVO:
        recurso_data.update({"codigo_activo": codigo_activo, "estado": estado, "ubicacion": ubicacion, "id_usuario_responsable": id_usuario_responsable})
        db_recurso = ActivoOperativo(**recurso_data)
    else:
        raise HTTPException(status_code=400, detail="Tipo de recurso desconocido")
    try:
        db.add(db_recurso)
        db.commit() 
        db.refresh(db_recurso)
        if files_gallery:
            for gallery_file in files_gallery:
                gallery_url = save_upload_file(gallery_file)
                db_imagen = RecursoImagen(imagen_url=gallery_url, recurso_id=db_recurso.id_recurso)
                db.add(db_imagen)
            db.commit() 
            db.refresh(db_recurso)
        return db_recurso
    except Exception as e:
        db.rollback()
        if "UNIQUE constraint failed" in str(e): raise HTTPException(status_code=409, detail="Error de unicidad.")
        raise HTTPException(status_code=500, detail=f"Error: {e}")

@router.get("/", response_model=List[RecursoRead])
def listar_todos_los_recursos(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    return db.query(Recurso).options(joinedload(Recurso.imagenes_secundarias)).offset(skip).limit(limit).all()

@router.get("/{id_recurso}", response_model=RecursoRead)
def obtener_recurso_por_id(id_recurso: int, request: Request, db: Session = Depends(get_db)):
    recurso = db.query(Recurso).options(joinedload(Recurso.imagenes_secundarias)).filter(Recurso.id_recurso == id_recurso).first()
    if not recurso: raise HTTPException(status_code=404, detail="Recurso no encontrado")
    base_url = str(request.base_url).rstrip('/')
    if recurso.imagen_url: recurso.imagen_url = f"{base_url}{recurso.imagen_url}"
    for img in recurso.imagenes_secundarias: img.imagen_url = f"{base_url}{img.imagen_url}"
    return recurso

@router.delete("/{id_recurso}", status_code=status.HTTP_204_NO_CONTENT)
def borrar_recurso(id_recurso: int, db: Session = Depends(get_db)):
    recurso = db.query(Recurso).options(joinedload(Recurso.imagenes_secundarias)).filter(Recurso.id_recurso == id_recurso).first()
    if not recurso: raise HTTPException(status_code=404, detail="Recurso no encontrado")
    try:
        if recurso.imagen_url and os.path.exists(recurso.imagen_url.lstrip('/')): os.remove(recurso.imagen_url.lstrip('/'))
        for img in recurso.imagenes_secundarias:
            if os.path.exists(img.imagen_url.lstrip('/')): os.remove(img.imagen_url.lstrip('/'))
        db.delete(recurso)
        db.commit()
        return None 
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {e}")

@router.put("/{id_recurso}", response_model=RecursoRead)
def actualizar_recurso(id_recurso: int, tipo_recurso: str = Form(...), nombre: str = Form(...), descripcion: str = Form(...), categoria: Optional[str] = Form(None), fecha_adquisicion: str = Form(...), costo_adquisicion: float = Form(...), observacion: Optional[str] = Form(None), tallas_disponibles: Optional[str] = Form(None), file: Optional[UploadFile] = File(None), files_gallery: Optional[List[UploadFile]] = File(None), precio_venta: Optional[float] = Form(None), stock_actual: Optional[int] = Form(None), sku: Optional[str] = Form(None), codigo_activo: Optional[str] = Form(None), estado: Optional[str] = Form(None), ubicacion: Optional[str] = Form(None), id_usuario_responsable: Optional[int] = Form(None), db: Session = Depends(get_db)):
    db_recurso = db.query(Recurso).filter(Recurso.id_recurso == id_recurso).first()
    if not db_recurso: raise HTTPException(status_code=404, detail="Recurso no encontrado")
    
    update_data = {"nombre": nombre, "descripcion": descripcion, "categoria": categoria, "fecha_adquisicion": fecha_adquisicion, "costo_adquisicion": costo_adquisicion, "observacion": observacion, "tallas_disponibles": tallas_disponibles}
    if file:
        if db_recurso.imagen_url and os.path.exists(db_recurso.imagen_url.lstrip('/')): os.remove(db_recurso.imagen_url.lstrip('/'))
        update_data["imagen_url"] = save_upload_file(file)
    
    if tipo_recurso == TipoRecursoEnum.COMERCIAL: update_data.update({"precio_venta": precio_venta, "stock_actual": stock_actual, "sku": sku})
    elif tipo_recurso == TipoRecursoEnum.OPERATIVO: update_data.update({"codigo_activo": codigo_activo, "estado": estado, "ubicacion": ubicacion, "id_usuario_responsable": id_usuario_responsable})
    
    for key, value in update_data.items():
        if hasattr(db_recurso, key): setattr(db_recurso, key, value)
    try:
        db.add(db_recurso)
        db.commit()
        db.refresh(db_recurso)
        if files_gallery:
            for gallery_file in files_gallery:
                gallery_url = save_upload_file(gallery_file)
                db_imagen = RecursoImagen(imagen_url=gallery_url, recurso_id=db_recurso.id_recurso)
                db.add(db_imagen)
            db.commit()
            db.refresh(db_recurso)
        return db_recurso
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {e}")

# --- (NUEVO) Endpoint para RESTAR STOCK (Compra) ---
@router.post("/{id_recurso}/comprar", status_code=status.HTTP_200_OK)
def registrar_compra(id_recurso: int, db: Session = Depends(get_db)):
    inventario = db.query(InventarioComercial).filter(InventarioComercial.id_recurso == id_recurso).first()
    if not inventario: raise HTTPException(status_code=404, detail="Producto no encontrado")
    if inventario.stock_actual <= 0: raise HTTPException(status_code=400, detail="Producto agotado")
    try:
        inventario.stock_actual -= 1
        db.commit()
        db.refresh(inventario)
        return {"message": "Stock actualizado", "nuevo_stock": inventario.stock_actual}
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error: {e}")