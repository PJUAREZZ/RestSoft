// ============================================================
// App.jsx — COMPONENTE RAÍZ DE LA APLICACIÓN
// ============================================================
// Es el "cerebro" principal. Controla:
//   1. Si el usuario eligió un rol (admin o usuario)
//   2. Si el usuario está autenticado (logueado)
//   3. Qué página se está mostrando actualmente
//
// Flujo de pantallas:
//   Sin rol    →  RoleSelector  (elegir Admin o Usuario)
//   Con rol    →  Auth          (login o registro)
//   Logueado   →  Navegador + página activa
// ============================================================

import React from 'react';
import './App.css';

// Importación de todos los componentes de la app
import { Navegador }       from './components/Navegador';        // Barra de navegación superior
import { Auth }            from './components/Auth';              // Pantalla de login/registro
import { RoleSelector }    from './components/RoleSelector';      // Pantalla para elegir rol
import { Salon }           from './components/Salon';             // Pedidos: salon, delivery, mostrador
import { Estadisticas }    from './components/Estadisticas';      // Historial de pedidos y gráficos
import { Empleados }       from './components/Empleados';         // ABM de empleados
import { GestorProductos } from './components/GestorProductos';   // ABM de productos y categorías
import { Footer }          from './components/Footer';            // Pie de página

// BrowserRouter: habilita el sistema de rutas por URL
// Routes / Route: mapean una URL a un componente
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {

  // ── ESTADO 1: ROL SELECCIONADO ────────────────────────────
  // Guarda 'admin' o 'user' según lo que eligió en RoleSelector.
  // Se inicializa desde localStorage para no perder la sesión al recargar.
  const [selectedRole, setSelectedRole] = React.useState(() => {
    try {
      return localStorage.getItem('selectedRole') || null;
    } catch (e) {
      return null;
    }
  });

  // ── ESTADO 2: USUARIO ACTUAL ──────────────────────────────
  // Guarda el objeto del usuario logueado: { name, email, role, businessName, phone }
  // También persiste en localStorage para sobrevivir recargas de página.
  const [currentUser, setCurrentUser] = React.useState(() => {
    try {
      return JSON.parse(localStorage.getItem('currentUser')) || null;
    } catch (e) {
      return null;
    }
  });

  // ── ESTADO 3: PÁGINA ACTIVA ───────────────────────────────
  // Controla qué sección se renderiza: 'salon' | 'estadisticas' | 'empleados' | 'productos'
  // Por defecto arranca en 'salon' (pantalla de pedidos)
  const [currentPage, setCurrentPage] = React.useState('salon');

  // ── HANDLER: ELEGIR ROL ───────────────────────────────────
  // Se llama cuando el usuario toca "Administrador" o "Usuario" en RoleSelector.
  // Guarda la elección y avanza a la pantalla de login.
  const handleSelectRole = (role) => {
    localStorage.setItem('selectedRole', role);
    setSelectedRole(role);
  };

  // ── HANDLER: VOLVER A SELECCIÓN DE ROL ───────────────────
  // Borra el rol y vuelve a mostrar RoleSelector.
  // Se usa cuando el usuario presiona "Volver atrás" en Auth.
  const handleBackToRole = () => {
    localStorage.removeItem('selectedRole');
    setSelectedRole(null);
  };

  // ── HANDLER: LOGIN / REGISTRO EXITOSO ────────────────────
  // Recibe el objeto usuario desde Auth, le agrega el rol,
  // lo guarda en localStorage y actualiza el estado.
  const handleAuth = (user) => {
    const userWithRole = { ...user, role: selectedRole }; // combina datos del usuario + rol
    localStorage.setItem('currentUser', JSON.stringify(userWithRole));
    setCurrentUser(userWithRole);
  };

  // ── HANDLER: CERRAR SESIÓN ────────────────────────────────
  // Limpia localStorage y resetea todos los estados.
  // La app vuelve a mostrar RoleSelector.
  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('selectedRole');
    setCurrentUser(null);
    setSelectedRole(null);
    setCurrentPage('salon');
  };

  // ── PANTALLA A: SIN ROL ───────────────────────────────────
  // Si todavía no se eligió rol, muestra la pantalla de bienvenida
  if (!selectedRole) {
    return (
      <div className="app">
        <RoleSelector onSelectRole={handleSelectRole} />
      </div>
    );
  }

  // ── PANTALLA B: SIN USUARIO ───────────────────────────────
  // Si hay rol pero no hay sesión iniciada, muestra el formulario de auth
  if (!currentUser) {
    return (
      <div className="app">
        <Auth onAuth={handleAuth} role={selectedRole} onBack={handleBackToRole} />
      </div>
    );
  }

  // ── FUNCIÓN: DECIDIR QUÉ PÁGINA MOSTRAR ──────────────────
  // Según currentPage, devuelve el componente correcto + Footer.
  // Protección de rutas: si el usuario NO es admin e intenta entrar
  // a 'empleados' o 'productos', lo redirige al salon.
  const renderPage = () => {
    switch (currentPage) {

      case 'salon':
        // Todos los roles pueden ver y cargar pedidos
        return <><Salon currentUser={currentUser} /><Footer /></>;

      case 'estadisticas':
        // Historial completo de pedidos con gráficos de ventas
        return <><Estadisticas /><Footer /></>;

      case 'empleados':
        // Solo admin: gestión de empleados (alta, baja, listado)
        // Usuario normal: redirige silenciosamente al salon
        if (currentUser.role === 'admin') {
          return <><Empleados businessName={currentUser.businessName || 'Mi Negocio'} /><Footer /></>;
        }
        return <><Salon currentUser={currentUser} /><Footer /></>;

      case 'productos':
        // Solo admin: gestión de productos y categorías
        if (currentUser.role === 'admin') {
          return <><GestorProductos /><Footer /></>;
        }
        return <><Salon currentUser={currentUser} /><Footer /></>;

      default:
        // Cualquier página desconocida cae en el salon
        return <><Salon currentUser={currentUser} /><Footer /></>;
    }
  };

  // ── PANTALLA C: APP PRINCIPAL (usuario logueado) ──────────
  // Muestra el navegador fijo arriba y la página activa debajo.
  // BrowserRouter es necesario para que Navegador pueda usar useNavigate().
  return (
    <div className="app">
      <BrowserRouter>
        {/* Navegador siempre visible en la parte superior */}
        <Navegador
          currentUser={currentUser}
          onLogout={handleLogout}
          onPageChange={setCurrentPage}  // función que cambia la página al hacer clic en un ícono
          currentPage={currentPage}       // página actual para resaltar el ícono activo
        />
        <Routes>
          {/* Toda la app vive en una sola ruta "/" */}
          <Route path="/" element={renderPage()} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
