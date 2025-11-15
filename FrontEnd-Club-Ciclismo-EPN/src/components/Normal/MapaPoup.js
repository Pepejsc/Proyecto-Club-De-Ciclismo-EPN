import React from "react";
import "../../assets/Styles/Normal/MapaPopup.css";
import { FaTimes } from "react-icons/fa";

const MapaPopup = ({ marker, onClose }) => {
  if (!marker?.lat || !marker?.lng) return null;

  const { lat, lng } = marker;

  const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

  const mapsUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}&zoom=18`;

  return (
    <div className="mapa-popup-overlay" onClick={onClose}>
      <div className="mapa-popup-content" onClick={(e) => e.stopPropagation()}>
        <button className="mapa-popup-close" onClick={onClose}>
          <FaTimes />
        </button>
        <h3 className="mapa-popup-title">Punto de Encuentro</h3>
        <div className="mapa-popup-container">
          <iframe
            title="Mapa de Punto de Encuentro"
            width="100%"
            height="400"
            style={{ border: 0, borderRadius: "10px" }}
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            src={mapsUrl}
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default MapaPopup;
