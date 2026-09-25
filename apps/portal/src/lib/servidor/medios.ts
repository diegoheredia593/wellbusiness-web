/**
 * Fotos en el almacén del cliente (KV o R2; el Worker las sirve en /medios/<clave>).
 * El navegador ya las reduce y convierte; aquí se vuelve a comprobar tipo,
 * peso y medidas leyendo el propio archivo, sin confiar en lo que dice el cliente.
 */
import { env } from 'cloudflare:workers';
import { LimiteAlmacen } from '@cms/core/almacen';
import { almacenMedios } from './almacen';
import { desc, eq, like, lt, or, and, sql, type SQL } from 'drizzle-orm';
import cliente from '@cliente';
import { db, esquema } from './db';

const { medios } = esquema;

/** Tras reducir a 2000 px y convertir a WebP, una foto normal pesa 200–500 KB. */
export const PESO_MAXIMO = 2 * 1024 * 1024;

export const MENSAJE_LIMITE_SUBIDAS = 'Hoy ya se subieron muchas fotos; intenta de nuevo mañana.';
export const MENSAJE_LIMITE_BORRADOS = 'Hoy ya se borraron muchas fotos; intenta de nuevo mañana.';
export const LADO_MAXIMO = 4000;

export type TipoFoto = 'image/webp' | 'image/jpeg' | 'image/png';

/** Tipo y medidas leyendo la cabecera del archivo (WebP, JPEG, PNG). */
export function inspeccionar(bytes: Uint8Array): { tipo: TipoFoto; ancho: number; alto: number } | null {
  const dv = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const ascii = (i: number, n: number) => String.fromCharCode(...bytes.subarray(i, i + n));
  // WebP: RIFF....WEBP
  if (bytes.length > 30 && ascii(0, 4) === 'RIFF' && ascii(8, 4) === 'WEBP') {
    const fmt = ascii(12, 4);
    if (fmt === 'VP8X') return { tipo: 'image/webp', ancho: 1 + (dv.getUint32(24, true) & 0xffffff), alto: 1 + (dv.getUint32(27, true) & 0xffffff) };
    if (fmt === 'VP8 ') return { tipo: 'image/webp', ancho: dv.getUint16(26, true) & 0x3fff, alto: dv.getUint16(28, true) & 0x3fff };
    if (fmt === 'VP8L') {
      const b = dv.getUint32(21, true);
      return { tipo: 'image/webp', ancho: 1 + (b & 0x3fff), alto: 1 + ((b >> 14) & 0x3fff) };
    }
    return null;
  }
  // PNG
  if (bytes.length > 24 && bytes[0] === 0x89 && ascii(1, 3) === 'PNG') {
    return { tipo: 'image/png', ancho: dv.getUint32(16), alto: dv.getUint32(20) };
  }
  // JPEG: buscar el marcador SOF
  if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    let i = 2;
    while (i + 9 < bytes.length) {
      if (bytes[i] !== 0xff) return null;
      const marcador = bytes[i + 1]!;
      const largo = dv.getUint16(i + 2);
      if (marcador >= 0xc0 && marcador <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marcador)) {
        return { tipo: 'image/jpeg', alto: dv.getUint16(i + 5), ancho: dv.getUint16(i + 7) };
      }
      i += 2 + largo;
    }
  }
  return null;
}

const EXTENSION: Record<TipoFoto, string> = { 'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png' };

export function urlDe(clave: string) {
  return `/medios/${clave}`;
}

export function aPublico(m: typeof medios.$inferSelect) {
  return {
    id: m.id,
    src: urlDe(m.clave),
    alt: m.alt,
    ancho: m.ancho,
    alto: m.alto,
    nombre: m.nombreOriginal,
    peso: m.peso,
    creado: m.creado,
  };
}

export async function guardarFoto(datos: { bytes: Uint8Array; nombre: string; alt: string; usuarioId: string }) {
  const info = inspeccionar(datos.bytes);
  if (!info) throw new ErrorFoto('El archivo no es una foto válida (WebP, JPEG o PNG).');
  if (datos.bytes.byteLength > PESO_MAXIMO) throw new ErrorFoto('La foto pesa más de 2 MB. Prueba con una foto más pequeña.');
  if (info.ancho < 1 || info.alto < 1 || info.ancho > LADO_MAXIMO || info.alto > LADO_MAXIMO) {
    throw new ErrorFoto('Las medidas de la foto no son válidas.');
  }
  const id = crypto.randomUUID();
  const ahora = new Date();
  const clave = `fotos/${ahora.getUTCFullYear()}/${String(ahora.getUTCMonth() + 1).padStart(2, '0')}/${id}.${EXTENSION[info.tipo]}`;
  try {
    await almacenMedios().guardar(clave, datos.bytes, { tipo: info.tipo, ancho: info.ancho, alto: info.alto });
  } catch (e) {
    if (e instanceof LimiteAlmacen) throw new ErrorFoto(MENSAJE_LIMITE_SUBIDAS, 429);
    throw e;
  }
  const fila = {
    id,
    clave,
    nombreOriginal: datos.nombre.slice(0, 200),
    tipo: info.tipo,
    ancho: info.ancho,
    alto: info.alto,
    peso: datos.bytes.byteLength,
    alt: datos.alt,
    subidoPor: datos.usuarioId,
    creado: ahora.toISOString(),
  };
  try {
    await db().insert(medios).values(fila);
  } catch (e) {
    await almacenMedios().eliminar(clave).catch(() => {}); // no dejar archivos huérfanos
    throw e;
  }
  return fila;
}

export class ErrorFoto extends Error {
  constructor(
    mensaje: string,
    public readonly estado = 422,
  ) {
    super(mensaje);
  }
}

const POR_PAGINA = 24;

/**
 * Condición SQL: la foto no aparece en ningún bloque ni ítem (publicado,
 * borrador, archivado o en la papelera). Las referencias se guardan como
 * `"medio":"<id>"` dentro del JSON.
 */
const SIN_USAR = sql`NOT EXISTS (
  SELECT 1 FROM bloques b
  WHERE b.valor LIKE '%"medio":"' || ${medios.id} || '"%' OR b.valor_borrador LIKE '%"medio":"' || ${medios.id} || '"%'
) AND NOT EXISTS (
  SELECT 1 FROM items i
  WHERE i.datos LIKE '%"medio":"' || ${medios.id} || '"%' OR i.datos_borrador LIKE '%"medio":"' || ${medios.id} || '"%'
)`;

/** Biblioteca: más recientes primero, con búsqueda, filtro "sin usar" y paginación por fecha. */
export async function listarFotos(buscar: string, desde?: string, sinUsar = false) {
  const condiciones: SQL[] = [];
  if (buscar.trim()) {
    const t = `%${buscar.trim().replace(/[%_]/g, '')}%`;
    condiciones.push(or(like(medios.alt, t), like(medios.nombreOriginal, t))!);
  }
  if (desde) condiciones.push(lt(medios.creado, desde));
  if (sinUsar) condiciones.push(SIN_USAR);
  const filas = await db()
    .select()
    .from(medios)
    .where(condiciones.length ? and(...condiciones) : undefined)
    .orderBy(desc(medios.creado))
    .limit(POR_PAGINA + 1)
    .all();
  const hay = filas.length > POR_PAGINA;
  const pagina = filas.slice(0, POR_PAGINA);
  return { medios: pagina.map(aPublico), siguiente: hay ? pagina[pagina.length - 1]!.creado : null };
}

/** Espacio que ocupan las fotos, según la tabla `medios`. */
export async function espacioUsado() {
  const fila = await db()
    .select({ bytes: sql<number>`coalesce(sum(${medios.peso}), 0)`, fotos: sql<number>`count(*)`, sinUsar: sql<number>`sum(case when ${SIN_USAR} then 1 else 0 end)` })
    .from(medios)
    .get();
  return {
    usado: fila?.bytes ?? 0,
    fotos: fila?.fotos ?? 0,
    sinUsar: fila?.sinUsar ?? 0,
    limite: cliente.portal.almacenamiento.limiteBytes,
  };
}

/** Dónde se usa una foto (textos de páginas o elementos de colecciones). */
export async function usosDeFoto(id: string) {
  const patron = `%"medio":"${id}"%`;
  const [bloques, items] = await env.DB.batch<{ n: number }>([
    env.DB.prepare('SELECT count(*) AS n FROM bloques WHERE valor LIKE ?1 OR valor_borrador LIKE ?1').bind(patron),
    env.DB.prepare('SELECT count(*) AS n FROM items WHERE datos LIKE ?1 OR datos_borrador LIKE ?1').bind(patron),
  ]);
  return (bloques?.results[0]?.n ?? 0) + (items?.results[0]?.n ?? 0);
}

export async function borrarFoto(id: string) {
  const m = await db().select().from(medios).where(eq(medios.id, id)).get();
  if (!m) return null;
  // Primero el almacén: si hoy se alcanzó el límite de borrados, la foto sigue en la biblioteca.
  try {
    await almacenMedios().eliminar(m.clave);
  } catch (e) {
    if (e instanceof LimiteAlmacen) throw new ErrorFoto(MENSAJE_LIMITE_BORRADOS, 429);
    throw e;
  }
  await db().delete(medios).where(eq(medios.id, id));
  return m;
}
