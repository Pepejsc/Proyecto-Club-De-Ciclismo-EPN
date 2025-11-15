import React from "react";
import { useNavigate } from "react-router-dom";
import "../../assets/Styles/Main/Productos.css";

// Tus importaciones de imágenes
import membresia1 from "../../assets/Images/Icons/Entrenador.png";
import membresia2 from "../../assets/Images/Icons/EquipoEPN.png";
import membresia3 from "../../assets/Images/Icons/Ciclista.png";

// Array de datos con las descripciones
const membresias = [
  {
    id: 1,
    img: membresia1,
    titulo: "Entrenador",
    description:
      "Para ciclistas experimentados que buscan rendimiento. Accede a entrenamientos de alta intensidad, análisis de métricas y mentoría a nuevos miembros. Ideal si dominas las rutas y buscas un desafío profesional.",
  },
  {
    id: 2,
    img: membresia2,
    titulo: "Equipo EPN",
    description:
      "¡Representa a la EPN! La membresía de élite para competir. Participarás en carreras oficiales portando los colores del club. Incluye equipamiento, entrenamientos tácticos y cobertura de inscripciones a eventos.",
  },
  {
    id: 3,
    img: membresia3,
    titulo: "Ciclista",
    description:
      "Perfecta para iniciar en el ciclismo o para salidas recreativas. Enfocada en seguridad, técnica básica y diversión. Aprende los fundamentos y únete a una comunidad de apoyo para ganar confianza.",
  },
];

const MembresiasEstaticas = () => {
  const navigate = useNavigate();

  // Función para el botón "Acceder"
  const handleLoginClick = (e) => {
    // Evita que el clic en el botón dispare otros eventos
    e.stopPropagation();
    navigate("/login");
  };

  return (
    <section className="membresias-section">
      <div className="membresias-container">
        {membresias.map((membresia) => (
          <div key={membresia.id} className="membresia-item">
            {/* --- CONTENIDO FRONTAL (SIEMPRE VISIBLE) --- */}
            <div className="membresia-front">
              <img
                src={membresia.img}
                alt={membresia.titulo}
                className="membresia-img"
              />
              <div className="membresia-info">
                <h3 className="membresia-titulo">{membresia.titulo}</h3>
              </div>
            </div>

            {/* --- CONTENIDO HOVER (OCULTO POR DEFECTO) --- */}
            <div className="membresia-details">
              <p className="membresia-description">{membresia.description}</p>
              <button className="btn-membresia" onClick={handleLoginClick}>
                Acceder
              </button>
            </div>
            {/* --- FIN DE CONTENIDO HOVER --- */}
          </div>
        ))}
      </div>
    </section>
  );
};

export default MembresiasEstaticas;
