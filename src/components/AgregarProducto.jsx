// ============================================================
// AgregarProducto.jsx — MODAL PARA AGREGAR UN PRODUCTO NUEVO
// ============================================================
// Modal que permite crear un producto y guardarlo en el backend.
// Incluye la opción de crear una categoría nueva inline sin
// tener que salir del formulario.
//
// Flujo:
//   1. Carga categorías desde GET /categorias
//   2. El usuario llena nombre, categoría, precio, costo, descripción
//   3. Al guardar → POST /productos
//   4. Si necesita categoría nueva → POST /categorias inline
//
// Props:
//   onClose        → cierra el modal sin guardar
//   onProductAdded → callback que se llama cuando el producto se creó
// ============================================================

import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import './AgregarProducto.css';

const API = 'http://localhost:8000'; // URL base del backend FastAPI

export const AgregarProducto = ({ onClose, onProductAdded }) => {

  // Datos del formulario principal
  const [formData, setFormData] = useState({
    nombre: '', categoria: '', precio: '', costo: '', descripcion: '',
  });

  // Lista de categorías cargadas desde el backend
  const [categorias, setCategorias]   = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);

  // Control del mini-formulario para crear categoría inline
  const [showNuevaCat, setShowNuevaCat]     = useState(false);
  const [nuevaCategoria, setNuevaCategoria] = useState('');
  const [creatingCat, setCreatingCat]       = useState(false);

  // Mensajes de feedback al usuario
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Carga las categorías cuando el modal se abre por primera vez
  useEffect(() => { fetchCategorias(); }, []);

  // GET /categorias → actualiza el selector de categorías
  const fetchCategorias = async () => {
    try {
      setLoadingCats(true);
      const res = await fetch(`${API}/categorias`);
      if (!res.ok) throw new Error();
      setCategorias(await res.json());
    } catch { setCategorias([]); }
    finally { setLoadingCats(false); }
  };

  // POST /categorias → crea la nueva categoría y la auto-selecciona
  const handleCrearCategoria = async () => {
    if (!nuevaCategoria.trim()) return;
    setCreatingCat(true);
    try {
      const res = await fetch(`${API}/categorias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevaCategoria.trim().toLowerCase() }),
      });
      if (!res.ok) { const d = await res.json(); setError(d.detail || 'Error'); return; }
      await fetchCategorias(); // recarga la lista para incluir la nueva
      setFormData(prev => ({ ...prev, categoria: nuevaCategoria.trim().toLowerCase() }));
      setNuevaCategoria('');
      setShowNuevaCat(false);
    } catch { setError('Error al conectar con el servidor'); }
    finally { setCreatingCat(false); }
  };

  // Actualiza el campo del formulario según el `name` del input
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Valida y envía el producto al backend
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');

    if (!formData.nombre.trim())    { setError('El nombre es requerido'); return; }
    if (!formData.categoria)        { setError('Selecciona una categoría'); return; }
    if (!formData.precio || isNaN(formData.precio) || parseFloat(formData.precio) <= 0)
      { setError('El precio debe ser mayor a 0'); return; }
    if (!formData.costo || isNaN(formData.costo) || parseFloat(formData.costo) < 0)
      { setError('El costo debe ser un número válido'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API}/productos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre:      formData.nombre,
          categoria:   formData.categoria,
          precio:      parseFloat(formData.precio),
          costo:       parseFloat(formData.costo),
          descripcion: formData.descripcion || '',
          imagen:      '', // sin imagen, se usa el emoji de productIcons
        }),
      });

      if (res.ok) {
        setSuccess(`Producto "${formData.nombre}" agregado exitosamente`);
        setFormData({ nombre: '', categoria: '', precio: '', costo: '', descripcion: '' });
        // Espera 1.5s para que se vea el mensaje de éxito antes de cerrar
        if (onProductAdded) setTimeout(() => onProductAdded(), 1500);
      } else {
        const d = await res.json();
        setError(d.detail || 'Error al agregar el producto');
      }
    } catch (err) {
      setError('Error al conectar: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    // Overlay — clic fuera cierra el modal
    <div className="agregar-producto-overlay" onClick={onClose}>
      <div className="agregar-producto-modal" onClick={(e) => e.stopPropagation()}>

        <div className="modal-header">
          <h2>Agregar Nuevo Producto</h2>
          <button className="close-btn" onClick={onClose}><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="producto-form">

          {/* Nombre */}
          <div className="form-group">
            <label htmlFor="nombre">Nombre del Producto *</label>
            <input type="text" id="nombre" name="nombre" value={formData.nombre}
              onChange={handleChange} placeholder="Ej: Pizza Margarita" />
          </div>

          {/* Categoría + botón para crear nueva inline */}
          <div className="form-group">
            <label htmlFor="categoria">Categoría *</label>
            <div className="categoria-row">
              <select id="categoria" name="categoria" value={formData.categoria}
                onChange={handleChange} disabled={loadingCats}>
                <option value="">{loadingCats ? 'Cargando...' : 'Selecciona una categoría'}</option>
                {categorias.map(cat => (
                  <option key={cat.categoria_id} value={cat.nombre}>
                    {cat.nombre.charAt(0).toUpperCase() + cat.nombre.slice(1)}
                  </option>
                ))}
              </select>
              {/* Botón + → muestra/oculta el mini-formulario de nueva categoría */}
              <button type="button" className="btn-nueva-cat"
                onClick={() => setShowNuevaCat(!showNuevaCat)} title="Crear nueva categoría">
                <Plus size={18} />
              </button>
            </div>

            {/* Mini-formulario para crear categoría sin salir del modal */}
            {showNuevaCat && (
              <div className="nueva-cat-form">
                <input
                  type="text" placeholder="Nombre de la nueva categoría"
                  value={nuevaCategoria} onChange={(e) => setNuevaCategoria(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCrearCategoria()} // Enter confirma
                  autoFocus
                />
                <button type="button" className="btn-guardar-cat"
                  onClick={handleCrearCategoria} disabled={creatingCat || !nuevaCategoria.trim()}>
                  {creatingCat ? 'Creando...' : 'Crear'}
                </button>
                <button type="button" className="btn-cancelar-cat"
                  onClick={() => { setShowNuevaCat(false); setNuevaCategoria(''); }}>
                  Cancelar
                </button>
              </div>
            )}
          </div>

          {/* Precio y costo en la misma fila */}
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="precio">Precio de Venta ($) *</label>
              <input type="number" id="precio" name="precio" value={formData.precio}
                onChange={handleChange} placeholder="0.00" step="0.01" min="0" />
            </div>
            <div className="form-group">
              <label htmlFor="costo">Costo ($) *</label>
              <input type="number" id="costo" name="costo" value={formData.costo}
                onChange={handleChange} placeholder="0.00" step="0.01" min="0" />
            </div>
          </div>

          {/* Descripción opcional */}
          <div className="form-group">
            <label htmlFor="descripcion">Descripción (opcional)</label>
            <textarea id="descripcion" name="descripcion" value={formData.descripcion}
              onChange={handleChange} placeholder="Ej: Pizza de 30cm con doble queso" rows="3" />
          </div>

          {error   && <div className="mensaje error">{error}</div>}
          {success && <div className="mensaje success">{success}</div>}

          <div className="form-actions">
            <button type="button" className="btn-cancelar" onClick={onClose} disabled={loading}>Cancelar</button>
            <button type="submit" className="btn-guardar" disabled={loading}>
              {loading ? 'Guardando...' : 'Agregar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AgregarProducto;
