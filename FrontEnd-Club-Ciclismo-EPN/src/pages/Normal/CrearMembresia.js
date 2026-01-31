import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { createMembership } from "../../services/membershipService";
import { getToken } from "../../services/authService";
import "../../assets/Styles/Normal/CrearMembresia.css";

const CrearMembresia = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [file, setFile] = useState(null);
  const [isEpnDetected, setIsEpnDetected] = useState(false);

  const [formData, setFormData] = useState({
    membership_type: "",
    participation_level: "",
    emergency_contact: "",
    emergency_phone: "",
    medical_conditions: "",
    unique_code: ""
  });

  useEffect(() => {
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

  // --- 🛡️ LÓGICA DE VALIDACIÓN EN TIEMPO REAL ---
  const handleChange = (e) => {
    const { name, value } = e.target;
    let safeValue = value;

    // 1. Validar Teléfono (Solo números, máximo 10 caracteres)
    if (name === "emergency_phone") {
        safeValue = value.replace(/[^0-9]/g, ""); // Borra todo lo que no sea número
        if (safeValue.length > 10) return; // Bloquea si intenta pasar de 10
    } 
    // 2. Validar Nombre Contacto (Solo letras y espacios)
    else if (name === "emergency_contact") {
        // Regex: Solo letras (incluye tildes y ñ) y espacios.
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(value)) {
            return; // Si escribe un número o símbolo, no se actualiza
        }
        safeValue = value;
    }
    // 3. Código Único (Solo números)
    else if (name === "unique_code") {
        safeValue = value.replace(/[^0-9]/g, "");
        if (safeValue.length > 20) return;
    }
    // 4. Texto libre (Condiciones médicas): Sanitización agresiva de HTML
    else {
        // Elimina caracteres peligrosos para XSS: < > " ' `
        safeValue = value.replace(/[<>"'`]/g, "");
    }

    setFormData((prev) => ({ ...prev, [name]: safeValue }));
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (!allowedTypes.includes(selectedFile.type)) {
        toast.error("Formato no permitido. Solo PDF, JPG o PNG.");
        e.target.value = null;
        setFile(null);
        return;
      }

      if (selectedFile.size > maxSize) {
        toast.error("El archivo es demasiado grande (Máx 5MB).");
        e.target.value = null;
        setFile(null);
        return;
      }

      setFile(selectedFile);
    }
  };

  // --- 🛡️ VALIDACIÓN FINAL ANTES DE ENVIAR ---
  const validateForm = () => {
    // 1. Nombre
    if (!formData.emergency_contact.trim()) {
      toast.error("El nombre de contacto es obligatorio.");
      return false;
    }
    if (formData.emergency_contact.length < 3) {
      toast.error("El nombre es muy corto.");
      return false;
    }

    // 2. Teléfono (Validación estricta de Ecuador)
    // Debe tener exactamente 10 dígitos y empezar con '09'
    const phoneRegex = /^09\d{8}$/;
    if (!formData.emergency_phone.trim()) {
      toast.error("El teléfono es obligatorio.");
      return false;
    }
    if (!phoneRegex.test(formData.emergency_phone)) {
      toast.error("El celular debe tener 10 dígitos y empezar con '09'.");
      return false;
    }
    
    // 3. EPN
    if (isEpnDetected) {
        if (!formData.unique_code.trim()) {
            toast.error("El Código Único es obligatorio.");
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
      dataToSend.append("emergency_contact", formData.emergency_contact.trim());
      dataToSend.append("emergency_phone", formData.emergency_phone);
      
      if(formData.medical_conditions.trim()) {
          dataToSend.append("medical_conditions", formData.medical_conditions.trim());
      }

      if (isEpnDetected) {
          dataToSend.append("unique_code", formData.unique_code);
          if (file) {
              dataToSend.append("matriculation_file", file);
          }
      }

      await createMembership(dataToSend);
      
      toast.success("¡Membresía creada con éxito!");
      navigate("/user/mi-membresia"); 
      
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.detail || error.message || "Error al crear la membresía";
      toast.error(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="cm-container">
      <h2>Registro de Membresía</h2>
      
      {isEpnDetected && (
        <div className="cm-epn-alert">
            <span className="cm-epn-icon">🎓</span>
            <div>
              <strong>Estudiante EPN Identificado</strong>
              <div className="cm-epn-text-small">
                 Detectamos tu correo institucional. Por favor completa los datos académicos.
              </div>
            </div>
        </div>
      )}

      <div className="cm-form-grid">
        
        <div className="cm-form-group">
          <label htmlFor="membership_type">Tipo de Membresía *</label>
          <select 
            id="membership_type"
            name="membership_type" 
            className="cm-select"
            value={formData.membership_type} 
            onChange={handleChange}
          >
            <option value="" disabled>-- Selecciona una opción --</option>
            <option value="CICLISTA">Ciclista (Estándar)</option>
            <option value="ENTRENADOR">Entrenador</option>
            <option value="EQUIPO_EPN">Equipo EPN (Competitivo)</option>
          </select>
        </div>

        <div className="cm-form-group">
          <label htmlFor="participation_level">Nivel de Experiencia *</label>
          <select 
            id="participation_level"
            name="participation_level" 
            className="cm-select"
            value={formData.participation_level} 
            onChange={handleChange}
          >
            <option value="" disabled>-- Selecciona una opción --</option>
            <option value="BEGINNER">Principiante (Recreativo)</option>
            <option value="INTERMEDIATE">Intermedio (Rutas medias)</option>
            <option value="ADVANCED">Avanzado (Rutas largas)</option>
            <option value="COMPETITIVE">Competitivo (Elite)</option>
          </select>
        </div>

        {isEpnDetected && (
            <>
                <div className="cm-grid-full">
                    <h4 className="cm-section-header">Datos Académicos</h4>
                </div>
                <div className="cm-form-group">
                    <label htmlFor="unique_code">Código Único *</label>
                    <input 
                        id="unique_code"
                        type="text" 
                        name="unique_code"
                        className="cm-input"
                        placeholder="Ej: 201820616"
                        value={formData.unique_code}
                        onChange={handleChange}
                        maxLength={20}
                    />
                </div>
                <div className="cm-form-group">
                    <label htmlFor="file_upload">Matrícula / SAEw (Imagen o PDF) *</label>
                    <input 
                        id="file_upload"
                        type="file" 
                        accept="image/png, image/jpeg, application/pdf"
                        className="cm-input cm-file-input"
                        onChange={handleFileChange}
                    />
                    <small className="cm-help-text">Sube una captura de tu SAEw o certificado</small>
                </div>
            </>
        )}

        <div className="cm-grid-full">
          <h4 className="cm-section-header">Datos de Seguridad</h4>
        </div>

        <div className="cm-form-group">
          <label htmlFor="emergency_contact">Contacto de Emergencia *</label>
          <input 
            id="emergency_contact"
            type="text"
            name="emergency_contact" 
            className="cm-input"
            value={formData.emergency_contact} 
            onChange={handleChange}
            placeholder="Ej: María Pérez"
            maxLength={100}
          />
        </div>

        <div className="cm-form-group">
          <label htmlFor="emergency_phone">Teléfono de Emergencia *</label>
          <input 
            id="emergency_phone"
            type="tel"
            name="emergency_phone" 
            className="cm-input"
            value={formData.emergency_phone} 
            onChange={handleChange}
            placeholder="Ej: 0991234567"
            maxLength={10}
          />
        </div>

        <div className="cm-grid-full cm-form-group">
          <label htmlFor="medical_conditions">Condiciones Médicas / Alergias</label>
          <textarea 
            id="medical_conditions"
            name="medical_conditions" 
            className="cm-textarea"
            value={formData.medical_conditions} 
            onChange={handleChange}
            placeholder="Ej: Asma leve, Alergia a picaduras... (Sin caracteres especiales)"
            rows="3"
            maxLength={500}
          />
        </div>

      </div>

      <div className="cm-buttons-container">
        <button 
          className="cm-btn cm-btn-save" 
          onClick={handleSubmit} 
          disabled={isSubmitting}
        >
          {isSubmitting ? "Guardando..." : "Guardar"}
        </button>
        <button 
          className="cm-btn cm-btn-cancel" 
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