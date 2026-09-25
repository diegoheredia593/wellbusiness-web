/**
 * PUT  /api/paginas/:pagina  { cambios: { key: valor } }  → guarda textos de la página
 * POST /api/paginas/:pagina  { accion: 'aprobar' | 'descartar' } → cambios en revisión (admin)
 */
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { adminDe, error, esRespuesta, json, leerJson, usuarioDe } from '@/lib/servidor/api';
import { guardarBloques, resolverRevisionPagina } from '@/lib/servidor/bloques';

export const PUT: APIRoute = async (ctx) => {
  const usuario = usuarioDe(ctx);
  if (esRespuesta(usuario)) return usuario;
  const leido = await leerJson(ctx.request, z.object({ cambios: z.record(z.string(), z.unknown()) }));
  if (!leido.ok) return leido.respuesta;
  const r = await guardarBloques(usuario, ctx.params.pagina ?? '', leido.datos.cambios);
  if (!r.ok) return error(r.error, r.status, r.campos);
  return json({ ok: true, guardados: r.guardados, modo: r.modo });
};

export const POST: APIRoute = async (ctx) => {
  const usuario = adminDe(ctx);
  if (esRespuesta(usuario)) return usuario;
  const leido = await leerJson(ctx.request, z.object({ accion: z.enum(['aprobar', 'descartar']) }));
  if (!leido.ok) return leido.respuesta;
  await resolverRevisionPagina(usuario, ctx.params.pagina ?? '', leido.datos.accion === 'aprobar');
  return json({ ok: true });
};
