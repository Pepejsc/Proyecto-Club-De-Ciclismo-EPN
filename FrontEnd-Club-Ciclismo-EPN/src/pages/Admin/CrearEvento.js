import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getRoutes } from "../../services/routeService";
import { createEvent } from "../../services/eventService";
import { toast } from "react-toastify";
import "../../assets/Styles/Admin/CrearEvento.css";
import { GoogleMap, Marker, useLoadScript, Autocomplete } from "@react-google-maps/api";

const LIBRARIES = ["places"];

const CrearEvento = () => {
  const navigate = useNavigate();
  const [imageSelected, setImageSelected] = useState(false);
  const [fileName, setFileName] = useState("");
  const [routes, setRoutes] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    event_type: "",
    route_id: "",
    meeting_point: "",
    creation_date: "",
    event_level: "",
    event_mode: "",
    image: null,
  });

  const centerDefault = { lat: -0.1807, lng: -78.4678 };
  const mapContainerStyle = { width: "100%", height: "300px" };
  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [marker, setMarker] = useState(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        const data = await getRoutes();
        setRoutes(data);
      } catch (error) {
        console.error("Error al cargar las rutas:", error);
        toast.error("Error al cargar las rutas");
      }
    };
    fetchRoutes();
  }, []);

  // --- 🛡️ 1. LÓGICA DE SEGURIDAD (SANITIZACIÓN) ---
  const sanitizeInput = (input) => {
    // Elimina caracteres peligrosos para evitar inyecciones XSS
    return input ? input.replace(/[<>&"'/]/g, "") : "";
  };

  const handlePlaceChanged = () => {
    const autocomplete = autocompleteRef.current;
    if (!autocomplete) return;

    const place = autocomplete.getPlace();
    if (!place || !place.geometry) {
      toast.error("Por favor selecciona una dirección válida de la lista.");
      return;
    }

    const location = place.geometry.location;
    const latLng = {
      lat: location.lat(),
      lng: location.lng(),
    };

    // Sanitizamos la dirección que viene de Google por seguridad
    const safeAddress = sanitizeInput(place.formatted_address);

    setMarker(latLng);
    setFormData((prev) => ({
      ...prev,
      meeting_point: safeAddress,
    }));

    if (mapRef.current) {
      mapRef.current.panTo(latLng);
    }
  };

  const handleMapLoad = (map) => {
    mapRef.current = map;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    // Sanitizamos todos los inputs de texto al escribir
    setFormData((prev) => ({ ...prev, [name]: sanitizeInput(value) }));
  };

  // Manejo específico para el input del mapa (que permite escritura manual)
  const handleMapInputChange = (e) => {
      const cleanValue = sanitizeInput(e.target.value);
      setFormData((prev) => ({ ...prev, meeting_point: cleanValue }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    
    if (!file) {
      setImageSelected(false);
      setFormData((prev) => ({ ...prev, image: null }));
      return;
    }

    // --- 🛡️ VALIDACIÓN DE ARCHIVO (Tipo y Tamaño) ---
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    
    if (!allowedTypes.includes(file.type)) {
        toast.error("Formato no válido. Solo se permiten imágenes (JPG, PNG, WEBP).");
        e.target.value = null; // Limpiar input
        return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no debe superar los 2MB");
      e.target.value = null;
      return;
    }

    setImageSelected(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (result?.startsWith("data:image")) {
        const base64 = result.split(",")[1];
        setFormData((prev) => ({
          ...prev,
          image: base64,
        }));
      }
    };
    reader.onerror = () => {
      toast.error("Error al procesar la imagen");
    };
    reader.readAsDataURL(file);
  };

  const validateForm = () => {
      if (!formData.event_type) return "Seleccione un tipo de evento.";
      if (!formData.route_id) return "Seleccione una ruta.";
      if (!formData.event_level) return "Seleccione la dificultad.";
      if (!formData.event_mode) return "Seleccione la modalidad.";
      if (!formData.meeting_point.trim()) return "Ingrese un punto de encuentro.";
      if (!formData.creation_date) return "Seleccione fecha y hora.";
      return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    // 1. Validaciones de Campos Vacíos
    const error = validateForm();
    if (error) {
        toast.error(error);
        return;
    }

    // 2. Validación de Fecha
    const selectedDate = new Date(formData.creation_date);
    const now = new Date();
  
    if (selectedDate < now) {
      toast.error("La fecha del evento no puede ser anterior a la actual");
      return;
    }
  
    setIsSubmitting(true);
    try {
      await createEvent(formData);
      toast.success("Evento creado correctamente");
      navigate("/admin/lista-eventos");
    } catch (error) {
      console.error("Error al crear el evento:", error);
      toast.error("Error al crear el evento");
    } finally {
        setIsSubmitting(false);
    }
  };
  
  return (
    <div className="crear-evento-container">
      <h2>Crear Evento</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div>
            <label>Tipo de evento:</label>
            <select name="event_type" value={formData.event_type} onChange={handleChange} required>
              <option value="" disabled>-- Seleccionar --</option>
              <option value="Entrenamiento">Entrenamiento</option>
              <option value="Rodada">Rodada</option>
            </select>
          </div>

          <div>
            <label>Fecha y hora del evento:</label>
            <input
              type="datetime-local"
              name="creation_date"
              value={formData.creation_date}
              onChange={handleChange}
              required
              min={new Date().toISOString().slice(0, 16)} // Restricción HTML básica
            />
          </div>

          <div>
            <label>Ruta del evento:</label>
            <select name="route_id" value={formData.route_id} onChange={handleChange} required>
              <option value="" disabled>-- Seleccionar Ruta --</option>
              {routes.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Imagen del evento:</label>
            <div className={`custom-file-input ${imageSelected ? "file-selected" : ""}`}>
              <span className="file-text">
                {imageSelected ? "Imagen cargada" : "Subir imagen (Max 2MB)"}
              </span>

              {imageSelected && (
                <button
                  type="button"
                  className="remove-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setImageSelected(false);
                    setFileName("");
                    setFormData((prev) => ({ ...prev, image: null }));
                    // Limpiar el input file visualmente si es posible (necesitaría ref)
                  }}
                  title="Eliminar imagen"
                >
                  <i className="fa-solid fa-xmark"></i>
                </button>
              )}

              <i className="fa-solid fa-upload upload-icon"></i>
              <input type="file" accept="image/png, image/jpeg, image/jpg" onChange={handleImageChange} />
            </div>
          </div>

          <div>
            <label>Dificultad del evento:</label>
            <select name="event_level" value={formData.event_level} onChange={handleChange} required>
              <option value="" disabled>-- Seleccionar --</option>
              <option value="Básico">Básico</option>
              <option value="Intermedio">Intermedio</option>
              <option value="Avanzado">Avanzado</option>
            </select>
          </div>

          <div>
            <label>Modalidad del evento:</label>
            <select name="event_mode" value={formData.event_mode} onChange={handleChange} required>
              <option value="" disabled>-- Seleccionar --</option>
              <option value="Montaña">Montaña</option>
              <option value="Carretera">Carretera</option>
            </select>
          </div>

          <div className="grid-full">
            <label>Punto de encuentro:</label>
            {isLoaded && (
              <>
                <Autocomplete
                  onLoad={(ref) => (autocompleteRef.current = ref)}
                  onPlaceChanged={handlePlaceChanged}
                >
                  <input
                    type="text"
                    name="meeting_point"
                    placeholder="Buscar punto de encuentro"
                    value={formData.meeting_point}
                    onChange={handleMapInputChange}
                    required
                    style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
                  />
                </Autocomplete>

                <GoogleMap
                  mapContainerStyle={mapContainerStyle}
                  center={marker || centerDefault}
                  zoom={15}
                  onLoad={handleMapLoad}
                >
                  {marker && <Marker position={marker} />}
                </GoogleMap>
              </>
            )}
          </div>
        </div>

        <div className="form-buttons-inline">
          <button type="submit" className="btn-send" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar"}
          </button>
          <button type="button" className="btn-cancel" onClick={() => navigate("/admin")}>Cancelar</button>
        </div>
      </form>
    </div>
  );
};

export default CrearEvento;