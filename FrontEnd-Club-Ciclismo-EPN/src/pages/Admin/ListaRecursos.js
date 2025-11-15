import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import "../../assets/Styles/Admin/ListaRecursos.css"; 
import { getToken } from "../../services/authService"; 
import { useNavigate } from 'react-router-dom';

const apiUrl = process.env.REACT_APP_API_URL;

const ListaRecursos = () => {
  const [recursos, setRecursos] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState(null); 

  const fetchRecursos = async () => {
    setLoading(true);
    const token = getToken();
    if (!token) {
      toast.error("No estás autenticado.");
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(`${apiUrl}/recursos/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error(`Error ${response.status}: No se pudieron cargar los recursos`);
      }
      const data = await response.json();
      setRecursos(data);
    } catch (error) {
      console.error("Error al cargar recursos:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecursos();
  }, []);

  const handleDelete = async (recursoId) => {
    // ... (Tu lógica de borrar no cambia) ...
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "El recurso se borrará de forma permanente",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, borrar",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed) {
      const token = getToken();
      try {
        const response = await fetch(`${apiUrl}/recursos/${recursoId}`, {
          method: "DELETE",
          headers: { "Authorization": `Bearer ${token}` },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.detail || "Error al eliminar el recurso");
        }
        toast.success("Recurso eliminado correctamente");
        setRecursos((prevRecursos) =>
          prevRecursos.filter((r) => r.id_recurso !== recursoId)
        );
      } catch (error) {
        console.error("Error al eliminar:", error);
        toast.error(error.message);
      }
    }
  };

  const handleEdit = (recurso) => {
    console.log("Editando:", recurso);
    // Mapeamos 'stock_actual' (de la BD) a 'stock_inicial' (para el formulario)
    const formData = {
      ...recurso,
      stock_inicial: recurso.stock_actual
    };
    setEditFormData(formData);
    setModalVisible(true);
  };

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // --- 👇 AQUÍ ESTÁ LA FUNCIÓN CORREGIDA 👇 ---
  const handleUpdateSubmit = async () => {
    if (!editFormData) return;

    setIsSubmitting(true);
    
    // 1. Obtenemos el token
    const token = getToken();
    if (!token) {
      toast.error("Error de autenticación. Por favor, inicie sesión de nuevo.");
      setIsSubmitting(false);
      return;
    }

    // 2. Construimos un payload "limpio" desde cero
    let payload = {
      // Campos comunes (RecursoBase)
      tipo_recurso: editFormData.tipo_recurso,
      nombre: editFormData.nombre,
      descripcion: editFormData.descripcion || null,
      categoria: editFormData.categoria || null,
      fecha_adquisicion: editFormData.fecha_adquisicion,
      costo_adquisicion: parseFloat(editFormData.costo_adquisicion),
      observacion: editFormData.observacion || null,
    };

    // 3. Añadimos solo los campos específicos del tipo
    if (editFormData.tipo_recurso === 'COMERCIAL') {
      payload = {
        ...payload,
        // Campos de RecursoComercialCreate
        precio_venta: parseFloat(editFormData.precio_venta),
        stock_inicial: parseInt(editFormData.stock_inicial), // <-- ¡Enviamos 'stock_inicial'!
        sku: editFormData.sku || null,
      };
    } else if (editFormData.tipo_recurso === 'OPERATIVO') {
      payload = {
        ...payload,
        // Campos de RecursoOperativoCreate
        codigo_activo: editFormData.codigo_activo,
        estado: editFormData.estado,
        ubicacion: editFormData.ubicacion || null,
        id_usuario_responsable: editFormData.id_usuario_responsable || null,
      };
    }

    console.log("📤 Enviando Payload de ACTUALIZACIÓN (JSON):", payload);

    try {
      const response = await fetch(`${apiUrl}/recursos/${editFormData.id_recurso}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload) // 4. Enviamos el payload limpio
      });

      const result = await response.json();

      if (!response.ok) {
        // El 'result.detail' de Pydantic nos dirá exactamente qué campo falla
        const errorMsg = Array.isArray(result.detail) ? result.detail[0].msg : (result.detail || "Error desconocido");
        throw new Error(errorMsg);
      }

      toast.success(`✅ Recurso "${result.nombre}" actualizado`);
      setModalVisible(false);
      setEditFormData(null);
      fetchRecursos(); // Volvemos a cargar los datos de la tabla

    } catch (error) {
      console.error("❌ Error en handleUpdateSubmit:", error);
      toast.error(`❌ ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- JSX (Sin cambios) ---
  return (
    <div className="recursos-container">
      <div className="recursos-header">
        <h2>Lista de Recursos</h2>
        <div className="header-button-container">
          <button
            className="btn-crear-nuevo"
            onClick={() => navigate("/admin/crear-recurso")}
          >
            <i className="fas fa-plus"></i> Crear Nuevo Recurso
          </button>
        </div>
      </div>

      <table className="tabla-recursos">
        {/* ... (<thead> de la tabla sin cambios) ... */}
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Fecha Ingreso</th>
            <th>Costo Adq.</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="6">Cargando recursos...</td></tr>
          ) : recursos.length === 0 ? (
            <tr><td colSpan="6">No se encontraron recursos.</td></tr>
          ) : (
            recursos.map((r) => (
              <tr key={r.id_recurso}>
                {/* ... (columnas <td> de la tabla sin cambios) ... */}
                <td data-label="Tipo">
                  <span
                    className={`badge ${
                      r.tipo_recurso === "COMERCIAL"
                        ? "badge-comercial"
                        : "badge-operativo"
                    }`}
                  >
                    {r.tipo_recurso}
                  </span>
                </td>
                <td data-label="Nombre">{r.nombre}</td>
                <td data-label="Categoría">{r.categoria || "N/A"}</td>
                <td data-label="Fecha Ingreso">{r.fecha_adquisicion}</td>
                <td data-label="Costo Adq.">
                  {`$${Number(r.costo_adquisicion).toFixed(2)}`}
                </td>
                <td data-label="Acciones">
                  <button
                    className="btn-action editar"
                    title="Editar Recurso"
                    onClick={() => handleEdit(r)} 
                  >
                    <i className="fas fa-pen-to-square"></i>
                  </button>
                  <button
                    className="btn-action eliminar"
                    title="Eliminar Recurso"
                    onClick={() => handleDelete(r.id_recurso)}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* --- MODAL DE EDICIÓN (Sin cambios) --- */}
      {modalVisible && editFormData && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Editar Recurso ({editFormData.nombre})</h3>
            
            <div className="form-grid" style={{textAlign: 'left'}}>
              <div className="grid-full">
                <label>Tipo de Recurso</label>
                <input
                  type="text"
                  value={editFormData.tipo_recurso}
                  disabled
                />
              </div>
            </div>

            <h3 className="form-section-header">Campos Comunes</h3>
            <div className="form-grid" style={{textAlign: 'left'}}>
              <div>
                <label>Nombre recurso *</label>
                <input
                  name="nombre"
                  value={editFormData.nombre}
                  onChange={handleModalChange}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label>Categoría</label>
                <input
                  name="categoria"
                  value={editFormData.categoria || ''}
                  onChange={handleModalChange}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label>Fecha de Adquisición *</label>
                <input
                  type="date"
                  name="fecha_adquisicion"
                  value={editFormData.fecha_adquisicion}
                  onChange={handleModalChange}
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label>Costo de Adquisición (USD) *</label>
                <input
                  type="number"
                  name="costo_adquisicion"
                  value={editFormData.costo_adquisicion}
                  onChange={handleModalChange}
                  min="0"
                  disabled={isSubmitting}
                />
              </div>
              <div className="grid-full">
                <label>Descripción *</label>
                <textarea
                  name="descripcion"
                  value={editFormData.descripcion || ''}
                  onChange={handleModalChange}
                  rows="3"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* --- SECCIÓN COMERCIAL (CONDICIONAL) --- */}
            {editFormData.tipo_recurso === "COMERCIAL" && (
              <>
                <h3 className="form-section-header">Detalles del Producto Comercial</h3>
                <div className="form-grid" style={{textAlign: 'left'}}>
                  <div>
                    <label>Precio de Venta (USD) *</label>
                    <input
                      type="number"
                      name="precio_venta"
                      value={editFormData.precio_venta}
                      onChange={handleModalChange}
                      min="0"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label>Stock *</label>
                    <input
                      type="number"
                      name="stock_inicial" // Usamos 'stock_inicial' para el form
                      value={editFormData.stock_inicial} // Viene del mapeo en handleEdit
                      onChange={handleModalChange}
                      min="0"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label>SKU (Opcional)</label>
                    <input
                      name="sku"
                      value={editFormData.sku || ''}
                      onChange={handleModalChange}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </>
            )}

            {/* --- SECCIÓN OPERATIVA (CONDICIONAL) --- */}
            {editFormData.tipo_recurso === "OPERATIVO" && (
              <>
                <h3 className="form-section-header">Detalles del Activo Operativo</h3>
                <div className="form-grid" style={{textAlign: 'left'}}>
                  <div>
                    <label>Código de Activo *</label>
                    <input
                      name="codigo_activo"
                      value={editFormData.codigo_activo}
                      onChange={handleModalChange}
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label>Estado *</label>
                    <select
                      name="estado"
                      value={editFormData.estado}
                      onChange={handleModalChange}
                      disabled={isSubmitting}
                    >
                      <option value="DISPONIBLE">Disponible</option>
                      <option value="ASIGNADO">Asignado</option>
                      <option value="EN_MANTENIMIENTO">En Mantenimiento</option>
                      <option value="DE_BAJA">De Baja</option>
                    </select>
                  </div>
                  <div>
                    <label>Responsable (ID)</label>
                    <input
                      type="number"
                      name="id_usuario_responsable"
                      value={editFormData.id_usuario_responsable || ''}
                      onChange={handleModalChange}
                      placeholder="ID de usuario"
                      disabled={isSubmitting}
                    />
                  </div>
                  <div>
                    <label>Ubicación *</label>
                    <input
                      name="ubicacion"
                      value={editFormData.ubicacion || ''}
                      onChange={handleModalChange}
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Botones del Modal */}
            <div className="modal-buttons">
              <button 
                onClick={handleUpdateSubmit} 
                className="btn-primary" 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </button>
              <button 
                onClick={() => setModalVisible(false)} 
                className="btn-secondary" 
                disabled={isSubmitting}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListaRecursos;