import { createContext, useContext, useEffect, useState } from "react";
import { getToken } from "../../services/authService";
import { fetchMyProfile } from "../../services/userService"; 
const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const cargarUsuario = async () => {
      const token = getToken();
      if (token) {
        try {
          const perfil = await fetchMyProfile(); 
          setUserData(perfil);
        } catch (error) {
          console.error("Error al cargar el perfil del usuario:", error);
        }
      }
    };

    cargarUsuario();
  }, []);

  return (
    <UserContext.Provider value={{ userData, setUserData }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => useContext(UserContext);
