// Entry point del frontend React
// Se encarga de montar el componente raíz `App` en el elemento DOM con id `root`.
import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App.jsx';

ReactDOM.render(
  <React.StrictMode>
    {/* `App` es el componente principal que contiene toda la app */}
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);