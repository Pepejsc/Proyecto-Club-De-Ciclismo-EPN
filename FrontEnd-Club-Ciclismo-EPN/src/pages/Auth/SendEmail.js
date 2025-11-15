import React, { useState } from 'react';
import { sendPasswordResetEmail } from '../../services/authService';
import { toast } from 'react-toastify';
import '../../assets/Styles/Auth/ResetPassword.css';
import { useNavigate } from 'react-router-dom';
import AuthLayout from "../../pages/Auth/AuthLayout";


const ResetPasswordRequest = () => {
  const [email, setEmail] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email) {
      toast.error('Por favor, ingresa tu correo electrónico.');
      return;
    }

    try {
      const response = await sendPasswordResetEmail(email);
      toast.success(response.message);
      localStorage.setItem('emailToRecover', email);
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


          <label>Correo electrónico:</label>
          <input
            type="email"
            placeholder="Ingresa tu correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
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
