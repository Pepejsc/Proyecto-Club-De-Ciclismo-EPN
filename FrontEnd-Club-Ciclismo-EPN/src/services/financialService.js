import { getToken } from "./authService";

const API_URL = process.env.REACT_APP_API_URL;

// --- 1. OBTENER REGISTROS UNIFICADOS ---
export const fetchFinancialRecords = async (filtro) => {
  try {
    const token = getToken(); // <--- Usamos la función correcta
    const response = await fetch(`${API_URL}/finanzas/registros-unificados?filtro=${filtro}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) throw new Error("401"); // Sesión expirada
      const errorData = await response.json();
      throw new Error(errorData.detail || "Error al obtener registros");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en fetchFinancialRecords:", error);
    throw error;
  }
};

// --- 2. CREAR MOVIMIENTO MANUAL ---
export const createFinancialTransaction = async (transactionData) => {
  try {
    const response = await fetch(`${API_URL}/finanzas/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(transactionData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Error al registrar movimiento");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en createFinancialTransaction:", error);
    throw error;
  }
};

// --- 3. CONFIRMAR VENTA ---
export const confirmSale = async (saleId) => {
  const response = await fetch(`${API_URL}/ventas/${saleId}/confirmar`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al confirmar venta");
  }
  return await response.json();
};

// --- 4. CANCELAR VENTA ---
export const cancelSale = async (saleId) => {
  const response = await fetch(`${API_URL}/ventas/${saleId}/cancelar`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || "Error al cancelar venta");
  }
  return await response.json();
};