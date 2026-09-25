/**
 * Enlaces de YouTube: se acepta lo que la gente copia (del navegador, del
 * botón Compartir o de un Short) y se guarda solo el id de 11 caracteres.
 */

const PATRON_ID = /^[A-Za-z0-9_-]{11}$/;

const DOMINIOS = new Set([
  'youtube.com',
  'www.youtube.com',
  'm.youtube.com',
  'music.youtube.com',
  'youtube-nocookie.com',
  'www.youtube-nocookie.com',
  'youtu.be',
  'www.youtu.be',
]);

/** Devuelve el id del video, o null si el texto no es un enlace válido de YouTube. */
export function extraerIdYoutube(texto: string): string | null {
  const limpio = texto.trim();
  if (!limpio) return null;
  if (PATRON_ID.test(limpio)) return limpio;

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(limpio) ? limpio : `https://${limpio}`);
  } catch {
    return null;
  }
  const host = url.hostname.toLowerCase();
  if (!DOMINIOS.has(host)) return null;

  const partes = url.pathname.split('/').filter(Boolean);
  let id: string | null | undefined;
  if (host.endsWith('youtu.be')) id = partes[0];
  else if (partes[0] === 'watch') id = url.searchParams.get('v');
  else if (['shorts', 'embed', 'live', 'v', 'e'].includes(partes[0] ?? '')) id = partes[1];
  else if (partes.length === 0) id = url.searchParams.get('v');

  return id && PATRON_ID.test(id) ? id : null;
}

/** Miniatura pública (480×360; existe para todos los videos). */
export function miniaturaYoutube(id: string) {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/** Enlace para ver el video en YouTube. */
export function enlaceYoutube(id: string) {
  return `https://www.youtube.com/watch?v=${id}`;
}

/** Reproductor sin cookies de seguimiento, que empieza al cargarse. */
export function embebidoYoutube(id: string) {
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
}
