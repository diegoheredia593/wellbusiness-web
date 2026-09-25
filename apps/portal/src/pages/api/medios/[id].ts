/**
 * PATCH  /api/medios/:id { alt } → cambia el texto alternativo de la biblioteca
 * DELETE /api/medios/:id         → borra la foto si no se usa en ningún lado
 */
import type { APIRoute } from 'astro';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { error, esRespuesta, json, leerJson, usuarioDe } from '@/lib/servidor/api';
import { db, esquema } from '@/lib/servidor/db';
import { borrarFoto, ErrorFoto, urlDe, usosDeFoto } from '@/lib/servidor/medios';
import { cacheDisponible } from '@/lib/servidor/almacen';
import { registrar } from '@/lib/servidor/auditoria';

const { medios } = esquema;

export const PATCH: APIRoute = async (ctx) => {
  const usuario = usuarioDe(ctx);
  if (esRespuesta(usuario)) return usuario;
  const leido = await leerJson(
    ctx.request,
    z.object({ alt: z.string().trim().min(5, 'Al menos 5 caracteres.').max(250, 'Máximo 250 caracteres.') }),
  );
  if (!leido.ok) return leido.respuesta;
  const id = ctx.params.id ?? '';
  const r = await db().update(medios).set({ alt: leido.datos.alt }).where(eq(medios.id, id)).returning({ id: medios.id });
  if (!r.length) return error('La foto no existe.', 404);
  await registrar(usuario, { accion: 'editar_foto', objetoTipo: 'medio', objetoId: id, objetoNombre: leido.datos.alt.slice(0, 80) });
  return json({ ok: true });
};

export const DELETE: APIRoute = async (ctx) => {
  const usuario = usuarioDe(ctx);
  if (esRespuesta(usuario)) return usuario;
  const id = ctx.params.id ?? '';
  const m = await db().select().from(medios).where(eq(medios.id, id)).get();
  if (!m) return error('La foto no existe.', 404);
  if (usuario.rol !== 'admin' && m.subidoPor !== usuario.id) {
    return error('Solo puedes borrar las fotos que subiste tú. Pídeselo a un administrador.', 403);
  }
  const usos = await usosDeFoto(id);
  if (usos > 0) {
    return error(
      `Esta foto se está usando en ${usos} ${usos === 1 ? 'lugar' : 'lugares'}. Quítala de ahí antes de borrarla.`,
      409,
    );
  }
  try {
    await borrarFoto(id);
    // Quitarla también de la caché de esta ubicación (en las demás vence sola).
    await cacheDisponible()?.delete(new URL(urlDe(m.clave), ctx.url)).catch(() => false);
  } catch (e) {
    if (e instanceof ErrorFoto) return error(e.message, e.estado);
    throw e;
  }
  await registrar(usuario, { accion: 'borrar_foto', objetoTipo: 'medio', objetoId: id, objetoNombre: m.alt.slice(0, 80) });
  return json({ ok: true });
};
