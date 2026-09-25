/**
 * Almacenamiento de medios intercambiable. El portal solo conoce
 * `AlmacenMedios`; cada cliente elige en su configuración si sus fotos van
 * a Workers KV o a R2, y el binding se llama igual en los dos casos.
 *
 * Las claves son inmutables: cada subida genera una clave nueva y nunca se
 * sobrescribe una foto, así que el contenido se puede guardar en caché para
 * siempre.
 */

export type TipoAlmacen = 'kv' | 'r2';

export interface DatosMedio {
  /** Tipo de contenido, p. ej. "image/webp". */
  tipo: string;
  ancho: number;
  alto: number;
}

export interface MedioGuardado extends DatosMedio {
  cuerpo: ReadableStream | null;
  /** ETag entre comillas, listo para la cabecera. */
  etag: string;
  /** true si el navegador ya tiene esta versión (responder 304). */
  sinCambios: boolean;
}

export interface AlmacenMedios {
  readonly tipo: TipoAlmacen;
  guardar(clave: string, bytes: Uint8Array, datos: DatosMedio): Promise<void>;
  /** `si-no-coincide`: valor de la cabecera If-None-Match del navegador. */
  obtener(clave: string, siNoCoincide?: string | null): Promise<MedioGuardado | null>;
  eliminar(clave: string): Promise<void>;
}

/** Se lanza cuando el proveedor rechaza la operación por un límite de uso. */
export class LimiteAlmacen extends Error {
  constructor(public readonly operacion: 'guardar' | 'eliminar', causa?: unknown) {
    super(`Límite de almacenamiento alcanzado al ${operacion}`, { cause: causa });
  }
}

// ── Tipos mínimos de los bindings (sin depender de los tipos de Workers) ──

interface KVMinimo {
  put(clave: string, valor: ArrayBufferView, opciones?: { metadata?: unknown }): Promise<void>;
  getWithMetadata<M>(
    clave: string,
    opciones: { type: 'stream'; cacheTtl?: number },
  ): Promise<{ value: ReadableStream | null; metadata: M | null }>;
  delete(clave: string): Promise<void>;
}

interface R2Minimo {
  put(clave: string, valor: ArrayBufferView, opciones?: unknown): Promise<unknown>;
  get(clave: string, opciones?: unknown): Promise<unknown>;
  delete(clave: string): Promise<void>;
}

/** Los mensajes de KV al pasar la cuota diaria dicen "limit exceeded". */
function esLimite(e: unknown) {
  return /limit/i.test(e instanceof Error ? e.message : String(e));
}

/** Coincidencia de If-None-Match (acepta lista, W/ y "*"). */
function coincideEtag(cabecera: string | null | undefined, etag: string) {
  if (!cabecera) return false;
  if (cabecera.trim() === '*') return true;
  return cabecera.split(',').some((v) => v.trim().replace(/^W\//, '') === etag);
}

// ── Workers KV ──

interface MetadatosKV {
  t: string;
  w: number;
  h: number;
}

/**
 * KV guarda el tipo y las medidas en los metadatos de la clave (hasta 1 KB),
 * para servir cada foto con su Content-Type sin consultar la base.
 * Como la clave incluye un id único, sirve de ETag.
 */
export function crearAlmacenKV(kv: KVMinimo): AlmacenMedios {
  const etagDe = (clave: string) => `"${clave.replace(/^.*\//, '').replace(/\.\w+$/, '')}"`;
  return {
    tipo: 'kv',
    async guardar(clave, bytes, datos) {
      const metadata: MetadatosKV = { t: datos.tipo, w: datos.ancho, h: datos.alto };
      try {
        await kv.put(clave, bytes, { metadata });
      } catch (e) {
        if (esLimite(e)) throw new LimiteAlmacen('guardar', e);
        throw e;
      }
    },
    async obtener(clave, siNoCoincide) {
      const etag = etagDe(clave);
      // cacheTtl largo: la clave nunca cambia de contenido.
      const r = await kv.getWithMetadata<MetadatosKV>(clave, { type: 'stream', cacheTtl: 86400 });
      if (!r.value) return null;
      const sinCambios = coincideEtag(siNoCoincide, etag);
      if (sinCambios) await r.value.cancel();
      return {
        cuerpo: sinCambios ? null : r.value,
        tipo: r.metadata?.t ?? 'application/octet-stream',
        ancho: r.metadata?.w ?? 0,
        alto: r.metadata?.h ?? 0,
        etag,
        sinCambios,
      };
    },
    async eliminar(clave) {
      try {
        await kv.delete(clave);
      } catch (e) {
        if (esLimite(e)) throw new LimiteAlmacen('eliminar', e);
        throw e;
      }
    },
  };
}

// ── R2 ──

interface ObjetoR2 {
  httpEtag: string;
  httpMetadata?: { contentType?: string };
  customMetadata?: Record<string, string>;
  body?: ReadableStream;
}

/** R2 (bucket privado). Mismo comportamiento que en la fase 2. */
export function crearAlmacenR2(r2: R2Minimo): AlmacenMedios {
  return {
    tipo: 'r2',
    async guardar(clave, bytes, datos) {
      await r2.put(clave, bytes, {
        httpMetadata: { contentType: datos.tipo, cacheControl: 'public, max-age=31536000, immutable' },
        customMetadata: { ancho: String(datos.ancho), alto: String(datos.alto) },
      });
    },
    async obtener(clave, siNoCoincide) {
      // Igual que antes: R2 evalúa If-None-Match y omite el cuerpo si coincide.
      const cond = siNoCoincide ? { onlyIf: new Headers({ 'if-none-match': siNoCoincide }) } : undefined;
      const o = (await r2.get(clave, cond)) as ObjetoR2 | null;
      if (!o) return null;
      const sinCambios = !o.body;
      return {
        cuerpo: o.body ?? null,
        tipo: o.httpMetadata?.contentType ?? 'application/octet-stream',
        ancho: Number(o.customMetadata?.ancho ?? 0),
        alto: Number(o.customMetadata?.alto ?? 0),
        etag: o.httpEtag,
        sinCambios,
      };
    },
    async eliminar(clave) {
      await r2.delete(clave);
    },
  };
}

/** Elige la implementación según la configuración del cliente. */
export function crearAlmacen(tipo: TipoAlmacen, binding: unknown): AlmacenMedios {
  if (!binding) throw new Error('Falta el binding MEDIOS en la configuración de Cloudflare.');
  return tipo === 'kv' ? crearAlmacenKV(binding as KVMinimo) : crearAlmacenR2(binding as R2Minimo);
}
