import React, { useState, useEffect, useRef } from "react";
import { Nav } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import "../../assets/Styles/Admin/Sidebar.css";
import { getUserRole, logout } from "../../services/authService";
import { rolePermissions } from "../../config/roles";
import { useUser } from "../../context/Auth/UserContext";
import { useSidebar } from "../../context/Admin/SidebarContext";

const Sidebar = () => {
  const { userData } = useUser();
  const userRole = getUserRole();
  const links = rolePermissions[userRole] || [];
  const [expandedCategory, setExpandedCategory] = useState(null);
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const { isCollapsed, setIsCollapsed } = useSidebar();

  const categories = {
    personal: links.filter((link) => link.category === "personal"),
    users: links.filter((link) => link.category === "users"),
    rutas: links.filter((link) => link.category === "rutas"),
    eventos: links.filter((link) => link.category === "eventos"),
    administrativo: links.filter((link) => link.category === "administrativo"),
    financiero: links.filter((link) => link.category === "financiero"),
  };

  const toggleCategory = (category) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setExpandedCategory(category);
    } else {
      setExpandedCategory(prev => (prev === category ? null : category));
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  useEffect(() => {
    const handleResize = () => {
      setIsCollapsed(window.innerWidth <= 768);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (isCollapsed) {
      document.body.classList.add("sidebar-collapsed");
    } else {
      document.body.classList.remove("sidebar-collapsed");
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        window.innerWidth <= 768
      ) {
        setIsCollapsed(true);
        setExpandedCategory(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSublinkClick = () => {
    if (window.innerWidth <= 768) {
      setIsCollapsed(true);
      setExpandedCategory(null);
    }
  };
  useEffect(() => {
    console.log("Estado visual:", isCollapsed);
  }, [isCollapsed]);
  return (
    <>
      <div
        ref={sidebarRef}
        className="sidebar"
        data-state={isCollapsed ? "collapsed" : "expanded"}
      >        <div className="sidebar-user-box">
          <img
            src={
              userData?.profile_picture
                ? userData.profile_picture
                : require("../../assets/Images/Icons/defaultProfile.png")
            }
            alt="Foto de perfil"
            className="sidebar-user-avatar"
          />
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">
              {userData?.first_name} {userData?.last_name}
            </span>
            <span className="sidebar-user-info">
              {userData?.city}, {userData?.neighborhood}
            </span>
          </div>
        </div>

        <Nav className="flex-column">
          <Nav.Link as={Link} to="/admin" className="sidebar-link">
            <i className="fas fa-home sidebar-icon"></i>
            <span className="sidebar-label">Inicio</span>
          </Nav.Link>

          {/* Categoría: Configuración Personal */}
          <div className="sidebar-category">
            <div className="category-title" onClick={() => toggleCategory("personal")}>
              <i className="fas fa-user-cog category-icon"></i>
              <span>Configuración Personal</span>
              <i className={`fas ${expandedCategory === "personal" ? "fa-chevron-up" : "fa-chevron-down"} chevron-icon`}></i>
            </div>
            {expandedCategory === "personal" &&
              categories.personal.map((link) => (
                <Nav.Link
                  key={link.path}
                  as={Link}
                  to={`/admin/${link.path}`}
                  className="sidebar-sublink"
                  onClick={handleSublinkClick}
                >
                  <span className="sidebar-label">{link.label}</span>
                </Nav.Link>
              ))}
          </div>

          {/* Categoría: Gestión de Usuarios */}
          <div className="sidebar-category">
            <div className="category-title" onClick={() => toggleCategory("users")}>
              <i className="fas fa-users category-icon"></i>
              <span>Gestión de Usuarios</span>
              <i className={`fas ${expandedCategory === "users" ? "fa-chevron-up" : "fa-chevron-down"} chevron-icon`}></i>
            </div>
            {expandedCategory === "users" &&
              categories.users.map((link) => (
                <Nav.Link
                  key={link.path}
                  as={Link}
                  to={`/admin/${link.path}`}
                  className="sidebar-sublink"
                  onClick={handleSublinkClick}
                >
                  <span className="sidebar-label">{link.label}</span>
                </Nav.Link>
              ))}
          </div>

          {/* Categoría: Gestión de Rutas */}
          <div className="sidebar-category">
            <div className="category-title" onClick={() => toggleCategory("rutas")}>
              <i className="fas fa-route category-icon"></i>
              <span>Gestión de Rutas</span>
              <i className={`fas ${expandedCategory === "rutas" ? "fa-chevron-up" : "fa-chevron-down"} chevron-icon`}></i>
            </div>
            {expandedCategory === "rutas" &&
              categories.rutas.map((link) => (
                <Nav.Link
                  key={link.path}
                  as={Link}
                  to={`/admin/${link.path}`}
                  className="sidebar-sublink"
                  onClick={handleSublinkClick}
                >
                  <span className="sidebar-label">{link.label}</span>
                </Nav.Link>
              ))}
          </div>

          {/* Categoría: Gestión de Eventos */}
          <div className="sidebar-category">
            <div className="category-title" onClick={() => toggleCategory("eventos")}>
              <i className="far fa-calendar-check category-icon"></i>
              <span>Gestión de Eventos</span>
              <i className={`fas ${expandedCategory === "eventos" ? "fa-chevron-up" : "fa-chevron-down"} chevron-icon`}></i>
            </div>
            {expandedCategory === "eventos" &&
              categories.eventos.map((link) => (
                <Nav.Link
                  key={link.path}
                  as={Link}
                  to={`/admin/${link.path}`}
                  className="sidebar-sublink"
                  onClick={handleSublinkClick}
                >
                  <span className="sidebar-label">{link.label}</span>
                </Nav.Link>
              ))}
          </div>

          {/* Categoría: Gestión administrativa */}
          <div className="sidebar-category">
            <div className="category-title" onClick={() => toggleCategory("administrativo")}>
              <i className="fas fa-briefcase category-icon"></i>
              <span>Gestión Administrativa</span>
              <i className={`fas ${expandedCategory === "administrativo" ? "fa-chevron-up" : "fa-chevron-down"} chevron-icon`}></i>
            </div>
            {expandedCategory === "administrativo" &&
              categories.administrativo.map((link) => (
                <Nav.Link
                  key={link.path}
                  as={Link}
                  to={`/admin/${link.path}`}
                  className="sidebar-sublink"
                  onClick={handleSublinkClick}
                >
                  <span className="sidebar-label">{link.label}</span>
                </Nav.Link>
              ))}
          </div>


          {/* Categoría: Gestión financiera*/}
          <div className="sidebar-category">
            <div className="category-title" onClick={() => toggleCategory("financiero")}>
              <i className="fas fa-chart-line category-icon"></i>
              <span>Gestión Financiera</span>
              <i className={`fas ${expandedCategory === "financiero" ? "fa-chevron-up" : "fa-chevron-down"} chevron-icon`}></i>
            </div>
            {expandedCategory === "financiero" &&
              categories.financiero.map((link) => (
                <Nav.Link
                  key={link.path}
                  as={Link}
                  to={`/admin/${link.path}`}
                  className="sidebar-sublink"
                  onClick={handleSublinkClick}
                >
                  <span className="sidebar-label">{link.label}</span>
                </Nav.Link>
              ))}
          </div>

          {/* Cerrar sesión */}
          <div className="sidebar-link" onClick={handleLogout} style={{ cursor: "pointer" }}>
            <i className="fas fa-sign-out-alt sidebar-icon"></i>
            <span className="sidebar-label">Cerrar Sesión</span>
          </div>
        </Nav>
      </div>

      {!isCollapsed && window.innerWidth <= 576 && (
        <div className="sidebar-overlay" onClick={() => setIsCollapsed(true)}></div>
      )}
    </>
  );
};

export default Sidebar;
