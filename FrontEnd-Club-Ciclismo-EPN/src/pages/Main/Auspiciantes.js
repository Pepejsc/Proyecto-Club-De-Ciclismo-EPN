import React from "react";
import { motion } from "framer-motion";
import "../../assets/Styles/Main/Auspicios.css";
import AuspicioImg from "../../assets/Images/Logros/logro8.png";
import PublicLayout from "../../components/Main/PublicLayout";
import AuspiciantesCarrusel from "../../components/Main/AuspiciantesCarrusel";

// Variantes de animación
const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const fadeFromLeft = {
  hidden: { opacity: 0, x: -50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const fadeFromRight = {
  hidden: { opacity: 0, x: 50 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } },
};

const Auspiciantes = () => {
  return (
    <PublicLayout>
      <div className="quienes-container">
        {/* Sección Auspicio Descripcion*/}
        <motion.section
          className="content-section"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={containerVariants}
        >
          <motion.div className="image-block small" variants={fadeFromRight}>
            <img src={AuspicioImg} alt="Auspicios" />
          </motion.div>

          <motion.div className="text-block" variants={fadeFromLeft}>
            <h2>¡ AUSPICIANOS !</h2>
            <p>
              ¡Pedaleamos con propósito, y tú puedes ser parte de esta ruta!
              <br />
              El Club de Ciclismo de la Escuela Politécnica Nacional (EPN) no es
              solo un grupo de estudiantes apasionados por el deporte: somos una
              comunidad que promueve la salud, la sostenibilidad, el trabajo en
              equipo y la excelencia. Cada kilómetro que recorremos representa
              esfuerzo, disciplina y el compromiso de formar líderes que se
              mueven con energía y visión. Hoy queremos invitarte a ser parte de
              este movimiento. Al auspiciar nuestro club, tu empresa o
              institución no solo apoya el deporte universitario, sino que se
              alinea con valores que transforman vidas: perseverancia,
              inclusión, respeto por el medio ambiente y superación personal.
            </p>
          </motion.div>
        </motion.section>
        <motion.div>
        {/* Sección Marcas que confian en nosotros */}
        <div className="auspiciantes-header">
          <div className="ausp-title-bar">
            <div className="line line-left"></div>
            <h3 className="ausp-title">
              <span className="black">LAS MARCAS QUE CONFÍAN EN</span>{" "}
              <span className="blue">NOSOTROS</span>
            </h3>
            <div className="line line-right"></div>
          </div>
        </div>
        <AuspiciantesCarrusel />
        </motion.div>

        <motion.section
          className="historia-section"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <div className="historia-texto">
            <h2>¿Por qué auspiciarnos?</h2>
            <ul>
              <li>
                <strong>Visibilidad de marca:</strong> Tu logo estará presente
                en nuestras camisetas, bicicletas, redes sociales, eventos y
                competencias locales y nacionales.
              </li>
              <li>
                <strong>Alianza con una institución de prestigio:</strong> La
                EPN es reconocida por su excelencia académica y compromiso
                social. Tu marca se vincula con una comunidad de alto impacto.
              </li>
              <li>
                <strong>Responsabilidad social:</strong> Apoyar el deporte es
                apoyar la salud física y mental de jóvenes que representan el
                futuro del país.
              </li>
              <li>
                <strong>Proyección nacional:</strong> Participamos en eventos
                ciclísticos que reúnen a clubes de todo Ecuador, llevando tu
                marca a nuevos públicos.
              </li>
            </ul>
          </div>
          <div className="historia-imagen">
            <motion.a
              href="contacto"
              className="btn-banner"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              Contáctanos
            </motion.a>
          </div>
        </motion.section>
      </div>
    </PublicLayout>
  );
};

export default Auspiciantes;
