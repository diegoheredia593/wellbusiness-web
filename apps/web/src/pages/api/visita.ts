/**
 * POST /api/visita
 *
 * Métricas de visitas (plataforma, sprint 9a). El script del navegador (`scriptVisitas()`, en el layout)
 * manda aquí con `sendBeacon`, del MISMO origen; este servidor reenvía a la plataforma
 * (`POST /v1/visitas`) con la IP, el navegador, el país y la ciudad del visitante como encabezados de
 * confianza, y responde 204 sin esperar: el reenvío va en `waitUntil` y nunca demora ni rompe la página.
 * Sin cookies, sin almacenamiento y sin guardar IP ni user-agent (la plataforma los descarta tras calcular
 * el visitante del día).
 */
import type { APIRoute } from 'astro';
import { plataforma } from '../../lib/plataforma/cliente';

export const prerender = false;

const MAX_BYTES = 2048;
const SIN_CONTENIDO = { status: 204, headers: { 'Cache-Control': 'no-store' } } as const;
const texto = (valor: unknown, max: number) => (typeof valor === 'string' ? valor.slice(0, max) : undefined);

export const POST: APIRoute = async ({ request, url, locals }) => {
  // Solo se acepta desde el propio sitio.
  if (request.headers.get('Origin') !== url.origin) return new Response(null, { status: 403 });

  const declarado = Number(request.headers.get('content-length') ?? 0);
  if (declarado > MAX_BYTES) return new Response(null, { status: 413 });
  let cuerpo: Record<string, unknown>;
  try {
    const crudo = await request.text();
    if (crudo.length > MAX_BYTES) return new Response(null, { status: 413 });
    const json: unknown = JSON.parse(crudo);
    if (typeof json !== 'object' || json === null || Array.isArray(json)) throw new Error('forma');
    cuerpo = json as Record<string, unknown>;
  } catch {
    return new Response(null, { status: 400 });
  }

  const utm = typeof cuerpo.utm === 'object' && cuerpo.utm !== null ? (cuerpo.utm as Record<string, unknown>) : {};
  const ancho = Number(cuerpo.anchoPantalla);
  const cf = (request as Request & { cf?: { country?: string; city?: string } }).cf;

  let enviar: Promise<unknown>;
  try {
    enviar = plataforma()
      .registrarVisita(
        {
          pagina: texto(cuerpo.pagina, 300) ?? '/',
          referente: texto(cuerpo.referente, 300),
          utm: { source: texto(utm.source, 80), medium: texto(utm.medium, 80), campaign: texto(utm.campaign, 80) },
          anchoPantalla: Number.isFinite(ancho) ? Math.trunc(ancho) : undefined,
          // El dominio lo pone el servidor (no el navegador): es el que sirvió esta página.
          sitio: url.hostname,
        },
        {
          ip: request.headers.get('cf-connecting-ip') ?? undefined,
          ua: request.headers.get('user-agent') ?? undefined,
          country: cf?.country,
          city: cf?.city,
        },
      )
      .catch((e: unknown) => console.error('No se pudo registrar la visita en la plataforma', e));
  } catch (e) {
    // Sin llave configurada (p. ej. en local): las métricas simplemente no se registran.
    console.error('Visitas desactivadas', e);
    return new Response(null, SIN_CONTENIDO);
  }

  // No se espera: el visitante recibe el 204 de inmediato.
  const contexto = (locals as { cfContext?: { waitUntil(promesa: Promise<unknown>): void } }).cfContext;
  if (contexto) contexto.waitUntil(enviar);
  else await enviar;

  return new Response(null, SIN_CONTENIDO);
};

export const ALL: APIRoute = () => new Response(null, { status: 405, headers: { Allow: 'POST' } });
