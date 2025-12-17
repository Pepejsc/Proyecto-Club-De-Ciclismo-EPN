import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from 'react-router-dom';
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { getToken } from "../../services/authService";
import "../../assets/Styles/Admin/ListaRecursos.css";

/**
 * Constantes de configuración
 */
const API_URL = process.env.REACT_APP_API_URL;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
const MAX_GALLERY_FILES = 3;
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const RESOURCE_TYPES = {
  COMMERCIAL: 'COMERCIAL',
  OPERATIONAL: 'OPERATIVO'
};

/**
 * Función auxiliar para validar tipo y tamaño de archivo.
 * @param {File} file - El archivo a validar.
 * @returns {string|null} - Mensaje de error o null si es válido.
 */
const validateFile = (file) => {
  if (file.size > MAX_FILE_SIZE_BYTES) return `El archivo ${file.name} excede el tamaño máximo de 10MB.`;
  if (!ALLOWED_FILE_TYPES.includes(file.type)) return `El archivo ${file.name} debe ser JPG, PNG o WebP.`;
  return null;
};

const ListaRecursos = () => {
  const navigate = useNavigate();

  // Gestión de Estado
  const [recursos, setRecursos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estado del Modal
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editFormData, setEditFormData] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [archivosGaleria, setArchivosGaleria] = useState([]);

  /**
   * Obtiene la lista de recursos de la API.
   */
  const fetchRecursos = useCallback(async () => {
    setLoading(true);
    const token = getToken();

    if (!token) {
      toast.error("No estás autenticado.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/recursos/`, {
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!response.ok) throw new Error(`Error ${response.status}: No se pudieron cargar los recursos`);

      const data = await response.json();
      setRecursos(data);
    } catch (error) {
      console.error("Error al cargar recursos:", error);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecursos();
  }, [fetchRecursos]);

  /**
   * Maneja la eliminación de un recurso con confirmación.
   * @param {number} recursoId 
   */
  const handleDelete = async (recursoId) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: "El recurso se borrará de forma permanente",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, borrar',
      cancelButtonText: 'Cancelar'
    });

    if (!result.isConfirmed) return;

    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/recursos/${recursoId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al eliminar el recurso");
      }

      Swal.fire('¡Eliminado!', 'El recurso ha sido eliminado.', 'success');
      setRecursos((prev) => prev.filter((r) => r.id_recurso !== recursoId));
    } catch (error) {
      console.error("Error al eliminar:", error);
      Swal.fire('Error', 'Hubo un problema al eliminar el recurso.', 'error');
    }
  };

  /**
   * Abre el modal de edición y carga los datos.
   * @param {object} recurso 
   */
  const handleEdit = (recurso) => {
    setEditFormData({
      ...recurso,
      stock_inicial: recurso.stock_actual // Mapear stock actual a inicial para la edición
    });
    setArchivo(null);
    setArchivosGaleria([]);
    setModalVisible(true);
  };

  /**
   * Maneja los cambios en los inputs del formulario modal.
   */
  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  /**
   * Maneja la selección del archivo de imagen principal.
   */
  const handleModalFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const error = validateFile(file);
    if (error) {
      toast.error(error);
      e.target.value = '';
      return;
    }

    setArchivo(file);
    toast.info(`Archivo seleccionado: ${file.name}`);
  };

  /**
   * Maneja la selección de imágenes para la galería.
   */
  const handleModalGalleryFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    if (files.length > MAX_GALLERY_FILES) {
      toast.error(`Máximo ${MAX_GALLERY_FILES} imágenes de galería.`);
      e.target.value = '';
      return;
    }

    for (const file of files) {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        e.target.value = '';
        return;
      }
    }

    setArchivosGaleria(files);
    toast.success(`${files.length} imágenes seleccionadas.`);
  };

  /**
   * Envía los datos actualizados del recurso a la API.
   */
  const handleUpdateSubmit = async () => {
    if (!editFormData) return;
    setIsSubmitting(true);

    const formDataToSend = new FormData();
    
    // Agregar campos básicos
    const fields = [
      'tipo_recurso', 'nombre', 'descripcion', 'categoria', 
      'fecha_adquisicion', 'observacion', 'tallas_disponibles'
    ];

    fields.forEach(field => {
      if (editFormData[field] !== undefined && editFormData[field] !== null) {
        formDataToSend.append(field, String(editFormData[field]).trim());
      }
    });
    
    formDataToSend.append('costo_adquisicion', parseFloat(editFormData.costo_adquisicion));

    // Agregar archivos
    if (archivo) formDataToSend.append('file', archivo);
    archivosGaleria.forEach(file => formDataToSend.append('files_gallery', file));

    // Agregar campos específicos por tipo
    if (editFormData.tipo_recurso === RESOURCE_TYPES.COMMERCIAL) {
      formDataToSend.append('precio_venta', parseFloat(editFormData.precio_venta));
      formDataToSend.append('stock_actual', parseInt(editFormData.stock_inicial));
      formDataToSend.append('sku', (editFormData.sku || '').trim());
    } else if (editFormData.tipo_recurso === RESOURCE_TYPES.OPERATIONAL) {
      formDataToSend.append('codigo_activo', (editFormData.codigo_activo || '').trim());
      formDataToSend.append('estado', editFormData.estado);
      formDataToSend.append('ubicacion', (editFormData.ubicacion || '').trim());
      if (editFormData.id_usuario_responsable) {
        formDataToSend.append('id_usuario_responsable', parseInt(editFormData.id_usuario_responsable));
      }
    }

    const token = getToken();
    try {
      const response = await fetch(`${API_URL}/recursos/${editFormData.id_recurso}`, {
        method: "PUT",
        headers: { "Authorization": `Bearer ${token}` },
        body: formDataToSend
      });

      const result = await response.json();
      if (!response.ok) {
        const errorMsg = Array.isArray(result.detail) ? result.detail[0].msg : (result.detail || "Error desconocido");
        throw new Error(errorMsg);
      }

      toast.success(`Recurso "${result.nombre}" actualizado`);
      setModalVisible(false);
      setEditFormData(null);
      fetchRecursos();
    } catch (error) {
      console.error("Error al actualizar recurso:", error);
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Renderiza el badge de stock o estado según el tipo de recurso.
   */
  const renderStockStatus = (resource) => {
    if (resource.tipo_recurso === RESOURCE_TYPES.COMMERCIAL) {
      if (resource.stock_actual <= 0) {
        return <span className="stock-badge stock-agotado">AGOTADO</span>;
      } 
      const badgeClass = resource.stock_actual < 10 ? "stock-badge stock-bajo" : "stock-badge stock-normal";
      const label = resource.stock_actual < 10 ? "(Bajo)" : "";
      return <span className={badgeClass}>{resource.stock_actual} unidades {label}</span>;
    }
    
    return (
      <div className="status-container">
        <span className={`estado-badge ${resource.estado ? resource.estado.toLowerCase() : ''}`}>
          {resource.estado}
        </span>
        <small className="location-text">📍 {resource.ubicacion}</small>
      </div>
    );
  };

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
        <thead>
          <tr>
            <th>Tipo</th>
            <th>Nombre</th>
            <th>Categoría</th>
            <th>Fecha Ingreso</th>
            <th>Costo Adq.</th>
            <th>Stock / Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan="7">Cargando recursos...</td></tr>
          ) : recursos.length === 0 ? (
            <tr><td colSpan="7">No se encontraron recursos.</td></tr>
          ) : (
            recursos.map((r) => {
              const isComercial = r.tipo_recurso === RESOURCE_TYPES.COMMERCIAL;
              const isOutOfStock = isComercial && r.stock_actual <= 0;

              return (
                <tr key={r.id_recurso} className={isOutOfStock ? "fila-agotada" : ""}>
                  <td data-label="Tipo">
                    <span className={`badge ${isComercial ? "badge-comercial" : "badge-operativo"}`}>
                      {r.tipo_recurso}
                    </span>
                  </td>
                  <td data-label="Nombre">{r.nombre}</td>
                  <td data-label="Categoría">{r.categoria || "N/A"}</td>
                  <td data-label="Fecha Ingreso">{r.fecha_adquisicion}</td>
                  <td data-label="Costo Adq.">{`$${Number(r.costo_adquisicion).toFixed(2)}`}</td>
                  <td data-label="Stock / Estado">{renderStockStatus(r)}</td>
                  <td data-label="Acciones">
                    <div className="actions-wrapper">
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
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      {/* Modal de Edición */}
      {modalVisible && editFormData && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Editar Recurso ({editFormData.nombre})</h3>
            
            <div className="form-grid text-left">
              <div className="grid-full">
                <label>Tipo de Recurso</label>
                <input type="text" value={editFormData.tipo_recurso} disabled />
              </div>
            </div>

            <h3 className="form-section-header">Campos Comunes</h3>
            <div className="form-grid text-left">
              <div>
                <label>Nombre recurso *</label>
                <input name="nombre" value={editFormData.nombre} onChange={handleModalChange} disabled={isSubmitting} />
              </div>
              <div>
                <label>Categoría</label>
                <input name="categoria" value={editFormData.categoria || ''} onChange={handleModalChange} disabled={isSubmitting} />
              </div>
              <div>
                <label>Fecha de Adquisición *</label>
                <input type="date" name="fecha_adquisicion" value={editFormData.fecha_adquisicion} onChange={handleModalChange} disabled={isSubmitting} />
              </div>
              <div>
                <label>Costo de Adquisición (USD) *</label>
                <input type="number" name="costo_adquisicion" value={editFormData.costo_adquisicion} onChange={handleModalChange} min="0" disabled={isSubmitting} />
              </div>
              <div className="grid-full">
                <label>Descripción *</label>
                <textarea name="descripcion" value={editFormData.descripcion || ''} onChange={handleModalChange} rows="3" disabled={isSubmitting} />
              </div>
              <div className="grid-full">
                <label>Tallas Disponibles (Opcional)</label>
                <input name="tallas_disponibles" value={editFormData.tallas_disponibles || ''} onChange={handleModalChange} placeholder="Ej: S, M, L" disabled={isSubmitting} />
              </div>

              <div className="grid-full">
                <label>Cambiar Imagen Principal (Opcional)</label>
                {editFormData.imagen_url && !archivo && (
                  <div className="image-preview">
                    <img 
                      src={`${API_URL}${editFormData.imagen_url}`} 
                      alt="Actual" 
                      onError={(e) => { e.target.style.display = 'none'; }}
                    />
                  </div>
                )}
                <input type="file" name="imagen_file_principal" onChange={handleModalFileChange} accept="image/*" disabled={isSubmitting} />
              </div>
              
              <div className="grid-full">
                <label>Añadir Imágenes de Galería (Máx {MAX_GALLERY_FILES})</label>
                <input type="file" name="imagen_file_gallery" multiple onChange={handleModalGalleryFileChange} accept="image/*" disabled={isSubmitting} />
                {archivosGaleria.length > 0 && <small>{archivosGaleria.length} seleccionadas</small>}
              </div>
            </div>

            {editFormData.tipo_recurso === RESOURCE_TYPES.COMMERCIAL && (
              <>
                <h3 className="form-section-header">Detalles Comerciales</h3>
                <div className="form-grid text-left">
                  <div>
                    <label>Precio Venta (USD) *</label>
                    <input type="number" name="precio_venta" value={editFormData.precio_venta} onChange={handleModalChange} min="0" disabled={isSubmitting} />
                  </div>
                  <div>
                    <label>Stock *</label>
                    <input type="number" name="stock_inicial" value={editFormData.stock_inicial} onChange={handleModalChange} min="0" disabled={isSubmitting} />
                  </div>
                  <div>
                    <label>SKU (Opcional)</label>
                    <input name="sku" value={editFormData.sku || ''} onChange={handleModalChange} disabled={isSubmitting} />
                  </div>
                </div>
              </>
            )}

            {editFormData.tipo_recurso === RESOURCE_TYPES.OPERATIONAL && (
              <>
                <h3 className="form-section-header">Detalles Operativos</h3>
                <div className="form-grid text-left">
                  <div>
                    <label>Código Activo *</label>
                    <input name="codigo_activo" value={editFormData.codigo_activo} onChange={handleModalChange} disabled={isSubmitting} />
                  </div>
                  <div>
                    <label>Estado *</label>
                    <select name="estado" value={editFormData.estado} onChange={handleModalChange} disabled={isSubmitting}>
                      <option value="DISPONIBLE">Disponible</option>
                      <option value="ASIGNADO">Asignado</option>
                      <option value="EN_MANTENIMIENTO">En Mantenimiento</option>
                      <option value="DE_BAJA">De Baja</option>
                    </select>
                  </div>
                  <div>
                    <label>Responsable (ID)</label>
                    <input type="number" name="id_usuario_responsable" value={editFormData.id_usuario_responsable || ''} onChange={handleModalChange} disabled={isSubmitting} />
                  </div>
                  <div>
                    <label>Ubicación *</label>
                    <input name="ubicacion" value={editFormData.ubicacion || ''} onChange={handleModalChange} disabled={isSubmitting} />
                  </div>
                </div>
              </>
            )}

            <div className="modal-buttons">
              <button onClick={handleUpdateSubmit} className="btn-primary" disabled={isSubmitting}>
                {isSubmitting ? "Guardando..." : "Guardar Cambios"}
              </button>
              <button onClick={() => setModalVisible(false)} className="btn-secondary" disabled={isSubmitting}>
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