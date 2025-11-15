import React, { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "../../assets/Styles/Admin/CrearRecurso.css";

const CrearMembresia = () => {
  const [formData, setFormData] = useState({
    nombre_recurso: "",
    id_recurso: "",
    fecha_ingreso: "",
    descripcion: "",
    estado: "",
    responsable: "",
    ubicacion: "",
    observacion: ""
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const validateForm = () => {
    if (
      !formData.nombre_recurso.trim() ||
      !formData.id_recurso.trim() ||
      !formData.fecha_ingreso ||
      !formData.descripcion.trim() ||
      !formData.estado ||
      !formData.responsable.trim() ||
      !formData.ubicacion.trim()
    ) {
      toast.error("Todos los campos marcados con * son obligatorios.");
      return false;
    }

    const idRegex = /^[a-zA-Z0-9]+$/;
    if (!idRegex.test(formData.id_recurso)) {
      toast.error("El ID del recurso solo puede contener letras y números.");
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

      // await crearMembresia(formData);
      
      toast.success("Recurso creado correctamente");
      
      setFormData({
        nombre_recurso: "",
        id_recurso: "",
        fecha_ingreso: "",
        descripcion: "",
        estado: "",
        responsable: "",
        ubicacion: "",
        observacion: ""
      });

    } catch (error) {
      console.error("Error al crear recurso:", error);
      toast.error("Hubo un problema al crear el recurso");
    }
  };

  return (
    <div className="editar-perfil-container">
      <h2>Crear Recurso</h2>

      <div className="form-grid">
        <div>
          <label>Nombre recurso *</label>
          <input 
            name="nombre_recurso" 
            value={formData.nombre_recurso} 
            onChange={handleChange}
            placeholder="Ingrese el nombre del recurso"
          />
        </div>
        
        <div>
          <label>ID recurso *</label>
          <input 
            name="id_recurso" 
            value={formData.id_recurso} 
            onChange={handleChange}
            placeholder="Ej: ABC001"
          />
        </div>

        <div>
          <label>Fecha de ingreso *</label>
          <input 
            type="date" 
            name="fecha_ingreso" 
            value={formData.fecha_ingreso} 
            onChange={handleChange}
          />
        </div>

        <div>
          <label>Estado *</label>
          <select name="estado" value={formData.estado} onChange={handleChange}>
            <option value="">Seleccionar</option>
            <option value="Nuevo">Nuevo</option>
            <option value="Disponible">Disponible</option>
            <option value="Sin stock">Sin stock</option>
          </select>
        </div>

        <div className="grid-full">
          <label>Descripción *</label>
          <textarea 
            name="descripcion" 
            value={formData.descripcion} 
            onChange={handleChange}
            placeholder="Describa el recurso..."
            rows="4"
          />
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
            placeholder="Ubicación física del recurso"
          />
        </div>

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

      <div className="form-buttons-inline">
        <button className="btn-send" onClick={handleSubmit}>Guardar</button>
        <button className="btn-cancel" onClick={handleCancel}>Cancelar</button>
      </div>
    </div>
  );
};

export default CrearMembresia;