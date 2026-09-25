/** Ayudantes para las rutas /api del portal. */
import type { APIContext } from 'astro';
import type { z } from 'zod';
import type { UsuarioSesion } from './tipos';

export function json(datos: unknown, status = 200) {
  return Response.json(datos, { status, headers: { 'Cache-Control': 'no-store' } });
}

export function error(mensaje: string, status = 400, campos?: Record<string, string>) {
  return json({ ok: false, error: mensaje, ...(campos ? { campos } : {}) }, status);
}

/** Lee y valida el cuerpo JSON. Devuelve los datos o una respuesta de error. */
export async function leerJson<S extends z.ZodType>(
  request: Request,
  schema: S,
): Promise<{ ok: true; datos: z.infer<S> } | { ok: false; respuesta: Response }> {
  let crudo: unknown;
  try {
    crudo = await request.json();
  } catch {
    return { ok: false, respuesta: error('No se pudo leer la información enviada.') };
  }
  const r = schema.safeParse(crudo);
  if (!r.success) {
    const campos: Record<string, string> = {};
    for (const issue of r.error.issues) {
      const clave = issue.path.join('.') || '_';
      campos[clave] ??= issue.message;
    }
    return { ok: false, respuesta: error('Revisa los datos marcados.', 422, campos) };
  }
  return { ok: true, datos: r.data };
}

/** Usuario de la sesión, o una respuesta 401. */
export function usuarioDe(ctx: Pick<APIContext, 'locals'>): UsuarioSesion | Response {
  return ctx.locals.usuario ?? error('Tu sesión terminó. Vuelve a entrar.', 401);
}

/** Solo admins. */
export function adminDe(ctx: Pick<APIContext, 'locals'>): UsuarioSesion | Response {
  const u = ctx.locals.usuario;
  if (!u) return error('Tu sesión terminó. Vuelve a entrar.', 401);
  if (u.rol !== 'admin') return error('Esta acción es solo para administradores.', 403);
  return u;
}

export const esRespuesta = (x: unknown): x is Response => x instanceof Response;
