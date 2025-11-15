export const rolePermissions = {
    admin: [
      {
        path: "editar-perfil",
        label: "Editar Perfil",
        category: "personal",
      },
      {
        path: "lista-usuarios",
        label: "Lista de Usuarios",
        category: "users",
      },
      {
        path: "lista-rutas",
        label: "Lista de Rutas",
        category: "rutas",
      },
      {
        path: "crear-ruta",
        label: "Crear Ruta",
        category: "rutas",
      },
      {
        path: "lista-eventos",
        label: "Lista de Eventos",
        category: "eventos",
      },
      {
        path: "lista-participantes",
        label: "Lista de Participantes",
        category: "eventos",
      },
      {
        path: "crear-evento",
        label: "Crear Evento",
        category: "eventos",
      },
      {
        path: "lista-miembros",
        label: "Lista de Miembros",
        category: "administrativo",
      },
      {
        path: "editar-membresia",
        label: "Editar Membresía",
        category: "administrativo",
      },
      {
        path: "lista-recursos",
        label: "Lista de Recursos",
        category: "administrativo",
      },
      {
        path: "lista-documentos",
        label: "Lista de Documentos",
        category: "administrativo",
      },
      {
        path: "lista-registros",
        label: "Lista de Registros",
        category: "financiero",
      },
      {
        path: "crear-registro",
        label: "Crear Registro",
        category: "financiero",
      },
      {
        path: "editar-registro",
        label: "Editar Registro",
        category: "financiero",
      },
      {
        path: "panel-financiero",
        label: "Panel Financiero",
        category: "financiero",
      },
    ],

    normal: [

      {
        path: "editar-perfil",
        label: "Editar Perfil",
        category: "personal",
      },
      {
        path: "eventos-disponibles",
        label: "Eventos Disponibles",
        category: "eventos",
      },
      {
        path: "notificaciones",
        label: "Notificaciones",
        category: "notificaciones",
      },
      // NUEVOS ENLACES PARA MEMBRESÍA - USUARIO NORMAL
      {
        path: "mi-membresia",
        label: "Mi Membresía",
        category: "membresia",
      },
      {
        path: "renovar-membresia",
        label: "Renovar Membresía",
        category: "membresia",
      },
      {
        path: "historial-pagos",
        label: "Historial de Pagos",
        category: "membresia",
      },
    ],
  };