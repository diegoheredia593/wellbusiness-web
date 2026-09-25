/**
 * GET /medios/<clave> → sirve una foto desde la biblioteca de medios del
 * portal (misma D1/KV, solo lectura desde el sitio). Copiado del
 * equivalente en `apps/portal/src/pages/medios/[...clave].ts` — mismo
 * patrón de caché (claves inmutables, Cache API cuando hay dominio propio).
 */
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { crearAlmacen } from '@cms/core/almacen';
import cliente from '@clientes/wellbusiness';

const PATRON = /^fotos\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.(webp|jpg|png)$/;

function cacheDisponible(): Cache | null {
  try {
    return (globalThis as unknown as { caches?: { default?: Cache } }).caches?.default ?? null;
  } catch {
    return null;
  }
}

export const GET: APIRoute = async ({ params, request, locals }) => {
  const clave = params.clave ?? '';
  if (!PATRON.test(clave)) return new Response('No encontrada', { status: 404 });

  const cache = cacheDisponible();
  const claveCache = new Request(new URL(request.url).toString(), { method: 'GET' });
  if (cache) {
    try {
      const guardada = await cache.match(claveCache);
      if (guardada) {
        const etag = guardada.headers.get('ETag');
        const inm = request.headers.get('if-none-match');
        const headers = new Headers(guardada.headers);
        if (etag && inm && inm.split(',').some((v) => v.trim().replace(/^W\//, '') === etag)) {
          await guardada.body?.cancel();
          return new Response(null, { status: 304, headers });
        }
        return new Response(guardada.body, { status: guardada.status, headers });
      }
    } catch {
      /* sin caché: se lee del almacén */
    }
  }

  const almacen = crearAlmacen(cliente.portal.almacenamiento.tipo, env.MEDIOS);
  const medio = await almacen.obtener(clave, request.headers.get('if-none-match'));
  if (!medio) return new Response('No encontrada', { status: 404 });

  const headers = new Headers({
    'Content-Type': medio.tipo,
    ETag: medio.etag,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
  });
  if (medio.sinCambios || !medio.cuerpo) return new Response(null, { status: 304, headers });

  const respuesta = new Response(medio.cuerpo, { headers });
  if (cache) {
    const ctx = (locals as { cfContext?: { waitUntil(p: Promise<unknown>): void } }).cfContext;
    try {
      const copia = respuesta.clone();
      const guardar = cache.put(claveCache, copia).catch(() => {});
      if (ctx) ctx.waitUntil(guardar);
    } catch {
      /* la caché es opcional */
    }
  }
  return respuesta;
};

export const prerender = false;
