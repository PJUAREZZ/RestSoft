// CartContext: proporciona estado y funciones del carrito a la aplicación
// - `cart`: array de items { producto_id, nombre, precio, cantidad, ... }
// - `cartOpen`: boolean para controlar visibilidad del sidebar/carrito
// - funciones: addToCart, removeFromCart, updateQuantity, getTotal, getTotalItems, clearCart
import { createContext, useContext, useState } from 'react';

const CartContext = createContext();

export const useCart = () => {
  // Hook personalizado para acceder al contexto del carrito desde cualquier componente
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart debe usarse dentro de CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  // Estado local del carrito y visibilidad
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  // addToCart: si el producto ya existe incrementa `quantity`, sino lo agrega
  const addToCart = (product) => {
    const existingItem = cart.find(item => item.producto_id === product.producto_id);
    if (existingItem) {
      setCart(cart.map(item =>
        item.producto_id === product.producto_id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      // agregamos la propiedad `quantity` para controlar cantidades localmente
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  // removeFromCart: elimina un item del carrito por producto_id
  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.producto_id !== productId));
  };

  // updateQuantity: aumento/disminución por delta (puede ser -1 o +1)
  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.producto_id === productId) {
        const newQuantity = item.quantity + delta;
        // si la nueva cantidad es mayor a 0 la devolvemos, si no se descartará luego
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  // getTotal: suma precio * cantidad de cada item
  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.precio * item.quantity), 0);
  };

  // getTotalItems: suma de cantidades (para mostrar badge en el icono del carrito)
  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const clearCart = () => {
    setCart([]);
  };

  return (
    <CartContext.Provider value={{
      cart,
      cartOpen,
      setCartOpen,
      addToCart,
      removeFromCart,
      updateQuantity,
      getTotal,
      getTotalItems,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};
