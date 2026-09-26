/**
 * Ayudantes para las rutas /api del sitio. Mismo patrón que
 * `apps/portal/src/lib/servidor/api.ts` — no se comparte como un solo
 * archivo porque el sitio no tiene sesión/usuario (nada de `usuarioDe`/`adminDe`
 * aquí), pero conviene que la forma de las respuestas sea idéntica.
 */
import type { z } from 'zod';

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
