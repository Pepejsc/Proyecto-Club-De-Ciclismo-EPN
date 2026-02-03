import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "../../assets/Styles/Main/Productos.css";
import iconoProducto from "../../assets/Images/Icons/producto.png";

const apiUrl = process.env.REACT_APP_API_URL;
const placeholderImg = "https://placehold.co/200x200/e8f0fe/10325c?text=EPN+Cycling";

/**
 * Carrusel de productos comerciales.
 * Consume la API y muestra tarjetas con precio y enlace de detalle.
 */
const NuestrosProductosCarrusel = () => {
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProductos = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${apiUrl}/recursos/comerciales/`);
        
        if (!response.ok) {
          throw new Error("No se pudieron cargar los productos.");
        }
        
        const data = await response.json();
        setProductos(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProductos();
  }, []);

  if (loading) return <div className="productos-section"><p>Cargando productos...</p></div>;
  if (error) return <div className="productos-section"><p>Error: {error}</p></div>;
  if (productos.length === 0) return <div className="productos-section"><p>No hay productos disponibles.</p></div>;

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
          0: { slidesPerView: 1 },
          768: { slidesPerView: 2 },
          1024: { slidesPerView: 3 },
        }}
        className="productos-swiper"
      >
        {productos.map((producto) => (
          <SwiperSlide key={producto.id_recurso}>
            <Link to={`/producto/${producto.id_recurso}`} className="producto-card">
              
              <img 
                src={producto.imagen_url || placeholderImg} 
                alt={producto.nombre} 
                className="producto-img"
                loading="lazy"
                onError={(e) => { e.target.src = placeholderImg; }}
              />
              
              <div className="producto-card-body">
                <div className="producto-info">
                  <img 
                    src={iconoProducto} 
                    alt="" 
                    className="producto-icono" 
                    aria-hidden="true" 
                  />
                  <h3 className="producto-titulo">{producto.nombre}</h3>
                </div>
                
                <p className="producto-descripcion">
                  {(producto.descripcion || "").length > 150 
                    ? producto.descripcion.substring(0, 150) + "..."
                    : producto.descripcion || "Sin descripción disponible."
                  }
                </p>
                
                {/* Footer con Precio y Enlace de Detalle */}
                <div className="producto-footer">
                  <span className="producto-precio">
                    ${Number(producto.precio_venta).toFixed(2)}
                  </span>
                  <span className="producto-ver-mas">
                    Ver detalle <i className="fas fa-arrow-right ver-detalle-icon"></i>
                  </span>
                </div>
              </div> 

            </Link>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default NuestrosProductosCarrusel;