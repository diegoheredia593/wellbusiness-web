/**
 * En cada petición:
 * 1. Deja la base lista (migraciones y definiciones; solo la primera vez por instancia).
 * 2. Protección CSRF: toda petición que cambia datos debe venir del propio portal.
 * 3. Carga la sesión y protege las rutas privadas.
 * 4. Agrega encabezados de seguridad.
 */
import { defineMiddleware } from 'astro:middleware';
import { env } from 'cloudflare:workers';
import { prepararBase } from './lib/servidor/db';
import { auth } from './lib/servidor/auth';
import type { Rol } from './lib/servidor/tipos';

const RUTAS_PUBLICAS = [
  /^\/entrar$/,
  /^\/configuracion-inicial$/,
  /^\/invitacion\/[^/]+$/,
  /^\/restablecer\/[^/]+$/,
  /^\/api\/auth\//,
  /^\/api\/publico\//,
  /^\/medios\//,
];

const SEGURIDAD: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy':
    "default-src 'self'; img-src 'self' data: blob: https://i.ytimg.com; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
};

function paginaFaltaConfiguracion() {
  return new Response(
    `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Falta configurar el portal</title>
<body style="font-family:system-ui,sans-serif;max-width:40rem;margin:3rem auto;padding:0 1rem;line-height:1.6;color:#111">
<h1>Falta configurar el portal</h1>
<p>El portal necesita el secreto <code>BETTER_AUTH_SECRET</code> (al menos 32 caracteres).</p>
<p>En el panel de Cloudflare: <strong>Workers &amp; Pages → este Worker → Settings → Variables and Secrets → Add</strong>, tipo <em>Secret</em>. Después vuelve a cargar esta página.</p>
</body></html>`,
    { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' } },
  );
}

export const onRequest = defineMiddleware(async (ctx, next) => {
  const url = new URL(ctx.request.url);
  const ruta = url.pathname;
  const metodo = ctx.request.method;

  if (!env.BETTER_AUTH_SECRET || env.BETTER_AUTH_SECRET.length < 32) return paginaFaltaConfiguracion();

  await prepararBase();

  if (!['GET', 'HEAD', 'OPTIONS'].includes(metodo)) {
    const origen = ctx.request.headers.get('origin');
    if (origen !== url.origin) {
      return Response.json({ ok: false, error: 'Solicitud no permitida.' }, { status: 403 });
    }
  }

  ctx.locals.usuario = null;
  if (!ruta.startsWith('/api/auth/') && !ruta.startsWith('/medios/')) {
    const sesion = await auth(url.origin).api.getSession({ headers: ctx.request.headers });
    const u = sesion?.user as
      | { id: string; name: string; email: string; role?: string | null; banned?: boolean | null }
      | undefined;
    if (sesion && u && !u.banned && (u.role === 'admin' || u.role === 'editor')) {
      ctx.locals.usuario = { id: u.id, nombre: u.name, email: u.email, rol: u.role as Rol };
    }
  }

  const publica = RUTAS_PUBLICAS.some((r) => r.test(ruta));
  if (!publica && !ctx.locals.usuario) {
    if (ruta.startsWith('/api/')) {
      return Response.json({ ok: false, error: 'Tu sesión terminó. Vuelve a entrar.' }, { status: 401 });
    }
    const volver = ruta === '/' ? '' : `?volver=${encodeURIComponent(ruta + url.search)}`;
    return ctx.redirect(`/entrar${volver}`);
  }

  const respuesta = await next();
  for (const [k, v] of Object.entries(SEGURIDAD)) {
    if (!respuesta.headers.has(k)) respuesta.headers.set(k, v);
  }
  if (!ruta.startsWith('/medios/') && !respuesta.headers.has('Cache-Control')) {
    respuesta.headers.set('Cache-Control', 'no-store');
  }
  return respuesta;
});
