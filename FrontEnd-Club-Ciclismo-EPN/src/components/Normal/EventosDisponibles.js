import React, { useEffect, useState } from "react";
import EventoCard from "../../pages/Normal/EventoCard";
import ChecklistModal from "../../pages/Normal/ChecklistModal";
import "../../assets/Styles/Normal/EventosDisponibles.css";
import {
  fetchEvents,
  fetchMyEvents,
  registerToEvent,
  unregisterFromEvent,
} from "../../services/eventService";
import MapaPoup from "./MapaPoup";
import { toast } from "react-toastify"; // <--- IMPORTANTE: Importar toast

const EventosDisponibles = () => {
  const [eventos, setEventos] = useState([]);
  const [inscritos, setInscritos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarChecklist, setMostrarChecklist] = useState(false);
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [mostrarMapa, setMostrarMapa] = useState(false);
  const [marcadorMapa, setMarcadorMapa] = useState(null);

  useEffect(() => {
    const cargarEventos = async () => {
      try {
        const data = await fetchEvents();
        const ahora = new Date();
        const eventosFuturos = data.filter(
          (e) => new Date(e.creation_date) > ahora
        );
        const eventosOrdenados = eventosFuturos.sort(
          (a, b) => new Date(a.creation_date) - new Date(b.creation_date)
        );

        setEventos(eventosOrdenados);

        try {
          const inscritosIds = await fetchMyEvents();
          setInscritos(inscritosIds);
        } catch (err) {
          console.warn("No se pudieron cargar inscripciones:", err.message);
          setInscritos([]);
        }
      } catch (error) {
        console.error("Error al cargar eventos:", error);
      } finally {
        setLoading(false);
      }
    };

    cargarEventos();
  }, []);

  // --- FUNCIÓN MEJORADA PARA MANEJAR ERRORES ---
  const manejarInscripcion = async (eventoId, yaInscrito) => {
    try {
      if (yaInscrito) {
        // Cancelar inscripción
        await unregisterFromEvent(eventoId);
        setInscritos(inscritos.filter((id) => id !== eventoId));
        toast.info("Inscripción cancelada correctamente.");
      } else {
        // Inscribirse (Aquí es donde el backend puede rechazar por falta de membresía)
        await registerToEvent(eventoId);
        setInscritos([...inscritos, eventoId]);
        toast.success("¡Te has inscrito al evento exitosamente!");
      }
    } catch (error) {
      console.error("Error al inscribirse/cancelar:", error);

      // Detectamos si el error viene del backend (axios/fetch response)
      const errorMsg = error.response?.data?.detail || error.message;

      // Si es un error de permisos (403), mostramos mensaje claro de membresía
      if (errorMsg.includes("membresía") || errorMsg.includes("activa") || error.response?.status === 403) {
          toast.error("⚠️ Acceso denegado: Necesitas una MEMBRESÍA ACTIVA para inscribirte a eventos.", {
              autoClose: 5000,
              position: "top-center",
              style: { fontSize: '1rem', textAlign: 'center' }
          });
      } else {
          toast.error(`Error: ${errorMsg}`);
      }
    }
  };

  const abrirChecklist = (evento) => {
    setEventoSeleccionado(evento);
    setMostrarChecklist(true);
  };

  const confirmarChecklist = async () => {
    setMostrarChecklist(false);
    if (eventoSeleccionado) {
      // Llamamos a la función mejorada
      await manejarInscripcion(eventoSeleccionado.id, false);
      setEventoSeleccionado(null);
    }
  };

  const abrirMapa = (direccion) => {
    console.log("📍 Dirección recibida:", direccion);

    if (!window.google || !window.google.maps) {
      console.error("❌ Google Maps no está disponible");
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: direccion }, (results, status) => {
      if (status === "OK" && results[0]) {
        const location = results[0].geometry.location;
        setMarcadorMapa({ lat: location.lat(), lng: location.lng() });
        setMostrarMapa(true);
      } else {
        console.error("❌ Geocodificación fallida:", status);
        toast.error("No se pudo ubicar la dirección en el mapa.");
      }
    });
  };

  if (loading) return <p style={{ padding: "30px" }}>Cargando eventos...</p>;

  if (!loading && eventos.length === 0) {
    return (
      <div className="sin-eventos">
        <h3>📭 No hay eventos próximos disponibles</h3>
        <p>Pronto se publicarán nuevas rutas y rodadas. ¡Mantente atento!</p>
      </div>
    );
  }

  return (
    <div className="eventos-wrapper">
      <div className="eventos-header">
        <h2 className="eventos-titulo">🚴 Eventos Disponibles</h2>
        <p className="eventos-subtitulo">Aplica a estas rutas y rodadas planificadas</p>
      </div>

      <div className="eventos-grid">
        {eventos.map((evento) => {
          const yaInscrito = inscritos.includes(evento.id);
          const fechaObj = new Date(evento.creation_date);

          const diaSemana = fechaObj.toLocaleDateString("es-ES", { weekday: "long" });
          const dia = fechaObj.getDate().toString().padStart(2, "0");
          const mes = fechaObj.toLocaleDateString("es-ES", { month: "long" });
          const anio = fechaObj.getFullYear();
          const fechaFormateada = `${diaSemana.charAt(0).toUpperCase()}${diaSemana.slice(1)}, ${dia} de ${mes} del ${anio}`;

          const horas = fechaObj.getHours().toString().padStart(2, "0");
          const minutos = fechaObj.getMinutes().toString().padStart(2, "0");
          const sufijo = fechaObj.getHours() >= 12 ? "PM" : "AM";
          const horaFormateada = `${horas}:${minutos} ${sufijo}`;

          return (
            <EventoCard
              key={evento.id}
              evento={{
                id: evento.id,
                titulo: evento.event_type,
                nombreRuta: evento.route_name || "Ruta sin nombre",
                fecha: fechaFormateada,
                hora: horaFormateada,
                dificultad: evento.event_level,
                modalidad: evento.event_mode,
                image: evento.image,
                meeting_point: evento.meeting_point,
                rawFecha: new Date(evento.creation_date),
              }}
              inscrito={yaInscrito}
              // Ahora pasamos la función que tiene los Toast
              onToggleInscripcion={() => manejarInscripcion(evento.id, yaInscrito)}
              onAbrirChecklist={() => abrirChecklist(evento)}
              onAbrirMapa={() => abrirMapa(evento.meeting_point)}
            />
          );
        })}
      </div>

      {mostrarMapa && marcadorMapa && (
        <MapaPoup marker={marcadorMapa} onClose={() => setMostrarMapa(false)} />
      )}

      {mostrarChecklist && (
        <ChecklistModal onConfirm={confirmarChecklist} />
      )}
    </div>
  );
};

export default EventosDisponibles;