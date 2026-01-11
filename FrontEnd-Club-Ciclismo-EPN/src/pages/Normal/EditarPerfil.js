import React, { useState, useEffect } from "react";
import "../../assets/Styles/Admin/EditarPerfil.css";
import { toast } from "react-toastify";
import { updateBasicInfo, getMyProfile } from "../../services/authService";
import defaultProfile from "../../assets/Images/Icons/defaultProfile.png";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../context/Auth/UserContext";

// --- CONSTANTE DEL BACKEND ---
const BACKEND_URL = "http://127.0.0.1:8000";

const getEditImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${BACKEND_URL}${cleanPath}`;
};
// ----------------------------

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({ ...prev, profile_picture: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    try {
      if (!personaId) return;
      const payload = { ...formData };

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
            accept="image/*"
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
        <button className="btn-cancel" onClick={() => navigate("/user")}>
          Cancelar
        </button>
      </div>
    </div>
  );
};

export default EditarPerfil;
