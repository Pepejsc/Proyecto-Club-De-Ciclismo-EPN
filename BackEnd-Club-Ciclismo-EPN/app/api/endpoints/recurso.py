from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
# --- (NUEVO) Importa Request ---
from fastapi import Request
from sqlalchemy.orm import Session
from typing import List, Optional
import os
import uuid
import shutil 

# --- Importaciones de nuestro proyecto ---
from app.db.database import get_db 
from app.models.domain.recurso import (
    Recurso, 
    InventarioComercial, 
    ActivoOperativo,
    TipoRecursoEnum
)
from app.models.schema.recurso import (
    RecursoRead,
    ProductoPublico # Importamos el esquema público
)
# from app.core.security import get_current_user 

# --- (CORREGIDO) La ruta de guardado es 'uploads/recursos' ---
# Tu main.py ya crea 'uploads/recursos'
UPLOAD_DIR = "uploads/recursos"

# --- Creación del Router ---
router = APIRouter()


# --- (CORREGIDO) Función de ayuda para guardar archivos ---
def save_upload_file(upload_file: UploadFile) -> str:
    """
    Guarda un archivo subido y devuelve la URL de acceso.
    """
    try:
        file_extension = upload_file.filename.split('.')[-1]
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        
        # Guardamos en la carpeta correcta
        file_path = os.path.join(UPLOAD_DIR, unique_filename) 
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(upload_file.file, buffer)
            
        # --- (CORREGIDO) Devolvemos la URL que SÍ existe en main.py ---
        return f"/uploads/recursos/{unique_filename}"
    finally:
        upload_file.file.close()

# --- Endpoint Público (Corregido para construir la URL) ---
@router.get(
    "/comerciales/", 
    response_model=List[ProductoPublico]
)
def listar_productos_comerciales(
    request: Request, 
    db: Session = Depends(get_db)
):
    """
    Obtiene una lista pública de TODOS los recursos COMERCIALES.
    No requiere autenticación.
    Devuelve URLs de imagen absolutas.
    """
    
    base_url = str(request.base_url).rstrip('/') 
    productos_db = db.query(InventarioComercial).filter(
        InventarioComercial.stock_actual > 0
    ).all()
    
    productos_publicos = []
    for p in productos_db:
        full_imagen_url = None
        if p.imagen_url:
            # Construye: "http://localhost:8000" + "/uploads/recursos/foto.png"
            full_imagen_url = f"{base_url}{p.imagen_url}"
            
        productos_publicos.append(
            ProductoPublico(
                id_recurso=p.id_recurso,
                nombre=p.nombre,
                descripcion=p.descripcion,
                imagen_url=full_imagen_url, # <-- Aquí va la URL completa
                precio_venta=p.precio_venta
            )
        )
        
    return productos_publicos


# --- 1. Endpoint de CREACIÓN (Sin cambios) ---
@router.post("/", response_model=RecursoRead, status_code=status.HTTP_201_CREATED)
def crear_nuevo_recurso(
    tipo_recurso: str = Form(...),
    nombre: str = Form(...),
    descripcion: str = Form(...),
    categoria: Optional[str] = Form(None),
    fecha_adquisicion: str = Form(...),
    costo_adquisicion: float = Form(...),
    observacion: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None), 
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
        imagen_url_db = save_upload_file(file) # Llama a la función corregida
    
    recurso_data = {
        "nombre": nombre, "descripcion": descripcion, "imagen_url": imagen_url_db,
        "categoria": categoria, "fecha_adquisicion": fecha_adquisicion,
        "costo_adquisicion": costo_adquisicion, "observacion": observacion,
    }
    db_recurso = None
    if tipo_recurso == TipoRecursoEnum.COMERCIAL:
        recurso_data.update({
            "precio_venta": precio_venta, "stock_actual": stock_inicial, "sku": sku
        })
        db_recurso = InventarioComercial(**recurso_data)
    elif tipo_recurso == TipoRecursoEnum.OPERATIVO:
        recurso_data.update({
            "codigo_activo": codigo_activo, "estado": estado, "ubicacion": ubicacion,
            "id_usuario_responsable": id_usuario_responsable
        })
        db_recurso = ActivoOperativo(**recurso_data)
    else:
        raise HTTPException(status_code=400, detail="Tipo de recurso desconocido")
    try:
        db.add(db_recurso)
        db.commit()
        db.refresh(db_recurso)
        return db_recurso
    except Exception as e:
        db.rollback()
        if "UNIQUE constraint failed" in str(e) or "Duplicate entry" in str(e):
            raise HTTPException(status_code=409, detail="Error de unicidad: El SKU o Código de Activo ya existe.")
        print(f"❌ ERROR AL GUARDAR: {e}") 
        raise HTTPException(status_code=500, detail=f"Error al guardar en la base de datos: {e}")


# --- 2. Endpoint de LISTAR TODOS (Admin - Sin cambios) ---
@router.get("/", response_model=List[RecursoRead])
def listar_todos_los_recursos(db: Session = Depends(get_db), skip: int = 0, limit: int = 100):
    recursos = db.query(Recurso).offset(skip).limit(limit).all()
    return recursos


# --- 3. Endpoint de OBTENER UNO POR ID (Admin - Sin cambios) ---
@router.get("/{id_recurso}", response_model=RecursoRead)
def obtener_recurso_por_id(id_recurso: int, db: Session = Depends(get_db)):
    recurso = db.query(Recurso).filter(Recurso.id_recurso == id_recurso).first()
    if not recurso:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")
    return recurso


# --- 4. Endpoint de ELIMINAR (CORREGIDO) ---
@router.delete("/{id_recurso}", status_code=status.HTTP_204_NO_CONTENT)
def borrar_recurso(id_recurso: int, db: Session = Depends(get_db)):
    recurso = db.query(Recurso).filter(Recurso.id_recurso == id_recurso).first()
    if not recurso:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")
    try:
        if recurso.imagen_url:
            # --- (CORREGIDO) Construye la ruta de archivo local correcta ---
            # (ej: "uploads/recursos/foto.png")
            file_path = recurso.imagen_url.lstrip('/') 
            if os.path.exists(file_path):
                os.remove(file_path)
        
        db.delete(recurso)
        db.commit()
        return None 
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error al eliminar el recurso: {e}")


# --- 5. Endpoint de ACTUALIZACIÓN (PUT - CORREGIDO) ---
@router.put("/{id_recurso}", response_model=RecursoRead)
def actualizar_recurso(
    id_recurso: int,
    tipo_recurso: str = Form(...),
    nombre: str = Form(...),
    descripcion: str = Form(...),
    categoria: Optional[str] = Form(None),
    fecha_adquisicion: str = Form(...),
    costo_adquisicion: float = Form(...),
    observacion: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None), 
    precio_venta: Optional[float] = Form(None),
    stock_actual: Optional[int] = Form(None), 
    sku: Optional[str] = Form(None),
    codigo_activo: Optional[str] = Form(None),
    estado: Optional[str] = Form(None),
    ubicacion: Optional[str] = Form(None),
    id_usuario_responsable: Optional[int] = Form(None),
    db: Session = Depends(get_db)
):
    db_recurso = db.query(Recurso).filter(Recurso.id_recurso == id_recurso).first()
    if not db_recurso:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")
    if db_recurso.tipo_recurso != tipo_recurso:
        raise HTTPException(status_code=400, detail="No se puede cambiar el tipo de un recurso.")
    
    update_data = {
        "nombre": nombre, "descripcion": descripcion, "categoria": categoria,
        "fecha_adquisicion": fecha_adquisicion, "costo_adquisicion": costo_adquisicion,
        "observacion": observacion,
    }

    if file:
        if db_recurso.imagen_url:
            # --- (CORREGIDO) Borra el archivo viejo con la ruta correcta ---
            old_file_path = db_recurso.imagen_url.lstrip('/')
            if os.path.exists(old_file_path):
                os.remove(old_file_path)
        
        # save_upload_file ya usa la ruta correcta (/uploads/...)
        update_data["imagen_url"] = save_upload_file(file)
    
    if tipo_recurso == TipoRecursoEnum.COMERCIAL:
        update_data.update({
            "precio_venta": precio_venta, "stock_actual": stock_actual, "sku": sku
        })
    elif tipo_recurso == TipoRecursoEnum.OPERATIVO:
        update_data.update({
            "codigo_activo": codigo_activo, "estado": estado, "ubicacion": ubicacion,
            "id_usuario_responsable": id_usuario_responsable
        })
    
    for key, value in update_data.items():
        if hasattr(db_recurso, key):
            setattr(db_recurso, key, value)
    try:
        db.add(db_recurso)
        db.commit()
        db.refresh(db_recurso)
        return db_recurso
    except Exception as e:
        db.rollback()
        if "UNIQUE constraint failed" in str(e) or "Duplicate entry" in str(e):
            raise HTTPException(status_code=409, detail="Error de unicidad: El SKU o Código de Activo ya existe.")
        raise HTTPException(status_code=500, detail=f"Error al actualizar en la base de datos: {e}")