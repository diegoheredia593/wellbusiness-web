/**
 * GET  /api/medios?buscar=&desde=&sinUsar=1  → biblioteca de fotos (+ espacio usado en la primera página)
 * POST /api/medios (form-data: archivo, alt) → sube una foto ya procesada en el navegador
 */
import type { APIRoute } from 'astro';
import { error, esRespuesta, json, usuarioDe } from '@/lib/servidor/api';
import { aPublico, ErrorFoto, espacioUsado, guardarFoto, listarFotos, PESO_MAXIMO } from '@/lib/servidor/medios';
import { registrar } from '@/lib/servidor/auditoria';

export const GET: APIRoute = async (ctx) => {
  const usuario = usuarioDe(ctx);
  if (esRespuesta(usuario)) return usuario;
  const u = ctx.url.searchParams;
  const desde = u.get('desde') ?? undefined;
  const [lista, espacio] = await Promise.all([
    listarFotos(u.get('buscar') ?? '', desde, u.get('sinUsar') === '1'),
    desde ? null : espacioUsado(),
  ]);
  return json({ ...lista, espacio });
};

export const POST: APIRoute = async (ctx) => {
  const usuario = usuarioDe(ctx);
  if (esRespuesta(usuario)) return usuario;
  const largo = Number(ctx.request.headers.get('content-length') ?? 0);
  if (largo > PESO_MAXIMO + 64 * 1024) return error('La foto pesa más de 2 MB. Prueba con una foto más pequeña.', 413);

  let datos: FormData;
  try {
    datos = await ctx.request.formData();
  } catch {
    return error('No se pudo leer la foto.');
  }
  const archivo = datos.get('archivo');
  const alt = String(datos.get('alt') ?? '').trim();
  if (!(archivo instanceof File)) return error('Falta la foto.');
  if (alt.length < 5) return error('Escribe el texto alternativo (al menos 5 caracteres).', 422, { alt: 'Obligatorio.' });
  if (alt.length > 250) return error('El texto alternativo puede tener hasta 250 caracteres.', 422, { alt: 'Muy largo.' });

  try {
    const fila = await guardarFoto({
      bytes: new Uint8Array(await archivo.arrayBuffer()),
      nombre: archivo.name || 'foto',
      alt,
      usuarioId: usuario.id,
    });
    await registrar(usuario, { accion: 'subir_foto', objetoTipo: 'medio', objetoId: fila.id, objetoNombre: alt.slice(0, 80) });
    return json({ ok: true, medio: aPublico(fila) }, 201);
  } catch (e) {
    if (e instanceof ErrorFoto) return error(e.message, e.estado);
    throw e;
  }
};
