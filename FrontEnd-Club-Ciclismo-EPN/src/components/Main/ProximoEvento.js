import React, { useEffect, useState } from "react";
import { fetchNextEvent, fetchPublicUpcomingEvents } from "../../services/eventService";
import { useNavigate } from "react-router-dom";
import "../../assets/Styles/Main/ProximoEvento.css";
import eventoDefault from "../../assets/Images/Eventos/ciclista.jpg";
import MapaRutaEvento from "../../components/Main/MapaRutaEvento";
import { useLoadScript } from "@react-google-maps/api";

const ProximoEvento = () => {
  const [evento, setEvento] = useState(null);
  const [otrosEventos, setOtrosEventos] = useState([]);
  const [cantidadVisible, setCantidadVisible] = useState(3);
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [endPoint, setEndPoint] = useState(null);
  const navigate = useNavigate();
  const [mostrarTodos, setMostrarTodos] = useState(false);


  // Solo carga si no está ya cargado para evitar el error
  const { isLoaded } = useLoadScript({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
    preventGoogleFontsLoading: true,
  });

  // Usa la API de JS solo si ya está cargada
  const geocodeDireccion = (direccion) => {
    return new Promise((resolve, reject) => {
      if (!window.google || !window.google.maps) {
        console.warn("⚠️ Google Maps API no está cargada.");
        reject("API no cargada");
        return;
      }

      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ address: direccion }, (results, status) => {
        if (status === "OK" && results[0]) {
          const { lat, lng } = results[0].geometry.location;
          resolve({ lat: lat(), lng: lng() });
        } else {
          console.error(`❌ Error en geocodificación (${direccion}):`, status);
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
          .filter(ev => ev.id !== next.id && new Date(ev.creation_date) >= ahora)
          .sort((a, b) => new Date(a.creation_date) - new Date(b.creation_date));

        setOtrosEventos(filtrados);
      } catch (err) {
        console.error("❌ Error al cargar eventos:", err);
      }
    };

    loadEventos();
  }, []);

  const formatFecha = (fecha) => {
    const raw = new Date(fecha).toLocaleDateString("es-EC", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    return raw.charAt(0).toUpperCase() + raw.slice(1);
  };


  const getImagen = (img) => {
    return img && img.startsWith("data:image/") ? img : eventoDefault;
  };

  if (!evento) return <p>Cargando evento más próximo...</p>;

  const visibles = mostrarTodos ? otrosEventos : otrosEventos.slice(0, 3);

  return (
    <>
      <div className="eventos-cards">

        <div className="eventos-list">
          {visibles.map((ev) => (
            <div key={ev.id} className="evento-card-public">
              <img
                src={getImagen(ev.image)}
                alt={ev.route?.name || "Evento"}
                className="evento-card-public-img"
              />
              <h3>
                {ev.event_type} - {ev.route_name || "Ruta no definida"}
              </h3>
              <p>{formatFecha(ev.creation_date)}</p>
            </div>
          ))}
        </div>
        {cantidadVisible < otrosEventos.length && (
          <div className="ver-mas-container">
            {!mostrarTodos && cantidadVisible < otrosEventos.length && (
              <button className="btn-ver-mas" onClick={() => setMostrarTodos(true)}>
                Ver más eventos
              </button>
            )}
            {mostrarTodos && (
              <button className="btn-ver-mas" onClick={() => setMostrarTodos(false)}>
                Ver menos 
              </button>
            )}
          </div>

        )}
      </div>

      <div className="proximo-evento-wrapper">
        <div className="evento-destacado">
          <div className="evento-info">
            <p className="proximo-label">EVENTO DESTACADO</p>
            <h2 className="evento-nombre">
              {evento.event_type} - {evento.route?.name}
            </h2>
            <p className="evento-fecha">{formatFecha(evento.creation_date)}</p>
            <p className="evento-descripcion">
              Inscríbete en nuestro próximo evento  {evento.event_type.toLowerCase()} y disfruta de una gran experiencia.
            </p>
            <div className="evento-buttons">
              <button className="btn-inscribirse" onClick={() => navigate("/login")}>
                Inscribirse
              </button>
              <button
                className="btn-ver-ruta"
                onClick={async () => {
                  if (!isLoaded) {
                    console.warn("⚠️ Google Maps aún no está listo.");
                    return;
                  }

                  if (!evento.route?.start_point || !evento.route?.end_point) {
                    console.warn("⚠️ La ruta no tiene puntos definidos.");
                    return;
                  }

                  try {
                    const start = await geocodeDireccion(evento.route.start_point);
                    const end = await geocodeDireccion(evento.route.end_point);
                    setStartPoint(start);
                    setEndPoint(end);
                    setMostrarMapa(true);
                  } catch (error) {
                    console.warn("⚠️ No se pudieron geocodificar las direcciones.");
                  }
                }}
              >
                Ver ruta
              </button>
            </div>
          </div>
          <div className="evento-imagen-container">
            <img
              src={getImagen(evento.image)}
              alt="Evento principal"
              className="evento-imagen"
            />
          </div>
        </div>
      </div>

      {mostrarMapa && startPoint && endPoint && (
        <MapaRutaEvento
          visible={true}
          startPoint={startPoint}
          endPoint={endPoint}
          onClose={() => setMostrarMapa(false)}
        />
      )}
    </>
  );
};

export default ProximoEvento;
