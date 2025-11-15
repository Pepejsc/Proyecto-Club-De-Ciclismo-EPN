import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "../../assets/Styles/Main/Productos.css";

import producto1 from "../../assets/Images/Productos/producto1.png";
import producto2 from "../../assets/Images/Productos/producto2.png";
import producto3 from "../../assets/Images/Productos/producto3.png";
import producto4 from "../../assets/Images/Productos/producto4.png";
import producto5 from "../../assets/Images/Productos/producto5.png";
import producto6 from "../../assets/Images/Productos/producto6.png";
import iconoProducto from "../../assets/Images/Icons/producto.png";


const productos = [
  { titulo: "Buff con diseño de ciclismo, ideal para protegerte del clima.", imagen: producto1 },
  { titulo: "Jersey Manga Corta. Rendimiento y Estilo en Cada Pedaleada.", imagen: producto2 },
  { titulo: "Jersey Manga Larga. Diseñado para rendimiento en tus rutas.", imagen: producto3 },
  { titulo: "Licra entera, diseñada para el rendimiento en todas las rutas.", imagen: producto4 },
  { titulo: "Medias de Ciclismo, comodidad y estilo para tus pies.", imagen: producto5 },
  { titulo: "Chaqueta Rompevientos. Protégete del viento con estilo y ligereza.", imagen: producto6 },
];

const NuestrosProductosCarrusel = () => {
  return (
    <section className="productos-section">

      <Swiper
        modules={[Pagination, Autoplay]}
        slidesPerView={3}
        spaceBetween={35}
        pagination={{ clickable: true }}
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        loop={true}
        breakpoints={{
          1024: { slidesPerView: 3 },
          768: { slidesPerView: 2 },
          0: { slidesPerView: 1 },
        }}
      >
        {productos.map((producto, index) => (
          <SwiperSlide key={index}>
            <div className="producto-card">
              <img src={producto.imagen} alt={producto.titulo} className="producto-img" />
              <div className="producto-info">
                <img src={iconoProducto} alt="icono-producto" className="producto-icono" />
                <p className="productos-titulo">{producto.titulo}</p>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default NuestrosProductosCarrusel;
