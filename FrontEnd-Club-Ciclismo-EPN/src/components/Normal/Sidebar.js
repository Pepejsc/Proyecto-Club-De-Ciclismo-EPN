import React, { useState, useEffect, useRef } from "react";
import { Nav } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import "../../assets/Styles/Admin/Sidebar.css";
import { getUserRole, logout } from "../../services/authService";
import { rolePermissions } from "../../config/roles";
import { useUser } from "../../context/Auth/UserContext";
import { useSidebar } from "../../context/Admin/SidebarContext";
import { fetchNotifications } from "../../services/notificationService";

export const loadUnreadCount = async (setCount) => {
  try {
    const data = await fetchNotifications();
    const unread = data.filter((n) => !n.is_read).length;
    setCount(unread);
  } catch (err) {
    console.error("Error al contar notificaciones", err);
  }
};

const Sidebar = () => {
  const { userData } = useUser();
  const userRole = getUserRole();
  const links = rolePermissions[userRole] || [];
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

useEffect(() => {
  const syncUnreadCount = async () => {
    await loadUnreadCount(setUnreadCount);
  };

  const handleStorageChange = (event) => {
    if (event.key === "actualizar_notificaciones") {
      syncUnreadCount();
    }
  };

  window.addEventListener("storage", handleStorageChange);

  // Cargar al iniciar
  syncUnreadCount();

  return () => window.removeEventListener("storage", handleStorageChange);
}, []);

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
          <Nav.Link as={Link} to="/user" className="sidebar-link">
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
                  to={`/user/${link.path}`}
                  className="sidebar-sublink"
                  onClick={handleSublinkClick}
                >
                  <span className="sidebar-label">{link.label}</span>
                </Nav.Link>
              ))}
          </div>

          {/* Categoría: Configuración Membresía */}
          <div className="sidebar-category">
            <div className="category-title" onClick={() => toggleCategory("membresia")}>
              <i className="fas fa-id-card category-icon"></i>
              <span>Configuración de Membresía</span>
              <i className={`fas ${expandedCategory === "membresia" ? "fa-chevron-up" : "fa-chevron-down"} chevron-icon`}></i>
            </div>
            {expandedCategory === "membresia" &&
              categories.membresia.map((link) => (
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

          {/* Categoría: Notificaciones */}
          {categories.notificaciones.map((link) => (
            <Nav.Link
              key={link.path}
              as={Link}
              to={`/user/${link.path}`}
              className="sidebar-link"
              onClick={handleSublinkClick}
            >
              <div className="sidebar-icon-wrapper">
                <i className="fas fa-bell sidebar-icon"></i>
                {unreadCount > 0 && (
                  <span className="sidebar-notification-count">{unreadCount}</span>
                )}
              </div>
              <span className="sidebar-label">{link.label}</span>
            </Nav.Link>
          ))}


          {/* Categoría: Eventos Disponibles */}
          {categories.eventos.map((link) => (
            <Nav.Link
              key={link.path}
              as={Link}
              to={`/user/${link.path}`}
              className="sidebar-link"
              onClick={handleSublinkClick}
            >
              <i className="far fa-calendar-check sidebar-icon"></i>
              <span className="sidebar-label">{link.label}</span>
            </Nav.Link>
          ))}


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
