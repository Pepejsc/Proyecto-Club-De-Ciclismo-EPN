from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

# Para crear una transacción nueva
class TransactionCreate(BaseModel):
    tipo: str  # INGRESO | EGRESO
    categoria: str
    monto: float
    descripcion: Optional[str] = None

# Para leer una transacción
class TransactionRead(TransactionCreate):
    id_transaccion: int
    fecha_registro: datetime

    class Config:
        from_attributes = True

class TopProucto(BaseModel):
    nombre: str
    cantidad_vendida: int
    ingresos_generados: float

class ChartPoint(BaseModel):
    name: str
    ingresos: float
    egresos: float

class KPIData(BaseModel):
    value: float
    trend_percent: float
    trend_direction: str

class BalanceResponse(BaseModel):
    resumen: dict  # {ingresos, egresos, balance, margen}
    kpis_calculados: dict  # {ingresos, egresos, balance, margen}
    grafico: List[ChartPoint]
    top_productos: List[TopProucto]

'''
class BalanceResponse(BaseModel):
    resumen: dict # {ingresos, egresos, balance, margen}
    desglose_ingresos: dict
    desglose_egresos: dict
    top_productos: List[TopProucto]
    total_auspicios: float
    total_membresias_dinero: float'''