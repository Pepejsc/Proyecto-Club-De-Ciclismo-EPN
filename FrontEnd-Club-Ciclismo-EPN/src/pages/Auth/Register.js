import "react-phone-input-2/lib/style.css";
import "../../assets/Styles/Auth/Register.css";
import React, { useState } from "react";
import { registerUser } from "../../services/authService";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import AuthLayout from "../../pages/Auth/AuthLayout";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [bloodType, setBloodType] = useState("");
  const [skillLevel, setSkillLevel] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);

  // --- Estado para controlar si es EPN ---
  const [isEpnUser, setIsEpnUser] = useState(false);

  const navigate = useNavigate();

  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex =
      /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const phoneRegex = /^\d{7,10}$/;

    if (!firstName || !lastName || !city || !neighborhood) {
      toast.error("Todos los campos de texto son obligatorios.");
      return false;
    }

    if (!emailRegex.test(email)) {
      toast.error("El correo electrónico no es válido.");
      return false;
    }

    if (!passwordRegex.test(password)) {
      toast.error(
        "La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial."
      );
      return false;
    }

    if (!phoneRegex.test(phoneNumber)) {
      toast.error("Número de teléfono inválido.");
      return false;
    }

    if (!bloodType) {
      toast.error("Debe seleccionar un tipo de sangre.");
      return false;
    }

    if (!skillLevel) {
      toast.error("Debe seleccionar un nivel de habilidad.");
      return false;
    }

    return true;
  };

  // --- Manejador de cambio de email ---
  const handleEmailChange = (e) => {
    const val = e.target.value.toLowerCase(); // Normalizamos a minúsculas
    setEmail(val);
    setEmailError(false);

    // Verificamos si termina en el dominio EPN
    if (val.endsWith("@epn.edu.ec")) {
      if (!isEpnUser) {
        setIsEpnUser(true);
      }
    } else {
      setIsEpnUser(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const userData = {
      email,
      password,
      role: "Normal", // El backend decidirá si cambia esto internamente
      persona: {
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        city,
        neighborhood,
        blood_type: bloodType,
        skill_level: skillLevel,
        profile_picture: null,
      },
    };

    const resetForm = () => {
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setPhoneNumber("");
      setCity("");
      setNeighborhood("");
      setBloodType("");
      setSkillLevel("");
      setShowPassword(false);
      setEmailError(false);
      setPhoneError(false);
      setIsEpnUser(false);
    };

    try {
      const promise = registerUser(userData);

      await toast.promise(promise, {
        pending: "Registrando usuario...",
        success: isEpnUser
          ? "¡Registro exitoso! Procesando..."
          : "Usuario registrado correctamente.",
        error: "Error al registrar.",
      });

      console.log("Usuario registrado correctamente");

      // --- CORRECCIÓN IMPORTANTE: Redirección condicional ---
      if (isEpnUser) {
        // Si es estudiante, vamos a la pantalla de poner el código
        toast.info("Por favor ingresa el código enviado a tu correo.");
        navigate("/verify-student-email");
      } else {
        // Si es usuario normal, vamos al login
        navigate("/login");
      }
      
      resetForm();

    } catch (error) {
      console.error("Error al registrar el usuario:", error);

      const message =
        error?.response?.data?.detail ||
        error?.message ||
        "Ocurrió un error al registrar el usuario.";

      setEmailError(false);
      setPhoneError(false);

      if (message.toLowerCase().includes("correo")) {
        setEmailError(true);
        toast.error(message);
      } else if (
        message.toLowerCase().includes("teléfono") ||
        message.toLowerCase().includes("número")
      ) {
        setPhoneError(true);
        toast.error(message);
      } else {
        toast.error(message);
      }
    }
  };

  return (
    <AuthLayout>
      <div className="register-container">
        <form onSubmit={handleSubmit} className="form-box">
          <h2 className="form-title">Regístrate</h2>

          {/* --- Aviso visual si es EPN --- */}
          {isEpnUser && (
            <div
              className="epn-banner"
              style={{
                backgroundColor: "#e3f2fd",
                color: "#0d47a1",
                padding: "10px",
                borderRadius: "8px",
                marginBottom: "15px",
                border: "1px solid #90caf9",
                fontSize: "0.9rem",
                textAlign: "center",
              }}
            >
              <strong>🎓 Estudiante EPN Detectado</strong>
              <br />
              Se enviará un código de verificación a tu correo institucional.
            </div>
          )}

          <div className="form-grid">
            <div>
              <label>Nombre:</label>
              <input
                type="text"
                placeholder="Ingrese su nombre"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>

            <div>
              <label>Apellido:</label>
              <input
                type="text"
                placeholder="Ingrese su apellido"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>

            <div className="grid-full">
              <label>Correo:</label>
              <div style={{ position: "relative" }}>
                <input
                  type="email"
                  placeholder="Ingrese su correo electrónico"
                  value={email}
                  onChange={handleEmailChange}
                  className={emailError ? "input-error-border" : ""}
                  style={
                    isEpnUser
                      ? { borderColor: "#2196F3", backgroundColor: "#F5F9FF" }
                      : {}
                  }
                />
                {/* Icono de verificación dentro del input */}
                {isEpnUser && (
                  <span
                    style={{
                      position: "absolute",
                      right: "10px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      color: "#2196F3",
                    }}
                  >
                    <i
                      className="fas fa-check-circle"
                      title="Correo Institucional Válido"
                    ></i>
                  </span>
                )}
              </div>
              {isEpnUser && (
                <small style={{ color: "#2196F3", fontSize: "0.8rem" }}>
                  * Dominio institucional válido.
                </small>
              )}
            </div>

            <div className="grid-full">
              <label>Contraseña:</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Ingrese su contraseña"
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

            <div className="grid-full">
              <label>Número telefónico:</label>
              <input
                type="tel"
                placeholder="Ingrese su número"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  setPhoneError(false);
                }}
                className={phoneError ? "input-error-border" : ""}
              />
            </div>

            <div>
              <label>Tipo de sangre:</label>
              <select
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
              >
                <option value="" disabled>
                  Seleccionar
                </option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>

            <div>
              <label>Nivel:</label>
              <select
                value={skillLevel}
                onChange={(e) => setSkillLevel(e.target.value)}
              >
                <option value="" disabled>
                  Seleccionar
                </option>
                <option value="Bajo">Bajo</option>
                <option value="Medio">Medio</option>
                <option value="Alto">Alto</option>
              </select>
            </div>

            <div>
              <label>Ciudad:</label>
              <input
                type="text"
                placeholder="Ingrese su ciudad"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>

            <div>
              <label>Barrio:</label>
              <input
                type="text"
                placeholder="Ingrese su barrio"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
              />
            </div>
          </div>

          <div className="form-buttons">
            <button
              type="submit"
              className="btn-azul"
              style={
                isEpnUser
                  ? { backgroundColor: "#1565C0", fontWeight: "bold" }
                  : {}
              }
            >
              {isEpnUser ? "Registrarse como Estudiante" : "Registrarse"}
            </button>
            <button
              type="button"
              className="btn-rojo"
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

export default Register;