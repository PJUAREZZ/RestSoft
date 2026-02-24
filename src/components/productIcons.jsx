// ============================================================
// productIcons.jsx — HELPER DE ÍCONOS DE PRODUCTOS
// ============================================================
// Exporta una función que devuelve un emoji JSX según la
// categoría o el nombre del producto.
//
// Se usa en GestorProductos, Salon y AgregarProducto para
// mostrar una representación visual sin depender del campo
// `imagen` de la base de datos (que puede estar vacío).
//
// Parámetros:
//   categoria → string de la categoría del producto (ej: 'pizza')
//   nombre    → nombre del producto, usado como fallback si no hay categoría
//   size      → tamaño en px del emoji (por defecto 40)
//
// Retorna un <span> con el emoji y estilos inline de tamaño.
// ============================================================

import React from 'react';

export const getProductIcon = (categoria, nombre = '', size = 40) => {

  // Estilo inline para controlar el tamaño del emoji
  const style = { fontSize: `${size}px`, display: 'inline-block', lineHeight: 1 };

  // ── PASO 1: BUSCAR POR CATEGORÍA ─────────────────────────
  // Si la categoría coincide exactamente, devuelve el emoji correspondiente
  if (categoria === 'pizza')     return <span style={style} role="img" aria-label="pizza">🍕</span>;
  if (categoria === 'sandwich')  return <span style={style} role="img" aria-label="sandwich">🥪</span>;
  if (categoria === 'wrap')      return <span style={style} role="img" aria-label="wrap">🌯</span>;
  if (categoria === 'bebida')    return <span style={style} role="img" aria-label="bebida">🥤</span>;
  if (categoria === 'postre')    return <span style={style} role="img" aria-label="postre">🍰</span>;

  // ── PASO 2: INFERIR POR NOMBRE (FALLBACK) ────────────────
  // Si no hay categoría reconocida, busca palabras clave en el nombre del producto
  const lower = (nombre || '').toLowerCase();

  if (lower.includes('pizza'))                                              return <span style={style}>🍕</span>;
  if (lower.includes('sandwich') || lower.includes('sándwich'))            return <span style={style}>🥪</span>;
  if (lower.includes('wrap'))                                               return <span style={style}>🌯</span>;
  if (lower.includes('bebida') || lower.includes('agua') ||
      lower.includes('gaseosa') || lower.includes('coca'))                  return <span style={style}>🥤</span>;
  if (lower.includes('postre') || lower.includes('dulce') ||
      lower.includes('torta'))                                              return <span style={style}>🍰</span>;

  // ── PASO 3: EMOJI GENÉRICO ────────────────────────────────
  // Si no coincide con nada, muestra un plato genérico
  return <span style={style} role="img" aria-label="food">🍽️</span>;
};

export default getProductIcon;
