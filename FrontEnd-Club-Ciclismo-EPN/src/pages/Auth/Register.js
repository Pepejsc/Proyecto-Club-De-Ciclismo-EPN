import 'react-phone-input-2/lib/style.css';
import "../../assets/Styles/Auth/Register.css";
import React, { useState } from 'react';
import { registerUser } from '../../services/authService';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import AuthLayout from "../../pages/Auth/AuthLayout";




const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [city, setCity] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const navigate = useNavigate();


  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
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
      toast.error("La contraseña debe tener al menos 8 caracteres, una mayúscula, un número y un carácter especial.");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    const userData = {
      email,
      password,
      role: "Normal",
      persona: {
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber,
        city,
        neighborhood,
        blood_type: bloodType,
        skill_level: skillLevel,
        profile_picture: null
      }
    };
    const resetForm = () => {
      setEmail('');
      setPassword('');
      setFirstName('');
      setLastName('');
      setPhoneNumber('');
      setCity('');
      setNeighborhood('');
      setBloodType('');
      setSkillLevel('');
      setShowPassword(false);
      setEmailError(false);
      setPhoneError(false);
    };

    try {
      const response = await registerUser(userData);
      console.log('Usuario registrado correctamente:', response);

      toast.success('Usuario registrado correctamente');
      resetForm();
      navigate("/login");


    } catch (error) {
      console.error('Error al registrar el usuario:', error);

      // Intenta obtener el mensaje desde error.response, y si no, desde error.message
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        'Ocurrió un error al registrar el usuario.';

      // Limpia los errores visuales previos
      setEmailError(false);
      setPhoneError(false);

      // Valida si el error es de correo o teléfono
      if (message.toLowerCase().includes('correo')) {
        setEmailError(true);
        toast.error(message);
      } else if (message.toLowerCase().includes('teléfono') || message.toLowerCase().includes('número')) {
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
          <div className="form-grid">
            <div>
              <label>Nombre:</label>
              <input type="text" placeholder="Ingrese su nombre" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>

            <div>
              <label>Apellido:</label>
              <input type="text" placeholder="Ingrese su apellido" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>

            <div className="grid-full">
              <label>Correo:</label>
              <input
                type="email"
                placeholder="Ingrese su correo electrónico"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(false);
                }}
                className={emailError ? 'input-error-border' : ''}
              />
            </div>
            <div className="grid-full">
              <label>Contraseña:</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Ingrese su contraseña"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}

                  style={{ width: '100%', paddingRight: '70px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    right: '10px',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#007bff',
                    cursor: 'pointer',
                    fontSize: '14px'
                  }}
                >
                  {showPassword ? 'Ocultar' : 'Mostrar'}
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
                className={phoneError ? 'input-error-border' : ''}
              />
            </div>

            <div>
              <label>Tipo de sangre:</label>
              <select value={bloodType} onChange={(e) => setBloodType(e.target.value)}>
                <option value="" disabled>Seleccionar</option>
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
              <select value={skillLevel} onChange={(e) => setSkillLevel(e.target.value)} >
                <option value="" disabled >Seleccionar</option>
                <option value="Bajo">Bajo</option>
                <option value="Medio">Medio</option>
                <option value="Alto">Alto</option>
              </select>
            </div>

            <div>
              <label>Ciudad:</label>
              <input type="text" placeholder="Ingrese su ciudad" value={city} onChange={(e) => setCity(e.target.value)} />
            </div>

            <div>
              <label>Barrio:</label>
              <input type="text" placeholder="Ingrese su barrio" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
            </div>
          </div>

          <div className="form-buttons">
            <button type="submit" className="btn-azul">Registrarse</button>
            <button type="button" className="btn-rojo" onClick={() => navigate("/login")}>Cancelar</button>
          </div>
        </form>
      </div>
    </AuthLayout>

  );
};

export default Register;
