from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, extract, cast, Date
from datetime import datetime, timedelta, date
import calendar
from typing import Optional

from app.db.database import get_db
from app.core.security import get_current_user
from app.models.domain.user import User, Role

# --- MODELOS ---
from app.models.domain.finanzas import FinancialTransaction
from app.models.domain.venta import SaleOrder, SaleOrderItem
from app.models.domain.recurso import Recurso, TipoRecursoEnum
from app.models.domain.membership import Membership, MembershipStatus
from app.models.schema.finanzas import BalanceResponse, TransactionCreate

router = APIRouter()

# ==============================================================================
# FUNCIONES AUXILIARES (HELPER FUNCTIONS)
# ==============================================================================

def obtener_totales_mes(db: Session, year: int, month: int):
    """
    Calcula los ingresos y egresos totales de un mes específico.
    Usada para el gráfico histórico.
    """
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

def aplicar_filtro_fechas(query, modelo_fecha, start_date: date = None, end_date: date = None):
    """
    Aplica filtros de rango de fecha a una consulta SQLAlchemy de forma dinámica.
    """
    if start_date:
        query = query.filter(cast(modelo_fecha, Date) >= start_date)
    if end_date:
        query = query.filter(cast(modelo_fecha, Date) <= end_date)
    return query

# ==============================================================================
# 1. ENDPOINT UNIFICADO (LISTA DE REGISTROS)
# ==============================================================================
@router.get("/registros-unificados")
def obtener_registros_financieros(
    filtro: str = "TODOS", 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != Role.ADMIN:
        raise HTTPException(status_code=403, detail="Acceso denegado")

    transacciones = []

    # A. VENTAS (INGRESOS REALES Y PENDIENTES)
    if filtro in ["TODOS", "VENTAS", "INGRESOS"]:
        ventas = db.query(SaleOrder).all() 
        for v in ventas:
            transacciones.append({
                "id": f"VEN-{v.id_sale}",
                "fecha": v.created_at,
                "categoria": "Venta Producto",
                "descripcion": f"Orden #{v.id_sale} - {v.customer_name}",
                "tipo": "INGRESO",
                "monto": float(v.total_amount),
                "estado": v.status,
                "cliente": v.customer_name,
                "telefono": v.customer_phone
            })

    # B. MEMBRESÍAS (INFORMATIVO)
    if filtro in ["TODOS", "MEMBRESIAS", "INGRESOS"]:
        membresias = db.query(Membership).filter(
            Membership.status.in_([MembershipStatus.ACTIVE, MembershipStatus.INACTIVE])
        ).all()
        for m in membresias:
            transacciones.append({
                "id": f"MEM-{m.id}",
                "fecha": m.created_at, 
                "categoria": "Membresía",
                "descripcion": f"Registro {m.membership_type.value} - Usuario ID {m.user_id}",
                "tipo": "INSCRIPCION",
                "monto": 0.00,
                "estado": m.status.value
            })

    # C. GASTOS OPERATIVOS / RECURSOS
    if filtro in ["TODOS", "GASTOS", "EGRESOS"]:
        gastos = db.query(Recurso).filter(
            Recurso.tipo_recurso == TipoRecursoEnum.OPERATIVO,
            Recurso.costo_adquisicion > 0
        ).all()
        for g in gastos:
            fecha_gasto = datetime.combine(g.fecha_adquisicion, datetime.min.time()) if g.fecha_adquisicion else g.creado_en
            transacciones.append({
                "id": f"REC-{g.id_recurso}",
                "fecha": fecha_gasto,
                "categoria": "Gasto Operativo",
                "descripcion": f"Compra: {g.nombre} ({g.categoria or 'Equipo'})",
                "tipo": "EGRESO",
                "monto": float(g.costo_adquisicion),
                "estado": "Registrado"
            })

    # D. TRANSACCIONES MANUALES
    query_manual = db.query(FinancialTransaction)
    if filtro == "GASTOS":
        query_manual = query_manual.filter(FinancialTransaction.tipo == 'EGRESO')
    elif filtro == "VENTAS" or filtro == "MEMBRESIAS":
        if filtro == "VENTAS": query_manual = query_manual.filter(1==0) 
        if filtro == "MEMBRESIAS": query_manual = query_manual.filter(1==0)
    
    manuales = query_manual.all()

    for t in manuales:
        transacciones.append({
            "id": f"MAN-{t.id_transaccion}", 
            "fecha": t.fecha_registro,
            "categoria": t.categoria,
            "descripcion": t.descripcion,
            "tipo": t.tipo,
            "monto": float(t.monto),
            "estado": "Registrado"
        })

    transacciones_ordenadas = sorted(
        transacciones, 
        key=lambda x: x['fecha'] if x['fecha'] else datetime.min, 
        reverse=True
    )

    return transacciones_ordenadas

# ==============================================================================
# 2. ENDPOINT REGISTRO MANUAL
# ==============================================================================
@router.post("/", status_code=status.HTTP_201_CREATED)
def registrar_movimiento(transaccion: TransactionCreate, db: Session = Depends(get_db)):
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

# ==============================================================================
# 3. ENDPOINT BALANCE / REPORTE FINANCIERO (CON FILTROS)
# ==============================================================================
@router.get("/balance", response_model=BalanceResponse)
def obtener_reporte_financiero(
    start_date: Optional[date] = None,
    end_date: Optional[date] = None,
    db: Session = Depends(get_db)
):
    
    # A. HISTÓRICO GRÁFICO (Siempre últimos 12 meses para contexto)
    grafico_data = []
    hoy = datetime.now()
    
    for i in range(11, -1, -1):
        fecha_cursor = hoy - timedelta(days=30 * i)
        year, month = fecha_cursor.year, fecha_cursor.month
        
        # Aquí usamos la función que faltaba
        ing, egr = obtener_totales_mes(db, year, month)
        nombre_mes = calendar.month_name[month][:3]
        
        grafico_data.append({
            "name": nombre_mes,
            "ingresos": ing,
            "egresos": egr
        })

    # B. TENDENCIAS (KPIs)
    mes_actual_ing, mes_actual_egr = obtener_totales_mes(db, hoy.year, hoy.month)
    first = hoy.replace(day=1)
    last_month_date = first - timedelta(days=1)
    mes_anterior_ing, mes_anterior_egr = obtener_totales_mes(db, last_month_date.year, last_month_date.month)

    def calcular_trend(actual, anterior):
        if anterior == 0: return 100.0 if actual > 0 else 0.0
        return ((actual - anterior) / anterior) * 100

    trend_ingresos = calcular_trend(mes_actual_ing, mes_anterior_ing)
    trend_egresos = calcular_trend(mes_actual_egr, mes_anterior_egr)

    # C. TOTALES CON FILTRO (Aquí aplicamos el rango de fechas seleccionado)
    
    # 1. Ventas
    q_ventas = db.query(func.sum(SaleOrder.total_amount)).filter(SaleOrder.status == 'PAID')
    q_ventas = aplicar_filtro_fechas(q_ventas, SaleOrder.created_at, start_date, end_date)
    total_ventas = float(q_ventas.scalar() or 0.0)

    # 2. Otros Ingresos
    q_otros = db.query(func.sum(FinancialTransaction.monto)).filter(FinancialTransaction.tipo == 'INGRESO')
    q_otros = aplicar_filtro_fechas(q_otros, FinancialTransaction.fecha_registro, start_date, end_date)
    total_otros = float(q_otros.scalar() or 0.0)

    # 3. Egresos
    q_egresos = db.query(func.sum(FinancialTransaction.monto)).filter(FinancialTransaction.tipo == 'EGRESO')
    q_egresos = aplicar_filtro_fechas(q_egresos, FinancialTransaction.fecha_registro, start_date, end_date)
    
    q_recursos = db.query(func.sum(Recurso.costo_adquisicion)).filter(Recurso.tipo_recurso == TipoRecursoEnum.OPERATIVO)
    q_recursos = aplicar_filtro_fechas(q_recursos, Recurso.fecha_adquisicion, start_date, end_date)
    
    total_egresos_calc = float(q_egresos.scalar() or 0.0) + float(q_recursos.scalar() or 0.0)
    
    ingresos_totales = total_ventas + total_otros
    egresos_totales = total_egresos_calc
    balance_neto = ingresos_totales - egresos_totales

    # D. AUSPICIOS
    q_auspicios_monto = db.query(func.sum(FinancialTransaction.monto)).filter(FinancialTransaction.tipo == 'INGRESO', FinancialTransaction.categoria == 'AUSPICIO')
    q_auspicios_monto = aplicar_filtro_fechas(q_auspicios_monto, FinancialTransaction.fecha_registro, start_date, end_date)
    total_auspicios = float(q_auspicios_monto.scalar() or 0.0)

    q_auspicios_count = db.query(FinancialTransaction).filter(FinancialTransaction.tipo == 'INGRESO', FinancialTransaction.categoria == 'AUSPICIO')
    q_auspicios_count = aplicar_filtro_fechas(q_auspicios_count, FinancialTransaction.fecha_registro, start_date, end_date)
    cantidad_auspicios = q_auspicios_count.count()

    # E. TOP PRODUCTOS
    top_query = db.query(
        Recurso.nombre,
        func.sum(SaleOrderItem.quantity).label("qty"),
        func.sum(SaleOrderItem.subtotal).label("money")
    ).join(Recurso, SaleOrderItem.resource_id == Recurso.id_recurso)\
     .join(SaleOrder, SaleOrderItem.sale_id == SaleOrder.id_sale)\
     .filter(SaleOrder.status == 'PAID')
    
    top_query = aplicar_filtro_fechas(top_query, SaleOrder.created_at, start_date, end_date)

    top_query = top_query.group_by(Recurso.id_recurso)\
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
            "ingresos": {"value": ingresos_totales, "trend_percent": trend_ingresos},
            "egresos": {"value": egresos_totales, "trend_percent": trend_egresos},
            "auspicios": {"value": total_auspicios, "count": cantidad_auspicios}
        },
        "grafico": grafico_data,
        "top_productos": top_list,
        "total_membresias_dinero": 0,
        "desglose_ingresos": {}, "desglose_egresos": {}
    }