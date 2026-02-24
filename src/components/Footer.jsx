// ============================================================
// Footer.jsx — PIE DE PÁGINA
// ============================================================
// Componente simple que muestra los derechos reservados.
// Se renderiza debajo de cada página principal (Salon, Estadisticas, etc.)
// desde App.jsx junto con el componente de la página activa.
// ============================================================

import "./Footer.css"

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="container">
        {/* © símbolo de copyright + año + nombre de la app */}
        <p>&copy; 2025 RestSoft. Todos los derechos reservados.</p>
      </div>
    </footer>
  )
}
