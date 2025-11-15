import { getToken } from "./authService";

const API_URL = process.env.REACT_APP_API_URL;

export const createEvent = async (eventData) => {
  try {
    const response = await fetch(`${API_URL}/event/create`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(eventData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Error al crear el evento");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en createEvent:", error);
    throw error;
  }
};

export const fetchEvents = async () => {
  try {
    const response = await fetch(`${API_URL}/event`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Error al obtener eventos");
    }

    const data = await response.json();
    console.log("Eventos cargados:", data); 
    return data;
  } catch (error) {
    console.error("Error en fetchEvents:", error);
    throw error;
  }
};

export const deleteEvent = async (eventId) => {
  const response = await fetch(`${API_URL}/event/delete/${eventId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });
  if (!response.ok) {
    throw new Error("Error al eliminar el evento");
  }
};

export const updateEvent = async (eventId, updatedData) => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/event/update/${eventId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Error al actualizar el evento");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en updateEvent:", error);
    throw error;
  }
};

export const fetchParticipantsByEvent = async (eventId) => {
  try {
    const response = await fetch(`${API_URL}/participants/event/${eventId}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${getToken()}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Error al obtener participantes");
    }

    const data = await response.json();
    console.log("Participantes cargados:", data);
    return data;
  } catch (error) {
    console.error("Error en fetchParticipantsByEvent:", error);
    throw error;
  }
};


export const registerToEvent = async (eventId) => {
  const response = await fetch(`${API_URL}/participants/register_event`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`
    },
    body: JSON.stringify({ event_id: eventId })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al inscribirse");
  }

  return await response.json();
};

export const unregisterFromEvent = async (eventId) => {
  const response = await fetch(`${API_URL}/participants/unregister_event/${eventId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${getToken()}`
    }
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al cancelar inscripción");
  }

  return await response.json();
};

export const fetchMyEvents = async () => {
  const response = await fetch(`${API_URL}/participants/my_events`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al obtener eventos inscritos");
  }

  return await response.json(); 
};


export const fetchNextEvent = async (includeImage = false) => {
  try {
    const response = await fetch(
      `${API_URL}/event/next?include_image=${includeImage}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Error al obtener el evento próximo");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en fetchNextEvent:", error);
    throw error;
  }
};

export const fetchPublicUpcomingEvents = async () => {
  const response = await fetch(`${API_URL}/event/public_upcoming`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al obtener eventos públicos");
  }

  return await response.json();
};
