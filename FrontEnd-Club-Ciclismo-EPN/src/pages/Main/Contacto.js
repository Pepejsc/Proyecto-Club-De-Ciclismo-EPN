import React, { useState } from "react";
import { motion } from "framer-motion";
import toast, { Toaster } from "react-hot-toast";
import "../../assets/Styles/Main/Contacto.css";
import PublicLayout from "../../components/Main/PublicLayout";

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

  // --- LÓGICA DE SEGURIDAD (Sanitización) ---
  const sanitizeInput = (value) => {
    // Elimina caracteres peligrosos para evitar inyecciones
    return value.replace(/[<>{}[\]()\\/'"`]/g, "");
  };

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    // Manejo de archivo
    if (name === "archivo") {
      setFormData((prev) => ({ ...prev, [name]: files[0] }));
      return;
    }

    let safeValue = value;

    // Validaciones en tiempo real
    if (name === "telefono") {
      // Solo permite números
      safeValue = value.replace(/[^0-9]/g, "");
      if (safeValue.length > 10) return;
    } else if (name === "email") {
      // Limpia caracteres inválidos para email (pero permite @ . _ -)
      safeValue = value.replace(/[<>()'"\s]/g, "");
    } else {
      // Texto normal: sanitización general
      safeValue = sanitizeInput(value);
    }

    setFormData((prev) => ({ ...prev, [name]: safeValue }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Validaciones (Usando Toast para no romper el diseño)
    if (!formData.empresa.trim() || !formData.contacto.trim() || !formData.email.trim()) {
      toast.error("Por favor completa los campos obligatorios.");
      return;
    }
    
    if (formData.telefono.length !== 10) {
      toast.error("El teléfono debe tener 10 dígitos válidos.");
      return;
    }

    if (!formData.propuesta.trim()) {
      toast.error("Debes incluir una descripción de la propuesta.");
      return;
    }

    setIsSubmitting(true);
    const loadingToast = toast.loading('Enviando propuesta...', { duration: Infinity });

    try {
      // 2. Crear FormData (Necesario para enviar archivos)
      const formDataToSend = new FormData();
      formDataToSend.append('company_name', formData.empresa);
      formDataToSend.append('contact_name', formData.contacto);
      formDataToSend.append('position', formData.cargo);
      formDataToSend.append('contact_email', formData.email);
      formDataToSend.append('contact_phone', formData.telefono);
      formDataToSend.append('proposal_description', formData.propuesta);
      
      if (formData.archivo) {
        formDataToSend.append('file', formData.archivo);
      }

      // 3. Enviar al Backend
      // Nota: Fetch configura automáticamente el Content-Type correcto para FormData
      const response = await fetch('http://localhost:8000/sponsors/apply', {
        method: 'POST',
        body: formDataToSend 
      });

      const result = await response.json();
      toast.dismiss(loadingToast);

      if (response.ok && result.success) {
        toast.success("¡Propuesta enviada con éxito!");
        
        // Limpiar formulario
        setFormData({
          empresa: "", contacto: "", cargo: "", email: "",
          telefono: "", propuesta: "", archivo: null,
        });
        
        // Limpiar input file visualmente
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) fileInput.value = "";
      } else {
        toast.error(result.message || 'Error al procesar la solicitud.');
      }

    } catch (error) {
      console.error("Error:", error);
      toast.dismiss(loadingToast);
      toast.error("Error de conexión con el servidor.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PublicLayout>
      <Toaster position="top-right" toastOptions={{ style: { fontFamily: 'Montserrat, sans-serif' } }} />
      
      <div className="quienes-container">
        <motion.section
          className="contacto-exacto-section"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
        >
          <div className="contacto-header">
            <motion.h1 variants={fadeInUp}>CONVIÉRTETE EN NUESTRO AUSPICIANTE</motion.h1>
            <motion.p className="descripcion" variants={fadeInUp}>
              No buscamos solo fondos, buscamos socios estratégicos que crean en
              el poder del deporte para moldear el carácter. Tu apoyo nos
              permite alcanzar la meta, ya sea equipamiento de alto rendimiento
              o llevar nuestra bandera a campeonatos nacionales.
            </motion.p>
            <motion.h3 className="subtitle" variants={fadeInUp}>
              Completa el formulario y conversemos sobre la ruta ideal para tu patrocinio.
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
            {/* Empresa */}
            <div className="campo-grupo">
              <label className="campo-label"><strong>Nombre de la empresa / marca</strong></label>
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

            {/* Contacto */}
            <div className="campo-grupo">
              <label className="campo-label"><strong>Nombre del contacto</strong></label>
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

            {/* Cargo */}
            <div className="campo-grupo">
              <label className="campo-label"><strong>Cargo / Posición</strong></label>
              <input
                type="text"
                name="cargo"
                className="campo-input"
                placeholder="Ingresa el cargo o posición"
                value={formData.cargo}
                onChange={handleChange}
                required
                disabled={isSubmitting}
              />
            </div>

            {/* Email */}
            <div className="campo-grupo">
              <label className="campo-label"><strong>Correo electrónico</strong></label>
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

            {/* Teléfono */}
            <div className="campo-grupo">
              <label className="campo-label"><strong>Teléfono de contacto</strong></label>
              <input
                type="tel"
                name="telefono"
                className="campo-input"
                placeholder="Ingresa un teléfono de contacto"
                value={formData.telefono}
                onChange={handleChange}
                required
                disabled={isSubmitting}
                maxLength={10}
              />
            </div>

            {/* Propuesta */}
            <div className="campo-grupo">
              <label className="campo-label"><strong>Descripción de la propuesta</strong></label>
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

            {/* Archivo */}
            <div className="archivo-grupo">
              <label className="archivo-label"><strong>Anexar documentación (opcional)</strong></label>
              <p className="archivo-descripcion">Formatos: PDF, Word, Imagen</p>
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

            <div className="separador"></div>

            <motion.button
              type="submit"
              className="btn-enviar-exacto"
              whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
              whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <><span style={{ marginRight: '8px' }}>⏳</span> Enviando...</>
              ) : (
                <><span style={{ marginRight: '8px' }}></span> Enviar Formulario</>
              )}
            </motion.button>
          </motion.form>
        </motion.section>
      </div>
    </PublicLayout>
  );
};

export default Contacto;