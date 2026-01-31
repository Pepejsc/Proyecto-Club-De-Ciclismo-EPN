import React, { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { resetPassword } from "../../services/authService";
import { toast } from "react-toastify";
import "../../assets/Styles/Auth/ResetPassword.css";
import AuthLayout from "../../pages/Auth/AuthLayout";

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    new_password: "",
    confirm_password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const code = searchParams.get("code");

  // Regex de complejidad (Mín 8 caracteres, Mayúscula, Número, Especial)
  const isValidPassword = (password) =>
    /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*.,+]).{8,}$/.test(password);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    // 🛡️ NO sanitizamos contraseñas (permitimos caracteres especiales),
    // pero controlamos la longitud en el estado.
    setFormData({
      ...formData,
      [name]: value, 
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const newPassword = formData.new_password;
    const confirmPassword = formData.confirm_password;

    if (!newPassword || !confirmPassword) {
      toast.error("Todos los campos son obligatorios.");
      return;
    }

    if (!isValidPassword(newPassword)) {
      toast.error(
        "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial."
      );
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }

    try {
      // Enviamos el código y la contraseña
      await resetPassword(code, newPassword);
      toast.success("Contraseña restablecida correctamente.");
      localStorage.removeItem("emailToRecover");
      navigate("/login");
    } catch (error) {
      const msg =
        error.message.includes("Token expirado") || error.message.includes("inválido")
          ? "El código ha expirado o es inválido. Solicita uno nuevo."
          : "Error al restablecer la contraseña.";
      toast.error(msg);
    }
  };

  return (
    <AuthLayout>
      <div className="reset-container">
        <form onSubmit={handleSubmit} className="form-box">
          <h2 className="form-title">Restablecer Contraseña</h2>
          <p className="form-subtext">Ingresa tu nueva contraseña segura.</p>

          <div style={{ position: "relative" }}>
            <label>Nueva Contraseña</label>
            <input
              type={showPassword ? "text" : "password"}
              name="new_password"
              value={formData.new_password}
              onChange={handleInputChange}
              required
              maxLength={128} // 🛡️ Límite de seguridad
              autoComplete="new-password"
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
                fontSize: "14px"
              }}
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>

          <div style={{ position: "relative", marginTop: "15px" }}>
            <label>Confirmar Contraseña</label>
            <input
              type={showPassword ? "text" : "password"}
              name="confirm_password"
              value={formData.confirm_password}
              onChange={handleInputChange}
              required
              maxLength={128} // 🛡️ Límite de seguridad
              autoComplete="new-password"
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
                fontSize: "14px"
              }}
            >
              {showPassword ? "Ocultar" : "Mostrar"}
            </button>
          </div>

          <div className="form-buttons-inline">
            <button type="submit" className="btn-send">Actualizar</button>
            <button
              type="button"
              className="btn-cancel"
              onClick={() => navigate("/login")}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>
  );
};

export default ResetPassword;