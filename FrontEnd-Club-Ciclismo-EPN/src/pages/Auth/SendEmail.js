import React, { useState } from 'react';
import { sendPasswordResetEmail } from '../../services/authService';
import { toast } from 'react-toastify';
import '../../assets/Styles/Auth/ResetPassword.css';
import { useNavigate } from 'react-router-dom';
import AuthLayout from "../../pages/Auth/AuthLayout";

const ResetPasswordRequest = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  // --- 🛡️ 1. SEGURIDAD: Función de Sanitización ---
  const sanitizeInput = (input) => {
    // Elimina caracteres peligrosos para evitar inyecciones XSS
    return input.replace(/[<>&"'/`]/g, "");
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    // Sanitizamos en tiempo real
    setEmail(sanitizeInput(value));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanEmail = email.trim();

    // --- 🛡️ 2. SEGURIDAD: Validaciones ---
    if (!cleanEmail) {
      toast.error('Por favor, ingresa tu correo electrónico.');
      return;
    }

    // Validación de formato de email (Regex seguro)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
        toast.error("Por favor ingrese un correo electrónico válido");
        return;
    }

    try {
      const response = await sendPasswordResetEmail(cleanEmail);
      toast.success(response.message);
      localStorage.setItem('emailToRecover', cleanEmail);
      navigate('/verify-code');
    } catch (error) {
      toast.error(error.message || 'Error al enviar el código de recuperación.');
    }
  };

  return (
    <AuthLayout>
      <div className="reset-container">
        <form onSubmit={handleSubmit} className="form-box">
          <h2 className="form-title">Recuperar contraseña</h2>
          <p className="form-subtext">
            Ingresa el correo que fue registrado en el sistema.
          </p>

          <label htmlFor="email">Correo electrónico:</label>
          <input
            id="email"
            type="email"
            placeholder="Ingresa tu correo electrónico"
            value={email}
            onChange={handleEmailChange} // Usamos el handler seguro
            required
            maxLength={100} // Límite de seguridad
            autoComplete="email"
          />

          <div className="form-buttons-inline">
            <button type="submit" className="btn-send">Enviar código</button>
            <button type="button" className="btn-cancel" onClick={() => navigate('/login')}>Cancelar</button>
          </div>

        </form>
      </div>
    </AuthLayout>
  );
};

export default ResetPasswordRequest;