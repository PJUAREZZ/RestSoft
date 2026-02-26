// ============================================================
// App.jsx — COMPONENTE RAÍZ DE LA APLICACIÓN
// ============================================================
// Es el "cerebro" principal de la app. Controla:
//   1. Qué rol eligió el usuario (admin o usuario)
//   2. Si hay un usuario autenticado (logueado)
//   3. Si el SplashScreen está visible (se muestra post-login)
//   4. El usuario "pendiente" que espera a que el splash termine
//   5. Qué página se está mostrando actualmente
//
// Flujo de pantallas:
//   Sin rol      →  RoleSelector   (elegir Admin o Usuario)
//   Con rol      →  Auth           (login o registro)
//   Login OK     →  SplashScreen   (5 segundos de animación)
//   Splash OK    →  Navegador + página activa
// ============================================================

import React from 'react';
import './App.css';

// ── IMPORTACIÓN DE COMPONENTES ────────────────────────────
import { SplashScreen }    from './components/SplashScreen';      // Pantalla animada de carga (post-login)
import { Navegador }       from './components/Navegador';          // Barra de navegación superior
import { Auth }            from './components/Auth';               // Pantalla de login/registro
import { RoleSelector }    from './components/RoleSelector';       // Pantalla para elegir rol
import { Salon }           from './components/Salon';              // Pedidos: salón, delivery, mostrador
import { Estadisticas }    from './components/Estadisticas';       // Historial de pedidos y gráficos
import { Empleados }       from './components/Empleados';          // ABM de empleados
import { GestorProductos } from './components/GestorProductos';    // ABM de productos y categorías
import { Footer }          from './components/Footer';             // Pie de página

// BrowserRouter: habilita el sistema de rutas por URL
// Routes / Route: mapean una URL a un componente
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {

  // ── ESTADO 1: ROL SELECCIONADO ────────────────────────────
  // Guarda 'admin' o 'user' según lo que eligió en RoleSelector.
  // Se inicializa desde localStorage para no perder la elección al recargar.
  const [selectedRole, setSelectedRole] = React.useState(() => {
    try { return localStorage.getItem('selectedRole') || null; }
    catch (e) { return null; }
  });

  // ── ESTADO 2: USUARIO ACTUAL ──────────────────────────────
  // Guarda el objeto del usuario que ya pasó el splash y está dentro de la app.
  // Arranca en null — se llena recién cuando el SplashScreen termina.
  const [currentUser, setCurrentUser] = React.useState(null);

  // ── ESTADO 3: PÁGINA ACTIVA ───────────────────────────────
  // Controla qué sección se renderiza: 'salon' | 'estadisticas' | 'empleados' | 'productos'
  // Por defecto arranca en 'salon' (pantalla de pedidos)
  const [currentPage, setCurrentPage] = React.useState('salon');

  // ── ESTADO 4: SPLASH VISIBLE ─────────────────────────────
  // Arranca en false. Se activa SOLO cuando el login/registro es exitoso.
  // Mientras sea true, se muestra el SplashScreen en vez de la app.
  const [splashVisible, setSplashVisible] = React.useState(false);

  // ── ESTADO 5: USUARIO PENDIENTE ──────────────────────────
  // Actúa como "sala de espera" del usuario autenticado.
  // Cuando Auth valida las credenciales, el usuario entra aquí.
  // Recién cuando el SplashScreen termina sus 5 segundos,
  // el pendingUser se mueve a currentUser y la app se abre.
  const [pendingUser, setPendingUser] = React.useState(null);

  // ── HANDLER: SPLASH TERMINADA ─────────────────────────────
  // Lo llama SplashScreen al cumplirse los 5 segundos.
  // Apaga el splash, toma el usuario de la "sala de espera"
  // (pendingUser), lo guarda en localStorage y lo setea como actual.
  // useCallback evita que se recree la función en cada render.
  const handleSplashFinish = React.useCallback(() => {
    setSplashVisible(false);           // oculta el splash
    if (pendingUser) {
      localStorage.setItem('currentUser', JSON.stringify(pendingUser)); // persiste en localStorage
      setCurrentUser(pendingUser);     // habilita el acceso a la app
      setPendingUser(null);            // limpia la sala de espera
    }
  }, [pendingUser]);

  // ── HANDLER: ELEGIR ROL ───────────────────────────────────
  // Se llama cuando el usuario toca "Administrador" o "Usuario" en RoleSelector.
  // Persiste el rol en localStorage y avanza a la pantalla de Auth.
  const handleSelectRole = (role) => {
    localStorage.setItem('selectedRole', role);
    setSelectedRole(role);
  };

  // ── HANDLER: VOLVER A SELECCIÓN DE ROL ───────────────────
  // Borra el rol guardado y vuelve a mostrar RoleSelector.
  // Se usa cuando el usuario presiona "Volver atrás" en Auth.
  const handleBackToRole = () => {
    localStorage.removeItem('selectedRole');
    setSelectedRole(null);
  };

  // ── HANDLER: LOGIN / REGISTRO EXITOSO ────────────────────
  // Auth llama a esta función cuando las credenciales son correctas.
  // En vez de entrar directo a la app, el usuario va a la "sala de espera"
  // (pendingUser) y se dispara el SplashScreen de 5 segundos.
  // Al terminar el splash, handleSplashFinish completa el ingreso.
  const handleAuth = (user) => {
    const userWithRole = { ...user, role: selectedRole }; // combina datos del usuario + rol elegido
    setPendingUser(userWithRole);   // guarda en sala de espera
    setSplashVisible(true);         // dispara el splash post-login
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

  // ── PANTALLA: SPLASH (después del login exitoso) ──────────
  // Si splashVisible es true, toda la pantalla muestra el SplashScreen.
  // Se renderea antes que cualquier otra pantalla para tener prioridad.
  if (splashVisible) {
    return (
      <div className="app">
        {/* onFinish se llama al terminar los 5 segundos → handleSplashFinish */}
        <SplashScreen onFinish={handleSplashFinish} />
      </div>
    );
  }

  // ── PANTALLA A: SIN ROL ───────────────────────────────────
  // Si no hay rol elegido, muestra la pantalla de bienvenida
  // donde el usuario elige entre Administrador y Usuario.
  if (!selectedRole) {
    return (
      <div className="app">
        <RoleSelector onSelectRole={handleSelectRole} />
      </div>
    );
  }

  // ── PANTALLA B: SIN USUARIO ───────────────────────────────
  // Hay rol pero aún no hay sesión iniciada (o el splash no terminó).
  // Muestra el formulario de login/registro.
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
  // a 'empleados' o 'productos', lo redirige silenciosamente al salón.
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
        // Usuario normal → redirige al salón
        if (currentUser.role === 'admin') {
          return <><Empleados businessName={currentUser.businessName || 'Mi Negocio'} /><Footer /></>;
        }
        return <><Salon currentUser={currentUser} /><Footer /></>;

      case 'productos':
        // Solo admin: gestión de productos y categorías
        // Usuario normal → redirige al salón
        if (currentUser.role === 'admin') {
          return <><GestorProductos /><Footer /></>;
        }
        return <><Salon currentUser={currentUser} /><Footer /></>;

      default:
        // Cualquier página desconocida cae en el salón
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
          currentUser={currentUser}       // datos del usuario para mostrar nombre y teléfono
          onLogout={handleLogout}         // función para cerrar sesión
          onPageChange={setCurrentPage}   // función que cambia la página al hacer clic en un ícono
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
