/**
 * Cache-Control para las páginas dinámicas (Fase 4: la mayoría, ver
 * `astro.config.mjs`) — el contenido se edita en el portal y debe verse en
 * el sitio en minutos, no instantáneo; una edge cache corta evita pegarle
 * a D1 en cada visita sin dejar de reflejar cambios rápido.
 */
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const response = await next();
  // No pisar un Cache-Control que la propia ruta ya puso a propósito
  // (p. ej. /medios/[...clave] usa `immutable`, distinto y más agresivo
  // que el de las páginas de contenido).
  if (!context.isPrerendered && !response.headers.has('Cache-Control')) {
    response.headers.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=3600');
  }
  return response;
});
