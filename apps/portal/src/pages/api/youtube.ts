/**
 * GET /api/youtube?id=<id> → título del video y si se puede ver en el sitio.
 * Usa el oEmbed público de YouTube (sin clave): responde el título de los
 * videos públicos y no listados, y un error si el video es privado o no existe.
 */
import type { APIRoute } from 'astro';
import { enlaceYoutube } from '@cms/core/youtube';
import { error, esRespuesta, json, usuarioDe } from '@/lib/servidor/api';

export type EstadoVideo = 'ok' | 'privado' | 'no_existe' | 'desconocido';

export const GET: APIRoute = async (ctx) => {
  const usuario = usuarioDe(ctx);
  if (esRespuesta(usuario)) return usuario;
  const id = ctx.url.searchParams.get('id') ?? '';
  if (!/^[A-Za-z0-9_-]{11}$/.test(id)) return error('Ese no es un id de video de YouTube.');

  const url = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(enlaceYoutube(id))}`;
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(5000) });
    if (r.ok) {
      const d = (await r.json()) as { title?: string };
      return json({ estado: 'ok' satisfies EstadoVideo, titulo: (d.title ?? '').slice(0, 120) });
    }
    if (r.status === 401 || r.status === 403) return json({ estado: 'privado' satisfies EstadoVideo });
    if (r.status === 400 || r.status === 404) return json({ estado: 'no_existe' satisfies EstadoVideo });
    return json({ estado: 'desconocido' satisfies EstadoVideo });
  } catch {
    return json({ estado: 'desconocido' satisfies EstadoVideo });
  }
};
