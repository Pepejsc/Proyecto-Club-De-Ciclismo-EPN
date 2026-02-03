import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLoadScript } from "@react-google-maps/api";
import { fetchNextEvent, fetchPublicUpcomingEvents } from "../../services/eventService";
import MapaRutaEvento from "../../components/Main/MapaRutaEvento";
import eventoDefault from "../../assets/Images/Eventos/ciclista.jpg";
import "../../assets/Styles/Main/ProximoEvento.css";

const ProximoEvento = () => {
  const [evento, setEvento] = useState(null);
  const [otrosEventos, setOtrosEventos] = useState([]);
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const [mostrarTodos, setMostrarTodos] = useState(false);
  const navigate = useNavigate();

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
    preventGoogleFontsLoading: true,
  });

  const geocodeDireccion = (direccion) => {
    return new Promise((resolve, reject) => {
      if (!window.google || !window.google.maps) {
        reject("API no cargada");
        return;
      }
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: direccion }, (results, status) => {
        if (status === "OK" && results[0]) {
          const { lat, lng } = results[0].geometry.location;
          resolve({ lat: lat(), lng: lng() });
        } else {
          reject(status);
        }
      });
    });
  };

  useEffect(() => {
    const loadEventos = async () => {
      try {
        const next = await fetchNextEvent(true);
        setEvento(next);

        const all = await fetchPublicUpcomingEvents();
        const ahora = new Date();
        const filtrados = all
          .filter(ev => ev.id !== (next?.id) && new Date(ev.creation_date) >= ahora)
          .sort((a, b) => new Date(a.creation_date) - new Date(b.creation_date));

        setOtrosEventos(filtrados);
      } catch (err) {
        console.error("Error al cargar eventos:", err);
      }
    };
    loadEventos();
  }, []);

  const formatFecha = (fecha) => {
    const raw = new Date(fecha).toLocaleDateString("es-EC", {
      weekday: "long", day: "2-digit", month: "long", year: "numeric",
    });
    return raw.charAt(0).toUpperCase() + raw.slice(1);
  };

  const getImagen = (img) => {
    return img && img.startsWith("data:image/") ? img : eventoDefault;
  };

  if (!evento) {
    return (
      <div className="pe-loading-container">
        <div className="pe-spinner"></div>
        <p>Buscando próximos eventos...</p>
      </div>
    );
  }

  const visibles = mostrarTodos ? otrosEventos : otrosEventos.slice(0, 3);

  return (
    <section className="pe-section">
      
      {/* --- LISTA SECUNDARIA (GRID) --- */}
      <div className="pe-list-container">
        <div className="pe-grid">
          {visibles.map((ev) => (
            <div key={ev.id} className="pe-card-small">
              <img
                src={getImagen(ev.image)}
                alt={ev.route?.name}
                className="pe-card-small-img"
                loading="lazy"
              />
              <div className="pe-card-small-body">
                <h3>{ev.event_type} - {ev.route_name || "Ruta"}</h3>
                <p>{formatFecha(ev.creation_date)}</p>
              </div>
            </div>
          ))}
        </div>

        {otrosEventos.length > 3 && (
          <div className="pe-actions-center">
            <button 
              className="pe-btn-secondary" 
              onClick={() => setMostrarTodos(!mostrarTodos)}
            >
              {mostrarTodos ? "Ver menos" : "Ver más eventos"}
            </button>
          </div>
        )}
      </div>

      {/* --- EVENTO DESTACADO (HERO) --- */}
      <div className="pe-featured-container">
        <div className="pe-featured-card">
          
          <div className="pe-featured-content">
            <span className="pe-badge">EVENTO DESTACADO</span>
            <h2 className="pe-featured-title">
              {evento.event_type} - {evento.route?.name}
            </h2>
            <p className="pe-featured-date">{formatFecha(evento.creation_date)}</p>
            <p className="pe-featured-desc">
              Inscríbete en nuestro próximo evento y vive la experiencia completa.
            </p>
            
            <div className="pe-featured-buttons">
              <button className="pe-btn-primary" onClick={() => navigate("/login")}>
                Inscribirse
              </button>
              
              <button
                className="pe-btn-outline"
                onClick={async () => {
                  if (!isLoaded || !evento.route?.start_point || !evento.route?.end_point) return;
                  try {
                    const start = await geocodeDireccion(evento.route.start_point);
                    const end = await geocodeDireccion(evento.route.end_point);
                    setStartPoint(start);
                    setEndPoint(end);
                    setMostrarMapa(true);
                  } catch (error) {
                    console.warn("Error ruta");
                  }
                }}
              >
                Ver ruta
              </button>
            </div>
          </div>
          
          <div className="pe-featured-visual">
            <img
              src={getImagen(evento.image)}
              alt="Destacado"
              className="pe-featured-img"
            />
          </div>

        </div>
      </div>

      {/* --- MODAL --- */}
      {mostrarMapa && startPoint && endPoint && (
        <MapaRutaEvento
          visible={true}
          startPoint={startPoint}
          endPoint={endPoint}
          onClose={() => setMostrarMapa(false)}
        />
      )}
    </section>
  );
};

export default ProximoEvento;