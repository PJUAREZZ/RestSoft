import { useState, useEffect, useRef } from "react";
import { getProductIcon } from "./productIcons";
import "./Salon.css";

// Alias público para pagos (mostrar debajo del QR). Cambia por el alias real de tu cuenta.
const PAYMENT_ALIAS = 'bargrill.pago';
// URL de un QR de muestra (ficticio). Es una imagen estática que sirve sólo como ejemplo.
const SAMPLE_QR_URL = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=QR_DE_MUESTRA_FICTICIA';

export const Salon = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Treinta mesas numeradas del 1 al 30
  const initialTables = Array.from({ length: 30 }, (_, i) => ({
    id: i + 1,
    open: false,
    order: [], // items: { producto_id, nombre, precio, quantity }
    mozo: "",
    personas: 1,
    occupied: false,
    lastOrder: null,
    currentPedidoId: null,
    paid: false,
  }));

  const [tables, setTables] = useState(initialTables);
  const [activeTableId, setActiveTableId] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:8000/productos");
        if (!res.ok) throw new Error("Error al cargar productos");
        const data = await res.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const openTable = (tableId) => {
    setTables((prev) => prev.map(t => t.id === tableId ? { ...t, open: true } : t));
    setActiveTableId(tableId);
  };

  // bloquear scroll del body cuando el panel o el modal estén abiertos
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  useEffect(() => {
    const shouldBlock = !!activeTableId || showInvoiceModal;
    const prev = document.body.style.overflow;
    if (shouldBlock) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = prev; };
  }, [activeTableId, showInvoiceModal]);

  // añadir una clase al body solo mientras estamos en la página Salon
  useEffect(() => {
    document.body.classList.add('salon-page');
    return () => {
      document.body.classList.remove('salon-page');
    };
  }, []);

  // estado UI para categorias colapsadas
  const [collapsed, setCollapsed] = useState({ pizza: true, sandwich: true, wrap: false });

  const toggleCategory = (cat) => {
    setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const closeSidebar = () => {
    setActiveTableId(null);
  };

  const addProductToTable = (product) => {
    if (!activeTableId) return;
    setTables((prev) => prev.map(t => {
      if (t.id !== activeTableId) return t;
      const existing = t.order.find(it => it.producto_id === product.producto_id);
      if (existing) {
        return {
          ...t,
          order: t.order.map(it => it.producto_id === product.producto_id ? { ...it, quantity: it.quantity + 1 } : it)
        };
      }
      return { ...t, order: [...t.order, { ...product, quantity: 1 }] };
    }));
  };

  const updateTableField = (tableId, field, value) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, [field]: value } : t));
    // limpiar error visual al editar el nombre del mozo
    if (field === 'mozo' && String(value || '').trim().length > 0) {
      setSendError(null);
      try { setMozoError(false); } catch (e) {}
    }
  };

  const [invoiceInfo, setInvoiceInfo] = useState(null);
  const [sendError, setSendError] = useState(null);
  const mozoRef = useRef(null);
  const [mozoError, setMozoError] = useState(false);
  // Modal para confirmar que el pedido fue enviado (pequeño resumen)
  const [showSentModal, setShowSentModal] = useState(false);
  const [sentInfo, setSentInfo] = useState(null);

  // Modal de vista previa de la cuenta antes de sacarla
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewInfo, setPreviewInfo] = useState(null);
  // Modal simple que indica que la cuenta fue generada
  const [showGeneratedModal, setShowGeneratedModal] = useState(false);
  const [generatedInfo, setGeneratedInfo] = useState(null);

  const sendOrderToBackend = async (tableId, { showInvoice = false } = {}) => {
    const table = tableById(tableId);
    if (!table || table.order.length === 0) return { ok: false, message: 'No hay items' };
    // Validación: el nombre del mozo es obligatorio para pedidos de salón
    if (!table.mozo || String(table.mozo).trim().length === 0) {
      return { ok: false, message: 'Debe completar el nombre del mozo antes de enviar el pedido' };
    }

    const detalles = table.order.map(it => ({ producto_id: it.producto_id, cantidad: it.quantity }));

    const payload = {
      nombre_cliente: `Mesa ${tableId}`,
      direccion: `Mozo: ${table.mozo || ''} | Personas: ${table.personas || ''}`,
      detalles,
      origen: 'salon',
      // Enviamos metadatos explícitos para que el backend guarde mesa/mozo/personas
      mesa: tableId,
      mozo: table.mozo || '',
      personas: table.personas || 1,
    };

    try {
      const res = await fetch('http://localhost:8000/pedidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        return { ok: false, message: text || 'Error en servidor' };
      }
      const data = await res.json();
      // data contiene pedido_id y total
      // marcar mesa como ocupada y guardar lastOrder (para mostrar factura), guardar pedido_id
      setTables(prev => prev.map(t => t.id === tableId ? { ...t, occupied: true, lastOrder: t.order, order: [], currentPedidoId: data.pedido_id } : t));
      // cerrar panel
      setActiveTableId(null);
      // Si se quiere mostrar la factura se lo indicamos al usuario
      if (showInvoice) {
        // intentar recuperar metadata (fecha, items) desde la API para mostrar en la factura
        let meta = { fecha: null, items: [] };
        try {
          meta = await fetchPedidoMetadata(data.pedido_id);
        } catch (e) {
          // si falla, seguimos con lo que tenemos en cliente
        }
        const itemsFromMeta = (meta.items && meta.items.length > 0) ? meta.items : table.order;
        setInvoiceInfo({ pedido_id: data.pedido_id, total: data.total, items: itemsFromMeta, tableId, fecha: meta.fecha || null });
        setShowInvoiceModal(true);
      }
      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  };

  const updateQuantity = (tableId, productId, delta) => {
    setTables((prev) => prev.map(t => {
      if (t.id !== tableId) return t;
      const updated = t.order.map(it => it.producto_id === productId ? { ...it, quantity: it.quantity + delta } : it).filter(it => it.quantity > 0);
      return { ...t, order: updated };
    }));
  };

  const tableById = (id) => tables.find(t => t.id === id);

  // Recupera metadatos de un pedido (fecha, items) desde la API
  const fetchPedidoMetadata = async (pedidoId) => {
    try {
      // Primero intentamos obtener desde pedidos_salon (contiene fecha y items)
      const res = await fetch('http://localhost:8000/pedidos_salon');
      if (res.ok) {
        const data = await res.json();
        const row = data.find(r => Number(r.pedido_id) === Number(pedidoId));
        if (row) {
          return { fecha: row.fecha, items: row.items || [] };
        }
      }
    } catch (e) {
      // ignore and fallback
    }

    try {
      // Fallback: obtener desde /pedidos y buscar fecha_pedido
      const res2 = await fetch('http://localhost:8000/pedidos');
      if (res2.ok) {
        const pedidos = await res2.json();
        const p = pedidos.find(x => Number(x.pedido_id) === Number(pedidoId));
        if (p) return { fecha: p.fecha_pedido, items: p.items || [] };
      }
    } catch (e) {
      // ignore
    }
    return { fecha: null, items: [] };
  };

  return (
    <section id="salon" className="salon-section">
      <div className="salon-container">
        <h2 className="section-title">Salón - Mesas</h2>

        <div className="tables-and-sidebar">
          <div className="tables-grid">
            {tables.map((table) => (
              <div
                key={table.id}
                className={`table-card ${(table.occupied || table.order.length > 0) ? 'table-card--occupied' : ''} ${table.paid ? 'table-card--paid' : ''}`}
                onClick={() => openTable(table.id)}
                title={table.order.length > 0 ? 'Con pedidos' : 'Sin pedidos'}
              >
                <div className="table-number">{table.id}</div>
                <div className="table-status">{table.order.length > 0 ? `${table.order.length} items` : 'Libre'}</div>
              </div>
            ))}
          </div>

          {/* Sidebar derecho con productos y acciones para la mesa activa */}
          {/* Overlay (fondo gris) */}
          {activeTableId && <div className="salon-overlay" onClick={closeSidebar} />}

          <div className={`salon-sidebar ${activeTableId ? 'open' : ''}`}>
            <div className="sidebar-header">
              <h3>Detalle Mesa {activeTableId ?? ''}</h3>
              <button className="close-btn" onClick={closeSidebar}>✕</button>
            </div>

            {!activeTableId && (
              <div className="sidebar-empty">Selecciona una mesa para abrir el panel y agregar productos</div>
            )}

            {activeTableId && (
              <div className="sidebar-body">
                <div className="products-list">
                  <h4>Datos de la Mesa</h4>
                  <div className="table-inputs">
                                    <label>
                                      Mozo:
                                      <input ref={mozoRef} className={mozoError ? 'input-error' : ''} type="text" value={tableById(activeTableId).mozo} onChange={(e) => updateTableField(activeTableId, 'mozo', e.target.value)} />
                                      {mozoError && <div className="field-error">Debe completar el nombre del mozo</div>}
                                    </label>
                    <label>
                      Personas:
                      <input type="number" min={1} value={tableById(activeTableId).personas} onChange={(e) => updateTableField(activeTableId, 'personas', Number(e.target.value))} />
                    </label>
                  </div>

                  <h4>Productos</h4>
                  {/* Banner de error si falta el nombre del mozo al intentar enviar */}
                  {sendError && (
                    <div className="send-error" role="alert">
                      {sendError}
                    </div>
                  )}
                  {loading && <p>Cargando productos...</p>}
                  {error && <p className="error">Error: {error}</p>}
                  {!loading && !error && (
                    <div className="products-scroll">
                      {['pizza','sandwich','wrap'].map(cat => (
                        <div key={cat} className="category-block">
                          <div className="category-header">
                            <button className="cat-toggle" onClick={() => toggleCategory(cat)}>{collapsed[cat] ? '+' : '-'}</button>
                            <strong className="cat-title">{cat.charAt(0).toUpperCase() + cat.slice(1)}</strong>
                          </div>
                              {!collapsed[cat] && (
                                <div className="category-items">
                                  {products.filter(p => p.categoria === cat).map(p => (
                                    <div key={p.producto_id} className="product-row product-card-lg">
                                      <div className="p-left">
                                        <div className="p-icon">{getProductIcon(p.categoria, p.nombre, 36)}</div>
                                        <div className="p-info">
                                          <div className="p-name">{p.nombre}</div>
                                          <div className="p-desc">{p.descripcion}</div>
                                          <div className="p-price">${p.precio.toLocaleString()}</div>
                                        </div>
                                      </div>
                                      <div className="p-actions">
                                        <button className="add-btn" onClick={() => addProductToTable(p)}>+</button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="order-list">
                  <h4>Pedido Mesa {activeTableId}</h4>
                  {tableById(activeTableId).order.length === 0 && <p>Sin productos agregados</p>}
                  {tableById(activeTableId).order.map(item => (
                    <div className="order-row" key={item.producto_id}>
                      <div className="order-left">
                        <div className="order-name">{item.nombre}</div>
                        <div className="order-price">${item.precio.toLocaleString()}</div>
                      </div>
                      <div className="order-qty">
                        <button onClick={() => updateQuantity(activeTableId, item.producto_id, -1)}>-</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQuantity(activeTableId, item.producto_id, +1)}>+</button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="order-actions">
                    {/* Si la cuenta ya fue generada para esta mesa, mostramos botón para cerrar la mesa */}
                    {tableById(activeTableId).paid && (
                      <div className="paid-actions">
                        <button
                          className="danger-btn"
                          onClick={() => {
                            // Cerrar mesa localmente
                            setTables(prev => prev.map(t => t.id === activeTableId ? { ...t, occupied: false, lastOrder: null, currentPedidoId: null, paid: false, order: [] } : t));
                            setActiveTableId(null);
                          }}
                        >Cuenta pagada / Cerrar mesa</button>
                      </div>
                    )}
                  <div className="two-buttons">
                    <button
                      className="primary-btn"
                      disabled={tableById(activeTableId).order.length === 0}
                      onClick={async () => {
                        const table = tableById(activeTableId);
                        const currentOrder = table ? table.order : [];
                        // validación cliente: el nombre del mozo es obligatorio
                        if (!table?.mozo || String(table.mozo).trim().length === 0) {
                          const msg = 'Debe completar el nombre del mozo antes de enviar el pedido';
                          setSendError(msg);
                          setMozoError(true);
                          try { mozoRef.current?.focus(); } catch (e) {}
                          return;
                        }
                        const res = await sendOrderToBackend(activeTableId, { showInvoice: false });
                        if (!res.ok) {
                          // mostrar cartel visual y poner foco en el input Mozo si corresponde
                          setSendError(res.message || 'Error al enviar pedido');
                          try { mozoRef.current?.focus(); } catch (e) {}
                          return;
                        }
                        setSendError(null);
                        const totalLocal = res.data?.total ?? (currentOrder.reduce((s, it) => s + (it.precio || 0) * (it.quantity || 0), 0));
                        setSentInfo({ pedido_id: res.data?.pedido_id, items: currentOrder, total: totalLocal, tableId: activeTableId });
                        setShowSentModal(true);
                      }}
                    >
                      Enviar pedido
                    </button>

                    <button
                      className="secondary-btn"
                      // permitir sacar la cuenta si hay items en el pedido actual o si existe un lastOrder (pedido ya enviado)
                      disabled={(tableById(activeTableId).order.length === 0) && !tableById(activeTableId).lastOrder}
                      onClick={async () => {
                        // abrir vista previa de la cuenta antes de confirmar
                        const table = tableById(activeTableId);
                        // si no hay order en curso, usamos el lastOrder (pedido previamente enviado)
                        const items = (table && table.order && table.order.length > 0) ? table.order : (table?.lastOrder || []);
                        const totalPreview = items.reduce((s, it) => s + (it.precio || 0) * (it.quantity || 0), 0);
                        setPreviewInfo({ tableId: activeTableId, items, mozo: table?.mozo, personas: table?.personas, total: totalPreview, timestamp: new Date().toISOString(), alias: PAYMENT_ALIAS });
                        setShowPreviewModal(true);
                      }}
                    >
                      Sacar la cuenta
                    </button>
                  </div>

                  {invoiceInfo && (
                    <div className="invoice-box">
                      <strong>Factura (Pedido #{invoiceInfo.pedido_id})</strong>
                      <div>Total: ${invoiceInfo.total?.toLocaleString()}</div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Modal de factura imprimible */}
      {showInvoiceModal && invoiceInfo && (
        <div className="invoice-modal-overlay" onClick={() => setShowInvoiceModal(false)}>
          <div className="invoice-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Factura - Pedido #{invoiceInfo.pedido_id}</h3>
            <div className="invoice-body">
              <p><strong>Mesa:</strong> {invoiceInfo.tableId ? `Mesa ${invoiceInfo.tableId}` : ''}</p>
              <p><strong>Fecha:</strong> {invoiceInfo.fecha ? new Date(invoiceInfo.fecha).toLocaleString() : ''}</p>
              <p><strong>Total:</strong> ${invoiceInfo.total?.toLocaleString()}</p>
              <div className="invoice-items">
                {invoiceInfo.items && invoiceInfo.items.map(it => (
                  <div key={it.producto_id} className="invoice-item">
                    <span>{it.nombre}</span>
                    <span>{it.quantity} x ${it.precio.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="invoice-actions">
              <button onClick={() => {
                // imprimir: abrimos nueva ventana con contenido simple
                const w = window.open('', '_blank');
                const html = `
                  <html>
                    <head><title>Factura #${invoiceInfo.pedido_id}</title></head>
                    <body>
                      <h2>Factura - Pedido #${invoiceInfo.pedido_id}</h2>
                      <div>Total: $${invoiceInfo.total?.toLocaleString()}</div>
                      <hr/>
                      ${invoiceInfo.items ? invoiceInfo.items.map(i => `<div>${i.nombre} - ${i.quantity} x $${i.precio}</div>`).join('') : ''}
                    </body>
                  </html>
                `;
                w.document.write(html);
                w.document.close();
                w.focus();
                w.print();
              }}>Reimprimir cuenta</button>

              <button onClick={async () => {
                // Cerrar cuenta: llamamos al backend para borrar el pedido y liberamos la mesa
                try {
                  if (invoiceInfo && invoiceInfo.pedido_id) {
                    const res = await fetch(`http://localhost:8000/pedidos/${invoiceInfo.pedido_id}`, { method: 'DELETE' });
                    // ignoramos el resultado si falla, pero procedemos a liberar mesa localmente
                  }
                } catch (e) {
                  // no bloquear por errores de red
                }
                setTables(prev => prev.map(t => t.currentPedidoId === invoiceInfo.pedido_id ? { ...t, occupied: false, lastOrder: null, currentPedidoId: null } : t));
                setShowInvoiceModal(false);
                setInvoiceInfo(null);
              }}>Cerrar cuenta</button>

              <button onClick={() => setShowInvoiceModal(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}
      {/* Modal breve que confirma que el pedido fue enviado */}
      {showSentModal && sentInfo && (
        <div className="invoice-modal-overlay" onClick={() => setShowSentModal(false)}>
          <div className="invoice-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Pedido enviado ✅</h3>
            <div className="invoice-body">
              <p><strong>Mesa:</strong> {sentInfo.tableId ? `Mesa ${sentInfo.tableId}` : ''}</p>
              <div className="invoice-items">
                {sentInfo.items && sentInfo.items.map(it => (
                  <div key={it.producto_id} className="invoice-item">
                    <span>{it.nombre}</span>
                    <span>{it.quantity} x ${it.precio?.toLocaleString?.()}</span>
                  </div>
                ))}
              </div>
              <div><strong>Total:</strong> ${sentInfo.total?.toLocaleString?.()}</div>
            </div>
            <div className="invoice-actions">
              <button onClick={() => setShowSentModal(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal simple que indica que la cuenta fue generada correctamente */}
      {showGeneratedModal && generatedInfo && (
        <div className="invoice-modal-overlay" onClick={() => setShowGeneratedModal(false)}>
          <div className="invoice-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Cuenta generada ✅</h3>
            <div className="invoice-body">
              <p>Se generó la cuenta para <strong>Mesa {generatedInfo.tableId}</strong></p>
              <p><strong>Total:</strong> ${generatedInfo.total?.toLocaleString?.() ?? '0'}</p>
            </div>
            <div className="invoice-actions">
              <button onClick={() => setShowGeneratedModal(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de vista previa antes de sacar la cuenta */}
      {showPreviewModal && previewInfo && (
        <div className="invoice-modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div className="invoice-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Vista previa de la cuenta</h3>
            <div className="invoice-body">
              <p><strong>Mesa:</strong> {previewInfo.tableId ? `Mesa ${previewInfo.tableId}` : ''}</p>
              <p><strong>Mozo:</strong> {previewInfo.mozo || '-'}</p>
              <p><strong>Personas:</strong> {previewInfo.personas ?? '-'}</p>
              <hr />
              <div className="invoice-items">
                {previewInfo.items && previewInfo.items.map(it => (
                  <div key={it.producto_id} className="invoice-item">
                    <span>{it.nombre}</span>
                    <span>{it.quantity} x ${it.precio?.toLocaleString?.()}</span>
                  </div>
                ))}
              </div>
              <hr />
              <div><strong>Total aprox:</strong> ${previewInfo.total?.toLocaleString?.()}</div>

              {/* Información adicional solicitada: hora, QR y alias */}
              <div style={{marginTop: '0.75rem'}}>
                <p><strong>Hora:</strong> {previewInfo.timestamp ? new Date(previewInfo.timestamp).toLocaleString() : ''}</p>
                <div className="payment-qr">
                  {/* Generamos un QR con un payload legible para el cliente; puedes cambiar el formato a uno que acepte tu pasarela */}
                  {previewInfo.total !== undefined && (
                    // mostramos un QR de muestra estático (ficticio) en lugar de uno dinámico
                    <img alt="QR de muestra" src={SAMPLE_QR_URL} />
                  )}
                  <div className="payment-alias">Alias: {previewInfo.alias}</div>
                </div>
              </div>
            </div>
                <div className="invoice-actions">
              <button onClick={() => setShowPreviewModal(false)}>Cancelar</button>
              <button onClick={() => {
                // Simplificamos: al confirmar generamos la cuenta localmente
                // Marcamos la mesa como "paid" y guardamos el último pedido si no existe
                const table = tableById(previewInfo.tableId);
                setTables(prev => prev.map(t => {
                  if (t.id !== previewInfo.tableId) return t;
                  const last = (t.lastOrder && t.lastOrder.length > 0) ? t.lastOrder : (previewInfo.items && previewInfo.items.length > 0 ? previewInfo.items : t.order);
                  return { ...t, occupied: true, lastOrder: last, order: [], paid: true };
                }));
                setGeneratedInfo({ tableId: previewInfo.tableId, total: previewInfo.total });
                setShowGeneratedModal(true);
                setShowPreviewModal(false);
              }}>Confirmar y generar cuenta</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Salon;
