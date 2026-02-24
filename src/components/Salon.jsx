// ============================================================
// Salon.jsx — MÓDULO CENTRAL DE PEDIDOS
// ============================================================
// Maneja los tres modos de pedido del sistema:
//
//   🍽️  SALÓN    → grilla de mesas con sidebar por mesa
//   🚗  DELIVERY → lista de pedidos + formulario de nuevo pedido
//   ☕  MOSTRADOR → lista de pedidos + formulario de nuevo pedido
//
// Flujo general:
//   1. Carga productos y empleados desde el backend al montar
//   2. Usuario selecciona modo (salon/delivery/mostrador)
//   3. Abre formulario o sidebar → agrega productos con comentarios opcionales
//   4. Envía pedido → POST /pedidos al backend
//   5. Para salon: muestra modales de confirmación, cuenta y factura
//
// Props:
//   currentUser → objeto del usuario logueado (para el campo cargado_por)
// ============================================================

import { useState, useEffect, useRef } from "react";
import { getProductIcon } from "./productIcons"; // emoji por categoría
import { Pizza, Cookie, Settings } from "lucide-react";
import { ConfigurarMesas } from "./ConfigurarMesas"; // modal para cambiar cantidad de mesas
import "./Salon.css";

// Alias de pago que se muestra en el QR de la cuenta
const PAYMENT_ALIAS = 'restsoft.pago';

// URL que genera un QR de muestra (API pública, no requiere auth)
const SAMPLE_QR_URL = 'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=QR_DE_MUESTRA_FICTICIA';

export const Salon = ({ currentUser }) => {

  // ── PRODUCTOS Y EMPLEADOS ─────────────────────────────────
  const [products, setProducts]   = useState([]); // todos los productos del backend
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [employees, setEmployees] = useState([]); // para el selector de mozo/camarero

  // ── CONFIGURACIÓN DE MESAS ────────────────────────────────
  // Cantidad de mesas — persiste en localStorage para no perderse al recargar
  const [tablasCount, setTablasCount] = useState(() => {
    try {
      const saved = localStorage.getItem('mesasCount');
      return saved ? parseInt(saved) : 30;
    } catch (e) { return 30; }
  });

  // Genera el array inicial de mesas con sus propiedades
  const createTables = (count) =>
    Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      open: false,           // sidebar abierto
      order: [],             // productos en el pedido actual
      mozo: "",              // mozo asignado
      personas: 1,           // cantidad de personas
      occupied: false,       // tiene un pedido enviado al backend
      lastOrder: null,       // último pedido enviado (para la cuenta)
      currentPedidoId: null, // ID del pedido activo en backend
      paid: false,           // cuenta generada
    }));

  const [tables, setTables]           = useState(createTables(tablasCount));
  const [activeTableId, setActiveTableId] = useState(null); // mesa con sidebar abierto

  // ── MODO ACTIVO ───────────────────────────────────────────
  // 'salon' | 'delivery' | 'mostrador'
  const [mode, setMode] = useState('salon');

  // ── MODALES Y OVERLAYS ────────────────────────────────────
  const [showConfigMesas, setShowConfigMesas]       = useState(false); // modal configurar mesas
  const [showProductsModal, setShowProductsModal]   = useState(false); // modal de menú de productos
  const [productsModalContext, setProductsModalContext] = useState(null); // 'table'|'delivery'|'mostrador'

  // ── COMENTARIOS POR PRODUCTO ──────────────────────────────
  // Objeto { producto_id: "comentario" } — se limpia al cerrar el modal
  const [productComments, setProductComments] = useState({});

  // ── ESTADO DELIVERY ───────────────────────────────────────
  const [activeDeliveryOrder, setActiveDeliveryOrder] = useState(false); // sidebar delivery abierto
  const [deliveryFormData, setDeliveryFormData] = useState({
    cliente: '', telefono: '', calle: '', numero: '', piso: '',
    barrio: '', repartidor: '', tiempo_estimado: '', costo_envio: '',
    comentario: '', order: [], // array de productos del pedido
  });

  // ── ESTADO MOSTRADOR ──────────────────────────────────────
  const [activeMostradorOrder, setActiveMostradorOrder] = useState(false);
  const [mostradorFormData, setMostradorFormData] = useState({
    cliente: '', camarero: '', comentario: '', order: [],
  });

  // ── PEDIDOS EXISTENTES ────────────────────────────────────
  // Listas de pedidos mostrados en las vistas delivery y mostrador
  const [deliveryOrders, setDeliveryOrders]   = useState([]);
  const [mostradorOrders, setMostradorOrders] = useState([]);

  // Timestamp actual — se actualiza cada 10 segundos para calcular "hace X minutos"
  const [now, setNow] = useState(() => Date.now());

  // ── HANDLER: CAMBIAR CANTIDAD DE MESAS ───────────────────
  // Guarda en localStorage, regenera el array de mesas y cierra el modal
  const handleUpdateTableCount = (newCount) => {
    try {
      localStorage.setItem('mesasCount', newCount.toString());
      setTablasCount(newCount);
      setTables(createTables(newCount));
      setActiveTableId(null);
      setShowConfigMesas(false);
    } catch (e) { console.error(e); }
  };

  // ── CARGA INICIAL ─────────────────────────────────────────
  // Al montar: carga productos y empleados del backend en paralelo
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const res = await fetch("http://localhost:8000/productos");
        if (!res.ok) throw new Error("Error al cargar productos");
        setProducts(await res.json());
      } catch (err) { setError(err.message); }
      finally { setLoading(false); }
    };

    const fetchEmployees = async () => {
      try {
        const res = await fetch('http://localhost:8000/empleados');
        if (!res.ok) return;
        const data = await res.json();
        // Combina nombre + apellido en un campo `name` para los selectores
        setEmployees(data.map(e => ({ ...e, name: e.nombre + ' ' + e.apellido })));
      } catch (e) { setEmployees([]); }
    };

    fetchProducts();
    fetchEmployees();
  }, []);

  // ── CARGAR PEDIDOS EXISTENTES ─────────────────────────────
  // Filtra los pedidos del backend según el origen (delivery/mostrador)
  const fetchOrdersByOrigin = async () => {
    try {
      const res = await fetch('http://localhost:8000/pedidos');
      if (!res.ok) return;
      const data = await res.json();
      setDeliveryOrders(data.filter(p => (p.origen || '').toLowerCase() === 'delivery'));
      setMostradorOrders(data.filter(p => (p.origen || '').toLowerCase() === 'mostrador'));
    } catch (e) { setDeliveryOrders([]); setMostradorOrders([]); }
  };

  // Carga los pedidos cuando el usuario cambia a modo delivery o mostrador
  useEffect(() => {
    if (mode === 'delivery' || mode === 'mostrador') fetchOrdersByOrigin();
  }, [mode]);

  const refreshOrders = () => {
    if (mode === 'delivery' || mode === 'mostrador') fetchOrdersByOrigin();
  };

  // ── TEMPORIZADOR ──────────────────────────────────────────
  // Actualiza `now` cada 10 segundos para mostrar "hace X minutos" en los pedidos
  useEffect(() => {
    const tid = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(tid); // limpia el intervalo al desmontar
  }, []);

  // Calcula cuántos minutos pasaron desde que se creó un pedido
  const getMinutesElapsed = (fechaPedido) => {
    if (!fechaPedido) return 0;
    try {
      const d = new Date(fechaPedido);
      if (isNaN(d.getTime())) return 0;
      return Math.floor((now - d.getTime()) / 60000);
    } catch { return 0; }
  };

  // ── ABRIR MESA ────────────────────────────────────────────
  // Marca la mesa como abierta y activa el sidebar
  const openTable = (tableId) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, open: true } : t));
    setActiveTableId(tableId);
  };

  // ── MODALES DE FACTURA Y CONFIRMACIÓN ────────────────────
  const [showInvoiceModal, setShowInvoiceModal]     = useState(false);
  const [invoiceInfo, setInvoiceInfo]               = useState(null);   // datos de la factura
  const [showSentModal, setShowSentModal]           = useState(false);
  const [sentInfo, setSentInfo]                     = useState(null);   // pedido confirmado
  const [showPreviewModal, setShowPreviewModal]     = useState(false);
  const [previewInfo, setPreviewInfo]               = useState(null);   // vista previa de la cuenta
  const [showGeneratedModal, setShowGeneratedModal] = useState(false);
  const [generatedInfo, setGeneratedInfo]           = useState(null);   // cuenta generada

  // Bloquea el scroll del body cuando hay un sidebar o modal abierto
  useEffect(() => {
    const shouldBlock = !!activeTableId || showInvoiceModal;
    document.body.style.overflow = shouldBlock ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [activeTableId, showInvoiceModal]);

  // Agrega clase al body cuando estamos en esta página (para estilos específicos)
  useEffect(() => {
    document.body.classList.add('salon-page');
    return () => document.body.classList.remove('salon-page');
  }, []);

  // Estado de categorías colapsadas en el menú (no se usa activamente pero está disponible)
  const [collapsed, setCollapsed] = useState({ pizza: true, sandwich: true, wrap: false });
  const toggleCategory = (cat) => setCollapsed(prev => ({ ...prev, [cat]: !prev[cat] }));

  // Cierra el sidebar y el modal de productos
  const closeSidebar = () => {
    setActiveTableId(null);
    setShowProductsModal(false);
  };

  // ── AGREGAR PRODUCTO A MESA ───────────────────────────────
  // Si el producto ya existe en el pedido, incrementa la cantidad.
  // Si no existe, lo agrega con cantidad 1.
  const addProductToTable = (product, comment = '') => {
    if (!activeTableId) return;
    setTables(prev => prev.map(t => {
      if (t.id !== activeTableId) return t;
      const existing = t.order.find(it => it.producto_id === product.producto_id);
      if (existing) {
        return {
          ...t,
          order: t.order.map(it =>
            it.producto_id === product.producto_id
              ? { ...it, quantity: it.quantity + 1, comentario: comment || it.comentario }
              : it
          )
        };
      }
      return { ...t, order: [...t.order, { ...product, quantity: 1, comentario: comment }] };
    }));
  };

  // ── AGREGAR PRODUCTO DESDE MODAL ──────────────────────────
  // Detecta el contexto (mesa/delivery/mostrador) y agrega el producto
  // al pedido correspondiente, incluyendo el comentario si hay uno.
  const addProductFromModal = (product) => {
    const comment = productComments[product.producto_id] || '';

    if (productsModalContext === 'table' && activeTableId) {
      addProductToTable(product, comment);

    } else if (productsModalContext === 'delivery') {
      const existing = deliveryFormData.order.find(it => it.producto_id === product.producto_id);
      if (existing) {
        setDeliveryFormData(prev => ({
          ...prev,
          order: prev.order.map(it =>
            it.producto_id === product.producto_id
              ? { ...it, quantity: it.quantity + 1, comentario: comment || it.comentario }
              : it
          )
        }));
      } else {
        setDeliveryFormData(prev => ({
          ...prev,
          order: [...prev.order, { ...product, quantity: 1, comentario: comment }]
        }));
      }
    } else if (productsModalContext === 'mostrador') {
      const existing = mostradorFormData.order.find(it => it.producto_id === product.producto_id);
      if (existing) {
        setMostradorFormData(prev => ({
          ...prev,
          order: prev.order.map(it =>
            it.producto_id === product.producto_id
              ? { ...it, quantity: it.quantity + 1, comentario: comment || it.comentario }
              : it
          )
        }));
      } else {
        setMostradorFormData(prev => ({
          ...prev,
          order: [...prev.order, { ...product, quantity: 1, comentario: comment }]
        }));
      }
    }

    // Limpia el comentario de ese producto después de agregarlo
    setProductComments(prev => ({ ...prev, [product.producto_id]: '' }));
  };

  // Actualiza un campo de la mesa (mozo, personas, etc.)
  const updateTableField = (tableId, field, value) => {
    setTables(prev => prev.map(t => t.id === tableId ? { ...t, [field]: value } : t));
    if (field === 'mozo' && String(value || '').trim().length > 0) {
      setSendError(null);
      try { setMozoError(false); } catch (e) {}
    }
  };

  // Refs y estados para el campo mozo (validación y foco automático)
  const [sendError, setSendError]   = useState(null);
  const mozoRef                     = useRef(null);
  const [mozoError, setMozoError]   = useState(false);

  // ── ENVIAR PEDIDO AL BACKEND ──────────────────────────────
  // Construye el payload y hace POST /pedidos.
  // Si showInvoice es true, luego muestra el modal de factura.
  const sendOrderToBackend = async (tableId, { showInvoice = false } = {}) => {
    const table = tableById(tableId);
    if (!table || table.order.length === 0) return { ok: false, message: 'No hay items' };

    // Validación: el mozo es obligatorio para enviar
    if (!table.mozo || String(table.mozo).trim().length === 0) {
      return { ok: false, message: 'Debe completar el nombre del mozo antes de enviar el pedido' };
    }

    // Mapea el pedido al formato que espera el backend, incluyendo comentarios por item
    const detalles = table.order.map(it => ({
      producto_id: it.producto_id,
      cantidad:    it.quantity,
      ...(it.comentario ? { comentario: it.comentario } : {})
    }));

    const payload = {
      nombre_cliente: `Mesa ${tableId}`,
      direccion:      `Mozo: ${table.mozo || ''} | Personas: ${table.personas || ''}`,
      detalles,
      origen:         'salon',
      cargado_por:    currentUser?.name || '',
      mesa:           tableId,
      mozo:           table.mozo || '',
      personas:       table.personas || 1,
    };

    try {
      const res = await fetch('http://localhost:8000/pedidos', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });

      if (!res.ok) {
        const text = await res.text();
        return { ok: false, message: text || 'Error en servidor' };
      }

      const data = await res.json();

      // Actualiza la mesa: la marca como ocupada y limpia el pedido local
      setTables(prev => prev.map(t =>
        t.id === tableId
          ? { ...t, occupied: true, lastOrder: t.order, order: [], currentPedidoId: data.pedido_id }
          : t
      ));
      setActiveTableId(null);

      // Si se pidió factura, la carga y muestra el modal
      if (showInvoice) {
        let meta = { fecha: null, items: [] };
        try { meta = await fetchPedidoMetadata(data.pedido_id); } catch (e) {}
        const itemsFromMeta = (meta.items && meta.items.length > 0) ? meta.items : table.order;
        setInvoiceInfo({ pedido_id: data.pedido_id, total: data.total, items: itemsFromMeta, tableId, fecha: meta.fecha || null });
        setShowInvoiceModal(true);
      }

      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: err.message };
    }
  };

  // ── ACTUALIZAR CANTIDAD EN PEDIDO ─────────────────────────
  // delta = +1 para agregar, -1 para quitar. Filtra los items con quantity <= 0.
  const updateQuantity = (tableId, productId, delta) => {
    setTables(prev => prev.map(t => {
      if (t.id !== tableId) return t;
      const updated = t.order
        .map(it => it.producto_id === productId ? { ...it, quantity: it.quantity + delta } : it)
        .filter(it => it.quantity > 0); // elimina si llega a 0
      return { ...t, order: updated };
    }));
  };

  // Busca una mesa por su ID en el array de tables
  const tableById = (id) => tables.find(t => t.id === id);

  // ── OBTENER METADATA DE UN PEDIDO ────────────────────────
  // Intenta obtener fecha e items desde /pedidos_salon, luego de /pedidos como fallback
  const fetchPedidoMetadata = async (pedidoId) => {
    try {
      const res = await fetch('http://localhost:8000/pedidos_salon');
      if (res.ok) {
        const data = await res.json();
        const row  = data.find(r => Number(r.pedido_id) === Number(pedidoId));
        if (row) return { fecha: row.fecha, items: row.items || [] };
      }
    } catch (e) {}
    try {
      const res2 = await fetch('http://localhost:8000/pedidos');
      if (res2.ok) {
        const pedidos = await res2.json();
        const p = pedidos.find(x => Number(x.pedido_id) === Number(pedidoId));
        if (p) return { fecha: p.fecha_pedido, items: p.items || [] };
      }
    } catch (e) {}
    return { fecha: null, items: [] };
  };

  // Extrae categorías únicas de los productos (para el modal de menú)
  const categorias = [...new Set(products.map(p => (p.categoria || '').toLowerCase()).filter(Boolean))].sort();

  // Cierra el modal de productos y limpia todos los comentarios
  const closeProductsModal = () => {
    setShowProductsModal(false);
    setProductsModalContext(null);
    setProductComments({});
  };

  // ══════════════════════════════════════════════════════════
  // RENDER
  // ══════════════════════════════════════════════════════════
  return (
    <section id="salon" className="salon-section">
      <div className="salon-container">

        {/* ── HEADER ── */}
        <div className="salon-header">
          <h2 className="section-title"><Pizza size={32} /><Cookie size={32} /> PEDIDOS</h2>
          {/* Botón de configuración de mesas (solo en modo salon) */}
          {mode === 'salon' && (
            <button className="btn-config-mesas-icon" onClick={() => setShowConfigMesas(true)} title="Configurar cantidad de mesas">
              <Settings size={20} />
            </button>
          )}
        </div>

        {/* ── SELECTOR DE MODO ── */}
        {/* Alterna entre salon / delivery / mostrador */}
        <div className="mode-selector">
          <button className={`mode-btn ${mode === 'salon'     ? 'active' : ''}`} onClick={() => setMode('salon')}>Salón</button>
          <button className={`mode-btn ${mode === 'delivery'  ? 'active' : ''}`} onClick={() => setMode('delivery')}>Delivery</button>
          <button className={`mode-btn ${mode === 'mostrador' ? 'active' : ''}`} onClick={() => setMode('mostrador')}>Mostrador</button>
        </div>

        <div className="tables-and-sidebar">

          {/* ══ MODO SALÓN: GRILLA DE MESAS ══ */}
          {mode === 'salon' && (
            <div className="tables-grid">
              {tables.map((table) => (
                <div
                  key={table.id}
                  // Clases dinámicas para colorear según estado:
                  // --active: sidebar abierto (amarillo)
                  // --occupied: pedido enviado (azul)
                  // --paid: cuenta generada (verde)
                  className={`table-card
                    ${activeTableId === table.id      ? 'table-card--active'   : ''}
                    ${(table.occupied || table.order.length > 0) ? 'table-card--occupied' : ''}
                    ${table.paid                       ? 'table-card--paid'    : ''}
                  `}
                  onClick={() => openTable(table.id)}
                >
                  <div className="table-number">{table.id}</div>
                  {/* Texto de estado según la prioridad: activa > cuenta > ocupada > items > libre */}
                  <div className="table-status">
                    {activeTableId === table.id ? '🟡 Abierta'
                      : table.paid    ? '✅ Cuenta'
                      : table.occupied ? '🔵 Ocupada'
                      : table.order.length > 0 ? `${table.order.length} items`
                      : 'Libre'}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ══ MODO DELIVERY: LISTA DE PEDIDOS ══ */}
          {mode === 'delivery' && (
            <div className="delivery-container">
              <div className="orders-header-row">
                {/* Botón para abrir el sidebar con el formulario de nuevo pedido */}
                <button className="new-order-btn" onClick={() => setActiveDeliveryOrder(true)}>+ NUEVO PEDIDO</button>
              </div>
              <div className="orders-grid">
                {deliveryOrders.length === 0 && <p className="no-orders-msg">No hay pedidos de delivery. Crea uno nuevo.</p>}
                {deliveryOrders.map((pedido) => (
                  <div key={pedido.pedido_id} className="order-card order-card--wide">
                    <div className="order-card-header">
                      <span className="order-card-id">Pedido #{pedido.pedido_id}</span>
                      {/* Muestra cuántos minutos pasaron desde que se creó */}
                      <span className="order-card-timer">{getMinutesElapsed(pedido.fecha_pedido)} min</span>
                    </div>
                    <div className="order-card-details">
                      <div className="order-card-row"><span className="order-card-label">Nombre:</span> {pedido.nombre_cliente}</div>
                      {pedido.telefono && <div className="order-card-row"><span className="order-card-label">Teléfono:</span> {pedido.telefono}</div>}
                      <div className="order-card-row"><span className="order-card-label">Dirección:</span> {pedido.direccion || '-'}</div>
                    </div>
                    <div className="order-card-items">
                      <div className="order-card-label">Productos:</div>
                      {pedido.items?.map((it) => (
                        <div key={`${pedido.pedido_id}-${it.producto_id}`} className="order-card-item">
                          <span>{it.nombre}</span>
                          <span>{it.cantidad} x ${(it.precio_unitario || 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="order-card-row order-card-total"><span className="order-card-label">Total:</span> ${(pedido.total || 0).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ══ MODO MOSTRADOR: LISTA DE PEDIDOS ══ */}
          {mode === 'mostrador' && (
            <div className="mostrador-container">
              <div className="orders-header-row">
                <button className="new-order-btn" onClick={() => setActiveMostradorOrder(true)}>+ NUEVO PEDIDO</button>
              </div>
              <div className="orders-grid">
                {mostradorOrders.length === 0 && <p className="no-orders-msg">No hay pedidos de mostrador. Crea uno nuevo.</p>}
                {mostradorOrders.map((pedido) => (
                  <div key={pedido.pedido_id} className="order-card order-card--wide">
                    <div className="order-card-header">
                      <span className="order-card-id">Pedido #{pedido.pedido_id}</span>
                      <span className="order-card-timer">{getMinutesElapsed(pedido.fecha_pedido)} min</span>
                    </div>
                    <div className="order-card-details">
                      <div className="order-card-row"><span className="order-card-label">Nombre:</span> {pedido.nombre_cliente}</div>
                      {pedido.camarero  && <div className="order-card-row"><span className="order-card-label">Camarero:</span>   {pedido.camarero}</div>}
                      {pedido.comentario && <div className="order-card-row"><span className="order-card-label">Comentario:</span> {pedido.comentario}</div>}
                    </div>
                    <div className="order-card-items">
                      <div className="order-card-label">Productos:</div>
                      {pedido.items?.map((it) => (
                        <div key={`${pedido.pedido_id}-${it.producto_id}`} className="order-card-item">
                          <span>{it.nombre}</span>
                          <span>{it.cantidad} x ${(it.precio_unitario || 0).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                    <div className="order-card-row order-card-total"><span className="order-card-label">Total:</span> ${(pedido.total || 0).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── OVERLAY OSCURO ── */}
          {/* Aparece detrás del sidebar. Click en él cierra el sidebar. */}
          {(activeTableId || activeDeliveryOrder || activeMostradorOrder) && (
            <div className="salon-overlay" onClick={() => {
              if (showProductsModal) { closeProductsModal(); }
              else { setActiveTableId(null); setActiveDeliveryOrder(false); setActiveMostradorOrder(false); }
            }} />
          )}

          {/* ══ SIDEBAR LATERAL ══ */}
          {/* Desliza desde la derecha cuando hay mesa/delivery/mostrador activo */}
          <div className={`salon-sidebar ${(activeTableId || activeDeliveryOrder || activeMostradorOrder) && !showProductsModal ? 'open' : ''}`}>

            {/* ── SIDEBAR: SALÓN ── */}
            {mode === 'salon' && activeTableId && !showProductsModal && (
              <>
                <div className="sidebar-header">
                  <h3>Detalle Mesa {activeTableId}</h3>
                  <button className="close-btn" onClick={closeSidebar}>✕</button>
                </div>

                <div className="sidebar-body">
                  {/* Datos de la mesa: selector de mozo y cantidad de personas */}
                  <div className="order-data-card order-data-card--mesa">
                    <h4 className="order-data-card__title">Datos de la Mesa</h4>
                    <div className="table-inputs">
                      <label>
                        Mozo:
                        {/* ref para hacer focus automático si hay error de validación */}
                        <select
                          ref={mozoRef}
                          className={mozoError ? 'input-error' : ''}
                          value={tableById(activeTableId).mozo}
                          onChange={(e) => updateTableField(activeTableId, 'mozo', e.target.value)}
                        >
                          <option value="">Seleccionar mozo...</option>
                          {employees.map((emp) => (
                            <option key={emp.email} value={emp.name}>{emp.name}</option>
                          ))}
                        </select>
                        {mozoError && <div className="field-error">Debe seleccionar un mozo</div>}
                      </label>
                      <label>
                        Personas:
                        <input type="number" min={1}
                          value={tableById(activeTableId).personas}
                          onChange={(e) => updateTableField(activeTableId, 'personas', Number(e.target.value))}
                        />
                      </label>
                    </div>
                  </div>

                  {/* Lista de productos en el pedido actual de la mesa */}
                  <div className="order-list">
                    <h4>Pedido Mesa {activeTableId}</h4>
                    {tableById(activeTableId).order.length === 0 && <p>Sin productos agregados</p>}
                    {tableById(activeTableId).order.map(item => (
                      <div className="order-row" key={item.producto_id}>
                        <div className="order-left">
                          <div className="order-name">{item.nombre}</div>
                          {/* Comentario del producto — solo si existe */}
                          {item.comentario && (
                            <div className="order-item-comment">💬 {item.comentario}</div>
                          )}
                          <div className="order-price">${item.precio.toLocaleString()}</div>
                        </div>
                        {/* Controles +/- de cantidad */}
                        <div className="order-qty">
                          <button onClick={() => updateQuantity(activeTableId, item.producto_id, -1)}>-</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => updateQuantity(activeTableId, item.producto_id, +1)}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ── ACCIONES DEL SIDEBAR SALÓN ── */}
                <div className="order-actions">
                  {/* Solo visible si la cuenta ya fue generada */}
                  {tableById(activeTableId).paid && (
                    <div className="paid-actions">
                      <button className="danger-btn" onClick={() => {
                        // Cierra la mesa y limpia todo su estado
                        setTables(prev => prev.map(t =>
                          t.id === activeTableId
                            ? { ...t, occupied: false, lastOrder: null, currentPedidoId: null, paid: false, order: [] }
                            : t
                        ));
                        setActiveTableId(null);
                      }}>Cuenta pagada / Cerrar mesa</button>
                    </div>
                  )}

                  <div className="two-buttons">
                    {/* Enviar pedido → POST /pedidos, muestra modal de confirmación */}
                    <button
                      className="primary-btn"
                      disabled={tableById(activeTableId).order.length === 0}
                      onClick={async () => {
                        const table        = tableById(activeTableId);
                        const currentOrder = table ? table.order : [];
                        // Valida que se haya seleccionado un mozo
                        if (!table?.mozo || String(table.mozo).trim().length === 0) {
                          setSendError('Debe completar el nombre del mozo antes de enviar el pedido');
                          setMozoError(true);
                          try { mozoRef.current?.focus(); } catch (e) {}
                          return;
                        }
                        const res = await sendOrderToBackend(activeTableId, { showInvoice: false });
                        if (!res.ok) {
                          setSendError(res.message || 'Error al enviar pedido');
                          try { mozoRef.current?.focus(); } catch (e) {}
                          return;
                        }
                        setSendError(null);
                        const totalLocal = res.data?.total ?? currentOrder.reduce((s, it) => s + (it.precio || 0) * (it.quantity || 0), 0);
                        setSentInfo({ pedido_id: res.data?.pedido_id, items: currentOrder, total: totalLocal, tableId: activeTableId });
                        setShowSentModal(true);
                      }}
                    >Enviar pedido</button>

                    {/* Sacar la cuenta → genera vista previa con QR */}
                    <button
                      className="secondary-btn"
                      disabled={(tableById(activeTableId).order.length === 0) && !tableById(activeTableId).lastOrder}
                      onClick={() => {
                        const table        = tableById(activeTableId);
                        const items        = (table?.order?.length > 0) ? table.order : (table?.lastOrder || []);
                        const totalPreview = items.reduce((s, it) => s + (it.precio || 0) * (it.quantity || 0), 0);
                        setPreviewInfo({ tableId: activeTableId, items, mozo: table?.mozo, personas: table?.personas, total: totalPreview, timestamp: new Date().toISOString(), alias: PAYMENT_ALIAS });
                        setShowPreviewModal(true);
                      }}
                    >Sacar la cuenta</button>
                  </div>

                  {sendError && <div className="field-error" style={{ marginTop: '0.5rem' }}>{sendError}</div>}

                  {/* Abre el modal de menú para agregar productos */}
                  <button className="add-products-btn" onClick={() => { setProductsModalContext('table'); setShowProductsModal(true); }}>
                    🔓 ABRIR MESA
                  </button>

                  {/* Cierra la mesa sin generar cuenta ni factura */}
                  <button className="close-table-btn" onClick={() => {
                    setTables(prev => prev.map(t =>
                      t.id === activeTableId
                        ? { ...t, occupied: false, lastOrder: null, currentPedidoId: null, paid: false, order: [] }
                        : t
                    ));
                    setActiveTableId(null);
                  }}>
                    🗑️ Cerrar y limpiar mesa
                  </button>
                </div>
              </>
            )}

            {/* ── SIDEBAR: DELIVERY ── */}
            {mode === 'delivery' && activeDeliveryOrder && (
              <>
                <div className="sidebar-header">
                  <h3>Nuevo Pedido Delivery</h3>
                  <button className="close-btn" onClick={() => setActiveDeliveryOrder(false)}>✕</button>
                </div>
                <div className="sidebar-body">
                  <div className="order-data-card order-data-card--delivery">
                    <h4 className="order-data-card__title">Datos de Entrega</h4>
                    <div className="delivery-inputs">
                      <label>Cliente:<input type="text" placeholder="Nombre del cliente" value={deliveryFormData.cliente} onChange={(e) => setDeliveryFormData({ ...deliveryFormData, cliente: e.target.value })} /></label>
                      <label>Teléfono:<input type="text" placeholder="Teléfono" value={deliveryFormData.telefono} onChange={(e) => setDeliveryFormData({ ...deliveryFormData, telefono: e.target.value })} /></label>
                      <label>Calle:<input type="text" placeholder="Nombre de la calle" value={deliveryFormData.calle} onChange={(e) => setDeliveryFormData({ ...deliveryFormData, calle: e.target.value })} /></label>
                      <label>Número:<input type="text" placeholder="Número" value={deliveryFormData.numero} onChange={(e) => setDeliveryFormData({ ...deliveryFormData, numero: e.target.value })} /></label>
                      <label>Piso/Apartamento:<input type="text" placeholder="Piso / Apartamento" value={deliveryFormData.piso} onChange={(e) => setDeliveryFormData({ ...deliveryFormData, piso: e.target.value })} /></label>
                      <label>Barrio:<input type="text" placeholder="Barrio" value={deliveryFormData.barrio} onChange={(e) => setDeliveryFormData({ ...deliveryFormData, barrio: e.target.value })} /></label>
                    </div>
                  </div>

                  {/* Botón para abrir el modal de menú en contexto delivery */}
                  <button className="add-products-btn" onClick={() => { setProductsModalContext('delivery'); setShowProductsModal(true); }}>
                    🔓 AGREGAR PRODUCTOS
                  </button>

                  <div className="order-list">
                    <h4>Pedido Delivery</h4>
                    {deliveryFormData.order.length === 0 && <p>Sin productos agregados</p>}
                    {deliveryFormData.order.map(item => (
                      <div className="order-row" key={item.producto_id}>
                        <div className="order-left">
                          <div className="order-name">{item.nombre}</div>
                          {item.comentario && <div className="order-item-comment">💬 {item.comentario}</div>}
                          <div className="order-price">${item.precio.toLocaleString()}</div>
                        </div>
                        <div className="order-qty">
                          <button onClick={() => setDeliveryFormData(prev => ({ ...prev, order: prev.order.map(it => it.producto_id === item.producto_id ? { ...it, quantity: it.quantity - 1 } : it).filter(it => it.quantity > 0) }))}>-</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => setDeliveryFormData(prev => ({ ...prev, order: prev.order.map(it => it.producto_id === item.producto_id ? { ...it, quantity: it.quantity + 1 } : it) }))}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="order-actions">
                    <div className="two-buttons">
                      {/* Enviar delivery: requiere cliente, teléfono y calle */}
                      <button
                        className="primary-btn"
                        disabled={deliveryFormData.order.length === 0 || !deliveryFormData.cliente || !deliveryFormData.telefono || !deliveryFormData.calle}
                        onClick={async () => {
                          const direccionCompleta = `${deliveryFormData.calle} ${deliveryFormData.numero}${deliveryFormData.piso ? ' ' + deliveryFormData.piso : ''} - ${deliveryFormData.barrio}`;
                          const detalles = deliveryFormData.order.map(it => ({
                            producto_id: it.producto_id,
                            cantidad:    it.quantity,
                            ...(it.comentario ? { comentario: it.comentario } : {})
                          }));
                          const payload = {
                            nombre_cliente: deliveryFormData.cliente,
                            direccion:      direccionCompleta,
                            detalles,
                            origen:         'delivery',
                            telefono:       deliveryFormData.telefono || '',
                            cargado_por:    currentUser?.name || ''
                          };
                          try {
                            const res = await fetch('http://localhost:8000/pedidos', {
                              method:  'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body:    JSON.stringify(payload)
                            });
                            if (res.ok) {
                              const data = await res.json();
                              alert(`Pedido creado exitosamente. ID: ${data.pedido_id}`);
                              setDeliveryFormData({ cliente: '', telefono: '', calle: '', numero: '', piso: '', barrio: '', repartidor: '', tiempo_estimado: '', costo_envio: '', comentario: '', order: [] });
                              setActiveDeliveryOrder(false);
                              refreshOrders();
                            } else { alert('Error al crear el pedido'); }
                          } catch (err) { alert('Error: ' + err.message); }
                        }}
                      >Enviar Pedido</button>
                      <button className="secondary-btn" onClick={() => {
                        setDeliveryFormData({ cliente: '', telefono: '', calle: '', numero: '', piso: '', barrio: '', repartidor: '', tiempo_estimado: '', costo_envio: '', comentario: '', order: [] });
                        setActiveDeliveryOrder(false);
                      }}>Cancelar</button>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── SIDEBAR: MOSTRADOR ── */}
            {mode === 'mostrador' && activeMostradorOrder && (
              <>
                <div className="sidebar-header">
                  <h3>Nuevo Pedido Mostrador</h3>
                  <button className="close-btn" onClick={() => setActiveMostradorOrder(false)}>✕</button>
                </div>
                <div className="sidebar-body">
                  <div className="order-data-card order-data-card--mostrador">
                    <h4 className="order-data-card__title">Datos del Pedido</h4>
                    <div className="mostrador-inputs">
                      <label>Cliente:<input type="text" placeholder="Nombre del cliente" value={mostradorFormData.cliente} onChange={(e) => setMostradorFormData({ ...mostradorFormData, cliente: e.target.value })} /></label>
                      <label>Camarero:
                        <select value={mostradorFormData.camarero} onChange={(e) => setMostradorFormData({ ...mostradorFormData, camarero: e.target.value })}>
                          <option value="">Seleccionar camarero...</option>
                          {employees.map((emp) => <option key={emp.email} value={emp.name}>{emp.name}</option>)}
                        </select>
                      </label>
                      <label>Comentario general:
                        <textarea placeholder="Comentarios adicionales del pedido" value={mostradorFormData.comentario} onChange={(e) => setMostradorFormData({ ...mostradorFormData, comentario: e.target.value })} />
                      </label>
                    </div>
                  </div>

                  <button className="add-products-btn" onClick={() => { setProductsModalContext('mostrador'); setShowProductsModal(true); }}>
                    🔓 AGREGAR PRODUCTOS
                  </button>

                  <div className="order-list">
                    <h4>Pedido Mostrador</h4>
                    {mostradorFormData.order.length === 0 && <p>Sin productos agregados</p>}
                    {mostradorFormData.order.map(item => (
                      <div className="order-row" key={item.producto_id}>
                        <div className="order-left">
                          <div className="order-name">{item.nombre}</div>
                          {item.comentario && <div className="order-item-comment">💬 {item.comentario}</div>}
                          <div className="order-price">${item.precio.toLocaleString()}</div>
                        </div>
                        <div className="order-qty">
                          <button onClick={() => setMostradorFormData(prev => ({ ...prev, order: prev.order.map(it => it.producto_id === item.producto_id ? { ...it, quantity: it.quantity - 1 } : it).filter(it => it.quantity > 0) }))}>-</button>
                          <span>{item.quantity}</span>
                          <button onClick={() => setMostradorFormData(prev => ({ ...prev, order: prev.order.map(it => it.producto_id === item.producto_id ? { ...it, quantity: it.quantity + 1 } : it) }))}>+</button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="order-actions">
                    <div className="two-buttons">
                      {/* Enviar mostrador: requiere cliente y camarero */}
                      <button
                        className="primary-btn"
                        disabled={mostradorFormData.order.length === 0 || !mostradorFormData.cliente || !mostradorFormData.camarero}
                        onClick={async () => {
                          const detalles = mostradorFormData.order.map(it => ({
                            producto_id: it.producto_id,
                            cantidad:    it.quantity,
                            ...(it.comentario ? { comentario: it.comentario } : {})
                          }));
                          const payload = {
                            nombre_cliente: mostradorFormData.cliente,
                            direccion:      'Mostrador',
                            detalles,
                            origen:         'mostrador',
                            camarero:       mostradorFormData.camarero || '',
                            comentario:     mostradorFormData.comentario || '',
                            cargado_por:    currentUser?.name || ''
                          };
                          try {
                            const res = await fetch('http://localhost:8000/pedidos', {
                              method:  'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body:    JSON.stringify(payload)
                            });
                            if (res.ok) {
                              const data = await res.json();
                              alert(`Pedido creado exitosamente. ID: ${data.pedido_id}`);
                              setMostradorFormData({ cliente: '', camarero: '', comentario: '', order: [] });
                              setActiveMostradorOrder(false);
                              refreshOrders();
                            } else { alert('Error al crear el pedido'); }
                          } catch (e) { alert('Error al conectar con el servidor'); }
                        }}
                      >Enviar Pedido</button>
                      <button className="secondary-btn" onClick={() => {
                        setMostradorFormData({ cliente: '', camarero: '', comentario: '', order: [] });
                        setActiveMostradorOrder(false);
                      }}>Cancelar</button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════
          MODALES
      ══════════════════════════════════════════════════════ */}

      {/* ── MODAL FACTURA ── */}
      {showInvoiceModal && invoiceInfo && (
        <div className="invoice-modal-overlay" onClick={() => setShowInvoiceModal(false)}>
          <div className="invoice-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Factura - Pedido #{invoiceInfo.pedido_id}</h3>
            <div className="invoice-body">
              <p><strong>Mesa:</strong> {invoiceInfo.tableId ? `Mesa ${invoiceInfo.tableId}` : ''}</p>
              <p><strong>Fecha:</strong> {invoiceInfo.fecha ? new Date(invoiceInfo.fecha).toLocaleString() : ''}</p>
              <p><strong>Total:</strong> ${invoiceInfo.total?.toLocaleString()}</p>
              <div className="invoice-items">
                {invoiceInfo.items?.map(it => (
                  <div key={it.producto_id} className="invoice-item">
                    <span>{it.nombre}</span>
                    <span>{it.quantity} x ${it.precio.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="invoice-actions">
              {/* Abre una nueva pestaña con la factura para imprimir */}
              <button onClick={() => {
                const w = window.open('', '_blank');
                w.document.write(`<html><head><title>Factura #${invoiceInfo.pedido_id}</title></head><body><h2>Factura - Pedido #${invoiceInfo.pedido_id}</h2><div>Total: $${invoiceInfo.total?.toLocaleString()}</div><hr/>${invoiceInfo.items?.map(i => `<div>${i.nombre} - ${i.quantity} x $${i.precio}</div>`).join('')}</body></html>`);
                w.document.close(); w.focus(); w.print();
              }}>Reimprimir cuenta</button>
              {/* Cierra la cuenta: elimina el pedido del backend y limpia la mesa */}
              <button onClick={async () => {
                try { if (invoiceInfo?.pedido_id) await fetch(`http://localhost:8000/pedidos/${invoiceInfo.pedido_id}`, { method: 'DELETE' }); } catch (e) {}
                setTables(prev => prev.map(t => t.currentPedidoId === invoiceInfo.pedido_id ? { ...t, occupied: false, lastOrder: null, currentPedidoId: null } : t));
                setShowInvoiceModal(false); setInvoiceInfo(null);
              }}>Cerrar cuenta</button>
              <button onClick={() => setShowInvoiceModal(false)}>Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL PEDIDO ENVIADO ── */}
      {showSentModal && sentInfo && (
        <div className="invoice-modal-overlay" onClick={() => setShowSentModal(false)}>
          <div className="invoice-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Pedido enviado ✅</h3>
            <div className="invoice-body">
              <p><strong>Mesa:</strong> {sentInfo.tableId ? `Mesa ${sentInfo.tableId}` : ''}</p>
              <div className="invoice-items">
                {sentInfo.items?.map(it => (
                  <div key={it.producto_id} className="invoice-item">
                    <span>{it.nombre}</span>
                    <span>{it.quantity} x ${it.precio?.toLocaleString?.()}</span>
                  </div>
                ))}
              </div>
              <div><strong>Total:</strong> ${sentInfo.total?.toLocaleString?.()}</div>
            </div>
            <div className="invoice-actions"><button onClick={() => setShowSentModal(false)}>Cerrar</button></div>
          </div>
        </div>
      )}

      {/* ── MODAL CUENTA GENERADA ── */}
      {showGeneratedModal && generatedInfo && (
        <div className="invoice-modal-overlay" onClick={() => setShowGeneratedModal(false)}>
          <div className="invoice-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Cuenta generada ✅</h3>
            <div className="invoice-body">
              <p>Se generó la cuenta para <strong>Mesa {generatedInfo.tableId}</strong></p>
              <p><strong>Total:</strong> ${generatedInfo.total?.toLocaleString?.() ?? '0'}</p>
            </div>
            <div className="invoice-actions"><button onClick={() => setShowGeneratedModal(false)}>Cerrar</button></div>
          </div>
        </div>
      )}

      {/* ── MODAL VISTA PREVIA DE CUENTA ── */}
      {/* Muestra el resumen, el total, la hora y un QR de muestra para pago */}
      {showPreviewModal && previewInfo && (
        <div className="invoice-modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div className="invoice-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Vista previa de la cuenta</h3>
            <div className="invoice-body">
              <p><strong>Mesa:</strong>     {previewInfo.tableId ? `Mesa ${previewInfo.tableId}` : ''}</p>
              <p><strong>Mozo:</strong>     {previewInfo.mozo    || '-'}</p>
              <p><strong>Personas:</strong> {previewInfo.personas ?? '-'}</p>
              <hr />
              <div className="invoice-items">
                {previewInfo.items?.map(it => (
                  <div key={it.producto_id} className="invoice-item">
                    <span>{it.nombre}</span>
                    <span>{it.quantity} x ${it.precio?.toLocaleString?.()}</span>
                  </div>
                ))}
              </div>
              <hr />
              <div><strong>Total aprox:</strong> ${previewInfo.total?.toLocaleString?.()}</div>
              <div style={{ marginTop: '0.75rem' }}>
                <p><strong>Hora:</strong> {previewInfo.timestamp ? new Date(previewInfo.timestamp).toLocaleString() : ''}</p>
                <div className="payment-qr">
                  {previewInfo.total !== undefined && <img alt="QR de muestra" src={SAMPLE_QR_URL} />}
                  <div className="payment-alias">Alias: {previewInfo.alias}</div>
                </div>
              </div>
            </div>
            <div className="invoice-actions">
              <button onClick={() => setShowPreviewModal(false)}>Cancelar</button>
              {/* Confirmar cuenta: marca la mesa como pagada y muestra modal de confirmación */}
              <button onClick={() => {
                setTables(prev => prev.map(t => {
                  if (t.id !== previewInfo.tableId) return t;
                  const last = (t.lastOrder?.length > 0) ? t.lastOrder : (previewInfo.items?.length > 0 ? previewInfo.items : t.order);
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

      {/* ── MODAL CONFIGURAR MESAS ── */}
      {showConfigMesas && (
        <ConfigurarMesas
          currentTableCount={tablasCount}
          onConfirm={handleUpdateTableCount}
          onClose={() => setShowConfigMesas(false)}
        />
      )}

      {/* ── MODAL DE PRODUCTOS (MENÚ) ── */}
      {/* Muestra todos los productos agrupados por categoría con campo de comentario por item */}
      {showProductsModal && (activeTableId || productsModalContext === 'delivery' || productsModalContext === 'mostrador') && (
        <div className="products-modal-overlay" onClick={closeProductsModal}>
          <div className="products-modal" onClick={(e) => e.stopPropagation()}>
            <div className="products-modal-header">
              <h2>
                {productsModalContext === 'delivery'  && 'Menú - Delivery'}
                {productsModalContext === 'mostrador' && 'Menú - Mostrador'}
                {productsModalContext === 'table' && activeTableId && `Menú - Mesa ${activeTableId}`}
              </h2>
              <button className="modal-close-btn" onClick={closeProductsModal}>✕</button>
            </div>

            <div className="products-modal-body">
              {/* Solo muestra el menú si ya se seleccionó un mozo (para mesas) */}
              {(productsModalContext === 'delivery' || productsModalContext === 'mostrador' || (tableById(activeTableId)?.mozo && String(tableById(activeTableId).mozo).trim().length > 0)) ? (
                <>
                  {loading && <p>Cargando productos...</p>}
                  {error   && <p className="error">Error: {error}</p>}
                  {!loading && !error && (
                    <div className="products-modal-grid">
                      {categorias.map(cat => (
                        <div key={cat} className="category-section">
                          <h3 className="category-title">{cat.charAt(0).toUpperCase() + cat.slice(1)}</h3>
                          <div className="category-products">
                            {products.filter(p => (p.categoria || '').toLowerCase() === cat).map(p => (
                              <div key={p.producto_id} className="product-card-with-comment">
                                <div className="product-card">
                                  <div className="product-icon">{getProductIcon(p.categoria, p.nombre, 48)}</div>
                                  <h4>{p.nombre}</h4>
                                  <p className="product-desc">{p.descripcion}</p>
                                  <div className="product-footer">
                                    <span className="product-price">${p.precio.toLocaleString()}</span>
                                    {/* Botón + agrega el producto con el comentario actual */}
                                    <button className="product-add-btn" onClick={() => addProductFromModal(p)}>+</button>
                                  </div>
                                </div>
                                {/* Textarea para comentario por producto (ej: "sin cebolla") */}
                                <div className="product-comment-section">
                                  <textarea
                                    className="product-comment-input"
                                    placeholder="Aclaración (ej: sin salsa, extra queso...)"
                                    value={productComments[p.producto_id] || ''}
                                    onChange={(e) => setProductComments(prev => ({ ...prev, [p.producto_id]: e.target.value }))}
                                    rows={2}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                // Mensaje si el mozo no fue seleccionado todavía
                <div className="pending-data-message">
                  <p>⚠️ Complete el nombre del mozo en datos para ver los productos disponibles</p>
                </div>
              )}
            </div>

            {/* Cierra el modal y confirma la selección de productos */}
            <button className="products-modal-confirm" onClick={closeProductsModal}>
              ✓ Confirmar selección
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default Salon;
