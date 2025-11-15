import React from 'react';
import { motion } from 'framer-motion';
import '../../assets/Styles/Main/QuienesSomos.css';
import bannerImg from '../../assets/Images/Banner/carrusel2.jpg';
import misionImg from '../../assets/Images/Eventos/Mision.jpg';
import visionImg from '../../assets/Images/Eventos/Vision.jpg';
import quienesImg from '../../assets/Images/Eventos/NuestraHistoria.jpeg'
import PublicLayout from '../../components/Main/PublicLayout';

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
    visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: 'easeOut' } },
};

const fadeFromRight = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.8, ease: 'easeOut' } },
};
const fadeInUpBanner = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: 'easeOut' } },
};

const AboutUs = () => {
    return (
        <PublicLayout>
            <div className="quienes-container">
                {/* Banner principal */}
                <div className="banner-container">
                    <img src={bannerImg} alt="Banner" className="banner-img" />
                    <div className="overlay"></div>
                    <div className="banner-text">
                        <h1 className="fade-in">¿Quiénes Somos?</h1>
                    </div>
                </div>



                {/* Sección Misión */}
                <motion.section
                    className="content-section"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={containerVariants}
                >
                    <motion.div className="text-block" variants={fadeFromLeft}>
                        <h2>Misión</h2>
                        <p>
                            Promover y ofrecer práctica formativa, competitiva y recreativa de ciclismo de montaña con los máximos
                            criterios de seguridad y calidad, contribuyendo a una sociedad más activa y comprometida con la comunidad.
                        </p>
                    </motion.div>
                    <motion.div className="image-block small" variants={fadeFromRight}>
                        <img src={misionImg} alt="Misión" />
                    </motion.div>
                </motion.section>

                {/* Sección Visión */}
                <motion.section
                    className="content-section reverse"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    variants={containerVariants}
                >
                    <motion.div className="image-block small" variants={fadeFromLeft}>
                        <img src={visionImg} alt="Visión" />
                    </motion.div>
                    <motion.div className="text-block" variants={fadeFromRight}>
                        <h2>Visión</h2>
                        <p>
                            Ser el club de ciclismo de montaña y ruta referente de la Escuela Politécnica Nacional, integrando a estudiantes,
                            exestudiantes y profesores mediante actividades seguras y de calidad que promuevan el deporte, la formación
                            integral y el sentido de comunidad universitaria.
                        </p>
                    </motion.div>
                </motion.section>
                <motion.section
                    className="historia-section"
                    initial={{ opacity: 0, y: 50 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                >
                    <div className="historia-texto">
                        <h2>Nuestra Historia</h2>
                        <p>
                            Lo que comenzó como un grupo de amigos, conocidos y profesores que compartían su pasión por el ciclismo en la EPN,
                            pronto tomó forma como un proyecto más grande. En febrero de 2022, con el liderazgo de David Guillin como fundador,
                            Madelyn Fernández como cofundadora y el respaldo del profesor Andrés Larco, nació oficialmente el Club de Ciclismo de
                            la Escuela Politécnica Nacional. Desde entonces, el club ha crecido de manera significativa, integrando a estudiantes,
                            docentes, graduados y aficionados, promoviendo el deporte con compromiso y representando a la institución en diversas
                            actividades y competencias.
                        </p>
                    </div>
                    <div className="historia-imagen">
                        <img src={quienesImg} alt="Historia del club" />
                    </div>
                </motion.section>

            </div>
        </PublicLayout>
    );
};

export default AboutUs;
