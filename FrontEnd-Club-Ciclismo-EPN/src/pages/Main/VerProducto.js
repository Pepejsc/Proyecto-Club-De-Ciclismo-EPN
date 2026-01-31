import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import PublicLayout from "../../components/Main/PublicLayout";
import ProductosCarrusel from "../../components/Main/ProductosCarrusel";
import "../../assets/Styles/Main/VerProducto.css";
import { toast } from "react-toastify";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faTimes, faUpload } from "@fortawesome/free-solid-svg-icons";
import { faTelegram } from "@fortawesome/free-brands-svg-icons";
import { useCart } from "../Main/CarContext";

const apiUrl = process.env.REACT_APP_API_URL;
const placeholderImg =
  "https://placehold.co/500x500/e8f0fe/10325c?text=EPN+Cycling";

// --- FUNCIONES DE VALIDACIÓN (ECUADOR) ---

/**
 * Valida cédula ecuatoriana (Algoritmo Módulo 10)
 */
const validarCedulaEcuatoriana = (cedula) => {
  // 1. Longitud exacta
  if (cedula.length !== 10) return false;

  // 2. Que sean solo números
  const digitos = cedula.split('').map(Number);
  if (digitos.some(isNaN)) return false;

  // 3. Código de provincia (01-24)
  const codigoProvincia = Number(cedula.substring(0, 2));
  if (codigoProvincia < 1 || codigoProvincia > 24) return false;

  // 4. Tercer dígito (debe ser menor a 6 para personas naturales)
  const tercerDigito = digitos[2];
  if (tercerDigito >= 6) return false; // Nota: RUCs usan 6 o 9, pero cédula natural es < 6

  // 5. Algoritmo Módulo 10
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < 9; i++) {
    let valor = digitos[i] * coeficientes[i];
    if (valor >= 10) valor -= 9;
    suma += valor;
  }

  const digitoVerificador = digitos[9];
  const decenaSuperior = Math.ceil(suma / 10) * 10;
  let resultado = decenaSuperior - suma;
  
  if (resultado === 10) resultado = 0;

  return resultado === digitoVerificador;
};

/**
 * Valida celular ecuatoriano
 */
const validarCelular = (telefono) => {
  // Regex: Empieza con 09 y le siguen 8 dígitos numéricos
  const regex = /^09\d{8}$/;
  return regex.test(telefono);
};

const VerProducto = () => {
  // --- ESTADOS ---
  const [producto, setProducto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedTalla, setSelectedTalla] = useState(null);
  const [showCartModal, setShowCartModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // Estado para controlar los pasos del Modal (1: Lista, 2: Datos)
  const [step, setStep] = useState(1);

  // Estado para datos del cliente invitado
  const [cliente, setCliente] = useState({
    nombre: "",
    telefono: "",
    cedula: "",
  });

  // --- NUEVO ESTADO: Para el archivo de transferencia ---
  const [transferFile, setTransferFile] = useState(null);

  const { id } = useParams();
  const navigate = useNavigate();

  const {
    cartItems,
    addToCart,
    removeFromCart,
    cartTotal,
    cartCount,
    clearCart,
    getQuantityInCart,
  } = useCart();

  // --- 1. CARGAR PRODUCTO ---
  useEffect(() => {
    const fetchProducto = async () => {
      setLoading(true);
      setError(null);
      setProducto(null);
      try {
        const response = await fetch(`${apiUrl}/recursos/${id}`);
        if (!response.ok) throw new Error("Producto no encontrado");
        const data = await response.json();

        if (data.tipo_recurso !== "COMERCIAL")
          throw new Error("Este producto no está disponible para la venta.");

        setProducto(data);
        setSelectedTalla(null);

        if (data.imagen_url) setSelectedImage(data.imagen_url);
        else if (
          data.imagenes_secundarias &&
          data.imagenes_secundarias.length > 0
        )
          setSelectedImage(data.imagenes_secundarias[0].imagen_url);
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
  const tallasArray = producto?.tallas_disponibles
    ? producto.tallas_disponibles.split(",").map((t) => t.trim())
    : [];

  // --- 2. MANEJAR CARRITO ---
  const handleAddToCart = () => {
    if (!selectedTalla && tallasArray.length > 0) {
      toast.warning("Por favor selecciona una talla.");
      return;
    }

    const currentInCart = getQuantityInCart(producto.id_recurso);
    if (currentInCart + 1 > producto.stock_actual) {
      toast.error(
        `¡No hay suficiente stock! Solo quedan ${producto.stock_actual} unidades.`,
      );
      return;
    }

    addToCart(producto, selectedTalla || "Única");
    toast.success("Producto añadido al carrito");
    setShowCartModal(true);
    setStep(1);
  };

  // --- NUEVO: Manejar cambio de archivo ---
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setTransferFile(e.target.files[0]);
    }
  };

  // --- 3. CHECKOUT (AHORA TELEGRAM) ---
  const handleTelegramCheckout = async () => {
    if (cartItems.length === 0) return;

    // --- A. VALIDACIONES DE DATOS ---
    
    // 1. Validar Nombre
    if (!cliente.nombre.trim()) {
       toast.warning("Por favor ingresa tu Nombre.");
       return;
    }

    // 2. Validar Celular (Ecuador)
    if (!validarCelular(cliente.telefono)) {
        toast.warning("El celular debe tener 10 dígitos y empezar con 09.");
        return;
    }

    // 3. Validar Cédula (Ecuador)
    if (!cliente.cedula) {
        toast.warning("La cédula es obligatoria.");
        return;
    }
    if (!validarCedulaEcuatoriana(cliente.cedula)) {
        toast.error("La cédula ingresada NO es válida.");
        return;
    }

    // 4. Validar Comprobante (Imagen)
    if (!transferFile) {
        toast.warning("Por favor sube la foto del comprobante.");
        return;
    }

    setIsProcessing(true);
    try {
      // --- FormData ---
      const formData = new FormData();

      const fullName = `${cliente.nombre} ${cliente.cedula ? `(CI: ${cliente.cedula})` : ""}`;

      // Agregamos campos de texto
      formData.append("customer_name", fullName);
      formData.append("customer_phone", cliente.telefono);
      formData.append("total", cartTotal);

      const itemsData = cartItems.map((item) => ({
        id_recurso: item.id_recurso,
        quantity: item.quantity,
        precio_venta: item.precio_venta,
        nombre: item.nombre,
        talla: item.selectedTalla,
      }));
      formData.append("items_json", JSON.stringify(itemsData));

      // Agregamos el archivo
      formData.append("payment_proof", transferFile);

      // Fetch al Backend
      const response = await fetch(`${apiUrl}/ventas/checkout`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Error al procesar la orden");
      }

      // --- ÉXITO ---
      localStorage.removeItem("cartItems");
      localStorage.removeItem("cart");
      clearCart();

      setCliente({ nombre: "", telefono: "", cedula: "" });
      setTransferFile(null); // Limpiar archivo
      setShowCartModal(false);
      setStep(1);

      toast.success("¡Pedido enviado por Telegram correctamente!");

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error("Error en checkout:", error);
      toast.error(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCloseModal = () => {
    setShowCartModal(false);
    setCliente({ nombre: "", telefono: "", cedula: "" });
    setTransferFile(null);
    setStep(1);
  };

  if (loading)
    return (
      <PublicLayout>
        <div className="producto-page-loading">Cargando...</div>
      </PublicLayout>
    );
  if (error)
    return (
      <PublicLayout>
        <div className="producto-page-loading">Error: {error}</div>
      </PublicLayout>
    );

  return (
    <PublicLayout>
      <div className="producto-page">
        <div className="producto-main">
          {/* --- COLUMNA IZQUIERDA (FOTOS) --- */}
          <div className="producto-columna-izquierda">
            <div className="producto-imagen-principal">
              {isAgotado && (
                <div className="imagen-overlay-agotado">AGOTADO</div>
              )}
              <img
                src={selectedImage}
                alt={producto.nombre}
                onError={(e) => {
                  e.target.src = placeholderImg;
                }}
                style={isAgotado ? { opacity: 0.6 } : {}}
              />
            </div>
            <div className="producto-galeria-thumbnails">
              {producto.imagen_url && (
                <div
                  className={`thumbnail-item ${selectedImage === producto.imagen_url ? "active" : ""}`}
                  onClick={() => setSelectedImage(producto.imagen_url)}
                >
                  <img
                    src={producto.imagen_url}
                    alt="main"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              )}
              {producto.imagenes_secundarias?.map((img) => (
                <div
                  key={img.id}
                  className={`thumbnail-item ${selectedImage === img.imagen_url ? "active" : ""}`}
                  onClick={() => setSelectedImage(img.imagen_url)}
                >
                  <img
                    src={img.imagen_url}
                    alt="gal"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* --- COLUMNA DERECHA (INFO) --- */}
          <div className="producto-info">
            <h1>{producto.nombre.toUpperCase()}</h1>
            <p>{producto.descripcion || "Sin descripción."}</p>
            <span className="precio">
              ${Number(producto.precio_venta).toFixed(2)}
            </span>

            <p
              style={{
                fontSize: "0.9rem",
                color: isAgotado ? "red" : "#666",
                marginBottom: "10px",
              }}
            >
              Status:{" "}
              <strong>
                {isAgotado
                  ? "Agotado"
                  : `Disponible (${producto.stock_actual} un.)`}
              </strong>
            </p>

            {tallasArray.length > 0 && (
              <div className="producto-tallas-container">
                <div className="tallas-header">
                  <span className="talla-label">TALLA:</span>
                </div>
                <div className="tallas-selector">
                  {tallasArray.map((talla) => (
                    <button
                      key={talla}
                      className={`talla-box ${selectedTalla === talla ? "active" : ""}`}
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
                disabled={
                  isAgotado || (!selectedTalla && tallasArray.length > 0)
                }
                onClick={handleAddToCart}
                style={
                  isAgotado
                    ? { backgroundColor: "#ccc", cursor: "not-allowed" }
                    : {}
                }
              >
                {isAgotado
                  ? "AGOTADO"
                  : !selectedTalla && tallasArray.length > 0
                    ? "Selecciona Talla"
                    : "Añadir al Carrito"}
              </button>

              {cartItems.length > 0 && (
                <button
                  className="btn-ver-carrito"
                  onClick={() => setShowCartModal(true)}
                >
                  Ver mi Carrito ({cartCount})
                </button>
              )}
            </div>
          </div>
        </div>

        {/* --- MODAL DEL CARRITO --- */}
        {showCartModal && (
          <div className="modal-overlay">
            <div className="modal-content modal-compra">
              <button className="modal-close-x" onClick={handleCloseModal}>
                <FontAwesomeIcon icon={faTimes} />
              </button>

              <h3>
                {step === 1 ? "Tu Carrito de Compras" : "Datos de Facturación"}
              </h3>

              {/* === PASO 1: LISTA DE ITEMS === */}
              {step === 1 && (
                <>
                  <div className="carrito-lista">
                    {cartItems.length === 0 ? (
                      <p>El carrito está vacío.</p>
                    ) : (
                      cartItems.map((item) => (
                        <div key={item.uniqueId} className="carrito-item">
                          <img
                            src={item.imagen_url || placeholderImg}
                            alt="mini"
                            className="carrito-img-mini"
                          />
                          <div className="carrito-info">
                            <p className="c-nombre">{item.nombre}</p>
                            <p className="c-detalles">
                              Talla: {item.selectedTalla} | ${item.precio_venta}
                              <span
                                style={{
                                  fontWeight: "bold",
                                  color: "#238CBC",
                                  marginLeft: "8px",
                                }}
                              >
                                x{item.quantity}
                              </span>
                            </p>
                          </div>
                          <button
                            className="btn-trash"
                            onClick={() => removeFromCart(item.uniqueId, true)}
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      ))
                    )}
                  </div>

                  {cartItems.length > 0 && (
                    <div className="carrito-total">
                      <span>Total Estimado:</span>
                      <span className="total-precio">
                        ${cartTotal.toFixed(2)}
                      </span>
                    </div>
                  )}

                  <div className="modal-buttons">
                    <button
                      className="btn-primary"
                      onClick={() => setStep(2)}
                      disabled={cartItems.length === 0}
                    >
                      Procesar Pago
                    </button>
                    <button
                      className="btn-secondary"
                      onClick={handleCloseModal}
                    >
                      Seguir Comprando
                    </button>
                  </div>
                </>
              )}

              {/* === PASO 2: FORMULARIO DE INVITADO === */}
              {step === 2 && cartItems.length > 0 && (
                <div className="step-container">
                  <div className="guest-form">
                    <p className="form-note">
                      Ingresa tus datos y el comprobante para generar la orden.
                    </p>

                    <div className="form-group">
                      <label>Nombre Completo *</label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="Ej: Juan Pérez"
                        value={cliente.nombre}
                        onChange={(e) =>
                          setCliente({ ...cliente, nombre: e.target.value })
                        }
                      />
                    </div>

                    <div className="form-row">
                      <div className="form-group" style={{ flex: 1 }}>
                        {/* CAMBIO 2: Etiqueta actualizada para Telegram */}
                        <label>Número Celular*</label>
                        <input
                          type="tel"
                          className="form-input"
                          placeholder="099..."
                          value={cliente.telefono}
                          onChange={(e) =>
                            setCliente({ ...cliente, telefono: e.target.value })
                          }
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1 }}>
                        <label>Cédula de Identidad*</label>
                        <input
                          type="text"
                          className="form-input"
                          placeholder="171..."
                          value={cliente.cedula}
                          onChange={(e) =>
                            setCliente({ ...cliente, cedula: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    {/* --- NUEVO CAMPO: SUBIR COMPROBANTE --- */}
                    <div className="form-group" style={{ marginTop: "10px" }}>
                      <label>Comprobante de Pago/Transferencia(Imagen) *</label>
                      <div
                        style={{
                          border: "1px dashed #ccc",
                          padding: "10px",
                          borderRadius: "5px",
                          textAlign: "center",
                        }}
                      >
                        <input
                          type="file"
                          accept="image/*"
                          id="file-upload"
                          onChange={handleFileChange}
                          style={{ display: "none" }}
                        />
                        <label
                          htmlFor="file-upload"
                          style={{
                            cursor: "pointer",
                            color: "#238CBC",
                            display: "block",
                            width: "100%",
                          }}
                        >
                          <FontAwesomeIcon
                            icon={faUpload}
                            style={{ marginRight: "5px" }}
                          />
                          {transferFile
                            ? transferFile.name
                            : "Subir Captura / Foto"}
                        </label>
                      </div>
                    </div>

                    <div
                      className="carrito-total"
                      style={{
                        marginTop: "1rem",
                        borderTop: "1px dashed #eee",
                      }}
                    >
                      <span>Total a Pagar:</span>
                      <span className="total-precio">
                        ${cartTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <p className="modal-note">
                    Al confirmar, enviaremos tu pedido.
                  </p>

                  <div className="modal-buttons">
                    <button
                      /* CAMBIO 3: Clase y función para Telegram */
                      className="btn-primary btn-telegram-modal"
                      onClick={handleTelegramCheckout}
                      disabled={isProcessing}
                    >
                      <FontAwesomeIcon icon={faTelegram} />{" "}
                      {isProcessing ? "Procesando..." : "Confirmar Pedido"}
                    </button>

                    <button
                      className="btn-secondary"
                      onClick={() => setStep(1)}
                      disabled={isProcessing}
                    >
                      Atrás
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

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
