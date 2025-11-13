// `Cart.jsx` - componente que muestra el carrito en un sidebar.
// - Usa `useCart()` para leer estado y acciones del carrito (contexto global).
// - Permite cambiar cantidades, eliminar items y realizar el checkout.
import { useState } from 'react';
import { useCart } from './CartContext';
import { getProductIcon } from './productIcons';
import './Cart.css';

export const Cart = () => {
  // Extraemos funciones y estado del contexto del carrito
  const {
    cart,
    cartOpen,
    setCartOpen,
    removeFromCart,
    updateQuantity,
    getTotal,
    clearCart
  } = useCart();

  // Estado local para manejar el modal de checkout y formulario
  const [showCheckout, setShowCheckout] = useState(false);
  const [checkoutData, setCheckoutData] = useState({ nombre_cliente: '', direccion: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCheckout = async (e) => {
    e.preventDefault();
    
    if (!checkoutData.nombre_cliente || !checkoutData.direccion) {
      alert('Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Preparar los datos para la API
      // Construir objeto pedido con formato esperado por la API backend
      const pedido = {
        nombre_cliente: checkoutData.nombre_cliente,
        direccion: checkoutData.direccion,
        detalles: cart.map(item => ({ producto_id: item.producto_id, cantidad: item.quantity }))
      };

      // Enviar a la API
      const response = await fetch('http://localhost:8000/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pedido)
      });

      if (!response.ok) throw new Error('Error al procesar el pedido');
      const result = await response.json();

      // Mensaje de éxito (puedes reemplazar alert por un toast más elegante)
      alert(`¡Pedido realizado exitosamente! 🎉\nNúmero de pedido: ${result.pedido_id}\nTotal: $${result.total.toLocaleString()}`);

      // Limpiar estado local y global del carrito
      clearCart();
      setShowCheckout(false);
      setCartOpen(false);
      setCheckoutData({ nombre_cliente: '', direccion: '' });

    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Si el carrito está cerrado no renderizamos nada
  if (!cartOpen) return null;

  return (
    <div className="cart-overlay">
      <div className="cart-backdrop" onClick={() => setCartOpen(false)} />
      
      <div className="cart-sidebar">
        <div className="cart-header">
          <h2 className="cart-title">Tu Carrito</h2>
          <button onClick={() => setCartOpen(false)} className="close-cart-btn">
            ✕
          </button>
        </div>

        <div className="cart-content">
          {cart.length === 0 ? (
            <div className="cart-empty">
              <div className="cart-empty-icon">🛒</div>
              <p className="cart-empty-text">Tu carrito está vacío</p>
            </div>
          ) : (
            <div className="cart-items">
              {cart.map(item => (
                <div key={item.producto_id} className="cart-item">
                  <div className="cart-item-header">
                    <div className="cart-item-info">
                      <div className="cart-item-icon">
                        {getProductIcon(item.categoria, item.nombre, 28)}
                      </div>
                      <div>
                        <h3 className="cart-item-name">{item.nombre}</h3>
                        <p className="cart-item-price">
                          ${item.precio.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.producto_id)}
                      className="remove-item-btn"
                      title="Eliminar"
                    >
                      🗑️
                    </button>
                  </div>
                  
                  <div className="cart-item-footer">
                    <div className="quantity-controls">
                      <button
                        onClick={() => updateQuantity(item.producto_id, -1)}
                        className="quantity-btn"
                      >
                        −
                      </button>
                      <span className="quantity-value">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.producto_id, 1)}
                        className="quantity-btn"
                      >
                        +
                      </button>
                    </div>
                    <span className="cart-item-total">
                      ${(item.precio * item.quantity).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {cart.length > 0 && !showCheckout && (
          <div className="cart-footer">
            <div className="cart-total">
              <span>Total:</span>
              <span className="cart-total-amount">
                ${getTotal().toLocaleString()}
              </span>
            </div>
            <button 
              className="checkout-btn"
              onClick={() => setShowCheckout(true)}
            >
              Finalizar Compra
            </button>
          </div>
        )}

        {/* Modal de Checkout */}
        {showCheckout && (
          <div className="checkout-modal">
            <h3 className="checkout-title">Datos de Entrega</h3>
            
            {error && (
              <div className="checkout-error">
                {error}
              </div>
            )}

            <form onSubmit={handleCheckout} className="checkout-form">
              <div className="form-group">
                <label htmlFor="nombre">Nombre Completo:</label>
                <input
                  type="text"
                  id="nombre"
                  value={checkoutData.nombre_cliente}
                  onChange={(e) => setCheckoutData({
                    ...checkoutData,
                    nombre_cliente: e.target.value
                  })}
                  placeholder="Juan Pérez"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="direccion">Dirección:</label>
                <textarea
                  id="direccion"
                  value={checkoutData.direccion}
                  onChange={(e) => setCheckoutData({
                    ...checkoutData,
                    direccion: e.target.value
                  })}
                  placeholder="Av. Aconquija 1234, San Miguel de Tucumán"
                  rows="3"
                  required
                />
              </div>

              <div className="checkout-summary">
                <div className="summary-row">
                  <span>Subtotal:</span>
                  <span>${getTotal().toLocaleString()}</span>
                </div>
                <div className="summary-row total">
                  <span>Total:</span>
                  <span>${getTotal().toLocaleString()}</span>
                </div>
              </div>

              <div className="checkout-actions">
                <button
                  type="button"
                  onClick={() => setShowCheckout(false)}
                  className="cancel-btn"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="confirm-btn"
                  disabled={loading}
                >
                  {loading ? 'Procesando...' : 'Confirmar Pedido'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};