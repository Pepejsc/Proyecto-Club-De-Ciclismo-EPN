import React, { useState, useRef, useEffect } from "react";
import {
  GoogleMap,
  Marker,
  Autocomplete,
  useLoadScript,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { useNavigate } from "react-router-dom";
import { createRoute } from "../../services/routeService";
import "../../assets/Styles/Admin/CrearRuta.css";
import { toast } from "react-toastify";

const libraries = ["places"];
const mapContainerStyle = {
  height: "400px",
  width: "100%",
  borderRadius: "8px",
};
const centerDefault = { lat: -0.22985, lng: -78.52495 };

const CrearRuta = () => {
  const [formData, setFormData] = useState({
    name: "",
    start_point: "",
    end_point: "",
    duration: "",
  });

  const [startCoords, setStartCoords] = useState(null);
  const [endCoords, setEndCoords] = useState(null);
  const [directions, setDirections] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // Estado de carga

  const startAutocompleteRef = useRef(null);
  const endAutocompleteRef = useRef(null);

  const navigate = useNavigate();
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  // --- 🛡️ 1. LÓGICA DE SEGURIDAD (SANITIZACIÓN) ---
  const sanitizeInput = (input) => {
    // Elimina caracteres peligrosos: < > " ' ` /
    return input ? input.replace(/[<>&"'/`]/g, "") : "";
  };

  const handlePlaceSelect = (ref, setCoord, field) => {
    const place = ref.current.getPlace();
    if (!place?.geometry) {
        toast.error("Por favor selecciona una ubicación válida de la lista desplegable.");
        return;
    }

    const location = place.geometry.location;
    setCoord({ lat: location.lat(), lng: location.lng() });
    
    // Sanitizamos también lo que viene de Google por si acaso
    const safeAddress = sanitizeInput(place.formatted_address);
    
    setFormData((prev) => ({
      ...prev,
      [field]: safeAddress,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    let safeValue = value;

    if (name === "duration") {
        // Solo números positivos
        safeValue = value.replace(/[^0-9]/g, "");
    } else {
        // Texto normal (Nombre): Sin etiquetas HTML
        safeValue = sanitizeInput(value);
    }

    setFormData((prev) => ({ ...prev, [name]: safeValue }));
  };

  // Validación manual para los inputs de Google Maps (Inicio y Fin)
  const handleMapInputChange = (e, field) => {
      const cleanValue = sanitizeInput(e.target.value);
      setFormData((prev) => ({ ...prev, [field]: cleanValue }));
  };

  // Bloquear caracteres inválidos en campos numéricos (e, -, +)
  const handleKeyDownNumber = (e) => {
    if (["e", "E", "+", "-", "."].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones estrictas
    if (!formData.name.trim()) {
      toast.error("El nombre de la ruta es obligatorio.");
      return;
    }
    if (formData.name.length < 5) {
        toast.error("El nombre es muy corto (mínimo 5 letras).");
        return;
    }

    if (!formData.duration || parseInt(formData.duration) <= 0) {
      toast.error("La duración debe ser un número válido mayor a 0.");
      return;
    }

    if (!startCoords || !formData.start_point.trim()) {
        toast.error("Debes seleccionar un punto de inicio válido.");
        return;
    }
    if (!endCoords || !formData.end_point.trim()) {
        toast.error("Debes seleccionar un punto de fin válido.");
        return;
    }

    setIsSubmitting(true);

    try {
      // Aseguramos enviar enteros
      const payload = {
          ...formData,
          duration: parseInt(formData.duration)
      };

      await createRoute(payload);
      toast.success("Ruta creada con éxito.");
      setTimeout(() => navigate("/admin/lista-rutas"), 1500);
    } catch (error) {
      console.error("Error al crear la ruta:", error);
      toast.error("Error al crear la ruta. Inténtalo nuevamente.");
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    setFormData({ name: "", start_point: "", end_point: "", duration: "" });
    setStartCoords(null);
    setEndCoords(null);
    setDirections(null);
    
    // Limpiar visualmente los inputs de Google si quedan sucios
    const inputStart = document.querySelector('input[placeholder="Buscar punto de inicio"]');
    const inputEnd = document.querySelector('input[placeholder="Buscar punto de fin"]');
    if(inputStart) inputStart.value = "";
    if(inputEnd) inputEnd.value = "";
  };

  useEffect(() => {
    if (startCoords && endCoords) {
      const directionsService = new window.google.maps.DirectionsService();

      directionsService.route(
        {
          origin: startCoords,
          destination: endCoords,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === "OK") {
            setDirections(result);
          } else {
            console.error("Error al calcular la ruta:", status);
            toast.error("No se pudo trazar la ruta. Intenta con puntos más cercanos a una vía.");
          }
        }
      );
    }
  }, [startCoords, endCoords]);

  if (!isLoaded) return <p>Cargando mapa...</p>;

  return (
    <div className="crear-ruta-container">
      <h2>Crear Ruta</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="grid-full">
            <label>Nombre de la ruta:</label>
            <input
              type="text"
              name="name"
              placeholder="Ingrese el nombre de la ruta"
              value={formData.name}
              onChange={handleChange}
              required
              maxLength={100} // Límite de seguridad
            />
          </div>

          <div className="grid-full">
            <label>Duración [min]:</label>
            <input
              type="number"
              name="duration"
              placeholder="Ingrese la duración (ej: 60)"
              value={formData.duration}
              onChange={handleChange}
              onKeyDown={handleKeyDownNumber} // Bloquea 'e', '-', '+'
              required
              min="1"
            />
          </div>

          <div>
            <label>Punto de inicio:</label>
            <Autocomplete
              onLoad={(ref) => (startAutocompleteRef.current = ref)}
              onPlaceChanged={() =>
                handlePlaceSelect(startAutocompleteRef, setStartCoords, "start_point")
              }
            >
              <input
                type="text"
                placeholder="Buscar punto de inicio"
                value={formData.start_point}
                // ⚠️ Aquí aplicamos la seguridad al escribir
                onChange={(e) => handleMapInputChange(e, "start_point")}
                required
              />
            </Autocomplete>
          </div>

          <div>
            <label>Punto de fin:</label>
            <Autocomplete
              onLoad={(ref) => (endAutocompleteRef.current = ref)}
              onPlaceChanged={() =>
                handlePlaceSelect(endAutocompleteRef, setEndCoords, "end_point")
              }
            >
              <input
                type="text"
                placeholder="Buscar punto de fin"
                value={formData.end_point}
                // ⚠️ Aquí aplicamos la seguridad al escribir
                onChange={(e) => handleMapInputChange(e, "end_point")}
                required
              />
            </Autocomplete>
          </div>
        </div>

        <div className="form-buttons-inline">
          <button className="btn-send" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Guardando..." : "Guardar"}
          </button>
          <button className="btn-cancel" type="button" onClick={() => navigate("/admin/lista-rutas")}>
            Cancelar
          </button>
        </div>

        {startCoords && endCoords && (
          <div className="form-buttons-clear" style={{display: 'flex', justifyContent: 'center', marginTop: '15px'}}>
            <button 
                type="button" 
                onClick={handleClear}
                style={{
                    background: '#f8f9fa', 
                    border: '1px solid #ccc', 
                    padding: '8px 16px', 
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
              Limpiar puntos
            </button>
          </div>
        )}
      </form>

      <div className="mapa">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={startCoords || centerDefault}
          zoom={14}
        >
          {startCoords && <Marker position={startCoords} />}
          {endCoords && <Marker position={endCoords} />}
          {startCoords && endCoords && directions && (
            <DirectionsRenderer
              options={{
                directions: directions,
                suppressMarkers: true,
              }}
            />
          )}
        </GoogleMap>
      </div>
    </div>
  );
};

export default CrearRuta;