import React from "react";
import ClubLogo from "../../assets/Images/Icons/ClubCiclismo.png";
import "../../assets/Styles/Admin/Dashboard.css";

const Bienvenida = () => {
  return (
    <div className="dashboard-main">
      <img src={ClubLogo} alt="Logo Club de Ciclismo" className="dashboard-logo" />
      <h2 className="dashboard-title">Bienvenido al panel de administración</h2>
      <p className="dashboard-subtitle">
        Aquí puedes gestionar rutas, usuarios, eventos y más 🚴‍♂️
      </p>
    </div>
  );
};

export default Bienvenida;
