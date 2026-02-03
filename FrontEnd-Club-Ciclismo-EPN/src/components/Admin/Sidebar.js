import React, { useState, useEffect, useRef, useMemo } from "react";
import { Nav } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { getUserRole, logout, getMyProfile } from "../../services/authService";
import { rolePermissions } from "../../config/roles";
import { useUser } from "../../context/Auth/UserContext";
import { useSidebar } from "../../context/Admin/SidebarContext";
import defaultProfile from "../../assets/Images/Icons/defaultProfile.png";
import "../../assets/Styles/Admin/Sidebar.css";

const API_URL = "http://127.0.0.1:8000";

/**
 * Normaliza la URL de la imagen para asegurar que tenga el formato correcto.
 * @param {string} path - Ruta relativa o absoluta de la imagen.
 * @returns {string|null} URL completa o null.
 */
const getSidebarImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${API_URL}${cleanPath}`;
};

/**
 * Componente Sidebar principal para el panel de administración.
 * Maneja la navegación, colapso responsivo y visualización de perfil.
 */
const Sidebar = () => {
  const { userData, setUserData } = useUser();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const userRole = getUserRole();
  const links = rolePermissions[userRole] || [];
  
  const [localPhoto, setLocalPhoto] = useState(null);
  const [localName, setLocalName] = useState("");
  const [localInfo, setLocalInfo] = useState("");
  const [expandedCategory, setExpandedCategory] = useState(null);
  
  const navigate = useNavigate();
  const sidebarRef = useRef(null);

  // Memoriza las categorías para optimizar renderizados
  const categories = useMemo(() => ({
    personal: links.filter((link) => link.category === "personal"),
    users: links.filter((link) => link.category === "users"),
    rutas: links.filter((link) => link.category === "rutas"),
    eventos: links.filter((link) => link.category === "eventos"),
    administrativo: links.filter((link) => link.category === "administrativo"),
    financiero: links.filter((link) => link.category === "financiero"),
    dashboard: links.filter((link) => link.category === "Dashboard"),
  }), [links]);

  const toggleCategory = (category) => {
    if (isCollapsed) {
      setIsCollapsed(false); // Expande el sidebar si estaba cerrado
      setExpandedCategory(category);
    } else {
      setExpandedCategory((prev) => (prev === category ? null : category));
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  /**
   * Obtiene y actualiza los datos del perfil del usuario.
   */
  const refreshProfile = async () => {
    try {
      const profile = await getMyProfile();
      if (profile) {
        setLocalPhoto(profile.profile_picture);
        setLocalName(`${profile.first_name} ${profile.last_name}`);
        setLocalInfo(`${profile.city}, ${profile.neighborhood}`);
        // Sincroniza con el contexto global si es necesario
        if (userData) setUserData({ ...userData, ...profile });
      }
    } catch (error) {
      console.error("Error actualizando perfil en Sidebar:", error);
    }
  };

  // Efecto inicial: Carga perfil y configura listeners de resize
  useEffect(() => {
    refreshProfile();
    const handleUpdate = () => refreshProfile();
    
    // Lógica para manejar el cambio de tamaño de ventana
    const handleResize = () => {
       if (window.innerWidth > 768) {
         // En escritorio, asegura que esté visible
         setIsCollapsed(false);
       } else {
         // En móvil, colapsa por defecto
         setIsCollapsed(true);
       }
    };

    window.addEventListener("profile_updated", handleUpdate);
    window.addEventListener("resize", handleResize);
    
    // Ejecución inicial para establecer estado correcto según pantalla actual
    handleResize();

    return () => {
      window.removeEventListener("profile_updated", handleUpdate);
      window.removeEventListener("resize", handleResize);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sincroniza la clase CSS en el body para ajustar el layout principal
  useEffect(() => {
    document.body.classList.toggle("sidebar-collapsed", isCollapsed);
  }, [isCollapsed]);

  // Maneja el cierre del sidebar al hacer clic fuera (solo móvil)
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Ignora clics en el botón hamburguesa
      if (event.target.closest('.mobile-toggle-btn')) return;

      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target) &&
        window.innerWidth <= 768 &&
        !isCollapsed 
      ) {
        setIsCollapsed(true);
        setExpandedCategory(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isCollapsed, setIsCollapsed]);

  const handleSublinkClick = () => {
    if (window.innerWidth <= 768) {
      setIsCollapsed(true);
      setExpandedCategory(null);
    }
  };

  // Renderiza una categoría y sus sub-enlaces
  const renderCategory = (key, title, iconClass) => {
    if (!categories[key] || categories[key].length === 0) return null;

    return (
      <div className="sidebar-category">
        <div 
          className="category-title" 
          onClick={() => toggleCategory(key)}
          role="button"
          tabIndex={0}
        >
          <i className={`${iconClass} category-icon`}></i>
          <span>{title}</span>
          <i className={`fas ${expandedCategory === key ? "fa-chevron-up" : "fa-chevron-down"} chevron-icon`}></i>
        </div>
        
        {expandedCategory === key && categories[key].map((link) => (
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
    );
  };

  return (
    <>
      {/* Botón Flotante (Solo visible en móviles) */}
      <button 
        className="mobile-toggle-btn"
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? "Abrir menú" : "Cerrar menú"}
      >
        <i className={`fas ${isCollapsed ? "fa-bars" : "fa-times"}`}></i>
      </button>

      <div
        ref={sidebarRef}
        className="sidebar"
        data-state={isCollapsed ? "collapsed" : "expanded"}
      >
        <div className="sidebar-user-box">
          <img
            src={localPhoto ? `${getSidebarImageUrl(localPhoto)}?t=${Date.now()}` : defaultProfile}
            alt="Foto de perfil"
            className="sidebar-user-avatar"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = defaultProfile;
            }}
          />
          <div className="sidebar-user-info-container">
            <span className="sidebar-user-name">
              {localName || "Administrador"}
            </span>
            <span className="sidebar-user-details">{localInfo}</span>
          </div>
        </div>

        <Nav className="flex-column">
          <Nav.Link as={Link} to="/admin" className="sidebar-link">
            <i className="fas fa-home sidebar-icon"></i>
            <span className="sidebar-label">Inicio</span>
          </Nav.Link>

          {renderCategory("personal", "Configuración Personal", "fas fa-user-cog")}
          {renderCategory("users", "Gestión de Usuarios", "fas fa-users")}
          {renderCategory("rutas", "Gestión de Rutas", "fas fa-route")}
          {renderCategory("eventos", "Gestión de Eventos", "far fa-calendar-check")}
          {renderCategory("administrativo", "Gestión Administrativa", "fas fa-briefcase")}
          {renderCategory("financiero", "Gestión Financiera", "fas fa-chart-line")}

          <div 
            className="sidebar-link sidebar-logout-btn" 
            onClick={handleLogout}
            role="button"
            tabIndex={0}
          >
            <i className="fas fa-sign-out-alt sidebar-icon"></i>
            <span className="sidebar-label">Cerrar Sesión</span>
          </div>
        </Nav>
      </div>

      {/* Overlay oscuro para fondo en móviles */}
      {!isCollapsed && (
        <div className="sidebar-overlay d-md-none" onClick={() => setIsCollapsed(true)}></div>
      )}
    </>
  );
};

export default Sidebar;