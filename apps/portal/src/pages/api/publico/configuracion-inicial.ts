/** Crea el primer administrador. Solo funciona mientras no haya ningún admin. */
import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { z } from 'zod';
import { error, json, leerJson } from '@/lib/servidor/api';
import { iguales, problemaContrasena } from '@/lib/servidor/contrasenas';
import { ipDe, limitar } from '@/lib/servidor/limites';
import { buscarPorEmail, crearUsuario, hayAdmin, PATRON_EMAIL } from '@/lib/servidor/usuarios';
import { registrar } from '@/lib/servidor/auditoria';

const esquema = z.object({
  clave: z.string().min(1, 'Escribe la clave de configuración.'),
  nombre: z.string().trim().min(2, 'Escribe tu nombre.').max(80, 'Máximo 80 caracteres.'),
  email: z.string().trim().regex(PATRON_EMAIL, 'Escribe un correo válido.'),
  contrasena: z.string(),
});

async function claveCorrecta(escrita: string, esperada: string) {
  // Se comparan los hashes para no filtrar la longitud ni el contenido por tiempo.
  const h = async (t: string) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(t)));
  return iguales(await h(escrita), await h(esperada));
}

export const POST: APIRoute = async ({ request }) => {
  if (await hayAdmin()) return error('El portal ya tiene administrador.', 404);
  const esperada = env.SETUP_SECRET;
  if (!esperada || esperada.length < 12) return error('Falta configurar la clave SETUP_SECRET en Cloudflare.', 503);
  if (!(await limitar(`setup:${ipDe(request)}`, 5, 15 * 60))) {
    return error('Demasiados intentos. Espera 15 minutos e inténtalo de nuevo.', 429);
  }

  const leido = await leerJson(request, esquema);
  if (!leido.ok) return leido.respuesta;
  const { clave, nombre, email, contrasena } = leido.datos;

  if (!(await claveCorrecta(clave, esperada))) {
    return error('La clave de configuración no es correcta.', 403, { clave: 'La clave no es correcta.' });
  }
  const problema = problemaContrasena(contrasena);
  if (problema) return error(problema, 422, { contrasena: problema });
  if (await buscarPorEmail(email)) return error('Ya existe un usuario con ese correo.', 409, { email: 'Ya existe.' });

  const id = await crearUsuario({ nombre, email, contrasena, rol: 'admin' });
  await registrar({ id, nombre }, { accion: 'configurar', objetoTipo: 'portal' });
  return json({ ok: true });
};
