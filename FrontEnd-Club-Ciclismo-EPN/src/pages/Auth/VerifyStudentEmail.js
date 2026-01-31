import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { verifyStudentEmail } from '../../services/authService';
import { toast } from 'react-toastify';
import AuthLayout from "../../pages/Auth/AuthLayout";
import "../../assets/Styles/Auth/VerifyStudentEmail.css";

const VerifyStudentEmail = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 🛡️ Handler seguro: solo permite números
  const handleCodeChange = (e) => {
    const val = e.target.value.replace(/\D/g, ""); // Elimina todo lo que no sea número
    if (val.length <= 6) { // 🛡️ Límite lógico de 6 dígitos (o lo que requiera tu backend)
        setCode(val);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!code || code.length < 6) {
      toast.error("Por favor ingresa un código válido.");
      return;
    }

    setLoading(true);

    try {
      await verifyStudentEmail(parseInt(code, 10)); // Base 10 explícita
      toast.success("✅ ¡Cuenta verificada! Iniciando sesión...");
      navigate("/login");
    } catch (error) {
      console.error(error);
      const message = error.response?.data?.detail || "Código incorrecto.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="verify-container">
        <div className="verify-box">
          <h2 className="verify-title">Verificación Estudiantil</h2>
          
          <div className="verify-icon-wrapper">
            <span className="verify-icon" role="img" aria-label="student cap">🎓</span>
          </div>

          <p className="verify-description">
            Hemos enviado un código a tu correo institucional <strong>@epn.edu.ec</strong>.
          </p>
          
          <form onSubmit={handleSubmit}>
            <input
                type="text" // Usamos text con inputMode numeric para mejor control que type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                className="verify-input"
                placeholder="123456"
                value={code}
                onChange={handleCodeChange} // 🛡️ Usamos el handler blindado
                autoFocus
                disabled={loading}
                maxLength={6} // 🛡️ Límite HTML
                autoComplete="one-time-code"
            />

            <button 
                type="submit" 
                className="verify-button"
                disabled={loading}
            >
                {loading ? 'Verificando...' : 'Verificar Cuenta'}
            </button>
          </form>
        </div>
      </div>
    </AuthLayout>
  );
};

export default VerifyStudentEmail;