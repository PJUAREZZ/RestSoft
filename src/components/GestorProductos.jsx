// ============================================================
// GestorProductos.jsx — PÁGINA DE GESTIÓN DE PRODUCTOS
// ============================================================
// Muestra todos los productos agrupados por categoría.
// Permite editar cada producto inline (sin salir de la página)
// y agregar nuevos productos o categorías desde un modal unificado.
//
// Flujo principal:
//   - GET /productos  → lista todos los productos del negocio
//   - GET /categorias → lista las categorías de la tabla categorias
//   - Las categorías se calculan como UNIÓN de ambas fuentes,
//     así nunca queda un producto "huérfano" sin mostrarse
//   - PUT /productos/:id → guarda edición inline
//   - POST /productos    → crea producto nuevo (desde modal)
//   - POST /categorias   → crea categoría nueva (desde modal)
// ============================================================

import React, { useState, useEffect } from 'react';
import { Plus, Package, Pencil, Tag, X } from 'lucide-react';
import { getProductIcon } from './productIcons'; // emoji según categoría/nombre
import './GestorProductos.css';

const API = 'http://localhost:8000';

export const GestorProductos = () => {
  const [products, setProducts]   = useState([]);   // todos los productos del backend
  const [categorias, setCategorias] = useState([]); // categorías de la tabla /categorias
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);

  // ── EDICIÓN INLINE ────────────────────────────────────────
  const [editingId, setEditingId] = useState(null); // producto_id que está siendo editado
  const [editData, setEditData]   = useState({ nombre: '', descripcion: '', precio: '', costo: '', categoria: '' });
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState('');

  // ── MODAL UNIFICADO ───────────────────────────────────────
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab]   = useState('producto'); // 'producto' | 'categoria'

  // Formulario nuevo producto (dentro del modal)
  const [fp, setFp]           = useState({ nombre: '', categoria: '', precio: '', costo: '', descripcion: '' });
  const [fpError, setFpError] = useState('');
  const [fpOk, setFpOk]       = useState('');
  const [savingFp, setSavingFp] = useState(false);

  // Formulario nueva categoría (dentro del modal)
  const [fc, setFc]           = useState({ nombre: '', descripcion: '' });
  const [fcError, setFcError] = useState('');
  const [fcOk, setFcOk]       = useState('');
  const [savingFc, setSavingFc] = useState(false);

  // GET /productos — carga todos los productos del backend
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/productos`);
      if (!res.ok) throw new Error('Error al cargar productos');
      setProducts(await res.json());
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  // GET /categorias — carga la tabla de categorías
  const fetchCategorias = async () => {
    try {
      const res = await fetch(`${API}/categorias`);
      if (!res.ok) return;
      setCategorias(await res.json()); // objetos { categoria_id, nombre, ... }
    } catch { setCategorias([]); }
  };

  useEffect(() => { fetchProducts(); fetchCategorias(); }, []);

  // ── TODAS LAS CATEGORÍAS ──────────────────────────────────
  // Combina las categorías de la tabla /categorias con las que
  // usan los productos actualmente. Así nunca queda ningún producto
  // oculto aunque su categoría no esté en la tabla.
  const todasLasCategorias = React.useMemo(() => {
    const deCatalogo  = categorias.map(c => c.nombre.toLowerCase());
    const deProductos = products.map(p => (p.categoria || '').toLowerCase()).filter(Boolean);
    return [...new Set([...deCatalogo, ...deProductos])].sort();
  }, [categorias, products]);

  // Filtra los productos que pertenecen a una categoría específica
  const productsByCat = (cat) =>
    products.filter(p => (p.categoria || '').toLowerCase() === cat.toLowerCase());

  // ── EDICIÓN INLINE ────────────────────────────────────────
  // Activa el modo edición para un producto: llena editData con sus valores actuales
  const startEdit = (product) => {
    setSaveError('');
    setEditingId(product.producto_id);
    setEditData({
      nombre:      product.nombre || '',
      descripcion: product.descripcion || '',
      precio:      product.precio != null ? String(product.precio) : '',
      costo:       product.costo  != null ? String(product.costo)  : '',
      categoria:   (product.categoria || '').toLowerCase(),
    });
  };

  const cancelEdit = () => { setEditingId(null); setSaveError(''); };

  // PUT /productos/:id — guarda los cambios del producto editado
  const handleSave = async () => {
    if (!editingId) return;
    setSaveError('');
    if (!editData.nombre.trim())                       { setSaveError('El nombre es obligatorio'); return; }
    if (!editData.categoria)                           { setSaveError('Selecciona una categoría'); return; }
    if (!editData.precio || isNaN(editData.precio))    { setSaveError('El precio debe ser un número'); return; }

    const payload = {
      nombre:      editData.nombre.trim(),
      descripcion: editData.descripcion || '',
      precio:      parseFloat(editData.precio),
      categoria:   editData.categoria,
    };
    if (editData.costo !== '' && !isNaN(editData.costo)) payload.costo = parseFloat(editData.costo);

    setSaving(true);
    try {
      const res = await fetch(`${API}/productos/${editingId}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Error al actualizar');
      // Actualiza el producto en el estado local sin recargar toda la lista
      setProducts(prev => prev.map(p => p.producto_id === editingId ? { ...p, ...payload } : p));
      setEditingId(null);
    } catch (e) { setSaveError(e.message); }
    finally { setSaving(false); }
  };

  // ── GUARDAR PRODUCTO NUEVO ────────────────────────────────
  // POST /productos desde el modal
  const handleGuardarProducto = async () => {
    setFpError(''); setFpOk('');
    if (!fp.nombre.trim())    { setFpError('El nombre es requerido'); return; }
    if (!fp.categoria)        { setFpError('Selecciona una categoría'); return; }
    if (!fp.precio || isNaN(fp.precio) || parseFloat(fp.precio) <= 0) { setFpError('Precio inválido'); return; }

    setSavingFp(true);
    try {
      const res = await fetch(`${API}/productos`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          nombre:      fp.nombre.trim(),
          categoria:   fp.categoria,
          precio:      parseFloat(fp.precio),
          costo:       fp.costo !== '' && !isNaN(fp.costo) ? parseFloat(fp.costo) : 0,
          descripcion: fp.descripcion || '',
          imagen:      '',
        }),
      });
      if (!res.ok) { const d = await res.json(); setFpError(d.detail || 'Error'); return; }
      setFpOk(`"${fp.nombre}" agregado ✓`);
      setFp({ nombre: '', categoria: '', precio: '', costo: '', descripcion: '' });
      fetchProducts(); // recarga la lista para mostrar el nuevo producto
      setTimeout(() => setFpOk(''), 3000);
    } catch { setFpError('Error al conectar'); }
    finally { setSavingFp(false); }
  };

  // ── GUARDAR CATEGORÍA NUEVA ───────────────────────────────
  // POST /categorias desde el modal, luego vuelve al tab de producto
  const handleGuardarCategoria = async () => {
    setFcError(''); setFcOk('');
    if (!fc.nombre.trim()) { setFcError('El nombre es requerido'); return; }

    setSavingFc(true);
    try {
      const res = await fetch(`${API}/categorias`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ nombre: fc.nombre.trim().toLowerCase(), descripcion: fc.descripcion || '' }),
      });
      if (!res.ok) { const d = await res.json(); setFcError(d.detail || 'Error'); return; }
      setFcOk(`Categoría "${fc.nombre}" creada ✓`);
      setFc({ nombre: '', descripcion: '' });
      await fetchCategorias(); // recarga para que aparezca en el selector
      // Vuelve automáticamente al tab de producto tras 1.5s
      setTimeout(() => { setModalTab('producto'); setFcOk(''); }, 1500);
    } catch { setFcError('Error al conectar'); }
    finally { setSavingFc(false); }
  };

  // Cierra el modal y limpia todos los estados del formulario
  const closeModal = () => {
    setShowModal(false);
    setFp({ nombre: '', categoria: '', precio: '', costo: '', descripcion: '' });
    setFpError(''); setFpOk('');
    setFc({ nombre: '', descripcion: '' });
    setFcError(''); setFcOk('');
  };

  return (
    <div className="gestor-page">

      {/* ── HEADER DE LA PÁGINA ── */}
      <div className="gestor-page-header">
        <div className="gestor-header-left">
          <Package size={28} />
          <div>
            <h1 className="gestor-title">Gestión de Productos</h1>
            {/* Muestra el conteo total de productos y categorías */}
            <p className="gestor-subtitle">
              {products.length} producto{products.length !== 1 ? 's' : ''} · {todasLasCategorias.length} categoría{todasLasCategorias.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        {/* Botón que abre el modal unificado en el tab de producto */}
        <button className="gestor-btn-agregar" onClick={() => { setShowModal(true); setModalTab('producto'); }}>
          <Plus size={20} /> Agregar
        </button>
      </div>

      {/* ── LISTADO DE PRODUCTOS POR CATEGORÍA ── */}
      <div className="gestor-content">
        {loading && (
          <div className="gestor-loading">
            <div className="gestor-spinner" />
            <p>Cargando productos...</p>
          </div>
        )}

        {error && <div className="gestor-error"><p>⚠️ {error}</p></div>}

        {/* Estado vacío: no hay productos ni categorías */}
        {!loading && !error && todasLasCategorias.length === 0 && (
          <div className="gestor-empty-state">
            <Package size={48} />
            <p>No hay productos todavía.</p>
            <button className="gestor-btn-agregar" onClick={() => { setShowModal(true); setModalTab('categoria'); }}>
              <Plus size={18} /> Crear primera categoría
            </button>
          </div>
        )}

        {/* Renderiza una sección por cada categoría */}
        {!loading && !error && todasLasCategorias.map(cat => {
          const items = productsByCat(cat);
          return (
            <section key={cat} className="gestor-categoria-block">
              <h2 className="gestor-categoria-titulo">
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                <span className="gestor-categoria-count">{items.length} producto{items.length !== 1 ? 's' : ''}</span>
              </h2>

              {items.length === 0 ? (
                <p className="gestor-empty">Sin productos en esta categoría aún.</p>
              ) : (
                <div className="gestor-productos-grid">
                  {items.map(p => {
                    const isEditing = editingId === p.producto_id; // ¿este producto está en modo edición?
                    return (
                      <article key={p.producto_id} className="gestor-producto-card">
                        {/* Emoji del producto según categoría o nombre */}
                        <div className="gestor-producto-icon">
                          {getProductIcon(p.categoria, p.nombre, 40)}
                        </div>

                        <div className="gestor-producto-info">
                          {/* ── MODO VISTA NORMAL ── */}
                          {!isEditing ? (
                            <>
                              <div className="gestor-producto-header">
                                <h3 className="gestor-producto-nombre">{p.nombre}</h3>
                                {/* Botón que activa el modo edición inline */}
                                <button className="gestor-edit-btn" onClick={() => startEdit(p)}>
                                  <Pencil size={16} /> Editar
                                </button>
                              </div>
                              {p.descripcion && <p className="gestor-producto-desc">{p.descripcion}</p>}
                              <div className="gestor-producto-precios">
                                <span className="gestor-precio-venta">${(p.precio ?? 0).toLocaleString()}</span>
                                {p.costo != null && p.costo !== '' && (
                                  <span className="gestor-precio-costo">Costo: ${Number(p.costo).toLocaleString()}</span>
                                )}
                                <span className="gestor-precio-cat">📁 {p.categoria}</span>
                              </div>
                            </>
                          ) : (
                            /* ── MODO EDICIÓN INLINE ── */
                            <div className="gestor-edit-form">
                              <div className="gestor-edit-row">
                                <label>Nombre
                                  <input name="nombre" value={editData.nombre}
                                    onChange={e => setEditData(prev => ({ ...prev, nombre: e.target.value }))}
                                    className="gestor-edit-input" />
                                </label>
                                <label>Categoría
                                  <select name="categoria" value={editData.categoria}
                                    onChange={e => setEditData(prev => ({ ...prev, categoria: e.target.value }))}
                                    className="gestor-edit-select">
                                    <option value="">Seleccionar...</option>
                                    {todasLasCategorias.map(c => (
                                      <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                    ))}
                                  </select>
                                </label>
                              </div>
                              <label>Descripción
                                <textarea name="descripcion" value={editData.descripcion}
                                  onChange={e => setEditData(prev => ({ ...prev, descripcion: e.target.value }))}
                                  className="gestor-edit-textarea" rows={2} />
                              </label>
                              <div className="gestor-edit-row">
                                <label>Precio
                                  <input name="precio" value={editData.precio}
                                    onChange={e => setEditData(prev => ({ ...prev, precio: e.target.value }))}
                                    className="gestor-edit-input" />
                                </label>
                                <label>Costo
                                  <input name="costo" value={editData.costo}
                                    onChange={e => setEditData(prev => ({ ...prev, costo: e.target.value }))}
                                    className="gestor-edit-input" />
                                </label>
                              </div>
                              {saveError && <div className="gestor-edit-error">{saveError}</div>}
                              <div className="gestor-edit-actions">
                                <button className="gestor-edit-cancel" onClick={cancelEdit} disabled={saving}>Cancelar</button>
                                <button className="gestor-edit-save" onClick={handleSave} disabled={saving}>
                                  {saving ? 'Guardando...' : 'Guardar cambios'}
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {/* ── MODAL UNIFICADO: PRODUCTO + CATEGORÍA ── */}
      {showModal && (
        <div className="gp-modal-overlay" onClick={closeModal}>
          <div className="gp-modal" onClick={e => e.stopPropagation()}>

            {/* Header del modal */}
            <div className="gp-modal-header">
              <h2>Agregar</h2>
              <button className="gp-modal-close" onClick={closeModal}><X size={22} /></button>
            </div>

            {/* Tabs: "Nuevo producto" | "Nueva categoría" */}
            <div className="gp-modal-tabs">
              <button className={`gp-tab ${modalTab === 'producto' ? 'active' : ''}`} onClick={() => setModalTab('producto')}>
                <Plus size={16} /> Nuevo producto
              </button>
              <button className={`gp-tab ${modalTab === 'categoria' ? 'active' : ''}`} onClick={() => setModalTab('categoria')}>
                <Tag size={16} /> Nueva categoría
              </button>
            </div>

            {/* ── TAB: NUEVO PRODUCTO ── */}
            {modalTab === 'producto' && (
              <div className="gp-modal-body">
                <div className="gp-form-group">
                  <label>Nombre *</label>
                  <input type="text" placeholder="Ej: Pizza Margarita" value={fp.nombre}
                    onChange={e => setFp(p => ({ ...p, nombre: e.target.value }))} />
                </div>

                <div className="gp-form-group">
                  <label>Categoría *</label>
                  <div className="gp-cat-row">
                    {/* Selector con todas las categorías disponibles */}
                    <select value={fp.categoria} onChange={e => setFp(p => ({ ...p, categoria: e.target.value }))}>
                      <option value="">Selecciona una categoría</option>
                      {todasLasCategorias.map(c => (
                        <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                      ))}
                    </select>
                    {/* Botón "Nueva" → cambia al tab de categoría */}
                    <button type="button" className="gp-btn-nueva-cat" onClick={() => setModalTab('categoria')} title="Crear nueva categoría">
                      <Tag size={15} /> Nueva
                    </button>
                  </div>
                </div>

                <div className="gp-form-row">
                  <div className="gp-form-group">
                    <label>Precio ($) *</label>
                    <input type="number" placeholder="0.00" step="0.01" min="0" value={fp.precio}
                      onChange={e => setFp(p => ({ ...p, precio: e.target.value }))} />
                  </div>
                  <div className="gp-form-group">
                    <label>Costo ($)</label>
                    <input type="number" placeholder="0.00" step="0.01" min="0" value={fp.costo}
                      onChange={e => setFp(p => ({ ...p, costo: e.target.value }))} />
                  </div>
                </div>

                <div className="gp-form-group">
                  <label>Descripción (opcional)</label>
                  <textarea placeholder="Ej: Pizza de 30cm con doble queso" rows={3} value={fp.descripcion}
                    onChange={e => setFp(p => ({ ...p, descripcion: e.target.value }))} />
                </div>

                {fpError && <div className="gp-msg gp-msg--error">{fpError}</div>}
                {fpOk    && <div className="gp-msg gp-msg--ok">{fpOk}</div>}

                <div className="gp-modal-actions">
                  <button className="gp-btn-cancel" onClick={closeModal} disabled={savingFp}>Cancelar</button>
                  <button className="gp-btn-save" onClick={handleGuardarProducto} disabled={savingFp}>
                    {savingFp ? 'Guardando...' : 'Agregar producto'}
                  </button>
                </div>
              </div>
            )}

            {/* ── TAB: NUEVA CATEGORÍA ── */}
            {modalTab === 'categoria' && (
              <div className="gp-modal-body">
                <div className="gp-form-group">
                  <label>Nombre de la categoría *</label>
                  <input type="text" placeholder="Ej: Pasta, Ensalada, Postre..." value={fc.nombre}
                    onChange={e => setFc(p => ({ ...p, nombre: e.target.value }))}
                    onKeyDown={e => e.key === 'Enter' && handleGuardarCategoria()} autoFocus />
                </div>

                <div className="gp-form-group">
                  <label>Descripción (opcional)</label>
                  <textarea placeholder="Ej: Todos los platos de pasta artesanal" rows={2} value={fc.descripcion}
                    onChange={e => setFc(p => ({ ...p, descripcion: e.target.value }))} />
                </div>

                {/* Chips con las categorías existentes para no duplicar */}
                {todasLasCategorias.length > 0 && (
                  <div className="gp-cats-existentes">
                    <p className="gp-cats-titulo">Categorías actuales:</p>
                    <div className="gp-cats-chips">
                      {todasLasCategorias.map(c => (
                        <span key={c} className="gp-cat-chip">{c.charAt(0).toUpperCase() + c.slice(1)}</span>
                      ))}
                    </div>
                  </div>
                )}

                {fcError && <div className="gp-msg gp-msg--error">{fcError}</div>}
                {fcOk    && <div className="gp-msg gp-msg--ok">{fcOk}</div>}

                <div className="gp-modal-actions">
                  {/* Volver al tab producto sin crear nada */}
                  <button className="gp-btn-cancel" onClick={() => setModalTab('producto')} disabled={savingFc}>← Volver a producto</button>
                  <button className="gp-btn-save" onClick={handleGuardarCategoria} disabled={savingFc}>
                    {savingFc ? 'Creando...' : 'Crear categoría'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </div>
  );
};

export default GestorProductos;
