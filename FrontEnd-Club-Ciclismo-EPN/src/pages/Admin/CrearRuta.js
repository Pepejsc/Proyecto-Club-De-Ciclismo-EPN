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

  const startAutocompleteRef = useRef(null);
  const endAutocompleteRef = useRef(null);

  const navigate = useNavigate();
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries,
  });

  const handlePlaceSelect = (ref, setCoord, field) => {
    const place = ref.current.getPlace();
    if (!place?.geometry) return;

    const location = place.geometry.location;
    setCoord({ lat: location.lat(), lng: location.lng() });
    setFormData((prev) => ({
      ...prev,
      [field]: place.formatted_address,
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.start_point || !formData.end_point || !formData.name.trim() || !formData.duration) {
      toast.error("Todos los campos son obligatorios.");
      return;
    }

    try {
      await createRoute(formData);
      toast.success("Ruta creada con éxito.");
      setTimeout(() => navigate("/admin/lista-rutas"), 1500);
    } catch (error) {
      console.error("Error al crear la ruta:", error);
      toast.error("Error al crear la ruta. Inténtalo nuevamente.");
    }
  };

  const handleClear = () => {
    setFormData({ name: "", start_point: "", end_point: "", duration: "" });
    setStartCoords(null);
    setEndCoords(null);
    setDirections(null);
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
            toast.error("No se pudo trazar la ruta entre los puntos.");
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
            />
          </div>

          <div className="grid-full">
            <label>Duración [min]:</label>
            <input
              type="number"
              name="duration"
              placeholder="Ingrese la duración de la ruta"

              value={formData.duration}
              onChange={handleChange}
              required
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
                value={formData.start_point}
                placeholder="Buscar punto de inicio"

                onChange={(e) =>
                  setFormData((p) => ({ ...p, start_point: e.target.value }))
                }
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
                value={formData.end_point}
                placeholder="Buscar punto de fin"

                onChange={(e) =>
                  setFormData((p) => ({ ...p, end_point: e.target.value }))
                }
                required
              />
            </Autocomplete>
          </div>

        </div>

        <div className="form-buttons-inline">
          <button className="btn-send" type="submit">
            Guardar
          </button>
          <button className="btn-cancel" type="button" onClick={() => navigate("/admin")}>
            Cancelar
          </button>
        </div>

        {startCoords && endCoords && (
          <div className="form-buttons-clear">
            <button className="btn-clear" type="button" onClick={handleClear}>
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
