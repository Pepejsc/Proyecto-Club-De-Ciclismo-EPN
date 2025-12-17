import React, { useState, useEffect, useRef } from "react";
import { Nav } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import "../../assets/Styles/Admin/Sidebar.css";
import { getUserRole, logout, getMyProfile } from "../../services/authService";
import { rolePermissions } from "../../config/roles";
import { useUser } from "../../context/Auth/UserContext";
import { useSidebar } from "../../context/Admin/SidebarContext";

// --- 1. LÓGICA DE URL DIRECTA (Igual que en User Sidebar) ---
const API_URL = "http://127.0.0.1:8000";

const getSidebarImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${cleanPath}`;
};
// -----------------------------------------------------------

const Sidebar = () => {
  // Usamos setUserData para actualizar el contexto global si es necesario
  const { userData, setUserData } = useUser();
  const userRole = getUserRole();
  const links = rolePermissions[userRole] || [];

  // --- 2. ESTADOS LOCALES PARA CARGA INMEDIATA ---
  const [localPhoto, setLocalPhoto] = useState(null);
  const [localName, setLocalName] = useState("");
  const [localInfo, setLocalInfo] = useState("");

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
    dashboard: links.filter((link) => link.category === "Dashboard"),
  };

  const toggleCategory = (category) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setExpandedCategory(category);
    } else {
      setExpandedCategory((prev) => (prev === category ? null : category));
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  // --- 3. FUNCIÓN DE REFRESCAR PERFIL ---
  const refreshProfile = async () => {
    try {
      const profile = await getMyProfile();
      if (profile) {
        setLocalPhoto(profile.profile_picture);
        setLocalName(`${profile.first_name} ${profile.last_name}`);
        setLocalInfo(`${profile.city}, ${profile.neighborhood}`);

        if (userData) setUserData({ ...userData, ...profile });
      }
    } catch (error) {
      console.error("Error admin sidebar", error);
    }
  };

  useEffect(() => {
    refreshProfile(); // Carga inicial

    // Escuchar evento de actualización (si el admin edita su perfil)
    const handleUpdate = () => refreshProfile();
    window.addEventListener("profile_updated", handleUpdate);

    const handleResize = () => setIsCollapsed(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("profile_updated", handleUpdate);
      window.removeEventListener("resize", handleResize);
      // Click outside se maneja en otro useEffect
    };
  }, []);

  useEffect(() => {
    if (isCollapsed) document.body.classList.add("sidebar-collapsed");
    else document.body.classList.remove("sidebar-collapsed");
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

  return (
    <>
      <div
        ref={sidebarRef}
        className="sidebar"
        data-state={isCollapsed ? "collapsed" : "expanded"}
      >
        <div className="sidebar-user-box">
          {/* --- 4. USO DE LA IMAGEN CORREGIDO --- */}
          <img
            src={
              localPhoto
                ? `${getSidebarImageUrl(localPhoto)}?t=${Date.now()}` // URL Backend + Cache Busting
                : require("../../assets/Images/Icons/defaultProfile.png")
            }
            alt="Foto de perfil"
            className="sidebar-user-avatar"
            style={{ objectFit: "cover" }}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = require("../../assets/Images/Icons/defaultProfile.png");
            }}
          />

          <div className="sidebar-user-info">
            <span className="sidebar-user-name">
              {localName || "Administrador"}
            </span>
            <span className="sidebar-user-info">{localInfo}</span>
          </div>
        </div>

        <Nav className="flex-column">
          <Nav.Link as={Link} to="/admin" className="sidebar-link">
            <i className="fas fa-home sidebar-icon"></i>
            <span className="sidebar-label">Inicio</span>
          </Nav.Link>

          {/* --- CATEGORÍAS (Sin cambios) --- */}
          <div className="sidebar-category">
            <div
              className="category-title"
              onClick={() => toggleCategory("personal")}
            >
              <i className="fas fa-user-cog category-icon"></i>
              <span>Configuración Personal</span>
              <i
                className={`fas ${
                  expandedCategory === "personal"
                    ? "fa-chevron-up"
                    : "fa-chevron-down"
                } chevron-icon`}
              ></i>
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

          <div className="sidebar-category">
            <div
              className="category-title"
              onClick={() => toggleCategory("users")}
            >
              <i className="fas fa-users category-icon"></i>
              <span>Gestión de Usuarios</span>
              <i
                className={`fas ${
                  expandedCategory === "users"
                    ? "fa-chevron-up"
                    : "fa-chevron-down"
                } chevron-icon`}
              ></i>
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

          <div className="sidebar-category">
            <div
              className="category-title"
              onClick={() => toggleCategory("rutas")}
            >
              <i className="fas fa-route category-icon"></i>
              <span>Gestión de Rutas</span>
              <i
                className={`fas ${
                  expandedCategory === "rutas"
                    ? "fa-chevron-up"
                    : "fa-chevron-down"
                } chevron-icon`}
              ></i>
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

          <div className="sidebar-category">
            <div
              className="category-title"
              onClick={() => toggleCategory("eventos")}
            >
              <i className="far fa-calendar-check category-icon"></i>
              <span>Gestión de Eventos</span>
              <i
                className={`fas ${
                  expandedCategory === "eventos"
                    ? "fa-chevron-up"
                    : "fa-chevron-down"
                } chevron-icon`}
              ></i>
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

          <div className="sidebar-category">
            <div
              className="category-title"
              onClick={() => toggleCategory("administrativo")}
            >
              <i className="fas fa-briefcase category-icon"></i>
              <span>Gestión Administrativa</span>
              <i
                className={`fas ${
                  expandedCategory === "administrativo"
                    ? "fa-chevron-up"
                    : "fa-chevron-down"
                } chevron-icon`}
              ></i>
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

          <div className="sidebar-category">
            <div
              className="category-title"
              onClick={() => toggleCategory("financiero")}
            >
              <i className="fas fa-chart-line category-icon"></i>
              <span>Gestión Financiera</span>
              <i
                className={`fas ${
                  expandedCategory === "financiero"
                    ? "fa-chevron-up"
                    : "fa-chevron-down"
                } chevron-icon`}
              ></i>
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

          <div
            className="sidebar-link"
            onClick={handleLogout}
            style={{ cursor: "pointer" }}
          >
            <i className="fas fa-sign-out-alt sidebar-icon"></i>
            <span className="sidebar-label">Cerrar Sesión</span>
          </div>
        </Nav>
      </div>

      {!isCollapsed && window.innerWidth <= 576 && (
        <div
          className="sidebar-overlay"
          onClick={() => setIsCollapsed(true)}
        ></div>
      )}
    </>
  );
};

export default Sidebar;
