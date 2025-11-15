import React from "react";
import { Routes, Route } from "react-router-dom";
import Dashboard from "../pages/Admin/Dashboard";
import Bienvenida from "../pages/Admin/Bienvenida";
import ListaUsuarios from "../pages/Admin/ListaUsuarios";
import EditarPerfil from "../pages/Admin/EditarPerfil";
import CrearRuta from "../pages/Admin/CrearRuta";
import ListaRutas from "../pages/Admin/ListaRutas";
import CrearEvento from "../pages/Admin/CrearEvento";
import ListaEventos from "../pages/Admin/ListaEventos";
import ListaParticipantes from "../pages/Admin/ListaParticipantes";
import ListaMiembros from "../pages/Admin/ListaMiembros";
import ListaRecursos from "../pages/Admin/ListaRecursos";
import CrearRecurso from "../pages/Admin/CrearRecurso";
import ListaDocumentos from "../pages/Admin/ListaDocumentos";
import CrearDocumento from "../pages/Admin/CrearDocumento";



const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />}>
        <Route index element={<Bienvenida />} />
        <Route path="lista-usuarios" element={<ListaUsuarios />} />
        <Route path="editar-perfil" element={<EditarPerfil />} />
        <Route path="crear-ruta" element={<CrearRuta />} />
        <Route path="lista-rutas" element={<ListaRutas />} />
        <Route path="crear-evento" element={<CrearEvento />} />
        <Route path="lista-eventos" element={<ListaEventos />} />
        <Route path="lista-participantes" element={<ListaParticipantes />} />
        <Route path="lista-miembros" element={<ListaMiembros />} />
        <Route path="lista-recursos" element={<ListaRecursos />} />
        <Route path="crear-recurso" element={<CrearRecurso />} />
        <Route path="lista-documentos" element={<ListaDocumentos />} />
        <Route path="crear-documento" element={<CrearDocumento />} />
      </Route>
    </Routes>
  );
};

export default AdminRoutes;
