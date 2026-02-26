// ============================================================
// SplashScreen.jsx — PANTALLA DE CARGA POST-LOGIN (5 segundos)
// ============================================================
// Se muestra después de que el usuario inicia sesión correctamente.
// Tiene una animación de sartén con vapor y verduras saltando,
// un texto animado y una barra de progreso que dura 4.4 segundos.
//
// Props:
//   onFinish → función de App.jsx que se llama al terminar los 5s.
//              Cuando se llama, App.jsx mueve el usuario de
//              "pendingUser" a "currentUser" y abre la app.
//
// Flujo de timers:
//   0ms    → aparece el splash con animación de entrada
//   4400ms → arranca la animación de salida (fade out + scale)
//   5000ms → llama a onFinish() para que App.jsx quite el splash
// ============================================================

import { useEffect, useState } from 'react';
import './SplashScreen.css';

export const SplashScreen = ({ onFinish }) => {

  // ── ESTADO: ANIMACIÓN DE SALIDA ───────────────────────────
  // Cuando pasa a true, se agrega la clase CSS 'splash--saliendo'
  // que dispara la animación de fade out + escala.
  // Arranca 600ms antes del onFinish para que la animación
  // termine justo cuando el splash desaparece.
  const [saliendo, setSaliendo] = useState(false);

  // ── EFECTO: TIMERS DE DURACIÓN ────────────────────────────
  // Se ejecuta una sola vez al montar el componente.
  // Crea dos timers y los limpia si el componente se desmonta
  // antes de tiempo (return del cleanup), evitando memory leaks.
  useEffect(() => {
    // Timer 1: a los 4.4s activa la animación de salida
    const timerSalida = setTimeout(() => setSaliendo(true), 4400);

    // Timer 2: a los 5s llama a onFinish → App.jsx abre la app
    const timerFin    = setTimeout(() => onFinish(), 5000);

    // Cleanup: si el componente se desmonta antes, cancela los timers
    return () => {
      clearTimeout(timerSalida);
      clearTimeout(timerFin);
    };
  }, [onFinish]); // onFinish como dependencia para no quedar desactualizado

  return (
    // Contenedor principal: si saliendo=true agrega clase de animación de salida
    <div className={`splash ${saliendo ? 'splash--saliendo' : ''}`}>

      {/* ── FONDO CON PARTÍCULAS ──────────────────────────────
          12 círculos pequeños que flotan con animación CSS.
          Usan la variable CSS --i para escalonar posición y delay. */}
      <div className="splash__bg">
        {[...Array(12)].map((_, i) => (
          <span key={i} className="splash__particula" style={{ '--i': i }} />
        ))}
      </div>

      {/* ── CONTENIDO CENTRAL ─────────────────────────────── */}
      <div className="splash__centro">

        {/* ── ILUSTRACIÓN SVG: SARTÉN ───────────────────────
            Wrapper que aplica la animación de flotación (arriba/abajo).
            Contiene el SVG de la sartén + el vapor encima. */}
        <div className="splash__sarten-wrap">

          {/* Tres columnas de vapor animadas con delays distintos
              para que parezca que salen en momentos diferentes */}
          <div className="splash__vapor">
            <span className="vapor vapor--1" /> {/* vapor corto, sin delay */}
            <span className="vapor vapor--2" /> {/* vapor alto, delay 0.3s  */}
            <span className="vapor vapor--3" /> {/* vapor corto, delay 0.6s */}
          </div>

          {/* SVG de la sartén con verduras dibujadas a mano */}
          <svg className="splash__svg" viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg">

            {/* Mango de la sartén — dos rectángulos para dar volumen */}
            <rect x="130" y="112" width="62" height="16" rx="8" fill="#7c3f1e" />
            <rect x="130" y="114" width="62" height="6" rx="3" fill="#a0522d" opacity="0.5" />

            {/* Cuerpo exterior de la sartén — sombra y base */}
            <ellipse cx="90" cy="118" rx="72" ry="20" fill="#2d2d2d" />
            <ellipse cx="90" cy="110" rx="72" ry="20" fill="#3a3a3a" />

            {/* Interior negro de la sartén */}
            <ellipse cx="90" cy="108" rx="60" ry="16" fill="#1a1a1a" />

            {/* Brillo del aceite caliente — tono teal semitransparente */}
            <ellipse cx="90" cy="108" rx="52" ry="13" fill="#0d9488" opacity="0.18" />

            {/* Zanahoria — elipse naranja rotada + tallo verde */}
            <ellipse cx="68" cy="103" rx="10" ry="5" rx="5" fill="#f97316" transform="rotate(-15 68 103)" />
            <line x1="68" y1="98" x2="70" y2="93" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />

            {/* Brócoli — círculos superpuestos en distintos verdes */}
            <circle cx="90" cy="100" r="7" fill="#16a34a" />   {/* base oscura */}
            <circle cx="86" cy="98" r="4" fill="#22c55e" />    {/* flor izquierda */}
            <circle cx="94" cy="98" r="4" fill="#22c55e" />    {/* flor derecha */}
            <circle cx="90" cy="95" r="4" fill="#4ade80" />    {/* flor superior (más claro) */}
            <rect x="89" y="103" width="2" height="5" rx="1" fill="#15803d" /> {/* tallo */}

            {/* Pimiento rojo — elipse rotada + tallo verde */}
            <ellipse cx="112" cy="104" rx="9" ry="6" fill="#ef4444" transform="rotate(10 112 104)" />
            <line x1="112" y1="98" x2="113" y2="93" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" />

            {/* Cebolla morada — elipse lila ligeramente rotada */}
            <ellipse cx="76" cy="107" rx="7" ry="4" fill="#a855f7" transform="rotate(-5 76 107)" />

            {/* Reflejo especular de la sartén — elipse blanca muy transparente */}
            <ellipse cx="70" cy="112" rx="18" ry="5" fill="white" opacity="0.04" transform="rotate(-10 70 112)" />
          </svg>
        </div>

        {/* ── TEXTO ANIMADO ─────────────────────────────────
            Tres elementos con fadeSlide escalonado para que
            aparezcan uno después del otro al entrar. */}
        <div className="splash__texto">
          <h1 className="splash__titulo">
            <span className="splash__titulo-linea1">Sistema de</span>   {/* aparece a los 0.4s */}
            <span className="splash__titulo-linea2">Gestión</span>       {/* aparece a los 0.55s */}
          </h1>
          <p className="splash__subtitulo">Preparando todo para vos…</p> {/* aparece a los 0.7s */}
        </div>

        {/* ── BARRA DE PROGRESO ─────────────────────────────
            Contenedor con overflow:hidden y barra interior que
            va de 0% a 100% en 4.4s con curva de aceleración
            que simula que "carga" más lento al final. */}
        <div className="splash__progreso-wrap">
          <div className="splash__progreso-bar" />
        </div>

      </div>
    </div>
  );
};

export default SplashScreen;
