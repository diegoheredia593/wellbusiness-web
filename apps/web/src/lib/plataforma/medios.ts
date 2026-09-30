/**
 * URLs de las fotos que entrega la plataforma.
 *
 * La plataforma arma cada `src` ABSOLUTO con el host por el que le llegó la petición. Por el
 * service binding ese host es el ficticio `agencia-plataforma` (ver `cliente.ts`), que solo existe
 * dentro de Cloudflare: en el navegador de un visitante no resuelve y la foto sale rota. Por eso
 * todo `src` que venga con ese host se reescribe al origen público de la plataforma. Un `src`
 * con cualquier otro host (local, o el día que la plataforma tenga dominio propio) no se toca.
 */
export const ORIGEN_PUBLICO_PLATAFORMA = 'https://agencia-plataforma.herediadiego963.workers.dev';

const HOST_BINDING = 'agencia-plataforma';

export function urlPublicaDeMedio(src: string): string {
  try {
    const url = new URL(src);
    if (url.hostname !== HOST_BINDING) return src;
    return ORIGEN_PUBLICO_PLATAFORMA + url.pathname + url.search;
  } catch {
    return src;
  }
}
