import React from "react";
import logo from "../../assets/Images/Icons/ClubCiclismo.png";
import "../../assets/Styles/Main/Footer.css";

const Footer = () => {
  return (
    <footer className="custom-footer">
      <div className="social-icons" >
        <a href="https://www.facebook.com/ciclismoepn" target="_blank" rel="noopener noreferrer">
          <i className="fa-brands fa-facebook-f" />
        </a>
        <a href="https://www.tiktok.com/@ciclismoepn" target="_blank" rel="noopener noreferrer">
          <i className="fa-brands fa-tiktok" />
        </a>
        <a href="https://www.instagram.com/ciclismoepn" target="_blank" rel="noopener noreferrer">
          <i className="fa-brands fa-instagram" />
        </a>
      </div>

      <div className="footer-curve-arc">
        <div className="footer-content">
          <img src={logo} alt="Logo Club" className="footer-logo" />
          <p>Todos los derechos reservados.</p>
          <p>© 2025 Club de Ciclismo EPN.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
