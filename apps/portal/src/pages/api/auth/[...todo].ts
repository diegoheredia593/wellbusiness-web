/** Rutas de Better Auth (entrar, salir, sesión, cambiar contraseña). */
import type { APIRoute } from 'astro';
import { auth, RUTAS_AUTH_PERMITIDAS } from '@/lib/servidor/auth';

export const ALL: APIRoute = async ({ request }) => {
  const url = new URL(request.url);
  const subruta = url.pathname.replace(/^\/api\/auth/, '');
  if (!RUTAS_AUTH_PERMITIDAS.includes(subruta)) {
    return Response.json({ ok: false }, { status: 404 });
  }
  return auth(url.origin).handler(request);
};
