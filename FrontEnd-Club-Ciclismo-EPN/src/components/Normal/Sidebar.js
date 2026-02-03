import React, { useState, useEffect, useRef, useMemo } from "react";
import { Nav } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { getUserRole, logout, getMyProfile } from "../../services/authService";
import { rolePermissions } from "../../config/roles";
import { useUser } from "../../context/Auth/UserContext";
import { useSidebar } from "../../context/Admin/SidebarContext";
import { fetchNotifications } from "../../services/notificationService";
import defaultProfile from "../../assets/Images/Icons/defaultProfile.png";
import "../../assets/Styles/Normal/Sidebar.css";

const API_URL = "http://127.0.0.1:8000";

/**
 * Normaliza la URL de la imagen.
 */
const getSidebarImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${cleanPath}`;
};

/**
 * Carga el conteo de notificaciones no leídas.
 * Exportada para ser usada externamente si es necesario.
 */
export const loadUnreadCount = async (setCount) => {
  try {
    const data = await fetchNotifications();
    if (Array.isArray(data)) {
      const unread = data.filter((n) => !n.is_read).length;
      setCount(unread);
    }
  } catch (err) {
    console.error("Error contando notificaciones", err);
  }
};

const Sidebar = () => {
  const { userData, setUserData } = useUser();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const userRole = getUserRole();
  const links = rolePermissions[userRole] || [];
  
  const [localPhoto, setLocalPhoto] = useState(null);
  const [localName, setLocalName] = useState("");
  const [localInfo, setLocalInfo] = useState("");
  const [expandedCategory, setExpandedCategory] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  const navigate = useNavigate();
  const sidebarRef = useRef(null);

  // Memorizamos categorías
  const categories = useMemo(() => ({
    personal: links.filter((link) => link.category === "personal"),
    membresia: links.filter((link) => link.category === "membresia"),
    notificaciones: links.filter((link) => link.category === "notificaciones"),
    eventos: links.filter((link) => link.category === "eventos"),
  }), [links]);

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
      console.error("Error cargando perfil en sidebar usuario", error);
    }
  };

  // Efecto principal: Perfil, Resize, Notificaciones
  useEffect(() => {
    refreshProfile();
    const handleUpdate = () => refreshProfile();
    
    // Lógica Responsive igual al Admin
    const handleResize = () => {
       if (window.innerWidth > 768) {
         setIsCollapsed(false);
       } else {
         setIsCollapsed(true);
       }
    };

    // Sincronización de notificaciones
    const syncUnreadCount = async () => await loadUnreadCount(setUnreadCount);
    
    window.addEventListener("profile_updated", handleUpdate);
    window.addEventListener("resize", handleResize);
    window.addEventListener("storage", (e) => e.key === "actualizar_notificaciones" && syncUnreadCount());
    
    // Ejecuciones iniciales
    handleResize();
    syncUnreadCount();

    return () => {
      window.removeEventListener("profile_updated", handleUpdate);
      window.removeEventListener("resize", handleResize);
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    document.body.classList.toggle("sidebar-collapsed", isCollapsed);
  }, [isCollapsed]);

  // Click outside para cerrar en móvil
  useEffect(() => {
    const handleClickOutside = (event) => {
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

  // Helper para renderizar categorías acordeón
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
            to={`/user/${link.path}`} 
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
      {/* Botón Flotante para Móvil */}
      <button 
        className="mobile-toggle-btn"
        onClick={() => setIsCollapsed(!isCollapsed)}
        aria-label={isCollapsed ? "Abrir menú" : "Cerrar menú"}
      >
        <i className={`fas ${isCollapsed ? "fa-bars" : "fa-times"}`}></i>
      </button>

      <div ref={sidebarRef} className="sidebar" data-state={isCollapsed ? "collapsed" : "expanded"}>
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
            <span className="sidebar-user-name">{localName || "Usuario"}</span>
            <span className="sidebar-user-details">{localInfo}</span>
          </div>
        </div>

        <Nav className="flex-column">
          <Nav.Link as={Link} to="/user" className="sidebar-link">
            <i className="fas fa-home sidebar-icon"></i>
            <span className="sidebar-label">Inicio</span>
          </Nav.Link>

          {renderCategory("personal", "Configuración Personal", "fas fa-user-cog")}
          {renderCategory("membresia", "Configuración de Membresía", "fas fa-id-card")}

          {/* Enlaces directos (Notificaciones y Eventos) */}
          {categories.notificaciones.map((link) => (
            <Nav.Link key={link.path} as={Link} to={`/user/${link.path}`} className="sidebar-link" onClick={handleSublinkClick}>
               <div className="sidebar-icon-wrapper">
                <i className="fas fa-bell sidebar-icon"></i>
                {unreadCount > 0 && <span className="sidebar-notification-count">{unreadCount}</span>}
              </div>
              <span className="sidebar-label">{link.label}</span>
            </Nav.Link>
          ))}
          
          {categories.eventos.map((link) => (
            <Nav.Link key={link.path} as={Link} to={`/user/${link.path}`} className="sidebar-link" onClick={handleSublinkClick}>
              <i className="far fa-calendar-check sidebar-icon"></i>
              <span className="sidebar-label">{link.label}</span>
            </Nav.Link>
          ))}

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

      {/* Overlay para móvil */}
      {!isCollapsed && (
        <div className="sidebar-overlay d-md-none" onClick={() => setIsCollapsed(true)}></div>
      )}
    </>
  );
};

export default Sidebar;   