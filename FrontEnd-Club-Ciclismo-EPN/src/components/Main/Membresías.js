import React from "react";

import membresia1 from "../../assets/Images/Icons/Entrenador.png";
import membresia2 from "../../assets/Images/Icons/EquipoEPN.png";
import membresia3 from "../../assets/Images/Icons/Ciclista.png";

const membresias = [
  { img: membresia1, titulo: "Entrenador" },
  { img: membresia2, titulo: "Equipo EPN" },
  { img: membresia3, titulo: "Ciclista" },
];

const MembresiasEstaticas = () => {
  return (
    <section className="membresias-section">
      <div className="membresias-container">
        {membresias.map((membresia, index) => (
          <div key={index} className="membresia-item">
            <img
              src={membresia.img}
              alt={membresia.titulo}
              className="membresia-img"
            />
            <div className="membresia-info">
              <h3 className="membresia-titulo">{membresia.titulo}</h3>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default MembresiasEstaticas;