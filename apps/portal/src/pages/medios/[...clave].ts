/**
 * GET /medios/<clave> → sirve una foto desde el almacén del cliente (KV o R2).
 * Las claves incluyen un id único y nunca se sobrescriben, así que se pueden
 * guardar en caché para siempre. La Cache API ahorra lecturas del almacén
 * cuando hay dominio propio; en *.workers.dev no guarda nada y no pasa nada.
 */
import type { APIRoute } from 'astro';
import { almacenMedios, cacheDisponible } from '@/lib/servidor/almacen';

const PATRON = /^fotos\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.(webp|jpg|png)$/;

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
        // Copia con cabeceras editables (el middleware agrega las de seguridad).
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

  const medio = await almacenMedios().obtener(clave, request.headers.get('if-none-match'));
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
