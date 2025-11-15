import React, { useRef, useState } from "react";
import { toast } from "react-toastify";
import "../../assets/Styles/Auth/VerifyCode.css";
import {
  verifyResetCode,
  sendPasswordResetEmail,
} from "../../services/authService";
import { useNavigate } from 'react-router-dom';
import AuthLayout from "../../pages/Auth/AuthLayout";




const VerifyCode = () => {
  const inputs = useRef([]);
  const [code, setCode] = useState(new Array(6).fill(""));
  const [email, setEmail] = useState(
    localStorage.getItem("emailToRecover") || ""
  );
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (value, index) => {
    if (!/\d/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    if (value && index < 5) inputs.current[index + 1].focus();
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      const newCode = [...code];
      if (newCode[index]) {
        newCode[index] = "";
        setCode(newCode);
      } else if (index > 0) {
        inputs.current[index - 1].focus();
      }
    }
  };

  const clearInputs = () => {
    setCode(new Array(6).fill(""));
    setTimeout(() => inputs.current[0]?.focus(), 100);
  };

  const handleSubmit = async (e) => {

    e.preventDefault();
    const finalCode = code.join("");
    if (finalCode.length !== 6) {
      toast.error("Ingresa los 6 dígitos del código.");
      return;
    }

    try {
      const response = await verifyResetCode(finalCode);
      toast.success(response.message);
      setSuccess(true);
      navigate(`/reset-password?code=${finalCode}`);
    } catch (error) {
      toast.error(error.message || "Código inválido");
      clearInputs();
      setSuccess(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      toast.error("No se encontró el correo en memoria.");
      return;
    }

    try {
      const response = await sendPasswordResetEmail(email);
      toast.success("Código reenviado correctamente.");
      clearInputs();
      setSuccess(false);
    } catch (error) {
      toast.error(error.message || "Error al reenviar el código.");
    }
  };

  return (
    <AuthLayout>
      <div className="verify-container">
        <form onSubmit={handleSubmit} className="form-box">
          <h2 className="form-title">Verificación de Código</h2>
          <p className="form-subtext">
            Ingresa el código de 6 dígitos enviado a tu correo.
          </p>

          <div className="otp-inputs">
            {code.map((digit, index) => (
              <input
                key={index}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                ref={(el) => (inputs.current[index] = el)}
                onChange={(e) => handleChange(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className={`otp-box ${success ? "success-border" : ""}`}
              />
            ))}
          </div>

          <div className="form-buttons-inline">
            <button type="submit" className="btn-send">
              Verificar
            </button>
            <button type="button" className="btn-cancel" onClick={handleResend}>
              Reenviar código
            </button>
          </div>
        </form>
      </div>
    </AuthLayout>

  );
};

export default VerifyCode;
