import { jwtDecode } from "jwt-decode";

const apiUrl = process.env.REACT_APP_API_URL;


export const registerUser = async (userData) => {
  try {
    const response = await fetch(`${apiUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(responseData.detail || 'Error en el registro');
    }
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
      if (rawMsg.toLowerCase().includes("email")) {
        message = "Correo electrónico no válido.";
      } else {
        message = rawMsg;
      }
    } else if (typeof errorData.detail === "string") {
      message = errorData.detail;
    }


    throw new Error(message);
  }


  return await response.json();
};

export const verifyResetCode = async (code) => {
  try {
    const response = await fetch(`${apiUrl}/auth/reset_password/verify?code=${code}`, {
      method: "POST"
    });

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
        errorMessage =
          Array.isArray(errorData.detail) && errorData.detail.length > 0
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
// Obtener el token almacenado
export const getToken = () => sessionStorage.getItem("accessToken");

// Decodificar el token usando jwt-decode
export const decodeToken = (token) => {
  try {
    let decode = jwtDecode(token);
    console.log(decode);
    return decode;
  } catch (error) {
    console.error("Error al decodificar el token:", error);
    return null;
  }
};

// Obtener el rol del usuario del token
export const getUserRole = () => {
  const token = getToken();
  const decoded = decodeToken(token);
  console.log("Token decodificado:", decoded);
  return decoded?.role.toLowerCase() || null; 
};

// Verificar si el usuario está autenticado y el token no ha expirado
export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;

  const decoded = decodeToken(token);
  const now = Math.floor(Date.now() / 1000); 
  return decoded?.exp > now; 
};

//Cerrar sesion
export const logout = () => {
  sessionStorage.removeItem("accessToken");
};
export const getUserData = () => {
  const token = getToken();
  if (!token) return null;
  return decodeToken(token);
};

// En authService.js - agregar esta función
export const checkUserMembership = async () => {
  try {
    const token = getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${apiUrl}/memberships/my-membership`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    // Si no tiene membresía (404), retornar null
    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    const membershipData = await response.json();
    return membershipData;
    
  } catch (error) {
    console.error('Error checking membership:', error);
    
    // Si es error 404 (no tiene membresía), retornar null
    if (error.message.includes('404')) {
      return null;
    }
    
    throw error;
  }
};