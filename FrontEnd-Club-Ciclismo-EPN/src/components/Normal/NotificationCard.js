import React from "react";
import "../../assets/Styles/Normal/Notification.css";
import { FaClock, FaTimes } from "react-icons/fa";

const getBadgeStyle = (title) => {
  if (title.toLowerCase().includes("nuevo")) return "badge-new";
  if (title.toLowerCase().includes("actualizado")) return "badge-update";
  if (title.toLowerCase().includes("cancelado")) return "badge-cancel";
  if (title.toLowerCase().includes("recordatorio")) return "badge-recording";
  return "badge-default";
};

const formatDate = (dateStr) => {
  const date = new Date(dateStr);

  const day = date.toLocaleDateString("es-EC", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const suffix = date.getHours() >= 12 ? "PM" : "AM";

  return `${day}, ${hours}:${minutes} ${suffix}`;
};

const NotificationCard = ({ title, message, createdAt, onClick, onClose, isRead, className = "", dataId }) => {
  return (
    <div
      className={`notification-card ${isRead ? "read" : "unread"} ${className}`}
      data-id={dataId}
      onClick={onClick}
    >
      <button
        className="notification-close-btn"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <FaTimes size={12} />
      </button>

      <div className={`notification-badge ${getBadgeStyle(title)}`}>{title}</div>
      <div className="notification-message">{message}</div>
      <div className="notification-date">
        <FaClock size={15} style={{ marginRight: "4px" }} />
        {formatDate(createdAt)}
      </div>
    </div>
  );

};


export default NotificationCard;
