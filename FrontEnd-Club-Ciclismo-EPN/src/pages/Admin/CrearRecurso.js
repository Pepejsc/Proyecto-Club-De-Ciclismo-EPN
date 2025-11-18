import React, { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "../../assets/Styles/Admin/CrearRecurso.css";
import { getToken } from "../../services/authService"; 

const apiUrl = process.env.REACT_APP_API_URL;

const initialState = {
  tipo_recurso: "",
  nombre: "",
  descripcion: "",
  categoria: "",
  fecha_adquisicion: "",
  costo_adquisicion: "",
  observacion: "",
  tallas_disponibles: "", // <-- (AÑADIDO)
  precio_venta: "",
  stock_inicial: "",
  sku: "",
  codigo_activo: "",
  estado: "",
  responsable: "",
  ubicacion: "",
};

const CrearRecurso = () => {
  const [formData, setFormData] = useState(initialState);
  const [archivoPrincipal, setArchivoPrincipal] = useState(null);
  const [archivosGaleria, setArchivosGaleria] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    // ... (sin cambios)
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  const handlePrincipalFileChange = (e) => {
    // ... (sin cambios)
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { 
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
      setArchivoPrincipal(file);
      toast.success(`Imagen principal: ${file.name}`);
    }
  };
  const handleGalleryFileChange = (e) => {
    // ... (sin cambios)
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    if (files.length > 3) {
      toast.error("Puedes subir un máximo de 3 imágenes de galería.");
      e.target.value = ''; 
      return;
    }
    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`El archivo ${file.name} es demasiado grande (Máx 10MB).`);
        e.target.value = '';
        return;
      }
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`Archivo ${file.name} no permitido. Solo JPG, PNG o WebP.`);
        e.target.value = '';
        return;
      }
    }
    setArchivosGaleria(files);
    toast.success(`${files.length} imágenes de galería seleccionadas.`);
  };
  const handleCancel = () => {
    // ... (sin cambios)
    navigate(-1);
  };
  const validateForm = () => {
    // ... (sin cambios)
    const {
      tipo_recurso,
      nombre,
      fecha_adquisicion,
      descripcion,
      costo_adquisicion,
    } = formData;
    if (!tipo_recurso) {
      toast.error("Debe seleccionar un tipo de recurso.");
      return false;
    }
    if (
      !nombre.trim() ||
      !fecha_adquisicion ||
      !descripcion.trim() ||
      !costo_adquisicion
    ) {
      toast.error("Por favor, llene todos los campos comunes (*).");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    // ... (lógica de validación sin cambios)
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    
    const formDataToSend = new FormData();
    
    // 1. Añadir campos de texto
    formDataToSend.append('tipo_recurso', formData.tipo_recurso);
    formDataToSend.append('nombre', formData.nombre.trim());
    formDataToSend.append('descripcion', formData.descripcion.trim());
    formDataToSend.append('categoria', formData.categoria.trim() || '');
    formDataToSend.append('fecha_adquisicion', formData.fecha_adquisicion);
    formDataToSend.append('costo_adquisicion', parseFloat(formData.costo_adquisicion));
    formDataToSend.append('observacion', formData.observacion.trim() || '');
    formDataToSend.append('tallas_disponibles', formData.tallas_disponibles.trim() || ''); // <-- (AÑADIDO)
    
    // 2. Añadir archivos
    if (archivoPrincipal) {
      formDataToSend.append('file', archivoPrincipal);
    }
    if (archivosGaleria.length > 0) {
      archivosGaleria.forEach(file => {
        formDataToSend.append('files_gallery', file); 
      });
    }

    // 3. Añadir campos condicionales
    if (formData.tipo_recurso === "COMERCIAL") {
      // ... (sin cambios)
      formDataToSend.append('precio_venta', parseFloat(formData.precio_venta));
      formDataToSend.append('stock_inicial', parseInt(formData.stock_inicial));
      formDataToSend.append('sku', formData.sku.trim() || '');
    } else if (formData.tipo_recurso === "OPERATIVO") {
      // ... (sin cambios)
      formDataToSend.append('codigo_activo', formData.codigo_activo.trim());
      formDataToSend.append('estado', formData.estado);
      formDataToSend.append('ubicacion', formData.ubicacion.trim() || '');
    }

    // 4. Lógica de envío (sin cambios)
    try {
      const token = getToken();
      if (!token) {
        toast.error("Error de autenticación.");
        setIsSubmitting(false);
        return;
      }
      const response = await fetch(`${apiUrl}/recursos/`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formDataToSend,
      });
      const result = await response.json();
      if (response.ok) {
        toast.success(`✅ Recurso "${result.nombre}" creado correctamente`);
        navigate('/admin/lista-recursos');
      } else {
        throw new Error(result.detail || "Error al crear el recurso");
      }
    } catch (error) {
      console.error("❌ Error en handleSubmit:", error);
      toast.error(`❌ ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="editar-perfil-container">
      <h2>Crear Nuevo Recurso</h2>
      
      {/* ... (Select de Tipo de Recurso sin cambios) ... */}
      <div className="form-grid">
        <div className="grid-full">
          <label>Tipo de Recurso *</label>
          <select
            name="tipo_recurso"
            value={formData.tipo_recurso}
            onChange={handleChange}
            disabled={isSubmitting}
          >
            <option value="">Seleccionar tipo...</option>
            <option value="COMERCIAL">Producto Comercial (Para Venta)</option>
            <option value="OPERATIVO">Activo Operativo (Del Club)</option>
          </select>
        </div>
      </div>

      {formData.tipo_recurso && (
        <>
          <h3 className="form-section-header">Campos Comunes</h3>
          <div className="form-grid">
             {/* ... (campos nombre, categoria, fecha, costo, descripcion) ... */}
             <div>
              <label>Nombre recurso *</label>
              <input name="nombre" value={formData.nombre} onChange={handleChange} placeholder="Ej: Jersey 2025" disabled={isSubmitting} />
            </div>
            <div>
              <label>Categoría</label>
              <input name="categoria" value={formData.categoria} onChange={handleChange} placeholder="Ej: Indumentaria" disabled={isSubmitting} />
            </div>
            <div>
              <label>Fecha de Adquisición *</label>
              <input type="date" name="fecha_adquisicion" value={formData.fecha_adquisicion} onChange={handleChange} disabled={isSubmitting} />
            </div>
            <div>
              <label>Costo de Adquisición (USD) *</label>
              <input type="number" name="costo_adquisicion" value={formData.costo_adquisicion} onChange={handleChange} placeholder="Ej: 25.50" min="0" disabled={isSubmitting} />
            </div>
            <div className="grid-full">
              <label>Descripción *</label>
              <textarea name="descripcion" value={formData.descripcion} onChange={handleChange} placeholder="Describa el recurso..." rows="3" disabled={isSubmitting} />
            </div>

            {/* --- (NUEVO CAMPO DE TALLAS) --- */}
            <div className="grid-full">
              <label>Tallas Disponibles (Opcional)</label>
              <input
                type="text"
                name="tallas_disponibles"
                value={formData.tallas_disponibles}
                onChange={handleChange}
                placeholder="Ej: S, M, L, XL ó Talla Única ó 10-13"
                disabled={isSubmitting} 
              />
            </div>
            {/* --- FIN CAMPO TALLAS --- */}

            {/* --- (Campo Imagen Principal) --- */}
            <div className="grid-full">
              <label>Imagen Principal (Opcional)</label>
              <input
                type="file"
                name="imagen_file_principal"
                onChange={handlePrincipalFileChange} 
                accept="image/png, image/jpeg, image/webp"
                disabled={isSubmitting} 
              />
              {archivoPrincipal && (
                <div style={{marginTop: '10px', fontSize: '14px'}}>
                  Archivo principal: <strong>{archivoPrincipal.name}</strong>
                </div>
              )}
            </div>
            
            {/* --- (Campo Galería) --- */}
            <div className="grid-full">
              <label>Imágenes de Galería (Opcional, máx 3)</label>
              <input
                type="file"
                name="imagen_file_gallery"
                multiple 
                onChange={handleGalleryFileChange} 
                accept="image/png, image/jpeg, image/webp"
                disabled={isSubmitting} 
              />
              {archivosGaleria.length > 0 && (
                <div style={{marginTop: '10px', fontSize: '14px'}}>
                  {archivosGaleria.length} archivos de galería seleccionados.
                </div>
              )}
            </div>

          </div> 

          {/* ... (Secciones COMERCIAL y OPERATIVO sin cambios) ... */}
          {formData.tipo_recurso === "COMERCIAL" && (
            <>
              <h3 className="form-section-header">Detalles del Producto Comercial</h3>
              <div className="form-grid">
                <div>
                  <label>Precio de Venta (USD) *</label>
                  <input type="number" name="precio_venta" value={formData.precio_venta} onChange={handleChange} min="0" disabled={isSubmitting} />
                </div>
                <div>
                  <label>Stock Inicial *</label>
                  <input type="number" name="stock_inicial" value={formData.stock_inicial} onChange={handleChange} min="0" disabled={isSubmitting} />
                </div>
                <div>
                  <label>SKU (Opcional)</label>
                  <input name="sku" value={formData.sku} onChange={handleChange} disabled={isSubmitting} />
                </div>
              </div>
            </>
          )}
          {formData.tipo_recurso === "OPERATIVO" && (
            <>
              <h3 className="form-section-header">Detalles del Activo Operativo</h3>
              <div className="form-grid">
                <div>
                  <label>Código de Activo *</label>
                  <input name="codigo_activo" value={formData.codigo_activo} onChange={handleChange} disabled={isSubmitting} />
                </div>
                <div>
                  <label>Estado *</label>
                  <select name="estado" value={formData.estado} onChange={handleChange} disabled={isSubmitting}>
                    <option value="">Seleccionar estado</option>
                    <option value="DISPONIBLE">Disponible</option>
                    <option value="ASIGNADO">Asignado</option>
                    <option value="EN_MANTENIMIENTO">En Mantenimiento</option>
                    <option value="DE_BAJA">De Baja</option>
                  </select>
                </div>
                <div>
                  <label>Responsable (Opcional por ahora)</label>
                  <input name="responsable" value={formData.responsable} onChange={handleChange} disabled={isSubmitting} />
                </div>
                <div>
                  <label>Ubicación *</label>
                  <input name="ubicacion" value={formData.ubicacion} onChange={handleChange} disabled={isSubmitting} />
                </div>
              </div>
            </>
          )}

          {/* ... (Observación y Botones sin cambios) ... */}
          <h3 className="form-section-header">Información Adicional</h3>
          <div className="form-grid">
            <div className="grid-full">
              <label>Observación</label>
              <textarea name="observacion" value={formData.observacion} onChange={handleChange} rows="3" disabled={isSubmitting} />
            </div>
          </div>
          
          <div className="form-buttons-inline">
            <button className="btn-send" onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? "⏳ Guardando..." : "Guardar"}
            </button>
            <button className="btn-cancel" onClick={handleCancel} disabled={isSubmitting}>
              Cancelar
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CrearRecurso;