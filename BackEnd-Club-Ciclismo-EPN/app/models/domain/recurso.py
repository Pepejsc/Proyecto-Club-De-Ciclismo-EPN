import enum
from sqlalchemy import (
    Column, Integer, String, Date, Numeric, Text, 
    ForeignKey, Enum, DateTime
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

# --- Definición de ENUMs (mejora la integridad) ---

class TipoRecursoEnum(str, enum.Enum):
    """Define los tipos de recursos que existen."""
    COMERCIAL = "COMERCIAL"
    OPERATIVO = "OPERATIVO"

class EstadoActivoEnum(str, enum.Enum):
    """Define los estados de un activo operativo."""
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
    
    # --- Columna Discriminadora ---
    # Esta columna le dice a SQLAlchemy qué tipo de hijo es.
    tipo_recurso = Column(Enum(TipoRecursoEnum), nullable=False)

    categoria = Column(String(100))
    fecha_adquisicion = Column(Date)
    costo_adquisicion = Column(Numeric(10, 2), nullable=False, default=0.0)
    observacion = Column(Text)
    creado_en = Column(DateTime(timezone=True), server_default=func.now())

    __mapper_args__ = {
        # Habilita la herencia polimórfica usando la columna 'tipo_recurso'
        "polymorphic_on": tipo_recurso,
    }


# --- Tabla Hijo 1 ---

class InventarioComercial(Recurso):
    """
    Modelo "Hijo" para productos COMERCIALES (para venta).
    Hereda de Recurso.
    """
    __tablename__ = "inventario_comercial"

    # Esta columna es al mismo tiempo Llave Primaria y Llave Foránea
    id_recurso = Column(
        Integer, 
        ForeignKey("recursos.id_recurso", ondelete="CASCADE"), 
        primary_key=True
    )
    
    precio_venta = Column(Numeric(10, 2), nullable=False)
    stock_actual = Column(Integer, nullable=False, default=0)
    sku = Column(String(100), unique=True, index=True)

    __mapper_args__ = {
        # Cuando 'tipo_recurso' es "COMERCIAL", usa esta clase.
        "polymorphic_identity": TipoRecursoEnum.COMERCIAL,
    }


# --- Tabla Hijo 2 ---

class ActivoOperativo(Recurso):
    """
    Modelo "Hijo" para activos OPERATIVOS (del club).
    Hereda de Recurso.
    """
    __tablename__ = "activos_operativos"

    id_recurso = Column(
        Integer, 
        ForeignKey("recursos.id_recurso", ondelete="CASCADE"), 
        primary_key=True
    )
    
    codigo_activo = Column(String(100), unique=True, nullable=False, index=True)
    estado = Column(Enum(EstadoActivoEnum), nullable=False, default=EstadoActivoEnum.DISPONIBLE)
    ubicacion = Column(String(255))

    # --- Relación con la tabla User ---
    id_usuario_responsable = Column(
        Integer, 
        ForeignKey("user.id", ondelete="SET NULL")
    )
    
    # Esto te permite hacer 'activo.responsable' y obtener el objeto User
    responsable = relationship("User", back_populates="activos_a_cargo")

    __mapper_args__ = {
        # Cuando 'tipo_recurso' es "OPERATIVO", usa esta clase.
        "polymorphic_identity": TipoRecursoEnum.OPERATIVO,
    }