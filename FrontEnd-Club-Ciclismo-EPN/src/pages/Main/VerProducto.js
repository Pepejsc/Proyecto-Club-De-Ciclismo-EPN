import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import PublicLayout from '../../components/Main/PublicLayout';
import ProductosCarrusel from '../../components/Main/ProductosCarrusel';
import '../../assets/Styles/Main/VerProducto.css';
// --- (AQUÍ ESTÁ LA CORRECCIÓN) ---
import { toast } from 'react-toastify';
// (Asegúrate de tener font-awesome)
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons';

const apiUrl = process.env.REACT_APP_API_URL;
const placeholderImg = "[https://placehold.co/500x500/e8f0fe/10325c?text=EPN+Cycling](https://placehold.co/500x500/e8f0fe/10325c?text=EPN+Cycling)";

const VerProducto = () => {
  // --- Estados para los datos dinámicos ---
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Estado para la imagen que se está mostrando en grande
  const [selectedImage, setSelectedImage] = useState(null);
  // --- (NUEVO) Estado para la talla seleccionada ---
  const [selectedTalla, setSelectedTalla] = useState(null);
  
  // 1. Leemos el ':id' de la URL (ej. /producto/5)
  const { id } = useParams();

  // 2. Usamos useEffect para cargar los datos del producto
  useEffect(() => {
    // Definimos la función de carga
    const fetchProducto = async () => {
      setLoading(true);
      setError(null);
      setProducto(null);
      
      try {
        // Llamamos al endpoint que ya devuelve URLs completas
        const response = await fetch(`${apiUrl}/recursos/${id}`);
        if (!response.ok) {
          throw new Error('Producto no encontrado');
        }
        const data = await response.json();
        
        // Solo mostramos si es COMERCIAL
        if (data.tipo_recurso !== 'COMERCIAL') {
            throw new Error('Este producto no está disponible para la venta.');
        }
        
        setProducto(data);
        
        // 3. Lógica de imagen mejorada (para que no se vea el placeholder si hay galería)
        if (data.imagen_url) {
          setSelectedImage(data.imagen_url);
        } else if (data.imagenes_secundarias && data.imagenes_secundarias.length > 0) {
          setSelectedImage(data.imagenes_secundarias[0].imagen_url);
        } else {
          setSelectedImage(placeholderImg);
        }
        
        console.log("Producto cargado:", data);

      } catch (err) {
        console.error("Error al cargar el producto:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    // Llamamos a la función
    fetchProducto();
  }, [id]); // Se vuelve a ejecutar si el 'id' de la URL cambia

  // --- (NUEVO) Lógica de Stock y Tallas ---
  // Hacemos un check seguro por si 'producto' es null
  const isAgotado = !producto || producto.stock_actual <= 0;
  
  const tallasArray = producto?.tallas_disponibles 
    ? producto.tallas_disponibles.split(',').map(t => t.trim()) 
    : [];

  const handleWhatsAppBuy = () => {
    const telefono = "593123456789"; // Reemplaza con tu número
    let mensaje = `¡Hola! Estoy interesado en el producto "${producto.nombre}"`;
    if (selectedTalla) {
      mensaje += ` en talla ${selectedTalla}`;
    }
    mensaje += `. (ID: ${producto.id_recurso})`;
    
    const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
  };


  // --- Renderizado condicional ---
  if (loading) {
    return <PublicLayout><div className="producto-page-loading">Cargando producto...</div></PublicLayout>;
  }
  if (error) {
    return <PublicLayout><div className="producto-page-loading">Error: {error}</div></PublicLayout>;
  }
  if (!producto) {
    return <PublicLayout><div className="producto-page-loading">Producto no disponible.</div></PublicLayout>;
  }

  // --- JSX Dinámico ---
  return (
    <PublicLayout>
      <div className="producto-page">
        {/* Sección principal del producto */}
        <div className="producto-main">
          
          {/* --- Columna Izquierda (Imagen Principal + Galería) --- */}
          <div className="producto-columna-izquierda">
            <div className="producto-imagen-principal">
              <img 
                src={selectedImage} 
                alt={producto.nombre}
                onError={(e) => { e.target.src = placeholderImg; }}
              />
            </div>
            
            {/* Contenedor de thumbnails (fotos pequeñas) */}
            <div className="producto-galeria-thumbnails">
              
              {/* 1. El thumbnail de la IMAGEN PRINCIPAL (si existe) */}
              {producto.imagen_url && (
                <div 
                  className={`thumbnail-item ${selectedImage === producto.imagen_url ? 'active' : ''}`}
                  onClick={() => setSelectedImage(producto.imagen_url)}
                >
                  <img
                    src={producto.imagen_url}
                    alt="thumbnail principal"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}

              {/* 2. Mapeamos las IMÁGENES SECUNDARIAS */}
              {producto.imagenes_secundarias && producto.imagenes_secundarias.map((img) => (
                <div 
                  key={img.id}
                  className={`thumbnail-item ${selectedImage === img.imagen_url ? 'active' : ''}`}
                  onClick={() => setSelectedImage(img.imagen_url)}
                >
                  <img
                    src={img.imagen_url}
                    alt={`galería ${img.id}`}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              ))}
            </div>
          </div>
          {/* --- Fin Columna Izquierda --- */}


          {/* --- Columna Derecha (Información) --- */}
          <div className="producto-info">
            <h1>{producto.nombre.toUpperCase()}</h1>
            <p>
              {producto.descripcion || "Descripción no disponible."}
            </p>
            <span className="precio">${Number(producto.precio_venta).toFixed(2)}</span>

            {/* --- Sección de Tallas Dinámicas --- */}
            {tallasArray.length > 0 && (
              <div className="producto-tallas-container">
                <div className="tallas-header">
                  <span className="talla-label">TALLA:</span>
                  {/* <span className="guia-tallas">Guía de Tallas</span> */}
                </div>
                
                {/* --- Lógica Condicional de Stock --- */}
                {isAgotado ? (
                  <div className="producto-agotado-msg">PRODUCTO AGOTADO</div>
                ) : (
                  <div className="tallas-selector">
                    {tallasArray.map((talla) => (
                      <button 
                        key={talla}
                        className={`talla-box ${selectedTalla === talla ? 'active' : ''}`}
                        onClick={() => setSelectedTalla(talla)}
                        disabled={isAgotado} // Desactivado si no hay stock
                      >
                        {talla}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* --- FIN TALLAS --- */}

            {/* --- Contenedor de Botones --- */}
            <div className="producto-botones-container">
              {isAgotado ? (
                // Botones si está AGOTADO
                <>
                  <button className="btn-comprar" disabled>AGOTADO</button>
                  <button className="btn-whatsapp" disabled>AGOTADO</button>
                </>
              ) : (
                // Botones si SÍ HAY stock
                <>
                  <button 
                    className="btn-comprar"
                    // Desactivado si no se ha seleccionado talla
                    disabled={!selectedTalla && tallasArray.length > 0} 
                    onClick={() => toast.info("Funcionalidad de 'Comprar' pendiente.")}
                  >
                    {/* Texto dinámico */}
                    {!selectedTalla && tallasArray.length > 0 ? "Selecciona una talla" : "Añadir al Carrito"}
                  </button>
                  <button 
                    className="btn-whatsapp"
                    onClick={handleWhatsAppBuy}
                  >
                    <FontAwesomeIcon icon={faWhatsapp} /> Comprar por WhatsApp
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* --- Sección "Más Productos" (sin cambios) --- */}
        <div className="auspiciantes-header">
          <div className="ausp-title-bar">
            <div className="line line-left"></div>
            <h3 className="ausp-title">
              <span className="black">MÁS</span>{" "}
              <span className="blue">PRODUCTOS</span>
            </h3>
            <div className="line line-right"></div>
          </div>
        </div>
        <ProductosCarrusel />
      </div>
    </PublicLayout>
  );
};

export default VerProducto;