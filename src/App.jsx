/*
  `App.jsx` - componente raíz de la aplicación React.

  Estructura:
  - Envuelve la aplicación con `CartProvider` (contexto del carrito)
  - Muestra la navegación, hero, menú, carrito, sección de pedidos y pie de página

  Nota: el estado `cartOpen` y `cart` definidos aquí no se usan directamente porque
  la lógica del carrito está dentro de `CartContext`. Se pueden eliminar, pero se
  dejaron por compatibilidad si más adelante se usan desde App.
*/
import React from 'react';
import './App.css';
import { CartProvider } from './components/CartContext';
import { Navegador } from './components/Navegador';
import { Hero } from './components/Hero';
import { Nosotros } from './components/Nosotros';
import { Contacto } from './components/Contacto';
import { Footer } from './components/Footer';
import { Menu } from './components/Menu';
import { Cart } from './components/Cart';
// Eliminado `MiPedido` del render principal por petición del usuario

function App() {
  // Componente contenedor: el CartProvider hace disponible el estado del carrito
  // a todos los componentes hijos mediante contexto.
  return (
    <div className="app">
      <CartProvider>
        <Navegador />
        <Hero />
        <Menu />
        <Cart />
        <Nosotros />
        <Contacto />
        <Footer />
      </CartProvider>
    </div>
  );
}

export default App;