import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import {
  isAuthenticated,
  getToken,
  decodeToken,
  logout,
  getUserRole,
} from "../services/authService";
import { toast } from "react-toastify";

let toastShown = false;

const PrivateRoute = ({ children, allowedRoles }) => {
  const location = useLocation();
  const token = getToken();

  // Si hay token, verificamos su validez y expiración
  if (token) {
    const decoded = decodeToken(token);
    const now = Math.floor(Date.now() / 1000);

    if (!decoded || decoded.exp < now) {
      logout();
      if (!toastShown) {
        toast.dismiss();
        toast.info("Tu sesión ha expirado.");
        toastShown = true;
      }
      return <Navigate to="/login" state={{ from: location }} replace />;
    }
  }

  // Verificar si está autenticado
  if (!isAuthenticated()) {
    logout();
    if (!toastShown) {
      toast.dismiss();
      toast.error("Debes iniciar sesión.");
      toastShown = true;
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Verificar rol
  const userRole = getUserRole();
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    if (!toastShown) {
      toast.dismiss();
      toast.error("No tienes permisos para acceder a esta sección.");
      toastShown = true;
    }
    return <Navigate to="/unauthorized" replace />;
  }

  toastShown = false;
  return children;
};

export default PrivateRoute;
