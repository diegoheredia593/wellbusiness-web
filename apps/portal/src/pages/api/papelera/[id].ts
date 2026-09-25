/**
 * POST   /api/papelera/:id → recuperar (vuelve como borrador)
 * DELETE /api/papelera/:id → borrar definitivamente (solo admin)
 */
import type { APIRoute } from 'astro';
import { error, esRespuesta, json, usuarioDe } from '@/lib/servidor/api';
import { borrarDefinitivo, recuperar } from '@/lib/servidor/items';

export const POST: APIRoute = async (ctx) => {
  const usuario = usuarioDe(ctx);
  if (esRespuesta(usuario)) return usuario;
  const r = await recuperar(usuario, ctx.params.id ?? '');
  return r.ok ? json(r) : error(r.error, r.status, r.campos);
};

export const DELETE: APIRoute = async (ctx) => {
  const usuario = usuarioDe(ctx);
  if (esRespuesta(usuario)) return usuario;
  const r = await borrarDefinitivo(usuario, ctx.params.id ?? '');
  return r.ok ? json(r) : error(r.error, r.status);
};
