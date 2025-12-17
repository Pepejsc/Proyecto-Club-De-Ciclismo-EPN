from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, Text
from sqlalchemy.sql import func
from app.db.database import Base
import enum

# Definimos los tipos para restringir valores y evitar errores
class TipoTransaccion(str, enum.Enum):
    INGRESO = "INGRESO"
    EGRESO = "EGRESO"

class CategoriaFinanciera(str, enum.Enum):
    # Ingresos
    VENTA_PRODUCTO = "VENTA_PRODUCTO" # Automático desde el carrito
    MEMBRESIA = "MEMBRESIA"           # Cobro de cuotas
    AUSPICIO = "AUSPICIO"             # Pago de sponsors
    DONACION = "DONACION"             # Donaciones
    OTRO_INGRESO = "OTRO_INGRESO"
    
    # Egresos
    OPERATIVO = "OPERATIVO"           # Luz, agua, internet
    MANTENIMIENTO = "MANTENIMIENTO"   # Arreglo de bicis
    EQUIPAMIENTO = "EQUIPAMIENTO"     # Compra de activos
    MARKETING = "MARKETING"           # Publicidad
    OTRO_GASTO = "OTRO_GASTO"

class FinancialTransaction(Base):
    __tablename__ = "financial_transactions"

    id_transaccion = Column(Integer, primary_key=True, index=True)
    tipo = Column(String(20), nullable=False) # INGRESO o EGRESO
    categoria = Column(String(50), nullable=False) 
    monto = Column(Float, nullable=False)
    descripcion = Column(Text, nullable=True)
    fecha_registro = Column(DateTime, server_default=func.now())
    
    # Opcional: Usuario que registró el movimiento (Admin)
    registrado_por = Column(String(100), nullable=True)