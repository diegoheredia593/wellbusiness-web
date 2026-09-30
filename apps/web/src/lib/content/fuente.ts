/**
 * Fuente de contenido del sitio (Sprint 4e) — lee de la plataforma, ya no de D1.
 *
 * Cada página dinámica pide bloques y colecciones; para no repetir consultas, lo leído se guarda
 * en memoria **por versión de contenido**: `GET /v1/version` (barata) dice si algo cambió desde
 * la última lectura y, si cambió, se descarta todo y se vuelve a leer. La versión se consulta
 * como mucho cada `TTL_VERSION_MS`; entre consultas se sirve lo que hay en memoria. Si la
 * plataforma no responde y ya hay algo en memoria, se sirve eso (obsoleto pero funcional) antes
 * que romper la página.
 *
 * Solo se guardan datos ya resueltos (nunca promesas ni respuestas pendientes): en Workers, una
 * promesa de I/O creada por una petición no puede esperarse desde otra.
 *
 * `env` de `cloudflare:workers` solo existe en tiempo de request — ninguna página estática
 * (`prerender = true`) debe importar este módulo.
 */
import { plataforma } from '../plataforma/cliente';
import type { Bloque } from '../plataforma/sdk';

/** Cada cuánto, como mucho, se pregunta a la plataforma si el contenido cambió. */
const TTL_VERSION_MS = 15_000;
const POR_PAGINA = 100;

interface Instantanea {
  version: number;
  verificadaEn: number;
  bloques?: Record<string, Bloque>;
  colecciones: Map<string, Record<string, unknown>[]>;
}

let memoria: Instantanea | undefined;

async function vigente(): Promise<Instantanea> {
  const ahora = Date.now();
  if (memoria && ahora - memoria.verificadaEn < TTL_VERSION_MS) return memoria;
  try {
    const version = await plataforma().version();
    if (memoria && memoria.version === version) {
      memoria.verificadaEn = ahora;
    } else {
      memoria = { version, verificadaEn: ahora, colecciones: new Map() };
    }
  } catch (e) {
    if (!memoria) throw e;
    console.error('No se pudo consultar la versión de contenido; se sirve lo guardado.', e);
  }
  return memoria!;
}

/** Todos los bloques de texto (98) en una sola petición. */
export async function leerBloques(): Promise<Record<string, Bloque>> {
  const m = await vigente();
  m.bloques ??= await plataforma().bloques();
  return m.bloques;
}

/** Todos los ítems públicos de una colección, recorriendo todas las páginas. */
export async function leerColeccion(nombre: string): Promise<Record<string, unknown>[]> {
  const m = await vigente();
  const guardada = m.colecciones.get(nombre);
  if (guardada) return guardada;

  const items: Record<string, unknown>[] = [];
  for (let pagina = 1; ; pagina++) {
    const r = await plataforma().coleccion(nombre, { pagina, porPagina: POR_PAGINA });
    items.push(...r.elementos);
    if (r.paginaActual >= r.totalPaginas) break;
  }
  m.colecciones.set(nombre, items);
  return items;
}
