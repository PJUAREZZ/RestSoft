import React, { useState } from 'react';
import './App.css';

// Iconos SVG como componentes
const ShoppingCartIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
  </svg>
);

const MenuIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/>
    <line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
);

const XIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const MinusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const TrashIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
  </svg>
);

function App() {
  const [cartOpen, setCartOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [cart, setCart] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('todos');

  const products = {
    pizzas: [
      { id: 1, name: 'Pizza Margarita', price: 8500, description: 'Salsa de tomate, mozzarella fresca y albahaca', image: '🍕', category: 'pizzas' },
      { id: 2, name: 'Pizza Pepperoni', price: 9500, description: 'Pepperoni, mozzarella y orégano', image: '🍕', category: 'pizzas' },
      { id: 3, name: 'Pizza Cuatro Quesos', price: 10500, description: 'Mozzarella, gorgonzola, parmesano y provolone', image: '🍕', category: 'pizzas' },
      { id: 4, name: 'Pizza Hawaiana', price: 9000, description: 'Jamón, piña y mozzarella', image: '🍕', category: 'pizzas' }
    ],
    sandwiches: [
      { id: 5, name: 'Sandwich Clásico', price: 5500, description: 'Jamón, queso, lechuga y tomate', image: '🥪', category: 'sandwiches' },
      { id: 6, name: 'Sandwich Vegetariano', price: 6000, description: 'Vegetales grillados, hummus y rúcula', image: '🥪', category: 'sandwiches' },
      { id: 7, name: 'Sandwich de Pollo', price: 6500, description: 'Pollo grillado, queso cheddar y salsa BBQ', image: '🥪', category: 'sandwiches' },
      { id: 8, name: 'Sandwich Completo', price: 7000, description: 'Carne, huevo, queso, lechuga y tomate', image: '🥪', category: 'sandwiches' }
    ],
    wraps: [
      { id: 9, name: 'Wrap César', price: 6500, description: 'Pollo, lechuga romana, parmesano y aderezo césar', image: '🌯', category: 'wraps' },
      { id: 10, name: 'Wrap Mexicano', price: 7000, description: 'Carne, frijoles, guacamole y pico de gallo', image: '🌯', category: 'wraps' },
      { id: 11, name: 'Wrap Vegano', price: 6500, description: 'Falafel, hummus, vegetales frescos', image: '🌯', category: 'wraps' },
      { id: 12, name: 'Wrap BBQ', price: 7500, description: 'Pollo BBQ, cebolla caramelizada y queso', image: '🌯', category: 'wraps' }
    ]
  };

  const allProducts = [...products.pizzas, ...products.sandwiches, ...products.wraps];

  const filteredProducts = selectedCategory === 'todos' 
    ? allProducts 
    : allProducts.filter(p => p.category === selectedCategory);

  const addToCart = (product) => {
    const existingItem = cart.find(item => item.id === product.id);
    if (existingItem) {
      setCart(cart.map(item => 
        item.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, delta) => {
    setCart(cart.map(item => {
      if (item.id === productId) {
        const newQuantity = item.quantity + delta;
        return newQuantity > 0 ? { ...item, quantity: newQuantity } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-container">
          <div className="header-content">
            <div className="logo">
              <div className="logo-icon">🍔</div>
              <h1 className="logo-text">Bar & Grill</h1>
            </div>
            
            <nav className="nav-desktop">
              <a href="#inicio" className="nav-link">Inicio</a>
              <a href="#menu" className="nav-link">Menú</a>
              <a href="#nosotros" className="nav-link">Nosotros</a>
              <a href="#contacto" className="nav-link">Contacto</a>
            </nav>

            <div className="header-actions">
              <button onClick={() => setCartOpen(true)} className="cart-button">
                <ShoppingCartIcon />
                {getTotalItems() > 0 && (
                  <span className="cart-badge">{getTotalItems()}</span>
                )}
              </button>
              
              <button onClick={() => setMenuOpen(!menuOpen)} className="menu-button">
                {menuOpen ? <XIcon /> : <MenuIcon />}
              </button>
            </div>
          </div>

          {menuOpen && (
            <nav className="nav-mobile">
              <a href="#inicio" className="nav-link">Inicio</a>
              <a href="#menu" className="nav-link">Menú</a>
              <a href="#nosotros" className="nav-link">Nosotros</a>
              <a href="#contacto" className="nav-link">Contacto</a>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="inicio" className="hero">
        <h2 className="hero-title">Bienvenido a Bar & Grill</h2>
        <p className="hero-description">
          Las mejores pizzas, sandwiches y wraps de la ciudad. 
          Frescura y calidad en cada bocado.
        </p>
        <div className="hero-buttons">
          <a href="#menu" className="btn-primary">Ver Menú</a>
          <a href="#contacto" className="btn-secondary">Contáctanos</a>
        </div>
      </section>

      {/* Banner */}
      <div className="banner">
        🚚 Envío GRATIS en compras superiores a $25,000
      </div>

      {/* Menu Section */}
      <section id="menu" className="menu-section">
        <div className="container">
          <h2 className="section-title">Nuestro Menú</h2>
          <p className="section-description">
            Descubre nuestra selección de platillos preparados con ingredientes frescos y de la más alta calidad
          </p>

          {/* Category Filter */}
          <div className="category-filter">
            <button
              onClick={() => setSelectedCategory('todos')}
              className={`category-btn ${selectedCategory === 'todos' ? 'active' : ''}`}
            >
              Todos
            </button>
            <button
              onClick={() => setSelectedCategory('pizzas')}
              className={`category-btn ${selectedCategory === 'pizzas' ? 'active' : ''}`}
            >
              🍕 Pizzas
            </button>
            <button
              onClick={() => setSelectedCategory('sandwiches')}
              className={`category-btn ${selectedCategory === 'sandwiches' ? 'active' : ''}`}
            >
              🥪 Sandwiches
            </button>
            <button
              onClick={() => setSelectedCategory('wraps')}
              className={`category-btn ${selectedCategory === 'wraps' ? 'active' : ''}`}
            >
              🌯 Wraps
            </button>
          </div>

          {/* Products Grid */}
          <div className="products-grid">
            {filteredProducts.map(product => (
              <div key={product.id} className="product-card">
                <div className="product-image">{product.image}</div>
                <div className="product-info">
                  <h3 className="product-name">{product.name}</h3>
                  <p className="product-description">{product.description}</p>
                  <div className="product-footer">
                    <span className="product-price">
                      ${product.price.toLocaleString()}
                    </span>
                    <button onClick={() => addToCart(product)} className="add-to-cart-btn">
                      Agregar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="nosotros" className="about-section">
        <div className="container">
          <div className="about-content">
            <h2 className="section-title">Sobre Nosotros</h2>
            <p className="about-text">
              En Bar & Grill nos enorgullece ofrecer comida de calidad superior con ingredientes frescos y locales. 
              Nuestra pasión es crear experiencias gastronómicas memorables para cada uno de nuestros clientes.
            </p>
            <p className="about-text">
              Cada platillo es preparado con dedicación y amor por nuestro equipo de chefs experimentados, 
              garantizando sabor auténtico y satisfacción en cada bocado.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contacto" className="contact-section">
        <div className="container">
          <h2 className="section-title">Contáctanos</h2>
          <div className="contact-grid">
            <div className="contact-item">
              <div className="contact-icon">📍</div>
              <h3 className="contact-title">Ubicación</h3>
              <p className="contact-text">Av. Principal 123<br/>Ciudad, País</p>
            </div>
            <div className="contact-item">
              <div className="contact-icon">📞</div>
              <h3 className="contact-title">Teléfono</h3>
              <p className="contact-text">+54 11 1234-5678</p>
            </div>
            <div className="contact-item">
              <div className="contact-icon">⏰</div>
              <h3 className="contact-title">Horario</h3>
              <p className="contact-text">Lun - Dom<br/>11:00 - 23:00</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <p>&copy; 2025 Bar & Grill. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* Shopping Cart Sidebar */}
      {cartOpen && (
        <div className="cart-overlay">
          <div className="cart-backdrop" onClick={() => setCartOpen(false)} />
          <div className="cart-sidebar">
            <div className="cart-header">
              <h2 className="cart-title">Tu Carrito</h2>
              <button onClick={() => setCartOpen(false)} className="close-cart-btn">
                <XIcon />
              </button>
            </div>

            <div className="cart-content">
              {cart.length === 0 ? (
                <div className="cart-empty">
                  <div className="cart-empty-icon">🛒</div>
                  <p className="cart-empty-text">Tu carrito está vacío</p>
                </div>
              ) : (
                <div className="cart-items">
                  {cart.map(item => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-header">
                        <div className="cart-item-info">
                          <div className="cart-item-icon">{item.image}</div>
                          <div>
                            <h3 className="cart-item-name">{item.name}</h3>
                            <p className="cart-item-price">
                              ${item.price.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="remove-item-btn"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                      <div className="cart-item-footer">
                        <div className="quantity-controls">
                          <button
                            onClick={() => updateQuantity(item.id, -1)}
                            className="quantity-btn"
                          >
                            <MinusIcon />
                          </button>
                          <span className="quantity-value">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, 1)}
                            className="quantity-btn"
                          >
                            <PlusIcon />
                          </button>
                        </div>
                        <span className="cart-item-total">
                          ${(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total">
                  <span>Total:</span>
                  <span className="cart-total-amount">${getTotal().toLocaleString()}</span>
                </div>
                <button className="checkout-btn">
                  Finalizar Compra
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;