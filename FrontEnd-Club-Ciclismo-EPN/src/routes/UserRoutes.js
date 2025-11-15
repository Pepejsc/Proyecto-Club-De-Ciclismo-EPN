import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Normal/Dashboard";
import Bienvenida from "../pages/Normal/Bienvenida";
import EditarPerfil from "../pages/Normal/EditarPerfil";
import EventosDisponibles from "../components/Normal/EventosDisponibles";
import NotificationsPage from "../pages/Normal/Notification";
import MiMembresia from "../pages/Normal/MiMembresia";
import CrearMembresia from "../pages/Normal/CrearMembresia";

const UserRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />}>
        <Route index element={<Bienvenida />} />
        <Route path="editar-perfil" element={<EditarPerfil />} />
        <Route path="eventos-disponibles" element={<EventosDisponibles/>} />
        <Route path="notificaciones" element={<NotificationsPage/>}/>
        <Route path="mi-membresia" element={<MiMembresia/>}/>
        <Route path="crear-membresia" element={<CrearMembresia/>} />
        </Route>
    </Routes>
  );
};

export default UserRoutes;
