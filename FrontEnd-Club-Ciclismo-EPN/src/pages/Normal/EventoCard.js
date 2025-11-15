import React from "react";
import {
  FaCalendarAlt,
  FaClock,
  FaBolt,
  FaMapMarkerAlt,
  FaCheckCircle,
} from "react-icons/fa";
import { FaPersonBiking } from "react-icons/fa6";
import eventoDefault from "../../assets/Images/Eventos/ciclista.jpg";
import carrerasIcon from "../../assets/Images/Icons/carreras.png";
import "../../assets/Styles/Normal/EventoCard.css";

const EventoCard = ({
  evento,
  inscrito,
  onToggleInscripcion,
  onAbrirChecklist,
  onAbrirMapa,
}) => {
  const imagenEvento = evento.image || eventoDefault;
  const fechaObj = evento.rawFecha;
  const ahora = new Date();
  const fechaEvento = new Date(evento.rawFecha);

  const limiteInscripcion = new Date(fechaEvento);
  limiteInscripcion.setDate(limiteInscripcion.getDate() - 1);
  limiteInscripcion.setHours(23, 59, 59, 999);

  const puedeInscribirse = ahora <= limiteInscripcion;

  const dia = fechaObj.getDate().toString().padStart(2, "0");
  const mes = fechaObj.toLocaleString("es-ES", { month: "short" }).toUpperCase();

  return (
    <div className="evento-card">
      <div className="evento-card-header">
        {inscrito && <span className="badge-inscrito">✓ Inscrito</span>}

        <div className="evento-fecha-box">
          <span className="dia">{dia}</span>
          <span className="mes">{mes}</span>
        </div>
        <img src={imagenEvento} alt="Evento" className="imagen-evento" />
        <div className="evento-icono-overlay">
          <img src={carrerasIcon} alt="icono bici" />
        </div>
      </div>

      <div className="contenido">
        <span className="etiqueta">{evento.titulo}</span>
        <h3>
          {evento.nombreRuta}
          {inscrito && <FaCheckCircle style={{ color: "#28a745", marginLeft: "8px" }} />}
        </h3>

        <p><FaCalendarAlt /> <strong>Fecha:</strong> {evento.fecha}</p>
        <p><FaClock /> <strong>Hora:</strong> {evento.hora}</p>
        <p><FaBolt /> <strong>Nivel de dificultad:</strong> {evento.dificultad}</p>
        <p><FaPersonBiking /> <strong>Modalidad:</strong> {evento.modalidad}</p>

        <button className="btn-ver" onClick={onAbrirMapa}>
          <FaMapMarkerAlt /> Ver Punto de encuentro
        </button>

        {puedeInscribirse ? (
          <button
            className={`btn-enrolarse ${inscrito ? "cancelar" : ""}`}
            onClick={() => {
              if (inscrito) {
                onToggleInscripcion();
              } else {
                onAbrirChecklist();
              }
            }}
          >
            {inscrito ? "Cancelar inscripción" : "Unirme al evento"}
          </button>
        ) : (
          <button className="btn-enrolarse disabled" disabled>
            Inscripción cerrada
          </button>
        )}
      </div>
    </div>
  );
};

export default EventoCard;
