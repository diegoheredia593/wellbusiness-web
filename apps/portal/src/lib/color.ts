/** Contraste WCAG y ajuste del color de acento del cliente. */

function canal(c: number) {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

function rgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? [...h].map((x) => x + x).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function luminancia(hex: string) {
  const [r, g, b] = rgb(hex).map(canal) as [number, number, number];
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contraste(a: string, b: string) {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x) as [number, number];
  return (l1 + 0.05) / (l2 + 0.05);
}

function aHex([r, g, b]: [number, number, number]) {
  return `#${[r, g, b].map((x) => Math.round(x).toString(16).padStart(2, '0')).join('')}`;
}

/** Oscurece el color hasta que el texto blanco encima tenga contraste ≥ 4.5:1. */
export function acentoAccesible(hex: string) {
  let color = rgb(hex);
  for (let i = 0; i < 40 && contraste(aHex(color), '#ffffff') < 4.5; i++) {
    color = color.map((c) => c * 0.94) as [number, number, number];
  }
  return aHex(color);
}

/** Versión más oscura para hover. */
export function oscurecer(hex: string, factor = 0.85) {
  return aHex(rgb(hex).map((c) => c * factor) as [number, number, number]);
}
