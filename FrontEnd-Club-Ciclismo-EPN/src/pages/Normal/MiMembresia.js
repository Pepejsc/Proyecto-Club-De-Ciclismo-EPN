import React, { useState, useEffect } from "react";
import {
  checkUserMembership,
  updateMembership,
  renewMembership,
  requestReactivation
} from "../../services/membershipService";
import { getFullImageUrl } from "../../services/authService";
import { useNavigate } from "react-router-dom";
import "../../assets/Styles/Normal/MiMembresia.css";
import { toast } from "react-toastify";
import RenewMembershipModal from "../Normal/RenovarMembresiaModal";
const MiMembresia = () => {
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [editFormData, setEditFormData] = useState({
    membership_type: "",
    participation_level: "",
    emergency_contact: "",
    emergency_phone: "",
    medical_conditions: "",
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await checkUserMembership();
      setMembership(data);
      if (data) {
        setEditFormData({
          membership_type: data.membership_type,
          participation_level: data.participation_level,
          emergency_contact: data.emergency_contact || "",
          emergency_phone: data.emergency_phone || "",
          medical_conditions: data.medical_conditions || "",
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async () => {
    try {
      const toastId = toast.loading("Actualizando datos...");
      await updateMembership(membership.user_id, editFormData);
      
      setShowEditModal(false);
      setLoading(true);
      await loadData();
      
      toast.update(toastId, {
        render: "✅ Datos actualizados correctamente",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("❌ Error:", error);
      toast.error(`❌ Error al actualizar: ${error.message}`, {
        autoClose: 4000,
      });
    }
  };

  // Manejar renovación simple - SIN parámetros de plan
  const handleSimpleRenew = async () => {
    try {
      const toastId = toast.loading("Renovando membresía...");
      await renewMembership(membership.user_id);
      
      setShowRenewModal(false);
      setLoading(true);
      await loadData();
      
      toast.update(toastId, {
        render: "✅ Membresía renovada exitosamente",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("❌ Error en renovación:", error);
      toast.error(`❌ Error al renovar: ${error.message}`, {
        autoClose: 4000,
      });
    }
  };

  // Manejar solicitud de reactivación
  const handleRequestReactivation = async () => {
    try {
      const toastId = toast.loading("Enviando solicitud...");
      await requestReactivation(membership.user_id);
      
      toast.update(toastId, {
        render: "✅ Solicitud enviada al administrador",
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("❌ Error:", error);
      toast.error(`❌ Error al enviar solicitud: ${error.message}`, {
        autoClose: 4000,
      });
    }
  };

  // Lógica de colores
  const getStatusClass = (status) => {
    switch (status) {
      case "ACTIVE": return "card-active";
      case "PENDING": return "card-pending";
      case "EXPIRED": return "card-expired";
      case "CANCELLED": return "card-cancelled";
      default: return "card-pending";
    }
  };

  const statusClass = getStatusClass(membership?.status);

  const formatDate = (dateString) => {
    if (!dateString) return "---";
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Calcular días restantes
  const getDaysRemaining = () => {
    if (!membership?.end_date) return 0;
    const end = new Date(membership.end_date);
    const today = new Date();
    const diffTime = end - today;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) return <div className="loading-spinner">Cargando...</div>;

  if (!membership) {
    return (
      <div className="no-membership-container">
        <div className="no-membership-card">
          <div className="icon-wrapper" style={{ marginBottom: "15px", color: "#238CBC" }}>
            <i className="fas fa-bicycle fa-4x"></i>
          </div>
          <h2>¡Únete al Club!</h2>
          <p>Adquiere tu membresía para acceder a todos los beneficios.</p>
          <button
            onClick={() => navigate("/user/crear-membresia")}
            className="btn-crear-nuevo"
          >
            Adquirir Membresía
          </button>
        </div>
      </div>
    );
  }

  const daysRemaining = getDaysRemaining();

  return (
    <div className="membership-container">
      <h2>Mi Carnet Digital</h2>

      <div className={`digital-id-card ${statusClass}`}>
        <div className="status-stripe"></div>

        {/* Sección Foto */}
        <div className="card-photo-section">
          <div className="club-logo-small">CLUB CICLISMO EPN</div>
          <div className="photo-frame">
            {membership.profile_picture_url ? (
              <img
                src={`${getFullImageUrl(membership.profile_picture_url)}?t=${Date.now()}`}
                alt="Foto"
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa" }}>
                <i className="fas fa-user fa-3x"></i>
              </div>
            )}
          </div>
          <div style={{ fontWeight: "700", color: "#555", marginTop: "10px", textTransform: "uppercase" }}>
            NIVEL: {membership.participation_level}
          </div>
        </div>

        <div className="card-data-section">
          <div className="card-header">
            <h1 className="member-name">{membership.member_name}</h1>
            {(membership.status === "ACTIVE" || membership.status === "PENDING") && (
              <button
                onClick={() => setShowEditModal(true)}
                className="btn-edit-card"
                title="Editar datos de membresía"
              >
                <i className="fas fa-edit"></i>
                <span>Editar</span>
              </button>
            )}
          </div>

          <span className="membership-type-badge">
            {membership.membership_type?.replace("_", " ")}
          </span>

          <div className="main-details-grid">
            <div className="detail-box">
              <h4>Miembro Desde</h4>
              <p>{formatDate(membership.start_date)}</p>
            </div>
            <div className="detail-box">
              <h4>Válido Hasta</h4>
              <p>{formatDate(membership.end_date)}</p>
              {membership.status === "ACTIVE" && daysRemaining > 0 && (
                <small style={{color: daysRemaining <= 30 ? '#EF4444' : '#10B981'}}>
                  ({daysRemaining} días restantes)
                </small>
              )}
            </div>
          </div>

          <div className="card-footer">
            <div className="emergency-mini">
              Contacto de emergencia: <strong>{membership.emergency_contact}</strong> <br />
              ({membership.emergency_phone})
            </div>

            <div className="card-actions">
              {/* ESTADO: ACTIVA */}
              {membership.status === "ACTIVE" && (
                <span className="status-text">
                  <i className="fas fa-check-circle"></i> MEMBRESÍA ACTIVA
                </span>
              )}

              {/* ESTADO: PENDIENTE - NUEVO BOTÓN */}
              {membership.status === "PENDING" && (
                <button
                  onClick={handleRequestReactivation}
                  className="btn-request-reactivation"
                >
                  <i className="fas fa-envelope"></i> Solicitar Reactivación
                </button>
              )}

              {/* ESTADO: VENCIDA */}
              {membership.status === "EXPIRED" && (
                <button
                  onClick={() => setShowRenewModal(true)}
                  className="btn-renew"
                >
                  <i className="fas fa-sync-alt"></i> Renovar
                </button>
              )}

              {/* ESTADO: CANCELADA */}
              {membership.status === "CANCELLED" && (
                <span className="status-text">
                  <i className="fas fa-ban"></i> MEMBRESÍA INACTIVA
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Editar (mantener igual) */}
      {showEditModal && (
        <div className="modal-overlay membresia-modal-overlay">
          <div className="membresia-modal-container">
            <h2 className="membresia-modal-title">Actualizar Datos de Membresía</h2>
            <div className="membresia-form-grid">
              <div>
                <label className="membresia-label">Tipo de Membresía</label>
                <select className="membresia-select" name="membership_type" value={editFormData.membership_type} onChange={handleEditChange} disabled>
                  <option value="CICLISTA">Ciclista</option>
                  <option value="ENTRENADOR">Entrenador</option>
                  <option value="EQUIPO_EPN">Equipo EPN</option>
                </select>
              </div>
              <div>
                <label className="membresia-label">Nivel de Experiencia</label>
                <select className="membresia-select" name="participation_level" value={editFormData.participation_level} onChange={handleEditChange}>
                  <option value="BEGINNER">Principiante</option>
                  <option value="INTERMEDIATE">Intermedio</option>
                  <option value="ADVANCED">Avanzado</option>
                  <option value="COMPETITIVE">Competitivo</option>
                </select>
              </div>
              <div className="membresia-grid-full">
                <h4 className="membresia-section-title">Datos de Emergencia</h4>
              </div>
              <div>
                <label className="membresia-label">Contacto de Emergencia</label>
                <input className="membresia-input" name="emergency_contact" value={editFormData.emergency_contact} onChange={handleEditChange} />
              </div>
              <div>
                <label className="membresia-label">Teléfono de Emergencia</label>
                <input className="membresia-input" name="emergency_phone" value={editFormData.emergency_phone} onChange={handleEditChange} />
              </div>
              <div className="membresia-grid-full">
                <label className="membresia-label">Condiciones Médicas</label>
                <textarea className="membresia-textarea" name="medical_conditions" value={editFormData.medical_conditions} onChange={handleEditChange} rows="3" />
              </div>
            </div>
            <div className="membresia-form-buttons">
              <button className="membresia-btn-update" onClick={handleEditSubmit}>Actualizar</button>
              <button className="membresia-btn-cancel" onClick={() => setShowEditModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Renovación - AHORA USA RenewMembershipModal */}
      {showRenewModal && (
        <div className="modal-overlay membresia-modal-overlay">
          <div className="membresia-modal-container">
            <RenewMembershipModal 
              membership={membership}
              onClose={() => setShowRenewModal(false)}
              onRenew={handleSimpleRenew} // Sin parámetros de plan
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default MiMembresia;