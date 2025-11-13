// Helper pequeño que devuelve un icono (emoji) JSX según categoría o nombre del producto.
// Se usa en `Menu.jsx` y `Cart.jsx` para mostrar una representación visual local
// sin depender del campo `imagen` de la base de datos.
import React from 'react';

/**
 * getProductIcon(categoria, nombre, size)
 * - categoria: string (p. ej. 'pizza', 'sandwich', 'wrap')
 * - nombre: nombre del producto (se usa como fallback para adivinar la categoría)
 * - size: tamaño en px del emoji
 *
 * Devuelve un span con el emoji apropiado y estilos inline para control de tamaño.
 */
export const getProductIcon = (categoria, nombre = '', size = 40) => {
  const style = { fontSize: `${size}px`, display: 'inline-block', lineHeight: 1 };

  // Priorizar la categoría si está presente
  if (categoria === 'pizza') return <span style={style} role="img" aria-label="pizza">🍕</span>;
  if (categoria === 'sandwich') return <span style={style} role="img" aria-label="sandwich">🥪</span>;
  if (categoria === 'wrap') return <span style={style} role="img" aria-label="wrap">🌯</span>;

  // Si no hay categoría, intentar inferir por el nombre
  const lower = (nombre || '').toLowerCase();
  if (lower.includes('pizza')) return <span style={style}>🍕</span>;
  if (lower.includes('sandwich') || lower.includes('sándwich')) return <span style={style}>🥪</span>;
  if (lower.includes('wrap')) return <span style={style}>🌯</span>;

  // Fallback genérico
  return <span style={style} role="img" aria-label="food">🍽️</span>;
};

export default getProductIcon;
