// ============================================================
// Estadisticas.jsx — CONTROL DE PEDIDOS Y GRÁFICOS DE VENTAS
// ============================================================
// Tiene DOS vistas que se alternan con el botón "Estadísticas":
//
//   📋 LISTA   → muestra todos los pedidos como tarjetas detalladas
//   📊 GRÁFICOS → muestra KPIs + gráfico de barras + gráfico de líneas
//
// Filtros disponibles: Todos / Mesas / Delivery / Mostrador
// Los filtros aplican tanto a la lista como a los gráficos.
//
// Períodos del gráfico: Hoy (por hora) / Semana / Mes / Año
//
// Fuente de datos: GET /pedidos (backend FastAPI)
// ============================================================

import { useState, useEffect, useMemo } from 'react';
import {
  BarChart3, Utensils, Truck, Coffee,
  TrendingUp, Calendar, CalendarDays, CalendarRange
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend
} from 'recharts'; // librería de gráficos
import './Estadisticas.css';

// Arrays de nombres de meses para formatear fechas
const MESES       = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];
const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const DIAS_SEMANA = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];

// Convierte un string de fecha ISO en partes legibles en español
const formatFecha = (fechaStr) => {
  if (!fechaStr) return { fecha: '-', mes: '-', hora: '-' };
  try {
    const d = new Date(fechaStr);
    if (isNaN(d.getTime())) return { fecha: '-', mes: '-', hora: '-' };
    return {
      fecha: d.toLocaleDateString('es-AR'),
      mes:   MESES[d.getMonth()],
      hora:  d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      full:  d.toLocaleString('es-AR', { dateStyle: 'full', timeStyle: 'medium' }),
    };
  } catch { return { fecha: '-', mes: '-', hora: '-' }; }
};

// Componente del tooltip personalizado que aparece al hover en los gráficos
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <p className="chart-tooltip__label">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} className="chart-tooltip__value" style={{ color: entry.color }}>
          {entry.name}: <strong>${(entry.value || 0).toLocaleString()}</strong>
        </p>
      ))}
    </div>
  );
};

export const Estadisticas = () => {
  const [pedidos, setPedidos] = useState([]);  // todos los pedidos del backend
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Filtro de origen: 'todos' | 'salon' | 'delivery' | 'mostrador'
  const [filtro, setFiltro] = useState('todos');

  // Vista activa: 'lista' (tarjetas) | 'graficos' (KPIs + charts)
  const [vista, setVista] = useState('lista');

  // Período del gráfico: 'dia' | 'semana' | 'mes' | 'año'
  const [periodo, setPeriodo] = useState('mes');

  // GET /pedidos — carga todos los pedidos al montar el componente
  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        setLoading(true);
        const res = await fetch('http://localhost:8000/pedidos');
        if (!res.ok) throw new Error('Error al cargar pedidos');
        setPedidos(await res.json());
      } catch (err) {
        setError(err.message);
        setPedidos([]);
      } finally {
        setLoading(false);
      }
    };
    fetchPedidos();
  }, []);

  // Pedidos filtrados según el origen seleccionado
  const pedidosFiltrados = filtro === 'todos'
    ? pedidos
    : pedidos.filter(p => (p.origen || '').toLowerCase() === filtro);

  // ── DATOS PARA LOS GRÁFICOS ───────────────────────────────
  // useMemo recalcula solo cuando cambian pedidos, filtro o periodo
  // Genera un array de puntos { label, total, salon, delivery, mostrador }
  const datosGrafico = useMemo(() => {
    const fuente = filtro === 'todos' ? pedidos : pedidos.filter(p => (p.origen || '').toLowerCase() === filtro);
    const ahora  = new Date();

    if (periodo === 'dia') {
      // Agrupa por hora del día (0-23) para las últimas 24 horas
      const porHora = {};
      for (let h = 0; h < 24; h++) porHora[h] = 0;
      fuente.forEach(p => {
        if (!p.fecha_pedido) return;
        const d = new Date(p.fecha_pedido);
        if (isNaN(d.getTime())) return;
        const diffH = (ahora - d) / 3600000;
        if (diffH <= 24) porHora[d.getHours()] = (porHora[d.getHours()] || 0) + (p.total || 0);
      });
      return Object.entries(porHora).map(([h, total]) => ({
        label:     `${String(h).padStart(2, '0')}:00`,
        total:     Math.round(total),
        salon:     Math.round(fuente.filter(p => { const d = new Date(p.fecha_pedido); return !isNaN(d.getTime()) && d.getHours() === Number(h) && (p.origen||'').toLowerCase() === 'salon'; }).reduce((s,p) => s+(p.total||0), 0)),
        delivery:  Math.round(fuente.filter(p => { const d = new Date(p.fecha_pedido); return !isNaN(d.getTime()) && d.getHours() === Number(h) && (p.origen||'').toLowerCase() === 'delivery'; }).reduce((s,p) => s+(p.total||0), 0)),
        mostrador: Math.round(fuente.filter(p => { const d = new Date(p.fecha_pedido); return !isNaN(d.getTime()) && d.getHours() === Number(h) && (p.origen||'').toLowerCase() === 'mostrador'; }).reduce((s,p) => s+(p.total||0), 0)),
      }));
    }

    if (periodo === 'semana') {
      // Agrupa por día — últimos 7 días
      const dias = {};
      for (let i = 6; i >= 0; i--) {
        const d   = new Date(ahora);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        dias[key] = { label: DIAS_SEMANA[d.getDay()], total: 0, salon: 0, delivery: 0, mostrador: 0 };
      }
      fuente.forEach(p => {
        if (!p.fecha_pedido) return;
        const key = new Date(p.fecha_pedido).toISOString().slice(0, 10);
        if (dias[key]) {
          dias[key].total += p.total || 0;
          const org = (p.origen || '').toLowerCase();
          if      (org === 'salon')     dias[key].salon     += p.total || 0;
          else if (org === 'delivery')  dias[key].delivery  += p.total || 0;
          else if (org === 'mostrador') dias[key].mostrador += p.total || 0;
        }
      });
      return Object.values(dias).map(d => ({ ...d, total: Math.round(d.total), salon: Math.round(d.salon), delivery: Math.round(d.delivery), mostrador: Math.round(d.mostrador) }));
    }

    if (periodo === 'mes') {
      // Agrupa por día — últimos 30 días (muestra cada 5 para no saturar el eje)
      const dias = {};
      for (let i = 29; i >= 0; i--) {
        const d   = new Date(ahora);
        d.setDate(d.getDate() - i);
        const key = d.toISOString().slice(0, 10);
        dias[key] = { label: `${d.getDate()}/${d.getMonth() + 1}`, total: 0, salon: 0, delivery: 0, mostrador: 0 };
      }
      fuente.forEach(p => {
        if (!p.fecha_pedido) return;
        const key = new Date(p.fecha_pedido).toISOString().slice(0, 10);
        if (dias[key]) {
          dias[key].total += p.total || 0;
          const org = (p.origen || '').toLowerCase();
          if      (org === 'salon')     dias[key].salon     += p.total || 0;
          else if (org === 'delivery')  dias[key].delivery  += p.total || 0;
          else if (org === 'mostrador') dias[key].mostrador += p.total || 0;
        }
      });
      // Filtra para mostrar solo 1 de cada 5 días (evita etiquetas superpuestas)
      return Object.values(dias).filter((_, i) => i % 5 === 0 || i === 29).map(d => ({
        ...d, total: Math.round(d.total), salon: Math.round(d.salon), delivery: Math.round(d.delivery), mostrador: Math.round(d.mostrador)
      }));
    }

    if (periodo === 'año') {
      // Agrupa por mes — últimos 12 meses
      const meses = {};
      for (let i = 11; i >= 0; i--) {
        const d   = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        meses[key] = { label: MESES_CORTO[d.getMonth()], total: 0, salon: 0, delivery: 0, mostrador: 0 };
      }
      fuente.forEach(p => {
        if (!p.fecha_pedido) return;
        const d   = new Date(p.fecha_pedido);
        if (isNaN(d.getTime())) return;
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (meses[key]) {
          meses[key].total += p.total || 0;
          const org = (p.origen || '').toLowerCase();
          if      (org === 'salon')     meses[key].salon     += p.total || 0;
          else if (org === 'delivery')  meses[key].delivery  += p.total || 0;
          else if (org === 'mostrador') meses[key].mostrador += p.total || 0;
        }
      });
      return Object.values(meses).map(d => ({ ...d, total: Math.round(d.total), salon: Math.round(d.salon), delivery: Math.round(d.delivery), mostrador: Math.round(d.mostrador) }));
    }
    return [];
  }, [pedidos, filtro, periodo]);

  // ── KPIs (indicadores clave de rendimiento) ───────────────
  // Se recalculan solo cuando cambia la lista de pedidos
  const kpis = useMemo(() => {
    const hoy        = new Date().toISOString().slice(0, 10);
    const ventasHoy  = pedidos.filter(p => p.fecha_pedido?.slice(0, 10) === hoy).reduce((s, p) => s + (p.total || 0), 0);
    const totalGeneral = pedidos.reduce((s, p) => s + (p.total || 0), 0);
    const ticketPromedio = pedidos.length > 0 ? totalGeneral / pedidos.length : 0;
    return { ventasHoy, totalGeneral, ticketPromedio, totalPedidos: pedidos.length };
  }, [pedidos]);

  // Opciones de período con su ícono y etiqueta
  const periodos = [
    { key: 'dia',    label: 'Hoy',    icon: <CalendarDays size={15} /> },
    { key: 'semana', label: 'Semana', icon: <Calendar size={15} /> },
    { key: 'mes',    label: 'Mes',    icon: <CalendarRange size={15} /> },
    { key: 'año',    label: 'Año',    icon: <TrendingUp size={15} /> },
  ];

  return (
    <section className="estadisticas-section">
      <div className="estadisticas-container">

        {/* ── HEADER ── */}
        <div className="estadisticas-header">
          <div>
            <h2 className="estadisticas-title"><BarChart3 size={32} /> Control de Pedidos</h2>
            <p className="estadisticas-subtitle">Historial completo de todos los pedidos realizados</p>
          </div>

          {/* Toggle que alterna entre vista Lista y vista Gráficos */}
          <div className="vista-toggle">
            <button className={`vista-btn ${vista === 'lista' ? 'active' : ''}`} onClick={() => setVista('lista')}>
              📋 Lista
            </button>
            <button className={`vista-btn ${vista === 'graficos' ? 'active' : ''}`} onClick={() => setVista('graficos')}>
              <TrendingUp size={16} /> Estadísticas
            </button>
          </div>
        </div>

        {/* ── FILTROS DE ORIGEN ── */}
        {/* Cambian `filtro` y afectan tanto la lista como los gráficos */}
        <div className="estadisticas-filtros">
          <button className={`filtro-btn ${filtro === 'todos' ? 'active' : ''}`} onClick={() => setFiltro('todos')}>
            Todos ({pedidos.length})
          </button>
          <button className={`filtro-btn ${filtro === 'salon' ? 'active' : ''}`} onClick={() => setFiltro('salon')}>
            <Utensils size={16} /> Mesas ({pedidos.filter(p => (p.origen||'').toLowerCase() === 'salon').length})
          </button>
          <button className={`filtro-btn ${filtro === 'delivery' ? 'active' : ''}`} onClick={() => setFiltro('delivery')}>
            <Truck size={16} /> Delivery ({pedidos.filter(p => (p.origen||'').toLowerCase() === 'delivery').length})
          </button>
          <button className={`filtro-btn ${filtro === 'mostrador' ? 'active' : ''}`} onClick={() => setFiltro('mostrador')}>
            <Coffee size={16} /> Mostrador ({pedidos.filter(p => (p.origen||'').toLowerCase() === 'mostrador').length})
          </button>
        </div>

        {loading && <div className="estadisticas-loading">Cargando pedidos...</div>}
        {error   && <div className="estadisticas-error">Error: {error}</div>}

        {!loading && !error && (
          <>
            {/* ══ VISTA GRÁFICOS ══ */}
            {vista === 'graficos' && (
              <div className="graficos-section">

                {/* KPIs: 4 tarjetas con métricas resumen */}
                <div className="kpis-grid">
                  <div className="kpi-card">
                    <span className="kpi-label">Ventas hoy</span>
                    <span className="kpi-value">${kpis.ventasHoy.toLocaleString()}</span>
                  </div>
                  <div className="kpi-card">
                    <span className="kpi-label">Total general</span>
                    <span className="kpi-value">${kpis.totalGeneral.toLocaleString()}</span>
                  </div>
                  <div className="kpi-card">
                    <span className="kpi-label">Ticket promedio</span>
                    <span className="kpi-value">${Math.round(kpis.ticketPromedio).toLocaleString()}</span>
                  </div>
                  <div className="kpi-card">
                    <span className="kpi-label">Total pedidos</span>
                    <span className="kpi-value">{kpis.totalPedidos}</span>
                  </div>
                </div>

                {/* Selector de período: cambia la escala de tiempo del gráfico */}
                <div className="periodo-selector">
                  {periodos.map(p => (
                    <button key={p.key} className={`periodo-btn ${periodo === p.key ? 'active' : ''}`} onClick={() => setPeriodo(p.key)}>
                      {p.icon} {p.label}
                    </button>
                  ))}
                </div>

                {/* Gráfico de barras: ventas totales por período */}
                <div className="chart-card">
                  <h3 className="chart-title">
                    Ventas por {periodo === 'dia' ? 'hora' : periodo === 'semana' ? 'día' : periodo === 'mes' ? 'día' : 'mes'}
                  </h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={datosGrafico} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
                        tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                      <Tooltip content={<CustomTooltip />} />
                      {/* Una barra verde por período */}
                      <Bar dataKey="total" name="Total" fill="#0d9488" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Gráfico de líneas: comparativa salon vs delivery vs mostrador */}
                <div className="chart-card">
                  <h3 className="chart-title">Comparativa por origen</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={datosGrafico} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="label" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}
                        tickFormatter={v => `$${v >= 1000 ? (v/1000).toFixed(0)+'k' : v}`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ color: '#94a3b8', fontSize: '13px', paddingTop: '12px' }} />
                      <Line type="monotone" dataKey="salon"     name="Salón"     stroke="#3b82f6" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="delivery"  name="Delivery"  stroke="#f59e0b" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="mostrador" name="Mostrador" stroke="#a855f7" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* ══ VISTA LISTA ══ */}
            {vista === 'lista' && (
              <div className="pedidos-lista">
                {pedidosFiltrados.length === 0 ? (
                  <p className="sin-pedidos">No hay pedidos para mostrar.</p>
                ) : (
                  pedidosFiltrados.map((pedido) => {
                    const { fecha, mes, hora } = formatFecha(pedido.fecha_pedido);
                    const origen = (pedido.origen || '').toLowerCase();
                    return (
                      // Clase dinámica según origen para el borde de color izquierdo
                      <div key={pedido.pedido_id} className={`pedido-card pedido-card--${origen}`}>

                        {/* ID + origen + total */}
                        <div className="pedido-card__header">
                          <div className="pedido-card__id-origen">
                            <span className="pedido-id">Pedido #{pedido.pedido_id}</span>
                            <span className={`pedido-origen origen-${origen}`}>
                              {origen === 'salon'     && <><Utensils size={14} /> Mesa</>}
                              {origen === 'delivery'  && <><Truck size={14} /> Delivery</>}
                              {origen === 'mostrador' && <><Coffee size={14} /> Mostrador</>}
                            </span>
                          </div>
                          <span className="pedido-total">${(pedido.total || 0).toLocaleString()}</span>
                        </div>

                        {/* Fecha, mes, hora y usuario que cargó el pedido */}
                        <div className="pedido-card__fechas">
                          <div className="pedido-meta-row"><span className="meta-label">Fecha:</span><span className="meta-value">{fecha}</span></div>
                          <div className="pedido-meta-row"><span className="meta-label">Mes:</span><span className="meta-value">{mes}</span></div>
                          <div className="pedido-meta-row"><span className="meta-label">Hora:</span><span className="meta-value">{hora}</span></div>
                          {(pedido.cargado_por || '').trim() && (
                            <div className="pedido-meta-row"><span className="meta-label">Cargado por:</span><span className="meta-value meta-value--user">{pedido.cargado_por}</span></div>
                          )}
                        </div>

                        {/* Detalles específicos según el origen del pedido */}
                        <div className="pedido-card__detalles">
                          <h4>Detalles del pedido</h4>
                          {origen === 'salon' && (
                            <div className="detalle-block">
                              <div className="detalle-row"><span className="det-label">Mesa:</span> {pedido.mesa != null ? `Mesa ${pedido.mesa}` : (pedido.nombre_cliente || '-')}</div>
                              <div className="detalle-row"><span className="det-label">Mozo:</span> {pedido.mozo ?? '-'}</div>
                              <div className="detalle-row"><span className="det-label">Personas:</span> {pedido.personas ?? '-'}</div>
                            </div>
                          )}
                          {origen === 'delivery' && (
                            <div className="detalle-block">
                              <div className="detalle-row"><span className="det-label">Cliente:</span> {pedido.nombre_cliente}</div>
                              <div className="detalle-row"><span className="det-label">Teléfono:</span> {pedido.telefono || '-'}</div>
                              <div className="detalle-row"><span className="det-label">Dirección:</span> {pedido.direccion}</div>
                            </div>
                          )}
                          {origen === 'mostrador' && (
                            <div className="detalle-block">
                              <div className="detalle-row"><span className="det-label">Cliente:</span> {pedido.nombre_cliente}</div>
                              <div className="detalle-row"><span className="det-label">Camarero:</span> {pedido.camarero || '-'}</div>
                              {pedido.comentario && <div className="detalle-row"><span className="det-label">Comentario:</span> {pedido.comentario}</div>}
                            </div>
                          )}

                          {/* Lista de productos del pedido */}
                          <div className="pedido-items">
                            <strong>Productos:</strong>
                            {pedido.items?.map((it) => (
                              <div key={it.producto_id} className="item-row">
                                <span>{it.nombre}</span>
                                <span>{it.cantidad} x ${(it.precio_unitario || 0).toLocaleString()} = ${((it.cantidad||0) * (it.precio_unitario||0)).toLocaleString()}</span>
                              </div>
                            )) || <p>Sin items</p>}
                          </div>

                          <div className="pedido-total-final">
                            <span>Total:</span>
                            <strong>${(pedido.total || 0).toLocaleString()}</strong>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default Estadisticas;
