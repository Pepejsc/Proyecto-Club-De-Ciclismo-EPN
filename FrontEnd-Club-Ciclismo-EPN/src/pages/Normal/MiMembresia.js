import React, { useState, useEffect } from "react";
import { checkUserMembership } from "../../services/authService";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "../../assets/Styles/Normal/MiMembresia.css";

const MiMembresia = () => {
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadMembership = async () => {
      try {
        const membershipData = await checkUserMembership();
        setMembership(membershipData);
        
        // Si no tiene membresía, mostrar notificación
        if (!membershipData) {
          showNoMembershipNotification();
        }
      } catch (error) {
        console.error("Error cargando membresía:", error);
        toast.error("Error al cargar información de membresía");
      } finally {
        setLoading(false);
      }
    };

    loadMembership();
  }, []);

  const showNoMembershipNotification = () => {
    toast.info(
      <div className="membership-notification">
        <h4>¡Aún no tienes una membresía activa!</h4>
        <p>Para acceder a todos los beneficios del club, adquiere tu membresía ahora.</p>
        <div className="notification-buttons">
          <button 
            onClick={() => navigate('/user/crear-membresia')}
            className="btn-create-membership"
          >
            Crear Membresía
          </button>
          <button 
            onClick={() => toast.dismiss()}
            className="btn-later"
          >
            Más tarde
          </button>
        </div>
      </div>,
      {
        autoClose: 1000,
        closeOnClick: false,
        draggable: false,
      }
    );
  };

  const handleCreateMembership = () => {
    navigate('/user/crear-membresia');
  };

  if (loading) {
    return <div className="loading">Cargando información de membresía...</div>;
  }

  // SI NO TIENE MEMBRESÍA
  if (!membership) {
    return (
      <div className="no-membership-container">
        <div className="no-membership-card">
          <div className="warning-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <h2>No tienes una membresía activa</h2>
          <p>
            Para disfrutar de todos los beneficios del Club de Ciclismo EPN, 
            necesitas adquirir una membresía. Podrás participar en eventos, 
            acceder a rutas exclusivas y mucho más.
          </p>
          
          <div className="membership-options">
            <button 
              onClick={handleCreateMembership}
              className="btn-primary"
            >
              <i className="fas fa-plus-circle"></i>
              Crear Mi Membresía
            </button>
            
            <button 
              onClick={() => navigate('/user/renovar-membresia')}
              className="btn-secondary"
            >
              <i className="fas fa-sync-alt"></i>
              Renovar Membresía
            </button>
          </div>

          <div className="benefits-list">
            <h4>Beneficios de tener membresía:</h4>
            <ul>
              <li>✅ Participación en eventos exclusivos</li>
              <li>✅ Acceso a rutas premium</li>
              <li>✅ Descuentos en productos</li>
              <li>✅ Seguro de accidentes</li>
              <li>✅ Entrenamientos guiados</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // SI TIENE MEMBRESÍA (mostrar información normal)
  return (
    <div className="membership-container">
      <h2>Mi Membresía</h2>
      <div className="membership-info">
        <div className="info-card">
          <h3>Información de la Membresía</h3>
          <p><strong>Tipo:</strong> {membership.membership_type}</p>
          <p><strong>Estado:</strong> <span className={`status ${membership.status.toLowerCase()}`}>{membership.status}</span></p>
          <p><strong>Fecha de inicio:</strong> {new Date(membership.start_date).toLocaleDateString()}</p>
          <p><strong>Fecha de vencimiento:</strong> {new Date(membership.end_date).toLocaleDateString()}</p>
        </div>
        {/* Resto de tu componente para membresía existente */}
      </div>
    </div>
  );
};

export default MiMembresia;