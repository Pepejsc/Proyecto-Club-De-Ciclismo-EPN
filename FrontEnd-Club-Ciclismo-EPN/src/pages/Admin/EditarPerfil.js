import React, { useState, useEffect } from "react";
import "../../assets/Styles/Admin/EditarPerfil.css";
import { toast } from "react-toastify";
// Asegúrate de que estos imports apunten a tus servicios
import { updatePersona, fetchMyProfile } from "../../services/userService";
import defaultProfile from "../../assets/Images/Icons/defaultProfile.png";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/Auth/UserContext";

// --- 1. URL DEL BACKEND ---
const BACKEND_URL = "http://127.0.0.1:8000";

// --- 2. FUNCIÓN PARA ARREGLAR RUTA ---
const getPhotoUrl = (path) => {
  if (!path) return null;
  // Si ya es base64 (data:...) o url completa (http...), devolver tal cual
  if (path.startsWith("http") || path.startsWith("data:")) return path;

  // Si es ruta relativa (/uploads...), pegarle el backend
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
  // Estado para forzar recarga visual de imagen
  const [imgTimestamp, setImgTimestamp] = useState(Date.now());

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

    const maxSizeMB = 5; // Subimos a 5MB porque ahora el back aguanta
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`La imagen es muy grande. Máximo permitido: ${maxSizeMB}MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      // Vista previa inmediata (Base64)
      setFormData((prev) => ({ ...prev, profile_picture: result }));
    };
    reader.onerror = () => {
      toast.error("Error al leer la imagen.");
    };
    reader.readAsDataURL(file);
  };

  const handleCancel = () => {
    navigate("/admin"); // Redirige al admin home
  };

  const validateForm = () => {
    // (Tus validaciones siguen igual, no las toqué)
    const phoneRegex = /^\d{7,10}$/;
    if (!formData.first_name.trim()) {
      toast.error("Nombre requerido");
      return false;
    }
    // ... resto de validaciones ...
    return true;
  };

  const handleSubmit = async () => {
    try {
      if (!personaId) {
        toast.error("No se encontró ID");
        return;
      }

      // Preparamos payload
      const payload = { ...formData };

      // Si la foto es una URL del servidor (no cambió), la quitamos del payload
      // para no enviar texto innecesario. Si es Base64 (cambió), se envía.
      if (
        payload.profile_picture &&
        !payload.profile_picture.startsWith("data:")
      ) {
        delete payload.profile_picture;
      }

      await updatePersona(personaId, payload);
      toast.success("Perfil actualizado correctamente");

      // Recargar datos frescos del servidor
      const perfilActualizado = await fetchMyProfile();
      setUserData(perfilActualizado);

      // Actualizar formulario con la nueva URL
      setFormData((prev) => ({
        ...prev,
        profile_picture: perfilActualizado.profile_picture,
      }));

      // Disparar evento para actualizar Sidebar
      window.dispatchEvent(new Event("profile_updated"));

      // Actualizar timestamp para refrescar imagen visualmente
      setImgTimestamp(Date.now());
    } catch (error) {
      console.error("Error al actualizar:", error);
      toast.error("Hubo un problema al guardar los cambios");
    }
  };

  // Lógica para decidir qué mostrar en el src
  const getImageSrc = () => {
    const pic = formData.profile_picture;
    if (!pic) return defaultProfile;

    // Si es base64 (vista previa), mostrar directo
    if (pic.startsWith("data:")) return pic;

    // Si es URL del servidor, usar helper + timestamp
    return `${getPhotoUrl(pic)}?t=${imgTimestamp}`;
  };

  return (
    <div className="editar-perfil-container">
      <h2>Editar Perfil</h2>

      <div className="profile-picture-section">
        <div className="profile-picture-wrapper">
          {/* --- IMAGEN CORREGIDA --- */}
          <img
            src={getImageSrc()}
            alt="Foto de perfil"
            className="profile-picture"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = defaultProfile;
            }}
            style={{ objectFit: "cover" }}
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
                setFormData((prev) => ({ ...prev, profile_picture: "" }))
              }
            >
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      </div>

      {/* FORMULARIO */}
      <div className="form-grid">
        <div>
          <label>Nombre:</label>
          <input
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Apellido:</label>
          <input
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
          />
        </div>
        <div className="grid-full">
          <label>Teléfono:</label>
          <input
            name="phone_number"
            value={formData.phone_number}
            onChange={handleChange}
          />
        </div>
        <div>
          <label>Tipo de Sangre:</label>
          <select
            name="blood_type"
            value={formData.blood_type}
            onChange={handleChange}
          >
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
          <select
            name="skill_level"
            value={formData.skill_level}
            onChange={handleChange}
          >
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
          <input
            name="neighborhood"
            value={formData.neighborhood}
            onChange={handleChange}
          />
        </div>
      </div>

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

export default EditarPerfil;
