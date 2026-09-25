/**
 * PATCH /api/usuarios/:id { rol?, activo? }   → cambiar rol o activar/desactivar (solo admin)
 * POST  /api/usuarios/:id                     → enlace para restablecer contraseña (solo admin)
 */
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { adminDe, error, esRespuesta, json, leerJson } from '@/lib/servidor/api';
import { crearEnlace } from '@/lib/servidor/enlaces';
import { adminsActivos, buscarPorId, cambiarActivo, cambiarRol, ROLES } from '@/lib/servidor/usuarios';
import { registrar } from '@/lib/servidor/auditoria';

export const PATCH: APIRoute = async (ctx) => {
  const admin = adminDe(ctx);
  if (esRespuesta(admin)) return admin;
  const leido = await leerJson(ctx.request, z.object({ rol: z.enum(['admin', 'editor']).optional(), activo: z.boolean().optional() }));
  if (!leido.ok) return leido.respuesta;
  const id = ctx.params.id ?? '';
  const usuario = await buscarPorId(id);
  if (!usuario) return error('Ese usuario no existe.', 404);
  const { rol, activo } = leido.datos;
  const eraAdminActivo = usuario.role === 'admin' && !usuario.banned;
  const dejaDeSerAdmin = eraAdminActivo && (rol === 'editor' || activo === false);
  if (dejaDeSerAdmin && (await adminsActivos()) <= 1) {
    return error('Tiene que quedar al menos un administrador activo. Nombra a otro antes.', 409);
  }
  if (id === admin.id && activo === false) return error('No puedes desactivarte a ti mismo.', 409);

  if (rol && rol !== usuario.role) {
    await cambiarRol(id, rol);
    await registrar(admin, { accion: 'cambiar_rol', objetoTipo: 'usuario', objetoId: id, objetoNombre: usuario.name, resumen: `ahora es ${ROLES[rol].toLowerCase()}` });
  }
  if (activo !== undefined && activo === !!usuario.banned) {
    await cambiarActivo(id, activo);
    await registrar(admin, { accion: activo ? 'activar' : 'desactivar', objetoTipo: 'usuario', objetoId: id, objetoNombre: usuario.name });
  }
  return json({ ok: true });
};

export const POST: APIRoute = async (ctx) => {
  const admin = adminDe(ctx);
  if (esRespuesta(admin)) return admin;
  const usuario = await buscarPorId(ctx.params.id ?? '');
  if (!usuario) return error('Ese usuario no existe.', 404);
  if (usuario.banned) return error('El usuario está desactivado. Actívalo primero.', 409);
  const enlace = await crearEnlace(ctx.url.origin, {
    tipo: 'restablecer',
    email: usuario.email,
    nombre: usuario.name,
    usuarioId: usuario.id,
    creadoPor: admin.id,
  });
  await registrar(admin, { accion: 'enlace_restablecer', objetoTipo: 'usuario', objetoId: usuario.id, objetoNombre: usuario.name });
  return json({ ok: true, enlace });
};
