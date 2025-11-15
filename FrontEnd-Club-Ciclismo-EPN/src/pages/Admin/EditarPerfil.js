import React, { useState, useEffect } from "react";
import "../../assets/Styles/Admin/EditarPerfil.css";
import { toast } from "react-toastify";
import { updatePersona, fetchMyProfile } from "../../services/userService";
import defaultProfile from "../../assets/Images/Icons/defaultProfile.png";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/Auth/UserContext";


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


  useEffect(() => {
    const cargarPerfil = async () => {
      try {
        const perfil = await fetchMyProfile();
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
        toast.error("No se pudo cargar el perfil");
      }
    };

    cargarPerfil();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const maxSizeMB = 2;
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error("La imagen es muy grande. Máximo permitido: 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (result?.startsWith("data:image")) {
        setFormData((prev) => ({
          ...prev,
          profile_picture: result,
        }));
      } else {
        toast.error("No se pudo procesar la imagen.");
      }
    };

    reader.onerror = () => {
      toast.error("Error al leer la imagen.");
    };

    reader.readAsDataURL(file);
  };

  const handleCancel = () => {
    navigate("/admin");
  };

  const validateForm = () => {
    const phoneRegex = /^\d{7,10}$/;

    if (
      !formData.first_name.trim() ||
      !formData.last_name.trim() ||
      !formData.city.trim() ||
      !formData.neighborhood.trim()
    ) {
      toast.error("Todos los campos de texto son obligatorios.");
      return false;
    }

    if (!phoneRegex.test(formData.phone_number)) {
      toast.error("Número de teléfono inválido. Debe tener entre 7 y 10 dígitos.");
      return false;
    }

    if (!formData.blood_type) {
      toast.error("Debe seleccionar un tipo de sangre.");
      return false;
    }

    if (!formData.skill_level) {
      toast.error("Debe seleccionar un nivel de habilidad.");
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    try {
      if (!personaId) {
        toast.error("No se encontró el ID de la persona");
        return;
      }
  
      if (!formData.skill_level) {
        toast.error("El nivel de habilidad es requerido");
        return;
      }
  
      const payload = { ...formData };
  
      if (payload.profile_picture?.startsWith("data:image")) {
        const parts = payload.profile_picture.split(",");
        if (parts.length === 2 && parts[1].length > 5000) {
          payload.profile_picture = parts[1];
        } else {
          toast.error("La imagen está incompleta o dañada.");
          return;
        }
      }
  
      await updatePersona(personaId, payload);
      toast.success("Perfil actualizado correctamente");
  
      // 🔄 Actualizar imagen en el sidebar
      const perfilActualizado = await fetchMyProfile();
      setUserData(perfilActualizado);
  
    } catch (error) {
      console.error("Error al actualizar:", error);
      toast.error("Hubo un problema al guardar los cambios");
    }
  };
  

  return (
    
    
    <div className="editar-perfil-container">
      <h2>Editar Perfil</h2>

      <div className="profile-picture-section">
        <div className="profile-picture-wrapper">
          <img
            src={formData.profile_picture || defaultProfile}
            alt="Foto de perfil"
            className="profile-picture"
          />
          <label htmlFor="file-input" className="camera-icon">
            <i className="fas fa-camera"></i>
          </label>
          <input
            id="file-input"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: "none" }}
          />

          {formData.profile_picture && (
            <button
              type="button"
              className="remove-icon"
              onClick={() =>
                setFormData((prev) => ({
                  ...prev,
                  profile_picture: "",
                }))
              }
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      <div className="form-grid">
        <div>
          <label>Nombre:</label>
          <input name="first_name" value={formData.first_name} onChange={handleChange} />
        </div>
        <div>
          <label>Apellido:</label>
          <input name="last_name" value={formData.last_name} onChange={handleChange} />
        </div>

        <div className="grid-full">
          <label>Teléfono:</label>
          <input name="phone_number" value={formData.phone_number} onChange={handleChange} />
        </div>

        <div>
          <label>Tipo de Sangre:</label>
          <select name="blood_type" value={formData.blood_type} onChange={handleChange}>
            <option value="">Seleccionar</option>
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
          <select name="skill_level" value={formData.skill_level} onChange={handleChange}>
            <option value="">Seleccionar</option>
            <option value="Alto">Alto</option>
            <option value="Medio">Medio</option>
            <option value="Bajo">Bajo</option>
          </select>
        </div>

        <div>
          <label>Ciudad:</label>
          <input name="city" value={formData.city} onChange={handleChange} />
        </div>
        <div>
          <label>Barrio:</label>
          <input name="neighborhood" value={formData.neighborhood} onChange={handleChange} />
        </div>
      </div>

      <div className="form-buttons-inline">
        <button className="btn-send" onClick={handleSubmit}>Guardar</button>
        <button className="btn-cancel" onClick={handleCancel}>Cancelar</button>
      </div>
    </div>
  );
};

export default EditarPerfil;
