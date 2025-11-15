from pydantic import BaseModel, Field
from typing import Optional, Union, Literal, Annotated
from decimal import Decimal
from datetime import date

from app.models.domain.recurso import TipoRecursoEnum, EstadoActivoEnum

# --- Esquemas Base (Campos comunes) ---

class RecursoBase(BaseModel):
    """Campos comunes que comparten todos los tipos de recursos."""
    nombre: str = Field(..., max_length=255)
    descripcion: Optional[str] = None
    
    # --- (NUEVO CAMPO DE IMAGEN) ---
    imagen_url: Optional[str] = Field(None, max_length=1024) # <-- AÑADIDO
    
    categoria: Optional[str] = Field(None, max_length=100)
    fecha_adquisicion: Optional[date] = None
    costo_adquisicion: Decimal = Field(..., ge=0, decimal_places=2)
    observacion: Optional[str] = None

    class Config:
        from_attributes = True # Pydantic v2


# --- ESQUEMAS DE CREACIÓN ---
class RecursoComercialCreate(RecursoBase):
    tipo_recurso: Literal[TipoRecursoEnum.COMERCIAL]
    precio_venta: Decimal = Field(..., ge=0, decimal_places=2)
    stock_inicial: int = Field(..., ge=0)
    sku: Optional[str] = Field(None, max_length=100)

class RecursoOperativoCreate(RecursoBase):
    tipo_recurso: Literal[TipoRecursoEnum.OPERATIVO]
    codigo_activo: str = Field(..., max_length=100)
    estado: EstadoActivoEnum = Field(default=EstadoActivoEnum.DISPONIBLE)
    ubicacion: Optional[str] = Field(None, max_length=255)
    id_usuario_responsable: Optional[int] = None

RecursoCreate = Annotated[
    Union[RecursoComercialCreate, RecursoOperativoCreate],
    Field(discriminator="tipo_recurso")
]


# --- ESQUEMAS DE LECTURA ---
class RecursoComercialRead(RecursoBase):
    id_recurso: int
    tipo_recurso: Literal[TipoRecursoEnum.COMERCIAL]
    precio_venta: Decimal
    stock_actual: int
    sku: Optional[str]

class RecursoOperativoRead(RecursoBase):
    id_recurso: int
    tipo_recurso: Literal[TipoRecursoEnum.OPERATIVO]
    codigo_activo: str
    estado: EstadoActivoEnum
    ubicacion: Optional[str]
    id_usuario_responsable: Optional[int]

RecursoRead = Annotated[
    Union[RecursoComercialRead, RecursoOperativoRead],
    Field(discriminator="tipo_recurso")
]

# --- (NUEVO) Esquema solo para el carrusel público ---
# Es más limpio y solo expone lo necesario
class ProductoPublico(BaseModel):
    id_recurso: int
    nombre: str
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None
    precio_venta: Decimal

    class Config:
        from_attributes = True