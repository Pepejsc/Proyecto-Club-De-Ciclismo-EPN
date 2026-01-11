import { jwtDecode } from "jwt-decode";
import axios from "axios";

const apiUrl = process.env.REACT_APP_API_URL || "http://localhost:8000";

// --- FUNCIONES DE AUTENTICACIÓN ---

export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${apiUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });
    const responseData = await response.json();
    if (!response.ok) throw new Error(responseData.detail || 'Error en el registro');
    return responseData;
  } catch (error) {
    console.error('Error en el registro:', error.message);
    throw error;
  }
};

export const sendPasswordResetEmail = async (email) => {
  const body = new URLSearchParams();
  body.append("email", email);

  const response = await fetch(`${apiUrl}/auth/reset_password/send`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: body.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    let message = "Error al enviar el código.";
    if (Array.isArray(errorData.detail)) {
      const rawMsg = errorData.detail[0]?.msg || "";
      message = rawMsg.toLowerCase().includes("email") ? "Correo electrónico no válido." : rawMsg;
    } else if (typeof errorData.detail === "string") {
      message = errorData.detail;
    }
    throw new Error(message);
  }
  return await response.json();
};

export const verifyResetCode = async (code) => {
  try {
    const response = await fetch(`${apiUrl}/auth/reset_password/verify?code=${code}`, { method: "POST" });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Error al verificar el código.");
    }
    return await response.json();
  } catch (error) {
    console.error("Error en verifyResetCode:", error);
    throw error;
  }
};

export const resetPassword = async (code, newPassword) => {
  try {
    const response = await fetch(
      `${apiUrl}/auth/reset_password/reset?code=${code}&new_password=${newPassword}`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      }
    );
    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || "Error al restablecer la contraseña.");
    }
    return await response.json();
  } catch (error) {
    console.error("Error en resetPassword:", error);
    throw error;
  }
};

export const login = async (email, password) => {
  try {
    const body = new URLSearchParams();
    body.append("username", email); 
    body.append("password", password);

    const response = await fetch(`${apiUrl}/auth/token`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    const responseBody = await response.text();

    if (!response.ok) {
      let errorMessage = "Error al iniciar sesión";
      try {
        const errorData = JSON.parse(responseBody);
        errorMessage = Array.isArray(errorData.detail) && errorData.detail.length > 0
            ? errorData.detail.map((err) => err.msg).join(", ")
            : errorData.detail || errorMessage;
      } catch {
        errorMessage = responseBody;
      }
      throw new Error(errorMessage);
    }
    return JSON.parse(responseBody); 
  } catch (error) {
    console.error("Error en login:", error.message);
    throw error;
  }
};

// --- UTILIDADES DE TOKEN ---

export const getToken = () => sessionStorage.getItem("accessToken");

export const decodeToken = (token) => {
  try {
    return jwtDecode(token);
  } catch (error) {
    console.error("Error al decodificar el token:", error);
    return null;
  }
};

export const getUserRole = () => {
  const token = getToken();
  if (!token) return null;
  const decoded = decodeToken(token);
  return decoded?.role.toLowerCase() || null; 
};

export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  const decoded = decodeToken(token);
  const now = Math.floor(Date.now() / 1000); 
  return decoded?.exp > now; 
};

export const logout = () => {
  sessionStorage.removeItem("accessToken");
};

export const getUserData = () => {
  const token = getToken();
  if (!token) return null;
  return decodeToken(token);
};

// --- FUNCIONES QUE FALTABAN (Y CAUSABAN EL ERROR) ---

export const getMyProfile = async () => {
  const token = getToken();
  if (!token) return null;

  const response = await fetch(`${apiUrl}/auth/my_profile`, {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    // Si es 404 significa que el usuario no tiene perfil asociado aun, retornamos null
    if(response.status === 404) return null;
    throw new Error("Error cargando perfil");
  }
  return await response.json();
};

export const updateBasicInfo = async (personaId, data) => {
  const token = getToken();
  if (!token) throw new Error("No autenticado");

  const response = await fetch(`${apiUrl}/auth/update/basic_information/${personaId}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Error al actualizar información");
  }
  return await response.json();
};

export const getFullImageUrl = (path) => {
  if (!path) return null;
  if (path.startsWith("http") || path.startsWith("data:")) return path;
  
  // IMPORTANTE: Quitar '/api' si tu apiUrl lo tiene, para que quede solo el dominio base
  // Ejemplo: si apiUrl es 'http://localhost:8000/api', queremos 'http://localhost:8000'
  const baseUrl = apiUrl.replace('/api', ''); 
  
  // Asegurar que el path empiece con /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  
  return `${baseUrl}${cleanPath}`;
};

export const verifyStudentEmail = async (code) => {
  const response = await axios.post(`${apiUrl}/auth/verify-email?code=${code}`);
  return response.data;
};