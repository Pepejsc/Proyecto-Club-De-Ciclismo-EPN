import React, { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "../../assets/Styles/Admin/CrearRecurso.css";

// Estado inicial para todos los campos posibles
const initialState = {
  // Campo clave
  tipo_recurso: "", // 'COMERCIAL' o 'OPERATIVO'

  // --- Campos Comunes ---
  nombre: "",
  descripcion: "",
  categoria: "",
  fecha_adquisicion: "",
  costo_adquisicion: "",
  observacion: "",

  // --- Campos Comerciales ---
  precio_venta: "",
  stock_inicial: "",
  sku: "",

  // --- Campos Operativos ---
  codigo_activo: "",
  estado: "",
  responsable: "",
  ubicacion: "",
};

const CrearRecurso = () => {
  const [formData, setFormData] = useState(initialState);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const validateForm = () => {
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
      responsable,
      ubicacion,
    } = formData;

    // 1. Validar el tipo de recurso
    if (!tipo_recurso) {
      toast.error("Debe seleccionar un tipo de recurso.");
      return false;
    }

    // 2. Validar campos comunes
    if (
      !nombre.trim() ||
      !fecha_adquisicion ||
      !descripcion.trim() ||
      !costo_adquisicion
    ) {
      toast.error("Por favor, llene todos los campos comunes (*).");
      return false;
    }

    // 3. Validar campos específicos
    if (tipo_recurso === "OPERATIVO") {
      if (
        !codigo_activo.trim() ||
        !estado ||
        !responsable.trim() ||
        !ubicacion.trim()
      ) {
        toast.error("Por favor, llene todos los campos de Activo Operativo (*).");
        return false;
      }
      
      const idRegex = /^[a-zA-Z0-9-]+$/;
      if (!idRegex.test(codigo_activo)) {
        toast.error("El Código de Activo solo puede contener letras, números y guiones.");
        return false;
      }

    } else if (tipo_recurso === "COMERCIAL") {
      if (!precio_venta || !stock_inicial) {
        toast.error("Por favor, llene todos los campos de Producto Comercial (*).");
        return false;
      }
      if (parseFloat(precio_venta) <= 0 || parseInt(stock_inicial) < 0) {
        toast.error("El precio de venta y el stock deben ser valores positivos.");
        return false;
      }
    }

    // 4. Validar reglas de negocio (existentes)
    const selectedDate = new Date(fecha_adquisicion);
    const today = new Date();
    // Ajuste para comparar solo fechas (ignorando la hora)
    selectedDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      toast.error("La fecha de adquisición no puede ser futura.");
      return false;
    }

    if (descripcion.trim().length < 10) {
      toast.error("La descripción debe tener al menos 10 caracteres.");
      return false;
    }

    if (formData.observacion && formData.observacion.length > 500) {
      toast.error("La observación no puede exceder los 500 caracteres.");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    try {
      if (!validateForm()) {
        return;
      }

      // --- Aquí construyes el payload para la API ---
      // 1. Empieza con los campos comunes
      let payload = {
        tipo_recurso: formData.tipo_recurso,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        categoria: formData.categoria,
        fecha_adquisicion: formData.fecha_adquisicion,
        costo_adquisicion: parseFloat(formData.costo_adquisicion),
        observacion: formData.observacion,
      };

      // 2. Añade los campos específicos
      if (formData.tipo_recurso === "COMERCIAL") {
        payload = {
          ...payload,
          precio_venta: parseFloat(formData.precio_venta),
          stock_inicial: parseInt(formData.stock_inicial),
          sku: formData.sku,
        };
      } else if (formData.tipo_recurso === "OPERATIVO") {
        payload = {
          ...payload,
          codigo_activo: formData.codigo_activo,
          estado: formData.estado,
          responsable: formData.responsable,
          ubicacion: formData.ubicacion,
        };
      }

      console.log("Enviando a la API:", payload);
      // Simulación de la llamada a la API
      // await crearRecurso(payload); 
      
      toast.success("Recurso creado correctamente");
      
      // Resetea el formulario usando el estado inicial
      setFormData(initialState);

    } catch (error) {
      console.error("Error al crear recurso:", error);
      toast.error("Hubo un problema al crear el recurso");
    }
  };

  return (
    <div className="editar-perfil-container">
      <h2>Crear Nuevo Recurso</h2>

      {/* --- CAMPO CLAVE --- */}
      <div className="form-grid">
        <div className="grid-full">
          <label>Tipo de Recurso *</label>
          <select
            name="tipo_recurso"
            value={formData.tipo_recurso}
            onChange={handleChange}
          >
            <option value="">Seleccionar tipo...</option>
            <option value="COMERCIAL">Producto Comercial (Para Venta)</option>
            <option value="OPERATIVO">Activo Operativo (Del Club)</option>
          </select>
        </div>
      </div>

      {/* Renderiza el resto del formulario solo si se ha seleccionado un tipo */}
      {formData.tipo_recurso && (
        <>
          <h3 className="form-section-header">Campos Comunes</h3>
          <div className="form-grid">
            <div>
              <label>Nombre recurso *</label>
              <input
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                placeholder="Ej: Jersey 2025, Carpa Plegable"
              />
            </div>
            
            <div>
              <label>Categoría</label>
              <input
                name="categoria"
                value={formData.categoria}
                onChange={handleChange}
                placeholder="Ej: Indumentaria, Mobiliario"
              />
            </div>
            
            <div>
              <label>Fecha de Adquisición *</label>
              <input
                type="date"
                name="fecha_adquisicion"
                value={formData.fecha_adquisicion}
                onChange={handleChange}
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
              />
            </div>
          </div>

          {/* --- SECCIÓN COMERCIAL (CONDICIONAL) --- */}
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
                  />
                </div>
                <div>
                  <label>SKU (Opcional)</label>
                  <input
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder="Ej: JSY-EPN-25"
                  />
                </div>
              </div>
            </>
          )}

          {/* --- SECCIÓN OPERATIVA (CONDICIONAL) --- */}
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
                  />
                </div>

                <div>
                  <label>Estado *</label>
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                  >
                    <option value="">Seleccionar estado</option>
                    <option value="DISPONIBLE">Disponible</option>
                    <option value="ASIGNADO">Asignado</option>
                    <option value="EN_MANTENIMIENTO">En Mantenimiento</option>
                    <option value="DE_BAJA">De Baja</option>
                  </select>
                </div>
                
                <div>
                  <label>Responsable *</label>
                  <input
                    name="responsable"
                    value={formData.responsable}
                    onChange={handleChange}
                    placeholder="Nombre del responsable"
                  />
                </div>

                <div>
                  <label>Ubicación *</label>
                  <input
                    name="ubicacion"
                    value={formData.ubicacion}
                    onChange={handleChange}
                    placeholder="Ubicación física del activo"
                  />
                </div>
              </div>
            </>
          )}

          {/* --- CAMPO COMÚN (OBSERVACIÓN) --- */}
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
              />
            </div>
          </div>
        </>
      )}

      {/* --- BOTONES --- */}
      <div className="form-buttons-inline">
        <button className="btn-send" onClick={handleSubmit}>
          Guardar
        </button>
        <button className="btn-cancel" onClick={handleCancel}>
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default CrearRecurso;