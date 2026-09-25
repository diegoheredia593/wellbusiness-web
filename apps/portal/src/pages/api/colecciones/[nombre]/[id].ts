/**
 * PUT    /api/colecciones/:nombre/:id { datos, estado } → guarda cambios
 * POST   /api/colecciones/:nombre/:id { accion }        → estado o revisión
 *          accion: publicar | borrador | archivar | aprobar | descartar
 * DELETE /api/colecciones/:nombre/:id                   → a la papelera
 */
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { estadosItem } from '@cms/core/schema';
import { error, esRespuesta, json, leerJson, usuarioDe } from '@/lib/servidor/api';
import { actualizar, cambiarEstado, definicion, eliminar, resolverRevision } from '@/lib/servidor/items';

export const PUT: APIRoute = async (ctx) => {
  const usuario = usuarioDe(ctx);
  if (esRespuesta(usuario)) return usuario;
  const nombre = ctx.params.nombre ?? '';
  if (!definicion(nombre)) return error('Esta sección no existe.', 404);
  const leido = await leerJson(ctx.request, z.object({ datos: z.record(z.string(), z.unknown()), estado: z.enum(estadosItem) }));
  if (!leido.ok) return leido.respuesta;
  const r = await actualizar(usuario, nombre, ctx.params.id ?? '', leido.datos.datos, leido.datos.estado);
  return r.ok ? json(r) : error(r.error, r.status, r.campos);
};

export const POST: APIRoute = async (ctx) => {
  const usuario = usuarioDe(ctx);
  if (esRespuesta(usuario)) return usuario;
  const nombre = ctx.params.nombre ?? '';
  const id = ctx.params.id ?? '';
  if (!definicion(nombre)) return error('Esta sección no existe.', 404);
  const leido = await leerJson(
    ctx.request,
    z.object({ accion: z.enum(['publicar', 'borrador', 'archivar', 'aprobar', 'descartar']) }),
  );
  if (!leido.ok) return leido.respuesta;
  const { accion } = leido.datos;
  if (accion === 'aprobar' || accion === 'descartar') {
    if (usuario.rol !== 'admin') return error('Solo un administrador puede aprobar cambios.', 403);
    const r = await resolverRevision(usuario, nombre, id, accion === 'aprobar');
    return r.ok ? json(r) : error(r.error, r.status, r.campos);
  }
  const estado = accion === 'publicar' ? 'publicado' : accion === 'archivar' ? 'archivado' : 'borrador';
  const r = await cambiarEstado(usuario, nombre, id, estado);
  return r.ok ? json(r) : error(r.error, r.status, r.campos);
};

export const DELETE: APIRoute = async (ctx) => {
  const usuario = usuarioDe(ctx);
  if (esRespuesta(usuario)) return usuario;
  const r = await eliminar(usuario, ctx.params.nombre ?? '', ctx.params.id ?? '');
  return r.ok ? json(r) : error(r.error, r.status);
};
