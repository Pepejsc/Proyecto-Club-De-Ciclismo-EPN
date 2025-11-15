import React from "react";
import ClubLogo from "../../assets/Images/Icons/ClubCiclismo.png";
import "../../assets/Styles/Admin/Dashboard.css";

const Bienvenida = () => {
    return (
        <div className="dashboard-main">
            <img src={ClubLogo} alt="Logo Club de Ciclismo" className="dashboard-logo" />
            <h2 className="dashboard-title">¡Bienvenido al Club de Ciclismo!</h2>
            <p className="dashboard-subtitle">
                Explora rutas, inscríbete en eventos y mantente activo 🚴‍♂️
            </p>

        </div>
    );
};

export default Bienvenida;
