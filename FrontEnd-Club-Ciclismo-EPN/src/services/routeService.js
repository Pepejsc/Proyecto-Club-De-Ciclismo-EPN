import { getToken } from "./authService";

const API_URL = process.env.REACT_APP_API_URL;

export const createRoute = async (routeData) => {
  try {
    const response = await fetch(`${API_URL}/route/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(routeData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Error al crear la ruta");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en createRoute:", error);
    throw error;
  }
};

export const getRoutes = async () => {
  const response = await fetch(`${API_URL}/route`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${getToken()}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al obtener las rutas");
  }

  return await response.json();
};

export const deleteRoute = async (routeId) => {
  try {
    const token = getToken();
    const response = await fetch(`${API_URL}/route/delete/${routeId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail );
    }

    return true; 
  } catch (error) {
    console.error("Error en deleteRoute:", error);
    throw error;
  }
};
