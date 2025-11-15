import React, { useState } from "react";
import "../../assets/Styles/Auth/Login.css";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { login, decodeToken } from "../../services/authService";
import { useUser } from "../../context/Auth/UserContext";
import { fetchMyProfile } from "../../services/userService";
import AuthLayout from "../../pages/Auth/AuthLayout";



const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { setUserData } = useUser();


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email || !password) {
      toast.error("Todos los campos son obligatorios");
      return;
    }

    try {
      const result = await login(email, password);
      sessionStorage.setItem("accessToken", result.access_token);
      toast.success("Inicio de sesión exitoso");

      const decoded = decodeToken(result.access_token);
      const role = decoded?.role?.toLowerCase();

      const perfil = await fetchMyProfile();
      setUserData(perfil);

      if (role === "admin") {
        navigate("/admin");
      } else if (role === "normal") {
        navigate("/user");
      } else {
        toast.error("Tu cuenta no tiene un rol válido.");
        navigate("/unauthorized");
      }

    } catch (error) {
      toast.error(error.message || "Error al iniciar sesión");
    }
  };


  return (
    <AuthLayout>
      <div className="login-container">
        <form onSubmit={handleSubmit} className="form-box">
          <h2 className="form-title">Iniciar Sesión</h2>

          <div className="grid-full">
            <label>Correo electrónico:</label>
            <input
              type="email"
              placeholder="Ingrese el correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="grid-full">
            <label>Contraseña:</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Ingrese la contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: "100%", paddingRight: "70px" }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  top: "50%",
                  right: "10px",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  color: "#007bff",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </button>
            </div>
          </div>

          <div
            className="grid-full"
            style={{ textAlign: "center", marginTop: "10px" }}
          >
            <a href="/send-email" style={{ color: "#007bff", fontSize: "14px" }}>
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <div className="form-buttons">
            <button type="submit" className="btn-iniciar">
              Ingresar
            </button>
            <button
              type="button"
              className="btn-azul"
              onClick={() => navigate("/register")}
            >
              Registrarse
            </button>

          </div>
        </form>
      </div>
    </AuthLayout>

  );
};

export default Login;
