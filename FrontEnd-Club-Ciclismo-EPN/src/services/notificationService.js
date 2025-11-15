import { getToken } from "./authService";

const API_URL = process.env.REACT_APP_API_URL;

export const fetchNotifications = async () => {
  const response = await fetch(`${API_URL}/notifications`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener notificaciones");
  }

  return await response.json();
};

export const markNotificationAsRead = async (notificationId) => {
  const response = await fetch(`${API_URL}/notifications/mark_as_read/${notificationId}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Error al marcar la notificación como leída");
  }

  return await response.json();
};
