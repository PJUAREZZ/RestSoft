import React, { useState } from 'react';
import './App.css';
import { CartProvider } from './components/CartContext';
import { Navegador } from './components/Navegador';
import { Hero } from './components/Hero';
import { Nosotros } from './components/Nosotros';
import { Contacto } from './components/Contacto';
import { Footer } from './components/Footer';
import { Menu } from './components/Menu';
import { Cart } from './components/Cart';
import { MiPedido } from './components/MiPedido';


function App() {
  const [cartOpen, setCartOpen] = useState(false);
  const [cart, setCart] = useState([])

  return (
    <div className="app">
      <CartProvider>
        <Navegador />
        <Hero/>
        <Menu/>
        <Cart/>
        <MiPedido/>
        <Nosotros/>

        <Contacto/>

        <Footer/>
      </CartProvider>
      
    </div>
  );
}

export default App;