/** Acepta una invitación: crea el usuario con la contraseña elegida. */
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { error, json, leerJson } from '@/lib/servidor/api';
import { problemaContrasena } from '@/lib/servidor/contrasenas';
import { comprobarEnlace, marcarUsado } from '@/lib/servidor/enlaces';
import { ipDe, limitar } from '@/lib/servidor/limites';
import { buscarPorEmail, crearUsuario, esRol } from '@/lib/servidor/usuarios';
import { registrar } from '@/lib/servidor/auditoria';

const esquema = z.object({
  token: z.string(),
  nombre: z.string().trim().min(2, 'Escribe tu nombre.').max(80, 'Máximo 80 caracteres.'),
  contrasena: z.string(),
});

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
  const { token, nombre, contrasena } = leido.datos;

  const estado = await comprobarEnlace('invitacion', token);
  if (!estado.valido) return error(MOTIVOS[estado.motivo], 410);
  const problema = problemaContrasena(contrasena);
  if (problema) return error(problema, 422, { contrasena: problema });
  if (await buscarPorEmail(estado.enlace.email)) {
    return error('Ya existe una cuenta con este correo. Entra con tu contraseña.', 409);
  }
  if (!(await marcarUsado(estado.enlace.id))) return error(MOTIVOS.usado, 410);

  const rol = esRol(estado.enlace.rol) ? estado.enlace.rol : 'editor';
  const id = await crearUsuario({ nombre, email: estado.enlace.email, contrasena, rol });
  await registrar({ id, nombre }, { accion: 'unirse', objetoTipo: 'usuario', objetoId: id, objetoNombre: nombre });
  return json({ ok: true });
};
