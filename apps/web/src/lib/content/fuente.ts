/**
 * Fuente de contenido del sitio (Fase 4) — lee D1 vía `crearFuenteD1`.
 *
 * `env` de `cloudflare:workers` solo existe en tiempo de request dentro del
 * runtime real (dev con el adaptador, o ya desplegado) — nunca durante el
 * build estático. Por eso ninguna página estática (hoy solo `404.astro`)
 * debe importar este módulo ni nada de `./index` — todas las páginas de
 * contenido son `export const prerender = false`.
 *
 * `obtenerFuente()` sigue el mismo patrón perezoso que ya usa el portal
 * (`apps/portal/src/lib/servidor/almacen.ts`, `almacenMedios()`): solo el
 * objeto envoltorio se memoiza (no hay caché de datos — cada llamada a
 * `.bloques()`/`.coleccion()` sigue leyendo D1 en el momento).
 */
import { env } from 'cloudflare:workers';
import { crearFuenteD1, type FuenteContenido } from '@cms/core/fuente';
import { bloques } from '@clientes/wellbusiness/bloques';

let fuente: FuenteContenido | undefined;

export function obtenerFuente(): FuenteContenido {
  fuente ??= crearFuenteD1(env.DB, bloques);
  return fuente;
}
