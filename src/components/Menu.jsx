import { useCart } from './CartContext';
import { useState, useEffect } from "react";
import "./Menu.css";

export const Menu = () => {
  const { addToCart } = useCart();
  const [selectedCategory, setSelectedCategory] = useState("todos");
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch("http://localhost:8000/productos");

        if (!response.ok) {
          throw new Error("Error al cargar los productos");
        }

        const data = await response.json();
        setProducts(data);
      } catch (err) {
        setError(err.message);
        console.error("Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  const filteredProducts =
    selectedCategory === "todos"
      ? products
      : products.filter((p) => p.categoria === selectedCategory);

  return (
    <section id="menu" className="menu-section">
      <div className="container">
        <h2 className="section-title">Nuestro Menú</h2>
        <p className="section-description">
          Descubre nuestra selección de platillos preparados con ingredientes
          frescos y de la más alta calidad
        </p>

        {/* Category Filter */}
        <div className="category-filter">
          <button
            onClick={() => setSelectedCategory("todos")}
            className={`category-btn ${
              selectedCategory === "todos" ? "active" : ""
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setSelectedCategory("pizza")}
            className={`category-btn ${
              selectedCategory === "pizza" ? "active" : ""
            }`}
          >
            🍕 Pizzas
          </button>
          <button
            onClick={() => setSelectedCategory("sandwich")}
            className={`category-btn ${
              selectedCategory === "sandwich" ? "active" : ""
            }`}
          >
            🥪 Sandwiches
          </button>
          <button
            onClick={() => setSelectedCategory("wrap")}
            className={`category-btn ${
              selectedCategory === "wrap" ? "active" : ""
            }`}
          >
            🌯 Wraps
          </button>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="loading">
            <div className="spinner"></div>
            <p>Cargando productos...</p>
          </div>
        )}

        {error && (
          <div className="error">
            <div className="error-icon">⚠️</div>
            <p className="error-message">Error: {error}</p>
            <button
              className="retry-btn"
              onClick={() => window.location.reload()}
            >
              Reintentar
            </button>
          </div>
        )}

        {!loading && !error && (
          <div className="products-grid">
            {filteredProducts.map((product) => (
              <div key={product.producto_id} className="product-card">
                {/* Imagen del producto */}
                <div className="product-image">
                  {product.imagen ? (
                    <img
                      src={product.imagen}
                      alt={product.nombre}
                      className="product-img"
                    />
                  ) : (
                    <div className="product-emoji">
                      {product.categoria === "pizza" && "🍕"}
                      {product.categoria === "sandwich" && "🥪"}
                      {product.categoria === "wrap" && "🌯"}
                    </div>
                  )}
                </div>

                {/* Información del producto */}
                <div className="product-info">
                  <h3 className="product-name">{product.nombre}</h3>
                  <p className="product-description">{product.descripcion}</p>

                  <div className="product-footer">
                    <span className="product-price">
                      ${product.precio.toLocaleString()}
                    </span>
                    <button onClick={() => addToCart(product)}
                    className="add-to-cart-btn">Agregar</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Products Grid */}
      </div>
    </section>
  );
};
