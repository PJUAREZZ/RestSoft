// Componente de navegación superior (header)
// - Muestra logo y enlaces del menú
// - Contiene el botón del carrito con badge (usa `getTotalItems` del contexto)
// - Soporta un menú mobile que se muestra/oculta con `menuOpen`
import { useCart } from "./CartContext";
import { useState } from "react";
import { ShoppingCart, XIcon, MenuIcon, Hamburger } from "lucide-react";
import "./Navegador.css";

export const Navegador = () => {
  const { setCartOpen, getTotalItems } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLinkClick = () => {
    // Cerrar menú mobile al hacer click en un enlace
    setMenuOpen(false);
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
            <a href="#inicio" className="nav-li">Inicio</a>
          </li>
          <li>
            <a href="#menu" className="nav-li">Menu</a>
          </li>
          <li>
            <a href="#mispedidos" className="nav-li">Mis Pedidos</a>
          </li>
          <li>
            <a href="#nosotros" className="nav-li">Nosotros</a>
          </li>
          <li>
            <a href="#contacto" className="nav-li">Contacto</a>
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
              <a href="#inicio" className="nav-li" onClick={handleLinkClick}>Inicio</a>
            </li>
            <li>
              <a href="#menu" className="nav-li" onClick={handleLinkClick}>Menu</a>
            </li>
            <li>
              <a href="#nosotros" className="nav-li" onClick={handleLinkClick}>Nosotros</a>
            </li>
            <li>
              <a href="#contacto" className="nav-li" onClick={handleLinkClick}>Contacto</a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
};
