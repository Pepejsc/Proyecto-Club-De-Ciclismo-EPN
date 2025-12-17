from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import func, extract
from datetime import datetime, timedelta
import calendar

from app.db.database import get_db
from app.models.domain.finanzas import FinancialTransaction
from app.models.domain.venta import SaleOrder, SaleOrderItem
from app.models.domain.recurso import Recurso
from app.models.schema.finanzas import BalanceResponse, TransactionCreate

router = APIRouter()

# --- 1. ENDPOINT PARA REGISTRAR (SOLUCIÓN ERROR 404) ---
@router.post("/", status_code=status.HTTP_201_CREATED)
def registrar_movimiento(transaccion: TransactionCreate, db: Session = Depends(get_db)):
    """
    Registra un ingreso o gasto manual.
    Ruta: POST /finanzas/
    """
    nuevo_mov = FinancialTransaction(
        tipo=transaccion.tipo,
        categoria=transaccion.categoria,
        monto=transaccion.monto,
        descripcion=transaccion.descripcion
    )
    db.add(nuevo_mov)
    db.commit()
    db.refresh(nuevo_mov)
    return {"message": "Movimiento registrado correctamente", "data": nuevo_mov}


# --- FUNCIONES AUXILIARES ---
def obtener_totales_mes(db: Session, year: int, month: int):
    """Suma ingresos y egresos de un mes específico corrigiendo tipos"""
    
    # 1. Ventas Web (PAID)
    v_result = db.query(func.sum(SaleOrder.total_amount))\
        .filter(SaleOrder.status == 'PAID')\
        .filter(extract('month', SaleOrder.created_at) == month)\
        .filter(extract('year', SaleOrder.created_at) == year)\
        .scalar()
    ventas = float(v_result or 0.0)

    # 2. Otros Ingresos Manuales
    o_result = db.query(func.sum(FinancialTransaction.monto))\
        .filter(FinancialTransaction.tipo == 'INGRESO')\
        .filter(extract('month', FinancialTransaction.fecha_registro) == month)\
        .filter(extract('year', FinancialTransaction.fecha_registro) == year)\
        .scalar()
    otros = float(o_result or 0.0)

    # 3. Egresos
    e_result = db.query(func.sum(FinancialTransaction.monto))\
        .filter(FinancialTransaction.tipo == 'EGRESO')\
        .filter(extract('month', FinancialTransaction.fecha_registro) == month)\
        .filter(extract('year', FinancialTransaction.fecha_registro) == year)\
        .scalar()
    egresos = float(e_result or 0.0)

    return (ventas + otros, egresos)


# --- 2. ENDPOINT DE BALANCE (REPORTES) ---
@router.get("/balance", response_model=BalanceResponse)
def obtener_reporte_financiero(db: Session = Depends(get_db)):
    
    # A. HISTÓRICO GRÁFICO (12 MESES)
    grafico_data = []
    hoy = datetime.now()
    
    for i in range(11, -1, -1):
        fecha_cursor = hoy - timedelta(days=30 * i)
        year, month = fecha_cursor.year, fecha_cursor.month
        
        ing, egr = obtener_totales_mes(db, year, month)
        nombre_mes = calendar.month_name[month][:3]
        
        grafico_data.append({
            "name": nombre_mes,
            "ingresos": ing,
            "egresos": egr
        })

    # B. TENDENCIAS (MES ACTUAL VS ANTERIOR)
    mes_actual_ing, mes_actual_egr = obtener_totales_mes(db, hoy.year, hoy.month)
    
    first = hoy.replace(day=1)
    last_month_date = first - timedelta(days=1)
    mes_anterior_ing, mes_anterior_egr = obtener_totales_mes(db, last_month_date.year, last_month_date.month)

    def calcular_trend(actual, anterior):
        if anterior == 0: return 100.0 if actual > 0 else 0.0
        return ((actual - anterior) / anterior) * 100

    trend_ingresos = calcular_trend(mes_actual_ing, mes_anterior_ing)
    trend_egresos = calcular_trend(mes_actual_egr, mes_anterior_egr)

    # C. TOTALES ACUMULADOS
    v_total_db = db.query(func.sum(SaleOrder.total_amount)).filter(SaleOrder.status == 'PAID').scalar()
    total_ventas = float(v_total_db or 0.0)

    o_total_db = db.query(func.sum(FinancialTransaction.monto)).filter(FinancialTransaction.tipo == 'INGRESO').scalar()
    total_otros = float(o_total_db or 0.0)

    e_total_db = db.query(func.sum(FinancialTransaction.monto)).filter(FinancialTransaction.tipo == 'EGRESO').scalar()
    total_egresos_hist = float(e_total_db or 0.0)
    
    ingresos_totales = total_ventas + total_otros
    egresos_totales = total_egresos_hist
    balance_neto = ingresos_totales - egresos_totales

    # Auspicios Total
    a_total_db = db.query(func.sum(FinancialTransaction.monto))\
        .filter(FinancialTransaction.tipo == 'INGRESO', FinancialTransaction.categoria == 'AUSPICIO')\
        .scalar()
    total_auspicios = float(a_total_db or 0.0)

    cantidad_auspicios = db.query(FinancialTransaction)\
        .filter(FinancialTransaction.tipo == 'INGRESO', FinancialTransaction.categoria == 'AUSPICIO')\
        .count()

    # Membresias Total (Dinero)
    m_total_db = db.query(func.sum(FinancialTransaction.monto))\
        .filter(FinancialTransaction.tipo == 'INGRESO', FinancialTransaction.categoria == 'MEMBRESIA')\
        .scalar()
    total_membresias = float(m_total_db or 0.0)

    # D. TOP PRODUCTOS
    top_query = db.query(
        Recurso.nombre,
        func.sum(SaleOrderItem.quantity).label("qty"),
        func.sum(SaleOrderItem.subtotal).label("money")
    ).join(Recurso, SaleOrderItem.resource_id == Recurso.id_recurso)\
     .join(SaleOrder, SaleOrderItem.sale_id == SaleOrder.id_sale)\
     .filter(SaleOrder.status == 'PAID')\
     .group_by(Recurso.id_recurso)\
     .order_by(func.sum(SaleOrderItem.quantity).desc())\
     .limit(5).all()

    top_list = [{"nombre": r.nombre, "cantidad_vendida": int(r.qty), "ingresos_generados": float(r.money)} for r in top_query]

    return {
        "resumen": {
            "ingresos_totales": ingresos_totales,
            "egresos_totales": egresos_totales,
            "balance_neto": balance_neto,
            "margen": 0
        },
        "kpis_calculados": {
            "ingresos": {"value": ingresos_totales, "trend_percent": trend_ingresos, "trend_direction": "up" if trend_ingresos >= 0 else "down"},
            "egresos": {"value": egresos_totales, "trend_percent": trend_egresos, "trend_direction": "up" if trend_egresos >= 0 else "down"},
            "auspicios": {"value": total_auspicios, "count": cantidad_auspicios,"trend_percent": 0, "trend_direction": "neutral"}
        },
        "grafico": grafico_data,
        "top_productos": top_list,
        "total_membresias_dinero": total_membresias,
        "desglose_ingresos": {}, "desglose_egresos": {}
    }