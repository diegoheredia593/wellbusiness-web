/** Usa un enlace de restablecimiento: guarda la contraseña nueva y cierra las sesiones. */
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { error, json, leerJson } from '@/lib/servidor/api';
import { problemaContrasena } from '@/lib/servidor/contrasenas';
import { comprobarEnlace, marcarUsado } from '@/lib/servidor/enlaces';
import { ipDe, limitar } from '@/lib/servidor/limites';
import { buscarPorEmail, cambiarContrasena } from '@/lib/servidor/usuarios';
import { registrar } from '@/lib/servidor/auditoria';

const esquema = z.object({ token: z.string(), contrasena: z.string() });

const MOTIVOS = {
  'no-existe': 'Este enlace no es válido.',
  usado: 'Este enlace ya se usó.',
  vencido: 'Este enlace venció. Pide uno nuevo.',
};

export const POST: APIRoute = async ({ request }) => {
  if (!(await limitar(`enlace:${ipDe(request)}`, 20, 15 * 60))) {
    return error('Demasiados intentos. Espera unos minutos.', 429);
  }
  const leido = await leerJson(request, esquema);
  if (!leido.ok) return leido.respuesta;
  const { token, contrasena } = leido.datos;

  const estado = await comprobarEnlace('restablecer', token);
  if (!estado.valido) return error(MOTIVOS[estado.motivo], 410);
  const problema = problemaContrasena(contrasena);
  if (problema) return error(problema, 422, { contrasena: problema });

  const usuario = await buscarPorEmail(estado.enlace.email);
  if (!usuario || usuario.banned) return error('Esta cuenta no está activa. Habla con el administrador.', 403);
  if (!(await marcarUsado(estado.enlace.id))) return error(MOTIVOS.usado, 410);

  await cambiarContrasena(usuario.id, contrasena);
  await registrar(
    { id: usuario.id, nombre: usuario.name },
    { accion: 'restablecer', objetoTipo: 'usuario', objetoId: usuario.id, objetoNombre: usuario.name },
  );
  return json({ ok: true });
};
