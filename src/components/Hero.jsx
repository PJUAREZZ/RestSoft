// Componente Hero: sección principal de bienvenida y CTA's (llamadas a la acción)
import "./Hero.css"

export const Hero = () => {
  return (
    <>
      <section className="hero-section" id="inicio">
        <div className="video-container">
          {/* Slide 1: Wraps */}
          <div className="slide">
            <div className="sparkle" />
            <div className="sparkle" />
            <div className="sparkle" />
            <div className="sparkle" />
            <div className="food-icon">🌯</div>
            <div className="food-title">WRAPS</div>
            <div className="food-description">Frescos, Deliciosos y Perfectos</div>
          </div>

          {/* Slide 2: Sándwiches */}
          <div className="slide">
            <div className="sparkle" />
            <div className="sparkle" />
            <div className="sparkle" />
            <div className="sparkle" />
            <div className="food-icon">🥪</div>
            <div className="food-title">SÁNDWICHES</div>
            <div className="food-description">Ingredientes Premium en Cada Bocado</div>
          </div>

          {/* Slide 3: Pizzas */}
          <div className="slide">
            <div className="sparkle" />
            <div className="sparkle" />
            <div className="sparkle" />
            <div className="sparkle" />
            <div className="food-icon">🍕</div>
            <div className="food-title">PIZZAS</div>
            <div className="food-description">Horneadas a la Perfección</div>
          </div>

          {/* progress bar removed as requested */}
        </div>

        <div className="hero-content">
          <h1 className='hero-titulo'>Bienvenido a Bar & Grill</h1>
          <p className='hero-parrafo'>Las mejores pizzas, sandwiches y wraps de la ciudad. Frescura y calidad en cada bocado.</p>
          <div className="secciones-container">
            <a href="#menu" className="boton-primario">Ver menu</a>
            <a href="#contacto" className="boton-secundario">Contactanos</a>
          </div>
        </div>
      </section>
      <div className="banner">🚚 Envío GRATIS en compras superiores a $25,000</div>
    </>
  )
}
