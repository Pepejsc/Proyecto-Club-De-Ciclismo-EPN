import React, { useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { createMembership } from "../../services/membershipService";
import "../../assets/Styles/Admin/CrearRecurso.css"; // Reusamos tus estilos de formulario

const CrearMembresia = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Datos alineados a tu tabla 'memberships' en inglés
  const [formData, setFormData] = useState({
    membership_type: "CICLISTA",
    participation_level: "BEGINNER",
    emergency_contact: "",
    emergency_phone: "",
    medical_conditions: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!formData.emergency_contact.trim()) {
      toast.error("El contacto de emergencia es obligatorio.");
      return false;
    }
    if (!formData.emergency_phone.trim()) {
      toast.error("El teléfono de emergencia es obligatorio.");
      return false;
    }
    // Validación simple de teléfono (mínimo 7 dígitos)
    if (formData.emergency_phone.replace(/\D/g, '').length < 7) {
      toast.error("Ingresa un número de teléfono válido.");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await createMembership(formData);
      toast.success("¡Solicitud enviada! Tu membresía ha sido creada.");
      
      // Redirigir al usuario a su panel o a la vista de "Mi Membresía"
      navigate("/user/mi-membresia"); 
      
    } catch (error) {
      toast.error(error.message || "Hubo un problema al crear la membresía");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="editar-perfil-container"> {/* Reusando contenedor existente */}
      <h2>Registro de Membresía</h2>
      <p style={{ marginBottom: '20px', color: '#666' }}>
        Completa tu ficha técnica para unirte oficialmente al club.
      </p>

      <div className="form-grid">
        
        {/* --- DATOS DE MEMBRESÍA --- */}
        <div>
          <label>Tipo de Membresía *</label>
          <select name="membership_type" value={formData.membership_type} onChange={handleChange}>
            <option value="CICLISTA">Ciclista (Estándar)</option>
            <option value="ENTRENADOR">Entrenador</option>
            <option value="EQUIPO_EPN">Equipo EPN (Competitivo)</option>
          </select>
        </div>

        <div>
          <label>Nivel de Experiencia *</label>
          <select name="participation_level" value={formData.participation_level} onChange={handleChange}>
            <option value="BEGINNER">Principiante (Recreativo)</option>
            <option value="INTERMEDIATE">Intermedio (Rutas medias)</option>
            <option value="ADVANCED">Avanzado (Rutas largas)</option>
            <option value="COMPETITIVE">Competitivo (Elite)</option>
          </select>
        </div>

        {/* --- DATOS DE EMERGENCIA --- */}
        <div className="grid-full">
          <h4 style={{ margin: '15px 0 10px', color: '#238CBC', borderBottom: '1px solid #eee' }}>
            Datos de Seguridad
          </h4>
        </div>

        <div>
          <label>Contacto de Emergencia (Nombre) *</label>
          <input 
            type="text"
            name="emergency_contact" 
            value={formData.emergency_contact} 
            onChange={handleChange}
            placeholder="Ej: Mamá, Esposo/a, Hermano"
          />
        </div>

        <div>
          <label>Teléfono de Emergencia *</label>
          <input 
            type="tel"
            name="emergency_phone" 
            value={formData.emergency_phone} 
            onChange={handleChange}
            placeholder="Ej: 0991234567"
          />
        </div>

        <div className="grid-full">
          <label>Condiciones Médicas / Alergias</label>
          <textarea 
            name="medical_conditions" 
            value={formData.medical_conditions} 
            onChange={handleChange}
            placeholder="Ej: Asma leve, Alergia a picaduras de abeja, Hipertensión... (Dejar en blanco si no aplica)"
            rows="3"
          />
        </div>

      </div>

      <div className="form-buttons-inline" style={{ marginTop: '25px' }}>
        <button 
          className="btn-send" 
          onClick={handleSubmit} 
          disabled={isSubmitting}
        >
          {isSubmitting ? "Registrando..." : "Guardar"}
        </button>
        <button 
          className="btn-cancel" 
          onClick={() => navigate(-1)} 
          disabled={isSubmitting}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default CrearMembresia;