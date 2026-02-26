// ============================================================
// Navegador.jsx — BARRA DE NAVEGACIÓN SUPERIOR
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

  const [menuOpen, setMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);

  // ── RELOJ EN TIEMPO REAL ──────────────────────────────────
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' });

  const navigate = useNavigate();

  const handleLinkClick = () => setMenuOpen(false);

  const handlePageChange = (page) => {
    onPageChange(page);
    handleLinkClick();
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (contactOpen && !e.target.closest('.contact-wrapper')) setContactOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [contactOpen]);

  const isAdmin = currentUser?.role === 'admin';

  return (
    <header>

      {/* Logo */}
      <div className="logo-container">
        <Hamburger size={24} />
        <Coffee size={24} />
        <p>{currentUser?.businessName || 'RestSoft'}</p>
      </div>

      {/* ── NAVEGACIÓN DESKTOP ── */}
      <nav>
        <ul className="nav-ul">
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

          {isAdmin && (
            <>
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

      {/* ── SECCIÓN DERECHA ── */}
      <div className="actions-container">
        {currentUser ? (
          <div className="nav-user">

            {/* Nombre y teléfono */}
            <div className="nav-user-info">
              <span className="nav-username">{currentUser.name}</span>
              {currentUser.phone && <span className="nav-userphone">{currentUser.phone}</span>}
            </div>

            {/* 🕐 Reloj con fecha */}
            <div className="nav-clock">
              <span className="nav-clock-time">{timeStr}</span>
              <span className="nav-clock-date">{dateStr}</span>
            </div>

            {/* Botón ayuda */}
            <div className="contact-wrapper">
              <button
                className="contact-button"
                title="Ayuda / Contacto"
                onClick={() => setContactOpen(!contactOpen)}
              >
                <HelpCircle size={20} />
              </button>

              {contactOpen && (
                <div className="contact-modal">
                  <p>¿Estás teniendo inconvenientes con RestSoft? Ponte en contacto con nosotros.</p>
                  <a
                    href="https://wa.me/3865616350"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="whatsapp-button"
                  >
                    <MessageCircle size={18} />
                    WhatsApp
                  </a>
                </div>
              )}
            </div>

            {/* Botón Salir */}
            <button
              className="logout-button"
              onClick={() => { if (onLogout) onLogout(); navigate('/'); }}
            >
              Salir
            </button>
          </div>
        ) : (
          <button className="login-button" onClick={() => navigate('/')}>Ingresar</button>
        )}

        <button onClick={() => setMenuOpen(!menuOpen)} className="menu-button">
          {menuOpen ? <XIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* ── MENÚ MOBILE ── */}
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
