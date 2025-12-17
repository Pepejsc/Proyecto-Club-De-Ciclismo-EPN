import React, { useEffect, useState } from "react";

import {
  fetchNotifications,
  markNotificationAsRead,
} from "../../services/notificationService";

import NotificationCard from "../../components/Normal/NotificationCard";

import { loadUnreadCount } from "../../components/Normal/Sidebar";

import { useRef } from "react";

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);

  const [_, setUnreadCount] = useState(0);

  const alreadyMarked = useRef(new Set());

  const [dismissedIds, setDismissedIds] = useState(() => {
    const stored = localStorage.getItem("dismissedNotifications");

    return stored ? JSON.parse(stored) : [];
  });

  const handleDismiss = (id) => {
    const updated = [...dismissedIds, id];

    setDismissedIds(updated);

    localStorage.setItem("dismissedNotifications", JSON.stringify(updated));

    // Opcional si estás sincronizando con otras pestañas

    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "noti_dismiss_sync",

        newValue: Date.now().toString(),
      })
    );
  };

  useEffect(() => {
    const interval = setInterval(() => {
      const stored = localStorage.getItem("dismissedNotifications");

      if (stored) {
        const parsed = JSON.parse(stored);

        setDismissedIds(parsed);

        loadNotifications();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await fetchNotifications();

      setNotifications(data);
    } catch (error) {
      console.error("Error al cargar notificaciones", error);
    }
  };

  const handleRead = async (id) => {
    try {
      await markNotificationAsRead(id);

      const timestamp = Date.now().toString();

      localStorage.setItem("actualizar_notificaciones", timestamp);

      window.dispatchEvent(
        new StorageEvent("storage", {
          key: "actualizar_notificaciones",

          newValue: timestamp,
        })
      );

      await loadUnreadCount(setUnreadCount);

      loadNotifications();
    } catch (error) {
      console.error("Error al marcar como leída", error);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    if (!notifications || notifications.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const id = entry.target.getAttribute("data-id");

          if (entry.isIntersecting && id && !alreadyMarked.current.has(id)) {
            alreadyMarked.current.add(id);

            markNotificationAsRead(parseInt(id)).then(() => {
              const timestamp = Date.now().toString();

              localStorage.setItem("actualizar_notificaciones", timestamp);

              window.dispatchEvent(
                new StorageEvent("storage", {
                  key: "actualizar_notificaciones",

                  newValue: timestamp,
                })
              );

              entry.target.classList.add("just-read");

              setTimeout(() => {
                entry.target.classList.remove("just-read");
              }, 1000);
            });
          }
        });
      },
      { threshold: 0.6 }
    );

    const elements = document.querySelectorAll(".noti-card");

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [notifications]);

  return (
    <div className="rutas-container">
      <h2>Notificaciones</h2>

      {notifications.filter((noti) => !dismissedIds.includes(noti.id))
        .length === 0 ? (
        <div className="sin-notificaciones-box">
          <div className="icono-notificacion-vacia">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="120"
              viewBox="0 0 24 24"
              width="120"
              fill="#B0B0B0"
            >
              <path d="M0 0h24v24H0z" fill="none" />

              <path d="M12 22c1.1 0 2-.89 2-2h-4a2 2 0 002 2zm6-6V9.5C18 6.47 16.1 4 12 4S6 6.47 6 9.5V16l-2 2v1h16v-1l-2-2z" />
            </svg>
          </div>

          <h3>No hay notificaciones nuevas</h3>

          <p>¡Listo! Ya no quedan mensajes por revisar.</p>
        </div>
      ) : (
        notifications

          .filter((noti) => !dismissedIds.includes(noti.id))

          .map((noti) => (
            <NotificationCard
              key={noti.id}
              dataId={noti.id}
              className="noti-card"
              title={noti.title}
              message={noti.message}
              createdAt={noti.created_at}
              isRead={noti.is_read}
              onClick={() => handleRead(noti.id)}
              onClose={() => handleDismiss(noti.id)}
            />
          ))
      )}
    </div>
  );
};

export default NotificationsPage;
