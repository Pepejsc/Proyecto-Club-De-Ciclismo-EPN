import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "../../assets/Styles/Main/NuestrosLogros.css";

// Importación de imágenes
import logro1 from "../../assets/Images/Logros/logro1.jpg";
import logro2 from "../../assets/Images/Logros/logro2.jpg";
import logro3 from "../../assets/Images/Logros/logro3.png";
import logro4 from "../../assets/Images/Logros/logro4.jpg";
import logro5 from "../../assets/Images/Logros/logro5.jpg";
import logro6 from "../../assets/Images/Logros/logro6.png";
import logro7 from "../../assets/Images/Logros/logro7.png";
import logro8 from "../../assets/Images/Logros/logro8.png";
import logro9 from "../../assets/Images/Logros/logro9.png";
import distintivo from "../../assets/Images/Icons/distintivo.png";

/**
 * Datos de los logros obtenidos.
 * Se define fuera del componente para evitar recreaciones innecesarias.
 */
const logrosData = [
  { titulo: "Giro d'Italia Ride Like a Pro, Ecuador - I Edición", imagen: logro1 },
  { titulo: "Giro d'Italia Ride a Pro, Ecuador - II Edición", imagen: logro2 },
  { titulo: "Ruta del Plátano, Ecuador - XII Edición", imagen: logro3 },
  { titulo: "Ruta de la Selva, Misahualli - V Edición", imagen: logro4 },
  { titulo: "La Terca, El Carmen-Manabí - X Edición", imagen: logro5 },
  { titulo: "SW de Ambato, - VII Edición", imagen: logro6 },
  { titulo: "Crono Escalada al Guagua Pichicha, Ecuador", imagen: logro7 },
  { titulo: "Chimborazo Extremo, Ecuador - XX Edición", imagen: logro8 },
  { titulo: "Crono Escalada Pedregal - Machachi, Ecuador", imagen: logro9 },
];

const NuestrosLogrosCarrusel = () => {
  return (
    <section className="logros-section">
      <Swiper
        modules={[Pagination, Autoplay]}
        slidesPerView={3}
        spaceBetween={35}
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop={true}
        breakpoints={{
          0: { slidesPerView: 1 },
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
      >
        {logrosData.map((logro, index) => (
          <SwiperSlide key={index}>
            <div className="logro-card">
              <img 
                src={logro.imagen} 
                alt={`Imagen de ${logro.titulo}`} 
                className="logro-img" 
                loading="lazy"
              />
              <div className="logro-info">
                <img 
                  src={distintivo} 
                  alt="" 
                  className="logro-icono" 
                  aria-hidden="true" 
                />
                <p className="logro-titulo">{logro.titulo}</p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default NuestrosLogrosCarrusel;