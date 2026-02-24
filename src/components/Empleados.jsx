// ============================================================
// Empleados.jsx — GESTIÓN DE EMPLEADOS
// ============================================================
// Permite al administrador ver, agregar y eliminar empleados.
// Los empleados creados acá pueden luego iniciar sesión en la
// app usando el rol "Usuario" (Auth.jsx los busca en /empleados).
//
// Operaciones con el backend:
//   GET    /empleados         → carga la lista de empleados
//   POST   /empleados         → agrega un empleado nuevo
//   DELETE /empleados/:id     → elimina un empleado
//
// Props:
//   businessName → nombre del negocio del admin (para mostrar en header)
// ============================================================

import React, { useState, useEffect } from 'react';
import { Trash2, Plus } from 'lucide-react';
import './Empleados.css';

const API = 'http://localhost:8000'; // URL base del backend FastAPI

export const Empleados = ({ businessName }) => {

  // Lista de empleados cargada desde el backend
  const [employees, setEmployees] = useState([]);

  // true = muestra el formulario de nuevo empleado
  const [showForm, setShowForm] = useState(false);

  // Datos del formulario de nuevo empleado
  const [newEmployee, setNewEmployee] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    rol: 'mozo', // rol por defecto
  });

  // Mensajes de feedback al usuario
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true); // mientras carga la lista inicial

  // Carga la lista de empleados al montar el componente
  useEffect(() => {
    fetchEmployees();
  }, []);

  // GET /empleados → actualiza el estado employees
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/empleados`);
      if (!res.ok) throw new Error('Error al cargar empleados');
      setEmployees(await res.json());
    } catch (e) {
      setError('No se pudo conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  // ── AGREGAR EMPLEADO ──────────────────────────────────────
  // Valida los campos requeridos y hace POST /empleados.
  // Al tener éxito: limpia el formulario, lo oculta y recarga la lista.
  const handleAddEmployee = async () => {
    setError('');
    setSuccess('');

    // Validaciones mínimas antes de enviar
    if (!newEmployee.nombre.trim())   { setError('El nombre es requerido');   return; }
    if (!newEmployee.apellido.trim()) { setError('El apellido es requerido'); return; }
    if (!newEmployee.rol)             { setError('El rol es requerido');       return; }

    try {
      const res = await fetch(`${API}/empleados`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre:   newEmployee.nombre.trim(),
          apellido: newEmployee.apellido.trim(),
          email:    newEmployee.email.trim()    || null, // null si está vacío
          telefono: newEmployee.telefono.trim() || null,
          rol:      newEmployee.rol,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.detail || 'Error al agregar empleado');
        return;
      }

      setSuccess(`Empleado "${newEmployee.nombre}" agregado exitosamente`);

      // Resetea el formulario a valores por defecto
      setNewEmployee({ nombre: '', apellido: '', email: '', telefono: '', rol: 'mozo' });
      setShowForm(false);

      fetchEmployees(); // recarga la lista para mostrar el nuevo empleado

      // Borra el mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError('Error al conectar con el servidor');
    }
  };

  // ── ELIMINAR EMPLEADO ─────────────────────────────────────
  // Pide confirmación al usuario antes de hacer DELETE /empleados/:id
  const handleDeleteEmployee = async (empleadoId, nombre) => {
    // window.confirm muestra un diálogo nativo de confirmación
    if (!window.confirm(`¿Estás seguro que deseas eliminar a ${nombre}?`)) return;

    try {
      const res = await fetch(`${API}/empleados/${empleadoId}`, { method: 'DELETE' });
      if (!res.ok) { setError('Error al eliminar empleado'); return; }

      setSuccess('Empleado dado de baja exitosamente');
      fetchEmployees(); // recarga la lista sin el empleado eliminado
      setTimeout(() => setSuccess(''), 3000);
    } catch (e) {
      setError('Error al conectar con el servidor');
    }
  };

  return (
    <div className="empleados-container">

      {/* ── HEADER ── */}
      <div className="empleados-header">
        <h2>Gestión de Empleados</h2>
        <p className="empleados-business">{businessName}</p>
      </div>

      {/* Mensajes de error y éxito */}
      {error   && <div className="mensaje error">{error}</div>}
      {success && <div className="mensaje success">{success}</div>}

      <div className="empleados-content">

        {/* Botón que muestra/oculta el formulario de nuevo empleado */}
        <div className="empleados-actions">
          <button
            className="btn-agregar-empleado"
            onClick={() => { setShowForm(!showForm); setError(''); }}
          >
            <Plus size={20} /> {showForm ? 'Cancelar' : 'Agregar Empleado'}
          </button>
        </div>

        {/* ── FORMULARIO NUEVO EMPLEADO ── */}
        {/* Solo se renderiza cuando showForm es true */}
        {showForm && (
          <div className="empleado-form">
            <h3>Nuevo Empleado</h3>

            <div className="form-group">
              <label>Nombre: *</label>
              <input
                type="text"
                value={newEmployee.nombre}
                onChange={(e) => setNewEmployee({ ...newEmployee, nombre: e.target.value })}
                placeholder="Ej: Juan"
              />
            </div>

            <div className="form-group">
              <label>Apellido: *</label>
              <input
                type="text"
                value={newEmployee.apellido}
                onChange={(e) => setNewEmployee({ ...newEmployee, apellido: e.target.value })}
                placeholder="Ej: Pérez"
              />
            </div>

            {/* Selector de rol: determina qué puede hacer el empleado */}
            <div className="form-group">
              <label>Rol: *</label>
              <select
                value={newEmployee.rol}
                onChange={(e) => setNewEmployee({ ...newEmployee, rol: e.target.value })}
              >
                <option value="mozo">Mozo</option>
                <option value="cajero">Cajero</option>
                <option value="cocina">Cocina</option>
                <option value="admin">Admin</option>
                <option value="repartidor">Repartidor</option>
              </select>
            </div>

            {/* Campos opcionales */}
            <div className="form-group">
              <label>Email (opcional):</label>
              <input
                type="email"
                value={newEmployee.email}
                onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                placeholder="Ej: juan@email.com"
              />
            </div>

            <div className="form-group">
              <label>Teléfono (opcional):</label>
              <input
                type="tel"
                value={newEmployee.telefono}
                onChange={(e) => setNewEmployee({ ...newEmployee, telefono: e.target.value })}
                placeholder="Ej: 3865123456"
              />
            </div>

            <button className="btn-guardar" onClick={handleAddEmployee}>
              Guardar Empleado
            </button>
          </div>
        )}

        {/* ── LISTA DE EMPLEADOS ── */}
        <div className="empleados-list">
          <h3>Empleados ({employees.length})</h3>

          {loading ? (
            <p className="no-empleados">Cargando empleados...</p>
          ) : employees.length === 0 ? (
            <p className="no-empleados">No hay empleados registrados</p>
          ) : (
            <div className="tabla-empleados">
              {employees.map(emp => (
                <div key={emp.empleado_id} className="empleado-row">

                  {/* Datos del empleado */}
                  <div className="empleado-info">
                    <div className="empleado-nombre">{emp.nombre} {emp.apellido}</div>
                    <div className="empleado-rol">{emp.rol}</div>
                    {emp.email    && <div className="empleado-email">{emp.email}</div>}
                    {emp.telefono && <div className="empleado-phone">{emp.telefono}</div>}
                    {/* Fecha de alta formateada en español */}
                    <div className="empleado-fecha">
                      Agregado: {new Date(emp.fecha_creacion).toLocaleDateString('es-AR')}
                    </div>
                  </div>

                  {/* Botón de baja — pide confirmación antes de eliminar */}
                  <button
                    className="btn-eliminar"
                    onClick={() => handleDeleteEmployee(emp.empleado_id, emp.nombre)}
                    title="Dar de baja"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Empleados;
