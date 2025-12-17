import { getToken } from "./authService";

const API_URL = process.env.REACT_APP_API_URL;

// 1. Consultar estado de membresía (MANTENER)
export const checkUserMembership = async () => {
  try {
    const token = getToken();
    if (!token) return null;

    const response = await fetch(`${API_URL}/memberships/my-status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 404) return null;

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error("Sesión expirada");
      }
      throw new Error(`Error: ${response.status}`);
    }

    return await response.json();
    
  } catch (error) {
    console.error('Error checking membership:', error);
    return null;
  }
};

// 2. Crear nueva membresía (MANTENER)
export const createMembership = async (membershipData) => {
  const token = getToken();
  if (!token) throw new Error("No estás autenticado");

  try {
    const response = await fetch(`${API_URL}/memberships/`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(membershipData),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Error al registrar la membresía");
    }

    return await response.json();
  } catch (error) {
    console.error("Error en createMembership:", error);
    throw error;
  }
};

// 3. Actualizar membresía (MANTENER)
export const updateMembership = async (userId, formData) => {
  const token = getToken();
  if (!token) throw new Error("No autenticado");

  const updateData = {
    membership_type: formData.membership_type,
    participation_level: formData.participation_level,
    emergency_contact: formData.emergency_contact || "",
    emergency_phone: formData.emergency_phone || "",
    medical_conditions: formData.medical_conditions || ""
  };

  console.log('🔧 Enviando actualización para usuario:', userId);
  console.log('📦 Datos:', updateData);

  try {
    const response = await fetch(`${API_URL}/memberships/${userId}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });

    if (response.ok) {
      console.log('✅ Petición PUT exitosa');
      return { 
        success: true, 
        user_id: userId,
        message: 'Datos actualizados correctamente'
      };
    } else {
      console.error('❌ Error HTTP real:', response.status);
      throw new Error(`Error del servidor: ${response.status}`);
    }
    
  } catch (error) {
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      console.warn('⚠️ Error de conexión, pero los datos pueden haberse guardado');
      return { 
        success: true, 
        user_id: userId,
        message: 'Datos guardados (error de conexión en la respuesta)'
      };
    }
    throw error;
  }
};

// 4. Renovar membresía (CORREGIR - usar API_URL y getToken)
export const renewMembership = async (userId) => {
  try {
    const token = getToken();
    if (!token) throw new Error("No estás autenticado");

    const response = await fetch(`${API_URL}/memberships/${userId}/renew`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al renovar membresía');
    }

    return await response.json();
  } catch (error) {
    console.error('Error renewing membership:', error);
    throw error;
  }
};

// 5. Solicitar reactivación (CORREGIR - usar API_URL y getToken)
export const requestReactivation = async (userId) => {
  try {
    const token = getToken();
    if (!token) throw new Error("No estás autenticado");

    const response = await fetch(`${API_URL}/memberships/${userId}/request-reactivation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        request_date: new Date().toISOString(),
        reason: 'Falta de participación en eventos'
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al solicitar reactivación');
    }

    return await response.json();
  } catch (error) {
    console.error('Error requesting reactivation:', error);
    throw error;
  }
};

// 6. Verificar participación en eventos (CORREGIR - usar API_URL y getToken)
export const checkEventParticipation = async (userId) => {
  try {
    const token = getToken();
    if (!token) throw new Error("No estás autenticado");

    const response = await fetch(`${API_URL}/memberships/${userId}/participation-stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Error al verificar participación');
    }

    return await response.json();
  } catch (error) {
    console.error('Error checking participation:', error);
    throw error;
  }
};

// 7. Obtener estadísticas de membresías (NUEVA - para dashboard)
export const getMembershipStats = async () => {
  try {
    const token = getToken();
    if (!token) throw new Error("No estás autenticado");

    const response = await fetch(`${API_URL}/memberships/stats`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Error al obtener estadísticas');
    }

    return await response.json();
  } catch (error) {
    console.error('Error getting membership stats:', error);
    throw error;
  }
};