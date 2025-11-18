import enum
from sqlalchemy import (
    Column, Integer, String, Date, Numeric, Text, 
    ForeignKey, Enum, DateTime
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

# Asegúrate de importar tu Base declarativa.
from app.db.database import Base # (Esta es tu ruta correcta)

# --- Definición de ENUMs (sin cambios) ---
class TipoRecursoEnum(str, enum.Enum):
    COMERCIAL = "COMERCIAL"
    OPERATIVO = "OPERATIVO"

class EstadoActivoEnum(str, enum.Enum):
    DISPONIBLE = "DISPONIBLE"
    ASIGNADO = "ASIGNADO"
    EN_MANTENIMIENTO = "EN_MANTENIMIENTO"
    DE_BAJA = "DE_BAJA"


# --- Tabla Padre ---
class Recurso(Base):
    """
    Modelo "Padre" para todos los Recursos.
    Almacena la información común a todos los tipos.
    """
    __tablename__ = "recursos"

    id_recurso = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(255), nullable=False)
    descripcion = Column(Text)
    imagen_url = Column(String(1024), nullable=True) 
    tipo_recurso = Column(Enum(TipoRecursoEnum), nullable=False)
    categoria = Column(String(100))
    fecha_adquisicion = Column(Date)
    costo_adquisicion = Column(Numeric(10, 2), nullable=False, default=0.0)
    observacion = Column(Text)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())
    tallas_disponibles = Column(String(255), nullable=True)
    
    __mapper_args__ = {
        "polymorphic_on": tipo_recurso,
    }

    imagenes_secundarias = relationship("RecursoImagen", back_populates="recurso")


# --- Hijo 1: InventarioComercial (sin cambios) ---
class InventarioComercial(Recurso):
    __tablename__ = "inventario_comercial"
    id_recurso = Column(
        Integer, 
        ForeignKey("recursos.id_recurso", ondelete="CASCADE"), 
        primary_key=True
    )
    precio_venta = Column(Numeric(10, 2), nullable=False)
    stock_actual = Column(Integer, nullable=False, default=0)
    sku = Column(String(100), unique=True, index=True)
    __mapper_args__ = {
        "polymorphic_identity": TipoRecursoEnum.COMERCIAL,
    }

# --- Hijo 2: ActivoOperativo (sin cambios) ---
class ActivoOperativo(Recurso):
    __tablename__ = "activos_operativos"
    id_recurso = Column(
        Integer, 
        ForeignKey("recursos.id_recurso", ondelete="CASCADE"), 
        primary_key=True
    )
    codigo_activo = Column(String(100), unique=True, nullable=False, index=True)
    estado = Column(Enum(EstadoActivoEnum), nullable=False, default=EstadoActivoEnum.DISPONIBLE)
    ubicacion = Column(String(255))
    id_usuario_responsable = Column(
        Integer, 
        ForeignKey("user.id", ondelete="SET NULL")
    )
    responsable = relationship("User", back_populates="activos_a_cargo")
    
    __mapper_args__ = {
        "polymorphic_identity": TipoRecursoEnum.OPERATIVO,
    }

# --- (NUEVA TABLA PARA IMÁGENES SECUNDARIAS) ---
class RecursoImagen(Base):
    """
    Almacena las imágenes secundarias (galería) para un recurso.
    """
    __tablename__ = "recurso_imagenes"
    
    id = Column(Integer, primary_key=True, index=True)
    imagen_url = Column(String(1024), nullable=False)
    recurso_id = Column(Integer, ForeignKey("recursos.id_recurso", ondelete="CASCADE"))
    recurso = relationship("Recurso", back_populates="imagenes_secundarias")