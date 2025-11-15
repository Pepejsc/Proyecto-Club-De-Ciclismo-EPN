import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "../../assets/Styles/Main/Productos.css";

// Importa el icono estático
import iconoProducto from "../../assets/Images/Icons/producto.png";
// --- (ELIMINADO) Ya no importamos productos estáticos ---
// import producto1 from "../../assets/Images/Productos/producto1.png";
// ...

// (OPCIONAL) Importa una imagen de fallback por si un producto no tiene foto
// Asegúrate de que esta ruta sea correcta
// import placeholderImg from "../../assets/Images/Productos/producto_placeholder.png"; 

// URL de tu API (Asegúrate de tener REACT_APP_API_URL en tu .env)
const apiUrl = process.env.REACT_APP_API_URL;

// (OPCIONAL) Define la imagen de fallback aquí si no la importas
const placeholderImg = "[https://placehold.co/200x200/e8f0fe/10325c?text=EPN+Cycling](https://placehold.co/200x200/e8f0fe/10325c?text=EPN+Cycling)";


const NuestrosProductosCarrusel = () => {
  // 1. Estado para guardar los productos, el loading y el error
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 2. useEffect para llamar a la API cuando el componente se monta
  useEffect(() => {
    const fetchProductos = async () => {
      try {
        // 3. Llamada al nuevo endpoint PÚBLICO
        const response = await fetch(`${apiUrl}/recursos/comerciales/`);
        
        if (!response.ok) {
          throw new Error("No se pudieron cargar los productos.");
        }
        
        const data = await response.json();
        setProductos(data);
        console.log("Productos cargados:", data);

      } catch (err) {
        setError(err.message);
        console.error("Error fetching productos:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProductos();
  }, []); // El array vacío [] asegura que se ejecute solo una vez

  // 4. Renderizado condicional
  if (loading) {
    return <div className="productos-section"><p>Cargando productos...</p></div>;
  }

  if (error) {
    return <div className="productos-section"><p>Error: {error}</p></div>;
  }

  if (productos.length === 0) {
    return <div className="productos-section"><p>No hay productos disponibles en este momento.</p></div>;
  }

  // 5. El carrusel ahora usa los datos del estado 'productos'
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
        {productos.map((producto) => (
          <SwiperSlide key={producto.id_recurso}>
            <div className="producto-card">
              
              {/* 6. Usamos la imagen_url de la BD */}
              <img 
                src={producto.imagen_url || placeholderImg} 
                alt={producto.nombre} 
                className="producto-img"
                // Fallback por si la URL de la BD está rota
                onError={(e) => { e.target.src = placeholderImg; }}
              />
              
              {/* Tu CSS (Productos.css) soporta:
                .producto-info
                .producto-icono
                .producto-titulo (le cambié el nombre en tu JSX de <p> a <h3>)
                .producto-descripcion
                .producto-precio
                ¡Vamos a usarlos todos!
              */}
              
              {/* Título del producto */}
              <div className="producto-info">
                <img src={iconoProducto} alt="icono-producto" className="producto-icono" />
                {/* Usamos 'nombre' para el título */}
                <h3 className="producto-titulo">{producto.nombre}</h3>
              </div>
              
              {/* Descripción */}
              <p className="producto-descripcion">
                {producto.descripcion || "Próximamente más detalles."}
              </p>
              
              {/* Precio */}
              <p className="producto-precio">
                ${Number(producto.precio_venta).toFixed(2)}
              </p>

              {/* Botón (Opcional, si quieres añadirlo) */}
              {/* <button className="producto-boton">Ver Más</button> */}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
};

export default NuestrosProductosCarrusel;