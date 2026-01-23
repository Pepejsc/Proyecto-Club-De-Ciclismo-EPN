import React, { useEffect, useState, useCallback, useMemo } from "react";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import "../../assets/Styles/Admin/ListaDocumentos.css";

const API_BASE_URL = "http://localhost:8000/api/documents";

/**
 * Formatea bytes a un string legible (KB, MB, GB).
 */
const formatearTamaño = (bytes) => {
  if (!bytes) return "N/A";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

/**
 * Formatea fecha ISO a formato local español.
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
 * Retorna un emoji/icono basado en el tipo de documento.
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
 * Trunca textos largos.
 */
const limitarDescripcion = (descripcion, maxLength = 120) => {
  if (!descripcion) return "";
  return descripcion.length <= maxLength
    ? descripcion
    : descripcion.substring(0, maxLength) + "...";
};

/**
 * Hook para manejar peticiones autenticadas.
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

/**
 * Modal para edición de metadatos de documentos.
 */
const EditorDocumentoModal = ({ documento, onClose, onGuardar }) => {
  const [formData, setFormData] = useState({});
  const [guardando, setGuardando] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await onGuardar(documento.id, formData);
    } finally {
      setGuardando(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (!documento) return null;

  return (
    <div className="modal-overlay">
      <div className="editor-documento-modal">
        <div className="modal-header">
          <h3>Editar {documento.name}</h3>
        </div>
        <form onSubmit={handleSubmit} className="form-editor">
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
                  placeholder="Ingrese la descripción"
                  maxLength="500"
                />
              ) : (
                <input
                  type="text"
                  name={field}
                  value={formData[field] || ""}
                  onChange={handleChange}
                  placeholder={`Ingrese ${field === "name" ? "el nombre" : "el responsable"}`}
                  required
                />
              )}
            </div>
          ))}

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
          <div className="modal-actions">
            <button type="submit" className="btn-actualizar" disabled={guardando}>
              {guardando ? "Actualizando..." : "Actualizar"}
            </button>
            <button type="button" className="btn-cancelar" onClick={onClose}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Modal para visualizar documentos.
 */
const VisualizadorDocumento = ({ documento, onClose }) => {
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [urlVisualizacion, setUrlVisualizacion] = useState("");
  const { fetchConAuth } = useApi();

  const tipoArchivo = useMemo(() => 
    documento.file_name?.split(".").pop()?.toLowerCase() || "", 
    [documento.file_name]
  );

  const configurarVisualizacion = useCallback(async () => {
    try {
      setCargando(true);
      setError("");

      if (tipoArchivo === "pdf" || tipoArchivo === "txt") {
        const response = await fetchConAuth(
          `${API_BASE_URL}/${documento.id}/download`
        );

        if (!response.ok) throw new Error("Error al cargar el archivo");

        if (tipoArchivo === "pdf") {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setUrlVisualizacion(url);
        } else {
          const texto = await response.text();
          setUrlVisualizacion(texto);
        }
      } else {
        setError("Vista previa no disponible para este tipo de archivo");
      }
    } catch (err) {
      console.error("Error cargando archivo:", err);
      setError("No se pudo cargar el archivo para visualización");
    } finally {
      setCargando(false);
    }
  }, [documento.id, tipoArchivo, fetchConAuth]);

  useEffect(() => {
    configurarVisualizacion();
    return () => {
      if (urlVisualizacion && typeof urlVisualizacion === "string" && urlVisualizacion.startsWith("blob:")) {
        URL.revokeObjectURL(urlVisualizacion);
      }
    };
  }, [configurarVisualizacion]);

  const descargarDocumento = async () => {
    try {
      const response = await fetchConAuth(
        `${API_BASE_URL}/${documento.id}/download`
      );

      if (!response.ok) throw new Error("Error al descargar");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = documento.file_name;
      link.click();
      window.URL.revokeObjectURL(url);

      toast.success(`Descargando: ${documento.file_name}`);
    } catch {
      toast.error("Error al descargar el documento");
    }
  };

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
            <button className="btn-descargar" onClick={descargarDocumento} title="Descargar documento">
              <i className="fas fa-download"></i> Descargar
            </button>
            <button className="btn-cerrar" onClick={onClose}>✕</button>
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
              <button className="btn-descargar-grande" onClick={descargarDocumento}>
                <i className="fas fa-download"></i> Descargar Archivo
              </button>
            </div>
          ) : tipoArchivo === "pdf" ? (
            <div className="visor-pdf">
              <iframe
                src={urlVisualizacion}
                width="100%"
                height="100%"
                title={`PDF - ${documento.name}`}
                style={{ border: "none" }}
              />
            </div>
          ) : tipoArchivo === "txt" ? (
            <div className="visor-texto">
              <pre>{urlVisualizacion}</pre>
            </div>
          ) : (
            <div className="no-visor">
              <i className="fas fa-file-download"></i>
              <h4>Vista previa no disponible</h4>
              <p>Este tipo de archivo ({tipoArchivo}) no puede visualizarse en el navegador.</p>
              <button className="btn-descargar-grande" onClick={descargarDocumento}>
                <i className="fas fa-download"></i> Descargar Archivo
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Componente Principal: Lista de Documentos
 */
const ListaDocumentos = () => {
  const [documentos, setDocumentos] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [modales, setModales] = useState({ visualizador: false, editor: false });
  const [documentoSeleccionado, setDocumentoSeleccionado] = useState(null);
  
  const navigate = useNavigate();
  const { fetchConAuth } = useApi();

  const cargarDocumentos = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchConAuth(`${API_BASE_URL}/`);
      if (!response.ok) throw new Error(`Error ${response.status}`);

      const result = await response.json();
      const docs = (result.documents || result || []).map((doc, index) => ({
        id: doc.id || index,
        name: doc.name || "Sin nombre",
        document_type: doc.document_type || "otro",
        entry_date: doc.entry_date || new Date().toISOString(),
        responsable: doc.responsible || "No especificado",
        description: doc.description || "",
        file_name: doc.file_name || "archivo",
        file_size: doc.file_size || 0,
      }));

      setDocumentos(docs);
    } catch (err) {
      toast.error("Error al cargar documentos: " + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [fetchConAuth]);

  useEffect(() => {
    cargarDocumentos();
  }, [cargarDocumentos]);

  const documentosFiltrados = useMemo(() => {
    if (!busqueda) return documentos;
    const lowerBusqueda = busqueda.toLowerCase();
    return documentos.filter((doc) =>
      Object.values(doc).some((val) =>
        String(val).toLowerCase().includes(lowerBusqueda)
      )
    );
  }, [busqueda, documentos]);

  const guardarCambiosDocumento = async (documentoId, datos) => {
    try {
      const formData = new FormData();
      formData.append("name", datos.name);
      formData.append("responsible", datos.responsable);
      formData.append("document_type", datos.document_type);
      formData.append("entry_date", datos.entry_date);
      if (datos.description) formData.append("description", datos.description);

      const token = localStorage.getItem("token") || localStorage.getItem("authToken");
      const headers = { ...(token && { Authorization: `Bearer ${token}` }) };

      const response = await fetch(`${API_BASE_URL}/${documentoId}`, {
        method: "PUT",
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "No se pudo actualizar");
      }

      toast.success("Documento actualizado correctamente");
      cargarDocumentos();
      cerrarModal("editor");
    } catch (error) {
      console.error("Error al guardar:", error);
      toast.error(error.message || "Error al actualizar documento");
    }
  };

  const eliminarDocumento = async (documento) => {
    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Esta acción eliminará el documento de forma permanente.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#2196F3",
      cancelButtonColor: "#D93E3E",
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      showLoaderOnConfirm: true,
      preConfirm: async () => {
        try {
          const token = localStorage.getItem("token") || localStorage.getItem("authToken");
          const response = await fetch(`${API_BASE_URL}/${documento.id}`, {
            method: "DELETE",
            headers: { ...(token && { Authorization: `Bearer ${token}` }) },
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText);
          }
          return await response.json();
        } catch (error) {
          Swal.showValidationMessage(`Error: ${error.message}`);
        }
      },
    });

    if (result.isConfirmed) {
      toast.success("Documento eliminado correctamente");
      cargarDocumentos();
    }
  };

  const abrirModal = (tipo, documento) => {
    setDocumentoSeleccionado(documento);
    setModales((prev) => ({ ...prev, [tipo]: true }));
  };

  const cerrarModal = (tipo) => {
    setModales((prev) => ({ ...prev, [tipo]: false }));
  };

  return (
    <div className="documentos-container">
      <div className="documentos-header">
        <h2>Lista de Documentos</h2>
        <div className="documentos-stats">
          <span className="stat-total">Total: {documentos.length}</span>
          <span className="stat-filtrados">Mostrando: {documentosFiltrados.length}</span>
        </div>
      </div>

      <div className="documentos-filters">
        <div className="search-box">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder="Buscar documentos..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="search-input"
          />
        </div>
        
        <button
          className="btn-nuevo-documento"
          onClick={() => navigate("/admin/crear-documento")}
          title="Crear nuevo documento"
        >
          <i className="fas fa-plus"></i> Nuevo Documento
        </button>
        
        <button
          onClick={cargarDocumentos}
          className="btn-refresh"
          disabled={isLoading}
        >
          <i className={`fas fa-sync-alt ${isLoading ? "fa-spin" : ""}`}></i> Actualizar
        </button>
      </div>

      <div className="documentos-list">
        {isLoading ? (
          <div className="loading-state">
            <i className="fas fa-spinner fa-spin"></i>
            <p>Cargando documentos...</p>
          </div>
        ) : documentosFiltrados.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-folder-open"></i>
            <p>{busqueda ? "No hay resultados para la búsqueda" : "No hay documentos disponibles"}</p>
          </div>
        ) : (
          <div className="documentos-grid">
            {documentosFiltrados.map((doc) => (
              <div key={doc.id} className="documento-card">
                <div className="documento-header">
                  <span className="documento-icon">{getIconoPorTipo(doc.document_type)}</span>
                  <div className="documento-title">
                    <h3>{doc.name}</h3>
                    <span className={`documento-tipo ${doc.document_type}`}>{doc.document_type}</span>
                  </div>
                </div>

                <div className="documento-info">
                  <div className="info-item"><i className="fas fa-user"></i><span>{doc.responsable}</span></div>
                  <div className="info-item"><i className="fas fa-calendar"></i><span>{formatearFecha(doc.entry_date)}</span></div>
                  <div className="info-item"><i className="fas fa-file"></i><span>{doc.file_name}</span></div>
                  <div className="info-item"><i className="fas fa-weight-hanging"></i><span>{formatearTamaño(doc.file_size)}</span></div>
                </div>

                {doc.description && (
                  <div className="documento-descripcion">
                    <p title={doc.description}>{limitarDescripcion(doc.description)}</p>
                  </div>
                )}

                <div className="documento-actions">
                  <button className="btn-action visualizar" onClick={() => abrirModal("visualizador", doc)}>
                    <i className="fas fa-eye"></i> Ver
                  </button>
                  <button className="btn-action editar" onClick={() => abrirModal("editor", doc)}>
                    <i className="fas fa-edit"></i>
                  </button>
                  <button className="btn-action descargar" onClick={() => abrirModal("visualizador", doc)}>
                    <i className="fas fa-download"></i>
                  </button>
                  <button className="btn-action eliminar" onClick={() => eliminarDocumento(doc)}>
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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