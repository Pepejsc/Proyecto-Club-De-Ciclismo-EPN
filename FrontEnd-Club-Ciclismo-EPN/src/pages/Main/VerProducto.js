import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import PublicLayout from '../../components/Main/PublicLayout';
import ProductosCarrusel from '../../components/Main/ProductosCarrusel';
import '../../assets/Styles/Main/VerProducto.css';
import { toast } from 'react-toastify';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons'; 
import { faWhatsapp } from '@fortawesome/free-brands-svg-icons'; 
import { useCart } from '../Main/CarContext';

const apiUrl = process.env.REACT_APP_API_URL;
const placeholderImg = "https://placehold.co/500x500/e8f0fe/10325c?text=EPN+Cycling";

const VerProducto = () => {
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedTalla, setSelectedTalla] = useState(null);
  const [showCartModal, setShowCartModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { id } = useParams();
  const navigate = useNavigate();
  // Importamos la nueva función getQuantityInCart
  const { cartItems, addToCart, removeFromCart, cartTotal, cartCount, clearCart, getQuantityInCart } = useCart();

  useEffect(() => {
    const fetchProducto = async () => {
      setLoading(true);
      setError(null);
      setProducto(null);
      try {
        const response = await fetch(`${apiUrl}/recursos/${id}`);
        if (!response.ok) throw new Error('Producto no encontrado');
        const data = await response.json();
        if (data.tipo_recurso !== 'COMERCIAL') throw new Error('Este producto no está disponible para la venta.');
        setProducto(data);
        setSelectedTalla(null);
        if (data.imagen_url) setSelectedImage(data.imagen_url);
        else if (data.imagenes_secundarias && data.imagenes_secundarias.length > 0) setSelectedImage(data.imagenes_secundarias[0].imagen_url);
        else setSelectedImage(placeholderImg);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducto();
  }, [id]);

  const isAgotado = !producto || producto.stock_actual <= 0;
  const tallasArray = producto?.tallas_disponibles ? producto.tallas_disponibles.split(',').map(t => t.trim()) : [];

  // --- (MODIFICADO) Validación de Stock ---
  const handleAddToCart = () => {
    if (!selectedTalla && tallasArray.length > 0) {
      toast.warning("Por favor selecciona una talla.");
      return;
    }

    // 1. Verificar cuántos tengo ya en el carrito
    const currentInCart = getQuantityInCart(producto.id_recurso);
    
    // 2. Verificar si al sumar 1 supero el stock real
    if (currentInCart + 1 > producto.stock_actual) {
        toast.error(`¡No hay suficiente stock! Solo quedan ${producto.stock_actual} unidades.`);
        return;
    }

    addToCart(producto, selectedTalla || "Única");
    toast.success("Producto añadido al carrito");
    setShowCartModal(true);
  };

  const handleWhatsAppCheckout = async () => {
    if (cartItems.length === 0) return;
    setIsProcessing(true);
    try {
      // Loop para restar stock (igual que antes)
      for (const item of cartItems) {
        // Restamos la cantidad TOTAL acumulada de ese item (ej. 3 veces)
        // Ojo: Tu endpoint actual resta de 1 en 1.
        // Para ser precisos, deberíamos llamar al endpoint 'item.quantity' veces.
        for (let i = 0; i < item.quantity; i++) {
             const response = await fetch(`${apiUrl}/recursos/${item.id_recurso}/comprar`, {
                method: 'POST',
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Error con ${item.nombre}: ${errorData.detail}`);
            }
        }
      }

      const telefono = "593987624912";
      let mensaje = `¡Hola! Quiero confirmar mi pedido de la web:\n\n`;
      
      cartItems.forEach((item) => {
        mensaje += `${item.nombre}* (x${item.quantity})\n`;
        mensaje += `   Talla: ${item.selectedTalla}\n`;
        mensaje += `   Precio Unitario: $${item.precio_venta}\n`;
        mensaje += `   Subtotal: $${(item.precio_venta * item.quantity).toFixed(2)}\n\n`;
      });
      mensaje += `TOTAL A PAGAR: $${cartTotal.toFixed(2)}*`;

      const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
      window.open(url, '_blank');
      clearCart();
      setShowCartModal(false);
      toast.success("Pedido enviado y stock actualizado.");
      window.location.reload();
    } catch (error) {
      console.error("Error en checkout:", error);
      toast.error("Hubo un problema: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) return <PublicLayout><div className="producto-page-loading">Cargando...</div></PublicLayout>;
  if (error) return <PublicLayout><div className="producto-page-loading">Error: {error}</div></PublicLayout>;

  return (
    <PublicLayout>
      <div className="producto-page">
        <div className="producto-main">
          <div className="producto-columna-izquierda">
             <div className="producto-imagen-principal">
              {/* Si está agotado, mostramos un overlay visual o una etiqueta */}
              {isAgotado && <div className="imagen-overlay-agotado">AGOTADO</div>}
              <img src={selectedImage} alt={producto.nombre} onError={(e) => { e.target.src = placeholderImg; }} style={isAgotado ? {opacity: 0.6} : {}} />
            </div>
            <div className="producto-galeria-thumbnails">
              {producto.imagen_url && (
                <div className={`thumbnail-item ${selectedImage === producto.imagen_url ? 'active' : ''}`} onClick={() => setSelectedImage(producto.imagen_url)}>
                  <img src={producto.imagen_url} alt="main" onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
              )}
              {producto.imagenes_secundarias?.map((img) => (
                <div key={img.id} className={`thumbnail-item ${selectedImage === img.imagen_url ? 'active' : ''}`} onClick={() => setSelectedImage(img.imagen_url)}>
                  <img src={img.imagen_url} alt="gal" onError={(e) => { e.target.style.display = 'none'; }} />
                </div>
              ))}
            </div>
          </div>

          <div className="producto-info">
            <h1>{producto.nombre.toUpperCase()}</h1>
            <p>{producto.descripcion || "Sin descripción."}</p>
            <span className="precio">${Number(producto.precio_venta).toFixed(2)}</span>
            
            <p style={{fontSize: '0.9rem', color: isAgotado ? 'red' : '#666', marginBottom: '10px'}}>
               Status: <strong>{isAgotado ? "Agotado" : `Disponible (${producto.stock_actual} un.)`}</strong>
            </p>

            {tallasArray.length > 0 && (
              <div className="producto-tallas-container">
                <div className="tallas-header"><span className="talla-label">TALLA:</span></div>
                <div className="tallas-selector">
                    {tallasArray.map((talla) => (
                      <button 
                        key={talla}
                        className={`talla-box ${selectedTalla === talla ? 'active' : ''}`}
                        onClick={() => setSelectedTalla(talla)}
                        disabled={isAgotado}
                      >
                        {talla}
                      </button>
                    ))}
                </div>
              </div>
            )}

            <div className="producto-botones-container">
              <button 
                className="btn-comprar"
                disabled={isAgotado || (!selectedTalla && tallasArray.length > 0)} 
                onClick={handleAddToCart}
                style={isAgotado ? {backgroundColor: '#ccc', cursor: 'not-allowed'} : {}}
              >
                {isAgotado ? "AGOTADO" : (!selectedTalla && tallasArray.length > 0 ? "Selecciona Talla" : "Añadir al Carrito")}
              </button>
              
              {cartItems.length > 0 && (
                <button className="btn-ver-carrito" onClick={() => setShowCartModal(true)}>
                   Ver mi Carrito ({cartCount})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* --- MODAL DEL CARRITO (AGRUPADO) --- */}
        {showCartModal && (
          <div className="modal-overlay">
            <div className="modal-content modal-compra">
              <h3>Tu Carrito de Compras</h3>
              <div className="carrito-lista">
                {cartItems.length === 0 ? (
                  <p>El carrito está vacío.</p>
                ) : (
                  cartItems.map((item) => (
                    <div key={item.uniqueId} className="carrito-item">
                      <img src={item.imagen_url || placeholderImg} alt="mini" className="carrito-img-mini"/>
                      <div className="carrito-info">
                        <p className="c-nombre">{item.nombre}</p>
                        <p className="c-detalles">
                             Talla: {item.selectedTalla} | ${item.precio_venta} 
                             {/* --- (NUEVO) Mostrar Cantidad --- */}
                             <span style={{fontWeight: 'bold', color: '#238CBC', marginLeft: '8px'}}>
                                x{item.quantity}
                             </span>
                        </p>
                      </div>
                      <button className="btn-trash" onClick={() => removeFromCart(item.uniqueId, true)}> {/* True para borrar todo el grupo */}
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  ))
                )}
              </div>
              {/* ... (resto del modal igual) ... */}
               {cartItems.length > 0 && (
                <div className="carrito-total">
                  <span>Total:</span>
                  <span className="total-precio">${cartTotal.toFixed(2)}</span>
                </div>
              )}
              <p className="modal-note">Al confirmar, serás redirigido a WhatsApp.</p>
              <div className="modal-buttons">
                <button className="btn-primary btn-whatsapp-modal" onClick={handleWhatsAppCheckout} disabled={cartItems.length === 0 || isProcessing}>
                   <FontAwesomeIcon icon={faWhatsapp} /> {isProcessing ? "..." : "Confirmar Pedido"}
                </button>
                <button className="btn-secondary" onClick={() => setShowCartModal(false)} disabled={isProcessing}>
                  Seguir Comprando
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="auspiciantes-header">
          <div className="ausp-title-bar">
            <div className="line line-left"></div>
            <h3 className="ausp-title"><span className="black">MÁS</span> <span className="blue">PRODUCTOS</span></h3>
            <div className="line line-right"></div>
          </div>
        </div>
        <ProductosCarrusel />
      </div>
    </PublicLayout>
  );
};

export default VerProducto;