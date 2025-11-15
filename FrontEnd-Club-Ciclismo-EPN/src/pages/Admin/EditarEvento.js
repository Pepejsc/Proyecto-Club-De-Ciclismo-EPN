import React, { useEffect, useRef, useState } from "react";
import { updateEvent } from "../../services/eventService";
import { toast } from "react-toastify";
import { GoogleMap, Marker, useLoadScript, Autocomplete } from "@react-google-maps/api";
import "../../assets/Styles/Admin/EditarEvento.css";

const LIBRARIES = ["places"];

const EditarEvento = ({ isOpen, onClose, eventData, onEventUpdated, routes }) => {
  const [formData, setFormData] = useState({ ...eventData });
  const [newImage, setNewImage] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const mapRef = useRef(null);
  const autocompleteRef = useRef(null);
  const [marker, setMarker] = useState(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: LIBRARIES,
  });

  useEffect(() => {
    if (isLoaded && eventData?.meeting_point) {
      geocodeAddress(eventData.meeting_point)
        .then((location) => {
          setMarker({ lat: location.lat(), lng: location.lng() });
          if (mapRef.current) mapRef.current.panTo({ lat: location.lat(), lng: location.lng() });
        })
        .catch(() => {
          const defaultLocation = { lat: -0.1807, lng: -78.4678 };
          setMarker(defaultLocation);
          if (mapRef.current) mapRef.current.panTo(defaultLocation);
        });
    }
  }, [isLoaded, eventData]);

  const geocodeAddress = (address) => {
    const geocoder = new window.google.maps.Geocoder();
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === "OK" && results[0]) resolve(results[0].geometry.location);
        else reject();
      });
    });
  };

  const handlePlaceChanged = () => {
    const place = autocompleteRef.current?.getPlace();
    if (!place || !place.geometry) return;
    const location = place.geometry.location;
    const latLng = { lat: location.lat(), lng: location.lng() };
    setMarker(latLng);
    setFormData((prev) => ({ ...prev, meeting_point: place.formatted_address }));
    if (mapRef.current) mapRef.current.panTo(latLng);
  };

  const handleMapLoad = (map) => {
    mapRef.current = map;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("La imagen no debe superar los 2MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result;
      if (result?.startsWith("data:image")) {
        setNewImage(result.split(",")[1]);
        setRemoveImage(false);
      }
    };
    reader.readAsDataURL(file);
  };


  const handleRemoveImage = () => {
    setNewImage(null);
    setRemoveImage(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const selectedDate = new Date(formData.creation_date);
    const now = new Date();

    if (selectedDate < now) {
      toast.error("La fecha del evento no puede ser anterior a la actual");
      return;
    }

    try {
      const payload = { ...formData };
      if (removeImage) payload.image = null;
      else if (newImage) payload.image = newImage;
      else delete payload.image;

      await updateEvent(eventData.id, payload);
      toast.success("Evento actualizado correctamente");
      onEventUpdated();
      onClose();
    } catch (error) {
      toast.error("Error al actualizar el evento");
    }
  };


  const mostrarBotonEliminar = newImage || (eventData.image && !removeImage);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content crear-evento-container">
        <h2>Editar Evento</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid-editar">
            <div>
              <label>Tipo de evento:</label>
              <select name="event_type" value={formData.event_type} onChange={handleChange} required>
                <option value="">Seleccionar</option>
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
              />
            </div>

            <div>
              <label>Ruta del evento:</label>
              <select name="route_id" value={formData.route_id} onChange={handleChange} required>
                <option value="">Seleccionar</option>
                {routes.map((r) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Imagen del evento:</label>
              <div className={`custom-file-input ${newImage || (eventData.image && !removeImage) ? "file-selected" : ""}`}>
                <span className="file-text">
                  {newImage
                    ? "Imagen cargada"
                    : eventData.image && !removeImage
                      ? "Imagen cargada"
                      : "Subir imagen"}
                </span>

                {(newImage || (eventData.image && !removeImage)) && (
                  <button
                    type="button"
                    className="remove-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemoveImage();
                    }}
                    title="Eliminar imagen"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                )}

                <i className="fa-solid fa-upload upload-icon"></i>
                <input type="file" accept="image/*" onChange={handleImageChange} />
              </div>
            </div>

            <div>
              <label>Dificultad del evento:</label>
              <select name="event_level" value={formData.event_level} onChange={handleChange} required>
                <option value="">Seleccionar</option>
                <option value="Básico">Básico</option>
                <option value="Intermedio">Intermedio</option>
                <option value="Avanzado">Avanzado</option>
              </select>
            </div>

            <div>
              <label>Modalidad del evento:</label>
              <select name="event_mode" value={formData.event_mode} onChange={handleChange} required>
                <option value="">Seleccionar</option>
                <option value="Montaña">Montaña</option>
                <option value="Carretera">Carretera</option>
              </select>
            </div>

            <div className="grid-full">
              <label>Punto de encuentro:</label>
              {isLoaded && (
                <>
                  <Autocomplete onLoad={(ref) => (autocompleteRef.current = ref)} onPlaceChanged={handlePlaceChanged}>
                    <input
                      type="text"
                      name="meeting_point"
                      placeholder="Buscar punto de encuentro"
                      value={formData.meeting_point}
                      onChange={(e) => setFormData((prev) => ({ ...prev, meeting_point: e.target.value }))}
                      required
                      style={{ width: "100%", padding: "10px", marginBottom: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
                    />
                  </Autocomplete>

                  <GoogleMap
                    mapContainerStyle={{ width: "100%", height: "300px" }}
                    center={marker || { lat: -0.1807, lng: -78.4678 }}
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
            <button type="submit" className="btn-send">Guardar</button>
            <button type="button" className="btn-cancel" onClick={onClose}>Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditarEvento;