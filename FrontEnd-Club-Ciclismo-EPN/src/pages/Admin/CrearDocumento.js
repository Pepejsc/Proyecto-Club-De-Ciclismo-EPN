import React, { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "../../assets/Styles/Admin/CrearDocumento.css";

const CrearDocumento = () => {
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de archivo
      const allowedTypes = ['.pdf', '.doc', '.docx', '.txt', '.odt'];
      const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
      
      if (!allowedTypes.includes(fileExtension)) {
        toast.error(`Tipo de archivo no permitido. Formatos aceptados: ${allowedTypes.join(', ')}`);
        e.target.value = ''; // Limpiar input
        return;
      }

      // Validar tamaño (50MB)
      if (file.size > 50 * 1024 * 1024) {
        toast.error("El archivo es demasiado grande. Máximo 50MB");
        e.target.value = '';
        return;
      }

      setArchivo(file);
      toast.success(`Archivo seleccionado: ${file.name}`);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

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

  const handleSubmit = async () => {
  try {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // 🎯 VERIFICACIÓN EXTREMA DE DATOS
    console.log("🔍 VERIFICACIÓN EXTREMA DE FORM DATA:");
    console.log("formData.responsable:", formData.responsable);
    console.log("typeof formData.responsable:", typeof formData.responsable);
    console.log("formData.responsable.length:", formData.responsable.length);

    // ✅ ENVIAR DATOS DE MANERA MUY EXPLÍCITA
    const formDataToSend = new FormData();
    
    // Agregar cada campo de manera explícita
    formDataToSend.append('name', String(formData.nombre_documento));
    formDataToSend.append('responsible', String(formData.responsable)); // ← FORZAR A STRING
    formDataToSend.append('document_type', String(formData.tipo_documento));
    formDataToSend.append('entry_date', String(formData.fecha_ingreso));
    formDataToSend.append('description', String(formData.descripcion));
    formDataToSend.append('file', archivo);

    // VERIFICAR FormData
    console.log("📤 CONTENIDO DE FormData:");
    for (let [key, value] of formDataToSend.entries()) {
      console.log(`  ${key}:`, value, `(tipo: ${typeof value})`);
    }

    // Enviar sin token para simplificar
    const response = await fetch('http://localhost:8000/api/documents/', {
      method: 'POST',
      body: formDataToSend
    });

    const result = await response.json();
    console.log("📥 RESPUESTA COMPLETA:", result);

    if (response.ok) {
      toast.success("✅ Documento creado correctamente");
      resetForm();
      setTimeout(() => navigate('/admin/lista-documentos'), 2000);
    } else {
      throw new Error(result.detail || "Error al crear documento");
    }

  } catch (error) {
    console.error("❌ Error:", error);
    toast.error(`❌ ${error.message}`);
  } finally {
    setIsSubmitting(false);
  }
  
};

  // Función para resetear el formulario
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

  return (
    <div className="editar-perfil-container">
      <h2>Crear Documento</h2>

      <div className="form-grid">
        <div>
          <label>Nombre de documento *</label>
          <input 
            name="nombre_documento" 
            value={formData.nombre_documento} 
            onChange={handleChange}
            placeholder="Ingrese el nombre del recurso"
            disabled={isSubmitting}
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

        <div>
          <label>Fecha de ingreso *</label>
          <input 
            type="date" 
            name="fecha_ingreso" 
            value={formData.fecha_ingreso} 
            onChange={handleChange}
            disabled={isSubmitting}
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
          />
        </div>

        <div className="grid-full">
          <label>Descripción *</label>
          <textarea 
            name="descripcion" 
            value={formData.descripcion} 
            onChange={handleChange}
            placeholder="Describa el documento..."
            rows="5"
            disabled={isSubmitting}
          />
        </div>

        <div className="grid-full">
          <label>Documento *</label>
          <div className="file-upload-section">
            <input 
              type="file" 
              onChange={handleFileChange}
              accept=".pdf,.doc,.docx,.txt,.odt"
              disabled={isSubmitting}
            />
            <small className="file-info">
              Formatos permitidos: PDF, DOC, DOCX, TXT, ODT (Máx. 50MB)
            </small>
            {archivo && (
              <div className="selected-file">
                📎 Archivo seleccionado: <strong>{archivo.name}</strong> 
                ({Math.round(archivo.size / 1024)} KB)
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
          {isSubmitting ? "⏳ Guardando..." : "Guardar"}
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