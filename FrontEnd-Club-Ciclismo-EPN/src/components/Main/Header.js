import React, { useState } from "react";
import { Link } from "react-router-dom";
import logo from "../../assets/Images/Icons/ClubCiclismo.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faBars, faTimes } from "@fortawesome/free-solid-svg-icons";

import "../../assets/Styles/Main/Header.css";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="public-header">
      <div className="header-content">
        {/* Grupo izquierdo: Hamburguesa + Logo */}
        <div className="left-group">
          <button
            className={`menu-toggle ${menuOpen ? "open" : ""}`}
            onClick={toggleMenu}
          >
            <FontAwesomeIcon icon={menuOpen ? faTimes : faBars} />
          </button>

          <img src={logo} alt="Logo" className="logo" />
        </div>

        {/* Menú lateral (solo se muestra en móviles cuando está activo) */}
        <div className={`center-group ${menuOpen ? "active" : ""}`}>
          <nav className={`nav-links ${menuOpen ? "active" : ""}`}>
            <Link to="/" onClick={closeMenu}>Inicio</Link>
            <Link to="/quienes-somos" onClick={closeMenu}>Quiénes Somos</Link>
            <Link to="/eventos" onClick={closeMenu}>Eventos</Link>
            <Link to="/productos" onClick={closeMenu}>Productos</Link>
            <Link to="/auspiciantes" onClick={closeMenu}>Auspiciantes</Link>
            <Link to="/contacto" onClick={closeMenu}>Contacto</Link>
            {/* <a href="#contacto" onClick={closeMenu}>Contacto</a>*/}
          </nav>
        </div>

        {/* Botón Iniciar Sesión */}
        <div className="right-group">
          <Link to="/login" className="login-button">
            <FontAwesomeIcon icon={faUser} />
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;
