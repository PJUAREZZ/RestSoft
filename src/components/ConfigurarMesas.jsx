// ============================================================
// ConfigurarMesas.jsx — MODAL PARA CONFIGURAR CANTIDAD DE MESAS
// ============================================================
// Modal que aparece cuando el admin hace clic en el ícono de
// configuración (⚙️) en la página de Salon.
// Permite cambiar la cantidad de mesas del salón entre 1 y 100.
//
// Props:
//   currentTableCount → número actual de mesas (para mostrar en pantalla)
//   onConfirm         → función que recibe la nueva cantidad y aplica el cambio
//   onClose           → función para cerrar el modal sin guardar
// ============================================================

import React, { useState } from 'react';
import { X } from 'lucide-react';
import './ConfigurarMesas.css';

export const ConfigurarMesas = ({ currentTableCount, onConfirm, onClose }) => {

  // ── ESTADO: CANTIDAD INGRESADA ────────────────────────────
  // Se inicializa con el valor actual para que el input no arranque vacío
  const [cantidad, setCantidad] = useState(currentTableCount || 30);

  // ── ESTADO: MENSAJE DE ERROR ──────────────────────────────
  const [error, setError] = useState('');

  // ── HANDLER: CAMBIO EN EL INPUT ──────────────────────────
  // Convierte el valor a número entero (parseInt) o 0 si está vacío
  const handleChange = (e) => {
    const value = parseInt(e.target.value) || 0;
    setCantidad(value);
    setError(''); // limpia el error al escribir
  };

  // ── HANDLER: CONFIRMAR ────────────────────────────────────
  // Valida que el número esté entre 1 y 100 antes de llamar a onConfirm.
  // Si hay error, lo muestra sin cerrar el modal.
  const handleSubmit = (e) => {
    e.preventDefault(); // evita recarga de página

    if (cantidad < 1) {
      setError('Debe tener al menos 1 mesa'); return;
    }
    if (cantidad > 100) {
      setError('El máximo permitido es 100 mesas'); return;
    }

    // Llama a la función de Salon.jsx que actualiza las mesas y cierra el modal
    onConfirm(cantidad);
  };

  return (
    // Overlay oscuro — clic fuera del modal lo cierra
    <div className="configurar-mesas-overlay" onClick={onClose}>

      {/* Contenedor del modal — stopPropagation evita que el clic se propague al overlay */}
      <div className="configurar-mesas-modal" onClick={(e) => e.stopPropagation()}>

        {/* ── HEADER DEL MODAL ── */}
        <div className="modal-header">
          <h2>Configurar Número de Mesas</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* ── FORMULARIO ── */}
        <form onSubmit={handleSubmit} className="mesas-form">

          <div className="form-group">
            <label htmlFor="cantidad">Cantidad de mesas:</label>
            <input
              type="number"
              id="cantidad"
              value={cantidad}
              onChange={handleChange}
              min="1"
              max="100"
              required
            />
            <small>Ingresa un número entre 1 y 100</small>
          </div>

          {/* Mensaje de error si la validación falla */}
          {error && <div className="mensaje error">{error}</div>}

          {/* ── INFORMACIÓN COMPARATIVA ── */}
          {/* Le muestra al admin qué va a pasar si confirma */}
          <div className="form-info">
            <p>Mesas actualmente: <strong>{currentTableCount}</strong></p>
            <p>Mesas nuevas: <strong>{cantidad}</strong></p>

            {/* Mensaje verde si va a agregar mesas */}
            {cantidad > currentTableCount && (
              <p className="info-success">Se agregarán {cantidad - currentTableCount} mesas</p>
            )}

            {/* Advertencia amarilla si va a eliminar mesas */}
            {cantidad < currentTableCount && (
              <p className="info-warning">Se eliminarán {currentTableCount - cantidad} mesas y sus pedidos</p>
            )}
          </div>

          {/* ── BOTONES DE ACCIÓN ── */}
          <div className="form-actions">
            <button type="button" className="btn-cancelar" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn-confirmar">
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConfigurarMesas;
