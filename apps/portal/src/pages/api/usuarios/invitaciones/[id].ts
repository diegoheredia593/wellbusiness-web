/** DELETE /api/usuarios/invitaciones/:id → anula una invitación pendiente (solo admin). */
import type { APIRoute } from 'astro';
import { adminDe, esRespuesta, json } from '@/lib/servidor/api';
import { anularEnlace } from '@/lib/servidor/enlaces';

export const DELETE: APIRoute = async (ctx) => {
  const admin = adminDe(ctx);
  if (esRespuesta(admin)) return admin;
  await anularEnlace(ctx.params.id ?? '');
  return json({ ok: true });
};
