import React, { useState } from "react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import "../../assets/Styles/Main/Contacto.css";
import PublicLayout from "../../components/Main/PublicLayout";

// Variantes de animación
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const Contacto = () => {
  const [formData, setFormData] = useState({
    empresa: "",
    contacto: "",
    cargo: "",
    email: "",
    telefono: "",
    propuesta: "",
    archivo: null,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (name === "archivo") {
      setFormData((prevState) => ({
        ...prevState,
        [name]: files[0],
      }));
    } else {
      setFormData((prevState) => ({
        ...prevState,
        [name]: value,
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Mostrar loading
    const loadingToast = toast.loading('Enviando tu propuesta...', {
      duration: Infinity,
    });

    try {
      const sponsorData = {
        company_name: formData.empresa,
        contact_name: formData.contacto,
        position: formData.cargo,
        contact_email: formData.email,
        contact_phone: formData.telefono,
        proposal_description: formData.propuesta
      };

      console.log("📤 Enviando datos:", sponsorData);

      const response = await fetch('http://localhost:8000/sponsors/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sponsorData)
      });

      const result = await response.json();
      console.log("📥 Respuesta:", result);

      // Cerrar loading y mostrar resultado
      toast.dismiss(loadingToast);

      if (result.success) {
        // ✅ Notificación de éxito
        toast.success(
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>
              🎉 ¡Propuesta Enviada!
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              Hemos recibido tu solicitud. Nos pondremos en contacto pronto.
            </div>
          </div>,
          {
            duration: 5000,
            style: {
              background: '#f0f9ff',
              border: '2px solid #39B9C2',
              padding: '16px',
              borderRadius: '12px',
            },
            iconTheme: {
              primary: '#39B9C2',
              secondary: '#fff',
            },
          }
        );

        // Limpiar formulario
        setFormData({
          empresa: "",
          contacto: "",
          cargo: "",
          email: "",
          telefono: "",
          propuesta: "",
          archivo: null,
        });

        // Limpiar input file
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = "";

      } else {
        // ❌ Notificación de error
        toast.error(
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>
              ⚠️ Error al Enviar
            </div>
            <div style={{ fontSize: '14px', color: '#666' }}>
              {result.message || 'Por favor, intenta nuevamente.'}
            </div>
          </div>,
          {
            duration: 4000,
            style: {
              background: '#fef2f2',
              border: '2px solid #ef4444',
              padding: '16px',
              borderRadius: '12px',
            },
          }
        );
      }

    } catch (error) {
      console.error("Error:", error);
      toast.dismiss(loadingToast);
      
      // ❌ Notificación de error de conexión
      toast.error(
        <div style={{ textAlign: 'left' }}>
          <div style={{ fontWeight: 'bold', fontSize: '16px', marginBottom: '5px' }}>
            🔌 Error de Conexión
          </div>
          <div style={{ fontSize: '14px', color: '#666' }}>
            No se pudo conectar con el servidor. Verifica tu conexión.
          </div>
        </div>,
        {
          duration: 4000,
          style: {
            background: '#fef2f2',
            border: '2px solid #ef4444',
            padding: '16px',
            borderRadius: '12px',
          },
        }
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      {/* 🔔 Componente de notificaciones */}
      <Toaster
        position="top-right"
        toastOptions={{
          // Estilos globales
          className: '',
          style: {
            fontFamily: 'Arial, sans-serif',
          },
        }}
      />
      
      <div className="quienes-container">
        {/* Sección Principal */}
        <motion.section
          className="contacto-exacto-section"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          <div className="contacto-header">
            <motion.h1 variants={fadeInUp}>
              CONVIÉRTETE EN NUESTRO AUSPICIANTE
            </motion.h1>
            <motion.p className="descripcion" variants={fadeInUp}>
              No buscamos solo fondos, buscamos socios estratégicos que crean en
              el poder del deporte para moldear el carácter. Tu apoyo nos
              permite alcanzar la meta, ya sea equipamiento de alto rendimiento
              o llevar nuestra bandera a campeonatos nacionales.
            </motion.p>
            <motion.h3 className="subtitle" variants={fadeInUp}>
              Completa el formulario y conversemos sobre la ruta ideal para tu
              patrocinio.
            </motion.h3>
          </div>

          <motion.form
            className="formulario-exacto"
            onSubmit={handleSubmit}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
          >
            {/* Nombre de la empresa / marca */}
            <div className="campo-grupo">
              <label className="campo-label">
                <strong>Nombre de la empresa / marca</strong>
              </label>
              <input
                type="text"
                name="empresa"
                className="campo-input"
                placeholder="Ingresa el nombre de la marca o empresa"
                value={formData.empresa}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Nombre del contacto */}
            <div className="campo-grupo">
              <label className="campo-label">
                <strong>Nombre del contacto</strong>
              </label>
              <input
                type="text"
                name="contacto"
                className="campo-input"
                placeholder="Ingresa el nombre del contacto"
                value={formData.contacto}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Cargo / Pardalán */}
            <div className="campo-grupo">
              <label className="campo-label">
                <strong>Cargo / Posición</strong>
              </label>
              <input
                type="text"
                name="cargo"
                className="campo-input"
                placeholder="Ingresa el cargo o pardalán"
                value={formData.cargo}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Correo electrónico */}
            <div className="campo-grupo">
              <label className="campo-label">
                <strong>Correo electrónico</strong>
              </label>
              <input
                type="email"
                name="email"
                className="campo-input"
                placeholder="Ingresa el correo electrónico"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Teléfono de contacto */}
            <div className="campo-grupo">
              <label className="campo-label">
                <strong>Teléfono de contacto</strong>
              </label>
              <input
                type="tel"
                name="telefono"
                className="campo-input"
                placeholder="Ingresa un teléfono de contacto"
                value={formData.telefono}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Descripción de la propuesta */}
            <div className="campo-grupo">
              <label className="campo-label">
                <strong>Descripción de la propuesta</strong>
              </label>
              <textarea
                name="propuesta"
                className="campo-input campo-textarea"
                placeholder="Ingresa la descripción de la propuesta"
                value={formData.propuesta}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Anexar documentación */}
            <div className="archivo-grupo">
              <label className="archivo-label">
                <strong>Anexar documentación (opcional)</strong>
              </label>
              <p className="archivo-descripcion">Email: archive</p>
              <div className="archivo-input">
                <input
                  type="file"
                  name="archivo"
                  onChange={handleChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Línea separadora */}
            <div className="separador"></div>

            {/* Botón enviar */}
            <motion.button
              type="submit"
              className="btn-enviar-exacto"
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              disabled={isSubmitting}
              style={{
                opacity: isSubmitting ? 0.7 : 1,
                cursor: isSubmitting ? 'not-allowed' : 'pointer'
              }}
            >
              {isSubmitting ? (
                <>
                  <span style={{ marginRight: '8px' }}>⏳</span>
                  Enviando...
                </>
              ) : (
                <>
                  <span style={{ marginRight: '8px' }}></span>
                  Enviar Formulario
                </>
              )}
            </motion.button>
          </motion.form>
        </motion.section>
      </div>
    </PublicLayout>
  );
};

export default Contacto;