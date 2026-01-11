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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!code) {
      toast.error("Por favor ingresa el código.");
      return;
    }

    setLoading(true);

    try {
      await verifyStudentEmail(parseInt(code));
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
                type="number"
                className="verify-input"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                autoFocus
                disabled={loading}
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