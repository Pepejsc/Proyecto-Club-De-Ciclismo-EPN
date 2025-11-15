import React, { useEffect, useState, useCallback } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import "../../assets/Styles/Admin/ListaDocumentos.css";

// =============================================================================
// 🎯 UTILIDADES Y FUNCIONES DE AYUDA
// =============================================================================

/**
 * Formatea bytes a un string legible (KB, MB, GB)
 */
const formatearTamaño = (bytes) => {
  if (!bytes) return "N/A";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Formatea fecha a formato español
 */
const formatearFecha = (fecha) => {
  if (!fecha) return "Fecha no disponible";
  try {
    return new Date(fecha).toLocaleDateString("es-EC", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "Fecha inválida";
  }
};

/**
 * Retorna un ícono según el tipo de documento
 */
const getIconoPorTipo = (tipo) => {
  const iconos = {
    estatuto: "📜",
    reglamento: "📋",
    acta: "📄",
    informe: "📊",
    contrato: "📝",
  };
  return iconos[tipo] || "📎";
};

/**
 * Limita la longitud de la descripción y agrega puntos suspensivos
 */
const limitarDescripcion = (descripcion, maxLength = 120) => {
  if (!descripcion) return "";
  return descripcion.length <= maxLength
    ? descripcion
    : descripcion.substring(0, maxLength) + "...";
};

// =============================================================================
// 🎯 HOOK PERSONALIZADO PARA MANEJO DE API
// =============================================================================

/**
 * Hook personalizado para manejar autenticación y requests a la API
 */
const useApi = () => {
  const getToken = useCallback(() => {
    const tokens = ["token", "authToken", "accessToken"];
    for (let key of tokens) {
      const value = localStorage.getItem(key) || sessionStorage.getItem(key);
      if (value?.startsWith("eyJ")) return value;
    }
    return null;
  }, []);

  const fetchConAuth = useCallback(
    async (url, options = {}) => {
      const token = getToken();
      const headers = {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      };

      const response = await fetch(url, { ...options, headers });

      if (response.status === 401) {
        toast.error("Sesión expirada. Por favor, inicie sesión nuevamente.");
      }

      return response;
    },
    [getToken]
  );

  return { fetchConAuth, getToken };
};

// =============================================================================
// 🎯 COMPONENTES DE MODALES
// =============================================================================

/**
 * Modal para editar documentos existentes
 */
const EditorDocumentoModal = ({ documento, onClose, onGuardar }) => {
  const [formData, setFormData] = useState({});
  const [cargando, setCargando] = useState(false);

  // Cargar datos del documento cuando el modal se abre
  useEffect(() => {
    if (documento) {
      setFormData({
        name: documento.name || "",
        description: documento.description || "",
        document_type: documento.document_type || "otro",
        responsable: documento.responsable || "",
        entry_date: documento.entry_date
          ? new Date(documento.entry_date).toISOString().split("T")[0]
          : "",
      });
    }
  }, [documento]);

  /**
   * Maneja el envío del formulario de edición
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    try {
      await onGuardar(documento.id, formData);
    } finally {
      setCargando(false);
    }
  };

  /**
   * Maneja cambios en los campos del formulario
   */
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  if (!documento) return null;

  return (
    <div className="modal-overlay">
      <div className="editor-documento-modal">
        <div className="modal-header">
          <h3>✏️ Editar {documento.name}</h3>
          <button className="btn-cerrar" onClick={onClose}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form-editor">
          {/* Campos dinámicos del formulario */}
          {["name", "description", "responsable"].map((field) => (
            <div key={field} className="form-group">
              <label>
                {field === "name"
                  ? "Nombre del Documento *"
                  : field === "description"
                  ? "Descripción"
                  : "Responsable *"}
              </label>
              {field === "description" ? (
                <textarea
                  name={field}
                  value={formData[field] || ""}
                  onChange={handleChange}
                  rows="3"
                  placeholder={`Ingrese ${
                    field === "name" ? "el nombre" : "la descripción"
                  }`}
                  maxLength="500"
                  required={field !== "description"}
                />
              ) : (
                <input
                  type="text"
                  name={field}
                  value={formData[field] || ""}
                  onChange={handleChange}
                  placeholder={`Ingrese ${
                    field === "name" ? "el nombre" : "el responsable"
                  }`}
                  required
                />
              )}
            </div>
          ))}

          {/* Fila de campos: Tipo de documento y Fecha */}
          <div className="form-row">
            <div className="form-group">
              <label>Tipo de Documento *</label>
              <select
                name="document_type"
                value={formData.document_type}
                onChange={handleChange}
                required
              >
                <option value="estatuto">Estatuto</option>
                <option value="reglamento">Reglamento</option>
                <option value="acta">Acta</option>
                <option value="informe">Informe</option>
                <option value="contrato">Contrato</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div className="form-group">
              <label>Fecha *</label>
              <input
                type="date"
                name="entry_date"
                value={formData.entry_date || ""}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Acciones del modal */}
          <div className="modal-actions">
            <button type="button" className="btn-cancelar" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-guardar" disabled={cargando}>
              {cargando ? "💾 Guardando..." : "💾 Guardar Cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Modal para visualizar documentos
 */
// 🎯 COMPONENTE VISUALIZADOR MEJORADO CON VISOR REAL
const VisualizadorDocumento = ({ documento, onClose }) => {
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [urlVisualizacion, setUrlVisualizacion] = useState("");
  const { fetchConAuth } = useApi();

  useEffect(() => {
    configurarVisualizacion();
  }, [documento]);

  /**
   * Configura la URL de visualización según el tipo de archivo
   */
  const configurarVisualizacion = async () => {
    try {
      setCargando(true);
      setError("");
      
      const tipoArchivo = documento.file_name?.split('.').pop()?.toLowerCase() || '';
      
      // Para PDFs - usar visor nativo del navegador
      if (tipoArchivo === 'pdf') {
        const response = await fetchConAuth(
          `http://localhost:8000/api/documents/${documento.id}/download`
        );
        
        if (!response.ok) throw new Error('Error al cargar el PDF');
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setUrlVisualizacion(url);
      }
      // Para archivos de texto
      else if (tipoArchivo === 'txt') {
        const response = await fetchConAuth(
          `http://localhost:8000/api/documents/${documento.id}/download`
        );
        
        if (!response.ok) throw new Error('Error al cargar el archivo');
        
        const texto = await response.text();
        // Mostrar texto en un elemento pre
        setUrlVisualizacion(texto);
      }
      else {
        setError("Vista previa no disponible para este tipo de archivo");
      }
      
    } catch (error) {
      console.error("Error cargando archivo:", error);
      setError("No se pudo cargar el archivo para visualización");
    } finally {
      setCargando(false);
    }
  };

  /**
   * Maneja la descarga del documento
   */
  const descargarDocumento = async () => {
    try {
      const response = await fetchConAuth(
        `http://localhost:8000/api/documents/${documento.id}/download`
      );

      if (!response.ok) throw new Error("Error al descargar");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = documento.file_name;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success(`📥 Descargando: ${documento.file_name}`);
    } catch (error) {
      toast.error("Error al descargar el documento");
    }
  };

  const tipoArchivo = documento.file_name?.split(".").pop()?.toLowerCase() || "";

  // Limpiar URL al desmontar el componente
  useEffect(() => {
    return () => {
      if (urlVisualizacion && urlVisualizacion.startsWith('blob:')) {
        URL.revokeObjectURL(urlVisualizacion);
      }
    };
  }, [urlVisualizacion]);

  return (
    <div className="modal-overlay">
      <div className="visualizador-documento">
        <div className="visualizador-header">
          <div className="documento-title">
            <h3>{documento.name}</h3>
            <span className="documento-subtitle">
              {documento.file_name} • {formatearTamaño(documento.file_size)} • {tipoArchivo.toUpperCase()}
            </span>
          </div>
          <div className="visualizador-actions">
            <button 
              className="btn-descargar"
              onClick={descargarDocumento}
              title="Descargar documento"
            >
              <i className="fas fa-download"></i> Descargar
            </button>
            <button className="btn-cerrar" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="visualizador-content">
          {cargando ? (
            <div className="cargando-contenido">
              <i className="fas fa-spinner fa-spin"></i>
              <p>Cargando documento...</p>
            </div>
          ) : error ? (
            <div className="error-visor">
              <i className="fas fa-exclamation-triangle"></i>
              <h4>No se puede visualizar</h4>
              <p>{error}</p>
              <button
                className="btn-descargar-grande"
                onClick={descargarDocumento}
              >
                <i className="fas fa-download"></i> Descargar Archivo
              </button>
            </div>
          ) : tipoArchivo === 'pdf' ? (
            <div className="visor-pdf">
              <iframe
                src={urlVisualizacion}
                width="100%"
                height="100%"
                title={`PDF - ${documento.name}`}
                style={{ border: 'none' }}
              />
            </div>
          ) : tipoArchivo === 'txt' ? (
            <div className="visor-texto">
              <pre>{urlVisualizacion}</pre>
            </div>
          ) : (
            <div className="no-visor">
              <i className="fas fa-file-download"></i>
              <h4>Vista previa no disponible</h4>
              <p>Este tipo de archivo ({tipoArchivo}) no puede visualizarse en el navegador.</p>
              <button
                className="btn-descargar-grande"
                onClick={descargarDocumento}
              >
                <i className="fas fa-download"></i> Descargar Archivo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// 🎯 COMPONENTE PRINCIPAL - LISTA DE DOCUMENTOS
// =============================================================================

const ListaDocumentos = () => {
  // ===========================================================================
  // ESTADOS Y HOOKS
  // ===========================================================================
  
  const [state, setState] = useState({
    documentos: [],
    documentosFiltrados: [],
    busqueda: "",
    cargando: false,
    error: "",
  });

  const [modales, setModales] = useState({
    visualizador: false,
    editor: false,
  });

  const [documentoSeleccionado, setDocumentoSeleccionado] = useState(null);
  const navigate = useNavigate();
  const { fetchConAuth } = useApi();

  // ===========================================================================
  // FUNCIONES PRINCIPALES
  // ===========================================================================

  /**
   * Carga los documentos desde la API
   */
  const cargarDocumentos = useCallback(async () => {
    setState((prev) => ({ ...prev, cargando: true, error: "" }));

    try {
      const response = await fetchConAuth("http://localhost:8000/api/documents/");

      if (!response.ok) throw new Error(`Error ${response.status}`);

      const result = await response.json();
      const documentos = (result.documents || result || []).map((doc, index) => ({
        id: doc.id || index,
        name: doc.name || "Sin nombre",
        document_type: doc.document_type || "otro",
        entry_date: doc.entry_date || new Date().toISOString(),
        responsable: doc.responsible || "No especificado",
        description: doc.description || "",
        file_name: doc.file_name || "archivo",
        file_size: doc.file_size || 0,
      }));

      setState((prev) => ({
        ...prev,
        documentos,
        documentosFiltrados: documentos,
      }));
      toast.success(`✅ ${documentos.length} documentos cargados`);
    } catch (error) {
      setState((prev) => ({ ...prev, error: error.message }));
      toast.error("❌ Error al cargar documentos");
    } finally {
      setState((prev) => ({ ...prev, cargando: false }));
    }
  }, [fetchConAuth]);

  /**
   * Guarda los cambios realizados a un documento
   */
  const guardarCambiosDocumento = async (documentoId, datos) => {
    try {
      console.log("📤 Enviando datos:", { documentoId, datos });

      // Crear FormData para enviar archivos + datos
      const formData = new FormData();
      formData.append("name", datos.name);
      formData.append("responsible", datos.responsable);
      formData.append("document_type", datos.document_type);
      formData.append("entry_date", datos.entry_date);

      if (datos.description) {
        formData.append("description", datos.description);
      }

      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const headers = {
        ...(token && { Authorization: `Bearer ${token}` }),
      };

      const response = await fetch(
        `http://localhost:8000/api/documents/${documentoId}`,
        {
          method: "PUT",
          headers,
          body: formData,
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText || "No se pudo actualizar el documento"}`);
      }

      const resultado = await response.json();
      toast.success("✅ Documento actualizado correctamente");
      cargarDocumentos();
      setModales((prev) => ({ ...prev, editor: false }));

      return resultado;
    } catch (error) {
      console.error("💥 Error completo al guardar:", error);
      toast.error(`❌ ${error.message || "Error al actualizar documento"}`);
      throw error;
    }
  };

  /**
   * Elimina un documento con confirmación
   */
  const eliminarDocumento = async (documento) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      html: `
        <div style="text-align: left;">
          <p>Se eliminará permanentemente el documento:</p>
          <p><strong>${documento.name}</strong></p>
          <p><small>Archivo: ${documento.file_name}</small></p>
          <p><small>Tipo: ${documento.document_type}</small></p>
          <p style="color: #dc3545; font-weight: bold;">⚠️ Esta acción no se puede deshacer</p>
        </div>
      `,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        try {
          const token = localStorage.getItem("token") || localStorage.getItem("authToken");
          const headers = {
            ...(token && { Authorization: `Bearer ${token}` }),
          };

          const response = await fetch(
            `http://localhost:8000/api/documents/${documento.id}`,
            {
              method: "DELETE",
              headers,
            }
          );

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Error ${response.status}`);
          }

          return await response.json();
        } catch (error) {
          Swal.showValidationMessage(`Error: ${error.message}`);
        }
      },
    });

    if (result.isConfirmed) {
      toast.success(`✅ "${documento.name}" eliminado correctamente`);
      cargarDocumentos();
    }
  };

  // ===========================================================================
  // MANEJADORES DE INTERFAZ
  // ===========================================================================

  /**
   * Abre un modal (visualizador o editor)
   */
  const abrirModal = (tipo, documento) => {
    setDocumentoSeleccionado(documento);
    setModales((prev) => ({ ...prev, [tipo]: true }));
  };

  /**
   * Cierra un modal
   */
  const cerrarModal = (tipo) => {
    setModales((prev) => ({ ...prev, [tipo]: false }));
  };

  // ===========================================================================
  // USE EFFECTS
  // ===========================================================================

  // Cargar documentos al montar el componente
  useEffect(() => {
    cargarDocumentos();
  }, [cargarDocumentos]);

  // Filtrar documentos cuando cambia la búsqueda
  useEffect(() => {
    const filtrados = state.documentos.filter((doc) =>
      Object.values(doc).some((val) =>
        String(val).toLowerCase().includes(state.busqueda.toLowerCase())
      )
    );
    setState((prev) => ({ ...prev, documentosFiltrados: filtrados }));
  }, [state.busqueda, state.documentos]);

  // ===========================================================================
  // COMPONENTES INTERNOS
  // ===========================================================================

  /**
   * Componente de tarjeta individual de documento
   */
  const DocumentoCard = ({ documento }) => (
    <div className="documento-card">
      <div className="documento-header">
        <span className="documento-icon">
          {getIconoPorTipo(documento.document_type)}
        </span>
        <div className="documento-title">
          <h3>{documento.name}</h3>
          <span className={`documento-tipo ${documento.document_type}`}>
            {documento.document_type}
          </span>
        </div>
      </div>

      <div className="documento-info">
        {[
          { icon: "user", text: documento.responsable },
          { icon: "calendar", text: formatearFecha(documento.entry_date) },
          { icon: "file", text: documento.file_name },
          { icon: "weight-hanging", text: formatearTamaño(documento.file_size) },
        ].map(
          (item, index) =>
            item.text && (
              <div key={index} className="info-item">
                <i className={`fas fa-${item.icon}`}></i>
                <span>{item.text}</span>
              </div>
            )
        )}
      </div>

      {documento.description && (
        <div className="documento-descripcion">
          <p title={documento.description}>
            {limitarDescripcion(documento.description)}
          </p>
        </div>
      )}

      <div className="documento-actions">
        <button
          className="btn-action visualizar"
          onClick={() => abrirModal("visualizador", documento)}
        >
          <i className="fas fa-eye"></i> Ver
        </button>
        <button
          className="btn-action editar"
          onClick={() => abrirModal("editor", documento)}
        >
          <i className="fas fa-edit"></i>
        </button>
        <button
          className="btn-action descargar"
          onClick={() => abrirModal("visualizador", documento)}
        >
          <i className="fas fa-download"></i>
        </button>
        <button
          className="btn-action eliminar"
          onClick={() => eliminarDocumento(documento)}
        >
          <i className="fas fa-trash"></i>
        </button>
      </div>
    </div>
  );

  // ===========================================================================
  // RENDER PRINCIPAL
  // ===========================================================================

  return (
    <div className="documentos-container">
      {/* Header con título y estadísticas */}
      <div className="documentos-header">
        <h2>📚 Lista de Documentos</h2>
        <div className="documentos-stats">
          <span className="stat-total">Total: {state.documentos.length}</span>
          <span className="stat-filtrados">
            Mostrando: {state.documentosFiltrados.length}
          </span>
        </div>
      </div>

      {/* Barra de búsqueda y acciones */}
      <div className="documentos-filters">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Buscar documentos..."
            value={state.busqueda}
            onChange={(e) =>
              setState((prev) => ({ ...prev, busqueda: e.target.value }))
            }
            className="search-input"
          />
        </div>
        
        <button
          className="btn-nuevo-documento"
          onClick={() => navigate("/admin/crear-documento")}
          title="Crear nuevo documento"
        >
          <i className="fas fa-plus"></i>
          Nuevo Documento
        </button>
        
        <button
          onClick={cargarDocumentos}
          className="btn-refresh"
          disabled={state.cargando}
        >
          <i className={`fas fa-sync-alt ${state.cargando ? "fa-spin" : ""}`}></i>
          Actualizar
        </button>
      </div>

      {/* Lista de documentos */}
      <div className="documentos-list">
        {state.cargando ? (
          <div className="loading-state">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Cargando documentos...</p>
          </div>
        ) : state.documentosFiltrados.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-folder-open"></i>
            <p>{state.busqueda ? "No hay resultados" : "No hay documentos"}</p>
          </div>
        ) : (
          <div className="documentos-grid">
            {state.documentosFiltrados.map((doc) => (
              <DocumentoCard key={doc.id} documento={doc} />
            ))}
          </div>
        )}
      </div>

      {/* Modales */}
      {modales.visualizador && documentoSeleccionado && (
        <VisualizadorDocumento
          documento={documentoSeleccionado}
          onClose={() => cerrarModal("visualizador")}
        />
      )}

      {modales.editor && documentoSeleccionado && (
        <EditorDocumentoModal
          documento={documentoSeleccionado}
          onClose={() => cerrarModal("editor")}
          onGuardar={guardarCambiosDocumento}
        />
      )}
    </div>
  );
};

export default ListaDocumentos;