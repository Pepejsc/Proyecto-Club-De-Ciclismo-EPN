import { getToken } from "./authService";

const API_URL = process.env.REACT_APP_API_URL;

export const fetchUsers = async () => {
  const response = await fetch(`${API_URL}/auth/users`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al obtener usuarios");
  }

  return await response.json();
};

export const deleteUser = async (userId) => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/auth/delete/${userId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Error al eliminar usuario");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en deleteUser:", error);
    throw error;
  }
};
export const updateUserRole = async (userId, newRole) => {
  const token = getToken();

  const response = await fetch(`${API_URL}/auth/update/role/${userId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role: newRole }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al actualizar el rol");
  }

  return await response.json();
};

export const updatePersona = async (personaId, personaData) => {
  try {
    const response = await fetch(`${API_URL}/auth/update/basic_information/${personaId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(personaData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Error al actualizar la información");
    }

    return await response.json();
  } catch (err) {
    console.error("Error en updatePersona:", err);
    throw err;
  }
};
export const fetchMyProfile = async () => {
  const response = await fetch(`${API_URL}/auth/my_profile`, {
    headers: {
      Authorization: `Bearer ${getToken()}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Error al obtener perfil del usuario");
  }

  return await response.json();
};
