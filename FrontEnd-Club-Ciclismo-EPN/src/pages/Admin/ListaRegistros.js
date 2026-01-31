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

// --- 🛡️ FUNCIÓN DE SANITIZACIÓN ---
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input.replace(/[<>&"'/]/g, "");
};

const GestionFinanciera = () => {
  const [registros, setRegistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroActivo, setFiltroActivo] = useState("TODOS");
  const [showFinanceModal, setShowFinanceModal] = useState(false);

  const [fechaInicio, setFechaInicio] = useState("");
  const [fechaFin, setFechaFin] = useState("");

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    idSale: null,
    telefono: null,
    cliente: null,
    tipo: "AUTORIZAR",
  });

  const [nuevoMov, setNuevoMov] = useState({
    tipo: "EGRESO",
    categoria: "OPERATIVO",
    monto: "",
    descripcion: "",
  });

  const mostrarAcciones = ["TODOS", "VENTAS"].includes(filtroActivo);

  useEffect(() => {
    cargarDatos();
  }, [filtroActivo]);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const data = await fetchFinancialRecords(filtroActivo);
      let datosProcesados = Array.isArray(data) ? data : [];

      if (filtroActivo === "INGRESOS") {
        datosProcesados = datosProcesados.filter(
          (item) =>
            item.categoria !== "Venta Producto" &&
            item.categoria !== "Membresía" &&
            !item.id?.toString().startsWith("VEN-") &&
            !item.id?.toString().startsWith("MEM-")
        );
      }

      setRegistros(datosProcesados);
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

  const registrosFiltrados = registros.filter((item) => {
    if (!fechaInicio && !fechaFin) return true;

    const fechaItem = new Date(item.fecha || item.created_at);
    fechaItem.setHours(0, 0, 0, 0);

    const inicio = fechaInicio ? new Date(fechaInicio) : null;
    if (inicio) inicio.setHours(0, 0, 0, 0);

    const fin = fechaFin ? new Date(fechaFin) : null;
    if (fin) fin.setHours(23, 59, 59, 999);

    if (inicio && fechaItem < inicio) return false;
    if (fin && fechaItem > fin) return false;

    return true;
  });

  const descargarExcel = () => {
    const hoja = XLSX.utils.json_to_sheet(registrosFiltrados);
    const libro = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(libro, hoja, "Finanzas");
    XLSX.writeFile(
      libro,
      `Reporte_${filtroActivo}_${new Date().toLocaleDateString()}.xlsx`
    );
  };

  const clickBotonConfirmar = (idCompuesto, telefono, cliente) => {
    const idSale = idCompuesto.toString().includes("-")
      ? idCompuesto.split("-")[1]
      : idCompuesto;

    setConfirmModal({
      isOpen: true,
      idSale,
      telefono,
      cliente,
      tipo: "AUTORIZAR",
    });
  };

  const handleCancelarVenta = (idCompuesto) => {
    const idSale = idCompuesto.toString().includes("-")
      ? idCompuesto.split("-")[1]
      : idCompuesto;

    setConfirmModal({
      isOpen: true,
      idSale,
      telefono: null,
      cliente: null,
      tipo: "CANCELAR",
    });
  };

  const ejecutarConfirmacion = async () => {
    const { idSale, telefono, cliente } = confirmModal;

    try {
      setLoading(true);
      const data = await confirmSale(idSale);
      toast.success(`Orden #${idSale} confirmada con éxito`);

      let tel = telefono || "";
      if (tel.startsWith("0")) tel = "593" + tel.substring(1);

      if (tel && tel.length >= 9) {
        let mensaje =
          `Hola *${cliente || "Cliente"}*, le saludamos del Club de Ciclismo EPN 🚴‍♂️.\n\n` +
          `✅ *PAGO VERIFICADO* para la Orden #${idSale}.\n`;
        if (data.invoice_url)
          mensaje += `📄 *Factura:* ${data.invoice_url}\n\n`;
        mensaje += `¡Gracias por su compra! Pronto coordinaremos la entrega.`;

        const url = `https://api.whatsapp.com/send?phone=${tel}&text=${encodeURIComponent(mensaje)}`;
        window.open(url, "_blank");
      } else {
        toast.warning("No se pudo abrir WhatsApp: Número de teléfono no válido.");
      }

      setConfirmModal({ ...confirmModal, isOpen: false });
      cargarDatos();
    } catch (error) {
      toast.error(error.message || "Error al confirmar");
    } finally {
      setLoading(false);
    }
  };

  const ejecutarCancelacion = async () => {
    try {
      setLoading(true);
      await cancelSale(confirmModal.idSale);
      toast.info(`Orden #${confirmModal.idSale} cancelada exitosamente`);
      
      setConfirmModal({ ...confirmModal, isOpen: false });
      cargarDatos();
    } catch (error) {
      toast.error("Error al cancelar la orden");
    } finally {
      setLoading(false);
    }
  };

  const handleRegistrarMovimiento = async (e) => {
    e.preventDefault();

    // --- 🛡️ VALIDACIONES DE SEGURIDAD ---
    const montoFloat = parseFloat(nuevoMov.monto);
    const descLimpia = nuevoMov.descripcion.trim();

    if (isNaN(montoFloat) || montoFloat <= 0) {
      toast.warning("El monto debe ser un número mayor a 0.");
      return;
    }

    if (!descLimpia || descLimpia.length < 5) {
      toast.warning("La descripción debe tener al menos 5 caracteres.");
      return;
    }

    if (!nuevoMov.tipo || !nuevoMov.categoria) {
      toast.warning("Selecciona un tipo y categoría válidos.");
      return;
    }
    // ------------------------------------

    try {
      // Enviamos datos limpios
      const dataToSend = {
          ...nuevoMov,
          monto: montoFloat,
          descripcion: sanitizeInput(descLimpia) // Sanitización final antes de enviar
      };

      await createFinancialTransaction(dataToSend);
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

  // 🛡️ Handler seguro para la descripción
  const handleDescripcionChange = (e) => {
      const val = sanitizeInput(e.target.value);
      setNuevoMov({ ...nuevoMov, descripcion: val });
  };

  const money = (val) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);

  return (
    <div className="gestion-ventas-container">
      <div className="header-container">
        <h1 className="main-title">Lista de Registros</h1>
        <button className="filter-btn btn-excel" onClick={descargarExcel}>
          <i className="fas fa-file-excel"></i> Descargar Reporte
        </button>
      </div>

      <div className="sales-controls">
        <div className="filters-group">
          {["TODOS", "INGRESOS", "VENTAS", "MEMBRESIAS", "GASTOS"].map((tab) => (
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

      {/* --- NUEVO DISENO FILTRO DE FECHAS --- */}
      <div className="date-filter-row">
        <div className="filter-label">
          <i className="fas fa-filter"></i>
          <span>Filtrar por fecha:</span>
        </div>
        
        <div className="date-inputs-group">
          <input 
            type="date" 
            className="date-input-styled"
            value={fechaInicio} 
            onChange={(e) => setFechaInicio(e.target.value)}
          />
          <span className="date-separator">hasta</span>
          <input 
            type="date" 
            className="date-input-styled"
            value={fechaFin} 
            onChange={(e) => setFechaFin(e.target.value)}
          />
        </div>
        
        {(fechaInicio || fechaFin) && (
          <button 
            className="btn-clear-dates"
            onClick={() => { setFechaInicio(""); setFechaFin(""); }}
          >
            <i className="fas fa-times-circle"></i> Limpiar Filtro
          </button>
        )}
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
                {registrosFiltrados.length > 0 ? (
                  registrosFiltrados.map((row, index) => (
                    <tr key={index}>
                      <td className="col-id">{row.id || row.id_sale}</td>
                      <td>
                        {new Date(
                          row.fecha || row.created_at
                        ).toLocaleDateString()}
                      </td>
                      <td>
                        <span className="categoria-badge">
                          {row.categoria || "VENTA"}
                        </span>
                      </td>
                      <td className="col-desc">
                        {row.descripcion || row.customer_name}
                      </td>
                      <td>
                        <span
                          className={`tipo-texto ${row.tipo === "EGRESO" ? "egreso" : "ingreso"}`}
                        >
                          {row.tipo || "INGRESO"}
                        </span>
                      </td>
                      <td
                        className={`monto-texto ${row.tipo === "EGRESO" ? "egreso" : "ingreso"}`}
                      >
                        {row.tipo === "EGRESO" ? "-" : "+"}{" "}
                        {/* ⚠️ CORRECCIÓN: Agregar || 0 para evitar NaN */}
                        {money(row.monto || row.total_amount || 0)}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${row.estado === "PENDING" ? "PENDING" : row.estado}`}
                        >
                          {row.estado}
                        </span>
                      </td>

                      {mostrarAcciones && (
                        <td>
                          {(row.id?.toString().startsWith("VEN-") ||
                            row.id_sale) &&
                          row.estado === "PENDING" ? (
                            <div className="actions-group">
                              <button
                                className="action-btn btn-confirm"
                                title="Confirmar Pago"
                                onClick={() =>
                                  clickBotonConfirmar(
                                    row.id || row.id_sale,
                                    row.customer_phone || row.telefono || "",
                                    row.customer_name || row.cliente || ""
                                  )
                                }
                              >
                                <i className="fas fa-check"></i>
                              </button>
                              <button
                                className="action-btn btn-cancel"
                                title="Cancelar Orden"
                                onClick={() =>
                                  handleCancelarVenta(row.id || row.id_sale)
                                }
                              >
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          ) : (
                            <span className="no-action">-</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8">
                      <div className="empty-state">
                        <p>No hay registros en este rango de fechas.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* --- MODAL DE REGISTRO MANUAL BLINDADO --- */}
      {showFinanceModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-compact">
            <button
              className="modal-close-x"
              onClick={() => setShowFinanceModal(false)}
            >
              <i className="fas fa-times"></i>
            </button>

            <h3 className="modal-title-small">Registrar Movimiento</h3>

            <form
              onSubmit={handleRegistrarMovimiento}
              className="finance-form-compact"
            >
              <div className="form-row">
                <div className="form-group">
                  <label>Tipo</label>
                  <select
                    value={nuevoMov.tipo}
                    onChange={(e) =>
                      setNuevoMov({ ...nuevoMov, tipo: e.target.value })
                    }
                  >
                    <option value="EGRESO">Gasto</option>
                    <option value="INGRESO">Ingreso</option>
                  </select>
                </div>
                <div className="form-group">
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
              </div>

              <div className="form-group">
                <label>Monto ($)</label>
                <div className="input-icon-wrapper">
                  <i className="fas fa-dollar-sign input-icon"></i>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01" // 🛡️ Evita negativos o cero
                    placeholder="0.00"
                    value={nuevoMov.monto}
                    onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setNuevoMov({
                            ...nuevoMov,
                            monto: val < 0 ? 0 : val, // 🛡️ Doble check
                        })
                    }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Descripción</label>
                <input
                  type="text"
                  placeholder="Ej: Pago de luz eléctrica"
                  value={nuevoMov.descripcion}
                  onChange={handleDescripcionChange} // 🛡️ Handler con sanitización
                  maxLength={200} // 🛡️ Límite de longitud
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-save">
                  Guardar
                </button>
                <button
                  type="button"
                  className="btn-cancel-modal btn-rojo-cancelar"
                  onClick={() => setShowFinanceModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL UNIFICADO (AUTORIZAR O CANCELAR) --- */}
      {confirmModal.isOpen && (
        <div className="modal-overlay">
          <div className="modal-content modal-confirm">
            <div
              className={`modal-icon-wrapper ${
                confirmModal.tipo === "AUTORIZAR"
                  ? "icon-success"
                  : "icon-danger"
              }`}
            >
              <i
                className={`fas ${
                  confirmModal.tipo === "AUTORIZAR"
                    ? "fa-check-circle"
                    : "fa-exclamation-triangle"
                }`}
              ></i>
            </div>

            <h2 className="modal-title">
              {confirmModal.tipo === "AUTORIZAR"
                ? "Confirmar Pago"
                : "Cancelar Orden"}
            </h2>

            <div className="modal-body-text">
              <p className="modal-main-msg">
                {confirmModal.tipo === "AUTORIZAR" ? (
                  <span>
                    ¿Estás seguro de autorizar la{" "}
                    <strong>Orden #{confirmModal.idSale}</strong>?
                  </span>
                ) : (
                  <span>
                    ¿Estás seguro de <strong>CANCELAR</strong> la Orden #
                    {confirmModal.idSale}?
                  </span>
                )}
              </p>

              {confirmModal.tipo === "AUTORIZAR" && (
                <div className="customer-info-box">
                  <div className="info-row">
                    <i className="fas fa-user-circle info-icon"></i>
                    <div className="info-text">
                      <span className="info-label">Cliente</span>
                      <span className="info-value">
                        {confirmModal.cliente || "Desconocido"}
                      </span>
                    </div>
                  </div>
                  <div className="info-divider"></div>
                  <div className="info-row">
                    <i className="fab fa-whatsapp info-icon whatsapp-color"></i>
                    <div className="info-text">
                      <span className="info-label">WhatsApp</span>
                      <span className="info-value">
                        {confirmModal.telefono || "No registrado"}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {confirmModal.tipo === "CANCELAR" && (
                <p className="warning-message">
                  <i className="fas fa-info-circle"></i> Esta acción liberará el
                  stock reservado y no se puede deshacer.
                </p>
              )}
            </div>

            <div className="form-actions modal-actions-group">
              <button
                className={
                  confirmModal.tipo === "AUTORIZAR"
                    ? "btn-authorize"
                    : "btn-cancel-modal btn-rojo-cancelar"
                }
                onClick={
                  confirmModal.tipo === "AUTORIZAR"
                    ? ejecutarConfirmacion
                    : ejecutarCancelacion
                }
              >
                {confirmModal.tipo === "AUTORIZAR"
                  ? "Autorizar"
                  : "Sí, Cancelar"}
              </button>

              <button
                className="btn-cancel-modal"
                onClick={() =>
                  setConfirmModal({ ...confirmModal, isOpen: false })
                }
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestionFinanciera;