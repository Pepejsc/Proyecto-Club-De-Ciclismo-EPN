import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { createMembership } from "../../services/membershipService";
import { getToken } from "../../services/authService"; 
import "../../assets/Styles/Admin/CrearRecurso.css"; 

const CrearMembresia = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState(null); 
  
  // Estado para controlar la visualización de campos EPN
  const [isEpnDetected, setIsEpnDetected] = useState(false);

  useEffect(() => {
    // Decodificación del token para detectar dominio EPN
    const decodeToken = () => {
      try {
        const token = getToken(); 
        if (!token) return;

        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        const email = payload.sub || payload.email;
        
        if (email && email.toLowerCase().trim().endsWith("@epn.edu.ec")) {
            setIsEpnDetected(true);
        }
      } catch (error) {
        console.error("Error validando token:", error);
      }
    };

    decodeToken();
  }, []);

  const [formData, setFormData] = useState({
    membership_type: "CICLISTA",
    participation_level: "BEGINNER",
    emergency_contact: "",
    emergency_phone: "",
    medical_conditions: "",
    unique_code: "" 
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
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
    
    // Validación condicional para EPN
    if (isEpnDetected) {
        if (!formData.unique_code.trim()) {
            toast.error("El Código Único es obligatorio para estudiantes.");
            return false;
        }
        if (!file) {
            toast.error("Debes subir tu comprobante de matrícula.");
            return false;
        }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const dataToSend = new FormData();
      
      dataToSend.append("membership_type", formData.membership_type);
      dataToSend.append("participation_level", formData.participation_level);
      dataToSend.append("emergency_contact", formData.emergency_contact);
      dataToSend.append("emergency_phone", formData.emergency_phone);
      
      if(formData.medical_conditions) dataToSend.append("medical_conditions", formData.medical_conditions);

      if (isEpnDetected) {
          dataToSend.append("unique_code", formData.unique_code);
          if (file) {
              dataToSend.append("matriculation_file", file);
          }
      }

      await createMembership(dataToSend);
      
      toast.success("¡Solicitud enviada! Tu membresía ha sido creada.");
      navigate("/user/mi-membresia"); 
      
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.detail || error.message || "Hubo un problema";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="editar-perfil-container">
      <h2>Registro de Membresía</h2>
      {isEpnDetected && (
        <div style={{
            backgroundColor: '#e3f2fd', 
            border: '1px solid #2196f3', 
            borderRadius: '8px', 
            padding: '15px', 
            marginBottom: '20px',
            color: '#0d47a1',
            fontSize: '0.95rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
        }}>
            <span style={{fontSize: '1.5rem'}}>🎓</span>
            <div>
              <strong>Estudiante EPN Identificado</strong>
              <div style={{fontSize: '0.85rem', marginTop: '4px'}}>
                 Detectamos tu correo institucional. Por favor completa los datos académicos requeridos.
              </div>
            </div>
        </div>
      )}

      <div className="form-grid">
        
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

        {isEpnDetected && (
            <>
                <div className="grid-full">
                    <h4 style={{ margin: '15px 0 10px', color: '#238CBC', borderBottom: '1px solid #eee' }}>
                        Datos Académicos
                    </h4>
                </div>
                <div>
                    <label>Código Único *</label>
                    <input 
                        type="text" 
                        name="unique_code"
                        placeholder="Ej: 201820616"
                        value={formData.unique_code}
                        onChange={handleChange}
                    />
                </div>
                <div>
                    <label>Matrícula / SAEw (Imagen o PDF) *</label>
                    <input 
                        type="file" 
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                        style={{padding: '5px', border: '1px dashed #ccc', width: '100%'}}
                    />
                    <small style={{color: '#666'}}>Sube una captura de tu SAEw o certificado</small>
                </div>
            </>
        )}

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
            placeholder="Ej: Mamá, Esposo/a"
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
            placeholder="Ej: Asma leve, Alergia a picaduras..."
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