import React, { useState, useEffect, useRef } from "react";
import { Nav } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import "../../assets/Styles/Admin/Sidebar.css";
import { getUserRole, logout, getMyProfile } from "../../services/authService"; 
import { rolePermissions } from "../../config/roles";
import { useUser } from "../../context/Auth/UserContext";
import { useSidebar } from "../../context/Admin/SidebarContext";
import { fetchNotifications } from "../../services/notificationService";

// --- LÓGICA DE URL DIRECTA ---
const API_URL = "http://127.0.0.1:8000"; // Tu backend

const getSidebarImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${cleanPath}`;
};
// ----------------------------

// --- AQUÍ ESTABA EL ERROR: FALTABA LA PALABRA 'export' ---
export const loadUnreadCount = async (setCount) => {
  try {
    const data = await fetchNotifications();
    // Aseguramos que data sea un array antes de filtrar
    if (Array.isArray(data)) {
        const unread = data.filter((n) => !n.is_read).length;
        setCount(unread);
    }
  } catch (err) {
    console.error("Error contando notificaciones", err);
  }
};
// ---------------------------------------------------------

const Sidebar = () => {
  const { userData, setUserData } = useUser();
  const userRole = getUserRole();
  const links = rolePermissions[userRole] || [];
  
  const [localPhoto, setLocalPhoto] = useState(null);
  const [localName, setLocalName] = useState("");
  const [localInfo, setLocalInfo] = useState("");

  const [expandedCategory, setExpandedCategory] = useState(null);
  const navigate = useNavigate();
  const sidebarRef = useRef(null);
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [unreadCount, setUnreadCount] = useState(0);

  const categories = {
    personal: links.filter((link) => link.category === "personal"),
    membresia: links.filter((link) => link.category === "membresia"),
    notificaciones: links.filter((link) => link.category === "notificaciones"),
    eventos: links.filter((link) => link.category === "eventos"),
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
      console.error("Error sidebar", error);
    }
  };

  useEffect(() => {
    refreshProfile();
    const handleUpdate = () => refreshProfile();
    window.addEventListener("profile_updated", handleUpdate);

    const handleResize = () => setIsCollapsed(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);

    // Usamos la función exportada aquí mismo
    const syncUnreadCount = async () => await loadUnreadCount(setUnreadCount);
    window.addEventListener("storage", (e) => e.key === "actualizar_notificaciones" && syncUnreadCount());
    syncUnreadCount();

    return () => {
      window.removeEventListener("profile_updated", handleUpdate);
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
      if (isCollapsed) document.body.classList.add("sidebar-collapsed");
      else document.body.classList.remove("sidebar-collapsed");
  }, [isCollapsed]);

  const handleSublinkClick = () => {
    if (window.innerWidth <= 768) {
        setIsCollapsed(true);
        setExpandedCategory(null);
      }
  };

  return (
    <>
      <div ref={sidebarRef} className="sidebar" data-state={isCollapsed ? "collapsed" : "expanded"}>
        <div className="sidebar-user-box">
          <img
            src={
              localPhoto 
                ? `${getSidebarImageUrl(localPhoto)}?t=${Date.now()}` 
                : require("../../assets/Images/Icons/defaultProfile.png")
            }
            alt="Foto"
            className="sidebar-user-avatar"
            style={{objectFit: 'cover'}}
            onError={(e) => {
                e.target.onerror = null; 
                e.target.src=require("../../assets/Images/Icons/defaultProfile.png")
            }}
          />
          <div className="sidebar-user-info">
            <span className="sidebar-user-name">{localName || "Cargando..."}</span>
            <span className="sidebar-user-info">{localInfo}</span>
          </div>
        </div>

        <Nav className="flex-column">
          <Nav.Link as={Link} to="/user" className="sidebar-link">
            <i className="fas fa-home sidebar-icon"></i>
            <span className="sidebar-label">Inicio</span>
          </Nav.Link>

           <div className="sidebar-category">
            <div className="category-title" onClick={() => toggleCategory("personal")}>
              <i className="fas fa-user-cog category-icon"></i>
              <span>Configuración Personal</span>
              <i className={`fas ${expandedCategory === "personal" ? "fa-chevron-up" : "fa-chevron-down"} chevron-icon`}></i>
            </div>
            {expandedCategory === "personal" &&
              categories.personal.map((link) => (
                <Nav.Link key={link.path} as={Link} to={`/user/${link.path}`} className="sidebar-sublink" onClick={handleSublinkClick}>
                  <span className="sidebar-label">{link.label}</span>
                </Nav.Link>
              ))}
          </div>
          
          <div className="sidebar-category">
            <div className="category-title" onClick={() => toggleCategory("membresia")}>
              <i className="fas fa-id-card category-icon"></i>
              <span>Configuración de Membresía</span>
              <i className={`fas ${expandedCategory === "membresia" ? "fa-chevron-up" : "fa-chevron-down"} chevron-icon`}></i>
            </div>
            {expandedCategory === "membresia" &&
              categories.membresia.map((link) => (
                <Nav.Link key={link.path} as={Link} to={`/user/${link.path}`} className="sidebar-sublink" onClick={handleSublinkClick}>
                  <span className="sidebar-label">{link.label}</span>
                </Nav.Link>
              ))}
          </div>

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