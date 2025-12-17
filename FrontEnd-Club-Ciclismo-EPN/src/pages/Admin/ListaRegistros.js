import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "../../assets/Styles/Admin/ListaResgistros.css";
const apiUrl = process.env.REACT_APP_API_URL;

const GestionVentas = () => {
  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState("PENDING");

  // Estado para el modal de finanzas
  const [showFinanceModal, setShowFinanceModal] = useState(false);
  const [nuevoMov, setNuevoMov] = useState({
    tipo: "EGRESO",
    categoria: "OPERATIVO",
    monto: "",
    descripcion: "",
  });

  const mostrarColumnaAcciones = filtro === "PENDING";

  useEffect(() => {
    fetchOrdenes();
  }, [filtro]);

  const fetchOrdenes = async () => {
    setLoading(true);
    try {
      let url = `${apiUrl}/ventas/`;
      if (filtro !== "ALL") url += `?status=${filtro}`;
      const res = await fetch(url);
      const data = await res.json();
      setOrdenes(data);
    } catch (error) {
      console.error(error);
      toast.error("Error cargando ventas");
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmar = async (orden) => {
    if (!window.confirm(`¿Confirmar pago de la Orden #${orden.id_sale}?`))
      return;
    try {
      const res = await fetch(`${apiUrl}/ventas/${orden.id_sale}/confirmar`, {
        method: "PUT",
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Orden #${orden.id_sale} procesada`);
        let telefono = orden.customer_phone
          ? orden.customer_phone.replace(/\D/g, "")
          : "";
        if (telefono.startsWith("09") && telefono.length === 10)
          telefono = "593" + telefono.substring(1);
        if (telefono && telefono.length >= 9) {
          let mensaje =
            `Hola *${orden.customer_name}*, le saludamos del Club de Ciclismo EPN 🚴‍♂️.\n\n` +
            `✅ *PAGO VERIFICADO* para la Orden #${orden.id_sale}.\n`;
          if (data.invoice_url)
            mensaje += `📄 *Factura:* ${data.invoice_url}\n\n`;
          mensaje += `Gracias por su compra!`;
          window.open(
            `https://api.whatsapp.com/send?phone=${telefono}&text=${encodeURIComponent(
              mensaje
            )}`,
            "_blank"
          );
        }
        fetchOrdenes();
      } else {
        toast.error("Error: " + (data.detail || "No se pudo confirmar"));
      }
    } catch (error) {
      toast.error("Error de conexión");
    }
  };

  const handleCancelar = async (id) => {
    if (!window.confirm(`¿Cancelar Orden #${id}?`)) return;
    try {
      const res = await fetch(`${apiUrl}/ventas/${id}/cancelar`, {
        method: "PUT",
      });
      if (res.ok) {
        toast.info(`Orden #${id} cancelada`);
        fetchOrdenes();
      }
    } catch (error) {
      toast.error("Error al cancelar");
    }
  };

  const handleRegistrarMovimiento = async (e) => {
    e.preventDefault();
    if (!nuevoMov.monto || !nuevoMov.descripcion)
      return toast.warning("Completa campos");
    try {
      const res = await fetch(`${apiUrl}/finanzas/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoMov),
      });
      if (res.ok) {
        toast.success("Movimiento registrado");
        setShowFinanceModal(false);
        setNuevoMov({
          tipo: "EGRESO",
          categoria: "OPERATIVO",
          monto: "",
          descripcion: "",
        });
      }
    } catch (error) {
      toast.error("Error conexión");
    }
  };

  return (
    <div className="gestion-ventas-container">
      {/* Título solo */}
      <h1 className="main-title">Lista de Registros</h1>

      {/* BARRA DE CONTROLES (Filtros + Botón Nuevo al final) */}
      <div className="sales-controls">
        <div className="filters-group">
          <button
            className={`filter-btn ${filtro === "PENDING" ? "active" : ""}`}
            onClick={() => setFiltro("PENDING")}
          >
            <i className="fas fa-clock"></i> Pendientes
          </button>
          <button
            className={`filter-btn ${filtro === "PAID" ? "active" : ""}`}
            onClick={() => setFiltro("PAID")}
            style={
              filtro === "PAID"
                ? {
                    background: "#10B981",
                    borderColor: "#10B981",
                    color: "white",
                  }
                : {}
            }
          >
            <i className="fas fa-check-circle"></i> Pagadas
          </button>
          <button
            className={`filter-btn ${filtro === "CANCELLED" ? "active" : ""}`}
            onClick={() => setFiltro("CANCELLED")}
            style={
              filtro === "CANCELLED"
                ? {
                    background: "#EF4444",
                    borderColor: "#EF4444",
                    color: "white",
                  }
                : {}
            }
          >
            <i className="fas fa-ban"></i> Canceladas
          </button>
          <button
            className={`filter-btn ${filtro === "ALL" ? "active" : ""}`}
            onClick={() => setFiltro("ALL")}
            style={
              filtro === "ALL"
                ? {
                    background: "#64748B",
                    borderColor: "#64748B",
                    color: "white",
                  }
                : {}
            }
          >
            <i className="fas fa-list"></i> Historial
          </button>
        </div>

        {/* Botón de Acción Principal (Alineado a la derecha mediante CSS) */}
        <button
          className="filter-btn btn-new"
          onClick={() => setShowFinanceModal(true)}
        >
          <i className="fas fa-plus-circle"></i> Nuevo Registro
        </button>
      </div>

      <div className="sales-card">
        {loading ? (
          <div className="empty-state">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Cargando órdenes...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>Orden</th>
                  <th>Cliente</th>
                  <th>Fecha</th>
                  <th>Detalle</th>
                  <th>Total</th>
                  <th>Estado</th>
                  {mostrarColumnaAcciones && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {ordenes.length > 0 ? (
                  ordenes.map((orden) => (
                    <tr key={orden.id_sale}>
                      <td className="col-id">#{orden.id_sale}</td>
                      <td>
                        <div className="client-info">
                          <h4>{orden.customer_name}</h4>
                          <div className="client-phone">
                            <i className="fab fa-whatsapp"></i>{" "}
                            {orden.customer_phone}
                          </div>
                        </div>
                      </td>
                      <td>{new Date(orden.created_at).toLocaleDateString()}</td>
                      <td>
                        <ul className="items-list">
                          {orden.items.map((item) => (
                            <li key={item.id_item} className="item-row">
                              <span className="item-qty">{item.quantity}x</span>
                              <span>{item.product_name}</span>
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="total-amount">
                        ${orden.total_amount.toFixed(2)}
                      </td>
                      <td>
                        <span className={`status-badge ${orden.status}`}>
                          {orden.status}
                        </span>
                      </td>
                      {mostrarColumnaAcciones && (
                        <td>
                          <div className="actions-group">
                            <button
                              className="action-btn btn-confirm"
                              onClick={() => handleConfirmar(orden)}
                            >
                              <i className="fas fa-check"></i>
                            </button>
                            <button
                              className="action-btn btn-cancel"
                              onClick={() => handleCancelar(orden.id_sale)}
                            >
                              <i className="fas fa-times"></i>
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={mostrarColumnaAcciones ? 7 : 6}>
                      <div className="empty-state">
                        <p>No hay órdenes.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL PARA REGISTRO MANUAL --- */}
      {showFinanceModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button
              className="modal-close-x"
              onClick={() => setShowFinanceModal(false)}
            >
              <i className="fas fa-times"></i>
            </button>
            <h3>Registrar Movimiento Manual</h3>
            <p className="modal-subtitle">
              Gastos operativos o ingresos extra.
            </p>

            <form onSubmit={handleRegistrarMovimiento} className="finance-form">
              <div>
                <label>Tipo</label>
                <select
                  value={nuevoMov.tipo}
                  onChange={(e) =>
                    setNuevoMov({ ...nuevoMov, tipo: e.target.value })
                  }
                >
                  <option value="EGRESO">🔴 Gasto (Salida)</option>
                  <option value="INGRESO">🟢 Ingreso Extra</option>
                </select>
              </div>
              <div>
                <label>Categoría</label>
                <select
                  value={nuevoMov.categoria}
                  onChange={(e) =>
                    setNuevoMov({ ...nuevoMov, categoria: e.target.value })
                  }
                >
                  {nuevoMov.tipo === "EGRESO" ? (
                    <>
                      <option value="OPERATIVO">
                        Gastos Operativos (Luz, Agua)
                      </option>
                      <option value="MANTENIMIENTO">Mantenimiento</option>
                      <option value="EQUIPAMIENTO">Equipos</option>
                      <option value="MARKETING">Marketing</option>
                    </>
                  ) : (
                    <>
                      <option value="DONACION">Donación</option>
                      <option value="OTRO_INGRESO">Otros</option>
                    </>
                  )}
                </select>
              </div>
              <div>
                <label>Monto ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={nuevoMov.monto}
                  onChange={(e) =>
                    setNuevoMov({
                      ...nuevoMov,
                      monto: parseFloat(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label>Descripción</label>
                <input
                  type="text"
                  placeholder="Ej: Pago internet CNT"
                  value={nuevoMov.descripcion}
                  onChange={(e) =>
                    setNuevoMov({ ...nuevoMov, descripcion: e.target.value })
                  }
                />
              </div>
              <button type="submit" className="btn-save">
                Guardar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionVentas;
