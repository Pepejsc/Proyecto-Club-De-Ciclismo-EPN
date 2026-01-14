import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";
import "../../assets/Styles/Admin/ListaResgistros.css";

import {
  fetchFinancialRecords,
  createFinancialTransaction,
  confirmSale,
  cancelSale,
} from "../../services/financialService";

const GestionFinanciera = () => {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroActivo, setFiltroActivo] = useState("TODOS");
  const [showFinanceModal, setShowFinanceModal] = useState(false);

  // NUEVO: Estado para el Modal de Confirmación
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    idSale: null,
    telefono: null,
    cliente: null,
  });

  const [nuevoMov, setNuevoMov] = useState({
    tipo: "EGRESO",
    categoria: "OPERATIVO",
    monto: "",
    descripcion: "",
  });

  const mostrarAcciones = filtroActivo === "VENTAS";

  useEffect(() => {
    cargarDatos();
  }, [filtroActivo]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await fetchFinancialRecords(filtroActivo);
      setRegistros(data);
    } catch (error) {
      if (error.message === "401") {
        toast.error("Sesión expirada. Vuelve a ingresar.");
      } else {
        toast.error("Error cargando registros");
      }
    } finally {
      setLoading(false);
    }
  };

  // --- 1. ABRIR EL MODAL (EN LUGAR DE window.confirm) ---
  const clickBotonConfirmar = (idCompuesto, telefono, cliente) => {
    const idSale = idCompuesto.split("-")[1];
    setConfirmModal({
      isOpen: true,
      idSale,
      telefono,
      cliente,
    });
  };

  // --- 2. EJECUTAR LA CONFIRMACIÓN REAL ---
  const ejecutarConfirmacion = async () => {
    const { idSale, telefono, cliente } = confirmModal;

    try {
      setLoading(true); // Opcional: mostrar carga mientras procesa
      const data = await confirmSale(idSale);
      toast.success(`Orden #${idSale} confirmada con éxito`);

      // Lógica de WhatsApp
      let tel = telefono ? telefono.replace(/\D/g, "") : "";
      if (tel.startsWith("09") && tel.length === 10)
        tel = "593" + tel.substring(1);

      if (tel && tel.length >= 9) {
        let mensaje = `Hola *${
          cliente || "Cliente"
        }*, le saludamos del Club de Ciclismo EPN 🚴‍♂️.\n\n✅ *PAGO VERIFICADO* para la Orden #${idSale}.\n`;
        if (data.invoice_url)
          mensaje += `📄 *Factura:* ${data.invoice_url}\n\n`;
        mensaje += `¡Gracias por su compra!`;
        window.open(
          `https://api.whatsapp.com/send?phone=${tel}&text=${encodeURIComponent(
            mensaje
          )}`,
          "_blank"
        );
      }

      // Cerrar modal y recargar
      setConfirmModal({
        isOpen: false,
        idSale: null,
        telefono: null,
        cliente: null,
      });
      cargarDatos();
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelarVenta = async (idCompuesto) => {
    const idSale = idCompuesto.split("-")[1];
    if (
      !window.confirm(
        `¿Seguro que deseas CANCELAR la Orden #${idSale}? Esto no se puede deshacer.`
      )
    )
      return;
    try {
      await cancelSale(idSale);
      toast.info(`Orden #${idSale} cancelada`);
      cargarDatos();
    } catch (error) {
      toast.error("Error al cancelar");
    }
  };

  const handleRegistrarMovimiento = async (e) => {
    e.preventDefault();
    if (!nuevoMov.monto || !nuevoMov.descripcion)
      return toast.warning("Completa campos");

    try {
      await createFinancialTransaction(nuevoMov);
      toast.success("Movimiento registrado");
      setShowFinanceModal(false);
      setNuevoMov({
        tipo: "EGRESO",
        categoria: "OPERATIVO",
        monto: "",
        descripcion: "",
      });
      cargarDatos();
    } catch (error) {
      toast.error("Error al guardar");
    }
  };

  const descargarExcel = () => {
    const hoja = XLSX.utils.json_to_sheet(registros);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Finanzas");
    XLSX.writeFile(
      libro,
      `Reporte_${filtroActivo}_${new Date().toLocaleDateString()}.xlsx`
    );
  };

  const money = (val) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);

  return (
    <div className="gestion-ventas-container">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h1 className="main-title">Gestión Financiera</h1>
        <button
          className="filter-btn"
          style={{ backgroundColor: "#10B981", color: "white", border: "none" }}
          onClick={descargarExcel}
        >
          <i className="fas fa-file-excel"></i> Descargar Reporte
        </button>
      </div>

      <div className="sales-controls">
        <div className="filters-group">
          {["TODOS", "VENTAS", "MEMBRESIAS", "GASTOS"].map((tab) => (
            <button
              key={tab}
              className={`filter-btn ${filtroActivo === tab ? "active" : ""}`}
              onClick={() => setFiltroActivo(tab)}
            >
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
        <button
          className="filter-btn btn-new"
          onClick={() => setShowFinanceModal(true)}
        >
          <i className="fas fa-plus-circle"></i> Nuevo Movimiento
        </button>
      </div>

      <div className="sales-card">
        {loading ? (
          <div className="empty-state">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Cargando datos...</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="sales-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Fecha</th>
                  <th>Categoría</th>
                  <th>Descripción / Cliente</th>
                  <th>Tipo</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  {mostrarAcciones && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {registros.length > 0 ? (
                  registros.map((row, index) => (
                    <tr key={index}>
                      <td className="col-id">{row.id}</td>
                      <td>{new Date(row.fecha).toLocaleDateString()}</td>
                      <td>
                        <span
                          style={{
                            background: "#F1F5F9",
                            color: "#475569",
                            padding: "3px 8px",
                            borderRadius: "6px",
                            fontSize: "0.75rem",
                            fontWeight: "600",
                            border: "1px solid #E2E8F0",
                          }}
                        >
                          {row.categoria}
                        </span>
                      </td>
                      <td style={{ maxWidth: "300px", whiteSpace: "normal" }}>
                        {row.descripcion}
                      </td>
                      <td>
                        <span
                          style={{
                            color:
                              row.tipo === "EGRESO" ? "#EF4444" : "#10B981",
                            fontWeight: "bold",
                            fontSize: "0.8rem",
                          }}
                        >
                          {row.tipo}
                        </span>
                      </td>
                      <td
                        style={{
                          color: row.tipo === "EGRESO" ? "#EF4444" : "#10B981",
                          fontWeight: "bold",
                          fontFamily: "monospace",
                          fontSize: "0.9rem",
                        }}
                      >
                        {row.tipo === "EGRESO" ? "-" : "+"} {money(row.monto)}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${
                            row.estado === "PENDING" ? "PENDING" : row.estado
                          }`}
                        >
                          {row.estado}
                        </span>
                      </td>

                      {mostrarAcciones && (
                        <td>
                          {row.id.startsWith("VEN-") &&
                          row.estado === "PENDING" ? (
                            <div className="actions-group">
                              {/* USAMOS LA NUEVA FUNCIÓN PARA ABRIR MODAL */}
                              <button
                                className="action-btn btn-confirm"
                                title="Confirmar Pago"
                                onClick={() =>
                                  clickBotonConfirmar(
                                    row.id,
                                    row.telefono,
                                    row.cliente
                                  )
                                }
                              >
                                <i className="fas fa-check"></i>
                              </button>

                              <button
                                className="action-btn btn-cancel"
                                title="Cancelar Orden"
                                onClick={() => handleCancelarVenta(row.id)}
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: "#CBD5E1" }}>-</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8">
                      <div className="empty-state">
                        <p>No hay registros.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL DE REGISTRO MANUAL --- */}
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
            <form onSubmit={handleRegistrarMovimiento} className="finance-form">
              {/* ... (Mismo formulario de antes) ... */}
              <div>
                <label>Tipo</label>
                <select
                  value={nuevoMov.tipo}
                  onChange={(e) =>
                    setNuevoMov({ ...nuevoMov, tipo: e.target.value })
                  }
                >
                  <option value="EGRESO">🔴 Gasto</option>
                  <option value="INGRESO">🟢 Ingreso</option>
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
                      <option value="OPERATIVO">Servicios (Luz/Agua)</option>
                      <option value="MANTENIMIENTO">Mantenimiento</option>
                      <option value="EQUIPAMIENTO">Equipos</option>
                      <option value="MARKETING">Publicidad</option>
                    </>
                  ) : (
                    <>
                      <option value="DONACION">Donación</option>
                      <option value="AUSPICIO">Auspicio</option>
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
                  value={nuevoMov.descripcion}
                  onChange={(e) =>
                    setNuevoMov({ ...nuevoMov, descripcion: e.target.value })
                  }
                />
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  className="btn-cancel-modal"
                  onClick={() => setShowFinanceModal(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn-save">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DE CONFIRMACIÓN MEJORADO --- */}
      {confirmModal.isOpen && (
        <div className="modal-overlay">
          <div
            className="modal-content"
            style={{
              maxWidth: "450px",
              textAlign: "center",
              padding: "3rem 2.5rem",
              borderRadius: "20px",
            }}
          >
            {/* 1. Ícono más grande y con más espacio */}
            <div
              style={{
                fontSize: "4rem",
                color: "#10B981",
                marginBottom: "1.5rem",
              }}
            >
              <i className="fas fa-check-circle"></i>
            </div>

            {/* 2. Título más prominente */}
            <h2
              style={{
                marginBottom: "1rem",
                color: "#111827",
                fontWeight: "800",
                fontSize: "1.8rem",
              }}
            >
              Confirmar Pago
            </h2>

            {/* 3. Texto de confirmación (CENTRADO FORZADO) */}
            <div
              style={{
                marginBottom: "2.5rem",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <p
                style={{
                  color: "#374151",
                  fontSize: "1.1rem",
                  margin: "0 0 0.8rem 0",
                  lineHeight: "1.5",
                  textAlign: "center",
                }}
              >
                ¿Estás seguro de autorizar la{" "}
                <strong>Orden #{confirmModal.idSale}</strong>?
              </p>
              <p
                style={{
                  color: "#6B7280",
                  fontSize: "0.95rem",
                  margin: "0",
                  textAlign: "center",
                }}
              >
                Se enviará una notificación automática al cliente por WhatsApp.
              </p>
            </div>

            {/* 4. Botones con mejor separación */}
            <div className="form-actions" style={{ gap: "1.5rem" }}>
              <button
                className="btn-cancel-modal"
                onClick={() =>
                  setConfirmModal({ ...confirmModal, isOpen: false })
                }
                style={{
                  background: "#F3F4F6",
                  color: "#4B5563",
                  padding: "1rem 1.5rem",
                  fontSize: "1rem",
                  borderRadius: "12px",
                }}
              >
                Cancelar
              </button>

              <button
                className="btn-save"
                onClick={ejecutarConfirmacion}
                style={{
                  background: "#10B981",
                  boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
                  padding: "1rem 1.5rem",
                  fontSize: "1rem",
                  borderRadius: "12px",
                }}
              >
                Sí, Autorizar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionFinanciera;
