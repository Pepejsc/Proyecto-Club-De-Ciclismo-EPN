# app/models/schema/document_schemas.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from enum import Enum

class DocumentType(str, Enum):
    STATUTE = "estatuto"
    REGULATION = "reglamento" 
    MINUTE = "acta"
    REPORT = "informe"
    CONTRACT = "contrato"
    OTHER = "otro"

class DocumentCreate(BaseModel):
    name: str
    entry_date: datetime
    responsible: str
    document_type: DocumentType
    description: Optional[str] = None

class DocumentResponse(BaseModel):
    id: int
    name: str
    entry_date: datetime
    responsible: str
    document_type: str
    description: Optional[str]
    file_name: str
    file_size: Optional[int]
    mime_type: Optional[str]
    created_by: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class DocumentListResponse(BaseModel):
    documents: list[DocumentResponse]
    total: int