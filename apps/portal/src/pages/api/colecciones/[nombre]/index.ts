/**
 * POST /api/colecciones/:nombre { datos, estado } → crea un elemento
 * PUT  /api/colecciones/:nombre { orden: [ids] }  → reordena
 */
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { estadosItem } from '@cms/core/schema';
import { error, esRespuesta, json, leerJson, usuarioDe } from '@/lib/servidor/api';
import { crear, definicion, reordenar } from '@/lib/servidor/items';

export const POST: APIRoute = async (ctx) => {
  const usuario = usuarioDe(ctx);
  if (esRespuesta(usuario)) return usuario;
  const nombre = ctx.params.nombre ?? '';
  if (!definicion(nombre)) return error('Esta sección no existe.', 404);
  const leido = await leerJson(ctx.request, z.object({ datos: z.record(z.string(), z.unknown()), estado: z.enum(estadosItem) }));
  if (!leido.ok) return leido.respuesta;
  const r = await crear(usuario, nombre, leido.datos.datos, leido.datos.estado);
  return r.ok ? json(r, 201) : error(r.error, r.status, r.campos);
};

export const PUT: APIRoute = async (ctx) => {
  const usuario = usuarioDe(ctx);
  if (esRespuesta(usuario)) return usuario;
  const nombre = ctx.params.nombre ?? '';
  if (!definicion(nombre)) return error('Esta sección no existe.', 404);
  const leido = await leerJson(ctx.request, z.object({ orden: z.array(z.string()).max(1000) }));
  if (!leido.ok) return leido.respuesta;
  const r = await reordenar(usuario, nombre, leido.datos.orden);
  return r.ok ? json({ ok: true }) : error(r.error, r.status);
};
