/**
 * Fotos reales de Wellbusiness (productos y marcas) — viven en la
 * biblioteca de medios del portal (tabla `medios` + KV), nunca como
 * archivos estáticos de `apps/web`: el portal vive en otro dominio que el
 * sitio, así que una ruta relativa como `/images/productos/...` no
 * resuelve ahí (confirmado en local: redirige a `/entrar`). Las fotos de
 * diseño (hero, logo del sitio) sí se quedan en `apps/web/public/` — esas
 * no son contenido editable de una colección.
 *
 * `./medios-generados.ts` lo escribe `scripts/importar-fotos.ts` (real
 * id/ancho/alto/alt de cada foto, ya subida al portal) — no editar a mano.
 */
import type { Imagen } from '@cms/core/schema';
import { MEDIOS_GENERADOS } from './medios-generados';

export type ClaveMedio = keyof typeof MEDIOS_GENERADOS;

/** Foto real, ya subida a la biblioteca de medios del portal. */
export function medio(clave: ClaveMedio): Imagen {
  const m = MEDIOS_GENERADOS[clave];
  return { src: m.src, alt: m.alt, ancho: m.ancho, alto: m.alto, medio: m.id };
}
