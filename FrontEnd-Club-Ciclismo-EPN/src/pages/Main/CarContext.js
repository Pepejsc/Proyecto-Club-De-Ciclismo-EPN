import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const savedCart = localStorage.getItem('epn_cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error("Error al cargar carrito:", error);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('epn_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // =================================================================
  // FUNCIÓN AGREGAR AL CARRITO (VERSIÓN ROBUSTA)
  // =================================================================
  const addToCart = (product, talla) => {
    // 1. Normalizar datos para evitar errores de comparación
    // Convertimos IDs a String y limpiamos espacios en la talla
    const tallaNormalizada = talla ? String(talla).trim() : "unico";
    const idProducto = product.id_recurso || product.id; // Busca cualquiera de los dos IDs

    if (!idProducto) {
        console.error("Error: Intentando agregar producto sin ID", product);
        return;
    }

    console.log(`🛒 Agregando: ID=${idProducto} | Talla=${tallaNormalizada}`);

    setCartItems((prevItems) => {
      // 2. Buscamos si YA existe este producto exacto (Mismo ID + Misma Talla)
      const existingItemIndex = prevItems.findIndex(item => {
         const itemId = item.id_recurso || item.id;
         const itemTalla = item.selectedTalla ? String(item.selectedTalla).trim() : "unico";
         
         // Comparación flexible (convierte números a texto para comparar '33' con 33)
         return String(itemId) === String(idProducto) && itemTalla === tallaNormalizada;
      });

      if (existingItemIndex > -1) {
        // --- CASO A: YA EXISTE -> SUMAMOS CANTIDAD ---
        console.log("✅ Producto encontrado en carrito. Aumentando cantidad.");
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += 1;
        return newItems;
      } else {
        // --- CASO B: NO EXISTE -> CREAMOS FILA NUEVA ---
        console.log("➕ Producto nuevo. Creando fila.");
        const newItem = {
          ...product,
          id_recurso: idProducto, // Estandarizamos el ID
          selectedTalla: tallaNormalizada,
          uniqueId: `${idProducto}-${tallaNormalizada}`, // ID único para borrar luego
          quantity: 1
        };
        return [...prevItems, newItem];
      }
    });
  };

  // =================================================================
  // FUNCIÓN ELIMINAR / RESTAR
  // =================================================================
  const removeFromCart = (uniqueId, removeAll = false) => {
    setCartItems((prevItems) => {
      if (removeAll) {
         // Borrar toda la fila (papelera roja)
         return prevItems.filter(item => item.uniqueId !== uniqueId);
      }

      // Restar 1 (si llegara a implementarse botón menos)
      return prevItems.map(item => {
        if (item.uniqueId === uniqueId) {
          return { ...item, quantity: item.quantity - 1 };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const clearCart = () => {
    setCartItems([]);
    localStorage.removeItem('epn_cart');
  };

  // Totales
  const cartTotal = cartItems.reduce((total, item) => total + (parseFloat(item.precio_venta) * item.quantity), 0);
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  // Verificar Stock en Carrito
  const getQuantityInCart = (recursoId) => {
    return cartItems
      .filter(item => String(item.id_recurso || item.id) === String(recursoId))
      .reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    clearCart,
    cartTotal,
    cartCount,
    getQuantityInCart
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};