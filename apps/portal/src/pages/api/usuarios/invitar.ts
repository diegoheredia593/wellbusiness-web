/** POST /api/usuarios/invitar { email, nombre, rol } → enlace de invitación (solo admin). */
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { adminDe, error, esRespuesta, json, leerJson } from '@/lib/servidor/api';
import { crearEnlace } from '@/lib/servidor/enlaces';
import { buscarPorEmail, normalizarEmail, PATRON_EMAIL } from '@/lib/servidor/usuarios';
import { registrar } from '@/lib/servidor/auditoria';

export const POST: APIRoute = async (ctx) => {
  const admin = adminDe(ctx);
  if (esRespuesta(admin)) return admin;
  const leido = await leerJson(
    ctx.request,
    z.object({
      email: z.string().trim().regex(PATRON_EMAIL, 'Escribe un correo válido.'),
      nombre: z.string().trim().max(80, 'Máximo 80 caracteres.').optional().default(''),
      rol: z.enum(['admin', 'editor']),
    }),
  );
  if (!leido.ok) return leido.respuesta;
  const email = normalizarEmail(leido.datos.email);
  if (await buscarPorEmail(email)) {
    return error('Ya hay un usuario con ese correo.', 409, { email: 'Ya tiene cuenta.' });
  }
  const enlace = await crearEnlace(ctx.url.origin, {
    tipo: 'invitacion',
    email,
    nombre: leido.datos.nombre || null,
    rol: leido.datos.rol,
    creadoPor: admin.id,
  });
  await registrar(admin, {
    accion: 'invitar',
    objetoTipo: 'usuario',
    objetoNombre: leido.datos.nombre || email,
    resumen: leido.datos.rol === 'admin' ? 'como administrador' : 'como editor',
  });
  return json({ ok: true, enlace });
};
