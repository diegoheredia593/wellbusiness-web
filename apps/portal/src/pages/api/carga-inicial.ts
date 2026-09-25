/**
 * POST /api/carga-inicial { accion }
 *   cargar     → carga las colecciones (solo si no hay nada)
 *   reemplazar → borra las colecciones y las vuelve a cargar (confirmación escrita)
 *   ejemplos   → agrega envíos de formulario de ejemplo
 *   sin-ejemplos → borra los envíos de ejemplo
 */
import type { APIRoute } from 'astro';
import { z } from 'zod';
import { adminDe, error, esRespuesta, json, leerJson } from '@/lib/servidor/api';
import { borrarEnviosEjemplo, cargarColecciones, cargarEnviosEjemplo, estadoCarga } from '@/lib/servidor/carga';

export const POST: APIRoute = async (ctx) => {
  const usuario = adminDe(ctx);
  if (esRespuesta(usuario)) return usuario;
  const leido = await leerJson(
    ctx.request,
    z.object({
      accion: z.enum(['cargar', 'reemplazar', 'ejemplos', 'sin-ejemplos']),
      confirmacion: z.string().optional(),
    }),
  );
  if (!leido.ok) return leido.respuesta;
  const { accion, confirmacion } = leido.datos;

  if (accion === 'ejemplos') return json({ ok: true, cargados: await cargarEnviosEjemplo() });
  if (accion === 'sin-ejemplos') {
    await borrarEnviosEjemplo();
    return json({ ok: true });
  }

  const estado = await estadoCarga();
  if (accion === 'cargar' && estado.items > 0) {
    return error('Ya hay contenido cargado. Para empezar de cero usa "Reemplazar todo".', 409);
  }
  if (accion === 'reemplazar' && confirmacion?.trim().toUpperCase() !== 'REEMPLAZAR') {
    return error('Escribe REEMPLAZAR para confirmar.', 422, { confirmacion: 'Escribe REEMPLAZAR.' });
  }
  const r = await cargarColecciones(usuario, accion === 'reemplazar');
  if (!r.ok) return error(`El contenido inicial tiene errores:\n${r.problemas.join('\n')}`, 422);
  return json(r);
};
