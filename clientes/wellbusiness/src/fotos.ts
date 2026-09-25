/**
 * Fotos reales de Wellbusiness (`apps/web/public/images/{products,logos}`).
 *
 * Igual que Fluvida: estas fotos nunca pasan por la biblioteca de medios del
 * portal (KV) — son archivos estáticos que ya sirve `apps/web` hoy, y el
 * sitio solo necesita su ancho/alto real para reservar el espacio de forma
 * correcta. Medidas obtenidas replicando la misma lógica de `inspeccionar()`
 * que usa el portal (`apps/portal/src/lib/servidor/medios.ts`) contra los
 * archivos reales — nunca inventadas ni aproximadas.
 */
import type { Imagen } from '@cms/core/schema';

const FOTOS = {
  // ─── Productos ───────────────────────────────────────────────────────
  'products/rva50-1.jpg': [1000, 1000],
  'products/rva50-2.jpg': [1000, 1000],
  'products/rva50-3.jpg': [1000, 1000],
  'products/dem300-1.jpg': [1000, 1000],
  'products/dem500-1.jpg': [800, 533],
  'products/r5-1.jpg': [1000, 900],
  'products/r5-2.jpg': [1000, 900],
  'products/r5-3.jpg': [1000, 900],
  'products/r5-4.jpg': [1000, 900],
  'products/sl500e-1.jpg': [792, 792],
  'products/sl500e-2.jpg': [800, 800],
  'products/sl500e-3.jpg': [800, 800],
  'products/sl500e-4.jpg': [800, 800],
  'products/tlk110-1.jpg': [1000, 900],
  'products/tlk110-2.jpg': [1000, 900],
  'products/tlk110-3.jpg': [1000, 900],
  'products/tlk110-4.jpg': [1000, 900],
  'products/r2-1.jpg': [1000, 1000],
  'products/r2-2.jpg': [1000, 1000],
  'products/r2-3.jpg': [1000, 1000],
  'products/r2-4.jpg': [1000, 1000],
  'products/magone-x10d-1.jpg': [1000, 900],
  'products/magone-x10d-2.jpg': [1000, 900],
  'products/magone-x10d-3.jpg': [1000, 900],
  'products/magone-x10d-4.jpg': [1000, 900],
  'products/dep570e-1.png': [456, 456],
  'products/dep570e-2.png': [600, 600],
  'products/dep570e-3.png': [600, 600],
  'products/dep570e-4.png': [600, 600],
  'products/dep550e-1.jpg': [327, 500],
  'products/dep450-1.jpg': [324, 324],
  'products/dep450-2.jpg': [324, 324],
  'products/dep450-3.jpg': [324, 324],
  'products/dep250-1.png': [960, 960],
  'products/slr1000-1.jpg': [704, 704],
  'products/slr1000-2.jpg': [660, 660],
  'products/slr1000-3.jpg': [572, 572],
  'products/slr1000-4.jpg': [616, 616],
  'products/slr1000-5.jpg': [616, 616],
  'products/slr5100-1.jpg': [600, 600],
  'products/slr5100-2.jpg': [600, 600],
  'products/slr5100-3.jpg': [600, 600],
  'products/slr5100-4.jpg': [600, 600],
  'products/slr5100-5.jpg': [600, 600],
  'products/slr8000-1.jpg': [324, 324],
  'products/slr8000-2.jpg': [324, 324],
  'products/slr8000-3.jpg': [500, 500],
  'products/slr8000-4.jpg': [324, 324],
  'products/slr8000-5.jpg': [324, 324],
  'products/r5-microfono-rm560-1.jpg': [558, 558],
  'products/r5-bateria-impres-1.jpg': [500, 500],
  'products/r5-cargador-multiunidad-1.jpg': [447, 447],

  // ─── Marcas / logos ──────────────────────────────────────────────────
  'logos/claro.png': [480, 175],
  'logos/grandstream.png': [1257, 213],
  'logos/huawei.png': [843, 832],
  'logos/hustler.png': [1338, 474],
  'logos/l-com-global.png': [1334, 581],
  'logos/motorola-waveptx.png': [1278, 306],
  'logos/pctel.png': [1226, 507],
  'logos/rf-elements.png': [1329, 234],
  'logos/sinclair.png': [1225, 325],
  'logos/smartptt.png': [1366, 688],
  'logos/tassta.png': [1273, 441],
  'logos/telosystems.png': [1212, 333],
  'logos/telox.png': [1187, 629],
  'logos/tram-browning.png': [1298, 627],
  'logos/zetron.png': [1294, 258],
} as const;

export type ClaveFoto = keyof typeof FOTOS;

/** Foto real (ya existente en `apps/web/public/images`) con su texto alternativo. */
export function foto(clave: ClaveFoto, alt: string): Imagen {
  const [ancho, alto] = FOTOS[clave];
  return { src: `/images/${clave}`, alt, ancho, alto };
}
