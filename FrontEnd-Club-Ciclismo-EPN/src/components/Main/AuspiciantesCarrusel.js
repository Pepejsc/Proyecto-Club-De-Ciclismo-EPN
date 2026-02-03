import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "../../assets/Styles/Main/AuspiciantesCarrusel.css";

// Importación de imágenes
import ausp1 from "../../assets/Images/Auspiciantes/auspiciante1.jpg";
import ausp2 from "../../assets/Images/Auspiciantes/auspiciante2.jpg";
import ausp3 from "../../assets/Images/Auspiciantes/auspiciante3.jpg";
import ausp4 from "../../assets/Images/Auspiciantes/auspiciante4.jpg";
import ausp5 from "../../assets/Images/Auspiciantes/auspiciante5.jpg";
import ausp6 from "../../assets/Images/Auspiciantes/auspiciante6.png";
import ausp7 from "../../assets/Images/Auspiciantes/auspiciante7.jpg";
import ausp8 from "../../assets/Images/Auspiciantes/auspiciante8.png";

const auspiciantes = [ausp1, ausp2, ausp3, ausp4, ausp5, ausp6, ausp7, ausp8];

/**
 * Componente Carrusel de Auspiciantes.
 * Muestra un slider infinito con autoplay de los logotipos de los patrocinadores.
 * Utiliza Swiper.js para la gestión del carrusel y responsive breakpoints.
 */
const AuspiciantesCarrusel = () => {
  return (
    <section className="auspiciantes-section">
      <Swiper
        modules={[Pagination, Autoplay]}
        slidesPerView={4}
        spaceBetween={50}
        pagination={{ clickable: true }}
        autoplay={{ delay: 4500, disableOnInteraction: false }}
        loop={true}
        breakpoints={{
          0: { slidesPerView: 1 },
          480: { slidesPerView: 2 },
          768: { slidesPerView: 3 },
          1024: { slidesPerView: 4 },
        }}
      >
        {auspiciantes.map((img, index) => (
          <SwiperSlide key={index}>
            {/* Wrapper necesario para centrado vertical definido en CSS */}
            <div className="auspiciante-wrapper">
              <img
                src={img}
                alt={`Auspiciador ${index + 1}`}
                // Mantiene la lógica condicional para tamaños específicos
                className={`auspiciante-img ${index >= 2 ? "grande" : ""}`}
                loading="lazy"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default AuspiciantesCarrusel;