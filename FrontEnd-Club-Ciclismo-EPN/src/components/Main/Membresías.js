import React from "react";
import { useNavigate } from "react-router-dom";
import membresia1 from "../../assets/Images/Icons/Entrenador.png";
import membresia2 from "../../assets/Images/Icons/EquipoEPN.png";
import membresia3 from "../../assets/Images/Icons/Ciclista.png";
import "../../assets/Styles/Main/MembresiasEstaticas.css";

const membresias = [
  {
    id: 1,
    img: membresia1,
    titulo: "Entrenador",
    description:
      "Para ciclistas experimentados que buscan rendimiento. Accede a entrenamientos de alta intensidad, análisis de métricas y mentoría.",
  },
  {
    id: 2,
    img: membresia2,
    titulo: "Equipo EPN",
    description:
      "¡Representa a la EPN! La membresía de élite para competir. Participarás en carreras oficiales portando los colores del club.",
  },
  {
    id: 3,
    img: membresia3,
    titulo: "Ciclista",
    description:
      "Perfecta para iniciar en el ciclismo o para salidas recreativas. Enfocada en seguridad, técnica básica y diversión en comunidad.",
  },
];

const MembresiasEstaticas = () => {
  const navigate = useNavigate();

  const handleLoginClick = (e) => {
    e.stopPropagation();
    navigate("/login");
  };

  return (
    <section className="static-memberships-section">
      <div className="static-memberships-container">
        {membresias.map((membresia) => (
          <div key={membresia.id} className="static-membership-card">
            
            <div className="static-card-content">
              <div className="static-icon-container">
                <img
                  src={membresia.img}
                  alt=""
                  className="static-card-img"
                  aria-hidden="true"
                />
              </div>
              <h3 className="static-card-title">{membresia.titulo}</h3>
            </div>

            <div className="static-card-overlay">
              <p className="static-card-description">{membresia.description}</p>
              <button 
                className="static-card-btn" 
                onClick={handleLoginClick}
                aria-label={`Acceder a ${membresia.titulo}`}
              >
                Acceder
              </button>
            </div>
            
          </div>
        ))}
      </div>
    </section>
  );
};

export default MembresiasEstaticas;