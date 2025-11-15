import React, { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "../../assets/Styles/Admin/CrearRecurso.css";
import { getToken } from "../../services/authService"; 

const apiUrl = process.env.REACT_APP_API_URL;

// Estado inicial (quitamos imagen_url, ahora se maneja en 'archivo')
const initialState = {
  tipo_recurso: "",
  nombre: "",
  descripcion: "",
  categoria: "",
  fecha_adquisicion: "",
  costo_adquisicion: "",
  observacion: "",
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
  // --- (NUEVO) Estado para el archivo ---
  const [archivo, setArchivo] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- (NUEVO) Manejador para el archivo ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // (Opcional) Validaciones de tamaño o tipo
      if (file.size > 10 * 1024 * 1024) { // Límite de 10MB
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
      toast.success(`Archivo seleccionado: ${file.name}`);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  // --- validateForm (ya no necesita validar imagen_url) ---
  const validateForm = () => {
    // ... (Tu lógica de validación actual está bien, la dejamos)
    // (Solo quitamos la validación de 'imagen_url' que era opcional)
    const {
      tipo_recurso,
      nombre,
      fecha_adquisicion,
      descripcion,
      costo_adquisicion,
      precio_venta,
      stock_inicial,
      codigo_activo,
      estado,
      ubicacion,
    } = formData;

    if (!tipo_recurso) {
      toast.error("Debe seleccionar un tipo de recurso.");
      return false;
    }
    // ... (resto de tus validaciones)
    if (
      !nombre.trim() ||
      !fecha_adquisicion ||
      !descripcion.trim() ||
      !costo_adquisicion
    ) {
      toast.error("Por favor, llene todos los campos comunes (*).");
      return false;
    }
    // ... (resto de tus validaciones)
    return true;
  };

  // --- handleSubmit (¡REFACTORIZADO para FormData!) ---
  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);
    
    // 1. Construir FormData (como en CrearDocumento)
    const formDataToSend = new FormData();
    
    // 2. Añadir todos los campos del formulario
    formDataToSend.append('tipo_recurso', formData.tipo_recurso);
    formDataToSend.append('nombre', formData.nombre.trim());
    formDataToSend.append('descripcion', formData.descripcion.trim());
    formDataToSend.append('categoria', formData.categoria.trim() || '');
    formDataToSend.append('fecha_adquisicion', formData.fecha_adquisicion);
    formDataToSend.append('costo_adquisicion', parseFloat(formData.costo_adquisicion));
    formDataToSend.append('observacion', formData.observacion.trim() || '');

    // 3. Añadir el archivo (si existe)
    if (archivo) {
      formDataToSend.append('file', archivo);
    }

    // 4. Añadir campos condicionales
    if (formData.tipo_recurso === "COMERCIAL") {
      formDataToSend.append('precio_venta', parseFloat(formData.precio_venta));
      formDataToSend.append('stock_inicial', parseInt(formData.stock_inicial));
      formDataToSend.append('sku', formData.sku.trim() || '');
    } else if (formData.tipo_recurso === "OPERATIVO") {
      formDataToSend.append('codigo_activo', formData.codigo_activo.trim());
      formDataToSend.append('estado', formData.estado);
      formDataToSend.append('ubicacion', formData.ubicacion.trim() || '');
      // (Dejamos id_usuario_responsable nulo por ahora)
    }

    console.log("📤 Enviando Payload (FormData)...");

    try {
      const token = getToken();
      if (!token) {
        toast.error("Error de autenticación. Por favor, inicie sesión de nuevo.");
        setIsSubmitting(false);
        return;
      }

      // 5. Enviar FormData
      const response = await fetch(`${apiUrl}/recursos/`, {
        method: "POST",
        headers: {
          // ¡¡NO AÑADIR 'Content-Type'!! El navegador lo hace solo
          "Authorization": `Bearer ${token}`
        },
        body: formDataToSend, // Enviar FormData directamente
      });

      const result = await response.json();
      console.log("📥 Respuesta del Servidor:", result);

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


  // --- CAMBIOS EN EL JSX ---
  return (
    <div className="editar-perfil-container">
      <h2>Crear Nuevo Recurso</h2>

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
             {/* ... (campos de nombre, categoría, fecha, costo) ... */}
             <div>
              <label>Nombre recurso *</label>
              <input
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Jersey 2025, Carpa Plegable"
                disabled={isSubmitting} 
              />
            </div>
            
            <div>
              <label>Categoría</label>
              <input
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                placeholder="Ej: Indumentaria, Mobiliario"
                disabled={isSubmitting} 
              />
            </div>
            
            <div>
              <label>Fecha de Adquisición *</label>
              <input
                type="date"
                name="fecha_adquisicion"
                value={formData.fecha_adquisicion}
                onChange={handleChange}
                disabled={isSubmitting} 
              />
            </div>
            
            <div>
              <label>Costo de Adquisición (USD) *</label>
              <input
                type="number"
                name="costo_adquisicion"
                value={formData.costo_adquisicion}
                onChange={handleChange}
                placeholder="Ej: 25.50"
                min="0"
                disabled={isSubmitting} 
              />
            </div>

            <div className="grid-full">
              <label>Descripción *</label>
              <textarea
                name="descripcion"
                value={formData.descripcion}
                onChange={handleChange}
                placeholder="Describa el recurso..."
                rows="3"
                disabled={isSubmitting} 
              />
            </div>

            {/* --- (CAMPO DE IMAGEN ACTUALIZADO) --- */}
            <div className="grid-full">
              <label>Imagen (Opcional)</label>
              <input
                type="file" // <-- CAMBIO
                name="imagen_file"
                onChange={handleFileChange} // <-- CAMBIO
                accept="image/png, image/jpeg, image/webp"
                disabled={isSubmitting} 
              />
              {archivo && (
                <div style={{marginTop: '10px', fontSize: '14px'}}>
                  Archivo seleccionado: <strong>{archivo.name}</strong>
                </div>
              )}
            </div>
            {/* --- FIN DE CAMPO DE IMAGEN --- */}

          </div> {/* <-- Cierre del .form-grid de Campos Comunes */}

          {/* ... (Secciones COMERCIAL y OPERATIVO sin cambios) ... */}
          {formData.tipo_recurso === "COMERCIAL" && (
            <>
              <h3 className="form-section-header">Detalles del Producto Comercial</h3>
              <div className="form-grid">
                <div>
                  <label>Precio de Venta (USD) *</label>
                  <input
                    type="number"
                    name="precio_venta"
                    value={formData.precio_venta}
                    onChange={handleChange}
                    placeholder="Ej: 35.00"
                    min="0"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label>Stock Inicial *</label>
                  <input
                    type="number"
                    name="stock_inicial"
                    value={formData.stock_inicial}
                    onChange={handleChange}
                    placeholder="Ej: 50"
                    min="0"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label>SKU (Opcional)</label>
                  <input
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder="Ej: JSY-EPN-25"
                    disabled={isSubmitting}
                  />
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
                  <input
                    name="codigo_activo"
                    value={formData.codigo_activo}
                    onChange={handleChange}
                    placeholder="Ej: EPN-CARPA-001"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label>Estado *</label>
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  >
                    <option value="">Seleccionar estado</option>
                    <option value="DISPONIBLE">Disponible</option>
                    <option value="ASIGNADO">Asignado</option>
                    <option value="EN_MANTENIMIENTO">En Mantenimiento</option>
                    <option value="DE_BAJA">De Baja</option>
                  </select>
                </div>
                <div>
                  <label>Responsable (Opcional por ahora)</label>
                  <input
                    name="responsable"
                    value={formData.responsable}
                    onChange={handleChange}
                    placeholder="Nombre del responsable"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label>Ubicación *</label>
                  <input
                    name="ubicacion"
                    value={formData.ubicacion}
                    onChange={handleChange}
                    placeholder="Ubicación física del activo"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </>
          )}

          {/* ... (Observación y Botones sin cambios) ... */}
          <h3 className="form-section-header">Información Adicional</h3>
          <div className="form-grid">
            <div className="grid-full">
              <label>Observación</label>
              <textarea
                name="observacion"
                value={formData.observacion}
                onChange={handleChange}
                placeholder="Observaciones adicionales (opcional)"
                rows="3"
                disabled={isSubmitting}
              />
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
        </>
      )}
    </div>
  );
};

export default CrearRecurso;