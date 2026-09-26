/**
 * POST /api/formularios/<tipo> — guarda un envío real de "contacto" o
 * "evaluacion-cobertura" en D1 (Fase 5). La ruta vive en el propio sitio
 * (el formulario llama al mismo dominio que lo sirve), así que no hace
 * falta CORS: en su lugar se exige que el `Origin` sea el del propio sitio.
 */
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import cliente from '@clientes/wellbusiness';
import { ipDe, limitar } from '@cms/core/limites';
import { error, json } from '../../../lib/servidor/api';

/**
 * Campo señuelo (honeypot): un bot que autorrellena formularios normalmente
 * lo completa; una persona real nunca lo ve (input oculto fuera de pantalla
 * en ContactForm.astro / EvaluationForm.astro). Si llega con contenido, se
 * responde éxito sin guardar nada — nunca se le dice al bot que fue detectado.
 */
const CAMPO_TRAMPA = 'sitioWeb';

/**
 * Mismo origen que la propia petición: cubre tanto desarrollo local
 * (cualquier puerto de `astro dev`) como producción — Cloudflare enruta
 * `idrocomsolutions.com` y `www.idrocomsolutions.com` al mismo Worker (ver
 * `apps/web/wrangler.toml`), así que `url.origin` siempre refleja el dominio
 * que el visitante haya usado realmente. Sin `Origin` (curl sin el header,
 * clientes que no son navegador) se rechaza: un navegador real siempre lo
 * manda en un POST, sea o no del mismo origen.
 */
function origenPermitido(request: Request, url: URL): boolean {
  const origen = request.headers.get('origin');
  return origen !== null && origen === url.origin;
}

export const POST: APIRoute = async ({ params, request, url }) => {
  if (!origenPermitido(request, url)) {
    return new Response('Origen no permitido.', { status: 403 });
  }

  const tipo = params.tipo ?? '';
  const def = cliente.formularios[tipo];
  if (!def) return error('Formulario no encontrado.', 404);

  // Límite por IP — mismo mecanismo (`limitar()` sobre la tabla `rate_limit`
  // de D1) que usa el portal para el login, con su propio prefijo de clave.
  if (!(await limitar(env.DB, `formularios:${ipDe(request)}`, 5, 15 * 60))) {
    return error('Demasiados envíos desde esta conexión. Espera unos minutos e inténtalo de nuevo.', 429);
  }

  let crudo: unknown;
  try {
    crudo = await request.json();
  } catch {
    return error('No se pudo leer la información enviada.');
  }
  if (typeof crudo !== 'object' || crudo === null) {
    return error('No se pudo leer la información enviada.');
  }

  const { [CAMPO_TRAMPA]: trampa, ...datos } = crudo as Record<string, unknown>;
  if (typeof trampa === 'string' && trampa.trim() !== '') {
    return json({ ok: true });
  }

  const resultado = def.esquema.safeParse(datos);
  if (!resultado.success) {
    const campos: Record<string, string> = {};
    for (const issue of resultado.error.issues) {
      const clave = issue.path.join('.') || '_';
      campos[clave] ??= issue.message;
    }
    return error('Revisa los datos marcados.', 422, campos);
  }

  await env.DB.prepare('INSERT INTO envios_formulario (id, tipo, datos) VALUES (?, ?, ?)')
    .bind(crypto.randomUUID(), tipo, JSON.stringify(resultado.data))
    .run();

  return json({ ok: true });
};

export const prerender = false;
