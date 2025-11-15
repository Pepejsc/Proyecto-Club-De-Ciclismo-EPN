import React from "react";
import { useNavigate } from "react-router-dom";
import { logout } from "../../services/authService";
import "../../assets/Styles/Auth/Unauthorized.css"; 

const Unauthorized = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="unauthorized-wrapper">
      <div className="unauthorized-container">
        <img
          src={require("../../assets/Images/Icons/unauthorized.png")}
          alt="Unauthorized"
          className="unauthorized-image"
        />
        <h2>¡Lo sentimos!</h2>
        <p>No tienes autorización para acceder a esta sección.</p>
        <button className="btn-logout" onClick={handleLogout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
  
  
};

export default Unauthorized;
