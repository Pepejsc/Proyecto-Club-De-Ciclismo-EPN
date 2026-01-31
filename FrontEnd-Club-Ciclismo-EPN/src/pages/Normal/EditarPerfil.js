import React, { useState, useEffect } from "react";
import "../../assets/Styles/Admin/EditarPerfil.css";
import { toast } from "react-toastify";
import { updateBasicInfo, getMyProfile } from "../../services/authService";
import defaultProfile from "../../assets/Images/Icons/defaultProfile.png";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/Auth/UserContext";

const BACKEND_URL = "http://127.0.0.1:8000";

const getEditImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${BACKEND_URL}${cleanPath}`;
};

const EditarPerfil = () => {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    phone_number: "",
    city: "",
    neighborhood: "",
    blood_type: "",
    skill_level: "",
    profile_picture: "",
  });
  
  const [personaId, setPersonaId] = useState(null);
  const navigate = useNavigate();
  const { setUserData } = useUser();
  const [imageTimestamp, setImageTimestamp] = useState(Date.now());

  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const perfil = await getMyProfile();
        setPersonaId(perfil.id);
        setFormData({
          first_name: perfil.first_name || "",
          last_name: perfil.last_name || "",
          phone_number: perfil.phone_number || "",
          city: perfil.city || "",
          neighborhood: perfil.neighborhood || "",
          blood_type: perfil.blood_type || "",
          skill_level: perfil.skill_level || "",
          profile_picture: perfil.profile_picture || "",
        });
      } catch (error) {
        toast.error("Error cargando perfil");
      }
    };
    cargarPerfil();
  }, []);

  // --- 🛡️ LÓGICA DE SEGURIDAD Y SANITIZACIÓN ---
  
  const sanitizeInput = (input) => {
    // Elimina caracteres peligrosos para evitar inyecciones XSS
    return input ? input.replace(/[<>&"'/]/g, "") : "";
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let safeValue = value;

    // 1. Validar Teléfono (Solo números, máximo 10 caracteres)
    if (name === "phone_number") {
        safeValue = value.replace(/[^0-9]/g, ""); // Solo números
        if (safeValue.length > 10) return; // Límite 10
    } 
    // 2. Validar Nombres y Apellidos (Solo letras y espacios)
    else if (name === "first_name" || name === "last_name") {
        // Regex: Solo letras (tildes, ñ) y espacios
        if (!/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]*$/.test(value)) {
            return;
        }
        safeValue = value;
    }
    // 3. Sanitización general (Ciudad, Barrio)
    else {
        safeValue = sanitizeInput(value);
    }

    setFormData((prev) => ({ ...prev, [name]: safeValue }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validación de seguridad de archivo
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const maxSizeMB = 5; 

    if (!allowedTypes.includes(file.type)) {
        toast.error("Formato no permitido. Solo JPG o PNG.");
        return;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`La imagen es muy grande. Máximo permitido: ${maxSizeMB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, profile_picture: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  // --- 🛡️ VALIDACIÓN ANTES DE ENVIAR ---
  const validateForm = () => {
    // Nombres
    if (!formData.first_name.trim()) {
      toast.error("El nombre es obligatorio.");
      return false;
    }
    if (formData.first_name.length < 2) {
        toast.error("El nombre es muy corto.");
        return false;
    }
    if (!formData.last_name.trim()) {
        toast.error("El apellido es obligatorio.");
        return false;
    }

    // Teléfono
    const phoneRegex = /^09\d{8}$/;
    if (formData.phone_number && !phoneRegex.test(formData.phone_number)) {
      // Solo validamos si hay teléfono escrito
      toast.error("El celular debe tener 10 dígitos y empezar con '09'.");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    // Ejecutar validación
    if (!validateForm()) return;

    try {
      if (!personaId) return;
      
      // Preparamos payload con datos limpios (trim)
      const payload = { 
          ...formData,
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          city: formData.city.trim(),
          neighborhood: formData.neighborhood.trim()
      };

      if (
        payload.profile_picture &&
        !payload.profile_picture.startsWith("data:")
      ) {
        delete payload.profile_picture;
      }

      const updatedData = await updateBasicInfo(personaId, payload);
      toast.success("Perfil actualizado");

      setUserData(updatedData);
      window.dispatchEvent(new Event("profile_updated"));

      setFormData((prev) => ({
        ...prev,
        profile_picture: updatedData.profile_picture,
      }));
      setImageTimestamp(Date.now());
    } catch (error) {
      toast.error("Error al guardar");
    }
  };

  return (
    <div className="editar-perfil-container">
      <h2>Editar Perfil</h2>

      <div className="profile-picture-section">
        <div className="profile-picture-wrapper">
          <img
            src={
              formData.profile_picture
                ? formData.profile_picture.startsWith("data:")
                  ? formData.profile_picture
                  : `${getEditImageUrl(
                      formData.profile_picture
                    )}?t=${imageTimestamp}`
                : defaultProfile
            }
            alt="Foto de perfil"
            className="profile-picture"
            style={{ objectFit: "cover" }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = defaultProfile;
            }}
          />
          <label htmlFor="file-input" className="camera-icon">
            <i className="fas fa-camera"></i>
          </label>
          <input
            id="file-input"
            type="file"
            accept="image/png, image/jpeg, image/jpg"
            onChange={handleImageChange}
            style={{ display: "none" }}
          />
        </div>
      </div>

      <div className="form-grid">
        <div>
          <label>Nombre:</label>
          <input
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            maxLength={50}
            placeholder="Solo letras"
          />
        </div>
        <div>
          <label>Apellido:</label>
          <input
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            maxLength={50}
            placeholder="Solo letras"
          />
        </div>
        <div className="grid-full">
          <label>Teléfono:</label>
          <input
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
            maxLength={10}
            placeholder="Ej: 0991234567"
          />
        </div>
        <div>
          <label>Tipo de Sangre:</label>
          <select
            name="blood_type"
            value={formData.blood_type}
            onChange={handleChange}
          >
            <option value="" disabled>Seleccionar</option> {/* Opción deshabilitada */}
            <option value="A+">A+</option>
            <option value="A-">A-</option>
            <option value="B+">B+</option>
            <option value="B-">B-</option>
            <option value="AB+">AB+</option>
            <option value="AB-">AB-</option>
            <option value="O+">O+</option>
            <option value="O-">O-</option>
          </select>
        </div>
        <div>
          <label>Nivel:</label>
          <select
            name="skill_level"
            value={formData.skill_level}
            onChange={handleChange}
          >
            <option value="" disabled>Seleccionar</option> {/* Opción deshabilitada */}
            <option value="Alto">Alto</option>
            <option value="Medio">Medio</option>
            <option value="Bajo">Bajo</option>
          </select>
        </div>
        <div>
          <label>Ciudad:</label>
          <input 
            name="city" 
            value={formData.city} 
            onChange={handleChange} 
            maxLength={50}
            placeholder="Ej: Quito"
          />
        </div>
        <div>
          <label>Barrio:</label>
          <input
            name="neighborhood"
            value={formData.neighborhood}
            onChange={handleChange}
            maxLength={50}
            placeholder="Ej: La Floresta"
          />
        </div>
      </div>

      <div className="form-buttons-inline">
        <button className="btn-send" onClick={handleSubmit}>
          Guardar
        </button>
        <button className="btn-cancel" onClick={() => navigate("/user")}>
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default EditarPerfil;