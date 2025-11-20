import React, { createContext, useState, useContext, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  return useContext(CartContext);
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    const savedCart = localStorage.getItem('epn_cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('epn_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  // --- (MODIFICADO) Lógica de Agrupación ---
  const addToCart = (product, talla) => {
    setCartItems((prevItems) => {
      // Buscamos si ya existe el mismo producto con la misma talla
      const existingItemIndex = prevItems.findIndex(
        item => item.id_recurso === product.id_recurso && item.selectedTalla === talla
      );

      if (existingItemIndex > -1) {
        // Si existe, creamos una copia y aumentamos la cantidad
        const newItems = [...prevItems];
        newItems[existingItemIndex].quantity += 1;
        return newItems;
      } else {
        // Si no existe, lo añadimos con cantidad 1
        const newItem = {
          ...product,
          uniqueId: `${product.id_recurso}-${talla}`, // ID único combinado
          selectedTalla: talla,
          quantity: 1 // Empezamos en 1
        };
        return [...prevItems, newItem];
      }
    });
  };

  // --- (MODIFICADO) Eliminar o Restar ---
  const removeFromCart = (uniqueId, removeAll = false) => {
    setCartItems((prevItems) => {
      if (removeAll) {
         return prevItems.filter(item => item.uniqueId !== uniqueId);
      }

      return prevItems.map(item => {
        if (item.uniqueId === uniqueId) {
          // Si queda 1 y restamos, se borra. Si no, restamos 1.
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

  // Calcular total ($)
  const cartTotal = cartItems.reduce((total, item) => total + (parseFloat(item.precio_venta) * item.quantity), 0);
  
  // Calcular total de items (cantidad)
  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  // --- (NUEVO) Función para verificar stock en el carrito ---
  // Devuelve cuántos items de este ID ya tengo en el carrito
  const getQuantityInCart = (recursoId) => {
    return cartItems
      .filter(item => item.id_recurso === recursoId)
      .reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    clearCart,
    cartTotal,
    cartCount,
    getQuantityInCart // Exportamos esta función útil
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};