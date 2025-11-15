from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
import os
import uuid
from datetime import datetime

from app.db.database import get_db
from app.models.domain.document_models import Document, DocumentType
from app.models.schema.document_schemas import DocumentCreate, DocumentResponse, DocumentListResponse
from app.core.security import get_current_user

router = APIRouter(prefix="/documents", tags=["documents"])

# Configuración
UPLOAD_DIR = "uploads/documents"
os.makedirs(UPLOAD_DIR, exist_ok=True)

ALLOWED_EXTENSIONS = {
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'odt': 'application/vnd.oasis.opendocument.text'
}

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

# Endpoint para crear un documento
@router.post("/", response_model=DocumentResponse)
async def create_document(
    name: str = Form(...),
    entry_date: str = Form(...),
    responsible: str = Form(...),
    document_type: str = Form(...),
    description: Optional[str] = Form(None),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    #current_user: dict = Depends(get_current_user)
):
    try:
        print("=" * 50)
        print("🔍 BACKEND - DATOS RECIBIDOS:")
        print(f"   👤 Responsible: '{responsible}'")
        print(f"   📝 Name: '{name}'")
        print(f"   📅 Entry date: '{entry_date}'")
        print(f"   📄 Document type: '{document_type}'")
        print(f"   📋 Description: '{description}'")
        print(f"   📎 File: '{file.filename}'")
        print("=" * 50)
        
        # Validar que responsible no sea undefined
        if responsible == "undefined" or not responsible.strip():
            print("❌ ERROR: Responsible es 'undefined' o vacío")
            raise HTTPException(
                status_code=400, 
                detail="El campo 'responsible' es requerido y no puede estar vacío"
            )

        # Validaciones de archivo
        file_extension = file.filename.split('.')[-1].lower() if '.' in file.filename else ''
        if file_extension not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=400,
                detail=f"Tipo de archivo no permitido. Formatos: {', '.join(ALLOWED_EXTENSIONS.keys())}"
            )

        # Validar tamaño
        file.file.seek(0, 2)
        file_size = file.file.tell()
        file.file.seek(0)
        
        if file_size > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=400,
                detail=f"Archivo demasiado grande. Máximo: {MAX_FILE_SIZE // (1024*1024)}MB"
            )

        # Guardar archivo
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)

        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)

        # Parsear fecha
        try:
            entry_date_obj = datetime.fromisoformat(entry_date.replace('Z', '+00:00'))
        except:
            entry_date_obj = datetime.utcnow()

        # Crear documento en BD
        db_document = Document(
            name=name,
            entry_date=entry_date_obj,
            responsible=responsible,
            document_type=DocumentType(document_type),
            description=description,
            file_path=file_path,
            file_name=file.filename,
            file_size=file_size,
            mime_type=ALLOWED_EXTENSIONS.get(file_extension),
            created_by=1
        )

        db.add(db_document)
        db.commit()
        db.refresh(db_document)

        return db_document

    except Exception as e:
        if 'file_path' in locals() and os.path.exists(file_path):
            os.remove(file_path)
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# Endpoint para obtener lista de documentos con paginación y filtro
@router.get("/", response_model=DocumentListResponse)
def get_documents(
    skip: int = 0,
    limit: int = 100,
    document_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    query = db.query(Document)
    
    if document_type:
        query = query.filter(Document.document_type == document_type)
    
    total = query.count()
    documents = query.order_by(Document.created_at.desc()).offset(skip).limit(limit).all()
    
    return DocumentListResponse(documents=documents, total=total)

# Endpoint para obtener un documento por ID
@router.get("/{document_id}", response_model=DocumentResponse)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    return document

# Endpoint para actualizar un documento por ID
@router.put("/{document_id}", response_model=DocumentResponse)
async def update_document(
    document_id: int,
    name: str = Form(...),
    entry_date: str = Form(...),
    responsible: str = Form(...),
    document_type: str = Form(...),
    description: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    #current_user: dict = Depends(get_current_user)
):
    try:
        print(f"🔍 RECIBIENDO DATOS PARA ACTUALIZAR DOCUMENTO {document_id}")
        print(f"📝 Name: {name}")
        print(f"📅 Entry date: {entry_date}")
        print(f"👤 Responsible: {responsible}")
        print(f"📄 Document type: {document_type}")
        print(f"📋 Description: {description}")
        print(f"📎 File: {file.filename if file else 'No file'}")
        
        # Buscar el documento existente
        db_document = db.query(Document).filter(Document.id == document_id).first()
        if not db_document:
            raise HTTPException(status_code=404, detail="Documento no encontrado")

        print(f"📊 DOCUMENTO ACTUAL: {db_document.name}, {db_document.responsible}")

        # Variables para el archivo (mantener actual si no se sube nuevo)
        file_path = db_document.file_path
        file_name = db_document.file_name
        file_size = db_document.file_size
        mime_type = db_document.mime_type

        # Si se sube un nuevo archivo
        if file and file.filename:
            print("🔄 Procesando nuevo archivo...")
            # ... (código existente para validar y guardar archivo)

        # Parsear fecha
        try:
            entry_date_obj = datetime.fromisoformat(entry_date.replace('Z', '+00:00'))
        except:
            entry_date_obj = datetime.utcnow()

        # Actualizar documento en BD
        db_document.name = name
        db_document.entry_date = entry_date_obj
        db_document.responsible = responsible
        db_document.document_type = DocumentType(document_type)
        db_document.description = description
        db_document.file_path = file_path
        db_document.file_name = file_name
        db_document.file_size = file_size
        db_document.mime_type = mime_type
        db_document.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(db_document)

        print(f"✅ DOCUMENTO ACTUALIZADO: {db_document.name}, {db_document.responsible}")
        return db_document

    except Exception as e:
        db.rollback()
        print(f"❌ ERROR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al actualizar documento: {str(e)}")

# Endpoint para eliminar un documento por ID
@router.delete("/{document_id}")
async def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    #current_user: dict = Depends(get_current_user)
):
    try:
        print(f"🗑️ SOLICITUD PARA ELIMINAR DOCUMENTO {document_id}")
        
        # Buscar el documento existente
        db_document = db.query(Document).filter(Document.id == document_id).first()
        if not db_document:
            raise HTTPException(status_code=404, detail="Documento no encontrado")

        print(f"📄 DOCUMENTO A ELIMINAR: {db_document.name}")

        # Eliminar el archivo físico del sistema de archivos
        if os.path.exists(db_document.file_path):
            os.remove(db_document.file_path)
            print(f"✅ ARCHIVO ELIMINADO: {db_document.file_path}")
        else:
            print(f"⚠️ ARCHIVO NO ENCONTRADO: {db_document.file_path}")

        # Eliminar el registro de la base de datos
        db.delete(db_document)
        db.commit()

        print(f"✅ DOCUMENTO ELIMINADO DE LA BD: {db_document.name}")
        
        return {
            "message": "Documento eliminado correctamente",
            "deleted_document": {
                "id": document_id,
                "name": db_document.name
            }
        }

    except Exception as e:
        db.rollback()
        print(f"❌ ERROR AL ELIMINAR: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error al eliminar documento: {str(e)}")

# Endpoint para descargar un documento por ID
@router.get("/{document_id}/download")
def download_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    
    if not os.path.exists(document.file_path):
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    
    return FileResponse(
        path=document.file_path,
        filename=document.file_name,
        media_type=document.mime_type
    )