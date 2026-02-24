// ============================================================
// index.jsx — PUNTO DE ENTRADA DE LA APLICACIÓN
// ============================================================
// Este es el primer archivo que ejecuta React al iniciar la app.
// Su única función es "montar" el componente raíz <App /> dentro
// del elemento HTML con id="root" que está en public/index.html.
// ============================================================

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';    // Estilos globales de toda la app
import App from './App.jsx'; // Componente raíz que contiene toda la lógica

// React.StrictMode activa advertencias extra en desarrollo
// para detectar problemas potenciales en el código.
ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root') // Se inyecta dentro del <div id="root"> de public/index.html
);
