// ============================================================
// Navegador.jsx — BARRA DE NAVEGACIÓN SUPERIOR
// ============================================================
// Muestra el header de la app con:
//   - Logo y nombre del negocio (izquierda)
//   - Íconos de navegación (centro) — algunos solo para admin
//   - Nombre del usuario, botón de ayuda y botón Salir (derecha)
//   - Menú mobile (hamburguesa) para pantallas chicas
//
// Props:
//   currentUser  → objeto del usuario logueado
//   onLogout     → función para cerrar sesión
//   onPageChange → cambia la página activa en App.jsx
//   currentPage  → string con la página activa (para resaltar el ícono)
// ============================================================

import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import {
  XIcon, MenuIcon, Hamburger, Coffee,
  Utensils, BarChart3, User, Plus,
  HelpCircle, MessageCircle
} from "lucide-react";
import "./Navegador.css";

export const Navegador = ({ currentUser, onLogout, onPageChange, currentPage, onOpenAgregar }) => {

  // true = menú hamburguesa abierto (solo en mobile)
  const [menuOpen, setMenuOpen] = useState(false);

  // true = popup de ayuda/WhatsApp visible
  const [contactOpen, setContactOpen] = useState(false);

  // Permite navegar a rutas URL (usado al cerrar sesión para volver a "/")
  const navigate = useNavigate();

  // Cierra el menú mobile al hacer clic en cualquier enlace
  const handleLinkClick = () => setMenuOpen(false);

  // Cambia la página activa y cierra el menú mobile
  const handlePageChange = (page) => {
    onPageChange(page);
    handleLinkClick();
  };

  // ── CERRAR POPUP DE CONTACTO AL HACER CLIC AFUERA ────────
  // Agrega un listener global al documento. Si el clic fue fuera
  // del elemento .contact-wrapper, cierra el popup.
  // Se limpia cuando el componente se desmonta para evitar memory leaks.
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contactOpen && !e.target.closest('.contact-wrapper')) setContactOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contactOpen]);

  // true si el usuario logueado es administrador
  // Determina qué íconos del nav se muestran
  const isAdmin = currentUser?.role === 'admin';

  return (
    <header>

      {/* Logo: íconos decorativos + nombre del negocio del admin */}
      <div className="logo-container">
        <Hamburger size={24} />
        <Coffee size={24} />
        <p>{currentUser?.businessName || 'RestSoft'}</p>
      </div>

      {/* ── NAVEGACIÓN DESKTOP ── */}
      <nav>
        <ul className="nav-ul">

          {/* 🍴 Pedidos — visible para TODOS los roles */}
          <li>
            <button
              className={`nav-li ${currentPage === 'salon' ? 'nav-li-active' : ''}`}
              title="Pedidos"
              onClick={() => handlePageChange('salon')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              <Utensils size={20} />
            </button>
          </li>

          {/* Los siguientes íconos solo aparecen para el admin */}
          {isAdmin && (
            <>
              {/* 📊 Estadísticas — historial de pedidos y gráficos de ventas */}
              <li>
                <button
                  className={`nav-li ${currentPage === 'estadisticas' ? 'nav-li-active' : ''}`}
                  title="Estadísticas"
                  onClick={() => handlePageChange('estadisticas')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <BarChart3 size={20} />
                </button>
              </li>

              {/* 👤 Empleados — gestión del personal */}
              <li>
                <button
                  className={`nav-li ${currentPage === 'empleados' ? 'nav-li-active' : ''}`}
                  title="Gestión de Empleados"
                  onClick={() => handlePageChange('empleados')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <User size={20} />
                </button>
              </li>

              {/* ➕ Productos — gestión de productos y categorías */}
              <li>
                <button
                  className={`nav-li ${currentPage === 'productos' ? 'nav-li-active' : ''}`}
                  title="Gestión de Productos"
                  onClick={() => handlePageChange('productos')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <Plus size={20} />
                </button>
              </li>
            </>
          )}
        </ul>
      </nav>

      {/* ── SECCIÓN DERECHA: USUARIO + AYUDA + SALIR ── */}
      <div className="actions-container">
        {currentUser ? (
          <div className="nav-user">

            {/* Nombre y teléfono del usuario logueado */}
            <div className="nav-user-info">
              <span className="nav-username">{currentUser.name}</span>
              {currentUser.phone && <span className="nav-userphone">{currentUser.phone}</span>}
            </div>

            {/* ❓ Botón de ayuda — abre popup con link a WhatsApp */}
            <div className="contact-wrapper">
              <button
                className="contact-button"
                title="Ayuda / Contacto"
                onClick={() => setContactOpen(!contactOpen)}
              >
                <HelpCircle size={20} />
              </button>

              {/* Popup de contacto: solo visible cuando contactOpen === true */}
              {contactOpen && (
                <div className="contact-modal">
                  <p>¿Estás teniendo inconvenientes con RestSoft? Ponte en contacto con nosotros.</p>
                  <a
                    href="https://wa.me/3865616350"
                    target="_blank"           // abre en nueva pestaña
                    rel="noopener noreferrer" // seguridad al abrir links externos
                    className="whatsapp-button"
                  >
                    <MessageCircle size={18} />
                    WhatsApp
                  </a>
                </div>
              )}
            </div>

            {/* Botón Salir: ejecuta logout y redirige a la raíz "/" */}
            <button
              className="logout-button"
              onClick={() => { if (onLogout) onLogout(); navigate('/'); }}
            >
              Salir
            </button>
          </div>
        ) : (
          // Si no hay sesión, muestra botón para ir a login
          <button className="login-button" onClick={() => navigate('/')}>Ingresar</button>
        )}

        {/* Botón hamburguesa — solo visible en mobile, alterna menuOpen */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="menu-button">
          {menuOpen ? <XIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* ── MENÚ MOBILE — mismos íconos que el nav desktop ── */}
      {menuOpen && (
        <nav className="nav-mobile">
          <ul className="nav-ul">
            <li>
              <button
                className={`nav-li ${currentPage === 'salon' ? 'nav-li-active' : ''}`}
                onClick={() => handlePageChange('salon')}
                title="Pedidos"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <Utensils size={20} />
              </button>
            </li>
            {isAdmin && (
              <>
                <li>
                  <button
                    className={`nav-li ${currentPage === 'estadisticas' ? 'nav-li-active' : ''}`}
                    onClick={() => handlePageChange('estadisticas')}
                    title="Estadísticas"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <BarChart3 size={20} />
                  </button>
                </li>
                <li>
                  <button
                    className={`nav-li ${currentPage === 'empleados' ? 'nav-li-active' : ''}`}
                    onClick={() => handlePageChange('empleados')}
                    title="Gestión de Empleados"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <User size={20} />
                  </button>
                </li>
                <li>
                  <button
                    className={`nav-li ${currentPage === 'productos' ? 'nav-li-active' : ''}`}
                    onClick={() => handlePageChange('productos')}
                    title="Gestión de Productos"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    <Plus size={20} />
                  </button>
                </li>
              </>
            )}
          </ul>
        </nav>
      )}
    </header>
  );
};
