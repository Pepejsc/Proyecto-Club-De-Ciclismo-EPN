import React, { useEffect, useRef } from "react";
import "../../assets/Styles/Normal/ChecklistModal.css";

const ChecklistModal = ({ onConfirm }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onConfirm();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onConfirm]);

  return (
    <div className="modal-overlay">
      <div
        className="modal-content checklist-modal"
        ref={modalRef}
      >
        <h3 className="titulo-modal">⚠️ Recuerda llevar</h3>
        <ul className="checklist">
          <li>⛑️ Casco</li>
          <li>🧤 Guantes</li>
          <li>🥤 Agua o hidratante</li>
          <li>📇 Documento de identidad</li>
          <li>🧰 Kit de reparación básica</li>
          <li>🍌 Energía (snacks o frutas)</li>
        </ul>
        <div className="boton-centro">
          <button onClick={onConfirm} className="btn-confirm">
            ¡Entendido!
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChecklistModal;
