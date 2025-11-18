from pydantic import BaseModel, Field
from typing import Optional, Union, Literal, Annotated, List # <-- Importar List
from decimal import Decimal
from datetime import date

# Importa desde 'domain', NO desde 'schema'
from app.models.domain.recurso import TipoRecursoEnum, EstadoActivoEnum

# --- (NUEVO) Esquema para una imagen individual de la galería ---
class RecursoImagenRead(BaseModel):
    id: int
    imagen_url: str
    class Config:
        from_attributes = True

# --- Esquemas Base (Campos comunes) ---
class RecursoBase(BaseModel):
    """Campos comunes que comparten todos los tipos de recursos."""
    nombre: str = Field(..., max_length=255)
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = Field(None, max_length=1024) # Imagen Principal
    categoria: Optional[str] = Field(None, max_length=100)
    fecha_adquisicion: Optional[date] = None
    costo_adquisicion: Decimal = Field(..., ge=0, decimal_places=2)
    observacion: Optional[str] = None
    tallas_disponibles: Optional[str] = Field(None, max_length=255)
    class Config:
        from_attributes = True # Pydantic v2


# --- ESQUEMAS DE CREACIÓN ---
# (No cambian, la creación la manejaremos en el endpoint con Form/File)
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


# --- ESQUEMAS DE LECTURA (Actualizados) ---
class RecursoComercialRead(RecursoBase):
    id_recurso: int
    tipo_recurso: Literal[TipoRecursoEnum.COMERCIAL]
    precio_venta: Decimal
    stock_actual: int
    sku: Optional[str]
    imagenes_secundarias: List[RecursoImagenRead] = []

class RecursoOperativoRead(RecursoBase):
    id_recurso: int
    tipo_recurso: Literal[TipoRecursoEnum.OPERATIVO]
    codigo_activo: str
    estado: EstadoActivoEnum
    ubicacion: Optional[str]
    id_usuario_responsable: Optional[int]
    imagenes_secundarias: List[RecursoImagenRead] = []

RecursoRead = Annotated[
    Union[RecursoComercialRead, RecursoOperativoRead],
    Field(discriminator="tipo_recurso")
]

# --- Esquema público (Actualizado) ---
class ProductoPublico(BaseModel):
    id_recurso: int
    nombre: str
    descripcion: Optional[str] = None
    imagen_url: Optional[str] = None # (Esta es la imagen principal)
    precio_venta: Decimal
    imagenes_secundarias: List[RecursoImagenRead] = []
    tallas_disponibles: Optional[str] = None

    class Config:
        from_attributes = True