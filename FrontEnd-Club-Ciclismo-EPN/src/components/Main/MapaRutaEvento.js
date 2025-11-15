import React, { useEffect, useState, useRef } from "react";
import {
  GoogleMap,
  Marker,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { FaTimes } from "react-icons/fa";
import "../../assets/Styles/Main/MapaRutaEvento.css";

const containerStyle = {
  width: "100%",
  height: "280px",
};

const centerDefault = { lat: -0.22985, lng: -78.52495 };

const MapaRutaEvento = ({ startPoint, endPoint, visible, onClose }) => {
  const mapRef = useRef(null);
  const [directions, setDirections] = useState(null);

  useEffect(() => {
    if (!startPoint || !endPoint) return;

    const directionsService = new window.google.maps.DirectionsService();

    directionsService.route(
      {
        origin: startPoint,
        destination: endPoint,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK") {
          setDirections(result);
        } else {
          console.error("❌ Error al trazar ruta:", status);
        }
      }
    );
  }, [startPoint, endPoint]);

  useEffect(() => {
    if (mapRef.current && directions) {
      const bounds = new window.google.maps.LatLngBounds();
      directions.routes[0].overview_path.forEach((coord) =>
        bounds.extend(coord)
      );
      mapRef.current.fitBounds(bounds);
    }
  }, [directions]);

  if (!visible || !startPoint || !endPoint) return null;

  return (
    <div className="modal-mapa-overlay" onClick={onClose}>
      <div className="modal-mapa-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-mapa-close" onClick={onClose}>
          <FaTimes />
        </button>
        <h3 className="modal-mapa-title">Ruta del Evento</h3>
        <div className="modal-mapa-container">
          <GoogleMap
            mapContainerStyle={containerStyle}
            onLoad={(map) => (mapRef.current = map)}
            center={centerDefault}
            zoom={13}
          >
            {directions && (
              <>
                <DirectionsRenderer
                  directions={directions}
                  options={{ suppressMarkers: true }}
                />
                <Marker position={startPoint} title="Inicio" />
                <Marker position={endPoint} title="Destino" />
              </>
            )}
          </GoogleMap>
        </div>
      </div>
    </div>
  );
};

export default MapaRutaEvento;
