/**
 * POST   /api/envios/:id { leido } → marcar como leído / no leído
 * DELETE /api/envios/:id           → borrar (solo admin)
 */
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { adminDe, error, esRespuesta, json, leerJson, usuarioDe } from '@/lib/servidor/api';
import { borrarEnvio, marcarLeido } from '@/lib/servidor/envios';
import { registrar } from '@/lib/servidor/auditoria';

export const POST: APIRoute = async (ctx) => {
  const usuario = usuarioDe(ctx);
  if (esRespuesta(usuario)) return usuario;
  const leido = await leerJson(ctx.request, z.object({ leido: z.boolean() }));
  if (!leido.ok) return leido.respuesta;
  const tipo = await marcarLeido(ctx.params.id ?? '', leido.datos.leido);
  if (!tipo) return error('Ese envío ya no existe.', 404);
  if (leido.datos.leido) await registrar(usuario, { accion: 'leer_envio', objetoTipo: 'envio', objetoId: ctx.params.id, contexto: tipo });
  return json({ ok: true });
};

export const DELETE: APIRoute = async (ctx) => {
  const usuario = adminDe(ctx);
  if (esRespuesta(usuario)) return usuario;
  const tipo = await borrarEnvio(ctx.params.id ?? '');
  if (!tipo) return error('Ese envío ya no existe.', 404);
  await registrar(usuario, { accion: 'borrar_envio', objetoTipo: 'envio', objetoId: ctx.params.id, contexto: tipo });
  return json({ ok: true });
};
