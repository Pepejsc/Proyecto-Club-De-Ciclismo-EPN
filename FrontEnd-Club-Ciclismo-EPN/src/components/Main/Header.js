import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faBars, faTimes } from "@fortawesome/free-solid-svg-icons";
import logo from "../../assets/Images/Icons/ClubCiclismo.png";
import "../../assets/Styles/Main/Header.css";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen((prev) => !prev);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="public-header">
      <div className="header-content">
        
        <div className="header-left">
          <button
            className={`menu-toggle ${menuOpen ? "open" : ""}`}
            onClick={toggleMenu}
            aria-label="Abrir menú de navegación"
          >
            <FontAwesomeIcon icon={menuOpen ? faTimes : faBars} />
          </button>
          
          {/* ✅ Logo ahora es un enlace al inicio */}
          <Link to="/" className="logo-link" onClick={closeMenu}>
            <img src={logo} alt="Logo Club Ciclismo" className="header-logo" />
          </Link>
        </div>

        <div className={`header-center ${menuOpen ? "active" : ""}`}>
          <nav className={`nav-links ${menuOpen ? "active" : ""}`}>
            <Link to="/" onClick={closeMenu}>Inicio</Link>
            <Link to="/quienes-somos" onClick={closeMenu}>Quiénes Somos</Link>
            <Link to="/eventos" onClick={closeMenu}>Eventos</Link>
            <Link to="/productos" onClick={closeMenu}>Productos</Link>
            <Link to="/auspiciantes" onClick={closeMenu}>Auspiciantes</Link>
            <Link to="/contacto" onClick={closeMenu}>Contacto</Link>
          </nav>
        </div>

        <div className="header-right">
          <Link to="/login" className="login-button">
            <FontAwesomeIcon icon={faUser} />
            <span>Iniciar Sesión</span>
          </Link>
        </div>
        
      </div>
      
      {menuOpen && <div className="menu-overlay" onClick={closeMenu}></div>}
    </header>
  );
};

export default Header;