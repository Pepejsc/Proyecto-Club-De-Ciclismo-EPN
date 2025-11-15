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

  // --- Estados para el Modal ---
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState(null); 
  // --- (NUEVO) Estado para el archivo del modal ---
  const [archivo, setArchivo] = useState(null);

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

  // --- handleEdit (Modificado para limpiar 'archivo') ---
  const handleEdit = (recurso) => {
    console.log("Editando:", recurso);
    const formData = {
      ...recurso,
      // Mapeamos stock_actual (BD) a stock_inicial (Form)
      stock_inicial: recurso.stock_actual 
    };
    setEditFormData(formData);
    setArchivo(null); // Limpiamos el estado del archivo
    setModalVisible(true);
  };

  // --- handleModalChange (Sin cambios) ---
  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // --- (NUEVO) Manejador de archivo para el modal ---
  const handleModalFileChange = (e) => {
     const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB
        toast.error("El archivo es demasiado grande. Máximo 10MB.");
        e.target.value = '';
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Tipo de archivo no permitido. Solo JPG, PNG o WebP.");
        e.target.value = '';
        return;
      }
      setArchivo(file);
      toast.info(`Nuevo archivo seleccionado: ${file.name}`);
    }
  };
  
// --- handleUpdateSubmit (¡CORREGIDO!) ---
  const handleUpdateSubmit = async () => {
    if (!editFormData) return;

    setIsSubmitting(true);
    
    // 1. Construir FormData
    const formDataToSend = new FormData();

    // --- 2. Añadir campos (AHORA CON PROTECCIÓN .trim()) ---
    // (valor || '') se asegura de que nunca llamemos a .trim() en 'null'
    formDataToSend.append('tipo_recurso', editFormData.tipo_recurso);
    formDataToSend.append('nombre', (editFormData.nombre || '').trim());
    formDataToSend.append('descripcion', (editFormData.descripcion || '').trim());
    formDataToSend.append('categoria', (editFormData.categoria || '').trim());
    formDataToSend.append('fecha_adquisicion', editFormData.fecha_adquisicion);
    formDataToSend.append('costo_adquisicion', parseFloat(editFormData.costo_adquisicion));
    formDataToSend.append('observacion', (editFormData.observacion || '').trim());

    // 3. Añadir el nuevo archivo (si se seleccionó uno)
    if (archivo) {
      formDataToSend.append('file', archivo);
    }
    
    // 4. Añadir campos condicionales (TAMBIÉN CON PROTECCIÓN)
    if (editFormData.tipo_recurso === "COMERCIAL") {
      formDataToSend.append('precio_venta', parseFloat(editFormData.precio_venta));
      formDataToSend.append('stock_actual', parseInt(editFormData.stock_inicial)); 
      formDataToSend.append('sku', (editFormData.sku || '').trim());
    } else if (editFormData.tipo_recurso === "OPERATIVO") {
      formDataToSend.append('codigo_activo', (editFormData.codigo_activo || '').trim());
      formDataToSend.append('estado', editFormData.estado);
      formDataToSend.append('ubicacion', (editFormData.ubicacion || '').trim());
      if (editFormData.id_usuario_responsable) {
        formDataToSend.append('id_usuario_responsable', parseInt(editFormData.id_usuario_responsable));
      }
    }
    
    console.log("📤 Enviando Payload de ACTUALIZACIÓN (FormData)...");

    const token = getToken();
    try {
      const response = await fetch(`${apiUrl}/recursos/${editFormData.id_recurso}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`
          // NO 'Content-Type'
        },
        body: formDataToSend
      });

      const result = await response.json();

      if (!response.ok) {
        const errorMsg = Array.isArray(result.detail) ? result.detail[0].msg : (result.detail || "Error desconocido");
        throw new Error(errorMsg);
      }

      toast.success(`✅ Recurso "${result.nombre}" actualizado`);
      setModalVisible(false);
      setEditFormData(null);
      setArchivo(null); // Limpiar archivo
      fetchRecursos(); // Recargar la lista

    } catch (error) {
      console.error("❌ Error en handleUpdateSubmit:", error);
      toast.error(`❌ ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // --- JSX ---
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

      {/* --- MODAL DE EDICIÓN (Actualizado con campo de archivo) --- */}
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
              {/* ... (campos nombre, categoria, fecha, costo) ... */}
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

              {/* --- (NUEVO) Campo de Imagen en Modal --- */}
              <div className="grid-full">
                <label>Cambiar Imagen (Opcional)</label>
                {/* Muestra la imagen actual si existe */}
                {editFormData.imagen_url && !archivo && (
                  <div style={{marginBottom: '10px'}}>
                    <img 
                      src={`${apiUrl}${editFormData.imagen_url}`} 
                      alt="Imagen actual" 
                      style={{width: '100px', height: '100px', objectFit: 'cover', borderRadius: '5px'}}
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
                <input
                  type="file"
                  name="imagen_file"
                  onChange={handleModalFileChange}
                  accept="image/png, image/jpeg, image/webp"
                  disabled={isSubmitting} 
                />
                {archivo && (
                  <div style={{marginTop: '10px', fontSize: '14px'}}>
                    Nuevo archivo: <strong>{archivo.name}</strong>
                  </div>
                )}
              </div>
              {/* --- FIN CAMPO IMAGEN --- */}
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
                      placeholder="Ubicación física del activo"
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