import React, { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "../../assets/Styles/Admin/CrearDocumento.css";

const API_BASE_URL = "http://localhost:8000/api/documents/";

// --- 🛡️ CONSTANTES DE SEGURIDAD ---
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt", ".odt"];

// --- 🛡️ FUNCIÓN DE SANITIZACIÓN ---
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  // Elimina caracteres peligrosos para evitar XSS
  return input.replace(/[<>&"'/]/g, "");
};

/**
 * Componente para crear y subir nuevos documentos al sistema.
 */
const CrearDocumento = () => {
  // ===========================================================================
  // ESTADOS
  // ===========================================================================
  
  const [formData, setFormData] = useState({
    nombre_documento: "",
    tipo_documento: "",
    fecha_ingreso: "",
    descripcion: "",
    responsable: "",
  });
  
  const [archivo, setArchivo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  // ===========================================================================
  // MANEJADORES DE EVENTOS
  // ===========================================================================

  /**
   * Maneja los cambios en los inputs de texto (CON SANITIZACIÓN).
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    // 🛡️ Sanitización en tiempo real
    const safeValue = sanitizeInput(value);
    setFormData((prev) => ({ ...prev, [name]: safeValue }));
  };

  /**
   * Maneja la selección y validación del archivo.
   */
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // 🛡️ Validar extensión
      const fileExtension = "." + file.name.split(".").pop().toLowerCase();
      
      if (!ALLOWED_EXTENSIONS.includes(fileExtension)) {
        toast.error(`Tipo de archivo no permitido. Formatos aceptados: ${ALLOWED_EXTENSIONS.join(", ")}`);
        e.target.value = ""; // Limpiar input inseguro
        setArchivo(null);
        return;
      }

      // 🛡️ Validar tamaño
      if (file.size > MAX_FILE_SIZE) {
        toast.error("El archivo es demasiado grande. Máximo 50MB");
        e.target.value = ""; // Limpiar input
        setArchivo(null);
        return;
      }

      setArchivo(file);
      toast.success(`Archivo seleccionado: ${file.name}`);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  // ===========================================================================
  // LOGICA DE NEGOCIO Y VALIDACIÓN
  // ===========================================================================

  const validateForm = () => {
    if (
      !formData.nombre_documento.trim() ||
      !formData.fecha_ingreso ||
      !formData.descripcion.trim() ||
      !formData.tipo_documento ||
      !formData.responsable.trim()
    ) {
      toast.error("Todos los campos marcados con * son obligatorios.");
      return false;
    }

    if (!archivo) {
      toast.error("Debe seleccionar un archivo.");
      return false;
    }

    const selectedDate = new Date(formData.fecha_ingreso);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate > today) {
      toast.error("La fecha de ingreso no puede ser futura.");
      return false;
    }

    if (formData.descripcion.trim().length < 10) {
      toast.error("La descripción debe tener al menos 10 caracteres.");
      return false;
    }

    return true;
  };

  const resetForm = () => {
    setFormData({
      nombre_documento: "",
      tipo_documento: "",
      fecha_ingreso: "",
      descripcion: "",
      responsable: "",
    });
    setArchivo(null);
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = "";
  };

  const handleSubmit = async () => {
    try {
      if (!validateForm()) return;

      setIsSubmitting(true);

      const formDataToSend = new FormData();
      // 🛡️ Enviar datos limpios (trim)
      formDataToSend.append("name", String(formData.nombre_documento).trim());
      formDataToSend.append("responsible", String(formData.responsable).trim());
      formDataToSend.append("document_type", String(formData.tipo_documento));
      formDataToSend.append("entry_date", String(formData.fecha_ingreso));
      formDataToSend.append("description", String(formData.descripcion).trim());
      formDataToSend.append("file", archivo);

      const response = await fetch(API_BASE_URL, {
        method: "POST",
        body: formDataToSend,
      });

      const result = await response.json();

      if (response.ok) {
        toast.success("Documento creado correctamente");
        resetForm();
        setTimeout(() => navigate("/admin/lista-documentos"), 2000);
      } else {
        throw new Error(result.detail || "Error al crear documento");
      }
    } catch (error) {
      console.error("Error al crear documento:", error);
      toast.error(`❌ ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===========================================================================
  // RENDERIZADO
  // ===========================================================================

  return (
    <div className="crear-documento-container">
      <h2>Crear Documento</h2>

      <div className="form-grid">
        {/* Fila 1 */}
        <div>
          <label>Nombre de documento *</label>
          <input 
            name="nombre_documento" 
            value={formData.nombre_documento} 
            onChange={handleChange}
            placeholder="Ingrese el nombre del recurso"
            disabled={isSubmitting}
            maxLength={100} // 🛡️ Límite
          />
        </div>

        <div>
          <label>Tipo de documento *</label>
          <select 
            name="tipo_documento" 
            value={formData.tipo_documento} 
            onChange={handleChange}
            disabled={isSubmitting}
          >
            <option value="">Seleccionar</option>
            <option value="estatuto">Estatuto</option>
            <option value="reglamento">Reglamento</option>
            <option value="acta">Acta</option>
            <option value="informe">Informe</option>
            <option value="contrato">Contrato</option>
            <option value="otro">Otro</option>
          </select>
        </div>

        {/* Fila 2 */}
        <div>
          <label>Fecha de ingreso *</label>
          <input 
            type="date" 
            name="fecha_ingreso" 
            value={formData.fecha_ingreso} 
            onChange={handleChange}
            disabled={isSubmitting}
            max={new Date().toISOString().split("T")[0]} // 🛡️ No fechas futuras
          />
        </div>

        <div>
          <label>Responsable *</label>
          <input 
            name="responsable" 
            value={formData.responsable} 
            onChange={handleChange}
            placeholder="Nombre del responsable"
            disabled={isSubmitting}
            maxLength={100} // 🛡️ Límite
          />
        </div>

        {/* Campos Anchos */}
        <div className="grid-full">
          <label>Descripción *</label>
          <textarea 
            name="descripcion" 
            value={formData.descripcion} 
            onChange={handleChange}
            placeholder="Describa el documento..."
            rows="5"
            disabled={isSubmitting}
            maxLength={500} // 🛡️ Límite
          />
        </div>

        <div className="grid-full">
          <label>Documento *</label>
          <div className="file-upload-section">
            <input 
              type="file" 
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt,.odt" // 🛡️ Restricción HTML
              disabled={isSubmitting}
            />
            <small className="file-info">
              Formatos permitidos: PDF, DOC, DOCX, TXT, ODT (Máx. 50MB)
            </small>
            {archivo && (
              <div className="selected-file">
                Archivo seleccionado: <strong>{archivo.name}</strong> 
                {" "}({Math.round(archivo.size / 1024)} KB)
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="form-buttons-inline">
        <button 
          className="btn-send" 
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Guardando..." : "Guardar"}
        </button>
        <button 
          className="btn-cancel" 
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default CrearDocumento;