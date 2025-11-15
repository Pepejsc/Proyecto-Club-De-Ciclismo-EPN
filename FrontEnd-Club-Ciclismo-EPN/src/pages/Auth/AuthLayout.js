import React from "react";
import "../../assets/Styles/Auth/AuthLayout.css";
import logoClub from "../../assets/Images/Icons/ClubCiclismo.png";

const AuthLayout = ({ children }) => {
  return (
    <div className="auth-wrapper">
      <div className="auth-left">
        <img src={logoClub} alt="Logo Club de Ciclismo EPN" className="auth-logo" />
      </div>
      <div className="auth-right">
        {children}
      </div>
    </div>
  );
};

export default AuthLayout;
