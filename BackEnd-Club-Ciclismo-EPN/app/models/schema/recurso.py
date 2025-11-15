from pydantic import BaseModel, Field
from typing import Optional, Union, Literal, Annotated # <-- 1. IMPORTAMOS ANNOTATED
from decimal import Decimal
from datetime import date

# --- Importamos los ENUMs del modelo de Dominio ---
from app.models.domain.recurso import TipoRecursoEnum, EstadoActivoEnum

# --- Esquemas Base (Campos comunes) ---

class RecursoBase(BaseModel):
    """Campos comunes que comparten todos los tipos de recursos."""
    nombre: str = Field(..., max_length=255)
    descripcion: Optional[str] = None
    categoria: Optional[str] = Field(None, max_length=100)
    fecha_adquisicion: Optional[date] = None
    costo_adquisicion: Decimal = Field(..., ge=0, decimal_places=2)
    observacion: Optional[str] = None

    # Configuración para que Pydantic maneje tipos de SQLAlchemy
    class Config:
        # 2. CAMBIAMOS 'orm_mode' POR 'from_attributes'
        from_attributes = True


# --- 1. ESQUEMAS DE CREACIÓN (Entrada de API) ---

class RecursoComercialCreate(RecursoBase):
    """Esquema para crear un producto COMERCIAL."""
    tipo_recurso: Literal[TipoRecursoEnum.COMERCIAL]
    precio_venta: Decimal = Field(..., ge=0, decimal_places=2)
    stock_inicial: int = Field(..., ge=0)
    sku: Optional[str] = Field(None, max_length=100)

class RecursoOperativoCreate(RecursoBase):
    """Esquema para crear un activo OPERATIVO."""
    tipo_recurso: Literal[TipoRecursoEnum.OPERATIVO]
    codigo_activo: str = Field(..., max_length=100)
    estado: EstadoActivoEnum = Field(default=EstadoActivoEnum.DISPONIBLE)
    ubicacion: Optional[str] = Field(None, max_length=255)
    id_usuario_responsable: Optional[int] = None


# --- 3. NUEVA SINTAXIS V2 PARA UNIÓN DISCRIMINADA (CREACIÓN) ---
RecursoCreate = Annotated[
    Union[RecursoComercialCreate, RecursoOperativoCreate],
    Field(discriminator="tipo_recurso")
]
# ¡Ya no necesitamos el objeto 'RecursoCreateDiscriminator'! Lo borramos.


# --- 2. ESQUEMAS DE LECTURA (Salida de API) ---

class RecursoComercialRead(RecursoBase):
    """Esquema para LEER un producto COMERCIAL."""
    id_recurso: int
    tipo_recurso: Literal[TipoRecursoEnum.COMERCIAL]
    precio_venta: Decimal
    stock_actual: int
    sku: Optional[str]

class RecursoOperativoRead(RecursoBase):
    """Esquema para LEER un activo OPERATIVO."""
    id_recurso: int
    tipo_recurso: Literal[TipoRecursoEnum.OPERATIVO]
    codigo_activo: str
    estado: EstadoActivoEnum
    ubicacion: Optional[str]
    id_usuario_responsable: Optional[int]

# --- 4. NUEVA SINTAXIS V2 PARA UNIÓN DISCRIMINADA (LECTURA) ---
RecursoRead = Annotated[
    Union[RecursoComercialRead, RecursoOperativoRead],
    Field(discriminator="tipo_recurso")
]
# ¡Ya no necesitamos 'RecursoReadDiscriminator'! Lo borramos.


# --- 3. ESQUEMAS DE ACTUALIZACIÓN ---
# (Estos no causaban error, pero los incluyo por completitud)

class RecursoComercialUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=255)
    # ... (resto de campos opcionales) ...
    precio_venta: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    stock_actual: Optional[int] = Field(None, ge=0) 
    sku: Optional[str] = Field(None, max_length=100)

    # También necesitan la Config de Pydantic V2 si los usas para leer
    class Config:
        from_attributes = True

class RecursoOperativoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=255)
    # ... (resto de campos opcionales) ...
    estado: Optional[EstadoActivoEnum] = None
    id_usuario_responsable: Optional[int] = None
    
    class Config:
        from_attributes = True