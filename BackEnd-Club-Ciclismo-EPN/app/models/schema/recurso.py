from pydantic import BaseModel, Field, Discriminator
from typing import Optional, Union, Literal
from decimal import Decimal
from datetime import date

# --- Importamos los ENUMs del modelo de Dominio ---
# Esto asegura que Pydantic y SQLAlchemy usen las mismas opciones.
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
        orm_mode = True


# --- 1. ESQUEMAS DE CREACIÓN (Entrada de API) ---
# Lo que recibimos desde React

class RecursoComercialCreate(RecursoBase):
    """Esquema para crear un producto COMERCIAL."""
    # El discriminador: define este como tipo COMERCIAL
    tipo_recurso: Literal[TipoRecursoEnum.COMERCIAL]
    
    # Campos específicos de Comercial
    precio_venta: Decimal = Field(..., ge=0, decimal_places=2)
    stock_inicial: int = Field(..., ge=0)
    sku: Optional[str] = Field(None, max_length=100)

class RecursoOperativoCreate(RecursoBase):
    """Esquema para crear un activo OPERATIVO."""
    # El discriminador: define este como tipo OPERATIVO
    tipo_recurso: Literal[TipoRecursoEnum.OPERATIVO]

    # Campos específicos de Operativo
    codigo_activo: str = Field(..., max_length=100)
    estado: EstadoActivoEnum = Field(default=EstadoActivoEnum.DISPONIBLE)
    ubicacion: Optional[str] = Field(None, max_length=255)
    
    # --- IMPORTANTE ---
    # En el formulario de React tenías 'responsable' como un texto.
    # Lo correcto es enviar el ID del usuario.
    # Si aún no lo tienes, puedes cambiar esto a:
    # responsable_texto: Optional[str]
    # ...pero idealmente el frontend debería enviar el ID.
    id_usuario_responsable: Optional[int] = None


# --- Unión Disciminada para CREACIÓN ---
# Esto le permite a FastAPI validar automáticamente 
# si es Comercial u Operativo basado en el campo 'tipo_recurso'.
RecursoCreate = Union[RecursoComercialCreate, RecursoOperativoCreate]

# Le decimos a Pydantic que use el campo 'tipo_recurso' para decidir
RecursoCreateDiscriminator = Discriminator(
    "tipo_recurso",
    mapping={
        TipoRecursoEnum.COMERCIAL: RecursoComercialCreate.schema(),
        TipoRecursoEnum.OPERATIVO: RecursoOperativoCreate.schema(),
    },
)


# --- 2. ESQUEMAS DE LECTURA (Salida de API) ---
# Lo que le devolvemos a React

class RecursoComercialRead(RecursoBase):
    """Esquema para LEER un producto COMERCIAL."""
    id_recurso: int
    tipo_recurso: Literal[TipoRecursoEnum.COMERCIAL]
    
    # Campos específicos
    precio_venta: Decimal
    stock_actual: int
    sku: Optional[str]

class RecursoOperativoRead(RecursoBase):
    """Esquema para LEER un activo OPERATIVO."""
    id_recurso: int
    tipo_recurso: Literal[TipoRecursoEnum.OPERATIVO]

    # Campos específicos
    codigo_activo: str
    estado: EstadoActivoEnum
    ubicacion: Optional[str]
    id_usuario_responsable: Optional[int]
    
    # Aquí podríamos incluir el objeto 'responsable' completo si quisiéramos
    # responsable: Optional[UserSchema] # (Necesitarías un UserSchema)

# --- Unión Disciminada para LECTURA ---
RecursoRead = Union[RecursoComercialRead, RecursoOperativoRead]

RecursoReadDiscriminator = Discriminator(
    "tipo_recurso",
    mapping={
        TipoRecursoEnum.COMERCIAL: RecursoComercialRead.schema(),
        TipoRecursoEnum.OPERATIVO: RecursoOperativoRead.schema(),
    },
)


# --- 3. ESQUEMAS DE ACTUALIZACIÓN (Opcional pero recomendado) ---
# Similar a Create, pero todos los campos son opcionales

class RecursoComercialUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=255)
    descripcion: Optional[str] = None
    categoria: Optional[str] = Field(None, max_length=100)
    fecha_adquisicion: Optional[date] = None
    costo_adquisicion: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    observacion: Optional[str] = None
    precio_venta: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    # No incluimos stock_inicial, ya que el stock se maneja con 'stock_actual'
    stock_actual: Optional[int] = Field(None, ge=0) 
    sku: Optional[str] = Field(None, max_length=100)

class RecursoOperativoUpdate(BaseModel):
    nombre: Optional[str] = Field(None, max_length=255)
    descripcion: Optional[str] = None
    categoria: Optional[str] = Field(None, max_length=100)
    fecha_adquisicion: Optional[date] = None
    costo_adquisicion: Optional[Decimal] = Field(None, ge=0, decimal_places=2)
    observacion: Optional[str] = None
    codigo_activo: Optional[str] = Field(None, max_length=100)
    estado: Optional[EstadoActivoEnum] = None
    ubicacion: Optional[str] = Field(None, max_length=255)
    id_usuario_responsable: Optional[int] = None