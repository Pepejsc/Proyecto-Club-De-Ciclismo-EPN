from sqlalchemy import Column, Integer, String, DateTime, Text, Enum, ForeignKey
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime
import enum

class DocumentType(str, enum.Enum):
    STATUTE = "estatuto"
    REGULATION = "reglamento"
    MINUTE = "acta"
    REPORT = "informe"
    CONTRACT = "contrato"
    OTHER = "otro"

class Document(Base):
    __tablename__ = "documents"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    entry_date = Column(DateTime, nullable=False)
    responsible = Column(String(255), nullable=False)
    document_type = Column(Enum(DocumentType), nullable=False)
    description = Column(Text)
    file_path = Column(String(500), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size = Column(Integer)  # en bytes
    mime_type = Column(String(100))
    
    # 🔗 RELACIÓN CON USER (para saber quién subió el documento)
    created_by = Column(Integer, ForeignKey("user.id"), nullable=False)
    
    # Auditoría
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)