// Componente de navegación superior (header)
// - Muestra logo y enlaces del menú
// - Contiene el botón del carrito con badge (usa `getTotalItems` del contexto)
// - Soporta un menú mobile que se muestra/oculta con `menuOpen`
import { useCart } from "./CartContext";
import { useState } from "react";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ShoppingCart, XIcon, MenuIcon, Hamburger } from "lucide-react";
import "./Navegador.css";

export const Navegador = () => {
  const { setCartOpen, getTotalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLinkClick = () => {
    // Cerrar menú mobile al hacer click en un enlace
    setMenuOpen(false);
  };

  const location = useLocation();
  const navigate = useNavigate();

  const scrollToSection = (id) => {
    if (!id) return;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // fallback to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNavTo = (sectionId) => {
    setMenuOpen(false);
    if (location.pathname === '/') {
      // ya estamos en home, simplemente scrollear
      scrollToSection(sectionId);
    } else {
      // navegamos primero a / y luego scrolleamos
      navigate('/');
      // esperar un momento para que el DOM del home se renderice
      setTimeout(() => scrollToSection(sectionId), 250);
    }
  };

  return (
    <header>
      <div className="logo-container">
        <Hamburger />
        <p>Bar & Grill</p>
      </div>

      <nav>
        <ul className="nav-ul">
          <li>
            <a href="#inicio" className="nav-li" onClick={(e) => { e.preventDefault(); handleNavTo('inicio'); }}>Inicio</a>
          </li>
          <li>
            <a href="#menu" className="nav-li" onClick={(e) => { e.preventDefault(); handleNavTo('menu'); }}>Menu</a>
          </li>
          <li>
            <Link to="/salon" className="nav-li">Salón</Link>
          </li>
          <li>
            <a href="#mispedidos" className="nav-li" onClick={(e) => { e.preventDefault(); handleNavTo('mispedidos'); }}>Mis Pedidos</a>
          </li>
          <li>
            <a href="#nosotros" className="nav-li" onClick={(e) => { e.preventDefault(); handleNavTo('nosotros'); }}>Nosotros</a>
          </li>
          <li>
            <a href="#contacto" className="nav-li" onClick={(e) => { e.preventDefault(); handleNavTo('contacto'); }}>Contacto</a>
          </li>
        </ul>
      </nav>

      <div className="actions-container">
        {/* Botón carrito: abre el sidebar del carrito y muestra badge con total de items */}
        <button onClick={() => setCartOpen(true)} className="cart-button">
          <ShoppingCart />
          {getTotalItems() > 0 && <span className="cart-badge">{getTotalItems()}</span>}
        </button>
        {/* Botón que abre/cierra el menú mobile */}
        <button onClick={() => setMenuOpen(!menuOpen)} className="menu-button">
          {menuOpen ? <XIcon /> : <MenuIcon />}
        </button>
      </div>

      {/* Menú responsive: sólo se renderiza si `menuOpen` es true */}
      {menuOpen && (
        <nav className="nav-mobile">
          <ul className="nav-ul">
            <li>
              <a href="#inicio" className="nav-li" onClick={(e) => { e.preventDefault(); handleNavTo('inicio'); handleLinkClick(); }}>Inicio</a>
            </li>
            <li>
              <a href="#menu" className="nav-li" onClick={(e) => { e.preventDefault(); handleNavTo('menu'); handleLinkClick(); }}>Menu</a>
            </li>
            <li>
              <Link to="/salon" className="nav-li" onClick={handleLinkClick}>Salón</Link>
            </li>
            <li>
              <a href="#nosotros" className="nav-li" onClick={(e) => { e.preventDefault(); handleNavTo('nosotros'); handleLinkClick(); }}>Nosotros</a>
            </li>
            <li>
              <a href="#contacto" className="nav-li" onClick={(e) => { e.preventDefault(); handleNavTo('contacto'); handleLinkClick(); }}>Contacto</a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
};
