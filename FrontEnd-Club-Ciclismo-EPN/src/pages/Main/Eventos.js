import React from 'react';
import { motion } from 'framer-motion';
import bannerImg from '../../assets/Images/Banner/bannerEventos.jpg';
import '../../assets/Styles/Main/Eventos.css';
import PublicLayout from '../../components/Main/PublicLayout';
import ProximoEvento from '../../components/Main/ProximoEvento';

const Events = () => {
  return (
    <PublicLayout>
      <div className="banner-overlay">
        <img src={bannerImg} alt="Banner" className="banner-img" />
        <motion.div
          className="banner-text"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
        >
          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
          >
            Únete a nuestros eventos
          </motion.h1>

          <motion.a
            href="#eventos"
            className="btn-banner"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            Ver próximos eventos
          </motion.a>
        </motion.div>
      </div>

      <div id="eventos">
        <div className="auspiciantes-header">
          <div className="ausp-title-bar">
            <div className="line line-left"></div>
            <h3 className="ausp-title">
              <span className="black">PRÓXIMOS</span>{" "}
              <span className="blue">EVENTOS</span>
            </h3>
            <div className="line line-right"></div>
          </div>
        </div>
        <ProximoEvento />
      </div>
    </PublicLayout>
  );
};

export default Events;
