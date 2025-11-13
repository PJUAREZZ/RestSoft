import { useState, useEffect } from 'react';
import './MiPedido.css';

export const MiPedido = () => {
  const [pedido, setPedido] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar el último pedido al montar el componente
  useEffect(() => {
    fetchUltimoPedido();
  }, []);

  const fetchUltimoPedido = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:8000/pedidos');
      
      if (!response.ok) {
        throw new Error('Error al cargar el pedido');
      }
      
      const data = await response.json();
      
      // Obtener el último pedido (el de mayor ID o fecha más reciente)
      if (data.length > 0) {
        const ultimoPedido = data.reduce((prev, current) => {
          return (prev.pedido_id > current.pedido_id) ? prev : current;
        });
        setPedido(ultimoPedido);
      } else {
        setPedido(null);
      }
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const cancelarPedido = async () => {
    if (!confirm('¿Estás seguro de que deseas cancelar este pedido?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:8000/pedidos/${pedido.pedido_id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Error al cancelar el pedido');
      }

      const result = await response.json();
      alert(result.mensaje + ' ✅');

      // Actualizar para cargar el nuevo "último pedido"
      fetchUltimoPedido();
    } catch (err) {
      alert('Error: ' + err.message);
      console.error('Error:', err);
    }
  };

  if (loading) {
    return (
      <section id="mi-pedido" className="mi-pedido-section">
        <div className="container">
          <h2 className="section-title">Mi Pedido</h2>
          <div className="loading">
            <div className="spinner"></div>
            <p>Cargando tu pedido...</p>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section id="mi-pedido" className="mi-pedido-section">
        <div className="container">
          <h2 className="section-title">Mi Pedido</h2>
          <div className="error">
            <p>Error: {error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="mi-pedido" className="mi-pedido-section">
      <div className="container">
        <h2 className="section-title">Mi Pedido</h2>
        
        {!pedido ? (
          <div className="empty-state">
            <div className="empty-icon">📦</div>
            <h3>No tienes pedidos realizados</h3>
            <p>Realiza tu primer pedido desde nuestro menú</p>
            <a href="#menu" className="menu-link-btn">
              Ver Menú
            </a>
          </div>
        ) : (
          <div className="pedido-wrapper">
            <div className="pedido-card">
              {/* Header del pedido */}
              <div className="pedido-header">
                <div className="pedido-badge">
                  <span className="badge-icon">✓</span>
                  <span className="badge-text">Pedido Confirmado</span>
                </div>
                <div className="pedido-info">
                  <h3 className="pedido-numero">Pedido #{pedido.pedido_id}</h3>
                  <span className="pedido-fecha">
                    {new Date(pedido.fecha_pedido).toLocaleDateString('es-AR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              </div>

              {/* Datos del cliente */}
              <div className="pedido-cliente">
                <h4 className="seccion-titulo">Datos de Entrega</h4>
                <div className="cliente-info">
                  <div className="cliente-row">
                    <span className="icon">👤</span>
                    <div>
                      <span className="label">Cliente</span>
                      <span className="value">{pedido.nombre_cliente}</span>
                    </div>
                  </div>
                  <div className="cliente-row">
                    <span className="icon">📍</span>
                    <div>
                      <span className="label">Dirección</span>
                      <span className="value">{pedido.direccion}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Items del pedido */}
              {pedido.items && pedido.items.length > 0 && (
                <div className="pedido-items">
                  <h4 className="seccion-titulo">Tu Pedido</h4>
                  <div className="items-list">
                    {pedido.items.map((item, index) => (
                      <div key={index} className="item-row">
                        <div className="item-left">
                          <span className="item-emoji">
                            {item.categoria === 'pizza' ? '🍕' : 
                             item.categoria === 'sandwich' ? '🥪' : '🌯'}
                          </span>
                          <div className="item-details">
                            <span className="item-nombre">{item.nombre}</span>
                            <span className="item-cantidad">
                              Cantidad: {item.cantidad}
                            </span>
                          </div>
                        </div>
                        <span className="item-precio">
                          ${(item.precio_unitario * item.cantidad).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Total y acción */}
              <div className="pedido-footer">
                <div className="total-container">
                  <div className="total-row">
                    <span className="total-label">Subtotal</span>
                    <span className="total-value">${pedido.total.toLocaleString()}</span>
                  </div>
                  <div className="total-row total-final">
                    <span className="total-label">Total a Pagar</span>
                    <span className="total-amount">${pedido.total.toLocaleString()}</span>
                  </div>
                </div>
                
                <button
                  onClick={cancelarPedido}
                  className="cancel-pedido-btn"
                >
                  <span className="btn-icon">✕</span>
                  Cancelar Pedido
                </button>
              </div>
            </div>

            {/* Info adicional */}
            <div className="info-card">
              <h4>Estado del Pedido</h4>
              <div className="estado-timeline">
                <div className="timeline-step completed">
                  <span className="step-icon">✓</span>
                  <span className="step-text">Pedido Recibido</span>
                </div>
                <div className="timeline-step completed">
                  <span className="step-icon">✓</span>
                  <span className="step-text">En Preparación</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};