import React, { useState } from 'react';

const RenewMembershipModal = ({ membership, onClose, onRenew }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleRenew = async () => {
    setIsProcessing(true);
    try {
      // Ahora onRenew no recibe parámetros de plan
      await onRenew();
    } catch (error) {
      console.error('Error en renovación:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const calculateNewEndDate = () => {
    const newDate = new Date();
    newDate.setFullYear(newDate.getFullYear() + 1);
    return newDate.toLocaleDateString('es-ES');
  };

  return (
    <div className="renew-modal">
      <h2 className="renew-modal-title">Renovar Membresía</h2>
      
      {/* Información actual */}
      <div className="current-membership-info">
        <h4>Tu membresía actual:</h4>
        <p><strong>Estado:</strong> <span className="status-expired">Vencida</span></p>
        <p><strong>Vencimiento actual:</strong> {new Date(membership.end_date).toLocaleDateString('es-ES')}</p>
        <p><strong>Tipo:</strong> {membership.membership_type?.replace('_', ' ')}</p>
        <p><strong>Nivel:</strong> {membership.participation_level}</p>
      </div>

      {/* Información de renovación */}
      <div className="renewal-details">
        <h4>Detalles de Renovación</h4>
        <div className="renewal-info-card">
          <p><strong>Nuevo vencimiento:</strong> {calculateNewEndDate()}</p>
          <p><strong>Duración:</strong> 6 meses adicionales</p>
          <p><strong>Estado después:</strong> <span style={{color: '#10B981', fontWeight: 'bold'}}>ACTIVA</span></p>
        </div>
      </div>

      {/* Beneficios */}
      <div className="renewal-benefits">
        <h4>Beneficios al renovar:</h4>
        <div className="benefits-list">
          <div className="benefit-item">
            <i className="fas fa-check-circle" style={{color: '#10B981'}}></i>
            <span>Acceso a todos los eventos del club</span>
          </div>
          <div className="benefit-item">
            <i className="fas fa-check-circle" style={{color: '#10B981'}}></i>
            <span>Carnet digital actualizado</span>
          </div>
          <div className="benefit-item">
            <i className="fas fa-check-circle" style={{color: '#10B981'}}></i>
            <span>Participación en competencias</span>
          </div>
        </div>
      </div>

      {/* Nota importante */}
      <div className="renewal-notice">
        <p><strong>Importante:</strong> Esta renovación será registrada para estadísticas del club.</p>
        <p>Ayudas a mantener el control de membresías activas.</p>
      </div>

      {/* Botones de acción */}
      <div className="renew-modal-actions">
        <button 
          className="btn-renew-confirm"
          onClick={handleRenew}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <i className="fas fa-spinner fa-spin"></i> Procesando...
            </>
          ) : (
            <>
              <i className="fas fa-sync-alt"></i> Confirmar Renovación
            </>
          )}
        </button>
        <button 
          className="btn-renew-cancel"
          onClick={onClose}
          disabled={isProcessing}
        >
          <i className="fas fa-times"></i> Cancelar
        </button>
      </div>
    </div>
  );
};

export default RenewMembershipModal;